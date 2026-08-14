import * as XLSX from "xlsx";
import { equipments, pipelines } from "@/mock";
import {
  resolveAttributeTemplate,
  type AttributeTemplateDefinition,
  type AttributeTemplateScope,
} from "@/lib/attributeTemplateStore";
import {
  loadAttributeInstanceValues,
  saveAttributeInstanceValues,
} from "@/lib/attributeInstanceStore";

export const BATCH_INPUT_SHEET = "Sheet1-批量填报";
export const TEMPLATE_SUMMARY_SHEET = "Sheet2-模板汇总";

const INPUT_HEADERS = [
  "对象类型",
  "KKS编码",
  "模板名称",
  "属性名称",
  "属性值",
  "单位",
] as const;

export type BatchImportStatus =
  | "matched"
  | "unmatched"
  | "unit_mismatch"
  | "duplicate"
  | "template_mismatch"
  | "incomplete";

export interface AttributeBatchImportRow {
  rowNumber: number;
  scope: AttributeTemplateScope | null;
  scopeLabel: string;
  kks: string;
  objectId?: number;
  objectName?: string;
  templateName: string;
  attributeName: string;
  value: string;
  unit: string;
  status: BatchImportStatus;
  statusLabel: string;
  message: string;
  canImport: boolean;
}

interface RawInputRow {
  对象类型: unknown;
  KKS编码: unknown;
  模板名称: unknown;
  属性名称: unknown;
  属性值: unknown;
  单位: unknown;
}

function text(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeScope(value: string): AttributeTemplateScope | null {
  const normalized = value.toLowerCase();
  if (value === "设备" || normalized === "equipment") return "equipment";
  if (value === "管路" || value === "管道" || normalized === "pipeline") {
    return "pipeline";
  }
  return null;
}

function setColumnWidths(sheet: XLSX.WorkSheet, widths: number[]) {
  sheet["!cols"] = widths.map((wch) => ({ wch }));
}

export function downloadAttributeBatchTemplate(
  templates: AttributeTemplateDefinition[],
) {
  const inputSheet = XLSX.utils.aoa_to_sheet([[...INPUT_HEADERS]]);
  setColumnWidths(inputSheet, [12, 28, 24, 24, 24, 14]);
  inputSheet["!autofilter"] = { ref: "A1:F1" };

  const summaryRows = templates.flatMap((template) =>
    template.fields.map((field) => ({
      对象类型: template.scope === "equipment" ? "设备" : "管路",
      模板名称: template.name,
      匹配类型: template.matchKey,
      属性分类: field.category,
      属性名称: field.name,
      单位: field.unit,
    })),
  );
  const summarySheet = XLSX.utils.json_to_sheet(summaryRows, {
    header: [
      "对象类型",
      "模板名称",
      "匹配类型",
      "属性分类",
      "属性名称",
      "单位",
    ],
  });
  setColumnWidths(summarySheet, [12, 24, 24, 16, 24, 14]);
  if (summaryRows.length > 0) {
    summarySheet["!autofilter"] = { ref: `A1:F${summaryRows.length + 1}` };
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, inputSheet, BATCH_INPUT_SHEET);
  XLSX.utils.book_append_sheet(
    workbook,
    summarySheet,
    TEMPLATE_SUMMARY_SHEET,
  );

  const now = new Date();
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  XLSX.writeFile(workbook, `属性批量导入模板_${date}.xlsx`);
}

function status(
  base: Omit<
    AttributeBatchImportRow,
    "status" | "statusLabel" | "message" | "canImport"
  >,
  code: BatchImportStatus,
  label: string,
  message: string,
): AttributeBatchImportRow {
  return {
    ...base,
    status: code,
    statusLabel: label,
    message,
    canImport: code === "matched",
  };
}

export async function parseAttributeBatchFile(
  file: File,
  templates: AttributeTemplateDefinition[],
): Promise<AttributeBatchImportRow[]> {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const inputSheet = workbook.Sheets[BATCH_INPUT_SHEET];
  if (!inputSheet) {
    throw new Error(`未找到“${BATCH_INPUT_SHEET}”，请使用系统下载的模板`);
  }
  if (!workbook.Sheets[TEMPLATE_SUMMARY_SHEET]) {
    throw new Error(`未找到“${TEMPLATE_SUMMARY_SHEET}”，请勿删除模板汇总页`);
  }

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(inputSheet, {
    header: 1,
    defval: "",
  });
  const headers = (matrix[0] || []).map(text);
  const missingHeaders = INPUT_HEADERS.filter(
    (header) => !headers.includes(header),
  );
  if (missingHeaders.length > 0) {
    throw new Error(`Sheet1缺少列：${missingHeaders.join("、")}`);
  }

  const rawRows = XLSX.utils.sheet_to_json<RawInputRow>(inputSheet, {
    defval: "",
    raw: false,
  });
  if (rawRows.length === 0) {
    throw new Error("Sheet1中没有可导入的数据");
  }

  const normalizedRows = rawRows.map((row, index) => ({
    rowNumber: index + 2,
    scopeText: text(row.对象类型),
    scope: normalizeScope(text(row.对象类型)),
    kks: text(row.KKS编码).toUpperCase(),
    templateName: text(row.模板名称),
    attributeName: text(row.属性名称),
    value: text(row.属性值),
    unit: text(row.单位),
  }));
  const duplicateCounts = normalizedRows.reduce((counts, row) => {
    const key = `${row.scopeText}|${row.kks}|${row.attributeName}`;
    counts.set(key, (counts.get(key) || 0) + 1);
    return counts;
  }, new Map<string, number>());

  return normalizedRows.map((row) => {
    const scopeLabel =
      row.scope === "equipment"
        ? "设备"
        : row.scope === "pipeline"
          ? "管路"
          : row.scopeText || "未填写";
    const base = {
      rowNumber: row.rowNumber,
      scope: row.scope,
      scopeLabel,
      kks: row.kks,
      templateName: row.templateName,
      attributeName: row.attributeName,
      value: row.value,
      unit: row.unit,
    };

    if (
      !row.scopeText ||
      !row.kks ||
      !row.templateName ||
      !row.attributeName
    ) {
      return status(
        base,
        "incomplete",
        "数据不完整",
        "对象类型、KKS编码、模板名称和属性名称均为必填项",
      );
    }
    if (!row.scope) {
      return status(
        base,
        "unmatched",
        "未匹配",
        "对象类型只能填写“设备”或“管路”",
      );
    }

    const object =
      row.scope === "equipment"
        ? equipments.find((item) => item.code.toUpperCase() === row.kks)
        : pipelines.find((item) => item.code.toUpperCase() === row.kks);
    if (!object) {
      return status(
        base,
        "unmatched",
        "未匹配",
        `未找到KKS编码为“${row.kks}”的${scopeLabel}`,
      );
    }

    const classifier =
      row.scope === "equipment"
        ? equipments.find((item) => item.id === object.id)?.type || ""
        : pipelines.find((item) => item.id === object.id)?.usage || "";
    const template = resolveAttributeTemplate(
      row.scope,
      classifier,
      templates,
    );
    const objectBase = {
      ...base,
      objectId: object.id,
      objectName: object.name,
    };
    if (!template) {
      return status(
        objectBase,
        "unmatched",
        "未匹配",
        `当前${scopeLabel}类型“${classifier}”未匹配属性模板`,
      );
    }
    if (template.name !== row.templateName) {
      return status(
        objectBase,
        "template_mismatch",
        "模板不一致",
        `当前对象应使用“${template.name}”模板`,
      );
    }

    const field = template.fields.find(
      (item) => item.name === row.attributeName,
    );
    if (!field) {
      return status(
        objectBase,
        "unmatched",
        "未匹配",
        "属性名称不在当前内部模板中，不会新增属性",
      );
    }
    if (field.unit.trim() !== row.unit) {
      return status(
        objectBase,
        "unit_mismatch",
        "单位不一致",
        `内部模板单位为“${field.unit || "无单位"}”，系统不自动换算`,
      );
    }

    const duplicateKey = `${row.scopeText}|${row.kks}|${row.attributeName}`;
    if ((duplicateCounts.get(duplicateKey) || 0) > 1) {
      return status(
        objectBase,
        "duplicate",
        "重复数据",
        "同一对象的同一属性在Sheet1中出现多次",
      );
    }
    if (!row.value) {
      return status(
        objectBase,
        "incomplete",
        "数据不完整",
        "属性值为空，本行不会导入",
      );
    }

    return status(
      objectBase,
      "matched",
      "已匹配",
      "校验通过，可导入",
    );
  });
}

function pipelineBaseValue(
  name: string,
  pipeline: (typeof pipelines)[number],
) {
  const values: Record<string, string> = {
    管路编码: pipeline.code,
    管路名称: pipeline.name,
    KKS编码: pipeline.code,
    "公称直径(DN)": pipeline.dn || "",
    壁厚: pipeline.wallThickness ? String(pipeline.wallThickness) : "",
    材质: pipeline.material || "",
    设计压力: pipeline.designPressure ? String(pipeline.designPressure) : "",
    设计温度: pipeline.designTemperature
      ? String(pipeline.designTemperature)
      : "",
    介质类型: pipeline.medium || "",
    长度: pipeline.length ? String(pipeline.length) : "",
    安装日期: pipeline.installDate || "",
    起点设备: pipeline.startDevice || "",
    终点设备: pipeline.endDevice || "",
  };
  return values[name] || "";
}

function baseValue(
  row: AttributeBatchImportRow,
  attributeName: string,
) {
  if (!row.objectId || !row.scope) return "";
  if (row.scope === "equipment") {
    return (
      equipments
        .find((item) => item.id === row.objectId)
        ?.attributes?.find((item) => item.name === attributeName)?.value || ""
    );
  }
  const pipeline = pipelines.find((item) => item.id === row.objectId);
  return pipeline ? pipelineBaseValue(attributeName, pipeline) : "";
}

export function applyAttributeBatchRows(
  rows: AttributeBatchImportRow[],
  overwriteExisting: boolean,
) {
  const groups = rows
    .filter(
      (row) =>
        row.canImport &&
        row.scope !== null &&
        row.objectId !== undefined,
    )
    .reduce((result, row) => {
      const key = `${row.scope}:${row.objectId}`;
      const current = result.get(key) || [];
      current.push(row);
      result.set(key, current);
      return result;
    }, new Map<string, AttributeBatchImportRow[]>());

  let importedFields = 0;
  let skippedExisting = 0;
  let importedObjects = 0;

  groups.forEach((groupRows) => {
    const first = groupRows[0];
    if (!first.scope || first.objectId === undefined) return;

    const values = {
      ...loadAttributeInstanceValues(first.scope, first.objectId),
    };
    let objectChanged = false;
    groupRows.forEach((row) => {
      const existingValue =
        values[row.attributeName] || baseValue(row, row.attributeName);
      if (!overwriteExisting && existingValue.trim()) {
        skippedExisting += 1;
        return;
      }
      values[row.attributeName] = row.value;
      importedFields += 1;
      objectChanged = true;
    });

    if (objectChanged) {
      saveAttributeInstanceValues(first.scope, first.objectId, values);
      importedObjects += 1;
    }
  });

  return { importedFields, importedObjects, skippedExisting };
}
