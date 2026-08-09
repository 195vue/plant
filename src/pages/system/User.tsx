import { useState, useMemo, useRef, useEffect } from "react";
import {
  Plus, Upload, Download, Edit, KeyRound, Trash2, MoreHorizontal,
  Shield, FileText, History, Users, Power,
} from "lucide-react";
import { users as mockUsers, roles as mockRoles, organizations } from "@/mock";
import type { User, Role } from "@/types";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchForm, type SearchField } from "@/components/common/SearchForm";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Modal, ConfirmModal } from "@/components/common/Modal";
import { FormItem } from "@/components/common/UploadBox";
import { StatusTag, Tag } from "@/components/common/Tag";
import { message } from "@/components/common/Message";
import { cn } from "@/lib/utils";

const flatOrgs = (() => {
  const list: { id: number; name: string }[] = [];
  const walk = (nodes: typeof organizations) => {
    nodes.forEach((n) => {
      list.push({ id: n.id, name: n.name });
      if (n.children) walk(n.children);
    });
  };
  walk(organizations);
  return list;
})();
const orgOptions = flatOrgs.map((o) => ({ label: o.name, value: String(o.id) }));
const orgName = (id: number) => flatOrgs.find((o) => o.id === id)?.name || "-";
const roleName = (ids: number[]) =>
  ids.map((id) => mockRoles.find((r) => r.id === id)?.name).filter(Boolean).join("，");

// 角色彩色标签映射
const roleTagColor: Record<string, "purple" | "blue" | "cyan"> = {
  管理员: "purple",
  操作人员: "blue",
  浏览人员: "cyan",
};

// 手机号脱敏
const maskPhone = (phone?: string) => {
  if (!phone || phone.length !== 11) return phone || "-";
  return `${phone.slice(0, 3)}****${phone.slice(7)}`;
};

const statusOptions = [
  { label: "启用", value: "enabled" },
  { label: "停用", value: "disabled" },
];

const roleOptions = mockRoles.map((r) => ({ label: r.name, value: String(r.id) }));

const userSearchFields: SearchField[] = [
  { name: "username", label: "用户名", type: "input", placeholder: "请输入用户名" },
  { name: "orgId", label: "所属部门", type: "select", options: orgOptions },
  { name: "roleId", label: "角色", type: "select", options: roleOptions },
  { name: "status", label: "状态", type: "select", options: statusOptions, width: "120px" },
];

type TabKey = "user" | "role";

export default function UserManage() {
  const [data, setData] = useState<User[]>(mockUsers);
  const [roles, setRoles] = useState<Role[]>(mockRoles);
  const [activeTab, setActiveTab] = useState<TabKey>("user");
  const [searchValues, setSearchValues] = useState<Record<string, any>>({});
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [current, setCurrent] = useState<User | Role | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [resetId, setResetId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(mockUsers[0]?.id ?? null);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(mockRoles[0]?.id ?? null);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [detailTab, setDetailTab] = useState<"info" | "role" | "perm" | "log">("info");
  const [roleFormOpen, setRoleFormOpen] = useState(false);
  const [roleFormMode, setRoleFormMode] = useState<"add" | "edit">("add");
  const [roleForm, setRoleForm] = useState<Record<string, any>>({});
  const [roleCurrent, setRoleCurrent] = useState<Role | null>(null);
  const [deleteRoleId, setDeleteRoleId] = useState<number | null>(null);

  const set = (name: string, value: any) => setForm({ ...form, [name]: value });
  const updateRoleForm = (name: string, value: any) => setRoleForm({ ...roleForm, [name]: value });

  const filteredUsers = useMemo(() => {
    return data.filter((u) => {
      if (searchValues.username && !u.username.includes(searchValues.username)) return false;
      if (searchValues.orgId && u.orgId !== Number(searchValues.orgId)) return false;
      if (searchValues.roleId && !u.roleIds.includes(Number(searchValues.roleId))) return false;
      if (searchValues.status && u.status !== searchValues.status) return false;
      return true;
    });
  }, [data, searchValues]);

  const filteredRoles = useMemo(() => {
    return roles.filter((r) => {
      if (searchValues.roleName && !r.name.includes(searchValues.roleName)) return false;
      if (searchValues.roleStatus && r.status !== searchValues.roleStatus) return false;
      return true;
    });
  }, [roles, searchValues]);

  const openAddUser = () => {
    setFormMode("add");
    setCurrent(null);
    setForm({ status: "enabled", roleIds: [] });
    setFormOpen(true);
  };

  const openEditUser = (r: User) => {
    setFormMode("edit");
    setCurrent(r);
    setForm({ ...r, roleIds: [...r.roleIds] });
    setFormOpen(true);
  };

  const checkUsername = () => {
    if (!form.username) return;
    const exists = data.some(
      (u) => u.username === form.username && u.id !== current?.id
    );
    if (exists) message.warning("该用户名已存在，请重新输入");
  };

  const toggleRole = (id: number) => {
    const ids: number[] = form.roleIds || [];
    set("roleIds", ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]);
  };

  const handleSubmitUser = () => {
    if (!form.username?.trim()) return message.warning("请填写用户名");
    if (data.some((u) => u.username === form.username && u.id !== current?.id))
      return message.warning("用户名已存在");
    if (!form.realName?.trim()) return message.warning("请填写真实姓名");
    if (!form.orgId) return message.warning("请选择所属部门");
    if (!form.phone || !/^1\d{10}$/.test(form.phone)) return message.warning("请输入正确的11位手机号");
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return message.warning("邮箱格式不正确");
    const roleIds = form.roleIds || [];
    if (roleIds.length === 0) return message.warning("请选择角色");

    if (formMode === "add") {
      const newId = Math.max(...data.map((d) => d.id), 0) + 1;
      setData([{ ...form, id: newId, password: "123456", roleIds } as User, ...data]);
      message.success("用户新增成功");
    } else if (current) {
      setData(data.map((d) => (d.id === current.id ? { ...d, ...form, roleIds } as User : d)));
      message.success("用户编辑成功");
    }
    setFormOpen(false);
  };

  const confirmReset = () => {
    setResetId(null);
    message.success("密码已重置，请通知用户首次登录后修改密码");
  };

  const toggleStatus = (r: User) => {
    setData(data.map((d) => (d.id === r.id ? { ...d, status: d.status === "enabled" ? "disabled" : "enabled" } : d)));
    message.success(r.status === "enabled" ? "已停用" : "已启用");
  };

  const openAddRole = () => {
    setRoleFormMode("add");
    setRoleCurrent(null);
    setRoleForm({ status: "enabled", isBuiltin: false, dataScope: "all" });
    setRoleFormOpen(true);
  };

  const openEditRole = (r: Role) => {
    setRoleFormMode("edit");
    setRoleCurrent(r);
    setRoleForm({ ...r });
    setRoleFormOpen(true);
  };

  const handleSubmitRole = () => {
    if (!roleForm.name?.trim()) return message.warning("请填写角色名称");
    if (!roleForm.code?.trim()) return message.warning("请填写角色编码");
    if (roles.some((r) => r.code === roleForm.code && r.id !== roleCurrent?.id))
      return message.warning("角色编码已存在");

    if (roleFormMode === "add") {
      const newId = Math.max(...roles.map((r) => r.id), 0) + 1;
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      setRoles([{
        ...roleForm, id: newId,
        createTime: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
      } as Role, ...roles]);
      message.success("角色新增成功");
    } else if (roleCurrent) {
      setRoles(roles.map((r) => r.id === roleCurrent.id ? { ...r, ...roleForm } as Role : r));
      message.success("角色编辑成功");
    }
    setRoleFormOpen(false);
  };

  const confirmDeleteRole = () => {
    if (deleteRoleId !== null) {
      setRoles(roles.filter((r) => r.id !== deleteRoleId));
      message.success("角色删除成功");
    }
    setDeleteRoleId(null);
  };

  const toggleRoleStatus = (r: Role) => {
    setRoles(roles.map((d) => d.id === r.id ? { ...d, status: d.status === "enabled" ? "disabled" : "enabled" } : d));
    message.success(r.status === "enabled" ? "已停用" : "已启用");
  };

  const linkBtn = (icon: React.ReactNode, label: string, onClick: () => void, danger = false) => (
    <button className={`${danger ? "btn-link-danger" : "btn-link"} flex items-center gap-0.5`} onClick={onClick}>
      {icon}{label}
    </button>
  );

  const userColumns: Column<User>[] = [
    { key: "index", title: "序号", width: 60, render: (_, i) => i + 1 },
    { key: "username", title: "账号", width: 100, render: (r) => <span className="font-mono text-xs">{r.username}</span> },
    { key: "realName", title: "用户姓名", width: 100, render: (r) => r.realName },
    { key: "orgId", title: "所属部门", width: 100, render: (r) => orgName(r.orgId) },
    { key: "position", title: "岗位", width: 100, render: (r) => r.position || "-" },
    {
      key: "roleIds",
      title: "角色",
      width: 120,
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.roleIds.map((rid) => {
            const role = mockRoles.find((m) => m.id === rid);
            if (!role) return null;
            return <Tag key={rid} color={roleTagColor[role.name] || "blue"}>{role.name}</Tag>;
          })}
        </div>
      ),
    },
    { key: "phone", title: "手机号", width: 130, render: (r) => <span className="font-mono text-xs">{maskPhone(r.phone)}</span> },
    { key: "status", title: "状态", width: 80, render: (r) => <StatusTag status={r.status} /> },
    { key: "lastLoginTime", title: "最近登录时间", width: 160, render: (r) => r.lastLoginTime || "-" },
    {
      key: "action",
      title: "操作",
      width: 140,
      render: (r) => (
        <div className="flex items-center gap-2">
          {linkBtn(<FileText size={13} />, "查看", () => setSelectedUserId(r.id))}
          {linkBtn(<Edit size={13} />, "编辑", () => { openEditUser(r); setSelectedUserId(r.id); })}
          <MoreActions user={r} onReset={() => setResetId(r.id)} onToggle={() => toggleStatus(r)} onAssign={() => message.info(`分配角色：${r.realName}`)} onDelete={() => setDeleteRoleId(r.id)} />
        </div>
      ),
    },
  ];

  const roleColumns: Column<Role>[] = [
    { key: "index", title: "序号", width: 60, render: (_, i) => i + 1 },
    { key: "name", title: "角色名称", width: 120, render: (r) => <Tag color={roleTagColor[r.name] || "blue"}>{r.name}</Tag> },
    { key: "code", title: "角色编码", width: 140, render: (r) => <span className="font-mono text-xs">{r.code}</span> },
    { key: "description", title: "描述", width: 200, render: (r) => r.description || "-" },
    { key: "userCount", title: "用户数", width: 90, render: (r) => data.filter((u) => u.roleIds.includes(r.id)).length },
    { key: "dataScope", title: "数据范围", width: 100, render: (r) => <Tag color="blue">{r.dataScope === "all" ? "全部" : r.dataScope === "department" ? "本部门" : "本人"}</Tag> },
    { key: "status", title: "状态", width: 80, render: (r) => <StatusTag status={r.status} /> },
    { key: "createTime", title: "创建时间", width: 160, render: (r) => r.createTime },
    {
      key: "action", title: "操作", width: 200,
      render: (r) => (
        <div className="flex items-center gap-2">
          {linkBtn(<Edit size={13} />, "编辑", () => { openEditRole(r); setSelectedRoleId(r.id); })}
          {linkBtn(<Shield size={13} />, "权限配置", () => message.info(`配置角色「${r.name}」的权限`))}
          {!r.isBuiltin && linkBtn(<Trash2 size={13} />, "删除", () => setDeleteRoleId(r.id), true)}
        </div>
      ),
    },
  ];

  const selectedUser = data.find((u) => u.id === selectedUserId);
  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  const userLogs = [
    { time: "2026-08-01 09:30", action: "登录", result: "成功" },
    { time: "2026-07-30 14:20", action: "编辑设备", result: "成功" },
    { time: "2026-07-28 10:15", action: "查询数据", result: "成功" },
    { time: "2026-07-25 16:40", action: "下载图纸", result: "成功" },
  ];

  const rolePermissions: Record<number, string[]> = {
    1: ["工程总览", "工作台", "机电数字化", "图纸管理", "资料管理", "系统配置"],
    2: ["工程总览", "工作台", "机电数字化", "图纸管理", "资料管理"],
    3: ["工程总览", "工作台"],
  };

  return (
    <div className="space-y-4">
      <PageHeader title="用户与角色管理" subtitle="统一管理系统用户和角色权限" />

      <SearchForm
        fields={activeTab === "user" ? userSearchFields : [
          { name: "roleName", label: "角色名称", type: "input", placeholder: "请输入角色名称" },
          { name: "roleStatus", label: "状态", type: "select", options: statusOptions, width: "120px" },
        ]}
        values={searchValues}
        onChange={(name, value) => setSearchValues({ ...searchValues, [name]: value })}
        onSearch={() => message.info("搜索完成")}
        onReset={() => { setSearchValues({}); message.info("已重置搜索条件"); }}
        extraButtons={
          <>
            {activeTab === "user" ? (
              <>
                <button className="btn-primary flex items-center gap-1" onClick={openAddUser}>
                  <Plus size={14} />新增用户
                </button>
                <button className="btn-default flex items-center gap-1" onClick={() => message.info("打开批量导入窗口")}>
                  <Upload size={14} />批量导入
                </button>
                <button className="btn-default flex items-center gap-1" onClick={() => message.success(`已导出 ${filteredUsers.length} 条用户数据`)}>
                  <Download size={14} />批量导出
                </button>
                <button className="btn-purple flex items-center gap-1" onClick={openAddRole}>
                  <Plus size={14} />新增角色
                </button>
                <button className="btn-default flex items-center gap-1" onClick={() => message.warning("请先选择用户")}>
                  <Power size={14} />启用/停用
                </button>
              </>
            ) : (
              <>
                <button className="btn-primary flex items-center gap-1" onClick={openAddRole}>
                  <Plus size={14} />新增角色
                </button>
                <button className="btn-default flex items-center gap-1" onClick={() => message.info("打开角色授权窗口")}>
                  <Shield size={14} />角色授权
                </button>
              </>
            )}
          </>
        }
      />

      <div className="flex gap-4" style={{ minHeight: 480 }}>
        <div className="flex-1 admin-card p-4 flex flex-col">
          <div className="flex border-b border-admin-border mb-3">
            {([
              { key: "user", label: `用户列表 (${filteredUsers.length})` },
              { key: "role", label: `角色管理 (${filteredRoles.length})` },
            ] as { key: TabKey; label: string }[]).map((tab) => (
              <div
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "px-4 py-2 cursor-pointer text-sm font-medium transition-colors border-b-2 -mb-px",
                  activeTab === tab.key
                    ? "text-admin-primary border-admin-primary"
                    : "text-admin-muted border-transparent hover:text-admin-text"
                )}
              >
                {tab.label}
              </div>
            ))}
          </div>

          {activeTab === "user" ? (
            <DataTable
              columns={userColumns}
              data={filteredUsers}
              pageSize={10}
              selectable
              selectedKeys={selectedKeys}
              onSelectChange={setSelectedKeys}
              emptyText="暂无用户数据"
              onRowClick={(r: User) => setSelectedUserId(r.id)}
              activeRowId={selectedUserId}
            />
          ) : (
            <DataTable
              columns={roleColumns}
              data={filteredRoles}
              pageSize={10}
              emptyText="暂无角色数据"
              onRowClick={(r: Role) => setSelectedRoleId(r.id)}
              activeRowId={selectedRoleId}
            />
          )}
        </div>

        <div className="admin-card flex flex-col" style={{ width: 340 }}>
          <div className="flex items-center justify-between px-3 py-3 border-b border-admin-border">
            <span className="text-sm font-medium text-admin-text flex items-center gap-1">
              <Users size={15} className="text-admin-primary" />
              {activeTab === "user" ? "用户详情" : "角色详情"}
            </span>
          </div>

          <div className="flex border-b border-admin-border px-3">
            {([
              { key: "info", label: "基础信息", icon: <FileText size={13} /> },
              { key: "role", label: activeTab === "user" ? "角色信息" : "权限信息", icon: <Shield size={13} /> },
              { key: "perm", label: activeTab === "user" ? "权限范围" : "数据范围", icon: <History size={13} /> },
              { key: "log", label: "操作记录", icon: <History size={13} /> },
            ] as { key: typeof detailTab; label: string; icon: React.ReactNode }[]).map((tab) => (
              <div
                key={tab.key}
                onClick={() => setDetailTab(tab.key)}
                className={cn(
                  "px-3 py-2 cursor-pointer text-xs flex items-center gap-1 transition-colors border-b-2 -mb-px",
                  detailTab === tab.key
                    ? "text-admin-primary border-admin-primary"
                    : "text-admin-muted border-transparent hover:text-admin-text"
                )}
              >
                {tab.icon}{tab.label}
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-auto p-4 text-sm">
            {activeTab === "user" && selectedUser ? (
              <UserDetailPanel user={selectedUser} detailTab={detailTab} rolePermissions={rolePermissions} userLogs={userLogs} />
            ) : activeTab === "role" && selectedRole ? (
              <RoleDetailPanel role={selectedRole} detailTab={detailTab} rolePermissions={rolePermissions} />
            ) : (
              <div className="text-center text-admin-muted py-16">请选择一条数据查看详情</div>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={formMode === "add" ? "新增用户" : "编辑用户"}
        width={560}
        footer={
          <>
            <button className="btn-default" onClick={() => setFormOpen(false)}>取消</button>
            <button className="btn-primary" onClick={handleSubmitUser}>确定</button>
          </>
        }
      >
        <FormItem label="用户名" required>
          <input className="input-base" value={form.username || ""} onBlur={checkUsername}
            onChange={(e) => set("username", e.target.value)} placeholder="请输入用户名" />
        </FormItem>
        <FormItem label="真实姓名" required>
          <input className="input-base" value={form.realName || ""}
            onChange={(e) => set("realName", e.target.value)} placeholder="请输入真实姓名" />
        </FormItem>
        <FormItem label="所属部门" required>
          <select className="input-base" value={form.orgId || ""} onChange={(e) => set("orgId", Number(e.target.value))}>
            <option value="">请选择</option>
            {orgOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </FormItem>
        <FormItem label="角色" required>
          <div className="flex flex-wrap gap-3 pt-1">
            {mockRoles.map((r) => (
              <label key={r.id} className="flex items-center gap-1 text-sm cursor-pointer">
                <input type="checkbox" checked={(form.roleIds || []).includes(r.id)}
                  onChange={() => toggleRole(r.id)} />
                {r.name}
              </label>
            ))}
          </div>
        </FormItem>
        <FormItem label="手机号" required>
          <input className="input-base" maxLength={11} value={form.phone || ""}
            onChange={(e) => set("phone", e.target.value.replace(/\D/g, ""))} placeholder="请输入11位手机号" />
        </FormItem>
        <FormItem label="邮箱">
          <input className="input-base" value={form.email || ""}
            onChange={(e) => set("email", e.target.value)} placeholder="请输入邮箱" />
        </FormItem>
        <FormItem label="状态">
          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input type="checkbox" checked={form.status === "enabled"}
              onChange={(e) => set("status", e.target.checked ? "enabled" : "disabled")} />
            <span className="text-sm">{form.status === "enabled" ? "启用" : "停用"}</span>
          </label>
        </FormItem>
      </Modal>

      <Modal
        open={roleFormOpen}
        onClose={() => setRoleFormOpen(false)}
        title={roleFormMode === "add" ? "新增角色" : "编辑角色"}
        width={500}
        footer={
          <>
            <button className="btn-default" onClick={() => setRoleFormOpen(false)}>取消</button>
            <button className="btn-primary" onClick={handleSubmitRole}>确定</button>
          </>
        }
      >
        <FormItem label="角色名称" required>
          <input className="input-base" value={roleForm.name || ""}
            onChange={(e) => updateRoleForm("name", e.target.value)} placeholder="请输入角色名称" />
        </FormItem>
        <FormItem label="角色编码" required>
          <input className="input-base" value={roleForm.code || ""}
            onChange={(e) => updateRoleForm("code", e.target.value)} placeholder="请输入角色编码，如 ROLE_NEW" />
        </FormItem>
        <FormItem label="描述">
          <textarea className="input-base" rows={2} value={roleForm.description || ""}
            onChange={(e) => updateRoleForm("description", e.target.value)} placeholder="请输入角色描述" />
        </FormItem>
        <FormItem label="数据范围">
          <select className="input-base" value={roleForm.dataScope || "all"} onChange={(e) => updateRoleForm("dataScope", e.target.value)}>
            <option value="all">全部数据</option>
            <option value="department">本部门数据</option>
            <option value="self">仅本人数据</option>
          </select>
        </FormItem>
        <FormItem label="状态">
          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input type="checkbox" checked={roleForm.status === "enabled"}
              onChange={(e) => updateRoleForm("status", e.target.checked ? "enabled" : "disabled")} />
            <span className="text-sm">{roleForm.status === "enabled" ? "启用" : "停用"}</span>
          </label>
        </FormItem>
      </Modal>

      <ConfirmModal
        open={resetId !== null}
        content="确定重置该用户密码吗？"
        okText="重置"
        onConfirm={confirmReset}
        onCancel={() => setResetId(null)}
      />

      <ConfirmModal
        open={deleteRoleId !== null}
        content="确定删除该角色吗？"
        danger
        okText="删除"
        onConfirm={confirmDeleteRole}
        onCancel={() => setDeleteRoleId(null)}
      />
    </div>
  );
}

// 更多操作下拉菜单组件
function MoreActions({
  user,
  onReset,
  onToggle,
  onAssign,
  onDelete,
}: {
  user: User;
  onReset: () => void;
  onToggle: () => void;
  onAssign: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        className="btn-link flex items-center gap-0.5"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
      >
        更多 <MoreHorizontal size={13} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-admin-border rounded shadow-lg z-10 min-w-[120px]">
          <button
            className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-1.5"
            onClick={(e) => { e.stopPropagation(); setOpen(false); onReset(); }}
          >
            <KeyRound size={12} className="text-cyan-500" /> 重置密码
          </button>
          <button
            className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-1.5"
            onClick={(e) => { e.stopPropagation(); setOpen(false); onToggle(); }}
          >
            <Power size={12} className="text-gray-500" /> {user.status === "enabled" ? "停用" : "启用"}
          </button>
          <button
            className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-1.5"
            onClick={(e) => { e.stopPropagation(); setOpen(false); onAssign(); }}
          >
            <Shield size={12} className="text-orange-500" /> 分配角色
          </button>
          <button
            className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-1.5 text-red-500"
            onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(); }}
          >
            <Trash2 size={12} /> 删除
          </button>
        </div>
      )}
    </div>
  );
}

function UserDetailPanel({ user, detailTab, rolePermissions, userLogs }: {
  user: User;
  detailTab: "info" | "role" | "perm" | "log";
  rolePermissions: Record<number, string[]>;
  userLogs: { time: string; action: string; result: string }[];
}) {
  if (detailTab === "info") {
    return (
      <div className="space-y-3">
        <DetailRow label="用户名" value={<span className="font-mono">{user.username}</span>} />
        <DetailRow label="用户姓名" value={user.realName} />
        <DetailRow label="所属部门" value={orgName(user.orgId)} />
        <DetailRow label="岗位" value={user.position || "-"} />
        <DetailRow label="手机号" value={<span className="font-mono">{maskPhone(user.phone)}</span>} />
        <DetailRow label="邮箱" value={user.email || "-"} />
        <DetailRow label="状态" value={<StatusTag status={user.status} />} />
        <DetailRow label="创建时间" value={user.createTime || "-"} />
        <DetailRow label="最后登录" value={user.lastLoginTime || "-"} />
        <DetailRow label="登录IP" value={<span className="font-mono">{user.loginIp || "-"}</span>} />
        <DetailRow label="用户ID" value={String(user.id)} />
        <DetailRow label="管理范围" value={user.manageScope || "-"} />
      </div>
    );
  }
  if (detailTab === "role") {
    return (
      <div className="space-y-3">
        <div className="text-xs text-admin-muted mb-1">已分配角色</div>
        <div className="flex flex-wrap gap-1">
          {user.roleIds.map((rid) => {
            const r = mockRoles.find((m) => m.id === rid);
            if (!r) return null;
            return <Tag key={rid} color={roleTagColor[r.name] || "purple"}>{r.name}</Tag>;
          })}
        </div>
        <div className="text-xs text-admin-muted mt-3 mb-1">角色描述</div>
        {user.roleIds.map((rid) => {
          const r = mockRoles.find((m) => m.id === rid);
          return r ? (
            <div key={rid} className="bg-gray-50 rounded p-2 text-xs text-admin-text">
              {r.description || "-"}
            </div>
          ) : null;
        })}
      </div>
    );
  }
  if (detailTab === "perm") {
    const allPerms = new Set<string>();
    user.roleIds.forEach((rid) => {
      (rolePermissions[rid] || []).forEach((p) => allPerms.add(p));
    });
    return (
      <div className="space-y-2">
        <div className="text-xs text-admin-muted">权限概要（继承自角色）</div>
        <div className="flex flex-wrap gap-1">
          {Array.from(allPerms).map((p) => (
            <Tag key={p} color="blue">{p}</Tag>
          ))}
        </div>
        <div className="text-xs text-admin-muted mt-3">
          数据范围：{user.roleIds.map((rid) => {
            const r = mockRoles.find((m) => m.id === rid);
            return r?.dataScope === "all" ? "全部" : r?.dataScope === "department" ? "本部门" : "本人";
          }).join("、") || "-"}
        </div>
        <div className="text-xs text-admin-muted mt-2">
          管理范围：{user.manageScope || "-"}
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {userLogs.map((log, i) => (
        <div key={i} className="border-b border-admin-border pb-2 last:border-0">
          <div className="flex items-center justify-between">
            <span className="text-admin-text text-xs">{log.action}</span>
            <Tag color={log.result === "成功" ? "green" : "red"}>{log.result}</Tag>
          </div>
          <div className="text-admin-muted text-xs mt-0.5">{log.time}</div>
        </div>
      ))}
    </div>
  );
}

function RoleDetailPanel({ role, detailTab, rolePermissions }: {
  role: Role;
  detailTab: "info" | "role" | "perm" | "log";
  rolePermissions: Record<number, string[]>;
}) {
  if (detailTab === "info") {
    return (
      <div className="space-y-3">
        <DetailRow label="角色名称" value={<Tag color={roleTagColor[role.name] || "blue"}>{role.name}</Tag>} />
        <DetailRow label="角色编码" value={<span className="font-mono">{role.code}</span>} />
        <DetailRow label="描述" value={role.description || "-"} />
        <DetailRow label="状态" value={<StatusTag status={role.status} />} />
        <DetailRow label="创建时间" value={role.createTime} />
        <DetailRow label="内置角色" value={role.isBuiltin ? "是" : "否"} />
      </div>
    );
  }
  if (detailTab === "role") {
    const perms = rolePermissions[role.id] || [];
    return (
      <div className="space-y-2">
        <div className="text-xs text-admin-muted">权限列表</div>
        <div className="flex flex-wrap gap-1">
          {perms.length > 0 ? perms.map((p) => (
            <Tag key={p} color="blue">{p}</Tag>
          )) : <span className="text-xs text-admin-muted">暂无权限数据</span>}
        </div>
      </div>
    );
  }
  if (detailTab === "perm") {
    // 数据范围详情
    const scopeType = role.dataScope || "all";
    const scopeLabel = scopeType === "all" ? "全部数据" : scopeType === "department" ? "本部门数据" : "仅本人数据";
    const scopeDesc = scopeType === "all"
      ? "可查看和维护系统中全部组织机构的数据，不受部门限制。"
      : scopeType === "department"
      ? "仅可查看和维护本人所属部门及其下属班组的数据。"
      : "仅可查看和维护本人创建或负责的数据。";
    // 受影响用户
    const affectedUsers = mockUsers.filter((u) => u.roleIds.includes(role.id));
    // 可见业务模块（从权限列表推导）
    const perms = rolePermissions[role.id] || [];
    return (
      <div className="space-y-3">
        <DetailRow label="数据范围" value={<Tag color="blue">{scopeLabel}</Tag>} />
        <div className="text-xs text-admin-muted leading-relaxed bg-gray-50 rounded p-2">{scopeDesc}</div>
        <DetailRow label="受影响用户" value={`${affectedUsers.length} 人`} />
        {affectedUsers.length > 0 && (
          <div className="space-y-1">
            {affectedUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between text-xs">
                <span className="text-admin-text">{u.realName}</span>
                <span className="text-admin-muted">{orgName(u.orgId)}</span>
              </div>
            ))}
          </div>
        )}
        <div className="border-t border-admin-border pt-2 mt-2">
          <div className="text-xs text-admin-muted mb-1">可见业务模块</div>
          <div className="flex flex-wrap gap-1">
            {perms.length > 0 ? perms.map((p) => (
              <Tag key={p} color="green">{p}</Tag>
            )) : <span className="text-xs text-admin-muted">暂未配置菜单权限</span>}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {[
        { time: "2026-08-01 09:30", action: "角色启用", result: "成功" },
        { time: "2026-07-25 14:20", action: "权限更新", result: "成功" },
        { time: "2026-07-20 10:00", action: "角色创建", result: "成功" },
      ].map((log, i) => (
        <div key={i} className="border-b border-admin-border pb-2 last:border-0">
          <div className="flex items-center justify-between">
            <span className="text-admin-text text-xs">{log.action}</span>
            <Tag color={log.result === "成功" ? "green" : "red"}>{log.result}</Tag>
          </div>
          <div className="text-admin-muted text-xs mt-0.5">{log.time}</div>
        </div>
      ))}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex">
      <span className="text-admin-muted w-20 flex-shrink-0">{label}：</span>
      <span className="text-admin-text break-all">{value}</span>
    </div>
  );
}
