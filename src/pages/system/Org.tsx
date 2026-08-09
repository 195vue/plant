import { useState, useMemo } from "react";
import {
  Plus, Edit, Trash2, Building2, ChevronRight, ChevronDown, FolderTree,
  Users, BarChart3, Clock, Network,
} from "lucide-react";
import ReactECharts from "echarts-for-react";
import { organizations as mockOrgs, users as mockUsers } from "@/mock";
import type { Organization } from "@/types";
import { PageHeader } from "@/components/common/PageHeader";
import { Modal, ConfirmModal } from "@/components/common/Modal";
import { FormItem } from "@/components/common/UploadBox";
import { message } from "@/components/common/Message";
import { cn } from "@/lib/utils";

const flatten = (nodes: Organization[]): Organization[] => {
  const list: Organization[] = [];
  const walk = (arr: Organization[]) => {
    arr.forEach((n) => {
      list.push(n);
      if (n.children) walk(n.children);
    });
  };
  walk(nodes);
  return list;
};

const updateNode = (nodes: Organization[], id: number, updater: (n: Organization) => Organization): Organization[] =>
  nodes.map((n) => {
    if (n.id === id) return updater(n);
    if (n.children) return { ...n, children: updateNode(n.children, id, updater) };
    return n;
  });

const removeNode = (nodes: Organization[], id: number): Organization[] =>
  nodes
    .filter((n) => n.id !== id)
    .map((n) => (n.children ? { ...n, children: removeNode(n.children, id) } : n));

const findNode = (nodes: Organization[], id: number): Organization | null => {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children) {
      const found = findNode(n.children, id);
      if (found) return found;
    }
  }
  return null;
};

const countChildren = (node: Organization): number => {
  if (!node.children) return 0;
  return node.children.reduce((acc, c) => acc + 1 + countChildren(c), 0);
};

const getDepth = (nodes: Organization[]): number => {
  let max = 0;
  const walk = (arr: Organization[], d: number) => {
    max = Math.max(max, d);
    arr.forEach((n) => n.children && walk(n.children, d + 1));
  };
  walk(nodes, 1);
  return max;
};

const countAtLevel = (nodes: Organization[], level: number, current = 1): number => {
  if (current === level) return nodes.length;
  let count = 0;
  nodes.forEach((n) => {
    if (n.children) count += countAtLevel(n.children, level, current + 1);
  });
  return count;
};

export default function OrgManage() {
  const [tree, setTree] = useState<Organization[]>(mockOrgs);
  const [selectedId, setSelectedId] = useState<number>(mockOrgs[0]?.id);
  const [expanded, setExpanded] = useState<Set<number>>(new Set(mockOrgs.map((o) => o.id)));
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "addRoot" | "edit">("add");
  const [form, setForm] = useState<Record<string, any>>({});
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const flatList = useMemo(() => flatten(tree), [tree]);
  const current = useMemo(() => findNode(tree, selectedId), [tree, selectedId]);
  const parentName = (pid: number | null) =>
    pid === null ? "无（根组织）" : flatList.find((o) => o.id === pid)?.name || "-";

  const set = (n: string, v: any) => setForm({ ...form, [n]: v });
  const toggleExpand = (id: number) => {
    const next = new Set(expanded);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpanded(next);
  };

  const totalOrgs = flatList.length;
  const totalUsers = mockUsers.length;
  const rootChildren = tree.reduce((acc, n) => acc + countChildren(n), 0);

  const defaultCode = () => {
    const nums = flatList.map((o) => parseInt(o.code.replace(/\D/g, ""), 10)).filter((n) => !isNaN(n));
    const next = (Math.max(0, ...nums) + 1);
    return `ORG-${String(next).padStart(3, "0")}`;
  };

  const openAdd = (parentId: number) => {
    setFormMode("add");
    setForm({ parentId, status: "enabled", sort: 0, code: defaultCode() });
    setFormOpen(true);
  };
  const openAddRoot = () => {
    setFormMode("addRoot");
    setForm({ parentId: null, status: "enabled", sort: 0, code: defaultCode() });
    setFormOpen(true);
  };
  const openEdit = (r: Organization) => {
    setFormMode("edit");
    setForm({ ...r });
    setFormOpen(true);
  };

  const submit = () => {
    if (!form.name?.trim()) return message.warning("请填写组织名称");
    if (!form.code?.trim()) return message.warning("请填写组织编码");
    if (flatList.some((o) => o.code === form.code && o.id !== form.id))
      return message.warning("组织编码不允许重复");

    if (formMode === "edit") {
      setTree(updateNode(tree, form.id, (n) => ({
        ...n, name: form.name, code: form.code, sort: Number(form.sort) || 0,
        remark: form.remark,
      })));
      message.success("编辑成功");
    } else {
      const newId = Math.max(...flatList.map((o) => o.id), 0) + 1;
      const newNode: Organization = {
        id: newId, name: form.name, code: form.code, parentId: form.parentId,
        sort: Number(form.sort) || 0, status: "enabled", remark: form.remark,
      };
      if (form.parentId === null) {
        setTree([...tree, newNode]);
      } else {
        setTree(updateNode(tree, form.parentId, (n) => ({
          ...n, children: [...(n.children || []), newNode],
        })));
        setExpanded(new Set([...expanded, form.parentId]));
      }
      setSelectedId(newId);
      message.success("新增成功");
    }
    setFormOpen(false);
  };

  const openDelete = (r: Organization) => {
    if (r.children && r.children.length > 0) {
      message.warning("请先删除子组织");
      return;
    }
    setDeleteId(r.id);
  };
  const confirmDelete = () => {
    if (deleteId !== null) {
      setTree(removeNode(tree, deleteId));
      if (selectedId === deleteId) setSelectedId(tree[0]?.id ?? 0);
      message.success("删除成功");
    }
    setDeleteId(null);
  };

  const userCountByOrg = useMemo(() => {
    const map: Record<number, number> = {};
    flatList.forEach((o) => {
      map[o.id] = mockUsers.filter((u) => u.orgId === o.id).length;
    });
    return map;
  }, [flatList]);

  const deptBarOption = useMemo(() => {
    const data = flatList.map((o) => ({ name: o.name, value: userCountByOrg[o.id] || 0 }));
    return {
      tooltip: { trigger: "axis" },
      grid: { left: 60, right: 20, top: 20, bottom: 30 },
      xAxis: { type: "category", data: data.map((d) => d.name), axisLabel: { fontSize: 11, interval: 0, rotate: 15 } },
      yAxis: { type: "value", name: "人数" },
      series: [{
        type: "bar",
        data: data.map((d) => d.value),
        itemStyle: { color: "#3b82f6", borderRadius: [4, 4, 0, 0] },
        barWidth: 28,
      }],
    };
  }, [flatList, userCountByOrg]);

  const depth = useMemo(() => getDepth(tree), [tree]);
  const hierarchyData = useMemo(() => {
    const levels: number[] = [];
    for (let i = 1; i <= depth; i++) {
      levels.push(countAtLevel(tree, i));
    }
    return levels;
  }, [tree, depth]);

  const hierarchyOption = {
    tooltip: { trigger: "axis" },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: { type: "category", data: hierarchyData.map((_, i) => `第${i + 1}层`) },
    yAxis: { type: "value", name: "部门数" },
    series: [{
      type: "bar",
      data: hierarchyData,
      itemStyle: { color: "#10b981", borderRadius: [4, 4, 0, 0] },
      barWidth: 30,
    }],
  };

  const recentActivities = [
    { time: "2026-08-01 09:30", action: "新增组织", target: "运行部-新班组", user: "系统管理员" },
    { time: "2026-07-28 14:20", action: "编辑组织", target: "检修部", user: "张操作" },
    { time: "2026-07-25 10:15", action: "启用组织", target: "安生部", user: "系统管理员" },
    { time: "2026-07-20 16:40", action: "调整排序", target: "运行部", user: "张三" },
    { time: "2026-07-15 11:00", action: "新增组织", target: "技术供水组", user: "系统管理员" },
  ];

  const renderNode = (node: Organization, level: number) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expanded.has(node.id);
    const selected = selectedId === node.id;
    return (
      <div key={node.id}>
        <div
          className={cn(
            "flex items-center gap-1 px-2 py-1.5 cursor-pointer rounded text-sm transition-colors",
            selected ? "bg-admin-primary text-white" : "text-admin-text hover:bg-blue-50"
          )}
          style={{ paddingLeft: `${level * 18 + 6}px` }}
          onClick={() => setSelectedId(node.id)}
        >
          {hasChildren ? (
            <button onClick={(e) => { e.stopPropagation(); toggleExpand(node.id); }}
              className={cn(selected ? "text-white" : "text-admin-muted hover:text-admin-primary")}>
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : <span className="w-[14px]" />}
          <Building2 size={14} className={selected ? "text-white" : "text-admin-primary"} />
          <span className="truncate">{node.name}</span>
          <span className={cn("ml-auto text-xs", selected ? "text-white/70" : "text-admin-muted")}>
            {userCountByOrg[node.id] || 0}人
          </span>
        </div>
        {hasChildren && isExpanded && node.children!.map((c) => renderNode(c, level + 1))}
      </div>
    );
  };

  const StatCard = ({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: string }) => (
    <div className="admin-card p-4 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
        {Icon}
      </div>
      <div>
        <div className="text-sm text-admin-muted">{title}</div>
        <div className="text-2xl font-semibold text-admin-text">{value}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <PageHeader title="组织机构" subtitle="管理组织架构层级，支持树形展示与维护" />

      <div className="grid grid-cols-4 gap-4">
        <StatCard title="总部门数" value={totalOrgs} icon={<Building2 size={24} className="text-white" />} color="bg-blue-500" />
        <StatCard title="子部门数" value={rootChildren} icon={<Network size={24} className="text-white" />} color="bg-cyan-500" />
        <StatCard title="总人数" value={totalUsers} icon={<Users size={24} className="text-white" />} color="bg-purple-500" />
        <StatCard title="最大层级" value={`${depth} 层`} icon={<FolderTree size={24} className="text-white" />} color="bg-green-500" />
      </div>

      <div className="flex gap-4">
        <div className="admin-card flex flex-col" style={{ width: 300 }}>
          <div className="flex items-center justify-between px-3 py-3 border-b border-admin-border">
            <span className="text-sm font-medium text-admin-text flex items-center gap-1">
              <FolderTree size={15} className="text-admin-primary" />组织树
            </span>
            <button className="btn-link flex items-center gap-0.5 text-xs" onClick={openAddRoot}>
              <Plus size={12} />新增根组织
            </button>
          </div>
          <div className="flex-1 overflow-auto p-1">
            {tree.map((n) => renderNode(n, 0))}
          </div>
        </div>

        <div className="flex-1 admin-card p-4">
          {current ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-medium text-admin-text flex items-center gap-2">
                  <Building2 size={18} className="text-admin-primary" />
                  {current.name}
                </h3>
                <div className="flex items-center gap-2">
                  <button className="btn-primary flex items-center gap-1" onClick={() => openAdd(current.id)}>
                    <Plus size={14} />新增子组织
                  </button>
                  <button className="btn-default flex items-center gap-1" onClick={() => openEdit(current)}>
                    <Edit size={14} />编辑
                  </button>
                  <button className="btn-danger flex items-center gap-1" onClick={() => openDelete(current)}>
                    <Trash2 size={14} />删除
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                {[
                  { label: "组织名称", value: current.name },
                  { label: "组织编码", value: current.code },
                  { label: "上级组织", value: parentName(current.parentId) },
                  { label: "排序号", value: current.sort },
                  { label: "人数", value: `${userCountByOrg[current.id] || 0} 人` },
                  { label: "子部门数", value: countChildren(current) },
                  { label: "层级", value: `${current.parentId === null ? "一级" : "二级"}` },
                  { label: "备注", value: current.remark || "-" },
                ].map((f) => (
                  <div key={f.label} className="flex">
                    <span className="text-sm text-admin-muted w-24 flex-shrink-0">{f.label}：</span>
                    <span className="text-sm text-admin-text">{f.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center text-admin-muted py-16">请选择左侧组织查看详情</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="admin-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={16} className="text-admin-primary" />
            <span className="text-sm font-medium text-admin-text">部门人员分布</span>
          </div>
          <ReactECharts option={deptBarOption} style={{ height: 200 }} />
        </div>

        <div className="admin-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <FolderTree size={16} className="text-admin-primary" />
            <span className="text-sm font-medium text-admin-text">层级结构分析</span>
          </div>
          <div className="text-xs text-admin-muted mb-2">
            最大层级：{depth} 层 · 每层部门数：
          </div>
          <ReactECharts option={hierarchyOption} style={{ height: 170 }} />
        </div>

        <div className="admin-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Building2 size={16} className="text-admin-primary" />
            <span className="text-sm font-medium text-admin-text">部门编码一览</span>
          </div>
          <div className="space-y-1 max-h-[200px] overflow-auto">
            {flatList.map((o) => (
              <div key={o.id} className="flex items-center justify-between text-xs border-b border-admin-border pb-1 last:border-0">
                <span className="text-admin-text">{o.name}</span>
                <span className="font-mono text-admin-muted">{o.code}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} className="text-admin-primary" />
            <span className="text-sm font-medium text-admin-text">最近活动</span>
          </div>
          <div className="space-y-2 max-h-[200px] overflow-auto">
            {recentActivities.map((a, i) => (
              <div key={i} className="border-b border-admin-border pb-2 last:border-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-admin-text">{a.action}</span>
                  <span className="text-xs text-admin-muted">{a.time.split(" ")[0]}</span>
                </div>
                <div className="text-xs text-admin-muted mt-0.5">
                  {a.target} · {a.user}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={formMode === "edit" ? "编辑组织" : "新增组织"}
        width={500}
        footer={
          <>
            <button className="btn-default" onClick={() => setFormOpen(false)}>取消</button>
            <button className="btn-primary" onClick={submit}>确定</button>
          </>
        }
      >
        <FormItem label="组织名称" required>
          <input className="input-base" value={form.name || ""} onChange={(e) => set("name", e.target.value)} placeholder="请输入组织名称" />
        </FormItem>
        <FormItem label="组织编码" required>
          <input className="input-base" value={form.code || ""} onChange={(e) => set("code", e.target.value)} placeholder="自动生成，可修改" />
        </FormItem>
        <FormItem label="上级组织">
          <select className="input-base" value={form.parentId ?? ""} onChange={(e) => set("parentId", e.target.value === "" ? null : Number(e.target.value))}>
            <option value="">无（根组织）</option>
            {flatList.filter((o) => o.id !== form.id).map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </FormItem>
        <FormItem label="排序号">
          <input type="number" className="input-base" value={form.sort ?? 0} onChange={(e) => set("sort", e.target.value)} placeholder="请输入排序号" />
        </FormItem>
        <FormItem label="备注">
          <textarea className="input-base" rows={3} value={form.remark || ""} onChange={(e) => set("remark", e.target.value)} placeholder="请输入备注" />
        </FormItem>
      </Modal>

      <ConfirmModal
        open={deleteId !== null}
        content="确认删除该组织吗？"
        danger
        okText="删除"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}