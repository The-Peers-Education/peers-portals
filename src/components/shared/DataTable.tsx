"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
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

export function DataTable<T>({
  columns,
  data,
  rowKey,
  empty,
  tableClassName,
}: {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string;
  empty?: ReactNode;
  tableClassName?: string;
}) {
  const reduce = useReducedMotion();

  if (data.length === 0) {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed bg-muted/30 px-4 py-8 text-sm text-muted-foreground">
        {empty ?? "No records found."}
      </div>
    );
  }

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
          {data.map((row, index) => (
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
    </div>
  );
}
