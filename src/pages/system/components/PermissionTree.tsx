import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// 权限树节点
export interface PermNode {
  key: string;
  title: string;
  children?: PermNode[];
}

// 菜单权限树数据
export const menuPermissionTree: PermNode[] = [
  { key: "screen", title: "工程总览" },
  { key: "dashboard", title: "工作台" },
  {
    key: "drawing", title: "图纸管理",
    children: [
      { key: "drawing:view", title: "查看" },
      { key: "drawing:add", title: "新增" },
      { key: "drawing:edit", title: "编辑" },
      { key: "drawing:delete", title: "删除" },
      { key: "drawing:download", title: "下载" },
      { key: "drawing:export", title: "导出" },
    ],
  },
  {
    key: "digital", title: "机电数字化",
    children: [
      { key: "equipment", title: "设备数字化" },
      { key: "pipeline", title: "管路数字化" },
      { key: "structure-tree", title: "结构树管理" },
      { key: "attribute", title: "属性管理" },
    ],
  },
  {
    key: "document", title: "资料管理",
    children: [
      { key: "document:view", title: "查看" },
      { key: "document:add", title: "新增" },
      { key: "document:edit", title: "编辑" },
      { key: "document:delete", title: "删除" },
      { key: "document:download", title: "下载" },
    ],
  },
  {
    key: "system", title: "系统配置",
    children: [
      { key: "system:view", title: "查看" },
      { key: "system:add", title: "新增" },
      { key: "system:edit", title: "编辑" },
      { key: "system:delete", title: "删除" },
    ],
  },
];

// 收集所有叶子 key
export const collectAllKeys = (nodes: PermNode[]): string[] => {
  const keys: string[] = [];
  const walk = (list: PermNode[]) => {
    list.forEach((n) => {
      keys.push(n.key);
      if (n.children) walk(n.children);
    });
  };
  walk(nodes);
  return keys;
};

interface PermissionTreeProps {
  checked: string[];
  onChange: (keys: string[]) => void;
}

// 权限树（浅色主题，带勾选框）
export default function PermissionTree({ checked, onChange }: PermissionTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(menuPermissionTree.map((n) => n.key))
  );

  const toggleExpand = (key: string) => {
    const next = new Set(expanded);
    next.has(key) ? next.delete(key) : next.add(key);
    setExpanded(next);
  };

  const toggleCheck = (key: string) => {
    onChange(
      checked.includes(key) ? checked.filter((k) => k !== key) : [...checked, key]
    );
  };

  // 渲染节点
  const renderNode = (node: PermNode, level: number) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expanded.has(node.key);
    const isChecked = checked.includes(node.key);
    // 父节点半选状态：部分子节点选中
    const childKeys = hasChildren ? collectAllKeys(node.children!) : [];
    const checkedChildCount = childKeys.filter((k) => checked.includes(k)).length;
    const indeterminate = hasChildren && checkedChildCount > 0 && checkedChildCount < childKeys.length;

    return (
      <div key={node.key}>
        <div
          className="flex items-center gap-1 py-1 rounded hover:bg-blue-50 transition-colors"
          style={{ paddingLeft: `${level * 18 + 4}px` }}
        >
          {hasChildren ? (
            <button onClick={() => toggleExpand(node.key)} className="text-admin-muted hover:text-admin-primary">
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : (
            <span className="w-[14px]" />
          )}
          <input
            type="checkbox"
            checked={isChecked || (hasChildren && checkedChildCount === childKeys.length)}
            ref={(el) => { if (el) el.indeterminate = indeterminate; }}
            onChange={() => {
              if (hasChildren) {
                // 父节点勾选：勾选/取消所有子节点
                const allChecked = checkedChildCount === childKeys.length;
                const rest = checked.filter((k) => !childKeys.includes(k) && k !== node.key);
                onChange(allChecked ? rest : [...rest, ...childKeys]);
              } else {
                toggleCheck(node.key);
              }
            }}
            className="cursor-pointer"
          />
          <span className={cn("text-sm", level === 0 ? "font-medium text-admin-text" : "text-admin-text")}>
            {node.title}
          </span>
        </div>
        {hasChildren && isExpanded && (
          <div>{node.children!.map((c) => renderNode(c, level + 1))}</div>
        )}
      </div>
    );
  };

  return <div className="space-y-0.5">{menuPermissionTree.map((n) => renderNode(n, 0))}</div>;
}
