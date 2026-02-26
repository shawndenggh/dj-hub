/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { StatsCard } from "@/components/stats-card";

describe("StatsCard", () => {
  it("renders title and value", () => {
    render(<StatsCard title="Total Channels" value={42} />);
    expect(screen.getByText("Total Channels")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders string value", () => {
    render(<StatsCard title="Plan" value="Pro" />);
    expect(screen.getByText("Pro")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(<StatsCard title="Channels" value={5} description="5 of 5 used" />);
    expect(screen.getByText("5 of 5 used")).toBeInTheDocument();
  });

  it("renders progress bar when progress is provided", () => {
    render(<StatsCard title="Usage" value="50%" progress={50} />);
    // Progress bar renders as a div with role progressbar or has a value attribute
    const progressbar = document.querySelector("[role=progressbar], [aria-valuenow]") ||
      document.querySelector(".h-1\\.5");
    expect(progressbar).toBeTruthy();
  });

  it("renders progress label when provided", () => {
    render(<StatsCard title="Usage" value="50%" progress={50} progressLabel="50 of 100 used" />);
    expect(screen.getByText("50 of 100 used")).toBeInTheDocument();
  });

  it("renders upward trend with positive number", () => {
    render(<StatsCard title="Growth" value={100} trend={15} />);
    expect(screen.getByText("15%")).toBeInTheDocument();
  });

  it("renders downward trend with negative number", () => {
    render(<StatsCard title="Loss" value={80} trend={-5} />);
    expect(screen.getByText("5%")).toBeInTheDocument();
  });

  it("renders neutral indicator when trend is 0", () => {
    render(<StatsCard title="Stable" value={50} trend={0} />);
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("renders icon when provided", () => {
    const icon = <span data-testid="test-icon">🎵</span>;
    render(<StatsCard title="Tracks" value={10} icon={icon} />);
    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <StatsCard title="Test" value={1} className="custom-class" />
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });
});
