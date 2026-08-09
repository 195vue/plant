import { useState, useMemo } from "react";
import {
  ChevronRight,
  ChevronDown,
  Search,
  Settings,
  MapPin,
  Box,
} from "lucide-react";
import { equipments } from "@/mock";
import type { Equipment } from "@/types";

interface EquipmentOrgTreeProps {
  selectedKey?: string;
  onSelect: (filter: { system?: string; location?: string; equipmentId?: number; type?: string }) => void;
}

type TreeNode = {
  key: string;
  title: string;
  type: "system" | "location" | "equipment";
  count?: number;
  equipment?: Equipment;
  children?: TreeNode[];
};

function buildTree(): TreeNode[] {
  const systemMap = new Map<string, Map<string, Equipment[]>>();

  equipments.forEach((eq) => {
    const sys = eq.system;
    const loc = eq.location;
    if (!systemMap.has(sys)) systemMap.set(sys, new Map());
    const locMap = systemMap.get(sys)!;
    if (!locMap.has(loc)) locMap.set(loc, []);
    locMap.get(loc)!.push(eq);
  });

  const roots: TreeNode[] = [];
  systemMap.forEach((locMap, systemName) => {
    let systemCount = 0;
    const locationNodes: TreeNode[] = [];
    locMap.forEach((eqs, locationName) => {
      systemCount += eqs.length;
      const equipNodes: TreeNode[] = eqs.map((eq) => ({
        key: `eq-${eq.id}`,
        title: eq.name,
        type: "equipment",
        count: 1,
        equipment: eq,
      }));
      locationNodes.push({
        key: `loc-${locationName}`,
        title: locationName,
        type: "location",
        count: eqs.length,
        children: equipNodes,
      });
    });
    roots.push({
      key: `sys-${systemName}`,
      title: systemName,
      type: "system",
      count: systemCount,
      children: locationNodes,
    });
  });

  return roots.sort((a, b) => (a.title > b.title ? 1 : -1));
}

export default function EquipmentOrgTree({ selectedKey, onSelect }: EquipmentOrgTreeProps) {
  const treeData = useMemo(buildTree, []);
  const [keyword, setKeyword] = useState("");
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const filteredData = useMemo(() => {
    if (!keyword.trim()) return treeData;

    const filterNode = (node: TreeNode): TreeNode | null => {
      const titleMatch = node.title.toLowerCase().includes(keyword.toLowerCase());
      const selfMatch = titleMatch;

      let filteredChildren: TreeNode[] = [];
      if (node.children) {
        filteredChildren = node.children
          .map((child) => filterNode(child))
          .filter((c): c is TreeNode => c !== null);
      }

      if (selfMatch || filteredChildren.length > 0) {
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

  const handleSelectAll = () => {
    onSelect({});
  };

  const renderNode = (node: TreeNode, level: number) => {
    const hasChildren = node.children && node.children.length > 0;
    const expanded = effectiveExpandedKeys.has(node.key);
    const selected = selectedKey === node.key;

    const getIcon = () => {
      if (node.type === "system") return <Settings size={14} className="text-blue-400" />;
      if (node.type === "location") return <MapPin size={14} className="text-yellow-500" />;
      return <Box size={14} className="text-cyan-400" />;
    };

    const handleClick = () => {
      if (node.type === "system") {
        onSelect({ system: node.title });
      } else if (node.type === "location") {
        onSelect({ system: node.key.replace("loc-", "").split("|")[0], location: node.title });
      } else if (node.type === "equipment" && node.equipment) {
        onSelect({ equipmentId: node.equipment.id });
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
          {getIcon()}
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
          <Settings size={14} className={!selectedKey ? "text-blue-200" : "text-blue-400"} />
          <span className="flex-1">全部设备</span>
          <span className={`text-xs ${!selectedKey ? "text-blue-200" : "text-admin-muted"}`}>
            {equipments.length}
          </span>
        </div>
      </div>
      <div className="p-2 border-b border-admin-border">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-admin-muted"
          />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索设备/系统"
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