import { useMemo, useState } from "react";
import { Download, Edit, Plus, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { BackButton, PageHeader } from "@/components/common/PageHeader";
import { SearchForm, type SearchField } from "@/components/common/SearchForm";
import { DataTable, type Column } from "@/components/common/DataTable";
import { ConfirmModal, Modal } from "@/components/common/Modal";
import { FormItem } from "@/components/common/UploadBox";
import { StatusTag, Tag } from "@/components/common/Tag";
import { message } from "@/components/common/Message";
import {
  useSystemStore,
  type DictionaryItem,
  type EnableStatus,
} from "@/store/system";
import { exportCsv } from "@/lib/exportCsv";

const colorOptions = [
  { label: "默认", value: "default" },
  { label: "主要", value: "primary" },
  { label: "成功", value: "success" },
  { label: "信息", value: "info" },
  { label: "警告", value: "warning" },
  { label: "危险", value: "danger" },
];

export default function DictDataManage() {
  const navigate = useNavigate();
  const { type = "" } = useParams();
  const dictType = decodeURIComponent(type);
  const {
    dictionaryTypes,
    dictionaryItems,
    addDictionaryItem,
    updateDictionaryItem,
    deleteDictionaryItems,
  } = useSystemStore();
  const currentType = dictionaryTypes.find((item) => item.type === dictType);
  const searchFields: SearchField[] = [
    {
      name: "dictName",
      label: "字典名称",
      type: "input",
      placeholder: currentType?.name || "请输入字典名称",
    },
    { name: "label", label: "字典标签", type: "input", placeholder: "请输入字典标签" },
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
  ];
  const [searchValues, setSearchValues] = useState<Record<string, string>>({});
  const [appliedSearch, setAppliedSearch] = useState<Record<string, string>>({});
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [editing, setEditing] = useState<DictionaryItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteIds, setDeleteIds] = useState<number[]>([]);
  const [form, setForm] = useState({
    label: "",
    value: "",
    sort: "1",
    status: "enabled" as EnableStatus,
    colorType: "default",
    cssClass: "",
    remark: "",
  });

  const typeItems = useMemo(
    () => dictionaryItems.filter((item) => item.dictType === dictType),
    [dictType, dictionaryItems]
  );
  const filteredData = useMemo(
    () =>
      typeItems.filter((item) => {
        if (
          appliedSearch.dictName &&
          currentType &&
          !currentType.name.includes(appliedSearch.dictName)
        ) {
          return false;
        }
        if (appliedSearch.label && !item.label.includes(appliedSearch.label)) return false;
        if (appliedSearch.status && item.status !== appliedSearch.status) return false;
        return true;
      }),
    [appliedSearch, currentType, typeItems]
  );

  const openForm = (record?: DictionaryItem) => {
    setEditing(record || null);
    setForm(
      record
        ? {
            label: record.label,
            value: record.value,
            sort: String(record.sort),
            status: record.status,
            colorType: record.colorType,
            cssClass: record.cssClass,
            remark: record.remark,
          }
        : {
            label: "",
            value: "",
            sort: String(typeItems.length + 1),
            status: "enabled",
            colorType: "default",
            cssClass: "",
            remark: "",
          }
    );
    setFormOpen(true);
  };

  const submitForm = () => {
    if (!currentType) return message.warning("当前字典类型不存在");
    if (!form.label.trim()) return message.warning("请输入数据标签");
    if (!form.value.trim()) return message.warning("请输入数据键值");
    if (
      typeItems.some(
        (item) => item.value === form.value.trim() && item.id !== editing?.id
      )
    ) {
      return message.warning("当前字典类型下的数据键值已存在");
    }
    const payload = {
      dictType,
      label: form.label.trim(),
      value: form.value.trim(),
      sort: Math.max(1, Number(form.sort) || 1),
      status: form.status,
      colorType: form.colorType,
      cssClass: form.cssClass.trim(),
      remark: form.remark.trim(),
    };
    if (editing) {
      updateDictionaryItem(editing.id, payload);
      message.success("字典数据已修改");
    } else {
      addDictionaryItem({
        id: Math.max(0, ...dictionaryItems.map((item) => item.id)) + 1,
        ...payload,
        createdAt: new Date().toLocaleString("zh-CN", { hour12: false }),
      });
      message.success("字典数据已新增");
    }
    setFormOpen(false);
  };

  const colorTag = (colorType: string) => {
    const config: Record<string, { color: "gray" | "blue" | "green" | "cyan" | "orange" | "red"; label: string }> = {
      default: { color: "gray", label: "默认" },
      primary: { color: "blue", label: "主要" },
      success: { color: "green", label: "成功" },
      info: { color: "cyan", label: "信息" },
      warning: { color: "orange", label: "警告" },
      danger: { color: "red", label: "危险" },
    };
    const item = config[colorType] || config.default;
    return <Tag color={item.color}>{item.label}</Tag>;
  };

  const columns: Column<DictionaryItem>[] = [
    { key: "id", title: "字典编码", width: 100 },
    { key: "label", title: "字典标签", width: 140 },
    { key: "value", title: "字典键值", width: 180 },
    { key: "sort", title: "字典排序", width: 100 },
    {
      key: "status",
      title: "状态",
      width: 90,
      render: (record) => (
        <button
          onClick={() =>
            updateDictionaryItem(record.id, {
              status: record.status === "enabled" ? "disabled" : "enabled",
            })
          }
        >
          <StatusTag status={record.status} />
        </button>
      ),
    },
    {
      key: "colorType",
      title: "颜色类型",
      width: 110,
      render: (record) => colorTag(record.colorType),
    },
    { key: "cssClass", title: "CSS Class", width: 150, render: (record) => record.cssClass || "-" },
    { key: "remark", title: "备注", width: 180, render: (record) => record.remark || "-" },
    { key: "createdAt", title: "创建时间", width: 180 },
    {
      key: "actions",
      title: "操作",
      width: 140,
      render: (record) => (
        <div className="flex items-center gap-3">
          <button className="btn-link flex items-center gap-1" onClick={() => openForm(record)}>
            <Edit size={13} />
            修改
          </button>
          <button className="btn-link-danger" onClick={() => setDeleteIds([record.id])}>
            删除
          </button>
        </div>
      ),
    },
  ];

  if (!currentType) {
    return (
      <div className="admin-card p-6">
        <BackButton text="返回数据字典" onClick={() => navigate("/admin/system/dict")} />
        <div className="py-16 text-center text-admin-muted">未找到对应字典类型</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-3">
      <div>
        <BackButton text="返回数据字典" onClick={() => navigate("/admin/system/dict")} />
        <PageHeader
          title="字典数据"
          subtitle={`${currentType.name}（${currentType.type}）`}
        />
      </div>
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
                `${currentType.name}-字典数据.csv`,
                ["字典编码", "字典标签", "字典键值", "字典排序", "状态", "颜色类型", "CSS Class", "备注", "创建时间"],
                filteredData.map((item) => [
                  item.id,
                  item.label,
                  item.value,
                  item.sort,
                  item.status === "enabled" ? "启用" : "停用",
                  item.colorType,
                  item.cssClass,
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
            emptyText="当前字典类型暂无数据"
          />
        </div>
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "修改字典数据" : "新增字典数据"}
        width={620}
        footer={
          <>
            <button className="btn-default" onClick={() => setFormOpen(false)}>取消</button>
            <button className="btn-primary" onClick={submitForm}>确定</button>
          </>
        }
      >
        <FormItem label="字典类型" required>
          <input className="input-base bg-gray-50" value={currentType.type} disabled />
        </FormItem>
        <div className="grid grid-cols-2 gap-x-4">
          <FormItem label="数据标签" required>
            <input
              className="input-base"
              value={form.label}
              onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
              placeholder="请输入数据标签"
            />
          </FormItem>
          <FormItem label="数据键值" required>
            <input
              className="input-base"
              value={form.value}
              onChange={(event) => setForm((current) => ({ ...current, value: event.target.value }))}
              placeholder="请输入数据键值"
            />
          </FormItem>
          <FormItem label="显示排序" required>
            <input
              type="number"
              min={1}
              className="input-base"
              value={form.sort}
              onChange={(event) => setForm((current) => ({ ...current, sort: event.target.value }))}
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
          <FormItem label="颜色类型">
            <select
              className="input-base"
              value={form.colorType}
              onChange={(event) =>
                setForm((current) => ({ ...current, colorType: event.target.value }))
              }
            >
              {colorOptions.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </FormItem>
          <FormItem label="CSS Class">
            <input
              className="input-base"
              value={form.cssClass}
              onChange={(event) => setForm((current) => ({ ...current, cssClass: event.target.value }))}
              placeholder="可选，自定义样式类"
            />
          </FormItem>
        </div>
        <FormItem label="备注">
          <textarea
            className="input-base min-h-20 resize-none"
            value={form.remark}
            onChange={(event) => setForm((current) => ({ ...current, remark: event.target.value }))}
            placeholder="请输入备注"
          />
        </FormItem>
      </Modal>

      <ConfirmModal
        open={deleteIds.length > 0}
        title="删除字典数据"
        content={`确定删除选中的 ${deleteIds.length} 条字典数据吗？`}
        danger
        okText="确认删除"
        onConfirm={() => {
          deleteDictionaryItems(deleteIds);
          setDeleteIds([]);
          setSelectedKeys([]);
          message.success("字典数据已删除");
        }}
        onCancel={() => setDeleteIds([])}
      />
    </div>
  );
}
