import { useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Download,
  FileSpreadsheet,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { message } from "@/components/common/Message";
import { exportCsv } from "@/lib/exportCsv";
import {
  useSystemStore,
  type Department,
  type SystemUser,
} from "@/store/system";
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
  ToggleSwitch,
  compactInputClass,
  type CompactColumn,
} from "./components/SystemAdmin";
import { DevNote } from "@/components/devNotes/DevNote";

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

export default function UserManageReplica() {
  const {
    departments,
    positions,
    roles,
    users,
    addUser,
    updateUser,
    deleteUsers,
  } = useSystemStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [departmentKeyword, setDepartmentKeyword] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(
    null
  );
  const [expanded, setExpanded] = useState(
    new Set(departments.map((department) => department.id))
  );
  const [searchValues, setSearchValues] = useState({
    username: "",
    phone: "",
    status: "",
    createdAtStart: "",
    createdAtEnd: "",
  });
  const [appliedSearch, setAppliedSearch] = useState(searchValues);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [editing, setEditing] = useState<SystemUser | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [overwrite, setOverwrite] = useState(false);
  const [deleteIds, setDeleteIds] = useState<number[]>([]);
  const [moreId, setMoreId] = useState<number | null>(null);
  const [resetUser, setResetUser] = useState<SystemUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [roleUser, setRoleUser] = useState<SystemUser | null>(null);
  const [roleIds, setRoleIds] = useState<number[]>([]);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    nickname: "",
    departmentId: "",
    phone: "",
    email: "",
    gender: "male" as "male" | "female",
    positionId: "",
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
      if (appliedSearch.phone && !item.phone.includes(appliedSearch.phone)) {
        return false;
      }
      if (appliedSearch.status && item.status !== appliedSearch.status) {
        return false;
      }
      const date = item.createdAt.slice(0, 10);
      if (appliedSearch.createdAtStart && date < appliedSearch.createdAtStart) {
        return false;
      }
      if (appliedSearch.createdAtEnd && date > appliedSearch.createdAtEnd) {
        return false;
      }
      return true;
    });
  }, [appliedSearch, departments, selectedDepartmentId, users]);

  const departmentName = (id: number) =>
    departments.find((department) => department.id === id)?.name || "-";

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
            positionId: record.positionIds[0]
              ? String(record.positionIds[0])
              : "",
            remark: record.remark,
          }
        : {
            username: "",
            password: "",
            nickname: "",
            departmentId: selectedDepartmentId
              ? String(selectedDepartmentId)
              : "",
            phone: "",
            email: "",
            gender: "male",
            positionId: "",
            remark: "",
          }
    );
    setFormOpen(true);
  };

  const submitForm = () => {
    if (!form.nickname.trim()) return message.warning("请输入用户昵称");
    if (!form.departmentId) return message.warning("请选择归属部门");
    if (!editing && !form.username.trim()) {
      return message.warning("请输入用户名称");
    }
    if (!editing && !form.password.trim()) {
      return message.warning("请输入用户密码");
    }
    if (
      users.some(
        (item) =>
          item.username.toLowerCase() === form.username.trim().toLowerCase() &&
          item.id !== editing?.id
      )
    ) {
      return message.warning("用户名称已存在");
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
      positionIds: form.positionId ? [Number(form.positionId)] : [],
      remark: form.remark.trim(),
    };
    if (editing) {
      updateUser(editing.id, payload);
      message.success("用户信息已修改");
    } else {
      addUser({
        id: Math.max(0, ...users.map((user) => user.id)) + 1,
        ...payload,
        roleIds: [],
        status: "enabled",
        createdAt: new Date().toLocaleString("zh-CN", { hour12: false }),
      });
      message.success("用户已新增");
    }
    setFormOpen(false);
  };

  const requestDelete = (ids: number[]) => {
    if (!ids.length) return message.warning("请先选择需要删除的用户");
    if (ids.includes(1)) return message.warning("系统管理员账号不能删除");
    setDeleteIds(ids);
  };

  const columns: CompactColumn<SystemUser>[] = [
    { key: "id", title: "用户编号", width: 90, align: "center" },
    { key: "username", title: "用户名称", width: 130 },
    { key: "nickname", title: "用户昵称", width: 120 },
    {
      key: "departmentId",
      title: "部门",
      width: 130,
      render: (record) => departmentName(record.departmentId),
    },
    {
      key: "phone",
      title: "手机号码",
      width: 130,
      render: (record) => record.phone || "-",
    },
    {
      key: "status",
      title: "状态",
      width: 80,
      render: (record) => (
        <ToggleSwitch
          checked={record.status === "enabled"}
          disabled={record.id === 1}
          onChange={(checked) =>
            updateUser(record.id, {
              status: checked ? "enabled" : "disabled",
            })
          }
        />
      ),
    },
    {
      key: "createdAt",
      title: "创建时间",
      width: 140,
      render: (record) => record.createdAt.slice(0, 10),
    },
    {
      key: "actions",
      title: "操作",
      width: 145,
      render: (record) => (
        <div className="relative flex items-center gap-2">
          <LinkButton onClick={() => openForm(record)}>修改</LinkButton>
          <span className="text-slate-300">»</span>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-blue-500"
            onClick={() => setMoreId(moreId === record.id ? null : record.id)}
          >
            <MoreHorizontal size={13} />
            更多
          </button>
          {moreId === record.id && (
            <div className="absolute right-0 top-6 z-30 w-28 rounded-sm border border-slate-200 bg-white py-1 shadow-lg">
              <button
                type="button"
                className="block w-full px-3 py-2 text-left hover:bg-slate-50"
                onClick={() => {
                  requestDelete([record.id]);
                  setMoreId(null);
                }}
              >
                删除
              </button>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left hover:bg-slate-50"
                onClick={() => {
                  setResetUser(record);
                  setNewPassword("");
                  setMoreId(null);
                }}
              >
                重置密码
              </button>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left hover:bg-slate-50"
                onClick={() => {
                  setRoleUser(record);
                  setRoleIds(record.roleIds);
                  setRoleDropdownOpen(false);
                  setMoreId(null);
                }}
              >
                分配角色
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
    const selfMatched = department.name.includes(departmentKeyword);
    const descendantMatched = getDepartmentIds(departments, department.id)
      .filter((id) => id !== department.id)
      .some((id) =>
        departments.find((item) => item.id === id)?.name.includes(departmentKeyword)
      );
    if (departmentKeyword && !selfMatched && !descendantMatched) return null;

    return (
      <div key={department.id}>
        <button
          type="button"
          onClick={() => setSelectedDepartmentId(department.id)}
          className={`flex h-8 w-full items-center gap-1 rounded-sm text-left ${
            selectedDepartmentId === department.id
              ? "bg-blue-50 text-blue-500"
              : "text-slate-600 hover:bg-slate-50"
          }`}
          style={{ paddingLeft: level * 16 + 8 }}
        >
          {children.length ? (
            <span
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
                <ChevronDown size={13} />
              ) : (
                <ChevronRight size={13} />
              )}
            </span>
          ) : (
            <span className="w-[13px]" />
          )}
          <span className="truncate">{department.name}</span>
        </button>
        {(expanded.has(department.id) || !!departmentKeyword) &&
          children.map((child) => renderDepartmentNode(child, level + 1))}
      </div>
    );
  };

  const emptySearch = {
    username: "",
    phone: "",
    status: "",
    createdAtStart: "",
    createdAtEnd: "",
  };

  return (
    <SystemPage>
      <div className="flex min-h-0 flex-1 gap-2">
        <DevNote
          id="user-dept-tree"
          title="用户管理-左侧部门树"
          summary="按部门层级筛选用户列表"
          items={[
            { label: "数据来源", value: "departments（useSystemStore）；getDepartmentIds 递归收集选中部门及全部后代" },
            { label: "交互逻辑", value: "搜索框按部门名称过滤（命中自身或后代则保留）；点击部门节点 → 列表按该部门及后代筛选；展开/收起箭头" },
            { label: "权限", value: "管理员/操作人员可查看" },
          ]}
          wrapClassName="flex flex-shrink-0"
        >
        <aside className="flex w-40 shrink-0 flex-col rounded-sm border border-slate-200 bg-white p-2">
          <div className="relative mb-2">
            <Search
              size={13}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-300"
            />
            <input
              className={`${compactInputClass} w-full pl-7`}
              placeholder="请输入部门名称"
              value={departmentKeyword}
              onChange={(event) => setDepartmentKeyword(event.target.value)}
            />
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            {departments
              .filter((department) => department.parentId == null)
              .map((department) => renderDepartmentNode(department, 0))}
          </div>
        </aside>
        </DevNote>

        <section className="flex min-w-0 flex-1 flex-col gap-2">
          <DevNote
            id="user-query-panel"
            title="用户管理-查询与操作区"
            summary="按用户名/手机号/状态/创建时间查询用户，提供新增/导入/导出/批量删除"
            items={[
              { label: "查询条件", value: "用户名称（username或nickname包含）、手机号码、状态（开启/关闭）、创建时间起止（按日期字符串比较）" },
              { label: "交互逻辑", value: "“搜索”将条件应用到 appliedSearch 触发筛选；“重置”清空；“新增”→ 表单弹窗；导入 → Excel弹窗（xls/xlsx）；导出 → CSV（当前筛选结果，含用户编号/名称/昵称/部门/手机/状态/创建时间）；批量删除需先勾选行（禁用未勾选）" },
              { label: "权限", value: "管理员/操作人员" },
            ]}
            wrapClassName="block flex-shrink-0"
          >
          <QueryPanel
            fields={
              <>
                <QueryField label="用户名称">
                  <input
                    className={`${compactInputClass} w-36`}
                    placeholder="请输入用户名称"
                    value={searchValues.username}
                    onChange={(event) =>
                      setSearchValues((current) => ({
                        ...current,
                        username: event.target.value,
                      }))
                    }
                  />
                </QueryField>
                <QueryField label="手机号码">
                  <input
                    className={`${compactInputClass} w-36`}
                    placeholder="请输入手机号码"
                    value={searchValues.phone}
                    onChange={(event) =>
                      setSearchValues((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                  />
                </QueryField>
                <QueryField label="状态">
                  <select
                    className={`${compactInputClass} w-36`}
                    value={searchValues.status}
                    onChange={(event) =>
                      setSearchValues((current) => ({
                        ...current,
                        status: event.target.value,
                      }))
                    }
                  >
                    <option value="">请选择用户状态</option>
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
                  tone="warning"
                  icon={<Upload size={13} />}
                  onClick={() => {
                    setImportFile(null);
                    setImportOpen(true);
                  }}
                >
                  导入
                </ActionButton>
                <ActionButton
                  tone="success"
                  icon={<Download size={13} />}
                  onClick={() =>
                    exportCsv(
                      "用户管理.csv",
                      [
                        "用户编号",
                        "用户名称",
                        "用户昵称",
                        "部门",
                        "手机号码",
                        "状态",
                        "创建时间",
                      ],
                      filteredUsers.map((item) => [
                        item.id,
                        item.username,
                        item.nickname,
                        departmentName(item.departmentId),
                        item.phone,
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
            id="user-table"
            title="用户管理-用户列表"
            summary="分页展示用户，行内提供修改/更多（删除/重置密码/分配角色）"
            items={[
              { label: "列定义", value: "用户编号/用户名称/用户昵称/部门/手机号码/状态（开关切换，系统管理员禁用）/创建时间/操作" },
              { label: "行操作", value: "修改→表单弹窗；“更多”下拉：删除（系统管理员id=1不可删）/重置密码/分配角色；状态开关直接更新" },
              { label: "数据来源", value: "users（useSystemStore），删除/新增/修改走 store actions" },
              { label: "权限", value: "管理员/操作人员" },
            ]}
            wrapClassName="block flex flex-1"
          >
          <CompactTable
            columns={columns}
            data={filteredUsers}
            selectedKeys={selectedKeys}
            onSelectChange={setSelectedKeys}
            minWidth={930}
            emptyText="暂无用户数据"
          />
          </DevNote>
        </section>
      </div>

      <SystemModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "编辑" : "新增"}
        width={560}
        footer={
          <>
            <ModalButton primary onClick={submitForm}>确定</ModalButton>
            <ModalButton onClick={() => setFormOpen(false)}>取消</ModalButton>
          </>
        }
      >
        <DevNote
          id="user-form-modal"
          title="用户管理-新增/编辑弹窗"
          summary="新增或编辑用户基本信息"
          items={[
            { label: "校验规则", value: "昵称必填“请输入用户昵称”；归属部门必选；新增时用户名/密码必填；用户名全局唯一（大小写不敏感）“用户名称已存在”；手机号格式 /^1\\d{10}$/“请输入正确的手机号码”" },
            { label: "交互逻辑", value: "新增/编辑共用表单；编辑时用户名/密码不显示（不可改）；归属部门默认=左侧选中部门；岗位单选（positionIds取第一个）；保存走 updateUser/addUser（store）" },
            { label: "权限", value: "管理员/操作人员" },
            { label: "后续步骤", value: "正式系统：密码加密存储，手机/邮箱二次校验" },
          ]}
          wrapClassName="block w-full"
        >
        <div className="grid grid-cols-2 gap-x-3">
          <FormRow label="用户昵称" required>
            <input
              className={`${compactInputClass} w-full`}
              placeholder="请输入用户昵称"
              value={form.nickname}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  nickname: event.target.value,
                }))
              }
            />
          </FormRow>
          <FormRow label="归属部门">
            <select
              className={`${compactInputClass} w-full`}
              value={form.departmentId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  departmentId: event.target.value,
                }))
              }
            >
              <option value="">请选择归属部门</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </FormRow>
          <FormRow label="手机号码">
            <input
              className={`${compactInputClass} w-full`}
              placeholder="请输入手机号码"
              value={form.phone}
              onChange={(event) =>
                setForm((current) => ({ ...current, phone: event.target.value }))
              }
            />
          </FormRow>
          <FormRow label="邮箱">
            <input
              className={`${compactInputClass} w-full`}
              placeholder="请输入邮箱"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({ ...current, email: event.target.value }))
              }
            />
          </FormRow>
          {!editing && (
            <>
              <FormRow label="用户名称" required>
                <input
                  className={`${compactInputClass} w-full`}
                  placeholder="请输入用户名称"
                  value={form.username}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      username: event.target.value,
                    }))
                  }
                />
              </FormRow>
              <FormRow label="用户密码" required>
                <input
                  type="password"
                  className={`${compactInputClass} w-full`}
                  placeholder="请输入用户密码"
                  value={form.password}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                />
              </FormRow>
            </>
          )}
          <FormRow label="用户性别">
            <select
              className={`${compactInputClass} w-full`}
              value={form.gender}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  gender: event.target.value as "male" | "female",
                }))
              }
            >
              <option value="male">男</option>
              <option value="female">女</option>
            </select>
          </FormRow>
          <FormRow label="岗位">
            <select
              className={`${compactInputClass} w-full`}
              value={form.positionId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  positionId: event.target.value,
                }))
              }
            >
              <option value="">请选择</option>
              {positions.map((position) => (
                <option key={position.id} value={position.id}>
                  {position.name}
                </option>
              ))}
            </select>
          </FormRow>
        </div>
        <FormRow label="备注">
          <textarea
            className={`${compactInputClass} min-h-[68px] w-full resize-none py-2`}
            placeholder="请输入内容"
            value={form.remark}
            onChange={(event) =>
              setForm((current) => ({ ...current, remark: event.target.value }))
            }
          />
        </FormRow>
        </DevNote>
      </SystemModal>

      <SystemModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="用户导入"
        width={360}
        footer={
          <>
            <ModalButton
              primary
              onClick={() => {
                if (!importFile) return message.warning("请先选择导入文件");
                setImportOpen(false);
                message.success(`已导入文件：${importFile.name}`);
              }}
            >
              确定
            </ModalButton>
            <ModalButton onClick={() => setImportOpen(false)}>取消</ModalButton>
          </>
        }
      >
        <DevNote
          id="user-import-modal"
          title="用户管理-导入弹窗"
          summary="通过Excel批量导入用户，可选覆盖已存在用户"
          items={[
            { label: "校验规则", value: "仅 xls/xlsx 格式；未选文件点确定提示“请先选择导入文件”" },
            { label: "交互逻辑", value: "点击/拖拽选择文件显示文件名；勾选“是否更新已经存在的用户数据”控制覆盖策略；下载模板为提示占位" },
            { label: "权限", value: "管理员/操作人员" },
            { label: "后续步骤", value: "正式系统：服务端解析Excel并逐条校验（用户名唯一/手机格式/部门存在）" },
          ]}
          wrapClassName="block w-full"
        >
        <button
          type="button"
          className="flex h-24 w-full flex-col items-center justify-center rounded-sm border border-dashed border-slate-200 text-slate-400 hover:border-blue-300"
          onClick={() => fileRef.current?.click()}
        >
          <FileSpreadsheet size={22} className="mb-2" />
          <span>{importFile ? importFile.name : "将文件拖到此处，或点击上传"}</span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".xls,.xlsx"
          className="hidden"
          onChange={(event) => setImportFile(event.target.files?.[0] || null)}
        />
        <div className="mt-4 flex items-center justify-center gap-2 text-slate-500">
          <input
            type="checkbox"
            checked={overwrite}
            onChange={(event) => setOverwrite(event.target.checked)}
            className="accent-blue-500"
          />
          <span>是否更新已经存在的用户数据</span>
        </div>
        <div className="mt-2 text-center text-slate-400">
          仅允许导入 xls、xlsx 格式文件。
          <button
            type="button"
            className="ml-1 text-blue-500"
            onClick={() => message.info("用户导入模板已下载")}
          >
            下载模板
          </button>
        </div>
        </DevNote>
      </SystemModal>

      <DevNote
        id="user-role-modal"
        title="用户管理-分配角色弹窗"
        summary="为用户勾选一个或多个角色"
        items={[
          { label: "数据来源", value: "roleUser（当前用户）+ roleIds（回填该用户已有角色）；roles 来自 store" },
          { label: "交互逻辑", value: "下拉面板多选角色（复选框），已选角色名以顿号拼接显示；确定 → updateUser(roleUser.id, { roleIds }) 并提示“角色分配已保存”" },
          { label: "权限", value: "管理员可分配角色" },
        ]}
        wrapClassName="block w-full"
      >
      <SystemModal
        open={!!roleUser}
        onClose={() => setRoleUser(null)}
        title="分配角色"
        width={400}
        footer={
          <>
            <ModalButton
              primary
              onClick={() => {
                if (roleUser) updateUser(roleUser.id, { roleIds });
                setRoleUser(null);
                message.success("角色分配已保存");
              }}
            >
              确定
            </ModalButton>
            <ModalButton onClick={() => setRoleUser(null)}>取消</ModalButton>
          </>
        }
      >
        <FormRow label="用户名称">
          <input
            className={`${compactInputClass} w-full`}
            value={roleUser?.username || ""}
            disabled
          />
        </FormRow>
        <FormRow label="用户昵称">
          <input
            className={`${compactInputClass} w-full`}
            value={roleUser?.nickname || ""}
            disabled
          />
        </FormRow>
        <FormRow label="角色">
          <div className="relative">
            <button
              type="button"
              className={`${compactInputClass} flex w-full items-center justify-between text-left`}
              onClick={() => setRoleDropdownOpen((open) => !open)}
            >
              <span className="truncate">
                {roleIds.length
                  ? roles
                      .filter((role) => roleIds.includes(role.id))
                      .map((role) => role.name)
                      .join("、")
                  : "请选择角色"}
              </span>
              <ChevronDown size={13} />
            </button>
            {roleDropdownOpen && (
              <div className="absolute left-0 right-0 top-9 z-20 max-h-48 overflow-auto rounded-sm border border-slate-200 bg-white py-1 shadow-lg">
                {roles.map((role) => (
                  <label
                    key={role.id}
                    className="flex h-8 items-center gap-2 px-3 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={roleIds.includes(role.id)}
                      onChange={(event) =>
                        setRoleIds((current) =>
                          event.target.checked
                            ? [...current, role.id]
                            : current.filter((id) => id !== role.id)
                        )
                      }
                      className="accent-blue-500"
                    />
                    <span>{role.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </FormRow>
      </SystemModal>
      </DevNote>

      <SystemModal
        open={!!resetUser}
        onClose={() => setResetUser(null)}
        title="温馨提示"
        width={300}
        footer={
          <>
            <ModalButton onClick={() => setResetUser(null)}>取消</ModalButton>
            <ModalButton
              primary
              onClick={() => {
                if (!newPassword.trim()) return message.warning("请输入新密码");
                setResetUser(null);
                message.success("用户密码已重置");
              }}
            >
              确定
            </ModalButton>
          </>
        }
      >
        <DevNote
          id="user-reset-pwd"
          title="用户管理-重置密码弹窗"
          summary="输入新密码完成指定用户的密码重置"
          items={[
            { label: "校验规则", value: "新密码必填“请输入新密码”" },
            { label: "交互逻辑", value: "显示目标用户名“请输入「xxx」的新密码”；确定 → 提示“用户密码已重置”（原型不持久化）" },
            { label: "权限", value: "管理员可重置任意用户密码" },
            { label: "后续步骤", value: "正式系统：调用账号服务重置并校验密码强度" },
          ]}
          wrapClassName="block w-full"
        >
        <div className="mb-3 flex items-center gap-2 text-slate-600">
          <span className="text-amber-500">●</span>
          请输入“{resetUser?.username || ""}”的新密码
        </div>
        <input
          type="password"
          autoFocus
          className={`${compactInputClass} w-full`}
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
        />
        </DevNote>
      </SystemModal>

      <SystemConfirm
        open={deleteIds.length > 0}
        onCancel={() => setDeleteIds([])}
        onConfirm={() => {
          deleteUsers(deleteIds);
          setDeleteIds([]);
          setSelectedKeys([]);
          message.success("用户已删除");
        }}
      />
    </SystemPage>
  );
}
