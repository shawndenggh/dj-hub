/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { TrackCard } from "@/components/track-card";
import type { TrackData } from "@/components/track-card";

// Mock useToast
jest.mock("@/hooks/use-toast", () => ({
  useToast: jest.fn(() => ({ toast: jest.fn() })),
}));

// Mock MusicPlayer to avoid audio complications
jest.mock("@/components/music-player", () => ({
  MusicPlayer: jest.fn(({ track, onClose }) => 
    track ? (
      <div data-testid="music-player">
        <span>{track.title}</span>
        <button onClick={onClose}>Close Player</button>
      </div>
    ) : null
  ),
}));

const mockTrack: TrackData = {
  id: 1,
  title: "Test Track",
  artist: { name: "Test Artist", picture_medium: "https://example.com/artist.jpg" },
  album: { title: "Test Album", cover_medium: "https://example.com/cover.jpg" },
  duration: 210,
  preview: "https://cdn.deezer.com/preview/1.mp3",
  bpm: 128,
  explicit_lyrics: false,
  genre: "House",
};

describe("TrackCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: {}, message: "Added" }),
    });
  });

  it("renders track title and artist", () => {
    render(<TrackCard track={mockTrack} />);
    expect(screen.getByText("Test Track")).toBeInTheDocument();
    expect(screen.getByText("Test Artist")).toBeInTheDocument();
  });

  it("renders BPM when provided", () => {
    render(<TrackCard track={mockTrack} />);
    expect(screen.getByText("128 BPM")).toBeInTheDocument();
  });

  it("renders duration formatted", () => {
    render(<TrackCard track={mockTrack} />);
    expect(screen.getByText("3:30")).toBeInTheDocument();
  });

  it("renders genre badge when genre provided", () => {
    render(<TrackCard track={mockTrack} />);
    expect(screen.getByText("House")).toBeInTheDocument();
  });

  it("renders E badge for explicit tracks", () => {
    render(<TrackCard track={{ ...mockTrack, explicit_lyrics: true }} />);
    expect(screen.getByText("E")).toBeInTheDocument();
  });

  it("renders preview button", () => {
    render(<TrackCard track={mockTrack} />);
    expect(screen.getByLabelText("Preview")).toBeInTheDocument();
  });

  it("disables preview button when no preview URL", () => {
    render(<TrackCard track={{ ...mockTrack, preview: undefined }} />);
    expect(screen.getByLabelText("Preview")).toBeDisabled();
  });

  it("shows MusicPlayer when preview clicked", async () => {
    render(<TrackCard track={mockTrack} />);
    fireEvent.click(screen.getByLabelText("Preview"));
    await waitFor(() => {
      expect(screen.getByTestId("music-player")).toBeInTheDocument();
    });
  });

  it("renders remove button when onRemove provided", () => {
    render(<TrackCard track={mockTrack} onRemove={jest.fn()} />);
    expect(screen.getByLabelText("Remove")).toBeInTheDocument();
  });

  it("calls onRemove when remove button clicked", async () => {
    const onRemove = jest.fn().mockResolvedValue(undefined);
    render(<TrackCard track={mockTrack} onRemove={onRemove} />);
    fireEvent.click(screen.getByLabelText("Remove"));
    await waitFor(() => {
      expect(onRemove).toHaveBeenCalledTimes(1);
    });
  });

  it("renders add-to-channel button when channels provided", () => {
    const channels = [{ id: "ch-1", name: "My Channel" }];
    render(<TrackCard track={mockTrack} channels={channels} />);
    expect(screen.getByLabelText("Add to channel")).toBeInTheDocument();
  });

  it("renders cover image when available", () => {
    render(<TrackCard track={mockTrack} />);
    const img = screen.getByAltText("Test Track");
    expect(img).toBeInTheDocument();
  });

  it("renders music icon placeholder when no cover", () => {
    render(<TrackCard track={{ ...mockTrack, album: undefined }} />);
    // No cover means fallback placeholder renders
    expect(screen.queryByAltText("Test Track")).not.toBeInTheDocument();
  });

  it("does not render BPM when bpm is 0", () => {
    render(<TrackCard track={{ ...mockTrack, bpm: 0 }} />);
    expect(screen.queryByText(/BPM/)).not.toBeInTheDocument();
  });
});
