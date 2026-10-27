import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2, MonitorPlay } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchForm, type SearchField } from "@/components/common/SearchForm";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Modal, ConfirmModal } from "@/components/common/Modal";
import { Tag } from "@/components/common/Tag";
import { message } from "@/components/common/Message";
import {
  useRoamingPaths,
  setRoamingPaths,
} from "@/lib/roamingPaths";
import type { RoamingPath } from "@/types";

const typeOptions = [
  { label: "默认路线", value: "default" },
  { label: "自定义", value: "custom" },
];

const searchFields: SearchField[] = [
  {
    name: "keyword",
    label: "路线名称",
    type: "input",
    placeholder: "请输入路线名称",
    width: "200px",
  },
  {
    name: "type",
    label: "类型",
    type: "select",
    options: typeOptions,
    width: "120px",
  },
];

export default function RoamingPaths() {
  const navigate = useNavigate();
  const paths = useRoamingPaths();

  const [searchValues, setSearchValues] = useState<Record<string, string>>({});
  const [editTarget, setEditTarget] = useState<RoamingPath | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RoamingPath | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
  });

  const filteredData = useMemo(() => {
    let list = paths;
    const keyword = (searchValues.keyword || "").trim().toLowerCase();
    if (keyword) {
      list = list.filter((item) => item.name.toLowerCase().includes(keyword));
    }
    if (searchValues.type) {
      list = list.filter((item) => item.type === searchValues.type);
    }
    return list;
  }, [paths, searchValues]);

  const resetForm = () => setForm({ name: "", description: "" });

  const handleEdit = () => {
    if (!editTarget) return;
    if (!form.name.trim()) {
      message.warning("请输入路线名称");
      return;
    }
    setRoamingPaths(
      paths.map((item) =>
        item.id === editTarget.id
          ? {
              ...item,
              name: form.name.trim(),
              description: form.description.trim() || undefined,
            }
          : item,
      ),
    );
    setEditTarget(null);
    resetForm();
    message.success("路线已更新");
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setRoamingPaths(paths.filter((item) => item.id !== deleteTarget.id));
    setDeleteTarget(null);
    message.success("路线已删除");
  };

  const openEdit = (record: RoamingPath) => {
    setEditTarget(record);
    setForm({
      name: record.name,
      description: record.description || "",
    });
  };

  const columns: Column<RoamingPath>[] = [
    {
      key: "name",
      title: "路线名称",
      width: 220,
      render: (record) => (
        <span className="text-admin-text font-medium">{record.name}</span>
      ),
    },
    {
      key: "type",
      title: "类型",
      width: 110,
      render: (record) =>
        record.type === "default" ? (
          <Tag color="blue">默认路线</Tag>
        ) : (
          <Tag color="green">自定义</Tag>
        ),
    },
    {
      key: "duration",
      title: "录制时长",
      width: 110,
      render: (record) => (
        <span className="text-admin-text">约 {record.duration} 秒</span>
      ),
    },
    {
      key: "description",
      title: "说明",
      render: (record) => (
        <span className="text-admin-muted">
          {record.description || "—"}
        </span>
      ),
    },
    {
      key: "createTime",
      title: "创建时间",
      width: 180,
      render: (record) => (
        <span className="text-admin-muted">{record.createTime}</span>
      ),
    },
    {
      key: "actions",
      title: "操作",
      width: 100,
      render: (record) => (
        <div className="flex items-center gap-3">
          <button
            onClick={() => openEdit(record)}
            className={
              record.type === "default"
                ? "text-admin-muted/40 cursor-not-allowed"
                : "text-admin-primary hover:text-blue-600"
            }
            title={record.type === "default" ? "默认路线不可编辑" : "编辑"}
            disabled={record.type === "default"}
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => setDeleteTarget(record)}
            className={
              record.type === "default"
                ? "text-admin-muted/40 cursor-not-allowed"
                : "text-admin-danger hover:text-red-600"
            }
            title={record.type === "default" ? "默认路线不可删除" : "删除"}
            disabled={record.type === "default"}
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  const formBody = (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label className="w-20 text-right text-sm text-admin-muted">路线名称</label>
        <input
          className="input-base flex-1"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="请输入路线名称"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="w-20 text-right text-sm text-admin-muted">录制时长</label>
        <span className="flex-1 text-sm text-admin-text">
          约 {editTarget?.duration ?? 0} 秒（录制生成，不可修改）
        </span>
      </div>
      <div className="flex items-center gap-2">
        <label className="w-20 text-right text-sm text-admin-muted">创建时间</label>
        <span className="flex-1 text-sm text-admin-text">
          {editTarget?.createTime ?? "—"}（系统自动生成）
        </span>
      </div>
      <div className="flex items-start gap-2">
        <label className="w-20 pt-2 text-right text-sm text-admin-muted">说明</label>
        <textarea
          className="input-base flex-1 min-h-20 resize-none"
          rows={3}
          value={form.description}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, description: e.target.value }))
          }
          placeholder="路线经过的主要设备或用途"
        />
      </div>
      <p className="pl-20 text-xs text-admin-muted">
        提示：轨迹、时长与创建时间均由大屏三维视口的录制生成，后台仅可修改路线名称与说明。
      </p>
    </div>
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title="漫游路线"
        subtitle="路线由大屏三维视口录制生成；后台仅可修改名称/说明或删除自定义路线，录制时长与创建时间不可修改"
        extra={
          <button
            className="btn-default flex items-center gap-1"
            onClick={() => navigate("/screen")}
          >
            <MonitorPlay size={15} />
            前往大屏录制
          </button>
        }
      />

      <div className="mt-2 flex min-h-0 flex-1 flex-col gap-2">
        <SearchForm
          fields={searchFields}
          values={searchValues}
          onChange={(name, value) =>
            setSearchValues((prev) => ({ ...prev, [name]: value }))
          }
          onSearch={() => {}}
          onReset={() => setSearchValues({})}
        />
        <div className="min-h-0 flex-1 overflow-auto">
          <DataTable
            columns={columns}
            data={filteredData}
            rowKey="id"
            pageSize={15}
            emptyText="暂无漫游路线"
          />
        </div>
      </div>

      <Modal
        open={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        title="编辑漫游路线"
        width={520}
        footer={
          <>
            <button className="btn-primary" onClick={handleEdit}>
              保存
            </button>
            <button className="btn-default" onClick={() => setEditTarget(null)}>
              取消
            </button>
          </>
        }
      >
        {formBody}
      </Modal>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="删除漫游路线"
        content={`确定删除路线“${deleteTarget?.name ?? ""}”吗？删除后大屏将不再显示该路线。`}
        okText="删除"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
