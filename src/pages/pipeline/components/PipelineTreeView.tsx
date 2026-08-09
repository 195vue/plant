import { useState, useMemo } from "react";
import {
  ChevronRight,
  ChevronDown,
  MapPin,
  GitBranch,
  Layers,
  Box,
  Wrench,
  Search,
} from "lucide-react";
import { pipelines, valves, positions, systems } from "@/mock";

// 树节点类型
export type NodeType = "position" | "system" | "usage" | "component";

export interface TreeNodeData {
  key: string;
  title: string;
  code?: string;
  type: NodeType;
  count?: number;
  children?: TreeNodeData[];
  data?: any; // 关联的原始数据（管道段/阀门）
}

// 用途层级
const usages = ["主管路", "分支管路", "设备连接管"];

// 类型图标映射
const typeIconMap: Record<NodeType, React.ReactNode> = {
  position: <MapPin size={14} className="text-blue-500" />,
  system: <GitBranch size={14} className="text-green-500" />,
  usage: <Layers size={14} className="text-orange-500" />,
  component: <Box size={14} className="text-purple-500" />,
};

// 构建四级结构树
export function buildTree(): TreeNodeData[] {
  return positions
    .map((pos) => {
      const posPipelines = pipelines.filter((p) => p.position === pos);
      if (posPipelines.length === 0) return null;
      const systemNodes = systems
        .map((sys) => {
          const sysPipelines = posPipelines.filter((p) => p.system === sys);
          if (sysPipelines.length === 0) return null;
          const usageNodes = usages
            .map((u) => {
              const uPipelines = sysPipelines.filter((p) => p.usage === u);
              // 主管路使用真实管道段，其他用途生成模拟管件
              const components: TreeNodeData[] = [];
              uPipelines.forEach((p) => {
                components.push({
                  key: `comp-pipe-${p.id}`,
                  title: p.name,
                  code: p.code,
                  type: "component",
                  data: { ...p, componentType: "管道段" },
                });
                // 关联同系统的阀门作为子管件
                const relValves = valves.filter(
                  (v) => v.system === sys && v.location.includes(pos)
                );
                relValves.slice(0, 1).forEach((v) => {
                  components.push({
                    key: `comp-valve-${v.id}`,
                    title: v.name,
                    code: v.code,
                    type: "component",
                    data: { ...v, componentType: "阀门" },
                  });
                });
                // 模拟弯头
                components.push({
                  key: `comp-elbow-${p.id}`,
                  title: `${p.name}-弯头`,
                  code: `EL-${String(p.id).padStart(3, "0")}`,
                  type: "component",
                  data: {
                    ...p,
                    id: `elbow-${p.id}`,
                    code: `EL-${String(p.id).padStart(3, "0")}`,
                    name: `${p.name}-弯头`,
                    componentType: "弯头",
                    spec: p.dn,
                    material: p.material,
                    quantity: Math.ceil((p.length || 0) / 20),
                  },
                });
              });
              if (components.length === 0) return null;
              return {
                key: `usage-${pos}-${sys}-${u}`,
                title: u,
                type: "usage" as NodeType,
                count: components.length,
                children: components,
              };
            })
            .filter(Boolean) as TreeNodeData[];
          if (usageNodes.length === 0) return null;
          return {
            key: `system-${pos}-${sys}`,
            title: sys,
            type: "system" as NodeType,
            count: usageNodes.reduce((s, n) => s + (n.count || 0), 0),
            children: usageNodes,
          };
        })
        .filter(Boolean) as TreeNodeData[];
      if (systemNodes.length === 0) return null;
      return {
        key: `position-${pos}`,
        title: pos,
        type: "position" as NodeType,
        count: systemNodes.reduce((s, n) => s + (n.count || 0), 0),
        children: systemNodes,
      };
    })
    .filter(Boolean) as TreeNodeData[];
}

interface PipelineTreeViewProps {
  selectedKey: string;
  onSelect: (node: TreeNodeData) => void;
  onContextMenu: (node: TreeNodeData, x: number, y: number) => void;
}

// 递归树节点
function TreeNode({
  node,
  level,
  selectedKey,
  expandedKeys,
  toggleExpand,
  onSelect,
  onContextMenu,
  matchKeys,
}: {
  node: TreeNodeData;
  level: number;
  selectedKey: string;
  expandedKeys: Set<string>;
  toggleExpand: (key: string) => void;
  onSelect: (node: TreeNodeData) => void;
  onContextMenu: (node: TreeNodeData, x: number, y: number) => void;
  matchKeys: Set<string>;
}) {
  const hasChildren = node.children && node.children.length > 0;
  const expanded = expandedKeys.has(node.key);
  const selected = selectedKey === node.key;
  // 搜索匹配：自身或子节点命中则显示
  const visible = matchKeys.size === 0 || matchKeys.has(node.key);

  if (!visible) return null;

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1.5 cursor-pointer rounded text-sm transition-colors ${
          selected
            ? "bg-admin-primary text-white"
            : "text-admin-text hover:bg-blue-50"
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => {
          onSelect(node);
          if (hasChildren) toggleExpand(node.key);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          onContextMenu(node, e.clientX, e.clientY);
        }}
      >
        {hasChildren ? (
          expanded ? (
            <ChevronDown size={14} className="text-admin-muted flex-shrink-0" />
          ) : (
            <ChevronRight size={14} className="text-admin-muted flex-shrink-0" />
          )
        ) : (
          <span className="w-3.5 flex-shrink-0" />
        )}
        {node.type === "component" && node.data?.componentType === "阀门" ? (
          <Wrench size={14} className="text-purple-500 flex-shrink-0" />
        ) : (
          typeIconMap[node.type]
        )}
        {node.code && (
          <span
            className={`font-mono text-xs ${
              selected ? "text-white opacity-90" : "text-admin-muted"
            }`}
          >
            {node.code}
          </span>
        )}
        <span className="truncate flex-1">{node.title}</span>
        {node.count !== undefined && (
          <span
            className={`text-xs flex-shrink-0 ${
              selected ? "text-white opacity-90" : "text-admin-muted"
            }`}
          >
            {node.count}
          </span>
        )}
      </div>
      {hasChildren && expanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child.key}
              node={child}
              level={level + 1}
              selectedKey={selectedKey}
              expandedKeys={expandedKeys}
              toggleExpand={toggleExpand}
              onSelect={onSelect}
              onContextMenu={onContextMenu}
              matchKeys={matchKeys}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// 收集节点及其所有祖先节点的 key（用于搜索时显示匹配路径）
function collectMatchKeys(nodes: TreeNodeData[], keyword: string): Set<string> {
  const result = new Set<string>();
  const walk = (node: TreeNodeData): boolean => {
    let childMatch = false;
    if (node.children) {
      node.children.forEach((c) => {
        if (walk(c)) childMatch = true;
      });
    }
    const selfMatch =
      (node.title || "").toLowerCase().includes(keyword) ||
      (node.code || "").toLowerCase().includes(keyword);
    if (selfMatch || childMatch) {
      result.add(node.key);
      return true;
    }
    return false;
  };
  nodes.forEach((n) => walk(n));
  return result;
}

export default function PipelineTreeView({
  selectedKey,
  onSelect,
  onContextMenu,
}: PipelineTreeViewProps) {
  const tree = useMemo(buildTree, []);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(
    new Set([`position-坝后厂房`])
  );
  const [keyword, setKeyword] = useState("");

  const matchKeys = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return new Set<string>();
    return collectMatchKeys(tree, kw);
  }, [keyword, tree]);

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* 搜索框 */}
      <div className="p-3 border-b border-admin-border">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-admin-muted pointer-events-none"
          />
          <input
            className="input-base pl-7"
            placeholder="输入编码或名称搜索"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
      </div>
      {/* 树容器 */}
      <div className="flex-1 overflow-auto p-2">
        <div className="text-xs text-admin-muted px-2 py-1 mb-1">
          共 {tree.length} 个位置
        </div>
        {tree.map((node) => (
          <TreeNode
            key={node.key}
            node={node}
            level={0}
            selectedKey={selectedKey}
            expandedKeys={expandedKeys}
            toggleExpand={toggleExpand}
            onSelect={onSelect}
            onContextMenu={onContextMenu}
            matchKeys={matchKeys}
          />
        ))}
      </div>
    </div>
  );
}
