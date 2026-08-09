import { useState, type ReactNode } from "react";
import { Search, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";

export interface SearchField {
  name: string;
  label: string;
  type: "input" | "select" | "dateRange";
  placeholder?: string;
  options?: { label: string; value: string }[];
  width?: string;
  advanced?: boolean; // true = 默认折叠在高级搜索中
}

interface SearchFormProps {
  fields: SearchField[];
  values: Record<string, any>;
  onChange: (name: string, value: any) => void;
  onSearch: () => void;
  onReset: () => void;
  extraButtons?: ReactNode;
}

export function SearchForm({
  fields,
  values,
  onChange,
  onSearch,
  onReset,
  extraButtons,
}: SearchFormProps) {
  const hasAdvanced = fields.some((f) => f.advanced);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const basicFields = fields.filter((f) => !f.advanced);
  const advancedFields = fields.filter((f) => f.advanced);

  // 判断高级搜索中是否存在已填写的值（用于提示已启用的筛选）
  const advancedActiveCount = advancedFields.reduce((count, f) => {
    if (f.type === "dateRange") {
      return count + ((values[`${f.name}_start`] || values[`${f.name}_end`]) ? 1 : 0);
    }
    return count + (values[f.name] ? 1 : 0);
  }, 0);

  const renderField = (field: SearchField) => (
    <div key={field.name} className="flex items-center gap-1.5">
      <label className="text-xs text-admin-text whitespace-nowrap">
        {field.label}
      </label>
      {field.type === "input" && (
        <input
          type="text"
          value={values[field.name] || ""}
          onChange={(e) => onChange(field.name, e.target.value)}
          placeholder={field.placeholder}
          className="input-base"
          style={{ width: field.width || "180px" }}
        />
      )}
      {field.type === "select" && (
        <select
          value={values[field.name] || ""}
          onChange={(e) => onChange(field.name, e.target.value)}
          className="input-base"
          style={{ width: field.width || "140px" }}
        >
          <option value="">全部</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
      {field.type === "dateRange" && (
        <div className="flex items-center gap-1">
          <input
            type="date"
            value={values[`${field.name}_start`] || ""}
            onChange={(e) =>
              onChange(`${field.name}_start`, e.target.value)
            }
            className="input-base"
            style={{ width: "140px" }}
          />
          <span className="text-admin-muted">~</span>
          <input
            type="date"
            value={values[`${field.name}_end`] || ""}
            onChange={(e) => onChange(`${field.name}_end`, e.target.value)}
            className="input-base"
            style={{ width: "140px" }}
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="mb-0 p-3 bg-admin-card border border-admin-border rounded">
      {/* 常用区（一行，flex-wrap） */}
      <div className="flex flex-wrap items-center gap-3">
        {basicFields.map(renderField)}
        {/* 按钮组：ml-auto 推到最右 */}
        <div className="flex items-center gap-2 ml-auto">
          <button className="btn-primary flex items-center gap-1" onClick={onSearch}>
            <Search size={14} />
            搜索
          </button>
          <button className="btn-secondary flex items-center gap-1" onClick={onReset}>
            <RotateCcw size={14} />
            重置
          </button>
          {hasAdvanced && (
            <button
              className="btn-default flex items-center gap-1 text-xs"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? (
                <><ChevronUp size={14} />收起</>
              ) : (
                <><ChevronDown size={14} />高级搜索{advancedActiveCount > 0 && <span className="bg-orange-500 text-white text-[10px] ml-1 px-1 rounded-full">{advancedActiveCount}</span>}</>
              )}
            </button>
          )}
          {extraButtons}
        </div>
      </div>

      {/* 高级搜索区（展开时显示） */}
      {hasAdvanced && showAdvanced && (
        <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-admin-border">
          {advancedFields.map(renderField)}
        </div>
      )}
    </div>
  );
}
