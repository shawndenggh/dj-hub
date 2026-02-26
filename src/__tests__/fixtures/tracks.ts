import type { DeezerTrack } from "@/lib/deezer";

// ── Track fixtures ───────────────────────────────────────────────────────────

export function makeTrack(overrides: Partial<DeezerTrack> = {}): DeezerTrack {
  return {
    id: 1,
    title: "Test Track",
    duration: 210,
    preview: "https://cdn.deezer.com/preview/1.mp3",
    explicit_lyrics: false,
    bpm: 128,
    artist: {
      id: 10,
      name: "Test Artist",
      picture_medium: "https://example.com/artist.jpg",
    },
    album: {
      id: 20,
      title: "Test Album",
      cover_medium: "https://example.com/cover.jpg",
    },
    ...overrides,
  };
}

export const mockTrack = makeTrack();

export const mockTracks: DeezerTrack[] = [
  makeTrack({ id: 1, title: "House Anthem", bpm: 126 }),
  makeTrack({ id: 2, title: "Trance Classic", bpm: 138, explicit_lyrics: false }),
  makeTrack({ id: 3, title: "Deep Groove", bpm: 122, explicit_lyrics: true }),
];

export const mockExplicitTrack = makeTrack({
  id: 99,
  title: "Explicit Song",
  explicit_lyrics: true,
});

export const mockDeezerSearchResult = {
  data: mockTracks,
  total: 3,
};
