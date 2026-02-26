/**
 * Music style classifier based on track metadata.
 *
 * Uses a rule-based scoring system to assign confidence scores
 * to each supported DJ style based on BPM, genre tags, energy,
 * and title/artist keywords.
 */

export type MusicStyle =
  | "Trance"
  | "Uplifting Trance"
  | "Vocal Trance"
  | "House"
  | "Deep House"
  | "Tech House"
  | "Techno"
  | "Progressive"
  | "Psy-Trance"
  | "Drum and Bass"
  | "Ambient"
  | "Commercial";

export interface ClassificationResult {
  /** Primary detected style */
  primary: MusicStyle;
  /** All styles with confidence score 0-1 */
  scores: Record<MusicStyle, number>;
  /** Confidence of the primary classification (0-1) */
  confidence: number;
}

export interface TrackMetadata {
  title?: string;
  artist?: string;
  genre?: string;
  bpm?: number;
  energy?: number;       // 0-1
  danceability?: number; // 0-1
}

// Keyword dictionaries keyed by style
const STYLE_KEYWORDS: Record<MusicStyle, string[]> = {
  "Trance": ["trance", "anthem", "euphoria"],
  "Uplifting Trance": ["uplifting", "uplift", "anthem", "epic", "euphoric"],
  "Vocal Trance": ["vocal", "voice", "singer", "ft.", "feat.", "featuring"],
  "House": ["house", "groove", "funky", "disco"],
  "Deep House": ["deep", "soulful", "lounge", "chill", "smooth"],
  "Tech House": ["tech house", "techno house", "minimal", "groove"],
  "Techno": ["techno", "industrial", "warehouse", "dark", "raw"],
  "Progressive": ["progressive", "prog", "melodic", "cinematic"],
  "Psy-Trance": ["psy", "psychedelic", "goa", "forest", "full on"],
  "Drum and Bass": ["drum and bass", "dnb", "d&b", "jungle", "liquid", "neurofunk"],
  "Ambient": ["ambient", "atmospheric", "meditation", "chillout", "chill out"],
  "Commercial": ["pop", "chart", "radio", "mainstream", "dance"],
};

// BPM ranges typical for each style [min, max]
const BPM_RANGES: Partial<Record<MusicStyle, [number, number]>> = {
  "Trance": [128, 145],
  "Uplifting Trance": [136, 145],
  "Vocal Trance": [128, 140],
  "House": [120, 130],
  "Deep House": [118, 126],
  "Tech House": [126, 132],
  "Techno": [130, 155],
  "Progressive": [126, 135],
  "Psy-Trance": [140, 160],
  "Drum and Bass": [160, 185],
  "Ambient": [60, 110],
  "Commercial": [118, 134],
};

const ALL_STYLES: MusicStyle[] = [
  "Trance",
  "Uplifting Trance",
  "Vocal Trance",
  "House",
  "Deep House",
  "Tech House",
  "Techno",
  "Progressive",
  "Psy-Trance",
  "Drum and Bass",
  "Ambient",
  "Commercial",
];

/**
 * Classify a track into one or more DJ music styles.
 */
export function classifyTrack(meta: TrackMetadata): ClassificationResult {
  const text = [meta.title, meta.artist, meta.genre]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const scores: Record<MusicStyle, number> = {} as Record<MusicStyle, number>;

  for (const style of ALL_STYLES) {
    let score = 0;

    // Keyword matching (weight: 0.5 per match, max 1.0)
    const keywords = STYLE_KEYWORDS[style];
    for (const kw of keywords) {
      if (text.includes(kw.toLowerCase())) {
        score += 0.5;
      }
    }
    score = Math.min(score, 1.0);

    // BPM scoring
    const range = BPM_RANGES[style];
    if (meta.bpm && range) {
      const [low, high] = range;
      const mid = (low + high) / 2;
      const spread = (high - low) / 2 + 10; // tolerance
      const bpmScore = Math.max(0, 1 - Math.abs(meta.bpm - mid) / spread);
      score = score * 0.6 + bpmScore * 0.4;
    }

    // Energy hints
    if (meta.energy !== undefined) {
      if (style === "Ambient" && meta.energy < 0.3) score += 0.2;
      if ((style === "Techno" || style === "Psy-Trance") && meta.energy > 0.8) score += 0.15;
      if (style === "Deep House" && meta.energy < 0.55) score += 0.1;
    }

    // Genre direct match bonus
    if (meta.genre) {
      const genre = meta.genre.toLowerCase();
      if (genre.includes(style.toLowerCase())) score = Math.max(score, 0.85);
    }

    scores[style] = Math.min(1, Math.round(score * 100) / 100);
  }

  // Find best match
  const sorted = ALL_STYLES.slice().sort((a, b) => scores[b] - scores[a]);
  const primary = sorted[0];
  const confidence = scores[primary];

  return { primary, scores, confidence };
}

/**
 * Return only styles above the given confidence threshold.
 */
export function getTopStyles(
  meta: TrackMetadata,
  threshold = 0.3
): { style: MusicStyle; confidence: number }[] {
  const { scores } = classifyTrack(meta);
  return ALL_STYLES.filter((s) => scores[s] >= threshold)
    .sort((a, b) => scores[b] - scores[a])
    .map((style) => ({ style, confidence: scores[style] }));
}
