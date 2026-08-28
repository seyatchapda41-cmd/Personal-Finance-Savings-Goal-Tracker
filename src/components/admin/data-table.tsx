"use client";

import { useMemo, useState } from "react";
import { Icons } from "@/components/admin/icons";

export type Column<T> = {
  key: string;
  header: string;
  /** Rendered cell. Values are placed as text nodes, so nothing is injected. */
  cell: (row: T) => React.ReactNode;
  /** Value used for sorting and searching, when the cell is not plain text. */
  sortValue?: (row: T) => string | number;
  align?: "left" | "right";
};

export type Filter = {
  key: string;
  label: string;
  options: { value: string; label: string }[];
};

export function DataTable<T>({
  rows,
  columns,
  searchKeys,
  searchPlaceholder = "Search…",
  filters,
  filterMatch,
  pageSize = 25,
  empty,
}: {
  rows: T[];
  columns: Column<T>[];
  /** Fields searched by the box. Kept explicit so no hidden field leaks in. */
  searchKeys: (row: T) => string[];
  searchPlaceholder?: string;
  filters?: Filter[];
  filterMatch?: (row: T, key: string, value: string) => boolean;
  pageSize?: number;
  empty?: React.ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<{ key: string; desc: boolean } | null>(null);
  const [page, setPage] = useState(0);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    let result = rows;

    if (needle) {
      result = result.filter((row) =>
        searchKeys(row).some((field) =>
          String(field ?? "").toLowerCase().includes(needle),
        ),
      );
    }

    for (const [key, value] of Object.entries(active)) {
      if (!value || !filterMatch) continue;
      result = result.filter((row) => filterMatch(row, key, value));
    }

    if (sort) {
      const column = columns.find((c) => c.key === sort.key);
      if (column?.sortValue) {
        result = [...result].sort((a, b) => {
          const left = column.sortValue!(a);
          const right = column.sortValue!(b);
          const order =
            typeof left === "number" && typeof right === "number"
              ? left - right
              : String(left).localeCompare(String(right));
          return sort.desc ? -order : order;
        });
      }
    }

    return result;
  }, [rows, query, active, sort, columns, searchKeys, filterMatch]);

  const pages = Math.max(1, Math.ceil(visible.length / pageSize));
  const current = Math.min(page, pages - 1);
  const slice = visible.slice(current * pageSize, current * pageSize + pageSize);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1">
          <span
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--ad-text-mute)" }}
          >
            <Icons.search />
          </span>
          <input
            className="ad-input pl-9"
            value={query}
            placeholder={searchPlaceholder}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(0);
            }}
          />
        </div>
        {(filters ?? []).map((filter) => (
          <select
            key={filter.key}
            className="ad-input w-auto"
            value={active[filter.key] ?? ""}
            onChange={(event) => {
              setActive((prev) => ({
                ...prev,
                [filter.key]: event.target.value,
              }));
              setPage(0);
            }}
            aria-label={filter.label}
          >
            <option value="">{filter.label}: all</option>
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ))}
      </div>

      {visible.length === 0 ? (
        (empty ?? (
          <div className="ad-card px-6 py-12 text-center text-sm ad-muted">
            Nothing matches that search.
          </div>
        ))
      ) : (
        <div className="ad-card overflow-hidden" >
          <div className="overflow-x-auto">
            <table className="ad-table">
              <thead>
                <tr>
                  {columns.map((column) => {
                    const sortable = Boolean(column.sortValue);
                    const isSorted = sort?.key === column.key;
                    return (
                      <th
                        key={column.key}
                        style={{
                          textAlign: column.align === "right" ? "right" : "left",
                        }}
                      >
                        {sortable ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 uppercase tracking-wide"
                            onClick={() =>
                              setSort({
                                key: column.key,
                                desc: isSorted ? !sort!.desc : false,
                              })
                            }
                          >
                            {column.header}
                            <span aria-hidden="true">
                              {isSorted ? (sort!.desc ? "↓" : "↑") : "↕"}
                            </span>
                          </button>
                        ) : (
                          column.header
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {slice.map((row, index) => (
                  <tr key={index}>
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        style={{
                          textAlign: column.align === "right" ? "right" : "left",
                        }}
                      >
                        {column.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 ? (
            <div
              className="flex items-center justify-between gap-3 border-t px-4 py-3 text-xs"
              style={{ borderColor: "var(--ad-border)" }}
            >
              <span className="ad-muted">
                {current * pageSize + 1}–
                {Math.min((current + 1) * pageSize, visible.length)} of{" "}
                {visible.length}
              </span>
              <span className="flex gap-2">
                <button
                  type="button"
                  className="ad-btn"
                  onClick={() => setPage(current - 1)}
                  disabled={current === 0}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="ad-btn"
                  onClick={() => setPage(current + 1)}
                  disabled={current >= pages - 1}
                >
                  Next
                </button>
              </span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
