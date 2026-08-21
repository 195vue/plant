import { useMemo, useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { message } from "@/components/common/Message";
import type { AttributeTemplateDefinition } from "@/lib/attributeTemplateStore";
import { downloadAttributeBatchTemplateBySelection } from "@/lib/attributeBatchImport";

interface AttributeTemplateSelectModalProps {
  open: boolean;
  templates: AttributeTemplateDefinition[];
  /** 当前页签类型：只展示该范围内的模板（设备/管路） */
  scope: "equipment" | "pipeline";
  onClose: () => void;
}

export default function AttributeTemplateSelectModal({
  open,
  templates,
  scope,
  onClose,
}: AttributeTemplateSelectModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(),
  );

  const scopeTemplates = useMemo(
    () => templates.filter((template) => template.scope === scope),
    [templates, scope],
  );
  const allSelected =
    scopeTemplates.length > 0 &&
    scopeTemplates.every((template) => selectedIds.has(template.id));

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds(
      allSelected
        ? new Set()
        : new Set(scopeTemplates.map((template) => template.id)),
    );
  };

  const handleGenerate = () => {
    const selected = scopeTemplates.filter((template) =>
      selectedIds.has(template.id),
    );
    if (selected.length === 0) return;
    downloadAttributeBatchTemplateBySelection(selected);
    message.success(
      `已生成包含${selected.length}个模板的批量导入模板，每个Sheet对应一种模板类型`,
    );
    setSelectedIds(new Set());
    onClose();
  };

  const handleClose = () => {
    setSelectedIds(new Set());
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="下载批量导入模板"
      width="720px"
      maskClosable={false}
      footer={
        <>
          <button className="btn-default" onClick={handleClose}>
            取消
          </button>
          <button
            className="btn-primary"
            disabled={selectedIds.size === 0}
            onClick={handleGenerate}
          >
            生成模板（{selectedIds.size}个）
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-2 rounded border border-blue-200 bg-blue-50 px-4 py-3">
          <FileSpreadsheet size={15} className="mt-0.5 flex-shrink-0 text-blue-600" />
          <div className="text-xs leading-5 text-blue-700">
            请选择需要生成模板的类型。每选择一种类型，生成的Excel中会对应一个Sheet，
            Sheet内已写好消息的标准字段名，可直接在其中填写多{scope === "equipment" ? "台设备" : "条管路"}的数据（一行一个对象）。
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {scopeTemplates.map((template) => {
            const checked = selectedIds.has(template.id);
            return (
              <label
                key={template.id}
                className={`flex cursor-pointer items-center gap-2 rounded border px-3 py-2 transition-colors ${
                  checked
                    ? "border-admin-primary bg-blue-50"
                    : "border-admin-border bg-white hover:border-admin-primary/50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(template.id)}
                  className="flex-shrink-0"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium text-admin-text">
                    {template.name}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-[10px] text-admin-muted">
                    <span>{template.fields.length}个属性</span>
                    <span className="truncate">匹配：{template.matchKey}</span>
                  </span>
                </span>
              </label>
            );
          })}
          {scopeTemplates.length === 0 && (
            <div className="col-span-2 py-6 text-center text-xs text-admin-muted">
              当前页签下暂无模板
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            className="btn-default text-xs"
            onClick={toggleAll}
          >
            {allSelected ? "取消全选" : "全选"}
          </button>
          <span className="text-[11px] text-admin-muted">
            已选 {selectedIds.size} / {scopeTemplates.length} 种模板
          </span>
        </div>
      </div>
    </Modal>
  );
}
