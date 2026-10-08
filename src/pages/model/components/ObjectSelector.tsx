import { useMemo, useState, type ReactNode } from "react";
import {
  Box,
  ChevronDown,
  ChevronRight,
  Cpu,
  FolderTree,
  Layers,
  Search,
  X,
} from "lucide-react";
import { buildStructureTree, type TreeNode } from "@/mock/structureTree";

// 模型关联对象：结构树中的一个节点（设备或管路），编码取节点 KKS
export interface ModelObject {
  key: string;
  id: number;
  type: "equipment" | "pipeline";
  name: string;
  kks: string;
  path: string;
}

const levelIcon: Record<string, ReactNode> = {
  L1: <Layers size={12} className="flex-shrink-0 text-blue-500" />,
  L2: <FolderTree size={12} className="flex-shrink-0 text-cyan-600" />,
  L3: <Box size={12} className="flex-shrink-0 text-purple-500" />,
  L4: <Cpu size={12} className="flex-shrink-0 text-orange-500" />,
};

// 结构树节点 → 完整路径（位置 / 系统 / 设备类型 / 设备）
export function buildPathMap(
  nodes: TreeNode[],
  prefix: string[] = [],
  map = new Map<number, string>(),
): Map<number, string> {
  nodes.forEach((node) => {
    const current = [...prefix, node.name];
    map.set(node.id, current.join(" / "));
    if (node.children) buildPathMap(node.children, current, map);
  });
  return map;
}

const equipmentTree = buildStructureTree("equipment");
const pipelineTree = buildStructureTree("pipeline");
const equipmentPaths = buildPathMap(equipmentTree);
const pipelinePaths = buildPathMap(pipelineTree);

// 默认展开前两层（位置 / 系统），更深层级通过搜索定位
const collectTopIds = (
  nodes: TreeNode[],
  depth = 0,
  ids: number[] = [],
): number[] => {
  nodes.forEach((node) => {
    if (depth <= 1) ids.push(node.id);
    if (node.children) collectTopIds(node.children, depth + 1, ids);
  });
  return ids;
};
const defaultExpanded = new Set(
  collectTopIds([...equipmentTree, ...pipelineTree]),
);

// 按 KKS 编码在结构树中定位节点，返回模型关联对象
export function findModelObject(
  type: ModelObject["type"],
  kks: string,
): ModelObject | undefined {
  const tree = type === "equipment" ? equipmentTree : pipelineTree;
  const paths = type === "equipment" ? equipmentPaths : pipelinePaths;
  let found: ModelObject | undefined;

  const walk = (nodes: TreeNode[]) => {
    nodes.forEach((node) => {
      if (!found && node.kks === kks) {
        found = {
          key: `${type}-${node.id}`,
          id: node.id,
          type,
          name: node.name,
          kks: node.kks,
          path: paths.get(node.id) || node.name,
        };
      }
      if (node.children) walk(node.children);
    });
  };

  walk(tree);
  return found;
}

interface ObjectSelectorProps {
  value: ModelObject[];
  onChange: (items: ModelObject[]) => void;
}

export default function ObjectSelector({ value, onChange }: ObjectSelectorProps) {
  const [type, setType] = useState<ModelObject["type"]>("equipment");
  const [keyword, setKeyword] = useState("");
  const [expanded, setExpanded] = useState<Set<number>>(
    () => new Set(defaultExpanded),
  );

  const tree = useMemo(
    () => buildStructureTree(type),
    [type],
  );
  const pathMap = useMemo(() => buildPathMap(tree), [tree]);
  const selectedKeys = useMemo(
    () => new Set(value.map((item) => item.key)),
    [value],
  );

  const matchIds = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return null;
    const ids = new Set<number>();
    const walk = (nodes: TreeNode[], ancestors: number[]) => {
      nodes.forEach((node) => {
        const selfMatch =
          node.name.toLowerCase().includes(kw) ||
          node.kks.toLowerCase().includes(kw);
        if (selfMatch) {
          ids.add(node.id);
          ancestors.forEach((id) => ids.add(id));
        }
        if (node.children) walk(node.children, [...ancestors, node.id]);
      });
    };
    walk(tree, []);
    return ids;
  }, [tree, keyword]);

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelect = (node: TreeNode) => {
    const key = `${type}-${node.id}`;
    if (selectedKeys.has(key)) {
      onChange(value.filter((item) => item.key !== key));
      return;
    }
    onChange([
      ...value,
      {
        key,
        id: node.id,
        type,
        name: node.name,
        kks: node.kks,
        path: pathMap.get(node.id) || node.name,
      },
    ]);
  };

  const renderNode = (node: TreeNode, level: number): ReactNode => {
    if (matchIds && !matchIds.has(node.id)) return null;
    const key = `${type}-${node.id}`;
    const checked = selectedKeys.has(key);
    const hasChildren = Boolean(node.children?.length);
    const isExpanded = keyword.trim() !== "" || expanded.has(node.id);

    return (
      <div key={key}>
        <div
          className={`flex min-h-8 cursor-pointer items-center gap-1.5 border-b border-admin-border/70 pr-3 text-xs transition-colors ${
            checked ? "bg-blue-50" : "hover:bg-gray-50"
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => toggleSelect(node)}
        >
          {hasChildren ? (
            <button
              type="button"
              className="flex h-5 w-5 flex-shrink-0 items-center justify-center text-admin-muted hover:text-admin-primary"
              onClick={(event) => {
                event.stopPropagation();
                toggleExpand(node.id);
              }}
            >
              {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>
          ) : (
            <span className="w-5 flex-shrink-0" />
          )}
          <input
            type="checkbox"
            className="flex-shrink-0 cursor-pointer"
            checked={checked}
            onClick={(event) => event.stopPropagation()}
            onChange={() => toggleSelect(node)}
          />
          {levelIcon[node.level]}
          <span className="min-w-0 flex-1 truncate text-admin-text">
            {node.name}
          </span>
          {node.kks && (
            <span className="flex-shrink-0 font-mono text-[10px] text-admin-muted">
              {node.kks}
            </span>
          )}
        </div>
        {hasChildren &&
          isExpanded &&
          node.children!.map((child) => renderNode(child, level + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            size={13}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-admin-muted"
          />
          <input
            className="input-base w-full pl-7 text-xs"
            placeholder="搜索节点名称或KKS编码"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>
        <select
          className="input-base text-xs"
          value={type}
          onChange={(event) =>
            setType(event.target.value as ModelObject["type"])
          }
        >
          <option value="equipment">设备结构树</option>
          <option value="pipeline">管路结构树</option>
        </select>
      </div>

      <div className="h-[220px] overflow-auto rounded border border-admin-border">
        {tree.length > 0 ? (
          tree.map((node) => renderNode(node, 0))
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-admin-muted">
            暂无结构树数据
          </div>
        )}
      </div>

      <div className="rounded border border-admin-border bg-gray-50 px-2.5 py-2">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs text-admin-text">
            已选关联对象
            <span className="ml-1 text-admin-muted">{value.length} 项</span>
          </span>
          {value.length > 0 && (
            <button
              type="button"
              className="text-xs text-admin-danger hover:underline"
              onClick={() => onChange([])}
            >
              清空
            </button>
          )}
        </div>
        {value.length > 0 ? (
          <div className="space-y-1">
            {value.map((item) => (
              <div
                key={item.key}
                className="flex items-start gap-2 rounded border border-admin-border bg-white px-2 py-1.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="flex-shrink-0 font-mono text-[11px] font-medium text-admin-text">
                      {item.kks || "—"}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[11px] text-admin-text">
                      {item.name}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate text-[10px] text-admin-muted">
                    {item.path}
                  </div>
                </div>
                <button
                  type="button"
                  className="flex-shrink-0 text-admin-muted hover:text-admin-danger"
                  title="移除"
                  onClick={() =>
                    onChange(value.filter((v) => v.key !== item.key))
                  }
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-1 text-[11px] text-admin-muted">
            暂未选择。一个模型可关联多个设备或管路（如几条管道合在一个模型里）。
          </div>
        )}
      </div>
    </div>
  );
}
