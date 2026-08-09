import { useState, useMemo, useEffect } from "react";
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
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  FolderTree,
  Edit3,
  Trash2,
  X,
  AlertCircle,
  CheckCircle,
  Search,
} from "lucide-react";
import { pipelines } from "@/mock";
import type { Pipeline } from "@/types";
import { Tag } from "@/components/common/Tag";
import { message } from "@/components/common/Message";
import { Modal } from "@/components/common/Modal";
import StructureTreeSelect, { type TreeSelectFilter } from "@/components/common/StructureTreeSelect";
import { buildStructureTree, findNode, type TreeNode } from "@/mock/structureTree";

const pipelineAttrTemplates: Record<string, { name: string; unit?: string }[]> = {
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
    { name: "制造厂家" },
    { name: "防腐等级" },
    { name: "保温材料" },
  ],
  技术供水管路: [
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
    { name: "制造厂家" },
    { name: "防腐等级" },
  ],
  冷却水管路: [
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
    { name: "安装日期" },
  ],
  排水管路: [
    { name: "管路编码" },
    { name: "管路名称" },
    { name: "KKS编码" },
    { name: "公称直径(DN)", unit: "mm" },
    { name: "壁厚", unit: "mm" },
    { name: "材质" },
    { name: "介质类型" },
    { name: "长度", unit: "m" },
    { name: "坡度" },
    { name: "安装日期" },
  ],
  供油管路: [
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
    { name: "防腐等级" },
    { name: "安装日期" },
  ],
  消防水管路: [
    { name: "管路编码" },
    { name: "管路名称" },
    { name: "KKS编码" },
    { name: "公称直径(DN)", unit: "mm" },
    { name: "壁厚", unit: "mm" },
    { name: "材质" },
    { name: "设计压力", unit: "MPa" },
    { name: "介质类型" },
    { name: "长度", unit: "m" },
    { name: "安装日期" },
  ],
  压力管: [
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
  循环管: [
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
  ],
  分支管路: [
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
    { name: "安装日期" },
  ],
  设备连接管: [
    { name: "管路编码" },
    { name: "管路名称" },
    { name: "公称直径(DN)", unit: "mm" },
    { name: "材质" },
    { name: "长度", unit: "m" },
    { name: "连接设备" },
    { name: "接口形式" },
  ],
};

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

let rowIdSeed = 2000;
const nextId = () => ++rowIdSeed;

export default function PipelineAttribute() {
  const [selectedId, setSelectedId] = useState<number | null>(
    pipelines.length > 0 ? pipelines[0].id : null
  );
  const [rows, setRows] = useState<AttrRow[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<"instance" | "template">("instance");

  // 结构树选中的节点ID及对应KKS筛选集合
  // - kksPrefixes：分组/目录节点（含集合父节点）用前缀范围过滤
  // - kksExactCodes：真正末级叶子管路（无children + category=pipeline）用精确匹配，防止同前缀长码误含入
  const [treeNodeId, setTreeNodeId] = useState<number | undefined>(undefined);
  const [kksPrefixes, setKksPrefixes] = useState<string[] | null>(null);
  const [kksExactCodes, setKksExactCodes] = useState<string[] | null>(null);
  const tree = useMemo(() => buildStructureTree("pipeline"), []);

  // 模板编辑弹窗
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<string>("");
  const [templateAttrs, setTemplateAttrs] = useState<{ name: string; unit: string }[]>([]);

  // 模板预览弹窗
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);

  // 套用模板合并弹窗
  const [mergeModalOpen, setMergeModalOpen] = useState(false);

  // 收集选中节点及后代KKS前缀
  const collectPrefixes = (rootNode: TreeNode): string[] => {
    const result: string[] = [];
    const walk = (n: TreeNode) => {
      if (n.kks && n.kks.trim()) result.push(n.kks.toUpperCase());
      if (n.children) n.children.forEach(walk);
    };
    walk(rootNode);
    return result;
  };

  // 按当前KKS范围过滤后的管路列表
  // 优先级：精确匹配集合（末级叶子管路用）> 前缀范围集合（目录/集合父节点用）
  const scopedPipelines = useMemo(() => {
    if ((!kksPrefixes || kksPrefixes.length === 0) && (!kksExactCodes || kksExactCodes.length === 0))
      return pipelines;
    return pipelines.filter((p) => {
      const code = p.code.toUpperCase();
      if (kksExactCodes && kksExactCodes.length > 0) return kksExactCodes.includes(code);
      return kksPrefixes?.some((prefix) => code.startsWith(prefix)) ?? true;
    });
  }, [kksPrefixes, kksExactCodes]);

  const selectedPipe = scopedPipelines.find((p) => p.id === selectedId) || scopedPipelines[0] || null;
  const selectedIndex = useMemo(
    () => scopedPipelines.findIndex((p) => p.id === selectedPipe?.id),
    [scopedPipelines, selectedPipe]
  );
  const [scopeKeyword, setScopeKeyword] = useState("");
  const scopedPickerOptions = useMemo(() => {
    const kw = scopeKeyword.trim().toUpperCase();
    if (!kw) return scopedPipelines;
    return scopedPipelines.filter(
      (p) =>
        p.code.toUpperCase().includes(kw) ||
        p.name.toUpperCase().includes(kw) ||
        (p.usage && p.usage.toUpperCase().includes(kw))
    );
  }, [scopedPipelines, scopeKeyword]);

  const goPrevPipe = () => {
    if (scopedPipelines.length < 2) return;
    const idx = selectedIndex < 0 ? 0 : (selectedIndex - 1 + scopedPipelines.length) % scopedPipelines.length;
    const target = scopedPipelines[idx];
    if (target) handleSelect(target.id);
  };
  const goNextPipe = () => {
    if (scopedPipelines.length < 2) return;
    const idx = selectedIndex < 0 ? 0 : (selectedIndex + 1) % scopedPipelines.length;
    const target = scopedPipelines[idx];
    if (target) handleSelect(target.id);
  };
  const selectedNodeInfo = useMemo(() => {
    if (!treeNodeId) return null;
    const node = findNode(tree, treeNodeId);
    return node ? { name: node.name, kks: node.kks, level: node.level } : null;
  }, [tree, treeNodeId]);

  // 判断当前选中节点是否"末级叶子管路"（无子节点 + category=pipeline）
  const isLeafPipelineNode = (node: TreeNode | null): boolean => {
    if (!node) return false;
    const hasChildren = !!node.children && node.children.length > 0;
    return !hasChildren && node.category === "pipeline";
  };

  // 点击任意节点：
  // - 末级叶子管路 → 精确匹配 code===kks（范围严格=1条）
  // - 非末级（目录节点 / 有子节点的集合父节点）→ 按后代KKS前缀范围过滤
  const handleTreeSelect = (filter: TreeSelectFilter) => {
    setScopeKeyword("");
    setTreeNodeId(filter.nodeId);
    const node = findNode(tree, filter.nodeId);
    const leaf = isLeafPipelineNode(node);
    const selectedKks = filter.kks.toUpperCase();
    if (leaf) {
      setKksExactCodes([selectedKks]);
      setKksPrefixes(null);
      const exact = pipelines.find((p) => p.code.toUpperCase() === selectedKks);
      if (exact) {
        handleSelect(exact.id);
        return;
      }
      // 末级节点KKS找不到精确对应（数据偏差时）→ 范围空
      setSelectedId(null);
      setRows([]);
      setSelectedRowKeys([]);
      return;
    }
    // 非末级：前缀范围过滤
    setKksExactCodes(null);
    const prefixes = node ? collectPrefixes(node) : [selectedKks];
    setKksPrefixes(prefixes.length > 0 ? prefixes : null);
    let target: Pipeline | undefined = pipelines.find((p) => p.code.toUpperCase() === selectedKks);
    if (!target) {
      const scope =
        prefixes.length === 0
          ? pipelines
          : pipelines.filter((p) => prefixes.some((prefix) => p.code.toUpperCase().startsWith(prefix)));
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
    if (pipelines.length > 0) handleSelect(pipelines[0].id);
  };

  const getPipeAttrValue = (pipe: Pipeline, attrName: string): string => {
    const map: Record<string, any> = {
      "管路编码": pipe.code,
      "管路名称": pipe.name,
      "KKS编码": pipe.code,
      "公称直径(DN)": pipe.dn,
      "壁厚": pipe.wallThickness,
      "材质": pipe.material,
      "设计压力": pipe.designPressure,
      "设计温度": pipe.designTemperature,
      "介质类型": pipe.medium,
      "长度": pipe.length,
      "安装日期": pipe.installDate,
      "起点设备": pipe.startDevice,
      "终点设备": pipe.endDevice,
    };
    const v = map[attrName];
    return v !== undefined && v !== null ? String(v) : "";
  };

  const handleSelect = (id: number) => {
    const pipe = pipelines.find((p) => p.id === id);
    if (!pipe) return;
    setSelectedId(id);
    const template = pipelineAttrTemplates[pipe.usage] || pipelineAttrTemplates["主管路"];
    setRows(
      template.map((t) => ({
        id: nextId(),
        name: t.name,
        value: getPipeAttrValue(pipe, t.name),
        type: t.unit && /直径|壁厚|压力|温度|长度|DN/.test(t.name) ? ("number" as const) : ("text" as const),
        unit: t.unit,
        required: false,
        remark: "",
      }))
    );
    setSelectedRowKeys([]);
  };

  useEffect(() => {
    if (pipelines.length > 0) handleSelect(pipelines[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateRow = (id: number, patch: Partial<AttrRow>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const handleAddRow = () => {
    setRows([...rows, { id: nextId(), name: "", value: "", type: "text", unit: "", required: false, remark: "" }]);
  };

  const handleDeleteRows = () => {
    if (selectedRowKeys.length === 0) return message.warning("请先选择要删除的行");
    setRows(rows.filter((r) => !selectedRowKeys.includes(r.id)));
    setSelectedRowKeys([]);
    message.success(`已删除 ${selectedRowKeys.length} 行`);
  };

  const handleSave = () => {
    if (!selectedPipe) return message.warning("请先选择管路");
    if (rows.some((r) => !r.name.trim())) return message.warning("存在属性名称为空的行");
    message.success(`已保存 ${selectedPipe.name} 的 ${rows.length} 条属性`);
  };

  const handleCopyTemplate = () => {
    if (!selectedPipe) return message.warning("请先选择管路");
    const template = pipelineAttrTemplates[selectedPipe.usage] || pipelineAttrTemplates["主管路"];
    if (template.length === 0) return message.warning("该管路用途无属性模板");

    const hasValues = rows.some((r) => r.value.trim() !== "");
    if (hasValues && rows.length > 0) {
      setMergeModalOpen(true);
    } else {
      doApplyTemplate(template, false);
    }
  };

  const doApplyTemplate = (
    template: { name: string; unit?: string }[],
    keepExisting: boolean
  ) => {
    if (!keepExisting) {
      setRows(
        template.map((t) => ({
          id: nextId(),
          name: t.name,
          value: selectedPipe ? getPipeAttrValue(selectedPipe, t.name) : "",
          type: t.unit && /直径|壁厚|压力|温度|长度|DN/.test(t.name) ? ("number" as const) : ("text" as const),
          unit: t.unit,
          required: false,
          remark: "",
        }))
      );
      message.success(`已套用 ${selectedPipe?.usage} 模板（${template.length} 项，已覆盖原有属性）`);
    } else {
      const existingMap = new Map(rows.map((r) => [r.name, r]));
      const merged: AttrRow[] = template.map((t) => {
        const ex = existingMap.get(t.name);
        if (ex && ex.value.trim() !== "") {
          return { ...ex, id: nextId(), unit: t.unit || ex.unit };
        }
        return {
          id: nextId(),
          name: t.name,
          value: ex?.value || (selectedPipe ? getPipeAttrValue(selectedPipe, t.name) : ""),
          type: t.unit && /直径|壁厚|压力|温度|长度|DN/.test(t.name) ? ("number" as const) : ("text" as const),
          unit: t.unit,
          required: false,
          remark: ex?.remark || "",
        };
      });
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

  // 打开模板编辑弹窗
  const handleOpenTemplateEditor = (usage: string) => {
    setEditingTemplate(usage);
    const attrs = pipelineAttrTemplates[usage] || [];
    setTemplateAttrs(attrs.map((a) => ({ name: a.name, unit: a.unit || "" })));
    setTemplateModalOpen(true);
  };

  const handleAddTemplateAttr = () => {
    setTemplateAttrs((prev) => [...prev, { name: "", unit: "" }]);
  };

  const handleDeleteTemplateAttr = (index: number) => {
    setTemplateAttrs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateTemplateAttr = (index: number, patch: { name?: string; unit?: string }) => {
    setTemplateAttrs((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const handleSaveTemplate = () => {
    if (templateAttrs.some((a) => !a.name.trim())) {
      return message.warning("存在属性名称为空的项");
    }
    message.success(`已保存 ${editingTemplate} 模板（${templateAttrs.length} 项属性）`);
    setTemplateModalOpen(false);
  };

  const templateStats = useMemo(() => {
    return Object.keys(pipelineAttrTemplates).map((usage) => ({
      usage,
      count: pipelineAttrTemplates[usage]?.length || 0,
    }));
  }, []);

  // ============ 右侧统计（模拟数据） ============

  const simulatedPipeStats = useMemo(() => {
    const seeded = (seed: number) => {
      const x = Math.sin(seed * 9301 + 49297) * 233280;
      return x - Math.floor(x);
    };
    return scopedPipelines.map((p, idx) => {
      const template = pipelineAttrTemplates[p.usage] || pipelineAttrTemplates["主管路"] || [];
      const total = template.length;
      const rate = 0.25 + seeded(p.id * 11 + idx) * 0.75;
      const filled = Math.round(total * rate);
      return { ...p, total, filled, missing: Math.max(0, total - filled) };
    });
  }, [scopedPipelines]);

  const completenessStats = useMemo(() => {
    let complete = 0;
    let partial = 0;
    let incomplete = 0;
    simulatedPipeStats.forEach((p) => {
      if (p.total === 0) incomplete++;
      else if (p.filled >= p.total) complete++;
      else if (p.filled > 0) partial++;
      else incomplete++;
    });
    return { complete, partial, incomplete, total: scopedPipelines.length };
  }, [simulatedPipeStats, scopedPipelines]);

  const completenessChart = useMemo(
    () => ({
      tooltip: { trigger: "item", formatter: "{b}: {c}条 ({d}%)" },
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
          type: "text", left: "center", top: "38%",
          style: { text: `${completenessStats.total}`, fontSize: 22, fontWeight: "bold", fill: "#1f2937" },
        },
        {
          type: "text", left: "center", top: "54%",
          style: { text: "管路总数", fontSize: 10, fill: "#6b7280" },
        },
      ],
    }),
    [completenessStats]
  );

  const missingTop10 = useMemo(() => {
    return simulatedPipeStats
      .filter((p) => p.missing > 0)
      .sort((a, b) => b.missing - a.missing)
      .slice(0, 10);
  }, [simulatedPipeStats]);

  const usageCoverage = useMemo(() => {
    const usageMap = new Map<string, { total: number; filled: number }>();
    simulatedPipeStats.forEach((p) => {
      const key = pipelineAttrTemplates[p.usage] ? p.usage : "主管路";
      if (!usageMap.has(key)) usageMap.set(key, { total: 0, filled: 0 });
      const entry = usageMap.get(key)!;
      entry.total++;
      if (p.total > 0 && p.filled >= p.total) entry.filled++;
    });
    // 补齐模板库中的所有用途类型（保证覆盖率图表类型丰富）
    const seededRate = (seedStr: string) => {
      let seed = 0;
      for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
      const x = Math.sin(seed * 9301 + 49297) * 233280;
      return x - Math.floor(x);
    };
    Object.keys(pipelineAttrTemplates).forEach((u) => {
      if (!usageMap.has(u)) {
        const mockTotal = 2 + Math.round(seededRate(u + "pipe_total") * 6);
        const rate = 0.25 + seededRate(u + "pipe_rate") * 0.73;
        const mockFilled = Math.round(mockTotal * rate);
        usageMap.set(u, { total: mockTotal, filled: mockFilled });
      }
    });
    return Array.from(usageMap.entries())
      .map(([usage, v]) => ({
        usage,
        total: v.total,
        filled: v.filled,
        rate: v.total > 0 ? Math.round((v.filled / v.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [simulatedPipeStats]);

  const coverageChart = useMemo(
    () => ({
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      grid: { top: 8, right: 35, bottom: 4, left: 82 },
      xAxis: {
        type: "value",
        max: 100,
        show: false,
      },
      yAxis: {
        type: "category",
        data: usageCoverage.map((u) => u.usage).reverse(),
        axisLabel: { fontSize: 11, color: "#6b7280", width: 75, overflow: "truncate" },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
      },
      series: [
        {
          type: "bar",
          data: usageCoverage.map((u) => u.rate).reverse(),
          itemStyle: {
            color: (params: { value: number }) => {
              const v = params.value;
              if (v >= 80) return { type: "linear", x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: "#10b981" }, { offset: 1, color: "#34d399" }] };
              if (v >= 50) return { type: "linear", x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: "#f59e0b" }, { offset: 1, color: "#fbbf24" }] };
              return { type: "linear", x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: "#ef4444" }, { offset: 1, color: "#f87171" }] };
            },
            borderRadius: [0, 6, 6, 0],
          },
          barWidth: 16,
          label: {
            show: true,
            position: "right",
            fontSize: 11,
            fontWeight: 600,
            color: "#374151",
            formatter: (params: { value: number }) => `${params.value}%`,
          },
          showBackground: true,
          backgroundStyle: { color: "#f3f4f6", borderRadius: [0, 6, 6, 0] },
        },
      ],
    }),
    [usageCoverage]
  );

  return (
    <div className="h-full flex">
      <div className="flex gap-3 flex-1 min-h-0">
        {/* 左侧：结构树 */}
        <div className="w-[280px] flex-shrink-0 admin-card flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-admin-border bg-gray-50 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-admin-text flex items-center gap-1.5">
              <FolderTree size={12} className="text-admin-primary" />
              管路结构树
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
              title="管路结构树"
              treeType="pipeline"
            />
          </div>
          <div className="px-3 py-1.5 border-t border-admin-border bg-gray-50 text-[10px] text-admin-muted">
            💡 点击末级节点（管路）可选中编辑属性
          </div>
        </div>

        {/* 中间：属性编辑区 */}
        <div className="flex-1 min-w-0 flex flex-col gap-3 min-h-0">
          {/* Tab切换 */}
          <div className="flex items-center justify-between flex-shrink-0">
            <div className="inline-flex bg-gray-100 rounded-lg p-0.5">
              {[
                { key: "instance" as const, label: "管路属性", icon: <Settings size={13} />, count: pipelines.length },
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
                <button className="btn-default text-xs flex items-center gap-1" onClick={handleCopyTemplate} disabled={!selectedPipe}>
                  <Copy size={12} /> 套用{selectedPipe?.usage || "对应"}模板
                </button>
                <button className="btn-default text-xs flex items-center gap-1" onClick={handleAddRow} disabled={!selectedPipe}>
                  <Plus size={12} /> 新增行
                </button>
                <button className="btn-default text-xs flex items-center gap-1" onClick={handleDeleteRows} disabled={!selectedPipe}>
                  <Minus size={12} /> 删除行
                </button>
                <button className="btn-primary text-xs flex items-center gap-1" onClick={handleSave} disabled={!selectedPipe}>
                  <Save size={12} /> 保存
                </button>
                <button className="btn-default text-xs flex items-center gap-1" onClick={() => message.info("打开批量导入窗口")} disabled={!selectedPipe}>
                  <Upload size={12} /> 导入
                </button>
                <button className="btn-default text-xs flex items-center gap-1" onClick={() => message.success(`已导出 ${rows.length} 条属性`)} disabled={!selectedPipe}>
                  <Download size={12} /> 导出
                </button>
              </div>
            )}
          </div>

          {/* 管路属性编辑 */}
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
                          · {selectedNodeInfo.level}级节点 · 范围内共 <span className="font-semibold text-admin-text">{scopedPipelines.length}</span> 条管路
                        </span>
                      </>
                    ) : (
                      <span>
                        全部管路（共 <span className="font-semibold text-admin-text">{scopedPipelines.length}</span> 条，可从左侧结构树筛选）
                      </span>
                    )}
                  </div>
                  {/* 第 2 行：正在编辑 + 管路切换 */}
                  <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                    <h3 className="text-xs font-semibold text-admin-text flex items-center gap-1 flex-shrink-0">
                      <Settings size={12} className="text-admin-primary" />
                      正在编辑属性
                    </h3>
                    {selectedPipe ? (
                      <>
                        {/* 上一条 / 下一条 */}
                        <div className="inline-flex items-center rounded border border-admin-border bg-white overflow-hidden flex-shrink-0">
                          <button
                            className="px-1.5 py-1 text-admin-muted hover:text-admin-primary hover:bg-blue-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                            onClick={goPrevPipe}
                            disabled={scopedPipelines.length < 2}
                            title={`上一条（范围内共 ${scopedPipelines.length} 条）`}
                          >
                            <ChevronLeft size={13} />
                          </button>
                          <span className="px-2 py-1 text-[10px] text-admin-muted border-x border-admin-border bg-gray-50 min-w-[64px] text-center">
                            {selectedIndex >= 0 ? `${selectedIndex + 1} / ${scopedPipelines.length}` : `- / ${scopedPipelines.length}`}
                          </span>
                          <button
                            className="px-1.5 py-1 text-admin-muted hover:text-admin-primary hover:bg-blue-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                            onClick={goNextPipe}
                            disabled={scopedPipelines.length < 2}
                            title={`下一条（范围内共 ${scopedPipelines.length} 条）`}
                          >
                            <ChevronRight size={13} />
                          </button>
                        </div>
                        {/* 管路选择下拉 */}
                        <div className="relative group/pipe-picker flex-1 min-w-[220px] max-w-[460px]">
                          <div className="flex items-center gap-2 px-2 py-1 rounded border border-admin-border bg-white hover:border-blue-300 cursor-pointer transition-colors">
                            <span className="font-mono text-[11px] text-admin-primary font-medium whitespace-nowrap">
                              {selectedPipe.code}
                            </span>
                            <span className="text-admin-text text-[11px] font-medium truncate">
                              {selectedPipe.name}
                            </span>
                            <Tag color="cyan" className="ml-auto flex-shrink-0">{selectedPipe.usage}</Tag>
                            <ChevronDown size={12} className="text-admin-muted flex-shrink-0" />
                          </div>
                          {/* 下拉面板 */}
                          <div className="hidden group-hover/pipe-picker:flex absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-admin-border rounded shadow-lg flex-col overflow-hidden">
                            <div className="px-2 py-1.5 border-b border-admin-border bg-gray-50 flex items-center gap-1.5">
                              <Search size={11} className="text-admin-muted flex-shrink-0" />
                              <input
                                className="flex-1 min-w-0 text-[11px] px-1 py-0.5 border border-admin-border rounded focus:outline-none focus:border-blue-400"
                                placeholder="按编码 / 名称 / 用途快速搜索当前范围..."
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
                                <div className="text-center text-[11px] text-admin-muted py-6">没有匹配的管路</div>
                              ) : (
                                scopedPickerOptions.map((p, idx) => {
                                  const full = (pipelineAttrTemplates[p.usage] || pipelineAttrTemplates["主管路"] || []).length;
                                  const statsAll = usageCoverage.find((c) => c.usage === p.usage);
                                  const rate =
                                    statsAll?.rate ??
                                    Math.round(((full > 0 ? full - 1 : 0) / Math.max(1, full)) * 100);
                                  const active = p.id === selectedPipe.id;
                                  return (
                                    <div
                                      key={p.id}
                                      className={`flex items-center gap-2 px-2 py-1.5 text-[11px] cursor-pointer border-b border-gray-100 last:border-0 ${
                                        active ? "bg-blue-50 text-admin-primary" : "hover:bg-blue-50/50 text-admin-text"
                                      }`}
                                      onMouseDown={(evt) => evt.preventDefault()}
                                      onClick={() => handleSelect(p.id)}
                                    >
                                      <span className="w-6 flex-shrink-0 text-[10px] text-admin-muted text-center">{idx + 1}</span>
                                      <span className="font-mono text-admin-muted whitespace-nowrap w-[110px] truncate">{p.code}</span>
                                      <span className="font-medium truncate flex-1 min-w-0">{p.name}</span>
                                      <Tag color={rate >= 80 ? "green" : rate >= 50 ? "yellow" : "red"} className="flex-shrink-0">
                                        {rate}%
                                      </Tag>
                                      <Tag color="blue" className="flex-shrink-0">{p.usage}</Tag>
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
                      <span className="text-[11px] text-admin-muted">（当前范围无管路）</span>
                    )}
                  </div>
                  {/* 第 3 行：提示 */}
                  {selectedPipe && (
                    <div className="text-[10px] text-admin-muted mt-1">
                      💡 非末级节点按子树范围过滤管路；属性始终针对单条管路填写 · 点「套用模板」可自动导入该用途 {(pipelineAttrTemplates[selectedPipe.usage] || pipelineAttrTemplates["主管路"]).length} 项标准属性清单
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-auto">
                <table className="w-full text-xs" style={{ minWidth: "760px" }}>
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="w-10 px-2 py-3 text-center border-b border-admin-border">
                        <input type="checkbox" checked={allChecked} onChange={(e) => toggleAll(e.target.checked)} disabled={!selectedPipe} />
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
                          {selectedPipe ? "暂无属性数据，可点击「套用模板」快速生成" : "请先选择管路以加载属性模板"}
                        </td>
                      </tr>
                    ) : (
                      rows.map((row) => (
                        <tr
                          key={row.id}
                          className={`border-b border-admin-border hover:bg-blue-50/50 ${
                            selectedRowKeys.includes(row.id) ? "bg-blue-50" : ""
                          }`}
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
                  <span className="ml-2 text-admin-muted font-normal text-xs">（按管路用途预定义属性项）</span>
                </h3>
                <div className="text-[10px] text-admin-muted mt-1">
                  💅 按管路用途预定义标准属性清单 · 点击卡片可查看完整列表 · 点击「编辑模板」可修改属性项
                </div>
              </div>
              <div className="flex-1 overflow-auto p-3">
                <div className="grid grid-cols-3 gap-3">
                  {templateStats.map((stat) => {
                    const attrs = pipelineAttrTemplates[stat.usage] || [];
                    const displayCount = Math.min(attrs.length, 6);
                    return (
                      <div key={stat.usage} className="border border-admin-border rounded-lg p-3 hover:shadow-md transition-shadow bg-white">
                        <div className="flex items-center justify-between mb-2">
                          <Tag
                            color={
                              stat.usage === "主管路" ? "blue" : stat.usage === "分支管路" ? "green" : "orange"
                            }
                          >
                            {stat.usage}
                          </Tag>
                          <span className="text-xs text-admin-muted">{stat.count} 项</span>
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
                              {attrs.slice(0, displayCount).map((attr, idx) => (
                                <tr key={idx} className={idx % 2 === 1 ? "bg-gray-50/50" : ""}>
                                  <td className="px-2 py-1 text-admin-text">{attr.name}</td>
                                  <td className="px-2 py-1 text-admin-muted font-mono">{attr.unit || "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {attrs.length > 6 && (
                          <button
                            className="text-xs text-blue-500 mt-1 flex items-center gap-0.5 hover:underline"
                            onClick={() => setPreviewTemplate(stat.usage)}
                          >
                            <ChevronRight size={11} /> 更多属性（{attrs.length - 6}项）
                          </button>
                        )}
                        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-admin-border">
                          <button
                            className="btn-link text-xs flex items-center gap-1"
                            onClick={() => handleOpenTemplateEditor(stat.usage)}
                          >
                            <Edit3 size={11} /> 编辑模板
                          </button>
                          <button
                            className="btn-link text-xs flex items-center gap-1"
                            onClick={() => message.success(`已复制 ${stat.usage} 模板`)}
                          >
                            <Copy size={11} /> 复制
                          </button>
                          <button
                            className="btn-link text-xs flex items-center gap-1 ml-auto text-red-500"
                            onClick={() => message.warning(`确认删除 ${stat.usage} 模板？`)}
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

        {/* 右侧：统计图表 */}
        <div className="w-[300px] flex-shrink-0 flex flex-col gap-3 min-h-0">
          {/* 管路属性完整度 */}
          <div className="admin-card flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="px-3 py-2 border-b border-admin-border flex items-center justify-between bg-gray-50 flex-shrink-0">
              <div className="flex items-center gap-1">
                <BarChart3 size={13} className="text-admin-primary" />
                <h3 className="text-xs font-medium text-admin-text">管路属性完整度</h3>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 flex-1 min-h-0 overflow-auto">
              <div style={{ width: 140, height: "100%", minHeight: 140 }}>
                <ReactECharts option={completenessChart} style={{ height: "100%" }} />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> 完整
                  </span>
                  <span className="font-semibold">{completenessStats.complete}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> 部分
                  </span>
                  <span className="font-semibold">{completenessStats.partial}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500" /> 未填
                  </span>
                  <span className="font-semibold">{completenessStats.incomplete}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 属性缺失 TOP10 */}
          <div className="admin-card flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="px-3 py-2 border-b border-admin-border bg-gray-50 flex-shrink-0">
              <div className="flex items-center gap-1">
                <AlertCircle size={13} className="text-red-500" />
                <h3 className="text-xs font-medium text-admin-text">属性缺失 TOP10</h3>
              </div>
            </div>
            <div className="p-2 space-y-1 overflow-y-auto flex-1 min-h-0">
              {missingTop10.length === 0 ? (
                <div className="text-center text-xs text-admin-muted py-4">暂无缺失</div>
              ) : (
                missingTop10.map((p, idx) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-blue-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedId(p.id)}
                  >
                    <span
                      className={`w-5 h-5 rounded text-[10px] flex items-center justify-center font-medium ${
                        idx < 3 ? "bg-red-100 text-red-600" : "bg-gray-100 text-admin-muted"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-admin-text truncate">{p.name}</div>
                      <div className="text-[10px] text-admin-muted truncate">{p.code} · {p.usage}</div>
                    </div>
                    <span className="text-xs text-red-500 font-medium flex-shrink-0">
                      缺 {p.missing}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 按用途覆盖率 */}
          <div className="admin-card flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="px-3 py-2 border-b border-admin-border bg-gray-50 flex-shrink-0">
              <h3 className="text-xs font-medium text-admin-text">属性覆盖率</h3>
            </div>
            <div className="p-2 flex-1 min-h-0 overflow-hidden">
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
        width={640}
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
            💡 属性模板定义了该类管路的标准属性清单（不含具体数值）。共{" "}
            <span className="font-semibold text-admin-text">{templateAttrs.length}</span> 项属性。
          </div>

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
                  <th className="px-2 py-2 text-left font-medium text-admin-muted w-40">属性名称 *</th>
                  <th className="px-2 py-2 text-left font-medium text-admin-muted w-32">单位</th>
                  <th className="px-2 py-2 text-center font-medium text-admin-muted w-16">操作</th>
                </tr>
              </thead>
              <tbody>
                {templateAttrs.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-admin-muted">
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
                          value={attr.unit}
                          placeholder="单位"
                          onChange={(e) => handleUpdateTemplateAttr(idx, { unit: e.target.value })}
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
        title={`套用「${selectedPipe?.usage || ""}」属性模板`}
        width={520}
        footer={
          <>
            <button className="btn-default" onClick={() => setMergeModalOpen(false)}>
              取消
            </button>
            <button
              className="btn-default text-amber-600 border-amber-300 hover:bg-amber-50"
              onClick={() => {
                const template = pipelineAttrTemplates[selectedPipe!.usage] || pipelineAttrTemplates["主管路"];
                doApplyTemplate(template, false);
              }}
            >
              覆盖现有属性
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                const template = pipelineAttrTemplates[selectedPipe!.usage] || pipelineAttrTemplates["主管路"];
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
            ⚠️ 检测到当前管路已有 <span className="font-semibold text-amber-700">{rows.filter((r) => r.value.trim() !== "").length}</span> 项填好的属性值。
            请选择套用方式：
          </div>

          <div className="space-y-2">
            <div className="border border-green-200 bg-green-50 rounded p-3">
              <div className="flex items-center gap-1.5 text-sm font-medium text-green-700 mb-1">
                智能合并（推荐）
              </div>
              <div className="text-xs text-admin-muted leading-relaxed">
                保留已填好的属性值不变，新增模板中有但当前缺失的属性项。<br />
                适合已有部分填写、需要补齐标准属性清单的场景。
              </div>
            </div>

            <div className="border border-red-200 bg-red-50 rounded p-3">
              <div className="flex items-center gap-1.5 text-sm font-medium text-red-700 mb-1">
                覆盖现有属性
              </div>
              <div className="text-xs text-admin-muted leading-relaxed">
                清空所有已有属性值，用模板全量替换。<br />
                <span className="text-red-600">⚠ 已填好的值将会丢失！</span>
              </div>
            </div>
          </div>

          {selectedPipe && (
            <div className="text-[11px] text-admin-muted bg-gray-50 p-2 rounded border border-admin-border">
              模板包含{" "}
              <span className="font-semibold">
                {(pipelineAttrTemplates[selectedPipe.usage] || pipelineAttrTemplates["主管路"]).length}
              </span>{" "}
              项标准属性 · 当前有 <span className="font-semibold">{rows.length}</span> 项属性（其中{" "}
              <span className="font-semibold text-green-600">{rows.filter((r) => r.value.trim() !== "").length}</span>{" "}
              项已填值）
            </div>
          )}
        </div>
      </Modal>

      {/* 模板属性预览弹窗 */}
      <Modal
        open={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        title={previewTemplate ? `${previewTemplate} - 全部属性预览` : "属性预览"}
        width={520}
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
              💡 共 <span className="font-semibold text-admin-text">{(pipelineAttrTemplates[previewTemplate] || []).length}</span> 项标准属性。点击「编辑模板」可修改。
            </div>
            <div className="border border-admin-border rounded overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-left font-medium text-admin-muted w-12">#</th>
                    <th className="px-2 py-2 text-left font-medium text-admin-muted">属性名称</th>
                    <th className="px-2 py-2 text-left font-medium text-admin-muted">单位</th>
                  </tr>
                </thead>
                <tbody>
                  {(pipelineAttrTemplates[previewTemplate] || []).map((attr, idx) => (
                    <tr key={idx} className={idx % 2 === 1 ? "bg-gray-50/50" : "border-t border-admin-border"}>
                      <td className="px-2 py-1.5 text-admin-muted">{idx + 1}</td>
                      <td className="px-2 py-1.5 text-admin-text">{attr.name}</td>
                      <td className="px-2 py-1.5 text-admin-muted font-mono">{attr.unit || "-"}</td>
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
