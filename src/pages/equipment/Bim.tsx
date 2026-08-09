import { useState, useMemo, useRef, useEffect } from "react";
import {
  ChevronRight,
  ChevronDown,
  ChevronDown as Down,
  Search,
  Layers,
  Box,
  GitBranch,
  CircleDot,
  Settings,
} from "lucide-react";
import { equipments, pipelines, systems } from "@/mock";
import { PageHeader } from "@/components/common/PageHeader";
import { message } from "@/components/common/Message";
import AttrPanelModal, { type AttrItem } from "./components/AttrPanelModal";

// 树节点
interface BimNode {
  key: string;
  code: string;
  name: string;
  type: string; // 系统/子系统/设备/管路/部件
  quantity: number;
  attrSummary: string;
  attrs: AttrItem[];
  level: number;
  children?: BimNode[];
}

const layers = ["全部", "发电机层", "水轮机层", "蜗壳层", "尾水管层"];

// 设备类型对应的部件
const componentMap: Record<string, string[]> = {
  水泵水轮机: ["转轮", "主轴", "导水机构"],
  发电电动机: ["定子", "转子", "推力轴承"],
  水泵: ["叶轮", "泵壳", "电机"],
  进水阀: ["阀体", "阀瓣", "操作机构"],
  空压机: ["主机", "储气罐", "冷却器"],
  主变压器: ["铁芯", "绕组", "散热器"],
  开关柜: ["断路器", "母线", "继电器"],
};

// 构建设备属性：直接使用设备已生成的属性列表
const buildEquipAttrs = (eq: (typeof equipments)[number]): AttrItem[] => {
  return (eq.attributes || []).map((a) => ({
    name: a.name,
    value: a.value || "",
    unit: a.unit,
  }));
};

// 构建管路属性
const buildPipelineAttrs = (p: (typeof pipelines)[number]): AttrItem[] => [
  { name: "管径", value: p.dn || "" },
  { name: "材质", value: p.material || "" },
  { name: "长度", value: p.length?.toString() || "", unit: "m" },
  { name: "介质", value: p.medium || "" },
  { name: "设计压力", value: p.designPressure?.toString() || "", unit: "MPa" },
];

// 取前3个有值的属性作为摘要
const summary = (attrs: AttrItem[]) =>
  attrs
    .filter((a) => a.value)
    .slice(0, 3)
    .map((a) => a.value)
    .join(" / ") || "-";

// 构建4级树：系统→子系统→设备/管路→部件
function buildTree(selectedSystems: string[], layer: string): BimNode[] {
  const usedSystems =
    selectedSystems.length > 0
      ? systems.filter((s) => selectedSystems.includes(s))
      : systems;
  const layerMatch = (loc: string) =>
    layer === "全部" || (loc && loc.includes(layer));

  return usedSystems.map((sys) => {
    const sysEquips = equipments.filter(
      (e) => e.system === sys && layerMatch(e.location)
    );
    const sysPipelines = pipelines.filter((p) => p.system === sys);
    const subsystems: BimNode[] = [];

    // 按专业分子系统
    Array.from(new Set(sysEquips.map((e) => e.major))).forEach((major) => {
      const equips = sysEquips.filter((e) => e.major === major);
      const equipNodes: BimNode[] = equips.map((eq) => {
        const attrs = buildEquipAttrs(eq);
        const parts = componentMap[eq.type] || ["本体"];
        return {
          key: `eq-${eq.id}`,
          code: eq.code,
          name: eq.name,
          type: "设备",
          quantity: parts.length,
          attrSummary: summary(attrs),
          attrs,
          level: 3,
          children: parts.map((p, i) => ({
            key: `${eq.id}-part-${i}`,
            code: `${eq.code}-P${i + 1}`,
            name: p,
            type: "部件",
            quantity: 1,
            attrSummary: "-",
            attrs: [
              { name: "所属设备", value: eq.name },
              { name: "部件名称", value: p },
            ],
            level: 4,
          })),
        };
      });
      subsystems.push({
        key: `${sys}-${major}`,
        code: `SUB-${major}`,
        name: `${major}子系统`,
        type: "子系统",
        quantity: equipNodes.length,
        attrSummary: "-",
        attrs: [],
        level: 2,
        children: equipNodes,
      });
    });

    // 管路子系统
    if (sysPipelines.length > 0) {
      const plNodes: BimNode[] = sysPipelines.map((p) => {
        const attrs = buildPipelineAttrs(p);
        const parts = ["阀门", "法兰", "支架"];
        return {
          key: `pl-${p.id}`,
          code: p.code,
          name: p.name,
          type: "管路",
          quantity: parts.length,
          attrSummary: summary(attrs),
          attrs,
          level: 3,
          children: parts.map((name, i) => ({
            key: `${p.id}-part-${i}`,
            code: `${p.code}-P${i + 1}`,
            name,
            type: "部件",
            quantity: 1,
            attrSummary: "-",
            attrs: [
              { name: "所属管路", value: p.name },
              { name: "部件名称", value: name },
            ],
            level: 4,
          })),
        };
      });
      subsystems.push({
        key: `${sys}-pipeline`,
        code: "SUB-PL",
        name: "管路子系统",
        type: "子系统",
        quantity: plNodes.length,
        attrSummary: "-",
        attrs: [],
        level: 2,
        children: plNodes,
      });
    }

    return {
      key: `sys-${sys}`,
      code: `SYS-${sys}`,
      name: `${sys}系统`,
      type: "系统",
      quantity: subsystems.length,
      attrSummary: "-",
      attrs: [],
      level: 1,
      children: subsystems,
    };
  });
}

// 类型图标
const typeIcon = (type: string) => {
  if (type === "系统") return <Layers size={14} className="text-admin-primary" />;
  if (type === "子系统")
    return <Settings size={14} className="text-blue-400" />;
  if (type === "设备") return <Box size={14} className="text-cyan-500" />;
  if (type === "管路")
    return <GitBranch size={14} className="text-green-500" />;
  return <CircleDot size={14} className="text-purple-400" />;
};

export default function EquipmentBim() {
  const [layer, setLayer] = useState("全部");
  const [selectedSystems, setSelectedSystems] = useState<string[]>([]);
  const [queryKey, setQueryKey] = useState(0); // 触发查询
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(
    new Set([`sys-技术供水`])
  );
  const [attrModal, setAttrModal] = useState<{
    open: boolean;
    title: string;
    code?: string;
    attrs: AttrItem[];
  }>({ open: false, title: "", attrs: [] });
  // 系统下拉
  const [sysDropdown, setSysDropdown] = useState(false);
  const sysRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭系统下拉
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sysRef.current && !sysRef.current.contains(e.target as Node))
        setSysDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // 查询时根据条件构建树
  const tree = useMemo(
    () => buildTree(selectedSystems, layer),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryKey]
  );

  const toggleExpand = (key: string) =>
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const toggleSystem = (s: string) =>
    setSelectedSystems((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );

  // 递归渲染树表行
  const renderRows = (nodes: BimNode[]): React.ReactNode =>
    nodes.map((node) => {
      const expanded = expandedKeys.has(node.key);
      const hasChildren = node.children && node.children.length > 0;
      const isEquipment = node.type === "设备";
      return (
        <div key={node.key}>
          <div
            className={`flex items-center border-b border-admin-border text-sm hover:bg-blue-50 ${
              isEquipment ? "cursor-pointer" : ""
            }`}
            style={{ paddingLeft: `${(node.level - 1) * 24 + 12}px` }}
            onDoubleClick={() => {
              if (isEquipment)
                setAttrModal({
                  open: true,
                  title: node.name,
                  code: node.code,
                  attrs: node.attrs,
                });
            }}
          >
            <div className="px-3 py-2.5 w-32 flex items-center gap-1">
              {hasChildren ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(node.key);
                  }}
                  className="text-admin-muted hover:text-admin-primary"
                >
                  {expanded ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                </button>
              ) : (
                <span className="w-[14px]" />
              )}
              {typeIcon(node.type)}
              <span className="font-mono text-xs">{node.code}</span>
            </div>
            <div className="px-3 py-2.5 flex-1 text-admin-text">{node.name}</div>
            <div className="px-3 py-2.5 w-20 text-admin-muted text-xs">
              {node.type}
            </div>
            <div className="px-3 py-2.5 w-16 text-center text-admin-text">
              {node.quantity}
            </div>
            <div className="px-3 py-2.5 flex-1 text-admin-muted text-xs truncate">
              {node.attrSummary}
            </div>
          </div>
          {hasChildren && expanded && renderRows(node.children!)}
        </div>
      );
    });

  return (
    <div className="space-y-4">
      <PageHeader
        title="BIM驾驶舱"
        subtitle="按分层与系统浏览设备/管路/部件树形结构"
      />

      <div className="flex gap-4">
        {/* 左侧选择区 */}
        <div className="w-[280px] flex-shrink-0 admin-card p-4 space-y-4">
          <div>
            <div className="text-sm text-admin-text mb-2 font-medium">分层选择</div>
            <div className="space-y-1.5">
              {layers.map((l) => (
                <label
                  key={l}
                  className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer text-sm transition-colors ${
                    layer === l
                      ? "bg-blue-50 text-admin-primary border border-blue-200"
                      : "text-admin-text hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="layer"
                    checked={layer === l}
                    onChange={() => setLayer(l)}
                    className="cursor-pointer"
                  />
                  {l}
                </label>
              ))}
            </div>
          </div>

          <div ref={sysRef}>
            <div className="text-sm text-admin-text mb-2 font-medium">系统选择</div>
            <div className="relative">
              <button
                className="input-base text-left flex items-center justify-between"
                onClick={() => setSysDropdown(!sysDropdown)}
              >
                <span className="truncate">
                  {selectedSystems.length === 0
                    ? "全部系统"
                    : `已选 ${selectedSystems.length} 项`}
                </span>
                <Down size={14} className="text-admin-muted flex-shrink-0" />
              </button>
              {sysDropdown && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-admin-border rounded shadow-lg max-h-60 overflow-auto">
                  {systems.map((s) => (
                    <label
                      key={s}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-admin-text hover:bg-blue-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSystems.includes(s)}
                        onChange={() => toggleSystem(s)}
                      />
                      {s}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            className="btn-primary w-full flex items-center justify-center gap-1"
            onClick={() => {
              setQueryKey((k) => k + 1);
              message.success("查询完成，已刷新树形结构");
            }}
          >
            <Search size={14} />
            查询
          </button>
        </div>

        {/* 右侧树形展示区 */}
        <div className="flex-1 min-w-0 admin-card flex flex-col">
          <div className="px-4 py-3 border-b border-admin-border">
            <h3 className="text-sm font-medium text-admin-text">
              结构树（系统 → 子系统 → 设备/管路 → 部件）
            </h3>
            <p className="text-xs text-admin-muted mt-1">
              提示：双击设备行可查看属性面板
            </p>
          </div>
          <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 220px)" }}>
            {/* 表头 */}
            <div className="flex items-center bg-gray-50 border-b border-admin-border text-xs font-medium text-admin-muted sticky top-0 z-10">
              <div className="px-3 py-2.5 w-32">编码</div>
              <div className="px-3 py-2.5 flex-1">名称</div>
              <div className="px-3 py-2.5 w-20">类型</div>
              <div className="px-3 py-2.5 w-16 text-center">数量</div>
              <div className="px-3 py-2.5 flex-1">属性摘要（前3项）</div>
            </div>
            {tree.length === 0 ? (
              <div className="text-center py-16 text-admin-muted text-sm">
                暂无数据
              </div>
            ) : (
              renderRows(tree)
            )}
          </div>
        </div>
      </div>

      {/* 属性面板弹窗 */}
      <AttrPanelModal
        open={attrModal.open}
        title={attrModal.title}
        code={attrModal.code}
        attrs={attrModal.attrs}
        onClose={() => setAttrModal({ ...attrModal, open: false })}
      />
    </div>
  );
}
