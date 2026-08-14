import { useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Download,
  Edit,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchForm, type SearchField } from "@/components/common/SearchForm";
import { DataTable, type Column } from "@/components/common/DataTable";
import { ConfirmModal, Modal } from "@/components/common/Modal";
import { FormItem } from "@/components/common/UploadBox";
import { StatusTag } from "@/components/common/Tag";
import { message } from "@/components/common/Message";
import {
  useSystemStore,
  type Department,
  type EnableStatus,
  type SystemUser,
} from "@/store/system";
import { exportCsv } from "@/lib/exportCsv";

const searchFields: SearchField[] = [
  { name: "username", label: "用户名称", type: "input", placeholder: "请输入用户名称" },
  { name: "phone", label: "手机号码", type: "input", placeholder: "请输入手机号码" },
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

const getDepartmentIds = (departments: Department[], rootId: number) => {
  const result = [rootId];
  const visit = (parentId: number) => {
    departments
      .filter((item) => item.parentId === parentId)
      .forEach((item) => {
        result.push(item.id);
        visit(item.id);
      });
  };
  visit(rootId);
  return result;
};

export default function UserManage() {
  const {
    departments,
    positions,
    roles,
    users,
    addUser,
    updateUser,
    deleteUsers,
  } = useSystemStore();
  const importRef = useRef<HTMLInputElement>(null);
  const [departmentKeyword, setDepartmentKeyword] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(
    new Set(departments.map((item) => item.id))
  );
  const [searchValues, setSearchValues] = useState<Record<string, string>>({});
  const [appliedSearch, setAppliedSearch] = useState<Record<string, string>>({});
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [editing, setEditing] = useState<SystemUser | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteIds, setDeleteIds] = useState<number[]>([]);
  const [resetUser, setResetUser] = useState<SystemUser | null>(null);
  const [roleUser, setRoleUser] = useState<SystemUser | null>(null);
  const [roleIds, setRoleIds] = useState<number[]>([]);
  const [moreId, setMoreId] = useState<number | null>(null);
  const [form, setForm] = useState({
    username: "",
    password: "",
    nickname: "",
    departmentId: "",
    phone: "",
    email: "",
    gender: "male" as "male" | "female",
    positionIds: [] as number[],
    status: "enabled" as EnableStatus,
    remark: "",
  });

  const filteredUsers = useMemo(() => {
    const departmentIds =
      selectedDepartmentId == null
        ? null
        : getDepartmentIds(departments, selectedDepartmentId);
    return users.filter((item) => {
      if (departmentIds && !departmentIds.includes(item.departmentId)) return false;
      if (
        appliedSearch.username &&
        !item.username.includes(appliedSearch.username) &&
        !item.nickname.includes(appliedSearch.username)
      ) {
        return false;
      }
      if (appliedSearch.phone && !item.phone.includes(appliedSearch.phone)) return false;
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
    });
  }, [appliedSearch, departments, selectedDepartmentId, users]);

  const departmentName = (id: number) =>
    departments.find((item) => item.id === id)?.name || "-";

  const openForm = (record?: SystemUser) => {
    setEditing(record || null);
    setForm(
      record
        ? {
            username: record.username,
            password: "",
            nickname: record.nickname,
            departmentId: String(record.departmentId),
            phone: record.phone,
            email: record.email,
            gender: record.gender,
            positionIds: record.positionIds,
            status: record.status,
            remark: record.remark,
          }
        : {
            username: "",
            password: "Wjd@123456",
            nickname: "",
            departmentId: selectedDepartmentId ? String(selectedDepartmentId) : "",
            phone: "",
            email: "",
            gender: "male",
            positionIds: [],
            status: "enabled",
            remark: "",
          }
    );
    setFormOpen(true);
  };

  const submitForm = () => {
    if (!editing && !form.username.trim()) return message.warning("请输入用户账号");
    if (!editing && form.password.length < 6) return message.warning("初始密码不能少于6位");
    if (!form.nickname.trim()) return message.warning("请输入用户昵称");
    if (!form.departmentId) return message.warning("请选择归属部门");
    if (
      users.some(
        (item) =>
          item.username.toLowerCase() === form.username.trim().toLowerCase() &&
          item.id !== editing?.id
      )
    ) {
      return message.warning("用户账号已存在");
    }
    if (form.phone && !/^1\d{10}$/.test(form.phone)) {
      return message.warning("请输入正确的手机号码");
    }
    const payload = {
      username: form.username.trim(),
      nickname: form.nickname.trim(),
      departmentId: Number(form.departmentId),
      phone: form.phone.trim(),
      email: form.email.trim(),
      gender: form.gender,
      positionIds: form.positionIds,
      status: form.status,
      remark: form.remark.trim(),
    };
    if (editing) {
      updateUser(editing.id, payload);
      message.success("用户信息已修改");
    } else {
      addUser({
        id: Math.max(0, ...users.map((item) => item.id)) + 1,
        ...payload,
        roleIds: [],
        createdAt: new Date().toLocaleString("zh-CN", { hour12: false }),
      });
      message.success("用户已新增，可通过“分配角色”设置访问权限");
    }
    setFormOpen(false);
  };

  const requestDelete = (ids: number[]) => {
    if (!ids.length) return message.warning("请先选择需要删除的用户");
    if (ids.includes(1)) return message.warning("系统管理员账号不能删除");
    setDeleteIds(ids);
  };

  const columns: Column<SystemUser>[] = [
    { key: "id", title: "用户编号", width: 100 },
    { key: "username", title: "用户名称", width: 140 },
    { key: "nickname", title: "用户昵称", width: 130 },
    {
      key: "departmentId",
      title: "部门",
      width: 140,
      render: (record) => departmentName(record.departmentId),
    },
    { key: "phone", title: "手机号码", width: 150, render: (record) => record.phone || "-" },
    {
      key: "status",
      title: "状态",
      width: 90,
      render: (record) => (
        <button
          disabled={record.id === 1}
          onClick={() =>
            updateUser(record.id, {
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
      width: 180,
      render: (record) => (
        <div className="flex items-center gap-3 relative">
          <button className="btn-link flex items-center gap-1" onClick={() => openForm(record)}>
            <Edit size={13} />
            修改
          </button>
          <button
            className="btn-link flex items-center gap-1"
            onClick={() => setMoreId(moreId === record.id ? null : record.id)}
          >
            <MoreHorizontal size={14} />
            更多
          </button>
          {moreId === record.id && (
            <div className="absolute right-0 top-7 z-30 w-32 rounded border border-admin-border bg-white py-1 shadow-lg">
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50"
                onClick={() => {
                  setResetUser(record);
                  setMoreId(null);
                }}
              >
                重置密码
              </button>
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50"
                onClick={() => {
                  setRoleUser(record);
                  setRoleIds(record.roleIds);
                  setMoreId(null);
                }}
              >
                分配角色
              </button>
              <button
                className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50"
                onClick={() => {
                  requestDelete([record.id]);
                  setMoreId(null);
                }}
              >
                删除
              </button>
            </div>
          )}
        </div>
      ),
    },
  ];

  const renderDepartmentNode = (department: Department, level: number) => {
    const children = departments
      .filter((item) => item.parentId === department.id)
      .sort((a, b) => a.sort - b.sort);
    const keywordMatched =
      !departmentKeyword ||
      department.name.includes(departmentKeyword) ||
      children.some((child) => child.name.includes(departmentKeyword));
    if (!keywordMatched) return null;
    return (
      <div key={department.id}>
        <div
          className={`flex items-center gap-1 rounded px-2 py-2 text-sm cursor-pointer ${
            selectedDepartmentId === department.id
              ? "bg-blue-50 text-admin-primary"
              : "hover:bg-gray-50 text-admin-text"
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => setSelectedDepartmentId(department.id)}
        >
          {children.length ? (
            <button
              onClick={(event) => {
                event.stopPropagation();
                setExpanded((current) => {
                  const next = new Set(current);
                  next.has(department.id)
                    ? next.delete(department.id)
                    : next.add(department.id);
                  return next;
                });
              }}
            >
              {expanded.has(department.id) ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
            </button>
          ) : (
            <span className="w-3.5" />
          )}
          <span className="truncate">{department.name}</span>
        </div>
        {(expanded.has(department.id) || departmentKeyword) &&
          children.map((child) => renderDepartmentNode(child, level + 1))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col gap-3">
      <PageHeader title="用户管理" subtitle="维护平台用户、归属部门、岗位及角色分配" />
      <div className="flex-1 min-h-0 flex gap-3">
        <aside className="admin-card w-56 flex-shrink-0 p-3 flex flex-col">
          <div className="font-medium text-sm text-admin-text mb-3">部门列表</div>
          <div className="relative mb-2">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-admin-muted"
            />
            <input
              className="input-base pl-8"
              value={departmentKeyword}
              onChange={(event) => setDepartmentKeyword(event.target.value)}
              placeholder="请输入部门名称"
            />
          </div>
          <button
            className={`mb-1 rounded px-2 py-2 text-left text-sm ${
              selectedDepartmentId == null
                ? "bg-blue-50 text-admin-primary"
                : "hover:bg-gray-50"
            }`}
            onClick={() => setSelectedDepartmentId(null)}
          >
            全部部门
          </button>
          <div className="flex-1 overflow-auto">
            {departments
              .filter((item) => item.parentId == null)
              .map((item) => renderDepartmentNode(item, 0))}
          </div>
        </aside>

        <section className="flex-1 min-w-0 flex flex-col gap-3">
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
                onClick={() => importRef.current?.click()}
              >
                <Upload size={14} />
                导入
              </button>
              <input
                ref={importRef}
                type="file"
                accept=".csv,.xlsx"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) message.success(`已选择导入文件：${file.name}`);
                  event.target.value = "";
                }}
              />
              <button
                className="btn-default flex items-center gap-1"
                onClick={() =>
                  exportCsv(
                    "用户管理.csv",
                    ["用户编号", "用户名称", "用户昵称", "部门", "手机号码", "状态", "创建时间"],
                    filteredUsers.map((item) => [
                      item.id,
                      item.username,
                      item.nickname,
                      departmentName(item.departmentId),
                      item.phone,
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
              <span className="ml-auto text-xs text-admin-muted">
                当前部门范围 {filteredUsers.length} 名用户
              </span>
            </div>
            <div className="flex-1 min-h-0">
              <DataTable
                columns={columns}
                data={filteredUsers}
                selectable
                selectedKeys={selectedKeys}
                onSelectChange={setSelectedKeys}
                emptyText="暂无符合条件的用户数据"
              />
            </div>
          </div>
        </section>
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "修改用户" : "新增用户"}
        width={720}
        footer={
          <>
            <button className="btn-default" onClick={() => setFormOpen(false)}>取消</button>
            <button className="btn-primary" onClick={submitForm}>确定</button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-x-4">
          {!editing && (
            <>
              <FormItem label="用户账号" required>
                <input
                  className="input-base"
                  value={form.username}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, username: event.target.value }))
                  }
                  placeholder="请输入登录账号"
                />
              </FormItem>
              <FormItem label="初始密码" required>
                <input
                  type="password"
                  className="input-base"
                  value={form.password}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, password: event.target.value }))
                  }
                  placeholder="不少于6位"
                />
              </FormItem>
            </>
          )}
          <FormItem label="用户昵称" required>
            <input
              className="input-base"
              value={form.nickname}
              onChange={(event) =>
                setForm((current) => ({ ...current, nickname: event.target.value }))
              }
              placeholder="请输入用户昵称"
            />
          </FormItem>
          <FormItem label="归属部门" required>
            <select
              className="input-base"
              value={form.departmentId}
              onChange={(event) =>
                setForm((current) => ({ ...current, departmentId: event.target.value }))
              }
            >
              <option value="">请选择归属部门</option>
              {departments
                .filter((item) => item.status === "enabled")
                .map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
            </select>
          </FormItem>
          <FormItem label="手机号码">
            <input
              className="input-base"
              value={form.phone}
              onChange={(event) =>
                setForm((current) => ({ ...current, phone: event.target.value }))
              }
              placeholder="请输入手机号码"
            />
          </FormItem>
          <FormItem label="邮箱">
            <input
              type="email"
              className="input-base"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({ ...current, email: event.target.value }))
              }
              placeholder="请输入邮箱"
            />
          </FormItem>
          <FormItem label="用户性别">
            <div className="flex items-center gap-5 pt-1.5">
              {[
                { value: "male", label: "男" },
                { value: "female", label: "女" },
              ].map((item) => (
                <label key={item.value} className="flex items-center gap-1.5 text-sm">
                  <input
                    type="radio"
                    checked={form.gender === item.value}
                    onChange={() =>
                      setForm((current) => ({
                        ...current,
                        gender: item.value as "male" | "female",
                      }))
                    }
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </FormItem>
          <FormItem label="状态">
            <div className="flex items-center gap-5 pt-1.5">
              {(["enabled", "disabled"] as EnableStatus[]).map((status) => (
                <label key={status} className="flex items-center gap-1.5 text-sm">
                  <input
                    type="radio"
                    checked={form.status === status}
                    onChange={() =>
                      setForm((current) => ({ ...current, status }))
                    }
                  />
                  {status === "enabled" ? "启用" : "停用"}
                </label>
              ))}
            </div>
          </FormItem>
        </div>
        <FormItem label="岗位">
          <div className="grid grid-cols-3 gap-2 rounded border border-admin-border p-3">
            {positions
              .filter((item) => item.status === "enabled")
              .map((item) => (
                <label key={item.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.positionIds.includes(item.id)}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        positionIds: event.target.checked
                          ? [...current.positionIds, item.id]
                          : current.positionIds.filter((id) => id !== item.id),
                      }))
                    }
                  />
                  {item.name}
                </label>
              ))}
          </div>
        </FormItem>
        <FormItem label="备注">
          <textarea
            className="input-base min-h-20 resize-none"
            value={form.remark}
            onChange={(event) =>
              setForm((current) => ({ ...current, remark: event.target.value }))
            }
            placeholder="请输入备注"
          />
        </FormItem>
      </Modal>

      <Modal
        open={!!roleUser}
        onClose={() => setRoleUser(null)}
        title={`分配角色 - ${roleUser?.nickname || ""}`}
        width={520}
        footer={
          <>
            <button className="btn-default" onClick={() => setRoleUser(null)}>取消</button>
            <button
              className="btn-primary"
              onClick={() => {
                if (roleUser) updateUser(roleUser.id, { roleIds });
                setRoleUser(null);
                message.success("用户角色已更新");
              }}
            >
              确定
            </button>
          </>
        }
      >
        <div className="mb-3 rounded bg-blue-50 px-3 py-2 text-sm text-blue-700">
          浏览人员仅可访问工程总览，不能进入后台管理系统。
        </div>
        <div className="space-y-2">
          {roles.map((role) => (
            <label
              key={role.id}
              className="flex items-start gap-3 rounded border border-admin-border p-3 hover:bg-gray-50"
            >
              <input
                type="checkbox"
                className="mt-1"
                checked={roleIds.includes(role.id)}
                onChange={(event) =>
                  setRoleIds((current) =>
                    event.target.checked
                      ? [...current, role.id]
                      : current.filter((id) => id !== role.id)
                  )
                }
              />
              <div>
                <div className="text-sm font-medium text-admin-text">{role.name}</div>
                <div className="text-xs text-admin-muted">{role.remark}</div>
              </div>
            </label>
          ))}
        </div>
      </Modal>

      <ConfirmModal
        open={deleteIds.length > 0}
        title="删除用户"
        content={`确定删除选中的 ${deleteIds.length} 名用户吗？删除后该用户不能再登录平台。`}
        danger
        okText="确认删除"
        onConfirm={() => {
          deleteUsers(deleteIds);
          setDeleteIds([]);
          setSelectedKeys([]);
          message.success("用户已删除");
        }}
        onCancel={() => setDeleteIds([])}
      />

      <ConfirmModal
        open={!!resetUser}
        title="重置密码"
        content={`确定将用户“${resetUser?.nickname || ""}”的密码重置为平台初始密码吗？`}
        okText="确认重置"
        onConfirm={() => {
          setResetUser(null);
          message.success("密码已重置为 Wjd@123456");
        }}
        onCancel={() => setResetUser(null)}
      />
    </div>
  );
}
