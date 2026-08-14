import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { message } from "@/components/common/Message";
import {
  useSystemStore,
  type Department,
  type EnableStatus,
} from "@/store/system";
import {
  ActionButton,
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
} from "./components/SystemAdmin";
import { DevNote } from "@/components/devNotes/DevNote";

interface DepartmentRow extends Department {
  level: number;
  hasChildren: boolean;
}

const getDescendantIds = (departments: Department[], id: number) => {
  const ids: number[] = [];
  const visit = (parentId: number) => {
    departments
      .filter((item) => item.parentId === parentId)
      .forEach((item) => {
        ids.push(item.id);
        visit(item.id);
      });
  };
  visit(id);
  return ids;
};

export default function DepartmentManage() {
  const {
    departments,
    users,
    addDepartment,
    updateDepartment,
    deleteDepartments,
  } = useSystemStore();
  const [searchValues, setSearchValues] = useState({ name: "", status: "" });
  const [appliedSearch, setAppliedSearch] = useState(searchValues);
  const [expanded, setExpanded] = useState<Set<number>>(
    new Set(departments.map((item) => item.id))
  );
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState({
    parentId: "",
    name: "",
    sort: "1",
    leader: "",
    phone: "",
    email: "",
    status: "enabled" as EnableStatus,
  });
  const [deleteIds, setDeleteIds] = useState<number[]>([]);

  const matchedIds = useMemo(() => {
    if (!appliedSearch.name && !appliedSearch.status) return null;
    const result = new Set<number>();
    const addAncestors = (item: Department) => {
      result.add(item.id);
      if (item.parentId != null) {
        const parent = departments.find((department) => department.id === item.parentId);
        if (parent) addAncestors(parent);
      }
    };
    departments.forEach((item) => {
      const nameMatched =
        !appliedSearch.name || item.name.includes(appliedSearch.name);
      const statusMatched =
        !appliedSearch.status || item.status === appliedSearch.status;
      if (nameMatched && statusMatched) addAncestors(item);
    });
    return result;
  }, [appliedSearch, departments]);

  const rows = useMemo(() => {
    const result: DepartmentRow[] = [];
    const visit = (parentId: number | null, level: number) => {
      departments
        .filter((item) => item.parentId === parentId)
        .sort((a, b) => a.sort - b.sort)
        .forEach((item) => {
          if (matchedIds && !matchedIds.has(item.id)) return;
          const hasChildren = departments.some(
            (department) => department.parentId === item.id
          );
          result.push({ ...item, level, hasChildren });
          if (hasChildren && (expanded.has(item.id) || matchedIds)) {
            visit(item.id, level + 1);
          }
        });
    };
    visit(null, 0);
    return result;
  }, [departments, expanded, matchedIds]);

  const availableParents = useMemo(() => {
    if (!editing) return departments;
    const excluded = new Set([editing.id, ...getDescendantIds(departments, editing.id)]);
    return departments.filter((item) => !excluded.has(item.id));
  }, [departments, editing]);

  const openAdd = (parentId?: number) => {
    setEditing(null);
    setForm({
      parentId: parentId ? String(parentId) : "",
      name: "",
      sort: "1",
      leader: "",
      phone: "",
      email: "",
      status: "enabled",
    });
    setFormOpen(true);
  };

  const openEdit = (record: Department) => {
    setEditing(record);
    setForm({
      parentId: record.parentId == null ? "" : String(record.parentId),
      name: record.name,
      sort: String(record.sort),
      leader: record.leader,
      phone: record.phone,
      email: record.email,
      status: record.status,
    });
    setFormOpen(true);
  };

  const submitForm = () => {
    if (!form.name.trim()) return message.warning("请输入部门名称");
    if (
      departments.some(
        (item) =>
          item.name === form.name.trim() &&
          item.parentId === (form.parentId ? Number(form.parentId) : null) &&
          item.id !== editing?.id
      )
    ) {
      return message.warning("同一上级部门下已存在同名部门");
    }
    const payload = {
      parentId: form.parentId ? Number(form.parentId) : null,
      name: form.name.trim(),
      sort: Math.max(0, Number(form.sort) || 0),
      leader: form.leader.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      status: form.status,
    };
    if (editing) {
      updateDepartment(editing.id, payload);
      message.success("部门信息已修改");
    } else {
      const id = Math.max(0, ...departments.map((item) => item.id)) + 1;
      addDepartment({
        id,
        ...payload,
        createdAt: new Date().toLocaleString("zh-CN", { hour12: false }),
      });
      if (payload.parentId) {
        setExpanded((current) => new Set([...current, payload.parentId!]));
      }
      message.success("部门已新增");
    }
    setFormOpen(false);
  };

  const requestDelete = (ids: number[]) => {
    if (!ids.length) return message.warning("请先选择需要删除的部门");
    if (ids.includes(1)) return message.warning("乌江渡发电厂根部门不能删除");
    const withDescendants = new Set<number>();
    ids.forEach((id) => {
      withDescendants.add(id);
      getDescendantIds(departments, id).forEach((childId) =>
        withDescendants.add(childId)
      );
    });
    if (users.some((user) => withDescendants.has(user.departmentId))) {
      return message.warning("所选部门或其下级部门存在用户，不能删除");
    }
    setDeleteIds([...withDescendants]);
  };

  const confirmDelete = () => {
    deleteDepartments(deleteIds);
    setSelectedIds([]);
    setDeleteIds([]);
    message.success("部门已删除");
  };

  const allVisibleSelected =
    rows.length > 0 && rows.every((row) => selectedIds.includes(row.id));

  const allExpanded =
    departments.length > 0 &&
    departments
      .filter((item) => departments.some((child) => child.parentId === item.id))
      .every((item) => expanded.has(item.id));
  const leaderOptions = Array.from(
    new Set([
      ...users.map((user) => user.nickname),
      ...departments.map((department) => department.leader).filter(Boolean),
    ])
  );

  return (
    <SystemPage>
      <DevNote
        id="org-query"
        title="部门管理-查询与操作区"
        summary="按名称/状态查询部门，提供新增/展开折叠/批量删除"
        items={[
          { label: "查询条件", value: "部门名称（包含）、部门状态（开启/关闭）；搜索命中时保留命中部门及全部祖先链" },
          { label: "交互逻辑", value: "新增 → 表单弹窗（上级部门默认=当前选中）；展开/折叠 → 全部展开或收起；批量删除需先勾选（有子部门或用户的部门不可删）" },
          { label: "权限", value: "管理员/操作人员" },
        ]}
        wrapClassName="block flex-shrink-0"
      >
      <QueryPanel
        fields={
          <>
            <QueryField label="部门名称">
              <input
                className={`${compactInputClass} w-44`}
                placeholder="请输入部门名称"
                value={searchValues.name}
                onChange={(event) =>
                  setSearchValues((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </QueryField>
            <QueryField label="部门状态">
              <select
                className={`${compactInputClass} w-44`}
                value={searchValues.status}
                onChange={(event) =>
                  setSearchValues((current) => ({
                    ...current,
                    status: event.target.value,
                  }))
                }
              >
                <option value="">请选择部门状态</option>
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
                const empty = { name: "", status: "" };
                setSearchValues(empty);
                setAppliedSearch(empty);
              }}
            >
              重置
            </ActionButton>
            <ActionButton
              tone="primary"
              icon={<Plus size={13} />}
              onClick={() => openAdd()}
            >
              新增
            </ActionButton>
            <ActionButton
              tone="danger"
              icon={<ChevronsUpDown size={13} />}
              onClick={() =>
                setExpanded(
                  allExpanded
                    ? new Set()
                    : new Set(departments.map((item) => item.id))
                )
              }
            >
              展开/折叠
            </ActionButton>
            <ActionButton
              tone="danger"
              icon={<Trash2 size={13} />}
              disabled={!selectedIds.length}
              onClick={() => requestDelete(selectedIds)}
            >
              批量删除
            </ActionButton>
          </>
        }
      />
      </DevNote>

      <DevNote
        id="org-table"
        title="部门管理-树形列表"
        summary="树形展示部门层级，行内提供新增下级/编辑/删除"
        items={[
          { label: "列定义", value: "勾选/部门名称（缩进+展开箭头）/负责人/排序/状态（点击切换）/创建时间/操作（新增下级/编辑/删除）" },
          { label: "交互逻辑", value: "展开/收起子部门；表头全选当前可见行；删除校验：有子部门提示先删除子部门、有用户提示先移除用户；新增下级默认上级=当前行" },
          { label: "数据来源", value: "departments（useSystemStore）；rows 按 parentId 递归 + sort 排序生成" },
          { label: "权限", value: "管理员/操作人员" },
        ]}
        wrapClassName="block flex flex-1"
      >
      <div className="min-h-0 flex-1 overflow-auto rounded-sm border border-slate-200 bg-white">
        <table className="w-full min-w-[860px] border-collapse text-[12px]">
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="h-10 border-b border-slate-100 text-left text-slate-500">
                <th className="w-10 px-3 text-center font-normal">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={(event) =>
                      setSelectedIds(
                        event.target.checked ? rows.map((row) => row.id) : []
                      )
                    }
                    className="h-3.5 w-3.5 accent-blue-500"
                  />
                </th>
                <th className="px-3 font-normal">部门名称</th>
                <th className="w-40 px-3 font-normal">负责人</th>
                <th className="w-24 px-3 font-normal">排序</th>
                <th className="w-24 px-3 font-normal">状态</th>
                <th className="w-44 px-3 font-normal">创建时间</th>
                <th className="w-32 px-3 font-normal">操作</th>
            </tr>
          </thead>
          <tbody>
              {rows.map((record) => (
                <tr
                  key={record.id}
                  className="h-10 border-b border-slate-100 text-slate-600 hover:bg-blue-50/40"
                >
                  <td className="px-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(record.id)}
                      onChange={(event) =>
                        setSelectedIds((current) =>
                          event.target.checked
                            ? [...current, record.id]
                            : current.filter((id) => id !== record.id)
                        )
                      }
                      className="h-3.5 w-3.5 accent-blue-500"
                    />
                  </td>
                  <td className="px-3">
                    <div
                      className="flex items-center gap-1"
                      style={{ paddingLeft: `${record.level * 18}px` }}
                    >
                      {record.hasChildren ? (
                        <button
                          className="text-slate-400 hover:text-blue-500"
                          onClick={() =>
                            setExpanded((current) => {
                              const next = new Set(current);
                              next.has(record.id)
                                ? next.delete(record.id)
                                : next.add(record.id);
                              return next;
                            })
                          }
                        >
                          {expanded.has(record.id) || matchedIds ? (
                            <ChevronDown size={15} />
                          ) : (
                            <ChevronRight size={15} />
                          )}
                        </button>
                      ) : (
                        <span className="w-[15px]" />
                      )}
                      <span>{record.name}</span>
                    </div>
                  </td>
                  <td className="px-3">{record.leader || "-"}</td>
                  <td className="px-3">{record.sort}</td>
                  <td className="px-3">
                    <StatusPill
                      enabled={record.status === "enabled"}
                      onClick={() =>
                        updateDepartment(record.id, {
                          status:
                            record.status === "enabled" ? "disabled" : "enabled",
                        })
                      }
                    />
                  </td>
                  <td className="px-3">{record.createdAt.slice(0, 10)}</td>
                  <td className="px-3">
                    <div className="flex items-center gap-3">
                      <LinkButton onClick={() => openEdit(record)}>
                        修改
                      </LinkButton>
                      <LinkButton danger onClick={() => requestDelete([record.id])}>
                        删除
                      </LinkButton>
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={7} className="h-40 text-center text-slate-400">
                    暂无部门数据
                  </td>
                </tr>
              )}
          </tbody>
        </table>
      </div>
      </DevNote>

      <SystemModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "编辑" : "新增"}
        width={520}
        footer={
          <>
            <ModalButton primary onClick={submitForm}>确定</ModalButton>
            <ModalButton onClick={() => setFormOpen(false)}>取消</ModalButton>
          </>
        }
      >
        <FormRow label="上级部门" required>
          <select
            className={`${compactInputClass} w-full`}
            value={form.parentId}
            onChange={(event) =>
              setForm((current) => ({ ...current, parentId: event.target.value }))
            }
          >
            <option value="">请选择上级部门</option>
            {availableParents.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </FormRow>
        <FormRow label="部门名称" required>
          <input
            className={`${compactInputClass} w-full`}
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="请输入部门名称"
          />
        </FormRow>
        <FormRow label="显示排序" required>
          <input
            type="number"
            min={0}
            className={`${compactInputClass} w-28`}
            value={form.sort}
            onChange={(event) =>
              setForm((current) => ({ ...current, sort: event.target.value }))
            }
          />
        </FormRow>
        <FormRow label="负责人">
          <select
            className={`${compactInputClass} w-full`}
            value={form.leader}
            onChange={(event) =>
              setForm((current) => ({ ...current, leader: event.target.value }))
            }
          >
            <option value="">请输入负责人</option>
            {leaderOptions.map((leader) => (
              <option key={leader} value={leader}>{leader}</option>
            ))}
          </select>
        </FormRow>
        <FormRow label="联系电话">
          <input
            className={`${compactInputClass} w-full`}
            value={form.phone}
            onChange={(event) =>
              setForm((current) => ({ ...current, phone: event.target.value }))
            }
            placeholder="请输入联系电话"
          />
        </FormRow>
        <FormRow label="邮箱">
          <input
            className={`${compactInputClass} w-full`}
            value={form.email}
            onChange={(event) =>
              setForm((current) => ({ ...current, email: event.target.value }))
            }
            placeholder="请输入邮箱"
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
      </SystemModal>

      <SystemConfirm
        open={deleteIds.length > 0}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteIds([])}
      />
    </SystemPage>
  );
}
