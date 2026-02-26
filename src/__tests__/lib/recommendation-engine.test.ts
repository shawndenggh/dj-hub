import { scoreTrack, scoreAndRankTracks } from "@/lib/recommendation-engine";
import { makeTrack } from "../fixtures/tracks";

describe("scoreTrack", () => {
  const total = 10;

  it("returns a ScoredTrack with score 0-100", () => {
    const track = makeTrack({ bpm: 126 });
    const result = scoreTrack(track, { genres: ["House"], bpmRange: { min: 120, max: 130 } }, 0, total);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.track).toBe(track);
  });

  it("gives higher genre score when track genre matches", () => {
    const matched = makeTrack() as any;
    matched.genre = { id: 1, name: "House" };
    const unmatched = makeTrack() as any;
    unmatched.genre = { id: 2, name: "Classical" };

    const r1 = scoreTrack(matched, { genres: ["House"] }, 0, total);
    const r2 = scoreTrack(unmatched, { genres: ["House"] }, 0, total);
    expect(r1.factors.genreScore).toBeGreaterThan(r2.factors.genreScore);
  });

  it("gives neutral genre score when genres array is empty", () => {
    const track = makeTrack();
    const result = scoreTrack(track, { genres: [] }, 0, total);
    expect(result.factors.genreScore).toBe(20);
  });

  it("gives neutral BPM score when bpmRange is not set", () => {
    const track = makeTrack({ bpm: 128 });
    const result = scoreTrack(track, { genres: [] }, 0, total);
    expect(result.factors.bpmScore).toBe(15);
  });

  it("gives BPM score based on proximity to midpoint", () => {
    const exact = makeTrack({ bpm: 125 }); // mid of 120-130
    const outside = makeTrack({ bpm: 160 });

    const r1 = scoreTrack(exact, { genres: [], bpmRange: { min: 120, max: 130 } }, 0, total);
    const r2 = scoreTrack(outside, { genres: [], bpmRange: { min: 120, max: 130 } }, 0, total);
    expect(r1.factors.bpmScore).toBeGreaterThan(r2.factors.bpmScore);
  });

  it("gives artist bonus when artist is in preferredArtistIds", () => {
    const track = makeTrack({ bpm: 128 });
    const withBonus = scoreTrack(
      track,
      { genres: [], preferredArtistIds: [track.artist.id] },
      0,
      total
    );
    const withoutBonus = scoreTrack(track, { genres: [] }, 0, total);
    expect(withBonus.factors.artistScore).toBe(10);
    expect(withoutBonus.factors.artistScore).toBe(0);
  });

  it("uses inverse position as popularity proxy when rank is absent", () => {
    const track = makeTrack();
    const first = scoreTrack(track, { genres: [] }, 0, 10);
    const last = scoreTrack(track, { genres: [] }, 9, 10);
    expect(first.factors.popularityScore).toBeGreaterThan(last.factors.popularityScore);
  });

  it("uses rank for popularity when available", () => {
    const highRank = { ...makeTrack(), rank: 800000 } as any;
    const lowRank = { ...makeTrack(), rank: 1000 } as any;
    const r1 = scoreTrack(highRank, { genres: [] }, 0, total);
    const r2 = scoreTrack(lowRank, { genres: [] }, 0, total);
    expect(r1.factors.popularityScore).toBeGreaterThan(r2.factors.popularityScore);
  });

  it("handles track with zero BPM gracefully", () => {
    const track = makeTrack({ bpm: 0 });
    const result = scoreTrack(track, { genres: [], bpmRange: { min: 120, max: 140 } }, 0, total);
    expect(result.factors.bpmScore).toBe(10);
  });

  it("handles bpmRange with both zeros as neutral", () => {
    const track = makeTrack({ bpm: 128 });
    const result = scoreTrack(track, { genres: [], bpmRange: { min: 0, max: 0 } }, 0, total);
    expect(result.factors.bpmScore).toBe(15);
  });
});

describe("scoreAndRankTracks", () => {
  it("returns tracks sorted by score descending", () => {
    const tracks = [
      makeTrack({ id: 1, bpm: 200 }),  // poor BPM match
      makeTrack({ id: 2, bpm: 125 }),  // great BPM match
      makeTrack({ id: 3, bpm: 170 }),  // mediocre match
    ];

    const ranked = scoreAndRankTracks(tracks, {
      genres: [],
      bpmRange: { min: 120, max: 130 },
    });

    expect(ranked[0].track.id).toBe(2);
    for (let i = 0; i < ranked.length - 1; i++) {
      expect(ranked[i].score).toBeGreaterThanOrEqual(ranked[i + 1].score);
    }
  });

  it("returns empty array for empty input", () => {
    expect(scoreAndRankTracks([], { genres: [] })).toEqual([]);
  });

  it("preserves all tracks in output", () => {
    const tracks = [makeTrack({ id: 1 }), makeTrack({ id: 2 }), makeTrack({ id: 3 })];
    const ranked = scoreAndRankTracks(tracks, { genres: [] });
    expect(ranked.length).toBe(3);
  });

  it("scores include all four factor fields", () => {
    const ranked = scoreAndRankTracks([makeTrack()], { genres: [] });
    const { factors } = ranked[0];
    expect(factors).toHaveProperty("genreScore");
    expect(factors).toHaveProperty("bpmScore");
    expect(factors).toHaveProperty("popularityScore");
    expect(factors).toHaveProperty("artistScore");
  });
});
