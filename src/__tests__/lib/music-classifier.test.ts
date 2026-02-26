import { classifyTrack, getTopStyles } from "@/lib/music-classifier";

describe("classifyTrack", () => {
  it("returns a result with primary, scores, and confidence", () => {
    const result = classifyTrack({ title: "Trance Anthem" });
    expect(result).toHaveProperty("primary");
    expect(result).toHaveProperty("scores");
    expect(result).toHaveProperty("confidence");
    expect(typeof result.confidence).toBe("number");
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it("classifies a trance track by keyword", () => {
    const result = classifyTrack({ title: "Euphoric Trance Anthem", genre: "Trance" });
    expect(result.primary).toBe("Trance");
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it("classifies ambient by energy level", () => {
    const result = classifyTrack({ title: "Chill Ambient Session", energy: 0.1 });
    expect(result.scores["Ambient"]).toBeGreaterThan(0);
  });

  it("classifies deep house by keyword and BPM", () => {
    const result = classifyTrack({ title: "Deep Soulful Groove", bpm: 122 });
    expect(result.scores["Deep House"]).toBeGreaterThan(0);
  });

  it("classifies drum and bass by keyword", () => {
    const result = classifyTrack({ title: "Liquid Drum and Bass Journey" });
    expect(result.scores["Drum and Bass"]).toBeGreaterThan(0);
  });

  it("classifies techno by keyword and BPM", () => {
    const result = classifyTrack({ title: "Dark Techno Industrial", bpm: 140, energy: 0.9 });
    expect(result.scores["Techno"]).toBeGreaterThan(0);
  });

  it("classifies psy-trance by keyword", () => {
    const result = classifyTrack({ title: "Psychedelic Goa Forest" });
    expect(result.scores["Psy-Trance"]).toBeGreaterThan(0);
  });

  it("applies genre direct match bonus", () => {
    const result = classifyTrack({ title: "Unknown Track", genre: "House" });
    expect(result.scores["House"]).toBeGreaterThanOrEqual(0.85);
  });

  it("returns scores for all 12 styles", () => {
    const result = classifyTrack({ title: "Unknown" });
    const styles = Object.keys(result.scores);
    expect(styles.length).toBe(12);
  });

  it("handles empty metadata", () => {
    const result = classifyTrack({});
    expect(result.primary).toBeDefined();
    expect(result.confidence).toBeGreaterThanOrEqual(0);
  });

  it("BPM in Uplifting Trance range boosts score", () => {
    const result = classifyTrack({ title: "Uplifting Epic Anthem", bpm: 140 });
    expect(result.scores["Uplifting Trance"]).toBeGreaterThan(0);
  });

  it("classifies vocal trance by keyword", () => {
    const result = classifyTrack({ title: "Vocal Trance Featuring Singer" });
    expect(result.scores["Vocal Trance"]).toBeGreaterThan(0);
  });

  it("commercial pop keyword increases commercial score", () => {
    const result = classifyTrack({ title: "Radio Pop Chart Hit" });
    expect(result.scores["Commercial"]).toBeGreaterThan(0);
  });

  it("high energy boosts techno/psy-trance", () => {
    const r1 = classifyTrack({ title: "Techno", energy: 0.9 });
    const r2 = classifyTrack({ title: "Techno", energy: 0.3 });
    expect(r1.scores["Techno"]).toBeGreaterThan(r2.scores["Techno"]);
  });

  it("deep house low energy bonus applied", () => {
    // Use a title without keywords so energy makes a measurable difference
    const r1 = classifyTrack({ title: "Electronic Mix", energy: 0.4, bpm: 122 });
    const r2 = classifyTrack({ title: "Electronic Mix", energy: 0.8, bpm: 122 });
    // r1 should have the energy bonus (< 0.55), r2 should not
    expect(r1.scores["Deep House"]).toBeGreaterThanOrEqual(r2.scores["Deep House"]);
  });
});

describe("getTopStyles", () => {
  it("returns styles above threshold", () => {
    const result = getTopStyles({ title: "Trance Anthem", genre: "Trance" }, 0.3);
    expect(result.length).toBeGreaterThan(0);
    result.forEach((item) => {
      expect(item.confidence).toBeGreaterThanOrEqual(0.3);
      expect(item.style).toBeDefined();
    });
  });

  it("returns sorted by confidence descending", () => {
    const result = getTopStyles({ title: "Trance", genre: "Trance" }, 0.1);
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].confidence).toBeGreaterThanOrEqual(result[i + 1].confidence);
    }
  });

  it("uses default threshold of 0.3", () => {
    const result = getTopStyles({ title: "Trance Anthem" });
    result.forEach((item) => {
      expect(item.confidence).toBeGreaterThanOrEqual(0.3);
    });
  });

  it("returns empty array when nothing matches threshold", () => {
    // Very high threshold – nothing should match
    const result = getTopStyles({ title: "Unknown Track" }, 0.99);
    expect(result).toEqual([]);
  });
});
