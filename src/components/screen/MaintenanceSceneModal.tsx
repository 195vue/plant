import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  CircleDot,
  Wrench,
  X,
  History,
  PlusSquare,
  Pencil,
  Trash2,
  Check,
} from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { message } from "@/components/common/Message";
import { maintenanceTreeData } from "@/mock/screen";
import type { TreeNodeData } from "@/components/common/TreePanel";
import {
  MAINTENANCE_STATUS_OPTIONS,
  type MaintenanceNodeKind,
  type MaintenanceNodeStatus,
  type MaintenanceSceneNode,
  type MaintenanceSceneRecord,
} from "@/lib/maintenanceScenes";
import { cn } from "@/lib/utils";

interface MaintenanceSceneModalProps {
  open: boolean;
  onClose: () => void;
  records: MaintenanceSceneRecord[];
  currentSceneId: number | null;
  onLoad: (record: MaintenanceSceneRecord) => void;
  onGenerate: (input: { name: string; nodes: MaintenanceSceneNode[] }) => void;
  onRename: (id: number, name: string) => void;
  onDelete: (id: number) => void;
}

interface SelectedItem {
  key: string;
  title: string;
  code?: string;
  kind: MaintenanceNodeKind;
  system: string;
  status?: MaintenanceNodeStatus;
}

type TabKey = "history" | "create";

function getSelectableKind(node: TreeNodeData): MaintenanceNodeKind | null {
  if (node.type === "component") return "pipe";
  if (node.type === "valve") return "valve";
  return null;
}

function StatusChips({
  kind,
  value,
  onChange,
}: {
  kind: MaintenanceNodeKind;
  value?: MaintenanceNodeStatus;
  onChange: (status: MaintenanceNodeStatus) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {MAINTENANCE_STATUS_OPTIONS[kind].map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "px-2 py-0.5 text-xs border transition-colors",
              active
                ? "text-white font-medium"
                : "text-admin-muted bg-white hover:bg-gray-50",
            )}
            style={
              active
                ? { backgroundColor: option.color, borderColor: option.color }
                : { borderColor: "#d9d9d9" }
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function MaintenanceSceneModal({
  open,
  onClose,
  records,
  currentSceneId,
  onLoad,
  onGenerate,
  onRename,
  onDelete,
}: MaintenanceSceneModalProps) {
  const [tab, setTab] = useState<TabKey>("history");
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(
    () =>
      new Set([
        "mt-pipeline",
        "SYS-Tech",
        "SYS-Drain",
        "SYS-Air",
        "SYS-Oil",
        "SYS-Fire",
      ]),
  );
  const [selected, setSelected] = useState<SelectedItem[]>([]);
  const [sceneName, setSceneName] = useState("");
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // 每次打开弹窗重置新建场景状态；已有当前场景时默认停留在历史列表
  useEffect(() => {
    if (!open) return;
    setTab(currentSceneId === null ? "create" : "history");
    setSelected([]);
    setSceneName("");
    setRenamingId(null);
    setDeletingId(null);
  }, [open, currentSceneId]);

  const selectedKeySet = useMemo(
    () => new Set(selected.map((item) => item.key)),
    [selected],
  );

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSelect = (
    node: TreeNodeData,
    kind: MaintenanceNodeKind,
    system: string,
  ) => {
    setSelected((prev) => {
      if (prev.some((item) => item.key === node.key)) {
        return prev.filter((item) => item.key !== node.key);
      }
      return [
        ...prev,
        {
          key: node.key,
          title: node.title,
          code: node.code,
          kind,
          system,
        },
      ];
    });
  };

  const setStatus = (key: string, status: MaintenanceNodeStatus) => {
    setSelected((prev) =>
      prev.map((item) => (item.key === key ? { ...item, status } : item)),
    );
  };

  const canGenerate =
    selected.length > 0 && selected.every((item) => Boolean(item.status));

  const handleGenerate = () => {
    if (!canGenerate) {
      message.warning("请选择检修对象，并为每个对象选择状态");
      return;
    }
    onGenerate({
      name: sceneName,
      nodes: selected.map((item) => ({
        key: item.key,
        title: item.title,
        code: item.code,
        kind: item.kind,
        status: item.status!,
        system: item.system,
      })),
    });
  };

  const renderTreeItem = (
    node: TreeNodeData,
    level: number,
    system: string,
  ) => {
    const hasChildren = Boolean(node.children && node.children.length > 0);
    const expanded = expandedKeys.has(node.key);
    const kind = getSelectableKind(node);
    const nextSystem = node.type === "system" ? node.title : system;
    const checked = selectedKeySet.has(node.key);

    return (
      <div key={node.key}>
        <div
          className={cn(
            "flex items-center gap-1 px-2 py-[3px] text-sm rounded-sm",
            kind ? "cursor-pointer hover:bg-blue-50" : "cursor-default",
            checked && "bg-blue-50",
          )}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => {
            if (kind) toggleSelect(node, kind, nextSystem);
            else if (hasChildren) toggleExpand(node.key);
          }}
        >
          {hasChildren ? (
            <button
              type="button"
              className="text-admin-muted hover:text-admin-text"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(node.key);
              }}
            >
              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : (
            <span className="w-[14px]" />
          )}
          {kind ? (
            <input
              type="checkbox"
              checked={checked}
              readOnly
              className="w-3.5 h-3.5 accent-blue-600"
            />
          ) : (
            <span className="w-3.5" />
          )}
          {node.type === "valve" ? (
            <Wrench size={13} className="text-orange-500" />
          ) : (
            <CircleDot size={13} className={kind ? "text-purple-500" : "text-blue-400"} />
          )}
          {node.code && (
            <span className="text-[11px] font-mono text-admin-muted">
              {node.code}
            </span>
          )}
          <span className="truncate">{node.title}</span>
          {kind && (
            <span className="ml-1 text-[10px] text-admin-muted">
              {kind === "pipe" ? "管路" : "阀门"}
            </span>
          )}
        </div>
        {hasChildren && expanded && (
          <div>
            {node.children!.map((child) =>
              renderTreeItem(child, level + 1, nextSystem),
            )}
          </div>
        )}
      </div>
    );
  };

  const historyContent = (
    <div className="text-sm">
      {records.length === 0 ? (
        <div className="py-10 text-center text-admin-muted">
          暂无历史检修场景，请切换到「新建场景」生成
        </div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-admin-border text-left text-admin-muted">
              <th className="py-2 pr-3 font-normal">场景名称</th>
              <th className="py-2 pr-3 font-normal w-[80px]">对象数</th>
              <th className="py-2 pr-3 font-normal w-[150px]">生成时间</th>
              <th className="py-2 pr-3 font-normal w-[100px]">生成人</th>
              <th className="py-2 font-normal w-[190px] text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => {
              const isCurrent = record.id === currentSceneId;
              return (
                <tr key={record.id} className="border-b border-admin-border/60">
                  <td className="py-2 pr-3">
                    {renamingId === record.id ? (
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            onRename(record.id, renameValue);
                            setRenamingId(null);
                          }
                          if (e.key === "Escape") setRenamingId(null);
                        }}
                        className="w-full h-7 px-2 text-sm border border-admin-border focus:outline-none focus:border-[#40A9FF]"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-admin-text">{record.name}</span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.5 text-[10px] text-white bg-[#40A9FF]">
                            当前展示
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-admin-muted">
                    {record.nodes.length}
                  </td>
                  <td className="py-2 pr-3 text-admin-muted">
                    {record.createdAt}
                  </td>
                  <td className="py-2 pr-3 text-admin-muted">
                    {record.createdBy}
                  </td>
                  <td className="py-2 text-right">
                    {deletingId === record.id ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="text-xs text-admin-danger">确定删除？</span>
                        <button
                          type="button"
                          className="text-xs text-admin-danger hover:underline"
                          onClick={() => {
                            onDelete(record.id);
                            setDeletingId(null);
                          }}
                        >
                          删除
                        </button>
                        <button
                          type="button"
                          className="text-xs text-admin-muted hover:underline"
                          onClick={() => setDeletingId(null)}
                        >
                          取消
                        </button>
                      </span>
                    ) : renamingId === record.id ? (
                      <span className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          className="text-xs text-[#40A9FF] hover:underline"
                          onClick={() => {
                            onRename(record.id, renameValue);
                            setRenamingId(null);
                          }}
                        >
                          保存
                        </button>
                        <button
                          type="button"
                          className="text-xs text-admin-muted hover:underline"
                          onClick={() => setRenamingId(null)}
                        >
                          取消
                        </button>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-3">
                        <button
                          type="button"
                          className="text-xs text-[#40A9FF] hover:underline"
                          onClick={() => onLoad(record)}
                        >
                          载入
                        </button>
                        <button
                          type="button"
                          className="text-xs text-admin-muted hover:text-admin-text inline-flex items-center gap-0.5"
                          onClick={() => {
                            setDeletingId(null);
                            setRenamingId(record.id);
                            setRenameValue(record.name);
                          }}
                        >
                          <Pencil size={12} />
                          重命名
                        </button>
                        <button
                          type="button"
                          className="text-xs text-admin-danger hover:underline inline-flex items-center gap-0.5"
                          onClick={() => {
                            setRenamingId(null);
                            setDeletingId(record.id);
                          }}
                        >
                          <Trash2 size={12} />
                          删除
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );

  const createContent = (
    <div className="flex gap-4 text-sm" style={{ height: 460 }}>
      {/* 左：总结构树（多选） */}
      <div className="flex flex-col border border-admin-border w-[52%] min-w-0">
        <div className="px-3 py-2 border-b border-admin-border text-admin-muted text-xs">
          总结构树（可多选管路与阀门）
        </div>
        <div className="flex-1 overflow-auto py-1">
          {maintenanceTreeData.map((node) => renderTreeItem(node, 0, ""))}
        </div>
      </div>

      {/* 右：已选对象与状态 */}
      <div className="flex flex-col border border-admin-border flex-1 min-w-0">
        <div className="px-3 py-2 border-b border-admin-border text-admin-muted text-xs flex items-center justify-between">
          <span>已选对象（{selected.length}）</span>
          {selected.length > 0 && (
            <button
              type="button"
              className="text-[#40A9FF] hover:underline"
              onClick={() => setSelected([])}
            >
              清空
            </button>
          )}
        </div>
        <div className="flex-1 overflow-auto">
          {selected.length === 0 ? (
            <div className="h-full flex items-center justify-center text-admin-muted text-xs px-6 text-center">
              请从左侧结构树勾选管路或阀门，并为其选择状态
            </div>
          ) : (
            <div className="divide-y divide-admin-border/60">
              {selected.map((item) => (
                <div key={item.key} className="px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={cn(
                          "px-1.5 py-0.5 text-[10px] flex-shrink-0 text-white",
                          item.kind === "pipe" ? "bg-blue-500" : "bg-orange-500",
                        )}
                      >
                        {item.kind === "pipe" ? "管路" : "阀门"}
                      </span>
                      <span className="truncate text-admin-text">{item.title}</span>
                      {item.code && (
                        <span className="text-[10px] text-admin-muted font-mono flex-shrink-0">
                          {item.code}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="text-admin-muted hover:text-admin-danger flex-shrink-0"
                      onClick={() =>
                        setSelected((prev) =>
                          prev.filter((row) => row.key !== item.key),
                        )
                      }
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-[11px] text-admin-muted flex-shrink-0">
                      {item.system}
                    </span>
                    <StatusChips
                      kind={item.kind}
                      value={item.status}
                      onChange={(status) => setStatus(item.key, status)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="border-t border-admin-border px-3 py-2">
          <div className="text-xs text-admin-muted mb-1">场景名称</div>
          <input
            value={sceneName}
            onChange={(e) => setSceneName(e.target.value)}
            placeholder="不填写则自动生成（检修场景-日期时间）"
            className="w-full h-8 px-2 text-sm border border-admin-border focus:outline-none focus:border-[#40A9FF]"
          />
        </div>
      </div>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="检修场景"
      width={980}
      footer={
        tab === "history" ? (
          <button className="btn-default" onClick={onClose}>
            关闭
          </button>
        ) : (
          <>
            <button className="btn-default" onClick={onClose}>
              取消
            </button>
            <button
              className={cn(
                "btn-primary",
                !canGenerate && "opacity-50 cursor-not-allowed",
              )}
              onClick={handleGenerate}
            >
              确认生成（{selected.length}）
            </button>
          </>
        )
      }
    >
      {/* Tab 切换 */}
      <div className="flex items-center gap-1 border-b border-admin-border mb-3">
        {[
          { key: "history" as const, label: "历史检修场景", icon: History },
          { key: "create" as const, label: "新建场景", icon: PlusSquare },
        ].map((item) => {
          const Icon = item.icon;
          const active = tab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={cn(
                "flex items-center gap-1 px-3 py-2 text-sm border-b-2 -mb-px transition-colors",
                active
                  ? "text-[#40A9FF] border-[#40A9FF] font-medium"
                  : "text-admin-muted border-transparent hover:text-admin-text",
              )}
            >
              <Icon size={14} />
              {item.label}
            </button>
          );
        })}
      </div>

      {tab === "history" ? historyContent : createContent}
    </Modal>
  );
}
