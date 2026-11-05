import { useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Edit,
  FileText,
  Paperclip,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchForm, type SearchField } from "@/components/common/SearchForm";
import { DataTable, type Column } from "@/components/common/DataTable";
import { ConfirmModal, Modal } from "@/components/common/Modal";
import { FormItem } from "@/components/common/UploadBox";
import { Tag } from "@/components/common/Tag";
import { message } from "@/components/common/Message";
import {
  RETROFIT_SYSTEMS,
  type RetrofitRecord,
  type RetrofitSystemKey,
  type RetrofitAttachment,
  useRetrofitRecords,
  addRetrofitRecord,
  updateRetrofitRecord,
  deleteRetrofitRecord,
  retrofitSystemLabel,
} from "@/lib/retrofitRecords";
import { buildStructureTree, type TreeNode } from "@/mock/structureTree";

const searchFields: SearchField[] = [
  {
    name: "system",
    label: "所属系统",
    type: "select",
    width: "150px",
    options: RETROFIT_SYSTEMS.map((s) => ({ label: s.label, value: s.key })),
  },
  {
    name: "keyword",
    label: "关键字",
    type: "input",
    placeholder: "改造内容 / 改造部位",
  },
  { name: "date", label: "改造日期", type: "dateRange" },
];

const SYSTEM_COLOR: Record<RetrofitSystemKey, "blue" | "green" | "orange" | "purple" | "red"> = {
  tech: "blue",
  drain: "green",
  air: "orange",
  oil: "purple",
  fire: "red",
};

interface FormState {
  id?: number;
  system: RetrofitSystemKey;
  title: string;
  date: string;
  location: string;
  content: string;
  attachments: RetrofitAttachment[];
  remark: string;
}

const emptyForm = (): FormState => ({
  system: "tech",
  title: "",
  date: new Date().toISOString().slice(0, 10),
  location: "",
  content: "",
  attachments: [],
  remark: "",
});

/** 根据结构树路径推断所属系统 */
function guessSystem(pathText: string): RetrofitSystemKey | null {
  if (/消防/.test(pathText)) return "fire";
  if (/技术供水|机组供水|公用供水|冷却水|供水/.test(pathText)) return "tech";
  if (/排水/.test(pathText)) return "drain";
  if (/气/.test(pathText)) return "air";
  if (/油/.test(pathText)) return "oil";
  return null;
}

function fileToDataUrl(file: globalThis.File): Promise<RetrofitAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
        dataUrl: String(reader.result),
      });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function downloadAttachment(a: RetrofitAttachment) {
  const link = document.createElement("a");
  link.href = a.dataUrl;
  link.download = a.name;
  link.click();
}

/** 表单内嵌的管路结构树选择器（不弹新窗，避免嵌套弹窗） */
function StructureNodePicker({
  value,
  onPick,
}: {
  value: string;
  onPick: (path: TreeNode[]) => void;
}) {
  const tree = useMemo(() => buildStructureTree("pipeline"), []);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set([1, 2, 3]));
  const [keyword, setKeyword] = useState("");

  const matched = useMemo(() => {
    if (!keyword.trim()) return null;
    const k = keyword.trim().toLowerCase();
    const hit = new Set<number>();
    const walk = (nodes: TreeNode[], ancestors: number[]) => {
      nodes.forEach((n) => {
        const selfHit = n.name.toLowerCase().includes(k) || n.kks.toLowerCase().includes(k);
        if (selfHit) {
          hit.add(n.id);
          ancestors.forEach((a) => hit.add(a));
        }
        if (n.children) walk(n.children, [...ancestors, n.id]);
      });
    };
    walk(tree, []);
    return hit;
  }, [keyword, tree]);

  const toggle = (id: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const renderNode = (node: TreeNode, level: number): React.ReactNode => {
    if (matched && !matched.has(node.id)) return null;
    const hasChildren = !!node.children?.length;
    const isOpen = expanded.has(node.id);
    return (
      <div key={node.id}>
        <div
          className="flex items-center gap-1 px-1.5 py-[3px] rounded text-xs text-admin-text hover:bg-blue-50 cursor-pointer"
          style={{ paddingLeft: `${level * 12 + 4}px` }}
          onClick={() => {
            const path: TreeNode[] = [];
            const find = (nodes: TreeNode[], trail: TreeNode[]): boolean => {
              for (const n of nodes) {
                const next = [...trail, n];
                if (n.id === node.id) {
                  path.push(...next);
                  return true;
                }
                if (n.children && find(n.children, next)) return true;
              }
              return false;
            };
            find(tree, []);
            onPick(path);
            setOpen(false);
          }}
        >
          {hasChildren ? (
            <button
              type="button"
              className="text-admin-muted"
              onClick={(e) => {
                e.stopPropagation();
                toggle(node.id);
              }}
            >
              {isOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            </button>
          ) : (
            <span className="w-[11px]" />
          )}
          <span className="truncate">{node.name}</span>
          {node.kks && <span className="text-admin-muted text-[10px] shrink-0">{node.kks}</span>}
        </div>
        {hasChildren && isOpen && node.children!.map((c) => renderNode(c, level + 1))}
      </div>
    );
  };

  return (
    <div>
      <div className="flex gap-2">
        <input
          className="input-base flex-1"
          value={value}
          readOnly
          placeholder="请从结构树选择改造部位"
          onClick={() => setOpen((v) => !v)}
        />
        <button type="button" className="btn-default" onClick={() => setOpen((v) => !v)}>
          {open ? "收起" : "选择"}
        </button>
        {value && (
          <button type="button" className="btn-default text-red-500" onClick={() => onPick([])}>
            清空
          </button>
        )}
      </div>
      {open && (
        <div className="mt-2 border border-admin-border rounded-md overflow-hidden">
          <div className="p-2 border-b border-admin-border">
            <div className="relative">
              <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-admin-muted" />
              <input
                className="input-base text-xs pl-6"
                placeholder="搜索名称 / KKS"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
          </div>
          <div className="h-[200px] overflow-auto p-1">
            {tree.map((n) => renderNode(n, 0))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RetrofitList() {
  const records = useRetrofitRecords();
  const [searchValues, setSearchValues] = useState<Record<string, string>>({});
  const [appliedSearch, setAppliedSearch] = useState<Record<string, string>>({});
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [editing, setEditing] = useState<RetrofitRecord | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [deleteIds, setDeleteIds] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredData = useMemo(() => {
    return records.filter((r) => {
      if (appliedSearch.system && r.system !== appliedSearch.system) return false;
      if (appliedSearch.keyword) {
        const k = appliedSearch.keyword.toLowerCase();
        if (
          !r.title.toLowerCase().includes(k) &&
          !r.location.toLowerCase().includes(k) &&
          !r.content.toLowerCase().includes(k)
        )
          return false;
      }
      if (appliedSearch.date_start && r.date < appliedSearch.date_start) return false;
      if (appliedSearch.date_end && r.date > appliedSearch.date_end) return false;
      return true;
    });
  }, [records, appliedSearch]);

  const summary = useMemo(() => {
    const bySystem = RETROFIT_SYSTEMS.map((s) => ({
      ...s,
      count: records.filter((r) => r.system === s.key).length,
    }));
    return {
      total: records.length,
      withFiles: records.filter((r) => r.attachments.length).length,
      bySystem,
    };
  }, [records]);

  const openForm = (record?: RetrofitRecord) => {
    setEditing(record || null);
    setForm(
      record
        ? {
            id: record.id,
            system: record.system,
            title: record.title,
            date: record.date,
            location: record.location,
            content: record.content,
            attachments: [...record.attachments],
            remark: record.remark || "",
          }
        : emptyForm()
    );
    setFormOpen(true);
  };

  const submitForm = () => {
    if (!form.title.trim()) return message.warning("请输入改造内容");
    if (!form.date) return message.warning("请选择改造日期");
    if (!form.content.trim()) return message.warning("请输入改造描述");
    const payload = {
      system: form.system,
      title: form.title.trim(),
      date: form.date,
      location: form.location.trim(),
      content: form.content.trim(),
      attachments: form.attachments,
      remark: form.remark.trim(),
    };
    if (editing) {
      updateRetrofitRecord(editing.id, payload);
      message.success("改造资料已修改");
    } else {
      addRetrofitRecord({ ...payload, createdBy: "系统管理员" });
      message.success("改造资料已新增");
    }
    setFormOpen(false);
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    const next: RetrofitAttachment[] = [];
    for (const f of Array.from(files)) {
      if (f.size > 10 * 1024 * 1024) {
        message.warning(`${f.name} 超过 10MB，已跳过`);
        continue;
      }
      try {
        next.push(await fileToDataUrl(f));
      } catch {
        message.error(`${f.name} 读取失败`);
      }
    }
    setForm((prev) => ({ ...prev, attachments: [...prev.attachments, ...next] }));
  };

  const columns: Column<RetrofitRecord>[] = [
    {
      key: "system",
      title: "所属系统",
      width: 110,
      render: (r) => <Tag color={SYSTEM_COLOR[r.system]}>{retrofitSystemLabel(r.system)}</Tag>,
    },
    {
      key: "title",
      title: "改造内容",
      render: (r) => <span className="font-medium">{r.title}</span>,
    },
    {
      key: "location",
      title: "改造部位",
      width: 180,
      render: (r) => r.location || "-",
    },
    { key: "date", title: "改造日期", width: 110 },
    {
      key: "attachments",
      title: "资料",
      width: 130,
      render: (r) =>
        r.attachments.length ? (
          <button
            className="btn-link flex items-center gap-1"
            onClick={() => downloadAttachment(r.attachments[0])}
            title={r.attachments.map((a) => a.name).join("、")}
          >
            <Paperclip size={12} />
            {r.attachments.length} 个附件
          </button>
        ) : (
          <span className="text-admin-muted">-</span>
        ),
    },
    { key: "createdAt", title: "创建时间", width: 165 },
    {
      key: "actions",
      title: "操作",
      width: 150,
      render: (r) => (
        <div className="flex items-center gap-3">
          <button className="btn-link flex items-center gap-1" onClick={() => openForm(r)}>
            <Edit size={13} /> 修改
          </button>
          <button className="btn-link-danger" onClick={() => setDeleteIds([r.id])}>
            删除
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col gap-3">
      <PageHeader
        title="改造资料"
        subtitle={`共 ${summary.total} 条记录，其中 ${summary.withFiles} 条附带资料`}
      />

      <SearchForm
        fields={searchFields}
        values={searchValues}
        onChange={(name, value) =>
          setSearchValues((current) => ({ ...current, [name]: value }))
        }
        onSearch={() => setAppliedSearch(searchValues)}
        onReset={() => {
          setSearchValues({});
          setAppliedSearch({});
        }}
      />

      <div className="admin-card flex-1 min-h-0 p-3 flex flex-col">
        {/* 系统分布概览 */}
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-admin-muted">
          {summary.bySystem.map((s) => (
            <span key={s.key} className="flex items-center gap-1">
              <span className="text-admin-text">{s.label}</span>
              <span className="text-admin-primary font-medium">{s.count}</span>
            </span>
          ))}
        </div>

        <div className="mb-3 flex items-center gap-2">
          <button className="btn-primary flex items-center gap-1" onClick={() => openForm()}>
            <Plus size={14} /> 新增
          </button>
          <button
            className="btn-default flex items-center gap-1 text-red-500"
            disabled={!selectedKeys.length}
            onClick={() => setDeleteIds(selectedKeys.map(Number))}
          >
            <Trash2 size={14} /> 批量删除
          </button>
        </div>

        <div className="flex-1 min-h-0">
          <DataTable
            columns={columns}
            data={filteredData}
            selectable
            selectedKeys={selectedKeys}
            onSelectChange={setSelectedKeys}
            emptyText="暂无符合条件的改造记录"
          />
        </div>
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "修改改造资料" : "新增改造资料"}
        width={720}
        footer={
          <>
            <button className="btn-default" onClick={() => setFormOpen(false)}>
              取消
            </button>
            <button className="btn-primary" onClick={submitForm}>
              确定
            </button>
          </>
        }
      >
        <FormItem label="所属系统" required>
          <select
            className="input-base"
            value={form.system}
            onChange={(e) =>
              setForm((c) => ({ ...c, system: e.target.value as RetrofitSystemKey }))
            }
          >
            {RETROFIT_SYSTEMS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </FormItem>

        <FormItem label="改造部位">
          <StructureNodePicker
            value={form.location}
            onPick={(path) => {
              if (!path.length) {
                setForm((c) => ({ ...c, location: "" }));
                return;
              }
              const text = path.map((n) => n.name).join(" / ");
              const guessed = guessSystem(text);
              setForm((c) => ({
                ...c,
                location: text,
                system: guessed ?? c.system,
              }));
            }}
          />
        </FormItem>

        <FormItem label="改造日期" required>
          <input
            type="date"
            className="input-base"
            value={form.date}
            onChange={(e) => setForm((c) => ({ ...c, date: e.target.value }))}
          />
        </FormItem>

        <FormItem label="改造内容" required>
          <input
            className="input-base"
            value={form.title}
            placeholder="简要描述本次改造事项，例如：1#机组技术供水主管扩容改造"
            onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))}
          />
        </FormItem>

        <FormItem label="改造描述" required>
          <textarea
            className="input-base min-h-20 resize-none"
            value={form.content}
            placeholder="填写改造方案、材料、工艺或改造要点"
            onChange={(e) => setForm((c) => ({ ...c, content: e.target.value }))}
          />
        </FormItem>

        <FormItem label="上传资料" hint="支持 PDF / Word / 图片，单个文件不超过 10MB">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              handleFileUpload(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            className="btn-default flex items-center gap-1"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={14} /> 选择文件
          </button>
          {form.attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {form.attachments.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-gray-50 border border-admin-border rounded px-2 py-1 text-xs"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <FileText size={13} className="text-admin-primary shrink-0" />
                    <span className="truncate">{a.name}</span>
                    <span className="text-admin-muted shrink-0">({formatSize(a.size)})</span>
                  </div>
                  <button
                    type="button"
                    className="btn-link-danger flex items-center gap-0.5 shrink-0"
                    onClick={() =>
                      setForm((c) => ({
                        ...c,
                        attachments: c.attachments.filter((_, idx) => idx !== i),
                      }))
                    }
                  >
                    <X size={11} /> 移除
                  </button>
                </div>
              ))}
            </div>
          )}
        </FormItem>

        <FormItem label="备注">
          <textarea
            className="input-base min-h-16 resize-none"
            value={form.remark}
            placeholder="验收情况、后续计划等补充说明"
            onChange={(e) => setForm((c) => ({ ...c, remark: e.target.value }))}
          />
        </FormItem>
      </Modal>

      <ConfirmModal
        open={deleteIds.length > 0}
        title="删除改造资料"
        content={`确定删除选中的 ${deleteIds.length} 条改造资料吗？删除后不可恢复。`}
        danger
        okText="确认删除"
        onConfirm={() => {
          deleteIds.forEach((id) => deleteRetrofitRecord(id));
          setDeleteIds([]);
          setSelectedKeys([]);
          message.success("改造资料已删除");
        }}
        onCancel={() => setDeleteIds([])}
      />
    </div>
  );
}
