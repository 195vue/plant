import { useMemo, useState } from "react";
import {
  Download,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { message } from "@/components/common/Message";
import {
  useSystemStore,
  type EnableStatus,
  type Position,
} from "@/store/system";
import { exportCsv } from "@/lib/exportCsv";
import {
  ActionButton,
  CompactTable,
  FormRow,
  LinkButton,
  ModalButton,
  QueryField,
  QueryPanel,
  StatusPill,
  SystemConfirm,
  SystemModal,
  SystemPage,
  compactInputClass,
  type CompactColumn,
} from "./components/SystemAdmin";
import { DevNote } from "@/components/devNotes/DevNote";

export default function PositionManage() {
  const {
    positions,
    users,
    addPosition,
    updatePosition,
    deletePositions,
  } = useSystemStore();
  const [searchValues, setSearchValues] = useState({
    name: "",
    code: "",
    status: "",
  });
  const [appliedSearch, setAppliedSearch] = useState(searchValues);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [editing, setEditing] = useState<Position | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteIds, setDeleteIds] = useState<number[]>([]);
  const [form, setForm] = useState({
    name: "",
    code: "",
    sort: "1",
    status: "enabled" as EnableStatus,
    remark: "",
  });

  const filteredData = useMemo(
    () =>
      positions.filter((item) => {
        if (appliedSearch.name && !item.name.includes(appliedSearch.name)) return false;
        if (appliedSearch.code && !item.code.includes(appliedSearch.code)) return false;
        if (appliedSearch.status && item.status !== appliedSearch.status) return false;
        return true;
      }),
    [appliedSearch, positions]
  );

  const openForm = (record?: Position) => {
    setEditing(record || null);
    setForm(
      record
        ? {
            name: record.name,
            code: record.code,
            sort: String(record.sort),
            status: record.status,
            remark: record.remark,
          }
        : {
            name: "",
            code: "",
            sort: String(positions.length + 1),
            status: "enabled",
            remark: "",
          }
    );
    setFormOpen(true);
  };

  const submitForm = () => {
    if (!form.name.trim()) return message.warning("请输入岗位名称");
    if (!form.code.trim()) return message.warning("请输入岗位编码");
    if (
      positions.some(
        (item) =>
          item.code.toLowerCase() === form.code.trim().toLowerCase() &&
          item.id !== editing?.id
      )
    ) {
      return message.warning("岗位编码已存在");
    }
    const payload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      sort: Math.max(1, Number(form.sort) || 1),
      status: form.status,
      remark: form.remark.trim(),
    };
    if (editing) {
      updatePosition(editing.id, payload);
      message.success("岗位信息已修改");
    } else {
      addPosition({
        id: Math.max(0, ...positions.map((item) => item.id)) + 1,
        ...payload,
        createdAt: new Date().toLocaleString("zh-CN", { hour12: false }),
      });
      message.success("岗位已新增");
    }
    setFormOpen(false);
  };

  const requestDelete = (ids: number[]) => {
    if (!ids.length) return message.warning("请先选择需要删除的岗位");
    if (users.some((user) => user.positionIds.some((id) => ids.includes(id)))) {
      return message.warning("所选岗位已分配用户，不能删除");
    }
    setDeleteIds(ids);
  };

  const columns: CompactColumn<Position>[] = [
    { key: "id", title: "岗位编号", width: 100, align: "center" },
    { key: "name", title: "岗位名称", width: 160 },
    { key: "code", title: "岗位编码", width: 180 },
    { key: "sort", title: "岗位顺序", width: 110 },
    {
      key: "remark",
      title: "岗位备注",
      width: 240,
      render: (record) => record.remark || "-",
    },
    {
      key: "status",
      title: "状态",
      width: 100,
      render: (record) => (
        <StatusPill
          enabled={record.status === "enabled"}
          onClick={() =>
            updatePosition(record.id, {
              status: record.status === "enabled" ? "disabled" : "enabled",
            })
          }
        />
      ),
    },
    {
      key: "createdAt",
      title: "创建时间",
      width: 160,
      render: (record) => record.createdAt.slice(0, 10),
    },
    {
      key: "actions",
      title: "操作",
      width: 130,
      render: (record) => (
        <div className="flex items-center gap-3">
          <LinkButton onClick={() => openForm(record)}>编辑</LinkButton>
          <LinkButton danger onClick={() => requestDelete([record.id])}>
            删除
          </LinkButton>
        </div>
      ),
    },
  ];

  return (
    <SystemPage>
      <DevNote
        id="position-query"
        title="岗位管理-查询与操作区"
        summary="按名称/编码/状态查询岗位，提供新增/导出/批量删除"
        items={[
          { label: "查询条件", value: "岗位名称/岗位编码（包含匹配）、状态（开启/关闭）" },
          { label: "交互逻辑", value: "搜索/重置；新增 → 表单弹窗；导出 → CSV（编号/名称/编码/顺序/备注/状态/创建时间）；批量删除需勾选" },
          { label: "权限", value: "管理员/操作人员" },
        ]}
        wrapClassName="block flex-shrink-0"
      >
      <QueryPanel
        fields={
          <>
            <QueryField label="岗位名称">
              <input
                className={`${compactInputClass} w-44`}
                value={searchValues.name}
                placeholder="请输入岗位名称"
                onChange={(event) =>
                  setSearchValues((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </QueryField>
            <QueryField label="岗位编码">
              <input
                className={`${compactInputClass} w-44`}
                value={searchValues.code}
                placeholder="请输入岗位编码"
                onChange={(event) =>
                  setSearchValues((current) => ({
                    ...current,
                    code: event.target.value,
                  }))
                }
              />
            </QueryField>
            <QueryField label="状态">
              <select
                className={`${compactInputClass} w-40`}
                value={searchValues.status}
                onChange={(event) =>
                  setSearchValues((current) => ({
                    ...current,
                    status: event.target.value,
                  }))
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
                const empty = { name: "", code: "", status: "" };
                setSearchValues(empty);
                setAppliedSearch(empty);
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
                "岗位管理.csv",
                ["岗位编号", "岗位名称", "岗位编码", "岗位顺序", "岗位备注", "状态", "创建时间"],
                filteredData.map((item) => [
                  item.id,
                  item.name,
                  item.code,
                  item.sort,
                  item.remark,
                  item.status === "enabled" ? "开启" : "关闭",
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
              onClick={() => requestDelete(selectedKeys.map(Number))}
            >
              批量删除
            </ActionButton>
          </>
        }
      />
      </DevNote>
      <DevNote
        id="position-table"
        title="岗位管理-列表"
        summary="展示岗位，行内提供编辑/删除"
        items={[
          { label: "列定义", value: "岗位编号/岗位名称/岗位编码/岗位顺序/备注/状态（点击切换）/创建时间/操作（编辑/删除）" },
          { label: "交互逻辑", value: "编辑/删除 → 确认框；表单弹窗校验：名称/编码必填、编码全局唯一“岗位编码已存在”、排序默认=岗位数+1" },
          { label: "数据来源", value: "positions（useSystemStore）" },
          { label: "权限", value: "管理员/操作人员" },
        ]}
        wrapClassName="block flex flex-1"
      >
      <CompactTable
        columns={columns}
        data={filteredData}
        selectedKeys={selectedKeys}
        onSelectChange={setSelectedKeys}
        minWidth={1040}
        emptyText="暂无岗位数据"
      />
      </DevNote>

      <SystemModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "编辑" : "新增"}
        width={500}
        footer={
          <>
            <ModalButton primary onClick={submitForm}>确定</ModalButton>
            <ModalButton onClick={() => setFormOpen(false)}>取消</ModalButton>
          </>
        }
      >
        <FormRow label="岗位标题" required>
          <input
            className={`${compactInputClass} w-full`}
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="请输入岗位标题"
          />
        </FormRow>
        <FormRow label="岗位编码" required>
          <input
            className={`${compactInputClass} w-full`}
            value={form.code}
            onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
            placeholder="请输入岗位编码"
          />
        </FormRow>
        <FormRow label="岗位顺序">
          <input
            type="number"
            min={0}
            className={`${compactInputClass} w-full`}
            value={form.sort}
            onChange={(event) => setForm((current) => ({ ...current, sort: event.target.value }))}
            placeholder="请输入岗位顺序"
          />
        </FormRow>
        <FormRow label="状态" required>
          <select
            className={`${compactInputClass} w-full`}
            value={form.status}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                status: event.target.value as EnableStatus,
              }))
            }
          >
            <option value="enabled">开启</option>
            <option value="disabled">关闭</option>
          </select>
        </FormRow>
        <FormRow label="备注">
          <textarea
            className={`${compactInputClass} min-h-[68px] w-full resize-none py-2`}
            value={form.remark}
            onChange={(event) => setForm((current) => ({ ...current, remark: event.target.value }))}
            placeholder="请输入备注"
          />
        </FormRow>
      </SystemModal>

      <SystemConfirm
        open={deleteIds.length > 0}
        onConfirm={() => {
          deletePositions(deleteIds);
          setSelectedKeys([]);
          setDeleteIds([]);
          message.success("岗位已删除");
        }}
        onCancel={() => setDeleteIds([])}
      />
    </SystemPage>
  );
}
