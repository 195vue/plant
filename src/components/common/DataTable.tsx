import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Tag } from "./Tag";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";

export interface Column<T> {
  key: string;
  title: ReactNode;
  width?: number | string;
  render?: (record: T, index: number) => ReactNode;
  selectable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey?: string;
  selectable?: boolean;
  selectedKeys?: string[];
  onSelectChange?: (keys: string[]) => void;
  pageSize?: number;
  showPagination?: boolean;
  emptyText?: string;
  onRowClick?: (record: T) => void;
  activeRowId?: string | number | null;
  rowClassName?: (record: T) => string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  rowKey = "id",
  selectable = false,
  selectedKeys = [],
  onSelectChange,
  pageSize = 10,
  showPagination = true,
  emptyText = "暂无数据",
  onRowClick,
  activeRowId,
  rowClassName,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageNum, setCurrentPageNum] = useState(pageSize);

  const total = data.length;
  const pageNum = Math.max(1, Math.ceil(total / currentPageNum));
  const current = Math.min(currentPage, pageNum);
  const start = (current - 1) * currentPageNum;
  const pageData = data.slice(start, start + currentPageNum);

  const allKeys = data.map((item) => String(item[rowKey]));
  const allSelected = selectedKeys.length === allKeys.length && allKeys.length > 0;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectChange?.(allKeys);
    } else {
      onSelectChange?.([]);
    }
  };

  const handleSelect = (key: string, checked: boolean) => {
    if (checked) {
      onSelectChange?.([...selectedKeys, key]);
    } else {
      onSelectChange?.(selectedKeys.filter((k) => k !== key));
    }
  };

  const totalWidth = columns.reduce(
    (sum, col) => sum + (typeof col.width === "number" ? col.width : 0),
    0
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto border border-admin-border rounded">
        <table className="w-full text-sm" style={{ minWidth: totalWidth || "100%" }}>
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {selectable && (
                <th className="w-10 px-2 py-3 text-center border-b border-admin-border">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="cursor-pointer"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-3 py-3 text-left font-medium text-admin-muted border-b border-admin-border whitespace-nowrap"
                  style={{ width: col.width }}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="text-center py-16 text-admin-muted"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Inbox size={40} className="text-gray-300" />
                    <span>{emptyText}</span>
                  </div>
                </td>
              </tr>
            ) : (
              pageData.map((record, index) => {
                const key = String(record[rowKey]);
                const selected = selectedKeys.includes(key);
                const isActive = activeRowId != null && key === String(activeRowId);
                return (
                  <tr
                    key={key}
                    className={cn(
                      "border-b border-admin-border hover:bg-blue-50 transition-colors",
                      selected && "bg-blue-50",
                      isActive && "bg-blue-100/70",
                      onRowClick && "cursor-pointer",
                      rowClassName?.(record)
                    )}
                    onClick={() => onRowClick?.(record)}
                  >
                    {selectable && (
                      <td
                        className="w-10 px-2 py-3 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(e) => handleSelect(key, e.target.checked)}
                          className="cursor-pointer"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className="px-3 py-3 text-admin-text whitespace-nowrap"
                        style={{ width: col.width }}
                      >
                        {col.render
                          ? col.render(record, start + index)
                          : record[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {showPagination && total > 0 && (
        <div className="flex items-center justify-between mt-3 px-1">
          <div className="text-sm text-admin-muted">共 {total} 条</div>
          <div className="flex items-center gap-2">
            <select
              value={currentPageNum}
              onChange={(e) => {
                setCurrentPageNum(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-admin-border rounded px-2 py-1 text-sm focus:outline-none focus:border-admin-primary"
            >
              <option value={10}>10条/页</option>
              <option value={20}>20条/页</option>
              <option value={50}>50条/页</option>
            </select>
            <button
              onClick={() => setCurrentPage(Math.max(1, current - 1))}
              disabled={current === 1}
              className="p-1 rounded border border-admin-border disabled:opacity-50 hover:text-admin-primary hover:border-admin-primary transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-admin-text">
              {current} / {pageNum}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(pageNum, current + 1))}
              disabled={current === pageNum}
              className="p-1 rounded border border-admin-border disabled:opacity-50 hover:text-admin-primary hover:border-admin-primary transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
