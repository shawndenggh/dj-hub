/**
 * Unit tests for deezer.ts
 *
 * The global `fetch` is mocked so no real HTTP calls are made.
 */

import {
  searchTracks,
  getTrack,
  getChart,
  getGenres,
  getArtistTopTracks,
  searchByGenre,
  getRecommendations,
  type DeezerTrack,
} from "./deezer";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeMockTrack(overrides: Partial<DeezerTrack> = {}): DeezerTrack {
  return {
    id: 1,
    title: "Test Track",
    duration: 210,
    preview: "https://cdn.deezer.com/preview/1",
    explicit_lyrics: false,
    bpm: 128,
    artist: { id: 10, name: "Test Artist", picture_medium: "" },
    album: { id: 20, title: "Test Album", cover_medium: "" },
    ...overrides,
  };
}

function mockFetch(body: unknown, ok = true, status = 200) {
  return jest.fn().mockResolvedValue({
    ok,
    status,
    statusText: ok ? "OK" : "Error",
    json: async () => body,
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.resetAllMocks();
});

describe("searchTracks", () => {
  it("calls the correct Deezer search endpoint", async () => {
    const track = makeMockTrack();
    global.fetch = mockFetch({ data: [track], total: 1 });

    const result = await searchTracks("test query");

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain("/search");
    expect(url).toContain(encodeURIComponent("test query"));
    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it("respects limit and index options", async () => {
    global.fetch = mockFetch({ data: [], total: 0 });

    await searchTracks("foo", { limit: 10, index: 20 });

    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain("limit=10");
    expect(url).toContain("index=20");
  });

  it("throws on non-OK response", async () => {
    global.fetch = mockFetch({}, false, 500);

    await expect(searchTracks("error")).rejects.toThrow(/Deezer API error/);
  });
});

describe("getTrack", () => {
  it("fetches track by numeric ID", async () => {
    const track = makeMockTrack({ id: 42 });
    global.fetch = mockFetch(track);

    const result = await getTrack(42);

    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain("/track/42");
    expect(result.id).toBe(42);
  });

  it("fetches track by string ID", async () => {
    const track = makeMockTrack({ id: 99 });
    global.fetch = mockFetch(track);

    const result = await getTrack("99");

    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain("/track/99");
    expect(result.id).toBe(99);
  });
});

describe("getChart", () => {
  it("returns chart data with tracks array", async () => {
    const tracks = [makeMockTrack(), makeMockTrack({ id: 2 })];
    global.fetch = mockFetch({ tracks: { data: tracks } });

    const result = await getChart();

    expect(result.tracks.data).toHaveLength(2);
  });
});

describe("getGenres", () => {
  it("returns genres data array", async () => {
    const genres = [{ id: 1, name: "Pop", picture: "" }];
    global.fetch = mockFetch({ data: genres });

    const result = await getGenres();

    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe("Pop");
  });
});

describe("getArtistTopTracks", () => {
  it("calls artist top tracks endpoint", async () => {
    const tracks = [makeMockTrack()];
    global.fetch = mockFetch({ data: tracks });

    await getArtistTopTracks(123);

    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain("/artist/123/top");
  });
});

describe("searchByGenre", () => {
  it("encodes genre in query", async () => {
    global.fetch = mockFetch({ data: [], total: 0 });

    await searchByGenre("Deep House");

    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain(encodeURIComponent("Deep House"));
  });
});

describe("getRecommendations", () => {
  it("returns tracks filtered by explicit content", async () => {
    const explicit = makeMockTrack({ id: 1, explicit_lyrics: true });
    const clean = makeMockTrack({ id: 2, explicit_lyrics: false });
    global.fetch = mockFetch({ data: [explicit, clean], total: 2 });

    const result = await getRecommendations({
      genres: ["Pop"],
      excludeExplicit: true,
      limit: 10,
    });

    expect(result.every((t) => !t.explicit_lyrics)).toBe(true);
  });

  it("deduplicates tracks by id", async () => {
    const track = makeMockTrack({ id: 1 });
    // Return the same track twice
    global.fetch = mockFetch({ data: [track, track], total: 2 });

    const result = await getRecommendations({ genres: ["Pop"], limit: 10 });

    expect(result).toHaveLength(1);
  });

  it("filters by BPM range when provided", async () => {
    const inRange = makeMockTrack({ id: 1, bpm: 128 });
    const outRange = makeMockTrack({ id: 2, bpm: 200 });
    global.fetch = mockFetch({ data: [inRange, outRange], total: 2 });

    const result = await getRecommendations({
      genres: ["Trance"],
      bpmRange: { min: 120, max: 140 },
      limit: 10,
    });

    expect(result.every((t) => t.bpm >= 120 && t.bpm <= 140)).toBe(true);
  });

  it("falls back to chart when no genres specified", async () => {
    const track = makeMockTrack();
    global.fetch = mockFetch({ tracks: { data: [track] } });

    const result = await getRecommendations({ genres: [], limit: 5 });

    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain("/chart");
    expect(result).toHaveLength(1);
  });
});
