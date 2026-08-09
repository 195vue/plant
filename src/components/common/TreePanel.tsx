import { useState, useMemo, type ReactNode } from "react";
import {
  ChevronRight,
  ChevronDown,
  Search,
  Folder,
  FolderOpen,
  Box,
  Settings,
  Wrench,
  CircleDot,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface TreeNodeData {
  key: string;
  title: string;
  code?: string;
  type?: string;
  count?: number;
  children?: TreeNodeData[];
  data?: any;
}

interface TreePanelProps {
  data: TreeNodeData[];
  selectedKey?: string;
  onSelect?: (node: TreeNodeData) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  showCount?: boolean;
  onContextMenu?: (e: React.MouseEvent, node: TreeNodeData) => void;
  renderItem?: (node: TreeNodeData, level: number) => ReactNode;
  emptyText?: string;
}

// 节点类型图标映射
const nodeIcons: Record<string, ReactNode> = {
  position: <Folder size={14} className="text-yellow-500" />,
  positionOpen: <FolderOpen size={14} className="text-yellow-500" />,
  system: <Settings size={14} className="text-blue-400" />,
  usage: <Wrench size={14} className="text-green-400" />,
  equipment: <Box size={14} className="text-cyan-400" />,
  component: <CircleDot size={14} className="text-purple-400" />,
  default: <CircleDot size={14} className="text-gray-400" />,
};

function getNodeIcon(node: TreeNodeData, expanded: boolean): ReactNode {
  const type = node.type || "default";
  if (type === "position") {
    return expanded ? nodeIcons.positionOpen : nodeIcons.position;
  }
  return nodeIcons[type] || nodeIcons.default;
}

interface TreeItemProps {
  node: TreeNodeData;
  level: number;
  selectedKey?: string;
  expandedKeys: Set<string>;
  onToggle: (key: string) => void;
  onSelect: (node: TreeNodeData) => void;
  onContextMenu?: (e: React.MouseEvent, node: TreeNodeData) => void;
  searchKeyword?: string;
  showCount?: boolean;
  matchedKeys: Set<string>;
}

function TreeItem({
  node,
  level,
  selectedKey,
  expandedKeys,
  onToggle,
  onSelect,
  onContextMenu,
  searchKeyword,
  showCount,
  matchedKeys,
}: TreeItemProps) {
  const hasChildren = node.children && node.children.length > 0;
  const expanded = expandedKeys.has(node.key);
  const selected = selectedKey === node.key;
  const matched = searchKeyword && matchedKeys.has(node.key);

  // 高亮搜索关键词
  const renderTitle = () => {
    if (!searchKeyword) return node.title;
    const index = node.title.indexOf(searchKeyword);
    if (index === -1) return node.title;
    return (
      <>
        {node.title.substring(0, index)}
        <span className="bg-yellow-400 text-black px-0.5 rounded">
          {node.title.substring(index, index + searchKeyword.length)}
        </span>
        {node.title.substring(index + searchKeyword.length)}
      </>
    );
  };

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-1 px-2 py-1 cursor-pointer rounded text-sm hover:bg-screen-hover transition-colors",
          selected && "bg-blue-600 text-white",
          !selected && "text-screen-text"
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onSelect(node)}
        onContextMenu={(e) => {
          e.preventDefault();
          onContextMenu?.(e, node);
        }}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node.key);
            }}
            className="text-screen-muted hover:text-white"
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <span className="w-[14px]" />
        )}
        <span className="flex-shrink-0">{getNodeIcon(node, expanded)}</span>
        {node.code && (
          <span
            className={cn(
              "text-xs font-mono",
              selected ? "text-blue-200" : "text-screen-muted"
            )}
          >
            {node.code}
          </span>
        )}
        <span className="truncate">{renderTitle()}</span>
        {showCount && node.count !== undefined && (
          <span
            className={cn(
              "text-xs ml-1",
              selected ? "text-blue-200" : "text-screen-muted"
            )}
          >
            ({node.count})
          </span>
        )}
      </div>
      {hasChildren && expanded && (
        <div>
          {node.children!.map((child) => (
            <TreeItem
              key={child.key}
              node={child}
              level={level + 1}
              selectedKey={selectedKey}
              expandedKeys={expandedKeys}
              onToggle={onToggle}
              onSelect={onSelect}
              onContextMenu={onContextMenu}
              searchKeyword={searchKeyword}
              showCount={showCount}
              matchedKeys={matchedKeys}
            />
          ))}
        </div>
      )}
    </>
  );
}

export function TreePanel({
  data,
  selectedKey,
  onSelect,
  searchable = true,
  searchPlaceholder = "搜索",
  showCount = false,
  onContextMenu,
  emptyText = "暂无数据",
}: TreePanelProps) {
  const [keyword, setKeyword] = useState("");
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  // 过滤树并计算匹配的key
  const { filteredData, matchedKeys } = useMemo(() => {
    if (!keyword.trim()) {
      return { filteredData: data, matchedKeys: new Set<string>() };
    }

    const matched = new Set<string>();

    const filterNode = (node: TreeNodeData): TreeNodeData | null => {
      const titleMatch = node.title
        .toLowerCase()
        .includes(keyword.toLowerCase());
      const codeMatch = node.code
        ? node.code.toLowerCase().includes(keyword.toLowerCase())
        : false;
      const selfMatch = titleMatch || codeMatch;

      let filteredChildren: TreeNodeData[] = [];
      if (node.children) {
        filteredChildren = node.children
          .map((child) => filterNode(child))
          .filter((child): child is TreeNodeData => child !== null);
      }

      if (selfMatch || filteredChildren.length > 0) {
        matched.add(node.key);
        return { ...node, children: filteredChildren };
      }
      return null;
    };

    const filtered = data
      .map((node) => filterNode(node))
      .filter((node): node is TreeNodeData => node !== null);

    return { filteredData: filtered, matchedKeys: matched };
  }, [data, keyword]);

  // 搜索时自动展开所有匹配节点的父级
  const effectiveExpandedKeys = useMemo(() => {
    if (keyword.trim()) {
      const keys = new Set(expandedKeys);
      // 搜索时展开所有节点
      const collectKeys = (nodes: TreeNodeData[]) => {
        nodes.forEach((node) => {
          if (node.children && node.children.length > 0) {
            keys.add(node.key);
            collectKeys(node.children);
          }
        });
      };
      collectKeys(filteredData);
      return keys;
    }
    return expandedKeys;
  }, [keyword, filteredData, expandedKeys]);

  const handleToggle = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full">
      {searchable && (
        <div className="p-2 border-b border-screen-border">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-screen-muted"
            />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-7 pr-2 py-1 text-sm bg-gray-800 text-screen-text placeholder:text-screen-muted rounded border border-screen-border focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      )}
      <div className="flex-1 overflow-auto p-1">
        {filteredData.length === 0 ? (
          <div className="text-center text-screen-muted text-sm py-8">
            {emptyText}
          </div>
        ) : (
          filteredData.map((node) => (
            <TreeItem
              key={node.key}
              node={node}
              level={0}
              selectedKey={selectedKey}
              expandedKeys={effectiveExpandedKeys}
              onToggle={handleToggle}
              onSelect={onSelect}
              onContextMenu={onContextMenu}
              searchKeyword={keyword.trim() || undefined}
              showCount={showCount}
              matchedKeys={matchedKeys}
            />
          ))
        )}
      </div>
    </div>
  );
}
