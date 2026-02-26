import type { DeezerTrack } from "./deezer";

export interface ScoringFactors {
  /** User's preferred genres (e.g. ["Trance", "House"]) */
  genres: string[];
  /** User's preferred BPM range */
  bpmRange?: { min: number; max: number };
  /** Deezer artist IDs from previously liked recommendations */
  preferredArtistIds?: number[];
}

export interface ScoredTrack {
  track: DeezerTrack;
  /** Composite score 0-100 */
  score: number;
  factors: {
    genreScore: number;
    bpmScore: number;
    popularityScore: number;
    artistScore: number;
  };
}

type DeezerTrackWithMeta = DeezerTrack & {
  /** Deezer rank (popularity signal) */
  rank?: number;
  genre?: { id: number; name: string };
};

/**
 * Score a single track against user preferences.
 * Weights: genre 40%, BPM 30%, popularity 20%, artist 10%.
 */
export function scoreTrack(
  track: DeezerTrackWithMeta,
  factors: ScoringFactors,
  /** Position in the result list (0-based) – used as popularity proxy when rank is absent */
  index: number,
  total: number
): ScoredTrack {
  // ── Genre match (0–40) ──────────────────────────────────────────────────
  let genreScore = 0;
  if (factors.genres.length === 0) {
    genreScore = 20; // neutral
  } else if (track.genre?.name) {
    const trackGenre = track.genre.name.toLowerCase();
    const matched = factors.genres.some((g) => {
      const gl = g.toLowerCase();
      return trackGenre.includes(gl) || gl.includes(trackGenre);
    });
    genreScore = matched ? 40 : 5;
  } else {
    genreScore = 10; // unknown genre – mild penalty
  }

  // ── BPM match (0–30) ────────────────────────────────────────────────────
  let bpmScore = 0;
  if (!factors.bpmRange || (factors.bpmRange.min === 0 && factors.bpmRange.max === 0)) {
    bpmScore = 15; // neutral
  } else if (!track.bpm || track.bpm <= 0) {
    bpmScore = 10; // unknown BPM
  } else {
    const { min, max } = factors.bpmRange;
    const mid = (min + max) / 2;
    if (track.bpm >= min && track.bpm <= max) {
      const halfWidth = mid - min || 1;
      const deviation = Math.abs(track.bpm - mid) / halfWidth;
      bpmScore = Math.round(30 * (1 - deviation * 0.4));
    } else {
      const distance = track.bpm < min ? min - track.bpm : track.bpm - max;
      const ratio = Math.min(distance / (mid || 1), 1);
      bpmScore = Math.round(30 * Math.max(0, 1 - ratio * 2));
    }
  }

  // ── Popularity / Deezer rank (0–20) ─────────────────────────────────────
  let popularityScore = 0;
  if (track.rank && track.rank > 0) {
    // Deezer rank typically ranges 0–1,000,000+; normalise to 0–20
    popularityScore = Math.min(20, Math.round((track.rank / 800_000) * 20));
  } else {
    // Use inverse position as proxy: first result gets 20, last gets 0
    const fraction = total > 1 ? 1 - index / (total - 1) : 1;
    popularityScore = Math.round(20 * fraction);
  }

  // ── Artist relevance (0–10) ──────────────────────────────────────────────
  const artistScore =
    factors.preferredArtistIds?.includes(track.artist.id) ? 10 : 0;

  const score = Math.min(
    100,
    genreScore + bpmScore + popularityScore + artistScore
  );

  return {
    track,
    score,
    factors: { genreScore, bpmScore, popularityScore, artistScore },
  };
}

/**
 * Score and rank an array of tracks, returning them sorted highest-first.
 */
export function scoreAndRankTracks(
  tracks: DeezerTrack[],
  factors: ScoringFactors
): ScoredTrack[] {
  return tracks
    .map((track, index) =>
      scoreTrack(track as DeezerTrackWithMeta, factors, index, tracks.length)
    )
    .sort((a, b) => b.score - a.score);
}
