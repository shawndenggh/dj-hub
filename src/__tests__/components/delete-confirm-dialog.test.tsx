/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";

describe("DeleteConfirmDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    title: "Delete Channel",
    description: "Are you sure you want to delete this channel?",
    onConfirm: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    defaultProps.onConfirm = jest.fn().mockResolvedValue(undefined);
    defaultProps.onOpenChange = jest.fn();
  });

  it("renders title and description when open", () => {
    render(<DeleteConfirmDialog {...defaultProps} />);
    expect(screen.getByText("Delete Channel")).toBeInTheDocument();
    expect(
      screen.getByText("Are you sure you want to delete this channel?")
    ).toBeInTheDocument();
  });

  it("renders default action label 'Delete'", () => {
    render(<DeleteConfirmDialog {...defaultProps} />);
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  });

  it("renders custom action label", () => {
    render(<DeleteConfirmDialog {...defaultProps} action="Remove" />);
    expect(screen.getByRole("button", { name: /remove/i })).toBeInTheDocument();
  });

  it("calls onConfirm and closes dialog when Delete clicked", async () => {
    render(<DeleteConfirmDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    await waitFor(() => {
      expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("calls onOpenChange(false) when Cancel clicked", () => {
    render(<DeleteConfirmDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("does not render content when open is false", () => {
    render(<DeleteConfirmDialog {...defaultProps} open={false} />);
    expect(screen.queryByText("Delete Channel")).not.toBeInTheDocument();
  });
});
