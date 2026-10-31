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
    <div className="rounded-2xl bg-[#12141C] border border-white/[0.08] overflow-hidden shadow-lg">
      {searchKeys.length > 0 && (
        <div className="p-4 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full sm:w-80 px-3.5 py-2 rounded-xl bg-[#090A0F] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <span className="text-[11px] text-slate-400">
            Showing <strong className="text-white">{filteredData.length}</strong> of {data.length} records
          </span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0D0F17] border-b border-white/[0.08] text-[11px] font-semibold uppercase tracking-wider text-slate-400">
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
          <tbody className="divide-y divide-white/[0.06] text-xs text-slate-200">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filteredData.map((row, i) => (
                <tr key={row.id || i} className="hover:bg-white/[0.03] transition-colors">
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
