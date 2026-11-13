import { useSyncExternalStore } from "react";

/**
 * 检修场景共享存储
 * - 大屏「检修场景」模块使用：保存每一次生成的检修场景记录
 * - 原型使用 localStorage 持久化；正式系统改为调用后台检修场景接口（新增/查询/重命名/删除）
 */
const STORAGE_KEY = "plant.maintenance-scenes.v1";

export type MaintenanceNodeKind = "pipe" | "valve" | "equipment";

export type MaintenanceNodeStatus =
  | "pressurized"
  | "unpressurized"
  | "open"
  | "closed"
  | "running"
  | "stopped"
  | "maintaining";

export interface MaintenanceSceneNode {
  key: string;
  title: string;
  code?: string;
  kind: MaintenanceNodeKind;
  status: MaintenanceNodeStatus;
  /** 所属管路系统名称，用于场景内分组与配色 */
  system: string;
}

export interface MaintenanceSceneRecord {
  id: number;
  name: string;
  createdAt: string;
  createdBy: string;
  nodes: MaintenanceSceneNode[];
}

export interface MaintenanceStatusOption {
  value: MaintenanceNodeStatus;
  label: string;
  color: string;
}

/** 管路 / 阀门各自可选的状态（单选） */
export const MAINTENANCE_STATUS_OPTIONS: Record<
  MaintenanceNodeKind,
  MaintenanceStatusOption[]
> = {
  pipe: [
    { value: "pressurized", label: "带压", color: "#ff4d4f" },
    { value: "unpressurized", label: "不带压", color: "#8c8c8c" },
  ],
  valve: [
    { value: "open", label: "开", color: "#52c41a" },
    { value: "closed", label: "关", color: "#8c8c8c" },
    { value: "maintaining", label: "检修中", color: "#faad14" },
  ],
  equipment: [
    { value: "running", label: "运行", color: "#52c41a" },
    { value: "stopped", label: "停机", color: "#8c8c8c" },
    { value: "maintaining", label: "检修中", color: "#faad14" },
  ],
};

export function getMaintenanceStatusMeta(
  kind: MaintenanceNodeKind,
  status: MaintenanceNodeStatus,
) {
  return (
    MAINTENANCE_STATUS_OPTIONS[kind].find((item) => item.value === status) ?? {
      value: status,
      label: "-",
      color: "#8c8c8c",
    }
  );
}

/** 按管路系统名取模型配色（与管路总览保持一致） */
export function getMaintenanceSystemColor(system: string) {
  if (system.includes("技术供水") || system.includes("供水")) return "#1890ff";
  if (system.includes("排水")) return "#52c41a";
  if (system.includes("气系统") || system.includes("压缩空气")) return "#faad14";
  if (system.includes("透平油")) return "#ff8520";
  if (system.includes("消防")) return "#ff4d4f";
  return "#40a9ff";
}

function formatNow() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
    now.getHours(),
  )}:${pad(now.getMinutes())}`;
}

const defaultScenes: MaintenanceSceneRecord[] = [
  {
    id: 1,
    name: "1#机组技术供水检修",
    createdAt: "2026-10-28 09:30",
    createdBy: "系统管理员",
    nodes: [
      {
        key: "pipe-1-1-1",
        title: "1#机组技术供水主管",
        code: "PL-001",
        kind: "pipe",
        status: "pressurized",
        system: "技术供水系统",
      },
      {
        key: "pipe-1-1-2",
        title: "2#机组技术供水主管",
        code: "PL-002",
        kind: "pipe",
        status: "unpressurized",
        system: "技术供水系统",
      },
      {
        key: "valve-1-1",
        title: "1#机组进水阀",
        code: "VAL-001",
        kind: "valve",
        status: "maintaining",
        system: "技术供水系统",
      },
    ],
  },
];

const listeners = new Set<() => void>();
let cache: MaintenanceSceneRecord[] | null = null;

function readFromStorage(): MaintenanceSceneRecord[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MaintenanceSceneRecord[];
      if (Array.isArray(parsed)) {
        cache = parsed;
        return cache;
      }
    }
  } catch {
    // 忽略存储异常，回退到默认检修场景
  }
  cache = defaultScenes;
  return cache;
}

function emit() {
  listeners.forEach((listener) => listener());
}

export function getMaintenanceScenes() {
  return readFromStorage();
}

export function setMaintenanceScenes(scenes: MaintenanceSceneRecord[]) {
  cache = scenes;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scenes));
  } catch {
    // 忽略存储异常（隐私模式等），仅内存生效
  }
  emit();
}

export function addMaintenanceScene(input: {
  name: string;
  nodes: MaintenanceSceneNode[];
  createdBy?: string;
}): MaintenanceSceneRecord {
  const record: MaintenanceSceneRecord = {
    id: Date.now(),
    name: input.name.trim() || `检修场景-${formatNow()}`,
    createdAt: formatNow(),
    createdBy: input.createdBy || "系统管理员",
    nodes: input.nodes,
  };
  setMaintenanceScenes([record, ...getMaintenanceScenes()]);
  return record;
}

export function renameMaintenanceScene(id: number, name: string) {
  const nextName = name.trim();
  if (!nextName) return;
  setMaintenanceScenes(
    getMaintenanceScenes().map((scene) =>
      scene.id === id ? { ...scene, name: nextName } : scene,
    ),
  );
}

export function deleteMaintenanceScene(id: number) {
  setMaintenanceScenes(getMaintenanceScenes().filter((scene) => scene.id !== id));
}

export function subscribeMaintenanceScenes(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useMaintenanceScenes() {
  return useSyncExternalStore(
    subscribeMaintenanceScenes,
    getMaintenanceScenes,
    getMaintenanceScenes,
  );
}

// 跨标签页同步：任一标签页新增/重命名/删除检修场景后，其他标签页自动刷新
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) {
      cache = null;
      emit();
    }
  });
}
