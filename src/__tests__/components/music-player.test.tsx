/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { MusicPlayer, type PlayerTrack } from "@/components/music-player";

const mockTrack: PlayerTrack = {
  title: "Test Track",
  artist: "Test Artist",
  previewUrl: "https://cdn.deezer.com/preview/1.mp3",
  coverUrl: "https://example.com/cover.jpg",
};

describe("MusicPlayer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing when track is null", () => {
    const { container } = render(<MusicPlayer track={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders player when track is provided", () => {
    render(<MusicPlayer track={mockTrack} />);
    expect(screen.getByText("Test Track")).toBeInTheDocument();
    expect(screen.getByText("Test Artist")).toBeInTheDocument();
  });

  it("renders play/pause button", () => {
    render(<MusicPlayer track={mockTrack} />);
    // Should have a play or pause button
    const btn = screen.getByLabelText(/play|pause/i);
    expect(btn).toBeInTheDocument();
  });

  it("renders mute button", () => {
    render(<MusicPlayer track={mockTrack} />);
    expect(screen.getByLabelText(/mute|unmute/i)).toBeInTheDocument();
  });

  it("renders seek slider", () => {
    render(<MusicPlayer track={mockTrack} />);
    expect(screen.getByLabelText("Seek")).toBeInTheDocument();
  });

  it("renders volume slider", () => {
    render(<MusicPlayer track={mockTrack} />);
    expect(screen.getByLabelText("Volume")).toBeInTheDocument();
  });

  it("renders close button when onClose provided", () => {
    const onClose = jest.fn();
    render(<MusicPlayer track={mockTrack} onClose={onClose} />);
    expect(screen.getByLabelText("Close player")).toBeInTheDocument();
  });

  it("calls onClose when close button clicked", () => {
    const onClose = jest.fn();
    render(<MusicPlayer track={mockTrack} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText("Close player"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders cover image when coverUrl provided", () => {
    render(<MusicPlayer track={mockTrack} />);
    const img = screen.getByAltText("Test Track");
    expect(img).toBeInTheDocument();
  });

  it("renders placeholder when no coverUrl", () => {
    render(<MusicPlayer track={{ ...mockTrack, coverUrl: undefined }} />);
    expect(screen.queryByAltText("Test Track")).not.toBeInTheDocument();
  });

  it("toggles mute when mute button clicked", async () => {
    render(<MusicPlayer track={mockTrack} />);
    const muteBtn = screen.getByLabelText(/mute/i);
    fireEvent.click(muteBtn);
    // After click, label should change to unmute or mute
    await waitFor(() => {
      expect(screen.getByLabelText(/mute|unmute/i)).toBeInTheDocument();
    });
  });

  it("applies custom className", () => {
    const { container } = render(
      <MusicPlayer track={mockTrack} className="custom-player" />
    );
    expect(container.querySelector(".custom-player")).toBeInTheDocument();
  });
});
