import { useCallback, useEffect, useState } from "react";
import { equipmentAttrTemplates } from "@/mock";
import type { EquipmentAttrTemplates } from "@/types";

export type AttributeTemplateScope = "equipment" | "pipeline";
export const ATTRIBUTE_FIELD_CATEGORIES = ["基础信息", "技术参数"] as const;

export interface AttributeTemplateField {
  id: string;
  name: string;
  unit: string;
  category: string;
}

export interface AttributeTemplateDefinition {
  id: string;
  scope: AttributeTemplateScope;
  name: string;
  matchKey: string;
  fields: AttributeTemplateField[];
}

const STORAGE_KEY = "plant-attribute-template-library-v1";
export const TEMPLATE_CHANGE_EVENT = "attribute-templates-changed";

const technicalFieldNames = new Set([
  "公称直径(DN)",
  "壁厚",
  "设计压力",
  "设计温度",
  "长度",
  "坡度",
]);

const equipmentTypeAliases: Record<string, string> = {
  导水机构: "水泵水轮机",
  主进水阀: "进水阀",
  变压器: "主变压器",
  控制屏柜: "电气二次盘柜",
  "滤水器/热交换器": "滤水器",
  馈电屏: "电气二次盘柜",
  母线: "离相封闭母线",
  电抗器: "限流电抗器",
  "门槽/栅槽": "闸门",
};

const pipelineDefaults: Record<string, Array<{ name: string; unit?: string }>> = {
  主管路: [
    { name: "管路编码" },
    { name: "管路名称" },
    { name: "KKS编码" },
    { name: "公称直径(DN)", unit: "mm" },
    { name: "壁厚", unit: "mm" },
    { name: "材质" },
    { name: "设计压力", unit: "MPa" },
    { name: "设计温度", unit: "℃" },
    { name: "介质类型" },
    { name: "长度", unit: "m" },
    { name: "安装日期" },
  ],
  技术供水管路: [
    { name: "管路编码" },
    { name: "管路名称" },
    { name: "KKS编码" },
    { name: "公称直径(DN)", unit: "mm" },
    { name: "壁厚", unit: "mm" },
    { name: "材质" },
    { name: "设计压力", unit: "MPa" },
    { name: "介质类型" },
    { name: "长度", unit: "m" },
    { name: "起点设备" },
    { name: "终点设备" },
  ],
  冷却水管路: [
    { name: "管路编码" },
    { name: "管路名称" },
    { name: "KKS编码" },
    { name: "公称直径(DN)", unit: "mm" },
    { name: "材质" },
    { name: "设计压力", unit: "MPa" },
    { name: "介质类型" },
    { name: "长度", unit: "m" },
  ],
  排水管路: [
    { name: "管路编码" },
    { name: "管路名称" },
    { name: "KKS编码" },
    { name: "公称直径(DN)", unit: "mm" },
    { name: "材质" },
    { name: "介质类型" },
    { name: "长度", unit: "m" },
    { name: "坡度" },
  ],
  供油管路: [
    { name: "管路编码" },
    { name: "管路名称" },
    { name: "KKS编码" },
    { name: "公称直径(DN)", unit: "mm" },
    { name: "材质" },
    { name: "设计压力", unit: "MPa" },
    { name: "设计温度", unit: "℃" },
    { name: "介质类型" },
    { name: "长度", unit: "m" },
  ],
  消防管路: [
    { name: "管路编码" },
    { name: "管路名称" },
    { name: "KKS编码" },
    { name: "公称直径(DN)", unit: "mm" },
    { name: "材质" },
    { name: "设计压力", unit: "MPa" },
    { name: "介质类型" },
    { name: "长度", unit: "m" },
  ],
};

function fieldId(prefix: string, index: number) {
  return `${prefix}-${index + 1}`;
}

function normalizeCategory(category: string, fieldName: string) {
  if (
    category === "技术参数" ||
    category.includes("特性") ||
    category.includes("技术")
  ) {
    return "技术参数";
  }
  if (category === "管路属性" && technicalFieldNames.has(fieldName)) {
    return "技术参数";
  }
  return "基础信息";
}

function normalizeTemplates(templates: AttributeTemplateDefinition[]) {
  return templates.map((template) => ({
    ...template,
    fields: template.fields.map((field) => ({
      ...field,
      category: normalizeCategory(field.category || "", field.name),
    })),
  }));
}

function createInitialTemplates(): AttributeTemplateDefinition[] {
  const equipmentTemplates = Object.entries(
    equipmentAttrTemplates as EquipmentAttrTemplates,
  ).map(([name, group], templateIndex) => {
    let fieldSequence = 0;
    return {
      id: `equipment-${templateIndex + 1}`,
      scope: "equipment" as const,
      name,
      matchKey: name,
      fields: group.categories.flatMap((category) =>
        category.attrs.map((field) => ({
          id: fieldId(`equipment-${templateIndex + 1}`, fieldSequence++),
          name: field.name,
          unit: field.unit || "",
          category: normalizeCategory(category.name, field.name),
        })),
      ),
    };
  });

  const pipelineTemplates = Object.entries(pipelineDefaults).map(
    ([name, fields], templateIndex) => ({
      id: `pipeline-${templateIndex + 1}`,
      scope: "pipeline" as const,
      name,
      matchKey: name,
      fields: fields.map((field, fieldIndex) => ({
        id: fieldId(`pipeline-${templateIndex + 1}`, fieldIndex),
        name: field.name,
        unit: field.unit || "",
        category: normalizeCategory("管路属性", field.name),
      })),
    }),
  );

  return [...equipmentTemplates, ...pipelineTemplates];
}

export function loadAttributeTemplates(): AttributeTemplateDefinition[] {
  if (typeof window === "undefined") return createInitialTemplates();
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return createInitialTemplates();
  try {
    return normalizeTemplates(
      JSON.parse(stored) as AttributeTemplateDefinition[],
    );
  } catch {
    return createInitialTemplates();
  }
}

export function saveAttributeTemplates(
  templates: AttributeTemplateDefinition[],
) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  window.dispatchEvent(new CustomEvent(TEMPLATE_CHANGE_EVENT));
}

export function resolveAttributeTemplate(
  scope: AttributeTemplateScope,
  classifier: string,
  templates = loadAttributeTemplates(),
) {
  const normalizedClassifier =
    scope === "equipment"
      ? equipmentTypeAliases[classifier] || classifier
      : classifier;

  return (
    templates.find(
      (template) =>
        template.scope === scope &&
        template.matchKey === normalizedClassifier,
    ) ||
    templates.find(
      (template) =>
        template.scope === scope &&
        (normalizedClassifier.includes(template.matchKey) ||
          template.matchKey.includes(normalizedClassifier)),
    ) ||
    null
  );
}

export function useAttributeTemplates() {
  const [templates, setTemplates] = useState<AttributeTemplateDefinition[]>(
    () => loadAttributeTemplates(),
  );

  useEffect(() => {
    const refresh = () => setTemplates(loadAttributeTemplates());
    window.addEventListener(TEMPLATE_CHANGE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(TEMPLATE_CHANGE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const updateTemplates = useCallback(
    (next: AttributeTemplateDefinition[]) => {
      setTemplates(next);
      saveAttributeTemplates(next);
    },
    [],
  );

  return { templates, setTemplates: updateTemplates };
}
