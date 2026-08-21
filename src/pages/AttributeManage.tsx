import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  Box,
  Boxes,
  CheckCircle2,
  Download,
  GitBranch,
  Layers3,
  Save,
  Upload,
} from "lucide-react";
import { equipments, pipelines } from "@/mock";
import StructureTreeSelect, {
  type TreeSelectFilter,
} from "@/components/common/StructureTreeSelect";
import { message } from "@/components/common/Message";
import { cn } from "@/lib/utils";
import {
  resolveAttributeTemplate,
  useAttributeTemplates,
} from "@/lib/attributeTemplateStore";
import {
  loadAttributeInstanceValues,
  saveAttributeInstanceValues,
} from "@/lib/attributeInstanceStore";
import AttributeBatchImportModal from "@/pages/attribute/AttributeBatchImportModal";
import AttributeTemplateSelectModal from "@/pages/attribute/AttributeTemplateSelectModal";
import { DevNote } from "@/components/devNotes/DevNote";

type AttrTab = "equipment" | "pipeline";

interface AttributeRow {
  id: string;
  name: string;
  value: string;
}

function pipelineValue(name: string, pipeline: (typeof pipelines)[number]) {
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

export default function AttributeManage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get("tab") as AttrTab) || "equipment";
  const { templates } = useAttributeTemplates();
  const [treeFilter, setTreeFilter] = useState<TreeSelectFilter | null>(null);
  const [rows, setRows] = useState<AttributeRow[]>([]);
  const [batchImportOpen, setBatchImportOpen] = useState(false);
  const [templateSelectOpen, setTemplateSelectOpen] = useState(false);
  const [instanceRevision, setInstanceRevision] = useState(0);

  const objects = tab === "equipment" ? equipments : pipelines;
  const filteredObjects = useMemo(() => {
    const prefix = treeFilter?.kks?.toUpperCase();
    return objects.filter(
      (item) => !prefix || item.code.toUpperCase().startsWith(prefix),
    );
  }, [objects, treeFilter]);

  const requestedId = Number(
    searchParams.get(tab === "equipment" ? "equipId" : "pipelineId"),
  );
  const requestedObject = Number.isFinite(requestedId)
    ? filteredObjects.find((item) => item.id === requestedId)
    : null;
  const selectedObject = requestedObject || filteredObjects[0] || null;

  const classifier =
    tab === "equipment"
      ? (selectedObject as (typeof equipments)[number] | null)?.type || ""
      : (selectedObject as (typeof pipelines)[number] | null)?.usage || "";
  const matchedTemplate = resolveAttributeTemplate(tab, classifier, templates);

  useEffect(() => {
    if (!selectedObject) {
      setRows([]);
      return;
    }
    const existingValues = new Map<string, string>();
    if (tab === "equipment") {
      const equipment = selectedObject as (typeof equipments)[number];
      equipment.attributes?.forEach((attribute) =>
        existingValues.set(attribute.name, attribute.value),
      );
    }
    const savedValues = loadAttributeInstanceValues(tab, selectedObject.id);

    setRows(
      (matchedTemplate?.fields || []).map((field) => ({
        id: field.id,
        name: field.name,
        value:
          savedValues[field.name] ??
          existingValues.get(field.name) ??
          (tab === "pipeline"
            ? pipelineValue(
                field.name,
                selectedObject as (typeof pipelines)[number],
              )
            : ""),
      })),
    );
  }, [matchedTemplate?.id, selectedObject?.id, tab, instanceRevision]);

  const switchTab = (next: AttrTab) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", next);
    params.delete("equipId");
    params.delete("pipelineId");
    setSearchParams(params, { replace: true });
    setTreeFilter(null);
  };

  const saveAttributes = () => {
    if (!selectedObject) return;
    saveAttributeInstanceValues(
      tab,
      selectedObject.id,
      Object.fromEntries(rows.map((row) => [row.name, row.value])),
    );
    message.success(`已保存${selectedObject.name}的${rows.length}项属性`);
  };

  const filledCount = rows.filter((row) => row.value.trim()).length;
  const completeness =
    rows.length === 0 ? 0 : Math.round((filledCount / rows.length) * 100);

  // 范围内对象统计：按当前过滤范围计算平均完整度、完整对象数、待完善对象数
  const scopeStats = useMemo(() => {
    const stats = filteredObjects.map((object) => {
      const classifier =
        tab === "equipment"
          ? (object as (typeof equipments)[number]).type || ""
          : (object as (typeof pipelines)[number]).usage || "";
      const template = resolveAttributeTemplate(tab, classifier, templates);
      if (!template) return { total: 0, filled: 0 };
      const savedValues = loadAttributeInstanceValues(tab, object.id);
      const filled = template.fields.filter((field) => {
        const saved = savedValues[field.name];
        if (saved !== undefined && String(saved).trim()) return true;
        if (tab === "equipment") {
          const attr = (object as (typeof equipments)[number]).attributes?.find(
            (item) => item.name === field.name,
          );
          return Boolean(attr?.value && String(attr.value).trim());
        }
        return Boolean(
          pipelineValue(field.name, object as (typeof pipelines)[number]),
        );
      }).length;
      return { total: template.fields.length, filled };
    });
    const withTemplate = stats.filter((item) => item.total > 0);
    const average = withTemplate.length
      ? Math.round(
          withTemplate.reduce((sum, item) => sum + (item.filled / item.total) * 100, 0) /
            withTemplate.length,
        )
      : 0;
    const complete = withTemplate.filter(
      (item) => item.filled >= item.total,
    ).length;
    return {
      total: filteredObjects.length,
      average,
      complete,
      pending: filteredObjects.length - complete,
    };
  }, [filteredObjects, tab, templates]);

  return (
    <div className="flex h-full flex-col gap-3">
      <DevNote
        id="attribute-tabs"
        title="对象域切换页签"
        summary="在设备属性/管路属性两个对象域间切换"
        items={[
          { label: "数据来源", value: "无数据依赖；URL query tab 参数（equipment/pipeline），默认 equipment" },
          { label: "交互逻辑", value: "点击 switchTab：setSearchParams 更新 tab、清空 equipId/pipelineId、重置 treeFilter；中栏对象锁定为范围内第一个" },
          { label: "后续步骤", value: "正式系统：按对象域加载对应结构树、属性模板与对象列表" },
          { label: "权限", value: "管理员/操作人员/浏览人员可见" },
        ]}
        wrapClassName="block flex-shrink-0"
      >
        <div className="flex flex-shrink-0 items-center gap-1 rounded border border-admin-border bg-admin-card p-1">
          {[
            { key: "equipment" as const, label: "设备属性", icon: Box },
            { key: "pipeline" as const, label: "管路属性", icon: GitBranch },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => switchTab(item.key)}
                className={cn(
                  "flex items-center gap-1.5 rounded px-4 py-1.5 text-xs font-medium transition-colors",
                  tab === item.key
                    ? "bg-blue-500 text-white"
                    : "text-admin-muted hover:bg-gray-100 hover:text-admin-text",
                )}
              >
                <Icon size={14} />
                {item.label}
              </button>
            );
          })}
        </div>
      </DevNote>

      <div className="flex min-h-0 flex-1 gap-3">
        <DevNote
          id="attribute-tree"
          title="属性结构树"
          summary="按KKS层级限定对象范围，点击节点过滤属性编辑对象"
          items={[
            { label: "数据来源", value: "StructureTreeSelect（treeType=当前对象域）；对象范围按选中节点 KKS 前缀过滤" },
            { label: "交互逻辑", value: "onSelect：清空 equipId/pipelineId 参数并设置 treeFilter；filteredObjects 按 KKS 前缀过滤，selectedObject 取范围内第一个；右栏范围统计同步刷新" },
            { label: "后续步骤", value: "正式系统：由结构树服务返回设备/管路层级，对象范围按层级节点过滤" },
            { label: "权限", value: "管理员/操作人员/浏览人员可见" },
          ]}
          wrapClassName="flex flex-shrink-0"
        >
          <div className="admin-card flex w-[230px] flex-shrink-0 flex-col overflow-hidden">
            <div className="border-b border-admin-border bg-gray-50 px-3 py-2">
              <div className="text-xs font-semibold text-admin-text">
                {tab === "equipment" ? "设备结构树" : "管路结构树"}
              </div>
              <div className="mt-0.5 text-[10px] text-admin-muted">
                按KKS层级限定对象范围
              </div>
            </div>
            <div className="min-h-0 flex-1">
              <StructureTreeSelect
                treeType={tab}
                title={tab === "equipment" ? "设备结构树" : "管路结构树"}
                selectedNodeId={treeFilter?.nodeId}
                onSelect={(filter) => {
                  const params = new URLSearchParams(searchParams);
                  params.delete("equipId");
                  params.delete("pipelineId");
                  setSearchParams(params, { replace: true });
                  setTreeFilter(filter);
                }}
              />
            </div>
          </div>
        </DevNote>

        <DevNote
          id="attribute-editor"
          title="属性编辑区"
          summary="当前对象属性填写表格，支持下载模板/批量导入/保存属性"
          items={[
            { label: "数据来源", value: "selectedObject（范围内第一个或 URL 指定对象）；rows 由 matchedTemplate.fields 生成，属性值优先取已保存实例值（localStorage attribute-instance-store），其次取设备 attributes / 管路基础字段" },
            { label: "校验规则", value: "未匹配模板或模板无字段时表格空态提示「当前对象没有可编辑属性，请先在属性模板库维护模板」；未选对象时保存按钮 disabled" },
            { label: "交互逻辑", value: "头部显示对象名/编码/自动匹配模板；「下载批量导入模板」生成双Sheet Excel；「批量导入」打开导入弹窗；「保存属性」→ saveAttributes 写 localStorage 并提示「已保存X的N项属性」；表格仅序号/属性名称（只读）/属性值（可编辑）三列" },
            { label: "后续步骤", value: "正式系统：属性模板由属性模板库接口读取，实例值保存调用属性管理保存接口" },
            { label: "权限", value: "管理员/操作人员可编辑保存；浏览人员只读" },
          ]}
          wrapClassName="flex flex-1 min-w-0"
        >
          <div className="admin-card flex min-w-0 flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-admin-border bg-gray-50 px-4 py-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-admin-text">
                  {selectedObject?.name || "请选择对象"}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[10px] text-admin-muted">
                  <span>{selectedObject?.code || "—"}</span>
                  <span>自动匹配模板：</span>
                  <span
                    className={
                      matchedTemplate ? "text-green-600" : "text-orange-600"
                    }
                  >
                    {matchedTemplate?.name || "未匹配"}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <DevNote
                  id="attribute-download-template"
                  title="下载批量导入模板"
                  summary="弹出模板类型多选弹窗，按所选类型生成多Sheet Excel模板"
                  items={[
                    { label: "数据来源", value: "AttributeTemplateSelectModal：按当前页签（设备/管路）展示对应范围内的模板类型多选（可全选/取消全选）；downloadAttributeBatchTemplateBySelection(selected)：每个选中模板生成一个Sheet，Sheet名=模板名，表头=KKS编码/对象名称/各字段名(单位)，跳过设备名称/KKS编码/唯一编码/编码等身份字段避免重复列" },
                    { label: "交互逻辑", value: "点击打开「下载批量导入模板」弹窗 → 仅列出当前页签范围内的模板类型（未选时「生成模板」禁用）→ 点击「生成模板(N个)」下载「属性批量导入模板_日期.xlsx」，每个Sheet对应一种模板类型，可直接逐行填写设备/管路数据" },
                    { label: "后续步骤", value: "正式系统：模板由后台按当前属性模板库动态生成" },
                    { label: "权限", value: "管理员/操作人员可见" },
                  ]}
                >
                  <button
                    className="btn-default flex items-center gap-1 text-xs"
                    onClick={() => setTemplateSelectOpen(true)}
                  >
                    <Download size={12} />
                    下载批量导入模板
                  </button>
                </DevNote>
                <DevNote
                  id="attribute-batch-import"
                  title="批量导入"
                  summary="打开属性批量导入弹窗，上传多Sheet Excel校验后写入"
                  items={[
                    { label: "数据来源", value: "AttributeBatchImportModal；解析所选模板生成的Excel，每个Sheet对应一种模板类型，按Sheet名匹配模板、表头识别字段（xlsx/xls，≤20MB）；兼容解析旧版Sheet1-批量填报格式" },
                    { label: "校验规则", value: "Sheet未匹配到模板、缺少KKS编码列、存在无法识别的列、无数据时提示错误；每行校验：必填项→KKS匹配对象→模板匹配→属性存在→单位一致（来自表头）→重复→值非空" },
                    { label: "交互逻辑", value: "打开弹窗后可勾选「覆盖已有属性值」（默认仅填充空值）；预览表逐行显示 已匹配/未匹配/模板不一致/单位不一致/重复数据/数据不完整；确认导入后提示「批量导入完成：X个对象，Y项属性」" },
                    { label: "后续步骤", value: "正式系统：由属性管理批量导入接口校验并入库" },
                    { label: "权限", value: "管理员/操作人员可见" },
                  ]}
                >
                  <button
                    className="btn-default flex items-center gap-1 text-xs"
                    onClick={() => setBatchImportOpen(true)}
                  >
                    <Upload size={12} />
                    批量导入
                  </button>
                </DevNote>
                <DevNote
                  id="attribute-save"
                  title="保存属性"
                  summary="保存当前对象属性值到本地并刷新统计"
                  items={[
                    { label: "数据来源", value: "saveAttributeInstanceValues(tab, objectId, {属性名:值}) 写入 localStorage attribute-instance-store" },
                    { label: "校验规则", value: "未选对象时 disabled" },
                    { label: "交互逻辑", value: "点击保存后提示「已保存{对象名}的N项属性」，触发 instanceRevision 刷新，右栏完整度/范围统计同步更新" },
                    { label: "后续步骤", value: "正式系统：调用属性保存接口并返回成功/失败" },
                    { label: "权限", value: "管理员/操作人员可见" },
                  ]}
                >
                  <button
                    className="btn-primary flex items-center gap-1 text-xs"
                    disabled={!selectedObject}
                    onClick={saveAttributes}
                  >
                    <Save size={12} />
                    保存属性
                  </button>
                </DevNote>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 z-10 bg-gray-50">
                  <tr className="border-b border-admin-border text-admin-muted">
                    <th className="w-14 px-3 py-2 text-center font-medium">
                      序号
                    </th>
                    <th className="px-3 py-2 text-left font-medium">属性名称</th>
                    <th className="px-3 py-2 text-left font-medium">属性值</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={row.id} className="border-b border-admin-border">
                      <td className="px-3 py-2 text-center text-admin-muted">
                        {index + 1}
                      </td>
                      <td className="px-3 py-1.5">
                        <div className="rounded border border-transparent bg-gray-50 px-2.5 py-1.5 text-xs text-admin-text">
                          {row.name}
                        </div>
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          className="input-base w-full text-xs"
                          value={row.value}
                        placeholder="请输入属性值"
                        onChange={(event) =>
                          setRows((current) =>
                            current.map((item) =>
                              item.id === row.id
                                ? { ...item, value: event.target.value }
                                : item,
                            ),
                          )
                        }
                      />
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="py-16 text-center text-admin-muted"
                    >
                      当前对象没有可编辑属性，请先在属性模板库维护模板
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        </DevNote>

        <DevNote
          id="attribute-right-panel"
          title="右栏信息卡（3张）"
          summary="当前属性完整度 / 范围统计 / 模板匹配信息"
          items={[
            { label: "数据来源", value: "当前属性完整度=completeness%（filledCount/rows.length）；范围统计=scopeStats（范围内对象总数/平均完整度/已填写完整/待完善）；模板匹配信息=classifier + matchedTemplate" },
            { label: "校验规则", value: "无模板时完整度0%、范围统计按未匹配模板对象跳过平均计算、模板信息显示「未匹配」" },
            { label: "交互逻辑", value: "纯信息展示无点击；保存属性或切换对象/结构树后实时刷新；范围统计底部提示「当前结构树选中范围内对象属性填写情况」" },
            { label: "后续步骤", value: "正式系统：范围统计由属性管理统计接口按当前层级返回；模板匹配由模板库自动匹配逻辑确定" },
            { label: "权限", value: "管理员/操作人员/浏览人员可见" },
          ]}
          wrapClassName="flex flex-shrink-0"
        >
          <div className="flex w-[260px] flex-shrink-0 flex-col gap-3">
            <div className="admin-card p-4">
              <div className="flex items-center gap-1.5 text-xs font-medium text-admin-text">
                <CheckCircle2 size={14} className="text-green-500" />
                当前属性完整度
              </div>
              <div className="mt-3 flex items-end justify-between">
                <span className="text-3xl font-semibold text-admin-primary">
                  {completeness}%
                </span>
                <span className="text-xs text-admin-muted">
                  {filledCount}/{rows.length}项
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded bg-gray-100">
                <div
                  className="h-full rounded bg-green-500"
                  style={{ width: `${completeness}%` }}
                />
              </div>
            </div>

            <div className="admin-card min-h-0 flex-1 overflow-hidden">
              <div className="flex items-center gap-1.5 border-b border-admin-border bg-gray-50 px-3 py-2">
                <Boxes size={13} className="text-blue-500" />
                <span className="text-xs font-medium text-admin-text">
                  范围统计
                </span>
                <span className="ml-auto text-[10px] text-admin-muted">
                  {tab === "equipment" ? "设备" : "管路"}范围
                </span>
              </div>
              <div className="p-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded border border-admin-border bg-gray-50/60 p-2.5 text-center">
                    <div className="text-xl font-semibold text-admin-primary">
                      {scopeStats.total}
                    </div>
                    <div className="mt-0.5 text-[10px] text-admin-muted">
                      范围内{tab === "equipment" ? "设备" : "管路"}总数
                    </div>
                  </div>
                  <div className="rounded border border-admin-border bg-gray-50/60 p-2.5 text-center">
                    <div className="text-xl font-semibold text-green-600">
                      {scopeStats.average}
                      <span className="ml-0.5 text-[10px] font-normal">%</span>
                    </div>
                    <div className="mt-0.5 text-[10px] text-admin-muted">
                      平均完整度
                    </div>
                  </div>
                  <div className="rounded border border-admin-border bg-gray-50/60 p-2.5 text-center">
                    <div className="text-xl font-semibold text-emerald-600">
                      {scopeStats.complete}
                    </div>
                    <div className="mt-0.5 text-[10px] text-admin-muted">
                      已填写完整
                    </div>
                  </div>
                  <div className="rounded border border-admin-border bg-gray-50/60 p-2.5 text-center">
                    <div className="text-xl font-semibold text-orange-500">
                      {scopeStats.pending}
                    </div>
                    <div className="mt-0.5 text-[10px] text-admin-muted">
                      待完善
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-[10px] text-admin-muted">
                  <span>当前结构树选中范围内对象属性填写情况</span>
                </div>
              </div>
            </div>

            <div className="admin-card p-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-admin-text">
                <Layers3 size={13} className="text-admin-primary" />
                模板匹配信息
              </div>
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-admin-muted">对象类型</span>
                  <span>{classifier || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-admin-muted">匹配模板</span>
                  <span>{matchedTemplate?.name || "未匹配"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-admin-muted">模板属性</span>
                  <span>{matchedTemplate?.fields.length || 0}项</span>
                </div>
              </div>
            </div>
          </div>
        </DevNote>
      </div>

      <AttributeBatchImportModal
        open={batchImportOpen}
        templates={templates}
        scope={tab}
        onClose={() => setBatchImportOpen(false)}
        onImported={() => setInstanceRevision((value) => value + 1)}
      />
      <AttributeTemplateSelectModal
        open={templateSelectOpen}
        templates={templates}
        scope={tab}
        onClose={() => setTemplateSelectOpen(false)}
      />
    </div>
  );
}
