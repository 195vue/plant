// 改造资料汇总数据层
// 原型阶段使用 localStorage 持久化；正式接入后台 CRUD 接口后可替换

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "plant.retrofit-records.v1";

export const RETROFIT_SYSTEMS = [
  { key: "tech", label: "技术供水" },
  { key: "drain", label: "排水" },
  { key: "air", label: "气系统" },
  { key: "oil", label: "透平油" },
  { key: "fire", label: "消防水" },
] as const;

export type RetrofitSystemKey = (typeof RETROFIT_SYSTEMS)[number]["key"];
export const retrofitSystemLabel = (key: RetrofitSystemKey) =>
  RETROFIT_SYSTEMS.find((s) => s.key === key)?.label ?? key;

export interface RetrofitAttachment {
  name: string;
  size: number;
  type: string; // MIME
  dataUrl: string; // base64 data URL（原型）
}

export interface RetrofitRecord {
  id: number;
  system: RetrofitSystemKey;
  title: string; // 改造内容
  date: string; // YYYY-MM-DD 改造日期
  location: string; // 改造部位（可选）
  content: string; // 改造描述/资料内容
  attachments: RetrofitAttachment[];
  remark?: string;
  createdBy: string;
  createdAt: string;
}

// ===== 示例数据 =====
function makeInitialRecords(): RetrofitRecord[] {
  const mk = (
    id: number,
    system: RetrofitSystemKey,
    title: string,
    date: string,
    location: string,
    content: string,
    remark?: string
  ): RetrofitRecord => ({
    id,
    system,
    title,
    date,
    location,
    content,
    attachments: [],
    remark,
    createdBy: "系统管理员",
    createdAt: date + " 09:30:00",
  });
  return [
    mk(1, "tech", "技术供水主管道扩容改造", "2026-03-15", "1#机组", "1#机组技术供水主管更换为 DN300 无缝钢管，提升供水能力。", "已验收"),
    mk(2, "tech", "技术供水泵变频改造", "2026-01-20", "1#2#机组", "1#~2#技术供水泵加装变频调速装置，实现按需调节。"),
    mk(3, "tech", "滤水器自动排污改造", "2025-11-08", "全厂", "技术供水滤水器改造为自动排污控制，降低运维工作量。"),
    mk(4, "tech", "供水支管阀门更换", "2025-08-30", "1#机组", "分支管路 DN150 不锈钢阀门整体更换。"),
    mk(5, "tech", "冷却水循环管路改造", "2025-05-12", "2#机组", "机组冷却器进出水支管改造，优化流量分配。"),
    mk(6, "tech", "技术供水系统管路防腐", "2024-12-05", "全厂", "供水母管防腐处理与局部更换。"),
    mk(7, "drain", "厂房排水主管改造", "2026-02-18", "坝后厂房", "厂房排水主管 UPVC 管道更换为 304 不锈钢管。"),
    mk(8, "drain", "渗漏排水泵管路改造", "2025-09-25", "1#机组", "渗漏排水泵出口管路改造，增加旁通管。"),
    mk(9, "drain", "排水支管疏通改造", "2025-04-10", "全厂", "排水支管坡度调整与疏通，解决积水问题。"),
    mk(10, "air", "低压气系统管路扩容", "2026-05-06", "坝后厂房", "低压气系统主管由 DN50 扩容至 DN80。"),
    mk(11, "air", "高压气储气罐连接管更换", "2026-02-11", "全厂", "储气罐连接管更换为高压无缝钢管。"),
    mk(12, "air", "气系统主管阀门整体更换", "2025-10-22", "1#机组", "气系统主管阀门更换为全不锈钢球阀。"),
    mk(13, "air", "机组制动气压管路改造", "2025-06-15", "2#机组", "机组制动气压管路改造，增加压力测点。"),
    mk(14, "oil", "透平油供油管路改造", "2026-04-02", "1#机组", "透平油供油主管更换为不锈钢管，增加过滤装置。"),
    mk(15, "oil", "油压装置进出油管路改造", "2025-07-18", "2#机组", "油压装置进出油管路改造，降低阻力。"),
    mk(16, "fire", "厂区消防主管整体更换", "2026-06-20", "厂区", "厂区消防主管整体更换为 DN200 球墨铸铁管。"),
    mk(17, "fire", "厂房消火栓主管改造", "2026-03-28", "坝后厂房", "厂房消火栓主管改造，增加消防喷淋系统。"),
    mk(18, "fire", "消防水泵出水母管改造", "2025-12-10", "全厂", "消防水泵出水母管改造，增加备用泵出口。"),
    mk(19, "fire", "消防分支管路阀门更换", "2025-08-05", "1#机组", "消防分支管路阀门更换为信号蝶阀。"),
    mk(20, "fire", "消防水系统试压整改", "2025-03-22", "全厂", "消防水系统管路试压与整改，更换泄漏点。"),
  ];
}

// ===== store =====
let cache: RetrofitRecord[] = load();
const listeners = new Set<() => void>();

function load(): RetrofitRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = makeInitialRecords();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as RetrofitRecord[];
  } catch {
    const seed = makeInitialRecords();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
}

function emit() {
  for (const fn of listeners) fn();
  persist();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      try {
        cache = e.newValue ? JSON.parse(e.newValue) : makeInitialRecords();
        for (const fn of listeners) fn();
      } catch {}
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  return cache;
}

export function useRetrofitRecords(): RetrofitRecord[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function getRetrofitRecords(): RetrofitRecord[] {
  return cache.slice();
}

export function addRetrofitRecord(
  input: Omit<RetrofitRecord, "id" | "createdAt">
): RetrofitRecord {
  const maxId = cache.reduce((m, r) => Math.max(m, r.id), 0);
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const createdAt = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const record: RetrofitRecord = {
    ...input,
    id: maxId + 1,
    createdAt,
  };
  cache = [record, ...cache];
  emit();
  return record;
}

export function updateRetrofitRecord(
  id: number,
  patch: Partial<Omit<RetrofitRecord, "id" | "createdAt">>
): RetrofitRecord | null {
  const idx = cache.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  cache = cache.map((r) => (r.id === id ? { ...r, ...patch } : r));
  emit();
  return cache[idx];
}

export function deleteRetrofitRecord(id: number): boolean {
  const before = cache.length;
  cache = cache.filter((r) => r.id !== id);
  if (cache.length === before) return false;
  emit();
  return true;
}

// 按系统聚合（大屏柱状图用）
export function getRetrofitStatsBySystem(): {
  system: string; // 中文 label
  key: RetrofitSystemKey;
  count: number;
}[] {
  return RETROFIT_SYSTEMS.map((s) => ({
    system: s.label,
    key: s.key,
    count: cache.filter((r) => r.system === s.key).length,
  }));
}
