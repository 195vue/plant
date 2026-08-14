import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { SystemMenu } from "@/store/system";

export interface MenuTreeNode extends SystemMenu {
  children: MenuTreeNode[];
}

export const buildMenuTree = (menus: SystemMenu[]): MenuTreeNode[] => {
  const nodeMap = new Map<number, MenuTreeNode>();
  menus.forEach((menu) => nodeMap.set(menu.id, { ...menu, children: [] }));
  const roots: MenuTreeNode[] = [];
  nodeMap.forEach((node) => {
    if (node.parentId != null && nodeMap.has(node.parentId)) {
      nodeMap.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  const sortNodes = (nodes: MenuTreeNode[]) => {
    nodes.sort((a, b) => a.sort - b.sort);
    nodes.forEach((node) => sortNodes(node.children));
  };
  sortNodes(roots);
  return roots;
};

const collectNodeIds = (node: MenuTreeNode): number[] => [
  node.id,
  ...node.children.flatMap(collectNodeIds),
];

interface PermissionTreeProps {
  menus: SystemMenu[];
  checked: number[];
  onChange: (keys: number[]) => void;
}

export default function PermissionTree({
  menus,
  checked,
  onChange,
}: PermissionTreeProps) {
  const tree = useMemo(() => buildMenuTree(menus), [menus]);
  const [expanded, setExpanded] = useState<Set<number>>(
    new Set(menus.map((menu) => menu.id))
  );
  const allIds = useMemo(() => menus.map((menu) => menu.id), [menus]);
  const allSelected = allIds.length > 0 && allIds.every((id) => checked.includes(id));
  const allExpanded = allIds.length > 0 && allIds.every((id) => expanded.has(id));

  const toggleChecked = (node: MenuTreeNode, nextChecked: boolean) => {
    const affected = collectNodeIds(node);
    const next = new Set(checked);
    if (nextChecked) {
      affected.forEach((id) => next.add(id));
      let parentId = node.parentId;
      while (parentId != null) {
        next.add(parentId);
        parentId = menus.find((menu) => menu.id === parentId)?.parentId ?? null;
      }
    } else {
      affected.forEach((id) => next.delete(id));
      let parentId = node.parentId;
      while (parentId != null) {
        const siblings = menus.filter((menu) => menu.parentId === parentId);
        if (!siblings.some((sibling) => next.has(sibling.id))) next.delete(parentId);
        parentId = menus.find((menu) => menu.id === parentId)?.parentId ?? null;
      }
    }
    onChange([...next]);
  };

  const renderNode = (node: MenuTreeNode, level: number) => {
    const descendantIds = collectNodeIds(node).slice(1);
    const checkedChildren = descendantIds.filter((id) => checked.includes(id)).length;
    const allChildrenChecked =
      descendantIds.length > 0 && checkedChildren === descendantIds.length;
    const partial =
      descendantIds.length > 0 &&
      checkedChildren > 0 &&
      checkedChildren < descendantIds.length;
    const isChecked = checked.includes(node.id) || allChildrenChecked;

    return (
      <div key={node.id}>
        <div
          className="flex items-center gap-1 rounded-sm py-1.5 hover:bg-blue-50/60"
          style={{ paddingLeft: `${level * 22 + 6}px` }}
        >
          {node.children.length ? (
            <button
              className="text-slate-400 hover:text-blue-500"
              onClick={() =>
                setExpanded((current) => {
                  const next = new Set(current);
                  next.has(node.id) ? next.delete(node.id) : next.add(node.id);
                  return next;
                })
              }
            >
              {expanded.has(node.id) ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
            </button>
          ) : (
            <span className="w-3.5" />
          )}
          <input
            type="checkbox"
            checked={isChecked}
            ref={(element) => {
              if (element) element.indeterminate = partial;
            }}
            onChange={(event) => toggleChecked(node, event.target.checked)}
            className="h-3.5 w-3.5 accent-blue-500"
          />
          <span className="text-[12px] text-slate-600">{node.name}</span>
          <span className="ml-1 text-[11px] text-slate-400">
            {node.type === "directory"
              ? "目录"
              : node.type === "menu"
                ? "菜单"
                : "按钮"}
          </span>
        </div>
        {node.children.length > 0 &&
          expanded.has(node.id) &&
          node.children.map((child) => renderNode(child, level + 1))}
      </div>
    );
  };

  return (
    <div className="rounded-sm border border-slate-200">
      <div className="flex h-10 items-center gap-5 border-b border-slate-100 bg-slate-50 px-3">
        <label className="flex cursor-pointer items-center gap-1.5 text-[12px] text-slate-600">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() => onChange(allSelected ? [] : allIds)}
            className="h-3.5 w-3.5 accent-blue-500"
          />
          全选/全不选
        </label>
        <label className="flex cursor-pointer items-center gap-1.5 text-[12px] text-slate-600">
          <input
            type="checkbox"
            checked={allExpanded}
            onChange={() => setExpanded(allExpanded ? new Set() : new Set(allIds))}
            className="h-3.5 w-3.5 accent-blue-500"
          />
          全部展开/折叠
        </label>
        <span className="ml-auto text-[11px] text-slate-400">
          已选择 {checked.length} 项
        </span>
      </div>
      <div className="max-h-[390px] overflow-auto p-2">
        {tree.map((node) => renderNode(node, 0))}
      </div>
    </div>
  );
}
