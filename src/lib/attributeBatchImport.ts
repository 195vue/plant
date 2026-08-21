import * as XLSX from "xlsx";
import { equipments, pipelines } from "@/mock";
import {
  resolveAttributeTemplate,
  type AttributeTemplateDefinition,
  type AttributeTemplateField,
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

// 表头固定列（KKS编码/对象名称）与模板身份字段重复，下载模板时跳过，避免生成重复列
const TEMPLATE_IDENTITY_FIELDS = new Set([
  "设备名称",
  "KKS编码",
  "唯一编码",
  "编码",
  "管路编码",
  "管路名称",
]);

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

interface NormalizedInputRow {
  rowNumber: number;
  scopeText: string;
  scope: AttributeTemplateScope | null;
  kks: string;
  objectName?: string;
  templateName: string;
  attributeName: string;
  value: string;
  unit: string;
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

function safeSheetName(name: string): string {
  const cleaned = name.replace(/[\\/?*[\]:]/g, "_").slice(0, 31);
  return cleaned || "模板";
}

function uniqueSheetName(name: string, used: Map<string, number>): string {
  const base = safeSheetName(name);
  const count = (used.get(base) || 0) + 1;
  used.set(base, count);
  return count === 1 ? base : `${base}_${count}`;
}

export function downloadAttributeBatchTemplateBySelection(
  selected: AttributeTemplateDefinition[],
) {
  if (selected.length === 0) return;

  const workbook = XLSX.utils.book_new();
  const usedNames = new Map<string, number>();
  selected.forEach((template) => {
    const fieldHeaders = template.fields
      .filter((field) => !TEMPLATE_IDENTITY_FIELDS.has(field.name))
      .map((field) =>
        field.unit ? `${field.name}(${field.unit})` : field.name,
      );
    const headers = ["KKS编码", "对象名称", ...fieldHeaders];
    const sheet = XLSX.utils.aoa_to_sheet([headers]);
    setColumnWidths(sheet, [30, 30, ...fieldHeaders.map(() => 26)]);
    sheet["!autofilter"] = { ref: `A1:${colLetter(headers.length)}1` };
    XLSX.utils.book_append_sheet(
      workbook,
      sheet,
      uniqueSheetName(template.name, usedNames),
    );
  });

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
  if (workbook.Sheets[BATCH_INPUT_SHEET]) {
    return parseLegacyInputSheet(workbook, templates);
  }
  return parseSelectedSheets(workbook, templates);
}

function parseLegacyInputSheet(
  workbook: XLSX.WorkBook,
  templates: AttributeTemplateDefinition[],
): AttributeBatchImportRow[] {
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

  const normalizedRows: NormalizedInputRow[] = rawRows.map((row, index) => ({
    rowNumber: index + 2,
    scopeText: text(row.对象类型),
    scope: normalizeScope(text(row.对象类型)),
    kks: text(row.KKS编码).toUpperCase(),
    templateName: text(row.模板名称),
    attributeName: text(row.属性名称),
    value: text(row.属性值),
    unit: text(row.单位),
  }));
  return validateNormalizedRows(normalizedRows, templates);
}

function matchSheetTemplate(
  sheetName: string,
  templates: AttributeTemplateDefinition[],
): AttributeTemplateDefinition | null {
  return (
    templates.find((template) => template.name === sheetName) ||
    templates.find((template) => template.matchKey === sheetName) ||
    templates.find(
      (template) =>
        template.name.includes(sheetName) || sheetName.includes(template.name),
    ) ||
    null
  );
}

function matchFieldColumn(
  header: string,
  template: AttributeTemplateDefinition,
): { field: AttributeTemplateField; unit: string } | null {
  const exact = template.fields.find((field) => field.name === header);
  if (exact) return { field: exact, unit: "" };
  const stripped = header.replace(/\([^()]*\)$/, "").trim();
  const field = template.fields.find((item) => item.name === stripped);
  if (field) {
    return {
      field,
      unit: header.slice(stripped.length).replace(/^\(/, "").replace(/\)$/, ""),
    };
  }
  return null;
}

function parseSelectedSheets(
  workbook: XLSX.WorkBook,
  templates: AttributeTemplateDefinition[],
): AttributeBatchImportRow[] {
  const sheetNames = workbook.SheetNames.filter(
    (name) => name !== BATCH_INPUT_SHEET && name !== TEMPLATE_SUMMARY_SHEET,
  );
  if (sheetNames.length === 0) {
    throw new Error("Excel中没有可解析的Sheet，请使用系统下载的模板");
  }

  const normalizedRows: NormalizedInputRow[] = [];
  for (const sheetName of sheetNames) {
    const template = matchSheetTemplate(sheetName, templates);
    if (!template) {
      throw new Error(
        `Sheet“${sheetName}”未匹配到模板库中的任何模板，请使用系统下载的模板`,
      );
    }
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: "",
    });
    const headers = (matrix[0] || []).map(text);
    const kksIndex = headers.indexOf("KKS编码");
    if (kksIndex === -1) {
      throw new Error(`Sheet“${sheetName}”缺少“KKS编码”列`);
    }
    const nameIndex = headers.indexOf("对象名称");

    const columns = headers
      .map((header, index) => ({ header, index }))
      .filter((col) => col.index !== kksIndex && col.index !== nameIndex)
      .map((col) => {
        const matched = matchFieldColumn(col.header, template);
        return { ...col, field: matched?.field || null, unit: matched?.unit || "" };
      });
    const unknownColumns = columns.filter((col) => !col.field);
    if (unknownColumns.length > 0) {
      throw new Error(
        `Sheet“${sheetName}”存在无法识别的列：${unknownColumns
          .map((col) => col.header)
          .join("、")}`,
      );
    }

    const scopeText = template.scope === "equipment" ? "设备" : "管路";
    for (let i = 1; i < matrix.length; i++) {
      const row = matrix[i];
      const kks = text(row[kksIndex]).toUpperCase();
      if (!kks) continue;
      const objectName = nameIndex >= 0 ? text(row[nameIndex]) : "";
      for (const col of columns) {
        if (!col.field) continue;
        const value = text(row[col.index]);
        normalizedRows.push({
          rowNumber: normalizedRows.length + 2,
          scopeText,
          scope: template.scope,
          kks,
          objectName,
          templateName: template.name,
          attributeName: col.field.name,
          value,
          unit: col.unit,
        });
      }
    }
  }
  if (normalizedRows.length === 0) {
    throw new Error("Excel中没有可导入的数据，请至少填写一行KKS编码");
  }
  return validateNormalizedRows(normalizedRows, templates);
}

function validateNormalizedRows(
  normalizedRows: NormalizedInputRow[],
  templates: AttributeTemplateDefinition[],
): AttributeBatchImportRow[] {
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
      objectName: row.objectName,
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
        "同一对象的同一属性在表格中出现多次",
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
