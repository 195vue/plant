import { useState, useMemo } from "react";
import {
  ChevronRight,
  ChevronDown,
  Search,
  Layers,
  FolderTree,
  Box,
  Cpu,
} from "lucide-react";
import {
  buildStructureTree,
  collectMatchKeys,
  type TreeNode,
  type NodeLevel,
  type TreeType,
} from "@/mock/structureTree";

const levelIcon: Record<NodeLevel, React.ReactNode> = {
  L1: <Layers size={12} className="text-blue-500" />,
  L2: <FolderTree size={12} className="text-cyan-500" />,
  L3: <Box size={12} className="text-purple-500" />,
  L4: <Cpu size={12} className="text-orange-500" />,
};

export interface TreeSelectFilter {
  nodeId: number;
  name: string;
  kks: string;
  level: NodeLevel;
  descendantIds: number[];
}

interface StructureTreeSelectProps {
  selectedNodeId?: number;
  onSelect: (filter: TreeSelectFilter) => void;
  defaultExpanded?: number[];
  title?: string;
  treeType?: TreeType;
}

export default function StructureTreeSelect({
  selectedNodeId,
  onSelect,
  defaultExpanded = [1, 2],
  title = "结构树",
  treeType = "equipment",
}: StructureTreeSelectProps) {
  const tree = useMemo(() => buildStructureTree(treeType), [treeType]);
  const [expandedKeys, setExpandedKeys] = useState<Set<number>>(new Set(defaultExpanded));
  const [keyword, setKeyword] = useState("");

  const matchKeys = useMemo(() => collectMatchKeys(tree, keyword), [keyword, tree]);

  const handleToggle = (id: number) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 收集节点及所有后代ID
  const collectDescendants = (node: TreeNode): number[] => {
    const ids: number[] = [node.id];
    const walk = (n: TreeNode) => {
      n.children?.forEach((c) => {
        ids.push(c.id);
        walk(c);
      });
    };
    walk(node);
    return ids;
  };

  const handleSelect = (node: TreeNode) => {
    onSelect({
      nodeId: node.id,
      name: node.name,
      kks: node.kks,
      level: node.level,
      descendantIds: collectDescendants(node),
    });
    if (node.children && node.children.length > 0 && !expandedKeys.has(node.id)) {
      handleToggle(node.id);
    }
  };

  const renderNode = (node: TreeNode, level: number): React.ReactNode => {
    const hasChildren = node.children && node.children.length > 0;
    const expanded = expandedKeys.has(node.id);
    const selected = selectedNodeId === node.id;
    const visible = matchKeys.size === 0 || matchKeys.has(node.id);
    if (!visible) return null;

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-1 px-2 py-1 cursor-pointer rounded text-xs transition-colors ${
            selected ? "bg-blue-500 text-white" : "text-admin-text hover:bg-blue-50"
          }`}
          style={{ paddingLeft: `${level * 12 + 6}px` }}
          onClick={() => handleSelect(node)}
        >
          {hasChildren ? (
            <button
              onClick={(e) => { e.stopPropagation(); handleToggle(node.id); }}
              className={selected ? "text-blue-200" : "text-admin-muted"}
            >
              {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
          ) : (
            <span className="w-3" />
          )}
          {levelIcon[node.level]}
          <span className="truncate flex-1">{node.name}</span>
        </div>
        {hasChildren && expanded && node.children!.map((child) => renderNode(child, level + 1))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b border-admin-border">
        <div className="flex gap-1">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-admin-muted" />
            <input
              className="input-base text-xs pl-6"
              placeholder="搜索名称/KKS"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <button
            className="btn-primary text-xs px-2 flex items-center gap-0.5"
            title="搜索"
          >
            <Search size={12} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-1 min-h-0">
        <div className="text-[10px] text-admin-muted px-2 py-1">共 {tree.length} 个一级分类</div>
        {tree.map((node) => renderNode(node, 0))}
      </div>
    </div>
  );
}
