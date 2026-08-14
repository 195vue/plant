import { useMemo, useState } from "react";
import {
  Database,
  Download,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { message } from "@/components/common/Message";
import { exportCsv } from "@/lib/exportCsv";
import {
  useSystemStore,
  type DictionaryType,
  type EnableStatus,
} from "@/store/system";
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

const emptySearch = {
  name: "",
  type: "",
  status: "",
  createdAtStart: "",
  createdAtEnd: "",
};

export default function DictReplica() {
  const navigate = useNavigate();
  const {
    dictionaryTypes,
    addDictionaryType,
    updateDictionaryType,
    deleteDictionaryTypes,
  } = useSystemStore();
  const [searchValues, setSearchValues] = useState(emptySearch);
  const [appliedSearch, setAppliedSearch] = useState(emptySearch);
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
        const createdDate = item.createdAt.slice(0, 10);
        if (appliedSearch.createdAtStart && createdDate < appliedSearch.createdAtStart) {
          return false;
        }
        if (appliedSearch.createdAtEnd && createdDate > appliedSearch.createdAtEnd) {
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
    const name = form.name.trim();
    const type = form.type.trim();
    if (!name) return message.warning("请输入字典名称");
    if (!type) return message.warning("请输入字典类型");
    if (!/^[a-z][a-z0-9_]*$/.test(type)) {
      return message.warning("字典类型仅支持小写字母、数字和下划线");
    }
    if (dictionaryTypes.some((item) => item.type === type && item.id !== editing?.id)) {
      return message.warning("字典类型已存在");
    }

    const payload = {
      name,
      type,
      status: form.status,
      remark: form.remark.trim(),
    };
    if (editing) {
      updateDictionaryType(editing.id, payload);
      message.success("字典已修改");
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

  const columns: CompactColumn<DictionaryType>[] = [
    { key: "id", title: "字典编号", width: 100 },
    { key: "name", title: "字典名称", width: 170 },
    { key: "type", title: "字典类型", width: 220 },
    {
      key: "status",
      title: "状态",
      width: 90,
      render: (record) => (
        <StatusPill
          enabled={record.status === "enabled"}
          onClick={() =>
            updateDictionaryType(record.id, {
              status: record.status === "enabled" ? "disabled" : "enabled",
            })
          }
        />
      ),
    },
    {
      key: "remark",
      title: "备注",
      width: 240,
      render: (record) => record.remark || "-",
    },
    { key: "createdAt", title: "创建时间", width: 170 },
    {
      key: "actions",
      title: "操作",
      width: 160,
      render: (record) => (
        <div className="flex items-center gap-3">
          <LinkButton onClick={() => openForm(record)}>修改</LinkButton>
          <LinkButton
            onClick={() =>
              navigate(`/admin/system/dict/data/${encodeURIComponent(record.type)}`)
            }
          >
            数据
          </LinkButton>
          <LinkButton danger onClick={() => setDeleteIds([record.id])}>
            删除
          </LinkButton>
        </div>
      ),
    },
  ];

  return (
    <SystemPage>
      <DevNote
        id="dict-query"
        title="数据字典-查询与操作区"
        summary="按名称/类型/状态/创建时间查询字典，提供新增/导出/批量删除"
        items={[
          { label: "查询条件", value: "字典名称/字典类型（包含匹配）、状态（开启/关闭）、创建时间起止" },
          { label: "交互逻辑", value: "搜索 → 应用条件筛选；重置 → 清空；新增 → 表单弹窗；导出 → CSV（字典编号/名称/类型/状态/备注/创建时间）；批量删除需先勾选" },
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
                placeholder="请输入字典名称"
                value={searchValues.name}
                onChange={(event) =>
                  setSearchValues((current) => ({ ...current, name: event.target.value }))
                }
              />
            </QueryField>
            <QueryField label="字典类型">
              <input
                className={`${compactInputClass} w-48`}
                placeholder="请输入字典类型"
                value={searchValues.type}
                onChange={(event) =>
                  setSearchValues((current) => ({ ...current, type: event.target.value }))
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
            <QueryField label="创建时间">
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  className={`${compactInputClass} w-32`}
                  value={searchValues.createdAtStart}
                  onChange={(event) =>
                    setSearchValues((current) => ({
                      ...current,
                      createdAtStart: event.target.value,
                    }))
                  }
                />
                <span className="text-slate-300">-</span>
                <input
                  type="date"
                  className={`${compactInputClass} w-32`}
                  value={searchValues.createdAtEnd}
                  onChange={(event) =>
                    setSearchValues((current) => ({
                      ...current,
                      createdAtEnd: event.target.value,
                    }))
                  }
                />
              </div>
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
                  "数据字典.csv",
                  ["字典编号", "字典名称", "字典类型", "状态", "备注", "创建时间"],
                  filteredData.map((item) => [
                    item.id,
                    item.name,
                    item.type,
                    item.status === "enabled" ? "开启" : "关闭",
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
          </>
        }
      />
      </DevNote>

      <DevNote
        id="dict-table"
        title="数据字典-字典列表"
        summary="展示字典类型，行内提供修改/查看数据/删除"
        items={[
          { label: "列定义", value: "字典编号/字典名称/字典类型/状态（点击切换）/备注/创建时间/操作" },
          { label: "行操作", value: "修改 → 表单弹窗；数据 → 跳转对应字典数据页 /admin/system/dict/data/{type}；删除 → 确认框" },
          { label: "数据来源", value: "dictionaryTypes（useSystemStore）" },
          { label: "权限", value: "管理员/操作人员" },
        ]}
        wrapClassName="block flex flex-1"
      >
      <CompactTable
        columns={columns}
        data={filteredData}
        selectedKeys={selectedKeys}
        onSelectChange={setSelectedKeys}
        minWidth={1080}
        emptyText="暂无字典数据"
      />
      </DevNote>

      <SystemModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "编辑字典" : "新增字典"}
        width={500}
        footer={
          <>
            <ModalButton primary onClick={submitForm}>确定</ModalButton>
            <ModalButton onClick={() => setFormOpen(false)}>取消</ModalButton>
          </>
        }
      >
        <DevNote
          id="dict-form-modal"
          title="数据字典-新增/编辑弹窗"
          summary="维护字典名称、类型、状态与备注"
          items={[
            { label: "校验规则", value: "名称/类型必填；类型格式 /^[a-z][a-z0-9_]*$/“仅支持小写字母、数字和下划线”；类型全局唯一“字典类型已存在”；编辑时类型不可改" },
            { label: "交互逻辑", value: "保存 → addDictionaryType/updateDictionaryType（store）；状态用单选项（开启/关闭）" },
            { label: "权限", value: "管理员/操作人员" },
          ]}
          wrapClassName="block w-full"
        >
        <FormRow label="字典名称" required>
          <input
            className={`${compactInputClass} w-full`}
            placeholder="请输入字典名称"
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
          />
        </FormRow>
        <FormRow label="字典类型" required>
          <input
            className={`${compactInputClass} w-full`}
            disabled={!!editing}
            placeholder="请输入字典类型"
            value={form.type}
            onChange={(event) =>
              setForm((current) => ({ ...current, type: event.target.value }))
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
        <FormRow label="备注">
          <textarea
            className={`${compactInputClass} min-h-[76px] w-full resize-none py-2`}
            placeholder="请输入内容"
            value={form.remark}
            onChange={(event) =>
              setForm((current) => ({ ...current, remark: event.target.value }))
            }
          />
        </FormRow>
        </DevNote>
      </SystemModal>

      <SystemConfirm
        open={deleteIds.length > 0}
        onCancel={() => setDeleteIds([])}
        onConfirm={() => {
          deleteDictionaryTypes(deleteIds);
          setDeleteIds([]);
          setSelectedKeys([]);
          message.success("字典已删除");
        }}
      />
    </SystemPage>
  );
}
