import { useSyncExternalStore } from "react";
import { roamingPaths as defaultPaths } from "@/mock";
import type { RoamingPath } from "@/types";

/**
 * 漫游路线共享存储
 * - 大屏（录制/播放）与后台（路线管理）共用同一份数据
 * - 使用 localStorage 持久化，刷新页面不丢失
 */
const STORAGE_KEY = "plant.roaming-paths.v1";

const listeners = new Set<() => void>();
let cache: RoamingPath[] | null = null;

function readFromStorage(): RoamingPath[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as RoamingPath[];
      if (Array.isArray(parsed)) {
        cache = parsed;
        return cache;
      }
    }
  } catch {
    // 忽略存储异常，回退到默认路线
  }
  cache = defaultPaths;
  return cache;
}

function emit() {
  listeners.forEach((listener) => listener());
}

export function getRoamingPaths() {
  return readFromStorage();
}

export function setRoamingPaths(paths: RoamingPath[]) {
  cache = paths;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(paths));
  } catch {
    // 忽略存储异常（隐私模式等），仅内存生效
  }
  emit();
}

export function subscribeRoamingPaths(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useRoamingPaths() {
  return useSyncExternalStore(
    subscribeRoamingPaths,
    getRoamingPaths,
    getRoamingPaths
  );
}

// 跨标签页同步：后台页编辑/删除路线后，大屏自动刷新
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) {
      cache = null;
      emit();
    }
  });
}
