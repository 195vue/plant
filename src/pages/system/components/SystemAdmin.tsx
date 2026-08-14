import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function SystemPage({ children }: { children: ReactNode }) {
  return (
    <div className="system-admin-page flex h-full min-h-0 flex-col gap-2 text-[12px] text-slate-600">
      {children}
    </div>
  );
}

export function QueryPanel({
  fields,
  actions,
}: {
  fields: ReactNode;
  actions: ReactNode;
}) {
  return (
    <div className="shrink-0 rounded-sm border border-slate-200 bg-white px-3 py-2">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">{fields}</div>
      <div className="mt-2 flex flex-wrap items-center gap-2">{actions}</div>
    </div>
  );
}

export function QueryField({
  label,
  children,
  className,
}: {
  label: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex items-center gap-2 whitespace-nowrap", className)}>
      <span className="text-slate-600">{label}</span>
      {children}
    </label>
  );
}

export const compactInputClass =
  "h-8 rounded-sm border border-slate-200 bg-white px-3 text-[12px] text-slate-600 outline-none placeholder:text-slate-300 focus:border-blue-400 disabled:bg-slate-50 disabled:text-slate-400";

export function ActionButton({
  children,
  icon,
  tone = "default",
  disabled,
  onClick,
  className,
}: {
  children: ReactNode;
  icon?: ReactNode;
  tone?: "default" | "primary" | "success" | "warning" | "danger";
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const tones = {
    default: "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-500",
    primary: "border-blue-200 bg-blue-50 text-blue-500 hover:bg-blue-100",
    success: "border-green-200 bg-green-50 text-green-600 hover:bg-green-100",
    warning: "border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100",
    danger: "border-red-100 bg-red-50 text-red-400 hover:bg-red-100",
  };
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center justify-center gap-1.5 rounded-sm border px-3 text-[12px] transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        tones[tone],
        className
      )}
    >
      {icon}
      {children}
    </button>
  );
}

export function LinkButton({
  children,
  danger,
  onClick,
}: {
  children: ReactNode;
  danger?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "whitespace-nowrap text-[12px] hover:opacity-75",
        danger ? "text-red-400" : "text-blue-500"
      )}
    >
      {children}
    </button>
  );
}

export function ToggleSwitch({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        "relative h-[18px] w-9 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-blue-400" : "bg-slate-200"
      )}
    >
      <span
        className={cn(
          "absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white shadow-sm transition-all",
          checked ? "left-5" : "left-[2px]"
        )}
      />
    </button>
  );
}

export function StatusPill({
  enabled,
  onClick,
}: {
  enabled: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-sm px-2 py-0.5 text-[11px]",
        enabled ? "bg-blue-50 text-blue-400" : "bg-slate-100 text-slate-400"
      )}
    >
      {enabled ? "开启" : "关闭"}
    </button>
  );
}

export interface CompactColumn<T> {
  key: string;
  title: ReactNode;
  width?: number | string;
  align?: "left" | "center" | "right";
  render?: (record: T, index: number) => ReactNode;
}

export function CompactTable<T extends { id: string | number }>({
  columns,
  data,
  rowKey = "id",
  selectedKeys,
  onSelectChange,
  minWidth,
  emptyText = "暂无数据",
  pagination = true,
  rowClassName,
}: {
  columns: CompactColumn<T>[];
  data: T[];
  rowKey?: keyof T;
  selectedKeys?: string[];
  onSelectChange?: (keys: string[]) => void;
  minWidth?: number;
  emptyText?: string;
  pagination?: boolean;
  rowClassName?: (record: T, index: number) => string;
}) {
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const current = Math.min(currentPage, totalPages);
  const pageData = useMemo(
    () => data.slice((current - 1) * pageSize, current * pageSize),
    [current, data, pageSize]
  );
  const pageKeys = pageData.map((item) => String(item[rowKey]));
  const allChecked =
    pageKeys.length > 0 && pageKeys.every((key) => selectedKeys?.includes(key));
  const showSelection = !!onSelectChange;

  const changePageSize = (value: number) => {
    setPageSize(value);
    setCurrentPage(1);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-sm border border-slate-200 bg-white">
      <div className="min-h-0 flex-1 overflow-auto">
        <table
          className="w-full border-collapse text-[12px]"
          style={{ minWidth: minWidth || "100%" }}
        >
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="h-10 border-b border-slate-100 text-slate-500">
              {showSelection && (
                <th className="w-10 px-3 text-center font-normal">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={(event) => {
                      if (event.target.checked) {
                        onSelectChange?.(
                          Array.from(new Set([...(selectedKeys || []), ...pageKeys]))
                        );
                      } else {
                        onSelectChange?.(
                          (selectedKeys || []).filter((key) => !pageKeys.includes(key))
                        );
                      }
                    }}
                    className="h-3.5 w-3.5 accent-blue-500"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-3 font-normal whitespace-nowrap",
                    column.align === "center" && "text-center",
                    column.align === "right" && "text-right",
                    (!column.align || column.align === "left") && "text-left"
                  )}
                  style={{ width: column.width }}
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((record, index) => {
              const key = String(record[rowKey]);
              const checked = selectedKeys?.includes(key) || false;
              return (
                <tr
                  key={key}
                  className={cn(
                    "h-10 border-b border-slate-100 text-slate-600 hover:bg-blue-50/40",
                    checked && "bg-blue-50/50",
                    rowClassName?.(record, index)
                  )}
                >
                  {showSelection && (
                    <td className="px-3 text-center">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) =>
                          onSelectChange?.(
                            event.target.checked
                              ? [...(selectedKeys || []), key]
                              : (selectedKeys || []).filter((item) => item !== key)
                          )
                        }
                        className="h-3.5 w-3.5 accent-blue-500"
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        "px-3",
                        column.align === "center" && "text-center",
                        column.align === "right" && "text-right"
                      )}
                    >
                      {column.render
                        ? column.render(record, (current - 1) * pageSize + index)
                        : ((record as Record<string, unknown>)[column.key] as ReactNode)}
                    </td>
                  ))}
                </tr>
              );
            })}
            {!pageData.length && (
              <tr>
                <td
                  colSpan={columns.length + (showSelection ? 1 : 0)}
                  className="h-40 text-center text-slate-400"
                >
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {pagination && data.length > 0 && (
        <div className="flex h-11 shrink-0 items-center justify-end gap-2 border-t border-slate-100 px-3 text-[12px] text-slate-500">
          <span>共 {data.length} 条</span>
          <select
            className="h-7 rounded-sm border border-slate-200 bg-white px-2 outline-none"
            value={pageSize}
            onChange={(event) => changePageSize(Number(event.target.value))}
          >
            <option value={10}>10条/页</option>
            <option value={20}>20条/页</option>
            <option value={50}>50条/页</option>
          </select>
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-sm border border-slate-100 disabled:text-slate-200"
            disabled={current === 1}
            onClick={() => setCurrentPage(Math.max(1, current - 1))}
          >
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => index + 1).map(
            (page) => (
              <button
                type="button"
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  "h-7 min-w-7 rounded-sm px-2",
                  page === current ? "bg-blue-500 text-white" : "border border-slate-100"
                )}
              >
                {page}
              </button>
            )
          )}
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-sm border border-slate-100 disabled:text-slate-200"
            disabled={current === totalPages}
            onClick={() => setCurrentPage(Math.min(totalPages, current + 1))}
          >
            <ChevronRight size={14} />
          </button>
          <span>前往</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={current}
            onChange={(event) =>
              setCurrentPage(
                Math.max(1, Math.min(totalPages, Number(event.target.value) || 1))
              )
            }
            className="h-7 w-10 rounded-sm border border-slate-200 text-center outline-none"
          />
          <span>页</span>
        </div>
      )}
    </div>
  );
}

export function SystemModal({
  open,
  title,
  width = 520,
  children,
  onClose,
  footer,
}: {
  open: boolean;
  title: string;
  width?: number;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
}) {
  const [maximized, setMaximized] = useState(false);
  useEffect(() => {
    if (!open) setMaximized(false);
  }, [open]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          "flex overflow-hidden rounded-sm bg-white shadow-2xl",
          maximized ? "h-[calc(100vh-32px)] flex-col" : "max-h-[90vh] flex-col"
        )}
        style={{ width: maximized ? "calc(100vw - 32px)" : width }}
      >
        <div className="flex h-12 items-center border-b border-slate-100 px-5">
          <h3 className="flex-1 text-[14px] font-medium text-slate-700">{title}</h3>
          <button
            type="button"
            title={maximized ? "还原" : "最大化"}
            onClick={() => setMaximized((current) => !current)}
            className="mr-4 text-slate-300 hover:text-slate-500"
          >
            {maximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button type="button" onClick={onClose} className="text-slate-300 hover:text-slate-500">
            <X size={15} />
          </button>
        </div>
        <div
          className={cn(
            "min-h-0 flex-1 overflow-auto px-5 py-4 text-[12px]",
            !maximized && "max-h-[calc(90vh-104px)]"
          )}
        >
          {children}
        </div>
        {footer && (
          <div className="flex h-14 items-center justify-end gap-2 border-t border-slate-100 px-5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function ModalButton({
  children,
  primary,
  onClick,
}: {
  children: ReactNode;
  primary?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-8 rounded-sm border px-4 text-[12px]",
        primary
          ? "border-blue-500 bg-blue-500 text-white hover:bg-blue-600"
          : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"
      )}
    >
      {children}
    </button>
  );
}

export function FormRow({
  label,
  required,
  children,
  className,
}: {
  label: ReactNode;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex min-h-8 items-start", className)}>
      <label className="w-[92px] shrink-0 pt-2 text-right text-[12px] text-slate-500">
        {required && <span className="mr-1 text-red-400">*</span>}
        {label}
      </label>
      <div className="ml-3 flex-1">{children}</div>
    </div>
  );
}

export function Segmented({
  options,
  value,
  onChange,
}: {
  options: Array<{ label: string; value: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-sm border border-slate-200">
      {options.map((option) => (
        <button
          type="button"
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "h-8 border-r border-slate-200 px-3 text-[12px] last:border-r-0",
            value === option.value
              ? "bg-blue-500 text-white"
              : "bg-white text-slate-600"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function RadioGroup({
  value,
  options,
  onChange,
}: {
  value: string | boolean;
  options: Array<{ label: string; value: string | boolean }>;
  onChange: (value: string | boolean) => void;
}) {
  return (
    <div className="flex min-h-8 items-center gap-5">
      {options.map((option) => (
        <label key={String(option.value)} className="flex items-center gap-1.5">
          <input
            type="radio"
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="accent-blue-500"
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}

export function SystemConfirm({
  open,
  onCancel,
  onConfirm,
  content = "是否删除所选中数据？",
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  content?: ReactNode;
}) {
  return (
    <SystemModal
      open={open}
      onClose={onCancel}
      title="系统提示"
      width={320}
      footer={
        <>
          <ModalButton onClick={onCancel}>取消</ModalButton>
          <ModalButton primary onClick={onConfirm}>
            确定
          </ModalButton>
        </>
      }
    >
      <div className="flex min-h-12 items-center gap-3 px-1">
        <AlertCircle size={16} className="shrink-0 text-amber-500" />
        <span className="text-slate-600">{content}</span>
      </div>
    </SystemModal>
  );
}
