"use client";

import React, { useState } from "react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  searchKeys?: Array<keyof T>;
  emptyMessage?: string;
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  searchPlaceholder = "Filter records...",
  searchKeys = [],
  emptyMessage = "No matching records found in this view.",
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");

  const filteredData = React.useMemo(() => {
    if (!query.trim() || searchKeys.length === 0) return data;
    const lower = query.toLowerCase();
    return data.filter((row) =>
      searchKeys.some((k) => String(row[k] ?? "").toLowerCase().includes(lower))
    );
  }, [data, query, searchKeys]);

  return (
    <div className="rounded-2xl border border-[var(--ev-border-soft)] bg-[var(--ev-surface)] overflow-hidden shadow-[var(--ev-shadow)]">
      {searchKeys.length > 0 && (
        <div className="p-4 border-b border-[var(--ev-border-soft)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full sm:w-80 px-3.5 py-2.5 rounded-xl bg-[var(--ev-surface-2)] border border-[var(--ev-border)] text-sm text-[var(--ev-ink)] placeholder:text-[var(--ev-muted)] focus:outline-none focus:border-[var(--ev-cyan)]"
          />
          <span className="text-xs text-[var(--ev-muted)]">
            Showing <strong className="text-[var(--ev-ink)]">{filteredData.length}</strong> of {data.length} records
          </span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--ev-inset)] border-b border-[var(--ev-border-soft)] text-[11px] font-bold uppercase tracking-wider text-[var(--ev-muted)]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`py-3.5 px-4 ${
                    col.align === "right"
                      ? "text-right"
                      : col.align === "center"
                      ? "text-center"
                      : "text-left"
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--ev-border-soft)] text-sm text-[var(--ev-ink)]">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-[var(--ev-muted)]">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filteredData.map((row, i) => (
                <tr key={row.id || i} className="hover:bg-[var(--ev-inset)] transition-colors">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`py-3.5 px-4 ${
                        col.align === "right"
                          ? "text-right"
                          : col.align === "center"
                          ? "text-center"
                          : "text-left"
                      }`}
                    >
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
