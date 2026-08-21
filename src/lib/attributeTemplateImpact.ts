// 属性模板影响分析：模板变更（新增字段）后统计受影响对象、生成预填Excel、跟踪待补填状态
import * as XLSX from "xlsx";
import { equipments, pipelines } from "@/mock";
import {
  resolveAttributeTemplate,
  type AttributeTemplateDefinition,
  type AttributeTemplateField,
  type AttributeTemplateScope,
} from "@/lib/attributeTemplateStore";
import { loadAttributeInstanceValues } from "@/lib/attributeInstanceStore";

export interface TemplateUserObject {
  scope: AttributeTemplateScope;
  id: number;
  code: string;
  name: string;
}

const PENDING_KEY = "plant-template-pending-newfields-v1";

// ===== 新增字段识别 =====
/** 新模板中存在、旧模板中不存在的字段（按字段 id 区分，新字段 id 为新建唯一值） */
export function diffNewFields(
  oldTemplate: AttributeTemplateDefinition | null,
  newTemplate: AttributeTemplateDefinition,
): AttributeTemplateField[] {
  if (!oldTemplate) return [];
  const oldIds = new Set(oldTemplate.fields.map((field) => field.id));
  return newTemplate.fields.filter((field) => !oldIds.has(field.id));
}

// ===== 受影响对象统计（与属性管理页同一匹配逻辑） =====
export function findTemplateUsers(
  template: AttributeTemplateDefinition,
  templates: AttributeTemplateDefinition[],
): TemplateUserObject[] {
  const users: TemplateUserObject[] = [];
  if (template.scope === "equipment") {
    equipments.forEach((item) => {
      const matched = resolveAttributeTemplate("equipment", item.type || "", templates);
      if (matched?.id === template.id) {
        users.push({ scope: "equipment", id: item.id, code: item.code, name: item.name });
      }
    });
  } else {
    pipelines.forEach((item) => {
      const matched = resolveAttributeTemplate("pipeline", item.usage || "", templates);
      if (matched?.id === template.id) {
        users.push({ scope: "pipeline", id: item.id, code: item.code, name: item.name });
      }
    });
  }
  return users;
}

// ===== 待补填状态跟踪（localStorage：模板id → 新增字段名列表） =====
type PendingStore = Record<string, string[]>;

function loadPending(): PendingStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as PendingStore) : {};
  } catch {
    return {};
  }
}

function savePending(store: PendingStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PENDING_KEY, JSON.stringify(store));
}

export function rememberNewFields(templateId: string, fieldNames: string[]) {
  if (fieldNames.length === 0) return;
  const store = loadPending();
  const merged = Array.from(new Set([...(store[templateId] || []), ...fieldNames]));
  store[templateId] = merged;
  savePending(store);
}

export function getPendingNewFields(templateId: string): string[] {
  return loadPending()[templateId] || [];
}

function objectBaseValue(
  scope: AttributeTemplateScope,
  objectId: number,
  fieldName: string,
): string {
  const saved = loadAttributeInstanceValues(scope, objectId)[fieldName];
  if (saved !== undefined && String(saved).trim()) return String(saved).trim();
  if (scope === "equipment") {
    return (
      equipments
        .find((item) => item.id === objectId)
        ?.attributes?.find((attr) => attr.name === fieldName)?.value || ""
    );
  }
  const pipeline = pipelines.find((item) => item.id === objectId);
  if (!pipeline) return "";
  const values: Record<string, string> = {
    管路编码: pipeline.code,
    管路名称: pipeline.name,
    KKS编码: pipeline.code,
    "公称直径(DN)": pipeline.dn || "",
    壁厚: pipeline.wallThickness ? String(pipeline.wallThickness) : "",
    材质: pipeline.material || "",
    设计压力: pipeline.designPressure ? String(pipeline.designPressure) : "",
    设计温度: pipeline.designTemperature ? String(pipeline.designTemperature) : "",
    介质类型: pipeline.medium || "",
    长度: pipeline.length ? String(pipeline.length) : "",
    安装日期: pipeline.installDate || "",
    起点设备: pipeline.startDevice || "",
    终点设备: pipeline.endDevice || "",
  };
  return values[fieldName] || "";
}

/** 待补填对象数：使用该模板且存在新增字段值为空的对象数量（随实例值保存自动归零） */
export function countPendingUsers(
  template: AttributeTemplateDefinition,
  users: TemplateUserObject[],
): number {
  return findPendingUsers(template, users).length;
}

/** 待补填对象列表：新增字段仍有值为空的对象（用于"待补充"弹窗直接跳转填写） */
export function findPendingUsers(
  template: AttributeTemplateDefinition,
  users: TemplateUserObject[],
): TemplateUserObject[] {
  const pendingFields = getPendingNewFields(template.id);
  if (pendingFields.length === 0) return [];
  return users.filter((user) =>
    pendingFields.some(
      (name) => !objectBaseValue(user.scope, user.id, name).trim(),
    ),
  );
}

// ===== 预填 Excel 生成 =====
function safeSheetName(name: string): string {
  const cleaned = name.replace(/[\\/?*[\]:]/g, "_").slice(0, 31);
  return cleaned || "模板";
}

function colLetter(index: number): string {
  let letters = "";
  let n = index + 1;
  while (n > 0) {
    const remainder = (n - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}

/** 生成受影响对象预填 Excel：预填 KKS编码/对象名称，新增属性列留空待填 */
export function downloadPrefillExcel(
  template: AttributeTemplateDefinition,
  newFields: AttributeTemplateField[],
  users: TemplateUserObject[],
) {
  const fieldHeaders = newFields.map((field) =>
    field.unit ? `${field.name}(${field.unit})` : field.name,
  );
  const headers = ["KKS编码", "对象名称", ...fieldHeaders];
  const data = [
    headers,
    ...users.map((user) => [user.code, user.name, ...newFields.map(() => "")]),
  ];
  const sheet = XLSX.utils.aoa_to_sheet(data);
  sheet["!cols"] = [30, 30, ...newFields.map(() => 26)].map((wch) => ({ wch }));
  sheet["!autofilter"] = { ref: `A1:${colLetter(headers.length)}1` };
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, safeSheetName(template.name));

  const now = new Date();
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  XLSX.writeFile(workbook, `属性补充填写_${template.name}_${date}.xlsx`);
}
