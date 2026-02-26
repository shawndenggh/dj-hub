/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Pagination } from "@/components/pagination";

const mockPush = jest.fn();
const mockPathname = "/channels";
const mockSearchParams = new URLSearchParams("limit=10");

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: mockPush })),
  usePathname: jest.fn(() => mockPathname),
  useSearchParams: jest.fn(() => mockSearchParams),
}));

describe("Pagination", () => {
  const defaultProps = {
    page: 2,
    totalPages: 5,
    total: 48,
    perPage: 10,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders item count summary", () => {
    render(<Pagination {...defaultProps} />);
    expect(screen.getByText(/Showing/)).toBeInTheDocument();
  });

  it("renders Previous and Next buttons", () => {
    render(<Pagination {...defaultProps} />);
    expect(screen.getByLabelText("Previous page")).toBeInTheDocument();
    expect(screen.getByLabelText("Next page")).toBeInTheDocument();
  });

  it("disables Previous button on first page", () => {
    render(<Pagination {...defaultProps} page={1} />);
    expect(screen.getByLabelText("Previous page")).toBeDisabled();
  });

  it("disables Next button on last page", () => {
    render(<Pagination {...defaultProps} page={5} />);
    expect(screen.getByLabelText("Next page")).toBeDisabled();
  });

  it("calls onPageChange when Next is clicked", () => {
    const onPageChange = jest.fn();
    render(<Pagination {...defaultProps} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByLabelText("Next page"));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("calls onPageChange when Previous is clicked", () => {
    const onPageChange = jest.fn();
    render(<Pagination {...defaultProps} page={3} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByLabelText("Previous page"));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("renders per-page selector", () => {
    render(<Pagination {...defaultProps} />);
    expect(screen.getByLabelText("Items per page")).toBeInTheDocument();
  });

  it("calls onPerPageChange when per-page select changes", () => {
    const onPerPageChange = jest.fn();
    render(<Pagination {...defaultProps} onPerPageChange={onPerPageChange} />);
    fireEvent.change(screen.getByLabelText("Items per page"), { target: { value: "25" } });
    expect(onPerPageChange).toHaveBeenCalledWith(25);
  });

  it("shows 'No results' when total is 0", () => {
    // totalPages must be > 1 to prevent the component from returning null
    render(<Pagination page={1} totalPages={2} total={0} perPage={10} />);
    expect(screen.getByText("No results")).toBeInTheDocument();
  });

  it("returns null when totalPages <= 1 and total <= perPageOptions[0]", () => {
    const { container } = render(
      <Pagination page={1} totalPages={1} total={5} perPage={10} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows ellipsis for large page ranges", () => {
    render(<Pagination page={5} totalPages={10} total={100} perPage={10} />);
    const ellipses = screen.getAllByText("…");
    expect(ellipses.length).toBeGreaterThan(0);
  });

  it("uses router.push when no onPageChange provided", () => {
    render(<Pagination {...defaultProps} />);
    fireEvent.click(screen.getByLabelText("Next page"));
    expect(mockPush).toHaveBeenCalled();
  });
});
