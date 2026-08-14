import { useMemo, useState } from "react";
import {
  Download,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { message } from "@/components/common/Message";
import { exportCsv } from "@/lib/exportCsv";
import {
  useSystemStore,
  type DataScope,
  type EnableStatus,
  type SystemRole,
} from "@/store/system";
import PermissionTree from "./components/PermissionTree";
import {
  ActionButton,
  CompactTable,
  FormRow,
  LinkButton,
  ModalButton,
  QueryField,
  QueryPanel,
  SystemConfirm,
  SystemModal,
  SystemPage,
  compactInputClass,
  type CompactColumn,
} from "./components/SystemAdmin";
import { DevNote } from "@/components/devNotes/DevNote";

const scopeOptions: Array<{ value: DataScope; label: string }> = [
  { value: "all", label: "全部数据权限" },
  { value: "custom", label: "指定部门数据权限" },
  { value: "department", label: "本部门数据权限" },
  { value: "departmentBelow", label: "本部门及以下数据权限" },
  { value: "self", label: "仅本人数据权限" },
];

export default function RoleManageReplica() {
  const {
    departments,
    users,
    roles,
    menus,
    addRole,
    updateRole,
    deleteRoles,
  } = useSystemStore();
  const [searchValues, setSearchValues] = useState({
    name: "",
    code: "",
    status: "",
    createdAtStart: "",
    createdAtEnd: "",
  });
  const [appliedSearch, setAppliedSearch] = useState(searchValues);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [editing, setEditing] = useState<SystemRole | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteIds, setDeleteIds] = useState<number[]>([]);
  const [permissionRole, setPermissionRole] = useState<SystemRole | null>(null);
  const [checkedMenus, setCheckedMenus] = useState<number[]>([]);
  const [scopeRole, setScopeRole] = useState<SystemRole | null>(null);
  const [scope, setScope] = useState<DataScope>("all");
  const [scopeDepartments, setScopeDepartments] = useState<number[]>([]);
  const [form, setForm] = useState({
    name: "",
    code: "",
    sort: "0",
    status: "enabled" as EnableStatus,
    remark: "",
  });

  const filteredRoles = useMemo(
    () =>
      roles.filter((role) => {
        if (appliedSearch.name && !role.name.includes(appliedSearch.name)) {
          return false;
        }
        if (appliedSearch.code && !role.code.includes(appliedSearch.code)) {
          return false;
        }
        if (appliedSearch.status && role.status !== appliedSearch.status) {
          return false;
        }
        const date = role.createdAt.slice(0, 10);
        if (appliedSearch.createdAtStart && date < appliedSearch.createdAtStart) {
          return false;
        }
        if (appliedSearch.createdAtEnd && date > appliedSearch.createdAtEnd) {
          return false;
        }
        return true;
      }),
    [appliedSearch, roles]
  );

  const openForm = (record?: SystemRole) => {
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
            sort: "0",
            status: "enabled",
            remark: "",
          }
    );
    setFormOpen(true);
  };

  const submitForm = () => {
    if (!form.name.trim()) return message.warning("请输入角色名称");
    if (!form.code.trim()) return message.warning("请输入角色标识");
    if (
      roles.some(
        (role) =>
          role.code.toLowerCase() === form.code.trim().toLowerCase() &&
          role.id !== editing?.id
      )
    ) {
      return message.warning("角色标识已存在");
    }
    const patch = {
      name: form.name.trim(),
      code: form.code.trim(),
      sort: Math.max(0, Number(form.sort) || 0),
      status: form.status,
      remark: form.remark.trim(),
    };
    if (editing) {
      if (editing.roleType === "builtin") {
        updateRole(editing.id, {
          sort: patch.sort,
          remark: patch.remark,
        });
      } else {
        updateRole(editing.id, patch);
      }
      message.success("角色信息已修改");
    } else {
      addRole({
        id: Math.max(0, ...roles.map((role) => role.id)) + 1,
        ...patch,
        roleType: "custom",
        createdAt: new Date().toLocaleString("zh-CN", { hour12: false }),
        menuIds: [],
        dataScope: "department",
        departmentIds: [],
      });
      message.success("角色已新增");
    }
    setFormOpen(false);
  };

  const requestDelete = (ids: number[]) => {
    if (!ids.length) return message.warning("请先选择需要删除的角色");
    if (
      roles.some(
        (role) => ids.includes(role.id) && role.roleType === "builtin"
      )
    ) {
      return message.warning("管理员、操作人员和浏览人员为内置角色，不能删除");
    }
    if (users.some((user) => user.roleIds.some((id) => ids.includes(id)))) {
      return message.warning("所选角色已分配用户，不能删除");
    }
    setDeleteIds(ids);
  };

  const openPermission = (role: SystemRole) => {
    setPermissionRole(role);
    setCheckedMenus(role.menuIds);
  };

  const savePermission = () => {
    if (!permissionRole) return;
    if (permissionRole.code === "ROLE_ADMIN") {
      updateRole(permissionRole.id, { menuIds: menus.map((menu) => menu.id) });
    } else if (permissionRole.code === "ROLE_VIEWER") {
      const screenMenu = menus.find((menu) => menu.path === "/screen");
      updateRole(permissionRole.id, {
        menuIds: screenMenu ? [screenMenu.id] : [],
      });
    } else if (permissionRole.code === "ROLE_OPERATOR") {
      const allowedIds = new Set(
        menus
          .filter((menu) => !menu.path.startsWith("/admin/system"))
          .map((menu) => menu.id)
      );
      updateRole(permissionRole.id, {
        menuIds: checkedMenus.filter((id) => allowedIds.has(id)),
      });
    } else {
      updateRole(permissionRole.id, { menuIds: checkedMenus });
    }
    setPermissionRole(null);
    message.success("菜单权限已保存");
  };

  const permissionMenus =
    permissionRole?.code === "ROLE_OPERATOR"
      ? menus.filter((menu) => !menu.path.startsWith("/admin/system"))
      : menus;

  const columns: CompactColumn<SystemRole>[] = [
    { key: "id", title: "角色编号", width: 80, align: "center" },
    { key: "name", title: "角色名称", width: 120 },
    {
      key: "roleType",
      title: "角色类型",
      width: 90,
      render: (record) => (
        <span
          className={`rounded-sm px-2 py-0.5 ${
            record.roleType === "builtin"
              ? "bg-red-50 text-red-400"
              : "bg-blue-50 text-blue-400"
          }`}
        >
          {record.roleType === "builtin" ? "内置" : "自定义"}
        </span>
      ),
    },
    { key: "code", title: "角色标识", width: 150 },
    { key: "sort", title: "显示顺序", width: 90 },
    {
      key: "remark",
      title: "备注",
      width: 200,
      render: (record) => record.remark || "-",
    },
    {
      key: "status",
      title: "状态",
      width: 80,
      render: (record) => (
        <span
          className={`rounded-sm px-2 py-0.5 ${
            record.status === "enabled"
              ? "bg-blue-50 text-blue-400"
              : "bg-slate-100 text-slate-400"
          }`}
        >
          {record.status === "enabled" ? "开启" : "关闭"}
        </span>
      ),
    },
    {
      key: "createdAt",
      title: "创建时间",
      width: 130,
      render: (record) => record.createdAt.slice(0, 10),
    },
    {
      key: "actions",
      title: "操作",
      width: 230,
      render: (record) => (
        <div className="flex items-center gap-3">
          <LinkButton onClick={() => openForm(record)}>编辑</LinkButton>
          <LinkButton onClick={() => openPermission(record)}>
            菜单权限
          </LinkButton>
          <LinkButton
            onClick={() => {
              setScopeRole(record);
              setScope(record.dataScope);
              setScopeDepartments(record.departmentIds);
            }}
          >
            数据权限
          </LinkButton>
          <LinkButton danger onClick={() => requestDelete([record.id])}>
            删除
          </LinkButton>
        </div>
      ),
    },
  ];

  const emptySearch = {
    name: "",
    code: "",
    status: "",
    createdAtStart: "",
    createdAtEnd: "",
  };

  return (
    <SystemPage>
      <DevNote
        id="role-query"
        title="角色管理-查询与操作区"
        summary="按名称/标识/状态/创建时间查询角色，提供新增/导出/批量删除"
        items={[
          { label: "查询条件", value: "角色名称/角色标识（包含匹配）、状态、创建时间起止" },
          { label: "交互逻辑", value: "搜索/重置；新增 → 表单弹窗；导出 → CSV（含角色类型内置/自定义）；批量删除需先勾选（内置角色不可删）" },
          { label: "权限", value: "管理员可维护角色" },
        ]}
        wrapClassName="block flex-shrink-0"
      >
      <QueryPanel
        fields={
          <>
            <QueryField label="角色名称">
              <input
                className={`${compactInputClass} w-40`}
                placeholder="请输入角色名称"
                value={searchValues.name}
                onChange={(event) =>
                  setSearchValues((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </QueryField>
            <QueryField label="角色标识">
              <input
                className={`${compactInputClass} w-40`}
                placeholder="请输入角色标识"
                value={searchValues.code}
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
                  "角色管理.csv",
                  [
                    "角色编号",
                    "角色名称",
                    "角色类型",
                    "角色标识",
                    "显示顺序",
                    "备注",
                    "状态",
                    "创建时间",
                  ],
                  filteredRoles.map((role) => [
                    role.id,
                    role.name,
                    role.roleType === "builtin" ? "内置" : "自定义",
                    role.code,
                    role.sort,
                    role.remark,
                    role.status === "enabled" ? "开启" : "关闭",
                    role.createdAt,
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
        id="role-table"
        title="角色管理-角色列表"
        summary="展示角色，行内提供编辑/菜单权限/数据权限/删除"
        items={[
          { label: "列定义", value: "角色编号/角色名称/角色类型（内置/自定义）/角色标识/显示顺序/备注/状态/创建时间/操作" },
          { label: "行操作", value: "编辑 → 表单弹窗（内置角色仅可改排序与备注）；菜单权限 → 权限树弹窗；数据权限 → 数据范围弹窗；删除 → 确认（内置角色不可删，系统管理员不可删）" },
          { label: "数据来源", value: "roles（useSystemStore）；内置角色（管理员/操作人员/浏览人员）不可删除" },
          { label: "权限", value: "管理员可维护" },
        ]}
        wrapClassName="block flex flex-1"
      >
      <CompactTable
        columns={columns}
        data={filteredRoles}
        selectedKeys={selectedKeys}
        onSelectChange={setSelectedKeys}
        minWidth={1120}
        emptyText="暂无角色数据"
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
        <DevNote
          id="role-form-modal"
          title="角色管理-新增/编辑弹窗"
          summary="维护角色名称、标识、排序、状态与备注"
          items={[
            { label: "校验规则", value: "名称/标识必填；标识全局唯一“角色标识已存在”；内置角色（管理员/操作人员/浏览人员）编辑时名称/标识/状态锁定，仅可改排序与备注" },
            { label: "交互逻辑", value: "保存 → addRole/updateRole（内置角色仅提交sort+remark）；状态开关" },
            { label: "权限", value: "管理员可维护" },
          ]}
          wrapClassName="block w-full"
        >
        <FormRow label="角色名称" required>
          <input
            className={`${compactInputClass} w-full`}
            disabled={editing?.roleType === "builtin"}
            placeholder="请输入角色名称"
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
          />
        </FormRow>
        <FormRow label="角色标识" required>
          <input
            className={`${compactInputClass} w-full`}
            disabled={editing?.roleType === "builtin"}
            placeholder="请输入角色标识"
            value={form.code}
            onChange={(event) =>
              setForm((current) => ({ ...current, code: event.target.value }))
            }
          />
        </FormRow>
        <FormRow label="显示顺序" required>
          <input
            type="number"
            min={0}
            className={`${compactInputClass} w-full`}
            placeholder="请输入显示顺序"
            value={form.sort}
            onChange={(event) =>
              setForm((current) => ({ ...current, sort: event.target.value }))
            }
          />
        </FormRow>
        <FormRow label="状态" required>
          <select
            className={`${compactInputClass} w-full`}
            disabled={editing?.roleType === "builtin"}
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
            placeholder="请输入备注"
            value={form.remark}
            onChange={(event) =>
              setForm((current) => ({ ...current, remark: event.target.value }))
            }
          />
        </FormRow>
        </DevNote>
      </SystemModal>

      <SystemModal
        open={!!permissionRole}
        onClose={() => setPermissionRole(null)}
        title="菜单权限"
        width={430}
        footer={
          <>
            <ModalButton primary onClick={savePermission}>确定</ModalButton>
            <ModalButton onClick={() => setPermissionRole(null)}>取消</ModalButton>
          </>
        }
      >
        <div className="mb-3 grid grid-cols-[72px_1fr] items-center gap-y-3">
          <span className="text-slate-500">角色名称</span>
          <span className="w-fit rounded-sm bg-blue-50 px-2 py-1 text-blue-400">
            {permissionRole?.name}
          </span>
          <span className="text-slate-500">角色标识</span>
          <span className="w-fit rounded-sm bg-blue-50 px-2 py-1 text-blue-400">
            {permissionRole?.code}
          </span>
        </div>
        <div className="mb-2 text-slate-500">菜单权限</div>
        <PermissionTree
          menus={permissionMenus}
          checked={checkedMenus}
          onChange={setCheckedMenus}
        />
      </SystemModal>

      <SystemModal
        open={!!scopeRole}
        onClose={() => setScopeRole(null)}
        title="数据权限"
        width={460}
        footer={
          <>
            <ModalButton
              primary
              onClick={() => {
                if (scopeRole) {
                  updateRole(scopeRole.id, {
                    dataScope: scope,
                    departmentIds: scope === "custom" ? scopeDepartments : [],
                  });
                }
                setScopeRole(null);
                message.success("数据权限已保存");
              }}
            >
              确定
            </ModalButton>
            <ModalButton onClick={() => setScopeRole(null)}>取消</ModalButton>
          </>
        }
      >
        <FormRow label="角色名称">
          <span className="inline-flex h-8 items-center rounded-sm bg-blue-50 px-2 text-blue-400">
            {scopeRole?.name}
          </span>
        </FormRow>
        <FormRow label="角色标识">
          <span className="inline-flex h-8 items-center rounded-sm bg-blue-50 px-2 text-blue-400">
            {scopeRole?.code}
          </span>
        </FormRow>
        <FormRow label="权限范围">
          <select
            className={`${compactInputClass} w-full`}
            value={scope}
            onChange={(event) => setScope(event.target.value as DataScope)}
          >
            {scopeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormRow>
        {scope === "custom" && (
          <FormRow label="指定部门">
            <div className="grid max-h-44 grid-cols-2 gap-2 overflow-auto rounded-sm border border-slate-200 p-3">
              {departments.map((department) => (
                <label key={department.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={scopeDepartments.includes(department.id)}
                    onChange={(event) =>
                      setScopeDepartments((current) =>
                        event.target.checked
                          ? [...current, department.id]
                          : current.filter((id) => id !== department.id)
                      )
                    }
                    className="accent-blue-500"
                  />
                  {department.name}
                </label>
              ))}
            </div>
          </FormRow>
        )}
      </SystemModal>

      <SystemConfirm
        open={deleteIds.length > 0}
        onCancel={() => setDeleteIds([])}
        onConfirm={() => {
          deleteRoles(deleteIds);
          setDeleteIds([]);
          setSelectedKeys([]);
          message.success("角色已删除");
        }}
      />
    </SystemPage>
  );
}
