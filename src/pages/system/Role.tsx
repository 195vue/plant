import { useMemo, useState } from "react";
import { Download, Edit, KeyRound, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchForm, type SearchField } from "@/components/common/SearchForm";
import { DataTable, type Column } from "@/components/common/DataTable";
import { ConfirmModal, Modal } from "@/components/common/Modal";
import { FormItem } from "@/components/common/UploadBox";
import { StatusTag, Tag } from "@/components/common/Tag";
import { message } from "@/components/common/Message";
import {
  useSystemStore,
  type DataScope,
  type EnableStatus,
  type SystemRole,
} from "@/store/system";
import PermissionTree from "./components/PermissionTree";
import { exportCsv } from "@/lib/exportCsv";

const searchFields: SearchField[] = [
  { name: "name", label: "角色名称", type: "input", placeholder: "请输入角色名称" },
  { name: "code", label: "角色标识", type: "input", placeholder: "请输入角色标识" },
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

const scopeOptions: Array<{ value: DataScope; label: string; description: string }> = [
  { value: "all", label: "全部数据权限", description: "可查看平台全部业务数据" },
  { value: "custom", label: "指定部门数据权限", description: "仅查看勾选部门及其数据" },
  { value: "department", label: "本部门数据权限", description: "仅查看用户归属部门数据" },
  { value: "departmentBelow", label: "本部门及以下数据权限", description: "查看归属部门及所有下级部门数据" },
  { value: "self", label: "仅本人数据权限", description: "仅查看本人创建或负责的数据" },
];

export default function RoleManage() {
  const {
    departments,
    users,
    roles,
    menus,
    addRole,
    updateRole,
    deleteRoles,
  } = useSystemStore();
  const [searchValues, setSearchValues] = useState<Record<string, string>>({});
  const [appliedSearch, setAppliedSearch] = useState<Record<string, string>>({});
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
    sort: "1",
    status: "enabled" as EnableStatus,
    remark: "",
  });

  const filteredRoles = useMemo(
    () =>
      roles.filter((item) => {
        if (appliedSearch.name && !item.name.includes(appliedSearch.name)) return false;
        if (appliedSearch.code && !item.code.includes(appliedSearch.code)) return false;
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
            sort: String(roles.length + 1),
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
        (item) =>
          item.code.toLowerCase() === form.code.trim().toLowerCase() &&
          item.id !== editing?.id
      )
    ) {
      return message.warning("角色标识已存在");
    }
    const payload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      sort: Math.max(1, Number(form.sort) || 1),
      status: form.status,
      remark: form.remark.trim(),
    };
    if (editing) {
      if (editing.roleType === "builtin") {
        updateRole(editing.id, {
          sort: payload.sort,
          remark: payload.remark,
        });
      } else {
        updateRole(editing.id, payload);
      }
      message.success("角色信息已修改");
    } else {
      addRole({
        id: Math.max(0, ...roles.map((item) => item.id)) + 1,
        ...payload,
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
    if (roles.some((item) => ids.includes(item.id) && item.roleType === "builtin")) {
      return message.warning("管理员、操作人员和浏览人员为内置角色，不能删除");
    }
    if (users.some((user) => user.roleIds.some((id) => ids.includes(id)))) {
      return message.warning("所选角色已分配用户，不能删除");
    }
    setDeleteIds(ids);
  };

  const openPermission = (record: SystemRole) => {
    if (record.code === "ROLE_ADMIN") {
      return message.info("管理员固定拥有平台全部菜单权限");
    }
    if (record.code === "ROLE_VIEWER") {
      return message.info("浏览人员固定只能访问工程总览");
    }
    setPermissionRole(record);
    setCheckedMenus(record.menuIds);
  };

  const permissionMenus =
    permissionRole?.code === "ROLE_OPERATOR"
      ? menus.filter((menu) => menu.id <= 8)
      : menus;

  const columns: Column<SystemRole>[] = [
    { key: "id", title: "角色编号", width: 100 },
    { key: "name", title: "角色名称", width: 130 },
    {
      key: "roleType",
      title: "角色类型",
      width: 110,
      render: (record) => (
        <Tag color={record.roleType === "builtin" ? "blue" : "purple"}>
          {record.roleType === "builtin" ? "内置角色" : "自定义角色"}
        </Tag>
      ),
    },
    { key: "code", title: "角色标识", width: 170 },
    { key: "sort", title: "显示顺序", width: 100 },
    { key: "remark", title: "备注", width: 220, render: (record) => record.remark || "-" },
    {
      key: "status",
      title: "状态",
      width: 90,
      render: (record) => (
        <button
          disabled={record.roleType === "builtin"}
          onClick={() =>
            updateRole(record.id, {
              status: record.status === "enabled" ? "disabled" : "enabled",
            })
          }
        >
          <StatusTag status={record.status} />
        </button>
      ),
    },
    { key: "createdAt", title: "创建时间", width: 180 },
    {
      key: "actions",
      title: "操作",
      width: 300,
      render: (record) => (
        <div className="flex items-center gap-3">
          <button className="btn-link flex items-center gap-1" onClick={() => openForm(record)}>
            <Edit size={13} />
            编辑
          </button>
          <button className="btn-link" onClick={() => openPermission(record)}>
            菜单权限
          </button>
          <button
            className="btn-link"
            onClick={() => {
              setScopeRole(record);
              setScope(record.dataScope);
              setScopeDepartments(record.departmentIds);
            }}
          >
            数据权限
          </button>
          <button className="btn-link-danger" onClick={() => requestDelete([record.id])}>
            删除
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col gap-3">
      <PageHeader
        title="角色管理"
        subtitle="维护角色信息、平台菜单权限及部门数据权限"
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
        <div className="flex items-center gap-2 mb-3">
          <button className="btn-primary flex items-center gap-1" onClick={() => openForm()}>
            <Plus size={14} />
            新增
          </button>
          <button
            className="btn-default flex items-center gap-1"
            onClick={() =>
              exportCsv(
                "角色管理.csv",
                ["角色编号", "角色名称", "角色类型", "角色标识", "显示顺序", "备注", "状态", "创建时间"],
                filteredRoles.map((item) => [
                  item.id,
                  item.name,
                  item.roleType === "builtin" ? "内置角色" : "自定义角色",
                  item.code,
                  item.sort,
                  item.remark,
                  item.status === "enabled" ? "启用" : "停用",
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
            onClick={() => requestDelete(selectedKeys.map(Number))}
          >
            <Trash2 size={14} />
            批量删除
          </button>
        </div>
        <div className="flex-1 min-h-0">
          <DataTable
            columns={columns}
            data={filteredRoles}
            selectable
            selectedKeys={selectedKeys}
            onSelectChange={setSelectedKeys}
            emptyText="暂无符合条件的角色数据"
          />
        </div>
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "编辑角色" : "新增角色"}
        width={600}
        footer={
          <>
            <button className="btn-default" onClick={() => setFormOpen(false)}>取消</button>
            <button className="btn-primary" onClick={submitForm}>确定</button>
          </>
        }
      >
        {editing?.roleType === "builtin" && (
          <div className="mb-4 rounded bg-blue-50 px-3 py-2 text-sm text-blue-700">
            内置角色的名称、标识和状态固定，仅可调整显示顺序与备注。
          </div>
        )}
        <FormItem label="角色名称" required>
          <input
            className="input-base"
            disabled={editing?.roleType === "builtin"}
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="请输入角色名称"
          />
        </FormItem>
        <FormItem label="角色标识" required>
          <input
            className="input-base"
            disabled={editing?.roleType === "builtin"}
            value={form.code}
            onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
            placeholder="例如 ROLE_MAINTAINER"
          />
        </FormItem>
        <FormItem label="显示顺序" required>
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
                  disabled={editing?.roleType === "builtin"}
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
            placeholder="请输入角色职责说明"
          />
        </FormItem>
      </Modal>

      <Modal
        open={!!permissionRole}
        onClose={() => setPermissionRole(null)}
        title={`菜单权限 - ${permissionRole?.name || ""}`}
        width={680}
        footer={
          <>
            <button className="btn-default" onClick={() => setPermissionRole(null)}>取消</button>
            <button
              className="btn-primary"
              onClick={() => {
                if (permissionRole) {
                  updateRole(permissionRole.id, { menuIds: checkedMenus });
                }
                setPermissionRole(null);
                message.success("角色菜单权限已保存");
              }}
            >
              保存
            </button>
          </>
        }
      >
        {permissionRole?.code === "ROLE_OPERATOR" && (
          <div className="mb-3 rounded bg-orange-50 px-3 py-2 text-sm text-orange-700">
            操作人员不授予系统配置权限，仅可在业务模块内进行授权。
          </div>
        )}
        <PermissionTree
          menus={permissionMenus}
          checked={checkedMenus}
          onChange={setCheckedMenus}
        />
      </Modal>

      <Modal
        open={!!scopeRole}
        onClose={() => setScopeRole(null)}
        title={`数据权限 - ${scopeRole?.name || ""}`}
        width={640}
        footer={
          <>
            <button className="btn-default" onClick={() => setScopeRole(null)}>取消</button>
            <button
              className="btn-primary"
              onClick={() => {
                if (scopeRole) {
                  updateRole(scopeRole.id, {
                    dataScope: scope,
                    departmentIds: scope === "custom" ? scopeDepartments : [],
                  });
                }
                setScopeRole(null);
                message.success("角色数据权限已保存");
              }}
            >
              保存
            </button>
          </>
        }
      >
        <div className="space-y-2">
          {scopeOptions.map((option) => (
            <label
              key={option.value}
              className={`flex items-start gap-3 rounded border p-3 ${
                scope === option.value
                  ? "border-blue-400 bg-blue-50"
                  : "border-admin-border"
              }`}
            >
              <input
                type="radio"
                className="mt-1"
                checked={scope === option.value}
                onChange={() => setScope(option.value)}
              />
              <div>
                <div className="text-sm font-medium">{option.label}</div>
                <div className="text-xs text-admin-muted">{option.description}</div>
              </div>
            </label>
          ))}
        </div>
        {scope === "custom" && (
          <div className="mt-4 rounded border border-admin-border">
            <div className="border-b border-admin-border bg-gray-50 px-3 py-2 text-sm font-medium">
              指定部门
            </div>
            <div className="grid max-h-56 grid-cols-2 gap-2 overflow-auto p-3">
              {departments.map((department) => (
                <label key={department.id} className="flex items-center gap-2 text-sm">
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
                  />
                  {department.name}
                </label>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={deleteIds.length > 0}
        title="删除角色"
        content={`确定删除选中的 ${deleteIds.length} 个自定义角色吗？`}
        danger
        okText="确认删除"
        onConfirm={() => {
          deleteRoles(deleteIds);
          setDeleteIds([]);
          setSelectedKeys([]);
          message.success("角色已删除");
        }}
        onCancel={() => setDeleteIds([])}
      />
    </div>
  );
}
