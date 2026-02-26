import { makeTrack } from "../fixtures/tracks";
import type { DeezerTrack, DeezerSearchResult, DeezerChart } from "@/lib/deezer";

// ── Deezer API mock helpers ───────────────────────────────────────────────────

export function mockFetchSuccess(body: unknown) {
  return jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: "OK",
    json: async () => body,
  });
}

export function mockFetchError(status = 500, statusText = "Internal Server Error") {
  return jest.fn().mockResolvedValue({
    ok: false,
    status,
    statusText,
    json: async () => ({ error: statusText }),
  });
}

export function mockSearchResult(tracks: DeezerTrack[] = [makeTrack()]): DeezerSearchResult {
  return { data: tracks, total: tracks.length };
}

export function mockChartResult(tracks: DeezerTrack[] = [makeTrack()]): DeezerChart {
  return { tracks: { data: tracks } };
}

export const mockDeezerModule = {
  searchTracks: jest.fn().mockResolvedValue(mockSearchResult()),
  searchByGenre: jest.fn().mockResolvedValue(mockSearchResult()),
  getTrack: jest.fn().mockResolvedValue(makeTrack()),
  getGenres: jest.fn().mockResolvedValue({ data: [] }),
  getChart: jest.fn().mockResolvedValue(mockChartResult()),
  getRecommendations: jest.fn().mockResolvedValue([makeTrack()]),
  getArtistTopTracks: jest.fn().mockResolvedValue({ data: [makeTrack()] }),
};
