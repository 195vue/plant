import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Download,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { message } from "@/components/common/Message";
import { exportCsv } from "@/lib/exportCsv";
import {
  useSystemStore,
  type DictionaryItem,
  type EnableStatus,
} from "@/store/system";
import { cn } from "@/lib/utils";
import {
  ActionButton,
  CompactTable,
  FormRow,
  LinkButton,
  ModalButton,
  QueryField,
  QueryPanel,
  RadioGroup,
  StatusPill,
  SystemConfirm,
  SystemModal,
  SystemPage,
  compactInputClass,
  type CompactColumn,
} from "./components/SystemAdmin";
import { DevNote } from "@/components/devNotes/DevNote";

const colorOptions = [
  { label: "默认", value: "default" },
  { label: "主要", value: "primary" },
  { label: "成功", value: "success" },
  { label: "信息", value: "info" },
  { label: "警告", value: "warning" },
  { label: "危险", value: "danger" },
];

const colorClasses: Record<string, string> = {
  default: "bg-slate-100 text-slate-500",
  primary: "bg-blue-50 text-blue-500",
  success: "bg-green-50 text-green-600",
  info: "bg-cyan-50 text-cyan-600",
  warning: "bg-amber-50 text-amber-600",
  danger: "bg-red-50 text-red-500",
};

const emptySearch = {
  label: "",
  status: "",
};

export default function DictDataReplica() {
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
  const [searchValues, setSearchValues] = useState(emptySearch);
  const [appliedSearch, setAppliedSearch] = useState(emptySearch);
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
        if (appliedSearch.label && !item.label.includes(appliedSearch.label)) return false;
        if (appliedSearch.status && item.status !== appliedSearch.status) return false;
        return true;
      }),
    [appliedSearch, typeItems]
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
    const label = form.label.trim();
    const value = form.value.trim();
    if (!label) return message.warning("请输入数据标签");
    if (!value) return message.warning("请输入数据键值");
    if (typeItems.some((item) => item.value === value && item.id !== editing?.id)) {
      return message.warning("当前字典类型下的数据键值已存在");
    }

    const payload = {
      dictType,
      label,
      value,
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

  const columns: CompactColumn<DictionaryItem>[] = [
    { key: "id", title: "字典编码", width: 100 },
    { key: "label", title: "字典标签", width: 130 },
    { key: "value", title: "字典键值", width: 170 },
    { key: "sort", title: "字典排序", width: 90 },
    {
      key: "status",
      title: "状态",
      width: 85,
      render: (record) => (
        <StatusPill
          enabled={record.status === "enabled"}
          onClick={() =>
            updateDictionaryItem(record.id, {
              status: record.status === "enabled" ? "disabled" : "enabled",
            })
          }
        />
      ),
    },
    {
      key: "colorType",
      title: "颜色类型",
      width: 100,
      render: (record) => {
        const option = colorOptions.find((item) => item.value === record.colorType);
        return (
          <span
            className={cn(
              "inline-flex rounded-sm px-2 py-0.5 text-[11px]",
              colorClasses[record.colorType] || colorClasses.default
            )}
          >
            {option?.label || "默认"}
          </span>
        );
      },
    },
    {
      key: "cssClass",
      title: "CSS Class",
      width: 130,
      render: (record) => record.cssClass || "-",
    },
    {
      key: "remark",
      title: "备注",
      width: 160,
      render: (record) => record.remark || "-",
    },
    { key: "createdAt", title: "创建时间", width: 170 },
    {
      key: "actions",
      title: "操作",
      width: 110,
      render: (record) => (
        <div className="flex items-center gap-3">
          <LinkButton onClick={() => openForm(record)}>修改</LinkButton>
          <LinkButton danger onClick={() => setDeleteIds([record.id])}>
            删除
          </LinkButton>
        </div>
      ),
    },
  ];

  if (!currentType) {
    return (
      <SystemPage>
        <div className="flex flex-1 flex-col items-center justify-center rounded-sm border border-slate-200 bg-white">
          <span className="mb-4 text-slate-400">未找到对应字典类型</span>
          <ActionButton
            icon={<ArrowLeft size={13} />}
            onClick={() => navigate("/admin/system/dict")}
          >
            返回字典管理
          </ActionButton>
        </div>
      </SystemPage>
    );
  }

  return (
    <SystemPage>
      <DevNote
        id="dictdata-query"
        title="字典数据-查询与操作区"
        summary="按字典标签/状态查询当前字典类型下的数据项"
        items={[
          { label: "数据来源", value: "useParams 获取字典类型；currentType 从 dictionaryTypes 匹配；dictionaryItems 按 type 过滤" },
          { label: "查询条件", value: "字典名称（只读展示当前类型）、字典标签（包含匹配）、状态；搜索/重置" },
          { label: "操作", value: "新增 → 表单弹窗（字典类型固定为当前）；导出 → CSV（含颜色类型/CSS Class）；批量删除需勾选；返回 → 跳回字典管理页" },
          { label: "权限", value: "管理员/操作人员" },
        ]}
        wrapClassName="block flex-shrink-0"
      >
      <QueryPanel
        fields={
          <>
            <QueryField label="字典名称">
              <input
                className={`${compactInputClass} w-48`}
                value={currentType.name}
                disabled
              />
            </QueryField>
            <QueryField label="字典标签">
              <input
                className={`${compactInputClass} w-48`}
                placeholder="请输入字典标签"
                value={searchValues.label}
                onChange={(event) =>
                  setSearchValues((current) => ({ ...current, label: event.target.value }))
                }
              />
            </QueryField>
            <QueryField label="状态">
              <select
                className={`${compactInputClass} w-32`}
                value={searchValues.status}
                onChange={(event) =>
                  setSearchValues((current) => ({ ...current, status: event.target.value }))
                }
              >
                <option value="">请选择状态</option>
                <option value="enabled">开启</option>
                <option value="disabled">关闭</option>
              </select>
            </QueryField>
          </>
        }
        actions={
          <>
            <ActionButton
              icon={<Search size={13} />}
              onClick={() => setAppliedSearch({ ...searchValues })}
            >
              搜索
            </ActionButton>
            <ActionButton
              icon={<RotateCcw size={13} />}
              onClick={() => {
                setSearchValues(emptySearch);
                setAppliedSearch(emptySearch);
              }}
            >
              重置
            </ActionButton>
            <ActionButton
              tone="primary"
              icon={<Plus size={13} />}
              onClick={() => openForm()}
            >
              新增
            </ActionButton>
            <ActionButton
              tone="success"
              icon={<Download size={13} />}
              onClick={() =>
                exportCsv(
                  `${currentType.name}-字典数据.csv`,
                  [
                    "字典编码",
                    "字典标签",
                    "字典键值",
                    "字典排序",
                    "状态",
                    "颜色类型",
                    "CSS Class",
                    "备注",
                    "创建时间",
                  ],
                  filteredData.map((item) => [
                    item.id,
                    item.label,
                    item.value,
                    item.sort,
                    item.status === "enabled" ? "开启" : "关闭",
                    item.colorType,
                    item.cssClass,
                    item.remark,
                    item.createdAt,
                  ])
                )
              }
            >
              导出
            </ActionButton>
            <ActionButton
              tone="danger"
              icon={<Trash2 size={13} />}
              disabled={!selectedKeys.length}
              onClick={() => setDeleteIds(selectedKeys.map(Number))}
            >
              批量删除
            </ActionButton>
            <ActionButton
              icon={<ArrowLeft size={13} />}
              onClick={() => navigate("/admin/system/dict")}
            >
              返回
            </ActionButton>
          </>
        }
      />
      </DevNote>

      <DevNote
        id="dictdata-table"
        title="字典数据-列表"
        summary="展示当前字典类型的数据项，行内提供修改/删除"
        items={[
          { label: "列定义", value: "字典编码/字典标签/字典键值/字典排序/状态（点击切换）/颜色类型Tag/CSS Class/备注/创建时间/操作（修改/删除）" },
          { label: "交互逻辑", value: "新增/编辑表单弹窗（数据标签/键值/排序/状态/颜色类型/CSS Class/备注）；行内修改/删除；批量删除需勾选" },
          { label: "数据来源", value: "dictionaryItems（useSystemStore，按当前 type 过滤）" },
          { label: "权限", value: "管理员/操作人员" },
        ]}
        wrapClassName="block flex flex-1"
      >
      <CompactTable
        columns={columns}
        data={filteredData}
        selectedKeys={selectedKeys}
        onSelectChange={setSelectedKeys}
        minWidth={1260}
        emptyText="当前字典类型暂无数据"
      />
      </DevNote>

      <SystemModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "编辑字典数据" : "新增字典数据"}
        width={560}
        footer={
          <>
            <ModalButton primary onClick={submitForm}>确定</ModalButton>
            <ModalButton onClick={() => setFormOpen(false)}>取消</ModalButton>
          </>
        }
      >
        <FormRow label="字典类型" required>
          <input
            className={`${compactInputClass} w-full`}
            value={currentType.type}
            disabled
          />
        </FormRow>
        <FormRow label="数据标签" required>
          <input
            className={`${compactInputClass} w-full`}
            placeholder="请输入数据标签"
            value={form.label}
            onChange={(event) =>
              setForm((current) => ({ ...current, label: event.target.value }))
            }
          />
        </FormRow>
        <FormRow label="数据键值" required>
          <input
            className={`${compactInputClass} w-full`}
            placeholder="请输入数据键值"
            value={form.value}
            onChange={(event) =>
              setForm((current) => ({ ...current, value: event.target.value }))
            }
          />
        </FormRow>
        <FormRow label="显示排序" required>
          <input
            type="number"
            min={1}
            className={`${compactInputClass} w-full`}
            value={form.sort}
            onChange={(event) =>
              setForm((current) => ({ ...current, sort: event.target.value }))
            }
          />
        </FormRow>
        <FormRow label="状态" required>
          <RadioGroup
            value={form.status}
            options={[
              { label: "开启", value: "enabled" },
              { label: "关闭", value: "disabled" },
            ]}
            onChange={(value) =>
              setForm((current) => ({ ...current, status: value as EnableStatus }))
            }
          />
        </FormRow>
        <FormRow label="颜色类型">
          <select
            className={`${compactInputClass} w-full`}
            value={form.colorType}
            onChange={(event) =>
              setForm((current) => ({ ...current, colorType: event.target.value }))
            }
          >
            {colorOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </FormRow>
        <FormRow label="CSS Class">
          <input
            className={`${compactInputClass} w-full`}
            placeholder="请输入样式类名"
            value={form.cssClass}
            onChange={(event) =>
              setForm((current) => ({ ...current, cssClass: event.target.value }))
            }
          />
        </FormRow>
        <FormRow label="备注">
          <textarea
            className={`${compactInputClass} min-h-[70px] w-full resize-none py-2`}
            placeholder="请输入内容"
            value={form.remark}
            onChange={(event) =>
              setForm((current) => ({ ...current, remark: event.target.value }))
            }
          />
        </FormRow>
      </SystemModal>

      <SystemConfirm
        open={deleteIds.length > 0}
        onCancel={() => setDeleteIds([])}
        onConfirm={() => {
          deleteDictionaryItems(deleteIds);
          setDeleteIds([]);
          setSelectedKeys([]);
          message.success("字典数据已删除");
        }}
      />
    </SystemPage>
  );
}
