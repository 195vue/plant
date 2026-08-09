import { useState, useMemo } from "react";
import { Plus, Edit, ShieldCheck } from "lucide-react";
import { roles as mockRoles } from "@/mock";
import type { Role } from "@/types";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchForm, type SearchField } from "@/components/common/SearchForm";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Modal } from "@/components/common/Modal";
import { FormItem } from "@/components/common/UploadBox";
import { StatusTag, Tag } from "@/components/common/Tag";
import { message } from "@/components/common/Message";
import PermissionTree, {
  menuPermissionTree,
  collectAllKeys,
} from "./components/PermissionTree";

const statusOptions = [
  { label: "启用", value: "enabled" },
  { label: "停用", value: "disabled" },
];

const searchFields: SearchField[] = [
  { name: "name", label: "角色名称", type: "input", placeholder: "请输入角色名称" },
  { name: "status", label: "状态", type: "select", options: statusOptions, width: "120px" },
];

// 数据权限范围选项
const dataScopeOptions = [
  { label: "全部数据", value: "all" },
  { label: "本部门数据", value: "department" },
  { label: "仅本人数据", value: "self" },
];

export default function RoleManage() {
  const [data, setData] = useState<Role[]>(mockRoles);
  const [searchValues, setSearchValues] = useState<Record<string, any>>({});
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [current, setCurrent] = useState<Role | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  // 权限分配弹窗
  const [permOpen, setPermOpen] = useState(false);
  const [permRole, setPermRole] = useState<Role | null>(null);
  const [permChecked, setPermChecked] = useState<string[]>([]);
  const [dataScope, setDataScope] = useState<"all" | "department" | "self">("all");

  const set = (name: string, value: any) => setForm({ ...form, [name]: value });

  const filteredData = useMemo(() => {
    return data.filter((r) => {
      if (searchValues.name && !r.name.includes(searchValues.name)) return false;
      if (searchValues.status && r.status !== searchValues.status) return false;
      return true;
    });
  }, [data, searchValues]);

  // 默认角色编码
  const defaultCode = `ROLE_${String(data.length + 1).padStart(2, "0")}`;

  const openAdd = () => {
    setFormMode("add");
    setCurrent(null);
    setForm({ code: defaultCode });
    setFormOpen(true);
  };

  const openEdit = (r: Role) => {
    setFormMode("edit");
    setCurrent(r);
    setForm({ name: r.name, code: r.code, description: r.description });
    setFormOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name?.trim()) return message.warning("请填写角色名称");
    if (!form.code?.trim()) return message.warning("请填写角色编码");
    if (data.some((r) => r.code === form.code && r.id !== current?.id))
      return message.warning("角色编码已存在");
    if (formMode === "add") {
      const newId = Math.max(...data.map((d) => d.id), 0) + 1;
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      setData([
        {
          id: newId, name: form.name, code: form.code, description: form.description,
          isBuiltin: false, status: "enabled", createTime: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
          dataScope: "all",
        },
        ...data,
      ]);
      message.success("角色新增成功");
    } else if (current) {
      setData(data.map((d) => (d.id === current.id ? { ...d, name: form.name, code: form.code, description: form.description } : d)));
      message.success("角色编辑成功");
    }
    setFormOpen(false);
  };

  // 打开权限分配
  const openPerm = (r: Role) => {
    setPermRole(r);
    setPermChecked(r.permissions || []);
    setDataScope(r.dataScope || "all");
    setPermOpen(true);
  };

  // 保存权限
  const savePerm = () => {
    if (permRole) {
      setData(data.map((d) => (d.id === permRole.id ? { ...d, permissions: permChecked, dataScope } : d)));
      message.success("权限保存成功");
    }
    setPermOpen(false);
  };

  const toggleStatus = (r: Role) => {
    if (r.isBuiltin) return message.warning("内置角色不可停用");
    setData(data.map((d) => (d.id === r.id ? { ...d, status: d.status === "enabled" ? "disabled" : "enabled" } : d)));
    message.success(r.status === "enabled" ? "已停用" : "已启用");
  };

  const linkBtn = (icon: React.ReactNode, label: string, onClick: () => void, danger = false) => (
    <button className={`${danger ? "btn-link-danger" : "btn-link"} flex items-center gap-0.5`} onClick={onClick}>
      {icon}{label}
    </button>
  );

  const columns: Column<Role>[] = [
    { key: "index", title: "序号", width: 60, render: (_, i) => i + 1 },
    {
      key: "name", title: "角色名称", width: 160,
      render: (r) => (
        <span className="flex items-center gap-1">
          {r.name}
          {r.isBuiltin && <Tag color="purple">内置</Tag>}
        </span>
      ),
    },
    { key: "code", title: "角色编码", width: 140, render: (r) => r.code },
    { key: "description", title: "角色描述", width: 240, render: (r) => r.description || "-" },
    { key: "createTime", title: "创建时间", width: 160, render: (r) => r.createTime },
    { key: "status", title: "状态", width: 80, render: (r) => <StatusTag status={r.status} /> },
    {
      key: "action", title: "操作", width: 240,
      render: (r) => (
        <div className="flex items-center gap-2">
          {linkBtn(<Edit size={13} />, "编辑", () => openEdit(r))}
          {linkBtn(<ShieldCheck size={13} />, "权限分配", () => openPerm(r))}
          {linkBtn(<Tag color={r.status === "enabled" ? "gray" : "green"}>{r.status === "enabled" ? "停用" : "启用"}</Tag>, "", () => toggleStatus(r))}
        </div>
      ),
    },
  ];

  const allKeys = collectAllKeys(menuPermissionTree);

  return (
    <div className="space-y-4">
      <PageHeader title="角色管理" subtitle="管理角色及菜单权限、数据权限分配" />

      <SearchForm
        fields={searchFields}
        values={searchValues}
        onChange={(name, value) => setSearchValues({ ...searchValues, [name]: value })}
        onSearch={() => message.info("搜索完成")}
        onReset={() => { setSearchValues({}); message.info("已重置搜索条件"); }}
        extraButtons={
          <button className="btn-primary flex items-center gap-1" onClick={openAdd}>
            <Plus size={14} />新增角色
          </button>
        }
      />

      <div className="admin-card p-4">
        <DataTable columns={columns} data={filteredData} pageSize={10} emptyText="暂无角色数据" />
      </div>

      {/* 新增/编辑弹窗 */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={formMode === "add" ? "新增角色" : "编辑角色"}
        width={500}
        footer={
          <>
            <button className="btn-default" onClick={() => setFormOpen(false)}>取消</button>
            <button className="btn-primary" onClick={handleSubmit}>确定</button>
          </>
        }
      >
        <FormItem label="角色名称" required>
          <input className="input-base" value={form.name || ""} onChange={(e) => set("name", e.target.value)} placeholder="请输入角色名称" />
        </FormItem>
        <FormItem label="角色编码" required>
          <input className="input-base" value={form.code || ""} onChange={(e) => set("code", e.target.value)} placeholder="自动生成，可修改" />
        </FormItem>
        <FormItem label="角色描述">
          <textarea className="input-base" rows={3} value={form.description || ""} onChange={(e) => set("description", e.target.value)} placeholder="请输入角色描述" />
        </FormItem>
      </Modal>

      {/* 权限分配弹窗 */}
      <Modal
        open={permOpen}
        onClose={() => setPermOpen(false)}
        title={`权限分配 - ${permRole?.name || ""}`}
        width={800}
        footer={
          <>
            <button className="btn-default" onClick={() => setPermOpen(false)}>取消</button>
            <button className="btn-primary" onClick={savePerm}>保存</button>
          </>
        }
      >
        <div className="flex gap-4">
          {/* 左侧菜单权限树 */}
          <div style={{ width: 350 }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-admin-text">菜单权限</span>
              <div className="flex items-center gap-2">
                <button className="btn-link text-xs" onClick={() => setPermChecked(allKeys)}>全选</button>
                <button className="btn-link text-xs" onClick={() => setPermChecked([])}>全不选</button>
              </div>
            </div>
            <div className="border border-admin-border rounded p-2 max-h-[420px] overflow-auto">
              <PermissionTree checked={permChecked} onChange={setPermChecked} />
            </div>
          </div>
          {/* 右侧数据权限范围 */}
          <div style={{ width: 350 }}>
            <div className="text-sm font-medium text-admin-text mb-2">数据权限范围</div>
            <div className="border border-admin-border rounded p-3 space-y-2">
              {dataScopeOptions.map((o) => (
                <label key={o.value} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="dataScope" checked={dataScope === o.value}
                    onChange={() => setDataScope(o.value as any)} />
                  {o.label}
                </label>
              ))}
            </div>
            <p className="text-xs text-admin-muted mt-2">
              已选权限：{permChecked.length} 项
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
