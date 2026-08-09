import { useState, useMemo } from "react";
import {
  ChevronRight,
  ChevronDown,
  Search,
  MapPin,
  GitBranch,
  Layers,
  Box,
} from "lucide-react";
import { pipelines, positions, systems } from "@/mock";
import type { Pipeline } from "@/types";

interface PipelineOrgTreeProps {
  selectedKey?: string;
  onSelect: (filter: {
    position?: string;
    system?: string;
    usage?: string;
    pipelineId?: number;
  }) => void;
}

type NodeType = "position" | "system" | "usage" | "pipeline";
interface TreeNode {
  key: string;
  title: string;
  type: NodeType;
  count?: number;
  pipeline?: Pipeline;
  children?: TreeNode[];
}

const usageOptions = ["主管路", "分支管路", "设备连接管"];

function buildTree(): TreeNode[] {
  return positions
    .map((pos) => {
      const posPipelines = pipelines.filter((p) => p.position === pos);
      if (posPipelines.length === 0) return null;
      const systemNodes = systems
        .map((sys) => {
          const sysPipelines = posPipelines.filter((p) => p.system === sys);
          if (sysPipelines.length === 0) return null;
          const usageNodes = usageOptions
            .map((u) => {
              const uPipelines = sysPipelines.filter((p) => p.usage === u);
              if (uPipelines.length === 0) return null;
              const pipeNodes: TreeNode[] = uPipelines.map((p) => ({
                key: `pipe-${p.id}`,
                title: p.name,
                type: "pipeline" as NodeType,
                pipeline: p,
              }));
              return {
                key: `usage-${pos}-${sys}-${u}`,
                title: u,
                type: "usage" as NodeType,
                count: uPipelines.length,
                children: pipeNodes,
              };
            })
            .filter(Boolean) as TreeNode[];
          if (usageNodes.length === 0) return null;
          return {
            key: `system-${pos}-${sys}`,
            title: sys,
            type: "system" as NodeType,
            count: sysPipelines.length,
            children: usageNodes,
          };
        })
        .filter(Boolean) as TreeNode[];
      if (systemNodes.length === 0) return null;
      return {
        key: `position-${pos}`,
        title: pos,
        type: "position" as NodeType,
        count: posPipelines.length,
        children: systemNodes,
      };
    })
    .filter(Boolean) as TreeNode[];
}

const typeIcons: Record<NodeType, React.ReactNode> = {
  position: <MapPin size={14} className="text-yellow-500" />,
  system: <GitBranch size={14} className="text-green-500" />,
  usage: <Layers size={14} className="text-orange-500" />,
  pipeline: <Box size={14} className="text-cyan-400" />,
};

export default function PipelineOrgTree({
  selectedKey,
  onSelect,
}: PipelineOrgTreeProps) {
  const treeData = useMemo(buildTree, []);
  const [keyword, setKeyword] = useState("");
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(
    new Set(["position-坝后厂房"])
  );

  const filteredData = useMemo(() => {
    if (!keyword.trim()) return treeData;
    const filterNode = (node: TreeNode): TreeNode | null => {
      const titleMatch = node.title.toLowerCase().includes(keyword.toLowerCase());
      let filteredChildren: TreeNode[] = [];
      if (node.children) {
        filteredChildren = node.children
          .map((child) => filterNode(child))
          .filter((c): c is TreeNode => c !== null);
      }
      if (titleMatch || filteredChildren.length > 0) {
        return { ...node, children: filteredChildren.length ? filteredChildren : node.children };
      }
      return null;
    };
    return treeData
      .map((node) => filterNode(node))
      .filter((n): n is TreeNode => n !== null);
  }, [treeData, keyword]);

  const effectiveExpandedKeys = useMemo(() => {
    if (keyword.trim()) {
      const keys = new Set(expandedKeys);
      const collect = (nodes: TreeNode[]) => {
        nodes.forEach((n) => {
          if (n.children && n.children.length > 0) {
            keys.add(n.key);
            collect(n.children);
          }
        });
      };
      collect(filteredData);
      return keys;
    }
    return expandedKeys;
  }, [keyword, filteredData, expandedKeys]);

  const handleToggle = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSelectAll = () => onSelect({});

  const renderNode = (node: TreeNode, level: number) => {
    const hasChildren = node.children && node.children.length > 0;
    const expanded = effectiveExpandedKeys.has(node.key);
    const selected = selectedKey === node.key;

    const handleClick = () => {
      if (node.type === "position") {
        onSelect({ position: node.title });
      } else if (node.type === "system") {
        const pos = node.key.replace("system-", "").split("-")[0];
        onSelect({ position: pos, system: node.title });
      } else if (node.type === "usage") {
        const parts = node.key.replace("usage-", "").split("-");
        onSelect({ position: parts[0], system: parts[1], usage: node.title });
      } else if (node.type === "pipeline" && node.pipeline) {
        onSelect({ pipelineId: node.pipeline.id });
      }
    };

    return (
      <div key={node.key}>
        <div
          className={`flex items-center gap-1 px-2 py-1.5 cursor-pointer rounded text-sm transition-colors ${
            selected
              ? "bg-blue-500 text-white"
              : "text-admin-text hover:bg-blue-50"
          }`}
          style={{ paddingLeft: `${level * 14 + 8}px` }}
          onClick={handleClick}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggle(node.key);
              }}
              className={selected ? "text-blue-200" : "text-admin-muted"}
            >
              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : (
            <span className="w-[14px]" />
          )}
          {typeIcons[node.type]}
          <span className="truncate flex-1">{node.title}</span>
          {node.count !== undefined && (
            <span className={`text-xs ${selected ? "text-blue-200" : "text-admin-muted"}`}>
              {node.count}
            </span>
          )}
        </div>
        {hasChildren && expanded && (
          <div>
            {node.children!.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b border-admin-border">
        <div
          className={`flex items-center gap-1 px-2 py-1.5 cursor-pointer rounded text-sm transition-colors ${
            !selectedKey
              ? "bg-blue-500 text-white font-medium"
              : "text-admin-text hover:bg-blue-50"
          }`}
          onClick={handleSelectAll}
        >
          <GitBranch size={14} className={!selectedKey ? "text-blue-200" : "text-green-500"} />
          <span className="flex-1">全部管路</span>
          <span className={`text-xs ${!selectedKey ? "text-blue-200" : "text-admin-muted"}`}>
            {pipelines.length}
          </span>
        </div>
      </div>
      <div className="p-2 border-b border-admin-border">
        <div className="relative">
          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-admin-muted" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索管路/系统"
            className="w-full pl-7 pr-2 py-1 text-sm bg-gray-50 text-admin-text placeholder:text-admin-muted rounded border border-admin-border focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>
      <div className="flex-1 overflow-auto p-1">
        {filteredData.length === 0 ? (
          <div className="text-center text-admin-muted text-sm py-8">无匹配结果</div>
        ) : (
          filteredData.map((node) => renderNode(node, 0))
        )}
      </div>
    </div>
  );
}