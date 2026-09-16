"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}

const DEFAULT_PAGE_SIZE = 10;

function pageNumbers(current: number, total: number): Array<number | "gap"> {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "gap", total];
  if (current >= total - 3) return [1, "gap", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "gap", current - 1, current, current + 1, "gap", total];
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  empty,
  tableClassName,
  pageSize = DEFAULT_PAGE_SIZE,
}: {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string;
  empty?: ReactNode;
  tableClassName?: string;
  pageSize?: number;
}) {
  const reduce = useReducedMotion();
  const [page, setPage] = useState(1);
  const signature = `${data.length}:${data[0] ? rowKey(data[0]) : ""}:${data.at(-1) ? rowKey(data.at(-1) as T) : ""}`;

  useEffect(() => {
    setPage(1);
  }, [signature]);

  const pageCount = Math.max(1, Math.ceil(data.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [currentPage, data, pageSize]);

  if (data.length === 0) {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed bg-muted/30 px-4 py-8 text-sm text-muted-foreground">
        {empty ?? "No records found."}
      </div>
    );
  }

  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, data.length);
  const showPager = data.length > pageSize;

  return (
    <div className="overflow-hidden rounded-[10px] border border-cloud bg-card">
      <Table className={tableClassName}>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            {columns.map((column) => (
              <TableHead key={column.key} className={cn("px-3", column.className)}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map((row, index) => (
            <motion.tr
              key={rowKey(row)}
              data-slot="table-row"
              className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted motion-safe:hover:bg-cloud/40"
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: reduce ? 0 : Math.min(index * 0.04, 0.24), ease: [0.22, 1, 0.36, 1] }}
            >
              {columns.map((column) => (
                <TableCell key={column.key} className={cn("px-3", column.className)}>
                  {column.cell(row)}
                </TableCell>
              ))}
            </motion.tr>
          ))}
        </TableBody>
      </Table>
      {showPager ? (
        <nav
          aria-label="Table pagination"
          className="flex flex-col gap-3 border-t border-cloud px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm text-muted-foreground">
            Showing {from}–{to} of {data.length}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="xs"
              disabled={currentPage === 1}
              aria-label="Previous page"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              <ChevronLeft className="size-4" strokeWidth={1.75} />
              <span className="hidden sm:inline">Previous</span>
            </Button>
            <span className="px-1 text-sm text-muted-foreground sm:hidden">
              {currentPage} / {pageCount}
            </span>
            <div className="hidden sm:flex sm:flex-wrap sm:items-center sm:gap-1.5">
              {pageNumbers(currentPage, pageCount).map((item, index) =>
                item === "gap" ? (
                  <span key={`gap-${index}`} className="px-1 text-sm text-muted-foreground">
                    …
                  </span>
                ) : (
                  <Button
                    key={item}
                    type="button"
                    variant={item === currentPage ? "default" : "outline"}
                    size="icon-xs"
                    aria-label={`Page ${item}`}
                    aria-current={item === currentPage ? "page" : undefined}
                    onClick={() => setPage(item)}
                  >
                    {item}
                  </Button>
                ),
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="xs"
              disabled={currentPage === pageCount}
              aria-label="Next page"
              onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="size-4" strokeWidth={1.75} />
            </Button>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
