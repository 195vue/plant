import { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
} from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { message } from "@/components/common/Message";
import type { AttributeTemplateDefinition } from "@/lib/attributeTemplateStore";
import {
  applyAttributeBatchRows,
  downloadAttributeBatchTemplate,
  parseAttributeBatchFile,
  type AttributeBatchImportRow,
} from "@/lib/attributeBatchImport";

interface AttributeBatchImportModalProps {
  open: boolean;
  templates: AttributeTemplateDefinition[];
  onClose: () => void;
  onImported: () => void;
}

const statusClass: Record<AttributeBatchImportRow["status"], string> = {
  matched: "bg-green-50 text-green-700 border-green-200",
  unmatched: "bg-gray-50 text-gray-600 border-gray-200",
  unit_mismatch: "bg-orange-50 text-orange-700 border-orange-200",
  duplicate: "bg-red-50 text-red-700 border-red-200",
  template_mismatch: "bg-amber-50 text-amber-700 border-amber-200",
  incomplete: "bg-red-50 text-red-700 border-red-200",
};

export default function AttributeBatchImportModal({
  open,
  templates,
  onClose,
  onImported,
}: AttributeBatchImportModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<AttributeBatchImportRow[]>([]);
  const [error, setError] = useState("");
  const [parsing, setParsing] = useState(false);
  const [overwriteExisting, setOverwriteExisting] = useState(false);

  const summary = useMemo(() => {
    const groups = rows.reduce((result, row) => {
      const key = `${row.scopeLabel}:${row.kks || `row-${row.rowNumber}`}`;
      const current = result.get(key) || [];
      current.push(row);
      result.set(key, current);
      return result;
    }, new Map<string, AttributeBatchImportRow[]>());

    let success = 0;
    let partial = 0;
    let failed = 0;
    groups.forEach((groupRows) => {
      const matched = groupRows.filter((row) => row.canImport).length;
      if (matched === groupRows.length) success += 1;
      else if (matched > 0) partial += 1;
      else failed += 1;
    });

    return {
      objects: groups.size,
      success,
      partial,
      failed,
      matchedRows: rows.filter((row) => row.canImport).length,
      errorRows: rows.filter((row) => !row.canImport).length,
    };
  }, [rows]);

  const reset = () => {
    setFileName("");
    setRows([]);
    setError("");
    setParsing(false);
    setOverwriteExisting(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const close = () => {
    reset();
    onClose();
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;
    if (!/\.xlsx?$/i.test(file.name)) {
      setError("仅支持 .xlsx 或 .xls 格式");
      setRows([]);
      return;
    }
    setFileName(file.name);
    setRows([]);
    setError("");
    setParsing(true);
    try {
      setRows(await parseAttributeBatchFile(file, templates));
    } catch (parseError) {
      setError(
        parseError instanceof Error ? parseError.message : "文件解析失败",
      );
    } finally {
      setParsing(false);
    }
  };

  const handleImport = () => {
    if (summary.matchedRows === 0) {
      message.warning("没有通过校验的属性数据可导入");
      return;
    }
    const result = applyAttributeBatchRows(rows, overwriteExisting);
    if (result.importedFields === 0 && result.skippedExisting > 0) {
      message.warning(
        `没有写入新值，${result.skippedExisting}项已有值。如需替换请勾选“覆盖已有属性值”`,
      );
      return;
    }
    message.success(
      `批量导入完成：${result.importedObjects}个对象，${result.importedFields}项属性${
        result.skippedExisting > 0
          ? `，跳过${result.skippedExisting}项已有值`
          : ""
      }`,
    );
    onImported();
    close();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="属性批量导入"
      width="1120px"
      maskClosable={false}
      footer={
        <>
          <button className="btn-default" onClick={close}>
            取消
          </button>
          <button
            className="btn-primary"
            disabled={parsing || summary.matchedRows === 0}
            onClick={handleImport}
          >
            确认导入 {summary.matchedRows > 0 ? `(${summary.matchedRows}项)` : ""}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between rounded border border-blue-200 bg-blue-50 px-4 py-3">
          <div>
            <div className="text-sm font-medium text-blue-800">批量填报流程</div>
            <div className="mt-1 text-xs leading-5 text-blue-700">
              1. 下载最新模板；2. 从Sheet2复制所需模板行到Sheet1并填写KKS编码和属性值；
              3. 上传后校验并确认导入。系统只写入内部模板已存在且单位一致的属性。
            </div>
          </div>
          <button
            type="button"
            className="btn-default ml-4 flex flex-shrink-0 items-center gap-1 text-xs"
            onClick={() => downloadAttributeBatchTemplate(templates)}
          >
            <Download size={13} />
            下载最新模板
          </button>
        </div>

        <div className="grid grid-cols-[320px_1fr] gap-4">
          <div className="space-y-3">
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(event) => handleFile(event.target.files?.[0] || null)}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex min-h-[150px] w-full flex-col items-center justify-center rounded border-2 border-dashed border-admin-border bg-gray-50 text-center transition-colors hover:border-admin-primary hover:bg-blue-50"
            >
              {parsing ? (
                <Loader2 size={30} className="mb-2 animate-spin text-admin-primary" />
              ) : (
                <Upload size={30} className="mb-2 text-admin-primary" />
              )}
              <span className="text-sm font-medium text-admin-text">
                {parsing ? "正在解析并校验" : "点击选择Excel文件"}
              </span>
              <span className="mt-1 max-w-[260px] truncate text-xs text-admin-muted">
                {fileName || "支持 .xlsx、.xls，文件大小不超过20MB"}
              </span>
            </button>

            <label className="flex cursor-pointer items-center gap-2 rounded border border-admin-border px-3 py-2 text-xs text-admin-text">
              <input
                type="checkbox"
                checked={overwriteExisting}
                onChange={(event) => setOverwriteExisting(event.target.checked)}
              />
              覆盖已有属性值
            </label>
            <div className="text-[11px] leading-5 text-admin-muted">
              默认仅填充空值。勾选后，通过校验的值将覆盖对象原有属性值；未匹配、单位不一致及重复数据不会写入。
            </div>

            {error && (
              <div className="flex gap-2 rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle size={15} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-5 gap-2">
            {[
              { label: "识别对象", value: summary.objects, color: "text-blue-600" },
              { label: "全部通过", value: summary.success, color: "text-green-600" },
              { label: "部分通过", value: summary.partial, color: "text-amber-600" },
              { label: "全部失败", value: summary.failed, color: "text-red-600" },
              { label: "可导入属性", value: summary.matchedRows, color: "text-violet-600" },
            ].map((item) => (
              <div key={item.label} className="rounded border border-admin-border bg-gray-50 p-3 text-center">
                <div className={`text-xl font-semibold ${item.color}`}>{item.value}</div>
                <div className="mt-1 text-[10px] text-admin-muted">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded border border-admin-border">
          <div className="flex items-center justify-between border-b border-admin-border bg-gray-50 px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-admin-text">
              <FileSpreadsheet size={14} className="text-green-600" />
              导入校验预览
            </div>
            <div className="flex items-center gap-3 text-[10px] text-admin-muted">
              <span className="flex items-center gap-1">
                <CheckCircle2 size={11} className="text-green-600" />
                已匹配 {summary.matchedRows}
              </span>
              <span className="flex items-center gap-1">
                <AlertCircle size={11} className="text-red-500" />
                异常 {summary.errorRows}
              </span>
            </div>
          </div>
          <div className="max-h-[330px] overflow-auto">
            <table className="w-full table-fixed text-xs">
              <thead className="sticky top-0 z-10 bg-gray-50 text-admin-muted">
                <tr className="border-b border-admin-border">
                  <th className="w-12 px-2 py-2 text-center font-medium">行</th>
                  <th className="w-16 px-2 py-2 text-left font-medium">类型</th>
                  <th className="w-44 px-2 py-2 text-left font-medium">KKS编码</th>
                  <th className="w-32 px-2 py-2 text-left font-medium">对象名称</th>
                  <th className="w-28 px-2 py-2 text-left font-medium">属性名称</th>
                  <th className="w-28 px-2 py-2 text-left font-medium">属性值</th>
                  <th className="w-20 px-2 py-2 text-left font-medium">单位</th>
                  <th className="w-24 px-2 py-2 text-center font-medium">匹配结果</th>
                  <th className="px-2 py-2 text-left font-medium">说明</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.rowNumber} className="border-b border-admin-border last:border-0">
                    <td className="px-2 py-2 text-center text-admin-muted">{row.rowNumber}</td>
                    <td className="px-2 py-2">{row.scopeLabel}</td>
                    <td className="truncate px-2 py-2 font-mono text-[11px]" title={row.kks}>{row.kks || "—"}</td>
                    <td className="truncate px-2 py-2" title={row.objectName}>{row.objectName || "—"}</td>
                    <td className="truncate px-2 py-2" title={row.attributeName}>{row.attributeName || "—"}</td>
                    <td className="truncate px-2 py-2" title={row.value}>{row.value || "—"}</td>
                    <td className="px-2 py-2">{row.unit || "—"}</td>
                    <td className="px-2 py-2 text-center">
                      <span className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] ${statusClass[row.status]}`}>
                        {row.statusLabel}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-[11px] text-admin-muted">{row.message}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-14 text-center text-admin-muted">
                      上传文件后显示逐行校验结果
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  );
}
