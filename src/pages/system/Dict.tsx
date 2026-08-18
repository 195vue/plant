import { useMemo, useState } from "react";
import { Database, Download, Edit, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchForm, type SearchField } from "@/components/common/SearchForm";
import { DataTable, type Column } from "@/components/common/DataTable";
import { ConfirmModal, Modal } from "@/components/common/Modal";
import { FormItem } from "@/components/common/UploadBox";
import { StatusTag } from "@/components/common/Tag";
import { message } from "@/components/common/Message";
import {
  useSystemStore,
  type DictionaryType,
  type EnableStatus,
} from "@/store/system";
import { exportCsv } from "@/lib/exportCsv";

const searchFields: SearchField[] = [
  { name: "name", label: "字典名称", type: "input", placeholder: "请输入字典名称" },
  { name: "type", label: "字典类型", type: "input", placeholder: "请输入字典类型" },
  {
    name: "status",
    label: "状态",
    type: "select",
    width: "110px",
    options: [
      { label: "启用", value: "enabled" },
      { label: "停用", value: "disabled" },
    ],
  },
  { name: "createdAt", label: "创建时间", type: "dateRange", advanced: true },
];

export default function DictManage() {
  const navigate = useNavigate();
  const {
    dictionaryTypes,
    addDictionaryType,
    updateDictionaryType,
    deleteDictionaryTypes,
  } = useSystemStore();
  const [searchValues, setSearchValues] = useState<Record<string, string>>({});
  const [appliedSearch, setAppliedSearch] = useState<Record<string, string>>({});
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [editing, setEditing] = useState<DictionaryType | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteIds, setDeleteIds] = useState<number[]>([]);
  const [form, setForm] = useState({
    name: "",
    type: "",
    status: "enabled" as EnableStatus,
    remark: "",
  });

  const filteredData = useMemo(
    () =>
      dictionaryTypes.filter((item) => {
        if (appliedSearch.name && !item.name.includes(appliedSearch.name)) return false;
        if (appliedSearch.type && !item.type.includes(appliedSearch.type)) return false;
        if (appliedSearch.status && item.status !== appliedSearch.status) return false;
        if (
          appliedSearch.createdAt_start &&
          item.createdAt.slice(0, 10) < appliedSearch.createdAt_start
        ) {
          return false;
        }
        if (
          appliedSearch.createdAt_end &&
          item.createdAt.slice(0, 10) > appliedSearch.createdAt_end
        ) {
          return false;
        }
        return true;
      }),
    [appliedSearch, dictionaryTypes]
  );

  const openForm = (record?: DictionaryType) => {
    setEditing(record || null);
    setForm(
      record
        ? {
            name: record.name,
            type: record.type,
            status: record.status,
            remark: record.remark,
          }
        : { name: "", type: "", status: "enabled", remark: "" }
    );
    setFormOpen(true);
  };

  const submitForm = () => {
    if (!form.name.trim()) return message.warning("请输入字典名称");
    if (!form.type.trim()) return message.warning("请输入字典类型");
    if (!/^[a-z][a-z0-9_]*$/.test(form.type.trim())) {
      return message.warning("字典类型应以小写字母开头，仅包含小写字母、数字和下划线");
    }
    if (
      dictionaryTypes.some(
        (item) => item.type === form.type.trim() && item.id !== editing?.id
      )
    ) {
      return message.warning("字典类型已存在");
    }
    const payload = {
      name: form.name.trim(),
      type: form.type.trim(),
      status: form.status,
      remark: form.remark.trim(),
    };
    if (editing) {
      updateDictionaryType(editing.id, payload);
      message.success("字典信息已修改");
    } else {
      addDictionaryType({
        id: Math.max(0, ...dictionaryTypes.map((item) => item.id)) + 1,
        ...payload,
        createdAt: new Date().toLocaleString("zh-CN", { hour12: false }),
      });
      message.success("字典已新增");
    }
    setFormOpen(false);
  };

  const columns: Column<DictionaryType>[] = [
    { key: "id", title: "字典编号", width: 100 },
    { key: "name", title: "字典名称", width: 170 },
    { key: "type", title: "字典类型", width: 230 },
    {
      key: "status",
      title: "状态",
      width: 100,
      render: (record) => (
        <button
          onClick={() =>
            updateDictionaryType(record.id, {
              status: record.status === "enabled" ? "disabled" : "enabled",
            })
          }
        >
          <StatusTag status={record.status} />
        </button>
      ),
    },
    { key: "remark", title: "备注", width: 260, render: (record) => record.remark || "-" },
    { key: "createdAt", title: "创建时间", width: 180 },
    {
      key: "actions",
      title: "操作",
      width: 220,
      render: (record) => (
        <div className="flex items-center gap-3">
          <button className="btn-link flex items-center gap-1" onClick={() => openForm(record)}>
            <Edit size={13} />
            修改
          </button>
          <button
            className="btn-link flex items-center gap-1"
            onClick={() =>
              navigate(`/admin/system/dict/data/${encodeURIComponent(record.type)}`)
            }
          >
            <Database size={13} />
            数据
          </button>
          <button className="btn-link-danger" onClick={() => setDeleteIds([record.id])}>
            删除
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col gap-3">
      <PageHeader
        title="数据字典"
        subtitle="维护平台统一使用的字典类型并进入对应字典数据"
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
        <div className="mb-3 flex items-center gap-2">
          <button className="btn-primary flex items-center gap-1" onClick={() => openForm()}>
            <Plus size={14} />
            新增
          </button>
          <button
            className="btn-default flex items-center gap-1"
            onClick={() =>
              exportCsv(
                "数据字典.csv",
                ["字典编号", "字典名称", "字典类型", "状态", "备注", "创建时间"],
                filteredData.map((item) => [
                  item.id,
                  item.name,
                  item.type,
                  item.status === "enabled" ? "启用" : "停用",
                  item.remark,
                  item.createdAt,
                ])
              )
            }
          >
            <Download size={14} />
            导出
          </button>
          <button
            className="btn-default flex items-center gap-1 text-red-500"
            disabled={!selectedKeys.length}
            onClick={() => setDeleteIds(selectedKeys.map(Number))}
          >
            <Trash2 size={14} />
            批量删除
          </button>
        </div>
        <div className="flex-1 min-h-0">
          <DataTable
            columns={columns}
            data={filteredData}
            selectable
            selectedKeys={selectedKeys}
            onSelectChange={setSelectedKeys}
            emptyText="暂无符合条件的字典类型"
          />
        </div>
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "修改字典" : "新增字典"}
        width={580}
        footer={
          <>
            <button className="btn-default" onClick={() => setFormOpen(false)}>取消</button>
            <button className="btn-primary" onClick={submitForm}>确定</button>
          </>
        }
      >
        <FormItem label="字典名称" required>
          <input
            className="input-base"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="请输入字典名称"
          />
        </FormItem>
        <FormItem label="字典类型" required>
          <input
            className="input-base"
            value={form.type}
            disabled={!!editing}
            onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
            placeholder="例如 document_category"
          />
        </FormItem>
        <FormItem label="状态" required>
          <div className="flex gap-5 pt-1.5">
            {(["enabled", "disabled"] as EnableStatus[]).map((status) => (
              <label key={status} className="flex items-center gap-1.5 text-sm">
                <input
                  type="radio"
                  checked={form.status === status}
                  onChange={() => setForm((current) => ({ ...current, status }))}
                />
                {status === "enabled" ? "启用" : "停用"}
              </label>
            ))}
          </div>
        </FormItem>
        <FormItem label="备注">
          <textarea
            className="input-base min-h-20 resize-none"
            value={form.remark}
            onChange={(event) => setForm((current) => ({ ...current, remark: event.target.value }))}
            placeholder="请输入字典用途说明"
          />
        </FormItem>
      </Modal>

      <ConfirmModal
        open={deleteIds.length > 0}
        title="删除字典"
        content="删除字典类型会同时删除该类型下的全部字典数据，确定继续吗？"
        danger
        okText="确认删除"
        onConfirm={() => {
          deleteDictionaryTypes(deleteIds);
          setDeleteIds([]);
          setSelectedKeys([]);
          message.success("字典及其数据已删除");
        }}
        onCancel={() => setDeleteIds([])}
      />
    </div>
  );
}
