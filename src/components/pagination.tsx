"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  /** Current 1-based page number */
  page: number;
  /** Total number of pages */
  totalPages: number;
  /** Total number of items (used for display) */
  total: number;
  /** Items per page */
  perPage: number;
  /** Allowed per-page options */
  perPageOptions?: number[];
  /** Called when page changes; if omitted, uses router (URL search params) */
  onPageChange?: (page: number) => void;
  /** Called when perPage changes */
  onPerPageChange?: (perPage: number) => void;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  total,
  perPage,
  perPageOptions = [10, 25, 50],
  onPageChange,
  onPerPageChange,
  className,
}: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function navigateTo(newPage: number) {
    if (onPageChange) {
      onPageChange(newPage);
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`${pathname}?${params.toString()}`);
  }

  function handlePerPageChange(value: number) {
    if (onPerPageChange) {
      onPerPageChange(value);
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", String(value));
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  const start = total === 0 ? 0 : (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);

  // Build visible page numbers (always show first, last, and pages around current)
  const pages = buildPageNumbers(page, totalPages);

  if (totalPages <= 1 && total <= perPageOptions[0]) return null;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-3 text-sm",
        className
      )}
    >
      {/* Item count */}
      <p className="text-muted-foreground">
        {total === 0
          ? "No results"
          : `Showing ${start}–${end} of ${total} results`}
      </p>

      {/* Page controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={page <= 1}
          onClick={() => navigateTo(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">
              …
            </span>
          ) : (
            <Button
              key={p}
              variant={p === page ? "default" : "outline"}
              size="icon"
              className="h-8 w-8"
              onClick={() => navigateTo(p as number)}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </Button>
          )
        )}

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={page >= totalPages}
          onClick={() => navigateTo(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Per-page selector */}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Per page:</span>
        <select
          value={perPage}
          onChange={(e) => handlePerPageChange(Number(e.target.value))}
          className="rounded-md border bg-background px-2 py-1 text-sm"
          aria-label="Items per page"
        >
          {perPageOptions.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

/** Returns an array of page numbers and "…" separators. */
function buildPageNumbers(
  current: number,
  total: number
): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "…")[] = [1];

  if (current > 3) pages.push("…");

  const rangeStart = Math.max(2, current - 1);
  const rangeEnd = Math.min(total - 1, current + 1);
  for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);

  if (current < total - 2) pages.push("…");
  pages.push(total);

  return pages;
}
