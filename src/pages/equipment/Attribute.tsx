import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import ReactECharts from "echarts-for-react";
import {
  Plus,
  Minus,
  Save,
  Upload,
  Download,
  BarChart3,
  Copy,
  Settings,
  CheckCircle,
  AlertCircle,
  XCircle,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  TrendingUp,
  FolderTree,
  Edit3,
  Trash2,
  X,
  Search,
} from "lucide-react";
import { equipments, equipmentAttrTemplates } from "@/mock";
import type { Equipment, EquipmentAttrTemplates, AttrTemplateItem } from "@/types";
import { Tag } from "@/components/common/Tag";
import { message } from "@/components/common/Message";
import { Modal } from "@/components/common/Modal";
import StructureTreeSelect, { type TreeSelectFilter } from "@/components/common/StructureTreeSelect";
import { buildStructureTree, findNode, type TreeNode } from "@/mock/structureTree";

type AttrTab = "instance" | "template";

function flattenTemplate(type: string): { name: string; unit?: string; category?: string; enName?: string; type?: string }[] {
  const group = (equipmentAttrTemplates as EquipmentAttrTemplates)[type];
  if (!group) return [];
  return group.categories.flatMap((cat) =>
    cat.attrs.map((attr) => ({ name: attr.name, unit: attr.unit || undefined, category: cat.name, enName: attr.enName, type: attr.type }))
  );
}

interface AttrRow {
  id: number;
  name: string;
  value: string;
  type: "text" | "number" | "date" | "select";
  unit?: string;
  required?: boolean;
  remark?: string;
}

const typeOptions: { label: string; value: AttrRow["type"] }[] = [
  { label: "文本", value: "text" },
  { label: "数字", value: "number" },
  { label: "日期", value: "date" },
  { label: "下拉", value: "select" },
];

let rowIdSeed = 1000;
const nextId = () => ++rowIdSeed;

export default function EquipmentAttribute() {
  const [searchParams] = useSearchParams();
  const urlEquipId = searchParams.get("equipId");
  const initialId = urlEquipId
    ? equipments.find((e) => e.id === Number(urlEquipId))?.id ?? equipments[0]?.id ?? null
    : (equipments.length > 0 ? equipments[0].id : null);
  const [selectedId, setSelectedId] = useState<number | null>(initialId);
  const [rows, setRows] = useState<AttrRow[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<AttrTab>("instance");

  // 结构树选中的节点ID及对应KKS筛选集合
  // - kksPrefixes：用于 L1~L3（或有子节点的集合父节点）的前缀范围过滤
  // - kksExactCodes：用于真正末级叶子设备（无children + category=equipment）的精确匹配（避免同前缀长码被误含入）
  const [treeNodeId, setTreeNodeId] = useState<number | undefined>(undefined);
  const [kksPrefixes, setKksPrefixes] = useState<string[] | null>(null);
  const [kksExactCodes, setKksExactCodes] = useState<string[] | null>(null);
  const tree = useMemo(() => buildStructureTree("equipment"), []);

  // 模板编辑弹窗
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<string>("");
  const [templateAttrs, setTemplateAttrs] = useState<AttrTemplateItem[]>([]);

  // 模板预览弹窗
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);

  // 套用模板合并弹窗
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set());

  // 根据选中树节点及后代，收集KKS前缀集合
  const collectPrefixes = (rootNode: TreeNode): string[] => {
    const result: string[] = [];
    const walk = (n: TreeNode) => {
      if (n.kks && n.kks.trim()) result.push(n.kks.toUpperCase());
      if (n.children) n.children.forEach(walk);
    };
    walk(rootNode);
    return result;
  };

  // 按当前KKS范围过滤后的设备列表
  // 优先级：精确匹配集合（叶子末级设备用）> 前缀范围集合（分组/系统目录节点用）
  const scopedEquipments = useMemo(() => {
    if ((!kksPrefixes || kksPrefixes.length === 0) && (!kksExactCodes || kksExactCodes.length === 0))
      return equipments;
    return equipments.filter((e) => {
      const code = e.code.toUpperCase();
      if (kksExactCodes && kksExactCodes.length > 0) return kksExactCodes.includes(code);
      return kksPrefixes?.some((prefix) => code.startsWith(prefix)) ?? true;
    });
  }, [kksPrefixes, kksExactCodes]);

  const selectedEquip = scopedEquipments.find((e) => e.id === selectedId) || scopedEquipments[0] || null;
  const selectedIndex = useMemo(
    () => scopedEquipments.findIndex((e) => e.id === selectedEquip?.id),
    [scopedEquipments, selectedEquip]
  );
  const [scopeKeyword, setScopeKeyword] = useState("");
  const scopedPickerOptions = useMemo(() => {
    const kw = scopeKeyword.trim().toUpperCase();
    if (!kw) return scopedEquipments;
    return scopedEquipments.filter(
      (e) => e.code.toUpperCase().includes(kw) || e.name.toUpperCase().includes(kw) || e.type.toUpperCase().includes(kw)
    );
  }, [scopedEquipments, scopeKeyword]);

  // 上一台 / 下一台（范围限定）
  const goPrevEquip = () => {
    if (scopedEquipments.length < 2) return;
    const idx = selectedIndex < 0 ? 0 : (selectedIndex - 1 + scopedEquipments.length) % scopedEquipments.length;
    const target = scopedEquipments[idx];
    if (target) handleSelect(target.id);
  };
  const goNextEquip = () => {
    if (scopedEquipments.length < 2) return;
    const idx = selectedIndex < 0 ? 0 : (selectedIndex + 1) % scopedEquipments.length;
    const target = scopedEquipments[idx];
    if (target) handleSelect(target.id);
  };
  // 从左树选中节点读取"节点名 + KKS"用于范围说明
  const selectedNodeInfo = useMemo(() => {
    if (!treeNodeId) return null;
    const node = findNode(tree, treeNodeId);
    return node ? { name: node.name, kks: node.kks, level: node.level } : null;
  }, [tree, treeNodeId]);

  // 判断当前选中节点是否"末级叶子设备"（没有子节点 + category=equipment）
  const isLeafEquipmentNode = (node: TreeNode | null): boolean => {
    if (!node) return false;
    const hasChildren = !!node.children && node.children.length > 0;
    return !hasChildren && node.category === "equipment";
  };

  // 点击结构树任意节点：
  // - 末级叶子设备 → 精确匹配 code===kks（范围严格=1台）
  // - 非末级（有子节点的集合父节点/系统目录节点）→ 收集节点+后代的KKS前缀，做范围过滤
  const handleTreeSelect = (filter: TreeSelectFilter) => {
    setScopeKeyword("");
    setTreeNodeId(filter.nodeId);
    const node = findNode(tree, filter.nodeId);
    const leaf = isLeafEquipmentNode(node);
    const selectedKks = filter.kks.toUpperCase();
    if (leaf) {
      // 末级设备：精确匹配（只有 code 完全相等才算在范围内）
      setKksExactCodes([selectedKks]);
      setKksPrefixes(null);
      const exact = equipments.find((e) => e.code.toUpperCase() === selectedKks);
      if (exact) {
        handleSelect(exact.id);
        return;
      }
      // 末级节点的KKS在equipment表中没找到精确对应（数据有偏差时）→ 范围为空，不加载
      setSelectedId(null);
      setRows([]);
      setSelectedRowKeys([]);
      return;
    }
    // 非末级：前缀范围过滤
    setKksExactCodes(null);
    const prefixes = node ? collectPrefixes(node) : [selectedKks];
    setKksPrefixes(prefixes.length > 0 ? prefixes : null);
    // 选范围内第一台（优先优先选中code完全等于filter.kks的L4设备）
    let target: Equipment | undefined = equipments.find((e) => e.code.toUpperCase() === selectedKks);
    if (!target) {
      const scope =
        prefixes.length === 0
          ? equipments
          : equipments.filter((e) => prefixes.some((p) => e.code.toUpperCase().startsWith(p)));
      target = scope[0];
    }
    if (target) handleSelect(target.id);
    else {
      setSelectedId(null);
      setRows([]);
      setSelectedRowKeys([]);
    }
  };

  const handleTreeClear = () => {
    setTreeNodeId(undefined);
    setKksPrefixes(null);
    setKksExactCodes(null);
    // 清除范围后回到全量第一台
    if (equipments.length > 0) handleSelect(equipments[0].id);
  };

  const handleSelect = (id: number) => {
    const eq = equipments.find((e) => e.id === id);
    if (!eq) return;
    setSelectedId(id);
    const template = flattenTemplate(eq.type);
    const existing = eq.attributes || [];
    setRows(
      template.map((t) => {
        const ex = existing.find((a) => a.name === t.name);
        return {
          id: nextId(),
          name: t.name,
          value: ex?.value || "",
          type: (ex?.type as AttrRow["type"]) || "text",
          unit: t.unit,
          required: false,
          remark: ex?.remark || "",
        };
      })
    );
    setSelectedRowKeys([]);
  };

  useEffect(() => {
    if (initialId !== null) handleSelect(initialId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateRow = (id: number, patch: Partial<AttrRow>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const handleAddRow = () => {
    setRows([
      ...rows,
      { id: nextId(), name: "", value: "", type: "text", unit: "", required: false, remark: "" },
    ]);
  };

  const handleDeleteRows = () => {
    if (selectedRowKeys.length === 0) return message.warning("请先选择要删除的行");
    setRows(rows.filter((r) => !selectedRowKeys.includes(r.id)));
    setSelectedRowKeys([]);
    message.success(`已删除 ${selectedRowKeys.length} 行`);
  };

  const handleSave = () => {
    if (!selectedEquip) return message.warning("请先选择设备");
    if (rows.some((r) => !r.name.trim())) return message.warning("存在属性名称为空的行");
    message.success(`已保存 ${selectedEquip.name} 的 ${rows.length} 条属性`);
  };

  const handleCopyTemplate = () => {
    if (!selectedEquip) return message.warning("请先选择设备");
    const template = flattenTemplate(selectedEquip.type);
    if (template.length === 0) return message.warning("该设备类型无属性模板");

    const hasValues = rows.some((r) => r.value.trim() !== "");
    if (hasValues && rows.length > 0) {
      setMergeModalOpen(true);
    } else {
      // 无已填值，直接全量套用
      doApplyTemplate(template, false);
    }
  };

  const doApplyTemplate = (
    template: { name: string; unit?: string; category?: string; enName?: string; type?: string }[],
    keepExisting: boolean
  ) => {
    if (!keepExisting) {
      // 全量替换
      setRows(
        template.map((t) => ({
          id: nextId(),
          name: t.name,
          value: "",
          type: "text" as const,
          unit: t.unit,
          required: false,
          remark: "",
        }))
      );
      message.success(`已套用 ${selectedEquip?.type} 类型模板（${template.length} 项，已覆盖原有属性）`);
    } else {
      // 智能合并：保留已有值，新增模板中有但当前没有的属性
      const existingMap = new Map(rows.map((r) => [r.name, r]));
      const merged: AttrRow[] = template.map((t) => {
        const ex = existingMap.get(t.name);
        if (ex && ex.value.trim() !== "") {
          // 保留已有值
          return { ...ex, id: nextId(), unit: t.unit || ex.unit };
        }
        // 新增或空值项
        return {
          id: nextId(),
          name: t.name,
          value: ex?.value || "",
          type: (ex?.type as AttrRow["type"]) || "text",
          unit: t.unit,
          required: false,
          remark: ex?.remark || "",
        };
      });
      // 额外保留模板中没有但用户手动添加的行
      const templateNames = new Set(template.map((t) => t.name));
      const extraRows = rows.filter((r) => !templateNames.has(r.name));
      setRows([...merged, ...extraRows]);

      const kept = merged.filter((m) => rows.find((r) => r.name === m.name && r.value.trim() !== "")).length;
      const added = merged.length - kept;
      message.success(`智能合并完成：保留 ${kept} 项已有值，新增 ${added} 项模板属性`);
    }
    setMergeModalOpen(false);
  };

  const toggleRow = (id: number, checked: boolean) =>
    setSelectedRowKeys((prev) => (checked ? [...prev, id] : prev.filter((k) => k !== id)));
  const allChecked = rows.length > 0 && selectedRowKeys.length === rows.length;
  const toggleAll = (checked: boolean) => setSelectedRowKeys(checked ? rows.map((r) => r.id) : []);

  // 展开/收起模板更多项
  const toggleExpandTemplate = (type: string) => {
    setExpandedTemplates((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  // 打开模板编辑弹窗
  const handleOpenTemplateEditor = (type: string) => {
    setEditingTemplate(type);
    const flat = flattenTemplate(type);
    setTemplateAttrs(
      flat.map((f, i) => ({
        name: f.name,
        enName: f.enName || `attr_${i}`,
        type: f.type || "String",
        unit: f.unit || "",
        defaultValue: "",
        pickList: "",
      }))
    );
    setTemplateModalOpen(true);
  };

  const handleAddTemplateAttr = () => {
    setTemplateAttrs((prev) => [
      ...prev,
      { name: "", enName: `attr_${prev.length}`, type: "String", unit: "", defaultValue: "", pickList: "" },
    ]);
  };

  const handleDeleteTemplateAttr = (index: number) => {
    setTemplateAttrs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateTemplateAttr = (index: number, patch: Partial<AttrTemplateItem>) => {
    setTemplateAttrs((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const handleSaveTemplate = () => {
    if (templateAttrs.some((a) => !a.name.trim())) {
      return message.warning("存在属性名称为空的项");
    }
    message.success(`已保存 ${editingTemplate} 模板（${templateAttrs.length} 项属性）`);
    setTemplateModalOpen(false);
  };

  // 属性模板统计
  const templateStats = useMemo(() => {
    const types = Object.keys(equipmentAttrTemplates as EquipmentAttrTemplates);
    return types.map((type) => ({
      type,
      count: flattenTemplate(type).length,
    }));
  }, []);

  // ============ 右侧栏三个统计（使用模拟数据展示） ============

  // 为每个设备模拟属性填写状态（按当前范围scopedEquipments）
  const simulatedEquipStats = useMemo(() => {
    // 可预测的伪随机
    const seeded = (seed: number) => {
      const x = Math.sin(seed * 9301 + 49297) * 233280;
      return x - Math.floor(x);
    };
    return scopedEquipments.map((eq, idx) => {
      const total = flattenTemplate(eq.type).length;
      // 每个设备的完成度 30%~100%
      const rate = 0.3 + seeded(eq.id * 7 + idx) * 0.7;
      const filled = Math.round(total * rate);
      return { ...eq, total, filled, missing: total - filled };
    });
  }, [scopedEquipments]);

  const completenessStats = useMemo(() => {
    let complete = 0;
    let partial = 0;
    let incomplete = 0;
    simulatedEquipStats.forEach((eq) => {
      if (eq.total === 0) incomplete++;
      else if (eq.filled >= eq.total) complete++;
      else if (eq.filled > 0) partial++;
      else incomplete++;
    });
    return { complete, partial, incomplete, total: scopedEquipments.length };
  }, [simulatedEquipStats, scopedEquipments]);

  const completenessChart = useMemo(
    () => ({
      tooltip: { trigger: "item", formatter: "{b}: {c}台 ({d}%)" },
      series: [
        {
          type: "pie",
          radius: ["45%", "70%"],
          center: ["50%", "50%"],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 4, borderColor: "#fff", borderWidth: 2 },
          label: { show: false },
          data: [
            { value: completenessStats.complete, name: "完整", itemStyle: { color: "#10b981" } },
            { value: completenessStats.partial, name: "部分", itemStyle: { color: "#f59e0b" } },
            { value: completenessStats.incomplete, name: "未填", itemStyle: { color: "#ef4444" } },
          ],
        },
      ],
      graphic: [
        {
          type: "text",
          left: "center",
          top: "38%",
          style: { text: `${completenessStats.total}`, fontSize: 24, fontWeight: "bold", fill: "#1f2937" },
        },
        {
          type: "text",
          left: "center",
          top: "55%",
          style: { text: "设备总数", fontSize: 10, fill: "#6b7280" },
        },
      ],
    }),
    [completenessStats]
  );

  const missingTop10 = useMemo(() => {
    return simulatedEquipStats
      .filter((eq) => eq.missing > 0)
      .sort((a, b) => b.missing - a.missing)
      .slice(0, 10);
  }, [simulatedEquipStats]);

  const typeCoverage = useMemo(() => {
    // 1. 汇总当前范围内实际设备的类型统计
    const typeMap = new Map<string, { total: number; filled: number }>();
    simulatedEquipStats.forEach((eq) => {
      const t = eq.type;
      if (!typeMap.has(t)) typeMap.set(t, { total: 0, filled: 0 });
      const entry = typeMap.get(t)!;
      entry.total++;
      if (eq.total > 0 && eq.filled >= eq.total) entry.filled++;
    });
    // 2. 补齐模板库的全部类型（保证覆盖率图类型丰富），基于模板属性数量生成合理的模拟覆盖率
    const allTemplateTypes = Object.keys(equipmentAttrTemplates as EquipmentAttrTemplates);
    const seededRate = (seedStr: string) => {
      let seed = 0;
      for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
      const x = Math.sin(seed * 9301 + 49297) * 233280;
      return x - Math.floor(x);
    };
    allTemplateTypes.forEach((t) => {
      if (!typeMap.has(t)) {
        // 基于类型名生成 25%~98% 的合理覆盖率（模拟"预期目标"覆盖率）
        const mockTotal = 2 + Math.round(seededRate(t + "total") * 6); // 2~8台
        const rate = 0.25 + seededRate(t + "rate") * 0.73; // 25%~98%
        const mockFilled = Math.round(mockTotal * rate);
        typeMap.set(t, { total: mockTotal, filled: mockFilled });
      }
    });
    return Array.from(typeMap.entries())
      .map(([type, v]) => ({
        type,
        total: v.total,
        filled: v.filled,
        rate: v.total > 0 ? Math.round((v.filled / v.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [simulatedEquipStats]);

  const coverageChart = useMemo(
    () => ({
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      grid: { top: 5, right: 30, bottom: 5, left: 70 },
      xAxis: { type: "value", max: 100, axisLabel: { fontSize: 10, formatter: "{value}%" } },
      yAxis: {
        type: "category",
        data: typeCoverage.map((t) => t.type).reverse(),
        axisLabel: { fontSize: 10, width: 65, overflow: "truncate" },
      },
      series: [
        {
          type: "bar",
          data: typeCoverage.map((t) => t.rate).reverse(),
          itemStyle: {
            color: (params: { value: number }) => {
              const v = params.value;
              if (v >= 80) return "#10b981";
              if (v >= 50) return "#f59e0b";
              return "#ef4444";
            },
            borderRadius: [0, 3, 3, 0],
          },
          barWidth: 14,
          label: { show: true, position: "right", fontSize: 10, formatter: "{c}%" },
        },
      ],
    }),
    [typeCoverage]
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-3 flex-1 min-h-0">
        {/* 左侧：结构树 */}
        <div className="w-[280px] flex-shrink-0 admin-card flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-admin-border bg-gray-50 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-admin-text flex items-center gap-1.5">
              <FolderTree size={12} className="text-admin-primary" />
              设备结构树
            </h3>
            {treeNodeId && (
              <button
                className="text-[10px] text-blue-500 hover:underline flex items-center gap-0.5"
                onClick={handleTreeClear}
              >
                <X size={10} /> 清除
              </button>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <StructureTreeSelect
              selectedNodeId={treeNodeId}
              onSelect={handleTreeSelect}
              title="设备结构树"
              treeType="equipment"
            />
          </div>
          <div className="px-3 py-1.5 border-t border-admin-border bg-gray-50 text-[10px] text-admin-muted">
            💡 点击末级节点（设备）可选中编辑属性
          </div>
        </div>

        {/* 中间：属性编辑区 */}
        <div className="flex-1 min-w-0 flex flex-col gap-3 min-h-0">
          {/* Tab切换 */}
          <div className="flex items-center justify-between flex-shrink-0">
            <div className="inline-flex bg-gray-100 rounded-lg p-0.5">
              {[
                { key: "instance" as const, label: "设备属性", icon: <Settings size={13} />, count: equipments.length },
                { key: "template" as const, label: "模板库", icon: <Copy size={13} />, count: templateStats.length },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                    activeTab === tab.key
                      ? "bg-white text-admin-primary shadow-sm"
                      : "text-admin-muted hover:text-admin-text"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      activeTab === tab.key ? "bg-blue-100 text-admin-primary" : "bg-gray-200 text-admin-muted"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
            {activeTab === "instance" && (
              <div className="flex items-center gap-2">
                <button
                  className="btn-default text-xs flex items-center gap-1"
                  onClick={handleCopyTemplate}
                  disabled={!selectedEquip}
                >
                  <Copy size={12} /> 套用{selectedEquip?.type || "对应"}类型模板
                </button>
                <button className="btn-default text-xs flex items-center gap-1" onClick={handleAddRow} disabled={!selectedEquip}>
                  <Plus size={12} /> 新增行
                </button>
                <button className="btn-default text-xs flex items-center gap-1" onClick={handleDeleteRows} disabled={!selectedEquip}>
                  <Minus size={12} /> 删除行
                </button>
                <button className="btn-primary text-xs flex items-center gap-1" onClick={handleSave} disabled={!selectedEquip}>
                  <Save size={12} /> 保存
                </button>
                <button className="btn-default text-xs flex items-center gap-1" onClick={() => message.info("打开批量导入窗口")} disabled={!selectedEquip}>
                  <Upload size={12} /> 导入
                </button>
                <button className="btn-default text-xs flex items-center gap-1" onClick={() => message.success(`已导出 ${rows.length} 条属性`)} disabled={!selectedEquip}>
                  <Download size={12} /> 导出
                </button>
              </div>
            )}
          </div>

          {/* 设备属性编辑 */}
          {activeTab === "instance" && (
            <div className="admin-card flex flex-col flex-1 min-h-0">
              <div className="px-4 py-2 border-b border-admin-border flex items-start justify-between gap-3 bg-gray-50">
                <div className="flex-1 min-w-0">
                  {/* 第 1 行：当前范围 */}
                  <div className="flex items-center gap-2 text-[10px] text-admin-muted flex-wrap">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100">
                      <FolderTree size={10} /> 当前范围
                    </span>
                    {selectedNodeInfo ? (
                      <>
                        <span className="font-medium text-admin-text truncate max-w-[300px]">
                          {selectedNodeInfo.name}
                        </span>
                        {selectedNodeInfo.kks && (
                          <span className="font-mono text-admin-muted">{selectedNodeInfo.kks}</span>
                        )}
                        <span className="text-admin-muted">
                          · {selectedNodeInfo.level}级节点 · 范围内共 <span className="font-semibold text-admin-text">{scopedEquipments.length}</span> 台设备
                        </span>
                      </>
                    ) : (
                      <span>
                        全部设备（共 <span className="font-semibold text-admin-text">{scopedEquipments.length}</span> 台，可从左侧结构树筛选）
                      </span>
                    )}
                  </div>
                  {/* 第 2 行：正在编辑 + 设备切换 */}
                  <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                    <h3 className="text-xs font-semibold text-admin-text flex items-center gap-1 flex-shrink-0">
                      <Settings size={12} className="text-admin-primary" />
                      正在编辑属性
                    </h3>
                    {selectedEquip ? (
                      <>
                        {/* 上一台 / 下一台 */}
                        <div className="inline-flex items-center rounded border border-admin-border bg-white overflow-hidden flex-shrink-0">
                          <button
                            className="px-1.5 py-1 text-admin-muted hover:text-admin-primary hover:bg-blue-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                            onClick={goPrevEquip}
                            disabled={scopedEquipments.length < 2}
                            title={`上一台（范围内共 ${scopedEquipments.length} 台）`}
                          >
                            <ChevronLeft size={13} />
                          </button>
                          <span className="px-2 py-1 text-[10px] text-admin-muted border-x border-admin-border bg-gray-50 min-w-[64px] text-center">
                            {selectedIndex >= 0 ? `${selectedIndex + 1} / ${scopedEquipments.length}` : `- / ${scopedEquipments.length}`}
                          </span>
                          <button
                            className="px-1.5 py-1 text-admin-muted hover:text-admin-primary hover:bg-blue-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                            onClick={goNextEquip}
                            disabled={scopedEquipments.length < 2}
                            title={`下一台（范围内共 ${scopedEquipments.length} 台）`}
                          >
                            <ChevronRight size={13} />
                          </button>
                        </div>
                        {/* 设备选择下拉 */}
                        <div className="relative group/equip-picker flex-1 min-w-[220px] max-w-[460px]">
                          <div className="flex items-center gap-2 px-2 py-1 rounded border border-admin-border bg-white hover:border-blue-300 cursor-pointer transition-colors">
                            <span className="font-mono text-[11px] text-admin-primary font-medium whitespace-nowrap">
                              {selectedEquip.code}
                            </span>
                            <span className="text-admin-text text-[11px] font-medium truncate">
                              {selectedEquip.name}
                            </span>
                            <Tag color="cyan" className="ml-auto flex-shrink-0">{selectedEquip.type}类型</Tag>
                            <ChevronDown size={12} className="text-admin-muted flex-shrink-0" />
                          </div>
                          {/* 下拉面板 */}
                          <div className="hidden group-hover/equip-picker:flex absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-admin-border rounded shadow-lg flex-col overflow-hidden">
                            <div className="px-2 py-1.5 border-b border-admin-border bg-gray-50 flex items-center gap-1.5">
                              <Search size={11} className="text-admin-muted flex-shrink-0" />
                              <input
                                className="flex-1 min-w-0 text-[11px] px-1 py-0.5 border border-admin-border rounded focus:outline-none focus:border-blue-400"
                                placeholder="按编码 / 名称 / 类型快速搜索当前范围..."
                                value={scopeKeyword}
                                onChange={(e) => setScopeKeyword(e.target.value)}
                              />
                              {scopeKeyword && (
                                <button
                                  className="text-[10px] text-admin-muted hover:text-admin-text px-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setScopeKeyword("");
                                  }}
                                >
                                  清空
                                </button>
                              )}
                            </div>
                            <div className="max-h-[220px] overflow-y-auto">
                              {scopedPickerOptions.length === 0 ? (
                                <div className="text-center text-[11px] text-admin-muted py-6">没有匹配的设备</div>
                              ) : (
                                scopedPickerOptions.map((e, idx) => {
                                  const full = flattenTemplate(e.type).length;
                                  const statsAll = typeCoverage.find((c) => c.type === e.type);
                                  const rate = statsAll?.rate ?? Math.round(((full > 0 ? full - 1 : 0) / Math.max(1, full)) * 100);
                                  const active = e.id === selectedEquip.id;
                                  return (
                                    <div
                                      key={e.id}
                                      className={`flex items-center gap-2 px-2 py-1.5 text-[11px] cursor-pointer border-b border-gray-100 last:border-0 ${
                                        active ? "bg-blue-50 text-admin-primary" : "hover:bg-blue-50/50 text-admin-text"
                                      }`}
                                      onMouseDown={(evt) => evt.preventDefault()}
                                      onClick={() => handleSelect(e.id)}
                                    >
                                      <span className="w-6 flex-shrink-0 text-[10px] text-admin-muted text-center">{idx + 1}</span>
                                      <span className="font-mono text-admin-muted whitespace-nowrap w-[110px] truncate">{e.code}</span>
                                      <span className="font-medium truncate flex-1 min-w-0">{e.name}</span>
                                      <Tag color={rate >= 80 ? "green" : rate >= 50 ? "yellow" : "red"} className="flex-shrink-0">
                                        {rate}%
                                      </Tag>
                                      <Tag color="blue" className="flex-shrink-0">{e.type}</Tag>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] text-admin-muted flex-shrink-0">
                          共 <span className="font-semibold text-admin-text">{rows.length}</span> 项属性
                        </span>
                      </>
                    ) : (
                      <span className="text-[11px] text-admin-muted">（当前范围无设备）</span>
                    )}
                  </div>
                  {/* 第 3 行：提示 */}
                  {selectedEquip && (
                    <div className="text-[10px] text-admin-muted mt-1">
                      💡 非末级节点按子树范围过滤设备；属性始终针对单台设备填写 · 点「套用{selectedEquip.type}类型模板」可自动导入 {flattenTemplate(selectedEquip.type).length} 项标准属性清单
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-auto">
                <table className="w-full text-xs" style={{ minWidth: "760px" }}>
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="w-10 px-2 py-3 text-center border-b border-admin-border">
                        <input type="checkbox" checked={allChecked} onChange={(e) => toggleAll(e.target.checked)} disabled={!selectedEquip} />
                      </th>
                      <th className="px-3 py-3 text-left font-medium text-admin-muted border-b border-admin-border w-48">属性名称</th>
                      <th className="px-3 py-3 text-left font-medium text-admin-muted border-b border-admin-border w-56">属性值</th>
                      <th className="px-3 py-3 text-left font-medium text-admin-muted border-b border-admin-border w-28">属性类型</th>
                      <th className="px-3 py-3 text-left font-medium text-admin-muted border-b border-admin-border w-24">单位</th>
                      <th className="px-3 py-3 text-left font-medium text-admin-muted border-b border-admin-border w-16">必填</th>
                      <th className="px-3 py-3 text-left font-medium text-admin-muted border-b border-admin-border">备注</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-16 text-admin-muted">
                          {selectedEquip ? (
                            <div className="space-y-2">
                              <div>暂无属性数据，可点击上方「套用{selectedEquip.type}类型模板」一键生成 {flattenTemplate(selectedEquip.type).length} 项标准属性</div>
                              <div className="text-xs">（也可手动点「新增行」一条条添加）</div>
                            </div>
                          ) : "请先选择设备以加载属性"}
                        </td>
                      </tr>
                    ) : (
                      rows.map((row) => (
                        <tr
                          key={row.id}
                          className={`border-b border-admin-border hover:bg-blue-50/50 ${selectedRowKeys.includes(row.id) ? "bg-blue-50" : ""}`}
                        >
                          <td className="w-10 px-2 py-2 text-center">
                            <input type="checkbox" checked={selectedRowKeys.includes(row.id)} onChange={(e) => toggleRow(row.id, e.target.checked)} />
                          </td>
                          <td className="px-3 py-2">
                            <input className="input-base text-xs" value={row.name} onChange={(e) => updateRow(row.id, { name: e.target.value })} />
                          </td>
                          <td className="px-3 py-2">
                            <input className="input-base text-xs" value={row.value} onChange={(e) => updateRow(row.id, { value: e.target.value })} />
                          </td>
                          <td className="px-3 py-2">
                            <select className="input-base text-xs" value={row.type} onChange={(e) => updateRow(row.id, { type: e.target.value as AttrRow["type"] })}>
                              {typeOptions.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <input className="input-base text-xs" value={row.unit || ""} onChange={(e) => updateRow(row.id, { unit: e.target.value })} />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input type="checkbox" checked={!!row.required} onChange={(e) => updateRow(row.id, { required: e.target.checked })} />
                          </td>
                          <td className="px-3 py-2">
                            <input className="input-base text-xs" value={row.remark || ""} onChange={(e) => updateRow(row.id, { remark: e.target.value })} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 模板库 */}
          {activeTab === "template" && (
            <div className="admin-card flex flex-col flex-1 min-h-0">
              <div className="px-4 py-2 border-b border-admin-border bg-gray-50">
                <h3 className="text-xs font-medium text-admin-text">
                  属性模板库
                  <span className="ml-2 text-admin-muted font-normal text-xs">
                    （共 {templateStats.length} 个设备类型模板）
                  </span>
                </h3>
                <div className="text-[10px] text-admin-muted mt-1">
                  💅 按设备类型预定义标准属性清单 · 点击卡片可查看完整列表 · 点击「编辑模板」可修改属性项
                </div>
              </div>
              <div className="flex-1 overflow-auto p-3">
                <div className="grid grid-cols-2 gap-3">
                  {templateStats.map((stat) => {
                    const flat = flattenTemplate(stat.type);
                    const displayCount = Math.min(flat.length, 6);
                    const equipCount = equipments.filter(
                      (e) =>
                        e.type === stat.type ||
                        (stat.type === "水泵水轮机" && e.type === "导水机构") ||
                        (stat.type === "进水阀" && e.type === "主进水阀") ||
                        (stat.type === "主变压器" && e.type === "变压器") ||
                        (stat.type === "电气二次盘柜" && e.type === "控制屏柜") ||
                        (stat.type === "滤水器" && e.type === "滤水器/热交换器")
                    ).length;
                    return (
                      <div key={stat.type} className="border border-admin-border rounded-lg p-3 hover:shadow-md transition-shadow bg-white">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Tag color="blue">{stat.type}</Tag>
                            <span className="text-xs text-admin-muted">{stat.count} 项属性</span>
                          </div>
                          {equipCount > 0 && (
                            <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                              ● {equipCount}台在用
                            </span>
                          )}
                        </div>
                        <div className="border border-admin-border rounded overflow-hidden">
                          <table className="w-full text-xs">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-2 py-1 text-left font-medium text-admin-muted w-2/3">属性名</th>
                                <th className="px-2 py-1 text-left font-medium text-admin-muted">单位</th>
                              </tr>
                            </thead>
                            <tbody>
                              {flat.slice(0, displayCount).map((attr, idx) => (
                                <tr key={idx} className={idx % 2 === 1 ? "bg-gray-50/50" : ""}>
                                  <td className="px-2 py-1 text-admin-text">{attr.name}</td>
                                  <td className="px-2 py-1 text-admin-muted font-mono">{attr.unit || "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {flat.length > 6 && (
                          <button
                            className="text-xs text-blue-500 mt-1 flex items-center gap-0.5 hover:underline"
                            onClick={() => setPreviewTemplate(stat.type)}
                          >
                            <ChevronRight size={11} /> 更多属性（{flat.length - 6}项）
                          </button>
                        )}
                        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-admin-border">
                          <button
                            className="btn-link text-xs flex items-center gap-1"
                            onClick={() => handleOpenTemplateEditor(stat.type)}
                          >
                            <Edit3 size={11} /> 编辑模板
                          </button>
                          <button
                            className="btn-link text-xs flex items-center gap-1"
                            onClick={() => message.success(`已复制 ${stat.type} 模板`)}
                          >
                            <Copy size={11} /> 复制
                          </button>
                          <button
                            className="btn-link text-xs flex items-center gap-1 ml-auto text-red-500"
                            onClick={() => message.warning(`确认删除 ${stat.type} 模板？`)}
                          >
                            <Trash2 size={11} /> 删除
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 右侧：三个统计卡片（三栏等高，与中间内容同高） */}
        <div className="w-[300px] flex-shrink-0 flex flex-col gap-3 min-h-0">
          {/* 统计1：设备属性完整度 */}
          <div className="admin-card flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="px-3 py-2 border-b border-admin-border flex items-center gap-1 bg-gray-50 flex-shrink-0">
              <TrendingUp size={13} className="text-admin-primary" />
              <h3 className="text-xs font-medium text-admin-text">设备属性完整度</h3>
            </div>
            <div className="flex-1 min-h-0 flex items-center px-2">
              <div style={{ width: 130, height: "100%", minHeight: 100, maxHeight: 160 }}>
                <ReactECharts option={completenessChart} style={{ height: "100%", width: "100%" }} />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-1.5">
                  <CheckCircle size={12} className="text-green-500" />
                  <span className="text-xs text-admin-muted">完整</span>
                  <span className="text-xs font-semibold text-green-600 ml-auto">{completenessStats.complete}台</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <AlertCircle size={12} className="text-amber-500" />
                  <span className="text-xs text-admin-muted">部分</span>
                  <span className="text-xs font-semibold text-amber-600 ml-auto">{completenessStats.partial}台</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <XCircle size={12} className="text-red-500" />
                  <span className="text-xs text-admin-muted">未填</span>
                  <span className="text-xs font-semibold text-red-600 ml-auto">{completenessStats.incomplete}台</span>
                </div>
              </div>
            </div>
          </div>

          {/* 统计2：属性缺失设备TOP10 */}
          <div className="admin-card flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="px-3 py-2 border-b border-admin-border flex items-center justify-between bg-gray-50 flex-shrink-0">
              <div className="flex items-center gap-1">
                <AlertCircle size={13} className="text-red-500" />
                <h3 className="text-xs font-medium text-admin-text">属性缺失TOP10</h3>
              </div>
              <span className="text-[10px] text-admin-muted">按缺失数降序</span>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-2 py-1">
              {missingTop10.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-xs text-admin-muted">
                  <CheckCircle size={20} className="text-green-500 mb-1" />
                  所有设备属性已填完
                </div>
              ) : (
                <div className="space-y-1">
                  {missingTop10.map((eq, idx) => (
                    <div
                      key={eq.id}
                      className="flex items-center gap-1.5 px-1.5 py-1.5 rounded hover:bg-blue-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedId(eq.id)}
                    >
                      <span
                        className={`w-4 h-4 text-[10px] font-bold flex items-center justify-center rounded ${
                          idx < 3 ? "bg-red-500 text-white" : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-xs text-admin-text truncate flex-1">{eq.name}</span>
                      <span className="text-[10px] text-admin-muted">
                        {eq.filled}/{eq.total}
                      </span>
                      <ChevronRight size={10} className="text-admin-muted" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 统计3：各设备类型属性覆盖率 */}
          <div className="admin-card flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="px-3 py-2 border-b border-admin-border flex items-center gap-1 bg-gray-50 flex-shrink-0">
              <BarChart3 size={13} className="text-admin-primary" />
              <h3 className="text-xs font-medium text-admin-text">各类型属性覆盖率</h3>
            </div>
            <div className="flex-1 min-h-0 px-1 py-1">
              <ReactECharts option={coverageChart} style={{ height: "100%", width: "100%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* 模板编辑弹窗 */}
      <Modal
        open={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        title={`编辑「${editingTemplate}」属性模板`}
        width={720}
        footer={
          <>
            <button className="btn-default" onClick={() => setTemplateModalOpen(false)}>
              取消
            </button>
            <button className="btn-primary" onClick={handleSaveTemplate}>
              保存模板
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="text-xs text-admin-muted bg-blue-50 p-2 rounded border border-blue-100">
            💡 属性模板定义了该类设备的标准属性清单（不含具体数值）。共 <span className="font-semibold text-admin-text">{templateAttrs.length}</span> 项属性。
          </div>

          {/* 属性列表 */}
          <div className="border border-admin-border rounded overflow-hidden">
            <div className="flex items-center justify-between bg-gray-50 px-3 py-2 border-b border-admin-border">
              <span className="text-xs font-medium text-admin-text">属性项列表</span>
              <button className="btn-primary text-xs flex items-center gap-1" onClick={handleAddTemplateAttr}>
                <Plus size={12} /> 新增属性
              </button>
            </div>
            <table className="w-full text-xs">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-2 py-2 text-left font-medium text-admin-muted w-32">属性名称 *</th>
                  <th className="px-2 py-2 text-left font-medium text-admin-muted w-32">英文标识</th>
                  <th className="px-2 py-2 text-left font-medium text-admin-muted w-20">类型</th>
                  <th className="px-2 py-2 text-left font-medium text-admin-muted w-20">单位</th>
                  <th className="px-2 py-2 text-left font-medium text-admin-muted w-20">默认值</th>
                  <th className="px-2 py-2 text-center font-medium text-admin-muted w-12">操作</th>
                </tr>
              </thead>
              <tbody>
                {templateAttrs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-admin-muted">
                      暂无属性，点击「新增属性」添加
                    </td>
                  </tr>
                ) : (
                  templateAttrs.map((attr, idx) => (
                    <tr key={idx} className="border-b border-admin-border last:border-b-0">
                      <td className="px-2 py-1.5">
                        <input
                          className="input-base text-xs"
                          value={attr.name}
                          placeholder="属性名称"
                          onChange={(e) => handleUpdateTemplateAttr(idx, { name: e.target.value })}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          className="input-base text-xs"
                          value={attr.enName}
                          placeholder="英文标识"
                          onChange={(e) => handleUpdateTemplateAttr(idx, { enName: e.target.value })}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <select
                          className="input-base text-xs"
                          value={attr.type}
                          onChange={(e) => handleUpdateTemplateAttr(idx, { type: e.target.value })}
                        >
                          <option value="String">文本</option>
                          <option value="Integer">整数</option>
                          <option value="Float">浮点数</option>
                          <option value="Date">日期</option>
                          <option value="Boolean">布尔</option>
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          className="input-base text-xs"
                          value={attr.unit}
                          placeholder="单位"
                          onChange={(e) => handleUpdateTemplateAttr(idx, { unit: e.target.value })}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          className="input-base text-xs"
                          value={attr.defaultValue}
                          placeholder="默认值"
                          onChange={(e) => handleUpdateTemplateAttr(idx, { defaultValue: e.target.value })}
                        />
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <button
                          className="text-red-500 hover:text-red-600 p-1"
                          onClick={() => handleDeleteTemplateAttr(idx)}
                          title="删除"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* 套用模板合并弹窗 */}
      <Modal
        open={mergeModalOpen}
        onClose={() => setMergeModalOpen(false)}
        title={`套用「${selectedEquip?.type || ""}」属性模板`}
        width={520}
        footer={
          <>
            <button className="btn-default" onClick={() => setMergeModalOpen(false)}>
              取消
            </button>
            <button
              className="btn-default text-amber-600 border-amber-300 hover:bg-amber-50"
              onClick={() => {
                const template = flattenTemplate(selectedEquip!.type);
                doApplyTemplate(template, false);
              }}
            >
              覆盖现有属性
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                const template = flattenTemplate(selectedEquip!.type);
                doApplyTemplate(template, true);
              }}
            >
              智能合并（推荐）
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="text-xs text-admin-muted bg-amber-50 p-3 rounded border border-amber-200">
            ⚠️ 检测到当前设备已有 <span className="font-semibold text-amber-700">{rows.filter((r) => r.value.trim() !== "").length}</span> 项填好的属性值。
            请选择套用方式：
          </div>

          <div className="space-y-2">
            <div className="border border-green-200 bg-green-50 rounded p-3">
              <div className="flex items-center gap-1.5 text-sm font-medium text-green-700 mb-1">
                <CheckCircle size={14} /> 智能合并（推荐）
              </div>
              <div className="text-xs text-admin-muted leading-relaxed">
                保留已填好的属性值不变，新增模板中有但当前缺失的属性项。<br />
                适合已有部分填写、需要补齐标准属性清单的场景。
              </div>
            </div>

            <div className="border border-red-200 bg-red-50 rounded p-3">
              <div className="flex items-center gap-1.5 text-sm font-medium text-red-700 mb-1">
                <AlertCircle size={14} /> 覆盖现有属性
              </div>
              <div className="text-xs text-admin-muted leading-relaxed">
                清空所有已有属性值，用模板全量替换。<br />
                <span className="text-red-600">⚠ 已填好的值将会丢失！</span>
              </div>
            </div>
          </div>

          {selectedEquip && (
            <div className="text-[11px] text-admin-muted bg-gray-50 p-2 rounded border border-admin-border">
              模板包含 <span className="font-semibold">{flattenTemplate(selectedEquip.type).length}</span> 项标准属性 ·
              当前有 <span className="font-semibold">{rows.length}</span> 项属性（其中{" "}
              <span className="font-semibold text-green-600">{rows.filter((r) => r.value.trim() !== "").length}</span> 项已填值）
            </div>
          )}
        </div>
      </Modal>

      {/* 模板属性预览弹窗 */}
      <Modal
        open={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        title={previewTemplate ? `${previewTemplate} - 全部属性预览` : "属性预览"}
        width={560}
        footer={
          <>
            <button className="btn-default" onClick={() => setPreviewTemplate(null)}>
              关闭
            </button>
            {previewTemplate && (
              <button
                className="btn-primary"
                onClick={() => {
                  handleOpenTemplateEditor(previewTemplate);
                  setPreviewTemplate(null);
                }}
              >
                编辑模板
              </button>
            )}
          </>
        }
      >
        {previewTemplate && (
          <div className="space-y-2">
            <div className="text-xs text-admin-muted bg-blue-50 p-2 rounded border border-blue-100">
              💡 共 <span className="font-semibold text-admin-text">{flattenTemplate(previewTemplate).length}</span> 项标准属性。点击「编辑模板」可修改。
            </div>
            <div className="border border-admin-border rounded overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-left font-medium text-admin-muted w-12">#</th>
                    <th className="px-2 py-2 text-left font-medium text-admin-muted">属性名称</th>
                    <th className="px-2 py-2 text-left font-medium text-admin-muted">英文标识</th>
                    <th className="px-2 py-2 text-left font-medium text-admin-muted">类型</th>
                    <th className="px-2 py-2 text-left font-medium text-admin-muted">单位</th>
                    <th className="px-2 py-2 text-left font-medium text-admin-muted">分类</th>
                  </tr>
                </thead>
                <tbody>
                  {flattenTemplate(previewTemplate).map((attr, idx) => (
                    <tr key={idx} className={idx % 2 === 1 ? "bg-gray-50/50" : "border-t border-admin-border"}>
                      <td className="px-2 py-1.5 text-admin-muted">{idx + 1}</td>
                      <td className="px-2 py-1.5 text-admin-text">{attr.name}</td>
                      <td className="px-2 py-1.5 text-admin-muted font-mono">{attr.enName || "-"}</td>
                      <td className="px-2 py-1.5 text-admin-muted">{attr.type || "text"}</td>
                      <td className="px-2 py-1.5 text-admin-muted font-mono">{attr.unit || "-"}</td>
                      <td className="px-2 py-1.5 text-admin-muted">{attr.category || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
