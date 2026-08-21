import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ReactECharts from "echarts-for-react";
import { ChevronLeft, ChevronRight, FileText, Play } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { TopNav } from "@/components/screen/TopNav";
import { Scene3D } from "@/components/screen/Scene3D";
import { BottomBar } from "@/components/screen/BottomBar";
import { TreePanel, type TreeNodeData } from "@/components/common/TreePanel";
import DrillDownModal, {
  type DrillDownSession,
} from "@/components/screen/DrillDownModal";
import { useChartDrillDown } from "@/components/screen/useChartDrillDown";
import { Modal } from "@/components/common/Modal";
import { message } from "@/components/common/Message";
import {
  resolveAttributeTemplate,
  useAttributeTemplates,
  type AttributeTemplateScope,
} from "@/lib/attributeTemplateStore";
import {
  overviewTreeData,
  equipmentTreeData,
  pipelineTreeData,
  panoramaTreeData,
  overallStats,
  equipmentInfo,
  componentInfo,
  generateNodeInfo,
  pipelineLengthBySystem,
  pipelineSpecBySystem,
  reformStatsBySystem,
  reformDetailsBySystem,
  waterUsageData,
  generateReformRecords,
} from "@/mock/screen";
import { systems, alarms, screenStats, roamingPaths } from "@/mock/index";
import type { RoamingPath } from "@/types";
import { DevNote } from "@/components/devNotes/DevNote";

const ONLINE_COUNT = 230;
const OFFLINE_COUNT = 18;

function inferTemplateClassifier(
  scope: AttributeTemplateScope,
  title: string,
  basic: Record<string, any>,
) {
  if (scope === "pipeline") {
    if (title.includes("技术供水")) return "技术供水管路";
    if (title.includes("冷却水")) return "冷却水管路";
    if (title.includes("排水")) return "排水管路";
    if (title.includes("油")) return "供油管路";
    if (title.includes("消防")) return "消防管路";
    return basic.type || basic.usage || "主管路";
  }

  const candidates = [
    "水泵水轮机",
    "发电电动机",
    "主变压器",
    "进水阀",
    "技术供水泵",
    "低压空压机",
    "电气二次盘柜",
  ];
  return basic.type || candidates.find((name) => title.includes(name)) || title;
}

function buildTemplateValueMap(nodeInfo: any) {
  const basic = nodeInfo?.basic || {};
  const values = new Map<string, string>();
  const setValue = (key: string, value: unknown) => {
    if (value !== undefined && value !== null && String(value).trim()) {
      values.set(key, String(value));
    }
  };

  [
    ["设备名称", basic.name],
    ["管路名称", basic.name],
    ["KKS编码", basic.code],
    ["唯一编码", basic.code],
    ["编码", basic.code],
    ["设备编码", basic.code],
    ["管路编码", basic.code],
    ["设备类型", basic.type],
    ["所属系统", basic.system],
    ["所属专业", basic.major],
    ["安装位置", basic.location || basic.position],
    ["型号", basic.model],
    ["厂家", basic.manufacturer],
    ["制造厂家", basic.manufacturer],
    ["投运日期", basic.commissionDate],
    ["安装日期", basic.commissionDate],
    ["规格", basic.spec],
    ["材质", basic.material],
    ["长度", basic.length],
    ["所属用途", basic.usage],
    ["介质类型", basic.medium],
  ].forEach(([key, value]) => setValue(String(key), value));

  (nodeInfo?.techParams || []).forEach((param: any) => {
    setValue(param.name, param.value);
  });

  return values;
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="bg-black/30 border border-[#40A9FF]/25 p-2.5 flex-1 min-w-0 rounded-none">
      <div className="text-xs text-screen-muted truncate">{label}</div>
      <div className="text-xl font-bold mt-1" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

const RIGHT_TABS = [
  { key: "basic", label: "基础信息" },
  { key: "tech", label: "技术参数" },
  { key: "runtime", label: "运行数据" },
  { key: "linked", label: "关联设备" },
  { key: "history", label: "操作记录" },
] as const;

const OVERVIEW_TABS = [
  { key: "stats", label: "统计" },
  { key: "realtime", label: "实时状态" },
  { key: "health", label: "设备健康" },
] as const;

type RightTabKey = (typeof RIGHT_TABS)[number]["key"];
type OverviewTabKey = (typeof OVERVIEW_TABS)[number]["key"];

function RuntimeCard({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
}) {
  return (
    <div className="bg-black/30 border border-[#40A9FF]/25 p-2 flex-1 min-w-0 rounded-none">
      <div className="text-xs text-screen-muted">{label}</div>
      <div className="text-lg font-bold mt-0.5" style={{ color }}>
        {value}
        <span className="text-xs font-normal ml-0.5">{unit}</span>
      </div>
    </div>
  );
}

export default function Screen() {
  const navigate = useNavigate();
  const { isAuthenticated, currentUser } = useAuthStore();

  const [viewMode, setViewMode] = useState<"overview" | "interior">("interior");
  const [focusMode, setFocusMode] = useState<"panorama" | "equipment" | "pipeline">(
    "panorama"
  );
  const [selectedNode, setSelectedNode] = useState<TreeNodeData | undefined>();

  const [leftPanelVisible, setLeftPanelVisible] = useState(true);
  const [leftPanelMode, setLeftPanelMode] = useState<"chart" | "tree">("chart");
  const [rightPanelVisible, setRightPanelVisible] = useState(true);
  const [rightActiveTab, setRightActiveTab] = useState<RightTabKey>("basic");
  const [overviewActiveTab, setOverviewActiveTab] = useState<OverviewTabKey>("stats");
  const [sceneResetKey, setSceneResetKey] = useState(0);
  const { templates } = useAttributeTemplates();

  // 左右栏卡片弹窗与状态
  const [pipelineModal, setPipelineModal] = useState<{
    system: string;
    data: { spec: string; length: number }[];
  } | null>(null);
  const [reformModal, setReformModal] = useState<{
    system: string;
    items: { time: string; title: string; material: string; unit: string }[];
  } | null>(null);
  const [drawingModal, setDrawingModal] = useState<any | null>(null);
  const [waterDim, setWaterDim] = useState<"year" | "month" | "day">("month");
  // 默认月度选择器，默认最近12个月（即 month 全部数据）
  const [waterRange, setWaterRange] = useState(() => ({
    start: waterUsageData.month[0].date,
    end: waterUsageData.month[waterUsageData.month.length - 1].date,
  }));
  const [roamingPlay, setRoamingPlay] = useState<RoamingPath | null>(null);

  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownData, setDrillDownData] = useState<DrillDownSession | null>(null);

  const handleDrillDown = useCallback((data: DrillDownSession) => {
    setDrillDownData(data);
    setDrillDownOpen(true);
  }, []);

  const handleLocateBIM = useCallback((kksCode: string) => {
    message.info(
      `实际项目中：三维相机将飞行定位到测点“${kksCode}”所属模型，闪烁高亮并在右侧打开对应运行数据。`
    );
    setDrillDownOpen(false);
  }, []);

  const { configureChart, createChartEvents } = useChartDrillDown({
    onDrillDown: handleDrillDown,
    onLocateBIM: handleLocateBIM,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const getChartProps = useCallback(
    (chartId: string, meta: { deviceName: string; metricPrefix: string }) =>
      ({
        "data-chart-id": chartId,
        role: "img",
        "aria-label": `${meta.metricPrefix}图表，点击数据点逐层钻取`,
        title: "点击图表数据点逐层钻取",
        onChartReady: (instance: any) => {
          if (!instance?.setOption) return;
          configureChart(chartId, instance, meta);
        },
        onEvents: createChartEvents(chartId, meta),
      }),
    [configureChart, createChartEvents]
  );

  if (!currentUser) return null;

  const handleSceneChange = (
    scene: "panorama" | "equipment" | "pipeline" | "overview"
  ) => {
    if (scene === "overview") {
      setViewMode("overview");
      setFocusMode("panorama");
    } else {
      setViewMode("interior");
      setFocusMode(scene);
    }
    setSelectedNode(undefined);
    setOverviewActiveTab("stats");

    const sceneDescriptions = {
      overview: "切换到工程总览默认观察点，加载大坝与坝后厂房宏观模型",
      panorama: "切换到厂房全景，综合显示建筑、设备和管网模型",
      equipment: "切换到设备总览，淡化管网并按运行状态高亮设备",
      pipeline: "切换到管路总览，淡化设备并按所属系统高亮管线",
    };
    message.info(`实际项目中：三维相机将平滑${sceneDescriptions[scene]}。`);
  };

  const handleEnterInterior = (
    initialFocus: "panorama" | "equipment" | "pipeline" = "panorama"
  ) => {
    setViewMode("interior");
    setFocusMode(initialFocus);
    setSelectedNode(undefined);
    setOverviewActiveTab("stats");
  };

  const handleSelectNode = (node: TreeNodeData) => {
    setSelectedNode(node);
    setRightActiveTab("basic");
    message.info(
      `实际项目中：三维相机将飞行定位并高亮“${node.title}”，右侧自动打开基础信息，可继续查看技术参数、运行数据和关联设备。`
    );
  };

  const handleSceneSelectNode = (
    title: string,
    kind: "equipment" | "pipeline" = "equipment",
  ) => {
    setSelectedNode(
      {
        key: title,
        title,
        code: "",
        type: kind === "pipeline" ? "component" : "equipment",
      } as TreeNodeData
    );
    setRightActiveTab("basic");
  };

  const handleGlobalReset = () => {
    setViewMode("interior");
    setFocusMode("panorama");
    setSelectedNode(undefined);
    setLeftPanelVisible(true);
    setLeftPanelMode("chart");
    setRightPanelVisible(true);
    setRightActiveTab("basic");
    setOverviewActiveTab("stats");
    setDrillDownOpen(false);
    setDrillDownData(null);
    setSceneResetKey((key) => key + 1);
  };

  const getTreeData = (): TreeNodeData[] => {
    if (viewMode === "overview") return overviewTreeData;
    switch (focusMode) {
      case "equipment":
        return equipmentTreeData;
      case "pipeline":
        return pipelineTreeData;
      default:
        return panoramaTreeData;
    }
  };

  const getNodeInfo = () => {
    if (!selectedNode) return null;
    if (equipmentInfo[selectedNode.title]) return equipmentInfo[selectedNode.title];
    if (componentInfo[selectedNode.title]) return componentInfo[selectedNode.title];
    return generateNodeInfo(selectedNode);
  };
  const nodeInfo = getNodeInfo();
  const selectedScope: AttributeTemplateScope =
    focusMode === "pipeline" ||
    selectedNode?.type === "component" ||
    selectedNode?.type === "usage"
      ? "pipeline"
      : "equipment";
  const templateClassifier = inferTemplateClassifier(
    selectedScope,
    selectedNode?.title || "",
    nodeInfo?.basic || {},
  );
  const matchedTemplate = selectedNode
    ? resolveAttributeTemplate(selectedScope, templateClassifier, templates)
    : null;
  const templateValueMap = buildTemplateValueMap(nodeInfo);
  const basicTemplateFields =
    matchedTemplate?.fields.filter(
      (field) => field.category === "基础信息",
    ) || [];
  const techTemplateFields =
    matchedTemplate?.fields.filter(
      (field) => field.category === "技术参数",
    ) || [];

  const powerTrendOption = useMemo(() => {
    const hours = ["00", "02", "04", "06", "08", "10", "12", "14", "16", "18", "20", "22"];
    const genMW = (base: number, amp: number) =>
      hours.map((_, i) =>
        Number((base + Math.sin(i / 2.5) * amp + (Math.random() - 0.5) * amp * 0.2).toFixed(1))
      );
    return {
      backgroundColor: "transparent",
      grid: { top: 28, right: 10, bottom: 22, left: 38 },
      tooltip: { trigger: "axis" },
      legend: {
        data: ["1#机组", "2#机组", "3#机组", "4#机组"],
        textStyle: { color: "#8a94a6", fontSize: 9 },
        top: 0,
        right: 0,
        itemWidth: 8,
        itemHeight: 5,
        itemGap: 4,
      },
      xAxis: {
        type: "category",
        data: hours,
        axisLine: { lineStyle: { color: "rgba(64,158,255,0.3)" } },
        axisLabel: { color: "#8a94a6", fontSize: 9 },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        name: "MW",
        nameTextStyle: { color: "#8a94a6", fontSize: 9 },
        axisLine: { lineStyle: { color: "rgba(64,158,255,0.3)" } },
        axisLabel: { color: "#8a94a6", fontSize: 9 },
        splitLine: { lineStyle: { color: "rgba(64,158,255,0.1)" } },
        axisTick: { show: false },
      },
      series: [
        { name: "1#机组", type: "line", smooth: true, symbol: "none", data: genMW(153, 8), itemStyle: { color: "#40A9FF" }, lineStyle: { width: 1.5 } },
        { name: "2#机组", type: "line", smooth: true, symbol: "none", data: genMW(149, 7), itemStyle: { color: "#52c41a" }, lineStyle: { width: 1.5 } },
        { name: "3#机组", type: "line", smooth: true, symbol: "none", data: genMW(152, 9), itemStyle: { color: "#faad14" }, lineStyle: { width: 1.5 } },
        { name: "4#机组", type: "line", smooth: true, symbol: "none", data: genMW(132, 6), itemStyle: { color: "#13C2C2" }, lineStyle: { width: 1.5 } },
      ],
    };
  }, []);

  const barChartOption = useMemo(() => {
    return {
      backgroundColor: "transparent",
      grid: { top: 16, right: 12, bottom: 28, left: 35 },
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      xAxis: {
        type: "category",
        data: overallStats.bySystem.map((s) => s.system),
        axisLine: { lineStyle: { color: "rgba(64,158,255,0.3)" } },
        axisLabel: { color: "#8a94a6", fontSize: 9 },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        axisLine: { lineStyle: { color: "rgba(64,158,255,0.3)" } },
        axisLabel: { color: "#8a94a6", fontSize: 9 },
        splitLine: { lineStyle: { color: "rgba(64,158,255,0.1)" } },
        axisTick: { show: false },
      },
      series: [
        {
          type: "bar",
          data: overallStats.bySystem.map((s) => s.equipment),
          itemStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "#40a9ff" },
                { offset: 1, color: "rgba(64,169,255,0.3)" },
              ],
            },
          },
          barWidth: "45%",
        },
      ],
    };
  }, []);

  const miniChartOption = useMemo(() => {
    const points = 24;
    let baseVal = 150;
    let label = "全站功率 (MW)";
    if (selectedNode && nodeInfo?.techParams?.[0]) {
      const raw = nodeInfo.techParams[0].value;
      const parsed = typeof raw === "number" ? raw : parseFloat(String(raw));
      if (!Number.isNaN(parsed) && parsed > 0) {
        baseVal = parsed;
        label = `${nodeInfo.techParams[0].name} (${nodeInfo.techParams[0].unit || ""})`;
      }
    }
    const data = Array.from({ length: points }, (_, i) => {
      const wave = Math.sin(i / 3) * baseVal * 0.08;
      const noise = (Math.random() - 0.5) * baseVal * 0.05;
      return Number((baseVal + wave + noise).toFixed(2));
    });
    return {
      backgroundColor: "transparent",
      grid: { top: 8, right: 10, bottom: 18, left: 32 },
      tooltip: {
        trigger: "axis",
        formatter: (params: any) =>
          `${params[0].name}<br/>${label.split(" ")[0]}: ${params[0].value}`,
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: Array.from({ length: points }, (_, i) => `${i}`),
        show: false,
      },
      yAxis: {
        type: "value",
        scale: true,
        axisLabel: { color: "#8a94a6", fontSize: 9 },
        splitLine: { lineStyle: { color: "rgba(64,158,255,0.1)" } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          type: "line",
          data,
          smooth: true,
          symbol: "none",
          itemStyle: { color: "#36cfc9" },
          lineStyle: { width: 1.5 },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(54,207,201,0.3)" },
                { offset: 1, color: "rgba(54,207,201,0)" },
              ],
            },
          },
        },
      ],
    };
  }, [selectedNode, nodeInfo]);

  const runtimeChartOption = useMemo(() => {
    const points = 20;
    const times = Array.from({ length: points }, (_, i) => `${String(i).padStart(2, "0")}:00`);
    const genSeries = (base: number, amp: number) =>
      Array.from({ length: points }, (_, i) =>
        Number((base + Math.sin(i / 2.5) * amp + (Math.random() - 0.5) * amp * 0.3).toFixed(2))
      );
    return {
      backgroundColor: "transparent",
      grid: { top: 28, right: 10, bottom: 22, left: 35 },
      tooltip: { trigger: "axis" },
      legend: {
        data: ["压力", "温度", "振动"],
        textStyle: { color: "#8a94a6", fontSize: 9 },
        top: 0,
        itemWidth: 8,
        itemHeight: 6,
      },
      xAxis: {
        type: "category",
        data: times,
        axisLine: { lineStyle: { color: "rgba(64,158,255,0.3)" } },
        axisLabel: { color: "#8a94a6", fontSize: 9 },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        axisLine: { lineStyle: { color: "rgba(64,158,255,0.3)" } },
        axisLabel: { color: "#8a94a6", fontSize: 9 },
        splitLine: { lineStyle: { color: "rgba(64,158,255,0.1)" } },
        axisTick: { show: false },
      },
      series: [
        {
          name: "压力", type: "line", smooth: true, symbol: "none",
          data: genSeries(1.6, 0.2), itemStyle: { color: "#52c41a" },
        },
        {
          name: "温度", type: "line", smooth: true, symbol: "none",
          data: genSeries(42, 5), itemStyle: { color: "#faad14" },
        },
        {
          name: "振动", type: "line", smooth: true, symbol: "none",
          data: genSeries(2.3, 0.8), itemStyle: { color: "#f5222d" },
        },
      ],
    };
  }, []);

  const runtimeData = useMemo(() => ({
    pressure: { value: Number((1.58 + (Math.random() - 0.5) * 0.2).toFixed(2)), unit: "MPa", color: "#52c41a", label: "压力" },
    temperature: { value: Number((42.5 + (Math.random() - 0.5) * 5).toFixed(1)), unit: "℃", color: "#faad14", label: "温度" },
    vibration: { value: Number((2.3 + (Math.random() - 0.5) * 0.8).toFixed(2)), unit: "mm/s", color: "#f5222d", label: "振动" },
  }), [selectedNode]);

  const operationLogs = useMemo(() => {
    const names = ["张工", "李工", "王工", "赵工", "陈工"];
    const actions = ["设备巡检", "参数调整", "定期保养", "故障排查", "数据录入"];
    const now = new Date();
    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(now.getTime() - i * 86400000 - Math.floor(Math.random() * 86400000));
      return {
        time: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`,
        user: names[i],
        action: actions[i],
      };
    });
  }, [selectedNode]);

  const getLinkedEquipments = () => {
    if (!nodeInfo) return [];
    if (selectedNode?.type === "component" && nodeInfo.linkedEquipments) {
      return nodeInfo.linkedEquipments;
    }
    const sysName = nodeInfo.basic?.system || "";
    if (!sysName) return [];
    const sysData = overallStats.bySystem.find((s) => s.system === sysName);
    if (!sysData) return [];
    return [
      { code: "", name: `${sysName} - 设备1台`, model: "—" },
      { code: "", name: `${sysName} - 设备2台`, model: "—" },
      { code: "", name: `${sysName} - 管路${sysData.pipeline}条`, model: "—" },
    ];
  };

  const renderLeftChartContent = () => {
    const pipelineOption = {
      backgroundColor: "transparent",
      grid: { top: 18, right: 12, bottom: 26, left: 42 },
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      xAxis: {
        type: "category",
        data: pipelineLengthBySystem.map((s) => s.system),
        axisLine: { lineStyle: { color: "rgba(64,158,255,0.3)" } },
        axisLabel: { color: "#8a94a6", fontSize: 9, interval: 0 },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        name: "m",
        nameTextStyle: { color: "#8a94a6", fontSize: 9 },
        axisLine: { lineStyle: { color: "rgba(64,158,255,0.3)" } },
        axisLabel: { color: "#8a94a6", fontSize: 9 },
        splitLine: { lineStyle: { color: "rgba(64,158,255,0.1)" } },
        axisTick: { show: false },
      },
      series: [{
        type: "bar",
        data: pipelineLengthBySystem.map((s) => s.length),
        itemStyle: {
          color: {
            type: "linear", x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "#13C2C2" },
              { offset: 1, color: "rgba(19,194,194,0.3)" },
            ],
          },
        },
        barWidth: "45%",
      }],
    };
    const reformOption = {
      backgroundColor: "transparent",
      grid: { top: 18, right: 12, bottom: 26, left: 42 },
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      xAxis: {
        type: "category",
        data: reformStatsBySystem.map((s) => s.system),
        axisLine: { lineStyle: { color: "rgba(64,158,255,0.3)" } },
        axisLabel: { color: "#8a94a6", fontSize: 9, interval: 0 },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        name: "次",
        nameTextStyle: { color: "#8a94a6", fontSize: 9 },
        axisLine: { lineStyle: { color: "rgba(64,158,255,0.3)" } },
        axisLabel: { color: "#8a94a6", fontSize: 9 },
        splitLine: { lineStyle: { color: "rgba(64,158,255,0.1)" } },
        axisTick: { show: false },
      },
      series: [{
        type: "bar",
        data: reformStatsBySystem.map((s) => s.count),
        itemStyle: {
          color: {
            type: "linear", x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "#FAAD14" },
              { offset: 1, color: "rgba(250,173,20,0.3)" },
            ],
          },
        },
        barWidth: "45%",
      }],
    };

    return (
      <div className="flex flex-col h-full overflow-auto p-2 gap-2">
        {/* 卡片1：设备管路图纸统计 */}
        <div className="bg-black/30 border border-[#40A9FF]/25 p-2.5 rounded-none">
          <div className="text-xs text-[#40A9FF] font-medium mb-2" style={{ textShadow: "0 0 6px rgba(64,169,255,0.5)" }}>
            设备管路图纸统计
          </div>
          <div className="grid grid-cols-3 gap-2">
            <StatCard label="设备总数" value={screenStats.equipmentTotal} color="#00b4ff" />
            <StatCard label="管路总数" value={screenStats.pipelineTotal} color="#52c41a" />
            <StatCard label="图纸总数" value={screenStats.drawingTotal} color="#faad14" />
          </div>
        </div>

        {/* 卡片2：管路统计柱状图 */}
        <div className="bg-black/30 border border-[#40A9FF]/25 p-2 rounded-none">
          <div className="text-xs text-[#13C2C2] font-medium mb-1" style={{ textShadow: "0 0 6px rgba(19,194,194,0.5)" }}>
            管路统计
          </div>
          <ReactECharts
            option={pipelineOption}
            style={{ height: 170 }}
            onEvents={{
              click: (params: any) => {
                const system = params?.name as string;
                const data = pipelineSpecBySystem[system];
                if (data) setPipelineModal({ system, data });
              },
            }}
          />
          <div className="text-[10px] text-screen-muted mt-0.5">点击柱状图查看该系统下管路规格分布</div>
        </div>

        {/* 卡片3：改造数据统计 */}
        <div className="bg-black/30 border border-[#40A9FF]/25 p-2 rounded-none">
          <div className="text-xs text-[#FAAD14] font-medium mb-1" style={{ textShadow: "0 0 6px rgba(250,173,20,0.5)" }}>
            改造数据统计
          </div>
          <ReactECharts
            option={reformOption}
            style={{ height: 170 }}
            onEvents={{
              click: (params: any) => {
                const system = params?.name as string;
                const items = reformDetailsBySystem[system];
                if (items) setReformModal({ system, items });
              },
            }}
          />
          <div className="text-[10px] text-screen-muted mt-0.5">点击柱状图查看该系统改造明细</div>
        </div>
      </div>
    );
  };

  const renderLeftTreeContent = () => (
    <TreePanel
      data={getTreeData()}
      selectedKey={selectedNode?.key}
      onSelect={handleSelectNode}
      searchPlaceholder="输入设备/管路名称搜索"
      showCount
    />
  );

  const renderBasicInfoTab = () => {
    if (!matchedTemplate) {
      return (
        <div className="p-3">
          <div className="text-xs text-[#40A9FF] font-medium mb-2">基础信息</div>
          <div className="border border-orange-500/30 bg-orange-500/10 p-3 text-xs text-orange-300">
            当前对象类型“{templateClassifier || "未识别"}”未匹配属性模板，请先在系统配置的属性模板库中维护。
          </div>
        </div>
      );
    }
    return (
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-[#40A9FF] font-medium" style={{ textShadow: "0 0 6px rgba(64,169,255,0.5)" }}>
            基础信息
          </div>
          <span className="text-[10px] text-screen-muted">{matchedTemplate.name}</span>
        </div>
        <div className="space-y-1.5">
          {basicTemplateFields.map((field) => (
            <div key={field.id} className="flex text-xs bg-black/30 rounded-none px-2 py-1.5 border-l-2 border-[#40A9FF]/50">
              <span className="w-20 text-screen-muted flex-shrink-0">
                {field.name}
              </span>
              <span className="flex-1 text-screen-text">
                {templateValueMap.get(field.name) || "—"}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTechParamsTab = () => {
    if (!matchedTemplate) {
      return (
        <div className="p-3 text-center">
          <div className="text-xs text-[#40A9FF] font-medium mb-2">技术参数</div>
          <div className="text-xs text-screen-muted py-4">当前对象未匹配属性模板</div>
        </div>
      );
    }
    return (
      <div className="p-3">
        <div className="text-xs text-[#40A9FF] font-medium mb-2">技术参数</div>
        <div className="border border-screen-border rounded-noneoverflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-black/30">
                <th className="text-left px-2 py-1.5 text-screen-muted font-medium">参数名称</th>
                <th className="text-left px-2 py-1.5 text-screen-muted font-medium">数值</th>
                <th className="text-left px-2 py-1.5 text-screen-muted font-medium">单位</th>
              </tr>
            </thead>
            <tbody>
              {techTemplateFields.map((field) => (
                <tr key={field.id} className="border-t border-screen-border">
                  <td className="px-2 py-1.5 text-screen-text">{field.name}</td>
                  <td className="px-2 py-1.5 text-screen-text">
                    {templateValueMap.get(field.name) || "—"}
                  </td>
                  <td className="px-2 py-1.5 text-screen-muted">{field.unit || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderRuntimeTab = () => (
    <div className="p-3">
      <div className="text-xs text-[#40A9FF] font-medium mb-2" style={{ textShadow: "0 0 6px rgba(64,169,255,0.5)" }}>
        实时运行数据
      </div>
      <div className="flex gap-1.5 mb-3">
        <div className="bg-black/30 border border-[#40A9FF]/25 p-2 rounded-noneflex-1">
          <div className="text-xs text-screen-muted">{runtimeData.pressure.label}</div>
          <div className="text-lg font-bold mt-0.5" style={{ color: runtimeData.pressure.color }}>
            {runtimeData.pressure.value}
            <span className="text-xs font-normal ml-0.5">{runtimeData.pressure.unit}</span>
          </div>
          <div className="w-full h-1 bg-gray-700 rounded-nonemt-1">
            <div className="h-full rounded" style={{ width: "60%", backgroundColor: runtimeData.pressure.color }}></div>
          </div>
        </div>
        <div className="bg-black/30 border border-[#40A9FF]/25 p-2 rounded-noneflex-1">
          <div className="text-xs text-screen-muted">{runtimeData.temperature.label}</div>
          <div className="text-lg font-bold mt-0.5" style={{ color: runtimeData.temperature.color }}>
            {runtimeData.temperature.value}
            <span className="text-xs font-normal ml-0.5">{runtimeData.temperature.unit}</span>
          </div>
          <div className="w-full h-1 bg-gray-700 rounded-nonemt-1">
            <div className="h-full rounded" style={{ width: "55%", backgroundColor: runtimeData.temperature.color }}></div>
          </div>
        </div>
        <div className="bg-black/30 border border-[#40A9FF]/25 p-2 rounded-noneflex-1">
          <div className="text-xs text-screen-muted">{runtimeData.vibration.label}</div>
          <div className="text-lg font-bold mt-0.5" style={{ color: runtimeData.vibration.color }}>
            {runtimeData.vibration.value}
            <span className="text-xs font-normal ml-0.5">{runtimeData.vibration.unit}</span>
          </div>
          <div className="w-full h-1 bg-gray-700 rounded-nonemt-1">
            <div className="h-full rounded" style={{ width: "40%", backgroundColor: runtimeData.vibration.color }}></div>
          </div>
        </div>
      </div>
      <div className="text-xs text-[#40A9FF] font-medium mb-1" style={{ textShadow: "0 0 6px rgba(64,169,255,0.5)" }}>
        趋势曲线
      </div>
      <div className="bg-black/30 border border-[#40A9FF]/25 p-1 rounded-none">
        <ReactECharts
          option={runtimeChartOption}
          style={{ height: 140 }}
          {...getChartProps("right-runtime", {
            deviceName: nodeInfo?.basic?.name || "当前设备",
            metricPrefix: "运行数据",
          })}
        />
      </div>
    </div>
  );

  const renderLinkedTab = () => {
    const equipments = getLinkedEquipments();
    const isComponent = selectedNode?.type === "component";
    return (
      <div className="p-3">
        <div className="text-xs text-[#40A9FF] font-medium mb-2" style={{ textShadow: "0 0 6px rgba(64,169,255,0.5)" }}>
          {isComponent ? "关联设备" : "同系统设备"}
        </div>
        {equipments.length === 0 ? (
          <div className="text-xs text-screen-muted py-4 text-center">暂无关联设备信息</div>
        ) : (
          <div className="space-y-1.5">
            {equipments.map((eq: any, i: number) => (
              <div key={i} className="bg-black/30 border border-[#40A9FF]/25 rounded-nonepx-2 py-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-screen-text font-medium">{eq.name}</span>
                  {eq.code && <span className="text-[#40A9FF] text-xs">{eq.code}</span>}
                </div>
                {eq.model && <div className="text-screen-muted mt-0.5">型号: {eq.model}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderHistoryTab = () => (
    <div className="p-3">
      <div className="text-xs text-[#40A9FF] font-medium mb-2" style={{ textShadow: "0 0 6px rgba(64,169,255,0.5)" }}>
        操作记录
      </div>
      <div className="space-y-1.5">
        {operationLogs.map((log, i) => (
          <div key={i} className="bg-black/30 border border-[#40A9FF]/25 rounded-nonepx-2 py-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-screen-text">{log.action}</span>
              <span className="text-[#40A9FF]">{log.user}</span>
            </div>
            <div className="text-screen-muted mt-0.5">{log.time}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderOverviewStatsTab = () => {
    const total = screenStats.equipmentTotal;
    const systems = screenStats.equipmentBySystem;
    const topSystems = [...systems].sort((a, b) => b.value - a.value).slice(0, 8);
    const maxVal = Math.max(...systems.map((s) => s.value));
    const colors = [
      "#40A9FF", "#52C41A", "#FAAD14", "#F5222D",
      "#722ED1", "#13C2C2", "#EB2F96", "#FA541C",
      "#1890FF", "#A0D911", "#2F54EB", "#36CFC9",
    ];

    return (
      <div className="p-3 flex flex-col">
        {viewMode === "overview" && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              onClick={() => {
                handleEnterInterior("equipment");
                message.info(
                  "实际项目中：三维相机将进入厂房设备总览，淡化管网并按运行状态高亮设备。",
                );
              }}
              className="text-left bg-green-500/10 border border-green-500/35 p-2.5 hover:bg-green-500/20 transition-colors"
            >
              <div className="flex items-center gap-1.5 text-green-400 text-xs">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                设备总览
              </div>
              <div className="text-white font-semibold mt-1">156台在线</div>
              <div className="text-[10px] text-screen-muted mt-1">点击进入设备场景</div>
            </button>
            <button
              onClick={() => {
                handleEnterInterior("pipeline");
                message.info(
                  "实际项目中：三维相机将进入厂房管路总览，淡化设备并按所属系统高亮管线。",
                );
              }}
              className="text-left bg-cyan-500/10 border border-cyan-500/35 p-2.5 hover:bg-cyan-500/20 transition-colors"
            >
              <div className="flex items-center gap-1.5 text-cyan-400 text-xs">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                管路总览
              </div>
              <div className="text-white font-semibold mt-1">56条系统</div>
              <div className="text-[10px] text-screen-muted mt-1">点击进入管路场景</div>
            </button>
          </div>
        )}
        <div className="text-xs text-[#40A9FF] font-medium mb-2" style={{ textShadow: "0 0 6px rgba(64,169,255,0.5)" }}>
          系统设备分布
        </div>
        <div className="bg-black/30 border border-[#40A9FF]/25 p-2 mb-2 rounded-none">
          <ReactECharts
            option={{
              backgroundColor: "transparent",
              tooltip: { trigger: "item", formatter: "{b}: {c}台 ({d}%)" },
              legend: {
                orient: "horizontal",
                bottom: 4,
                left: "center",
                textStyle: { color: "#8a94a6", fontSize: 9 },
                itemWidth: 6,
                itemHeight: 5,
                itemGap: 6,
              },
              graphic: [
                {
                  type: "text",
                  left: "center",
                  top: "38%",
                  style: { text: total.toString(), fill: "#00b4ff", fontSize: 18, fontWeight: "bold", textAlign: "center" },
                },
                {
                  type: "text",
                  left: "center",
                  top: "50%",
                  style: { text: "设备总数(台)", fill: "#8a94a6", fontSize: 9, textAlign: "center" },
                },
              ],
              series: [
                {
                  type: "pie",
                  roseType: "radius",
                  radius: ["18%", "60%"],
                  center: ["50%", "42%"],
                  data: systems.map((s, i) => ({
                    ...s,
                    itemStyle: { color: colors[i % colors.length] },
                  })),
                  itemStyle: {
                    borderRadius: 2,
                    borderColor: "rgba(0, 180, 255, 0.2)",
                    borderWidth: 1,
                  },
                  label: { show: false },
                  emphasis: {
                    label: { show: true, fontSize: 10, fontWeight: "bold", color: "#fff" },
                  },
                },
              ],
            }}
            style={{ height: 200 }}
            {...getChartProps("overview-rose", {
              deviceName: "全厂设备",
              metricPrefix: "系统设备分布",
            })}
          />
        </div>
        <div className="flex gap-2 mb-2">
          <div className="flex-1 bg-purple-900/30 border border-purple-700/30 rounded-nonep-2 text-center">
            <div className="text-[10px] text-screen-muted">图纸总数</div>
            <div className="text-sm text-purple-400 font-bold mt-0.5">186<span className="text-[10px] font-normal">张</span></div>
          </div>
          <div className="flex-1 bg-blue-900/30 border border-[#40A9FF]/25 rounded-nonep-2 text-center">
            <div className="text-[10px] text-screen-muted">编码挂接率</div>
            <div className="text-sm text-[#40A9FF] font-bold mt-0.5">75.0<span className="text-[10px] font-normal">%</span></div>
          </div>
          <div className="flex-1 bg-green-900/30 border border-green-700/30 rounded-nonep-2 text-center">
            <div className="text-[10px] text-screen-muted">模型关联率</div>
            <div className="text-sm text-green-400 font-bold mt-0.5">82.3<span className="text-[10px] font-normal">%</span></div>
          </div>
        </div>
        <div className="bg-black/30 border border-[#40A9FF]/25 p-2 rounded-none">
          <div className="text-[10px] text-[#40A9FF] font-medium mb-1.5">设备数量排行</div>
          <div className="space-y-1">
            {topSystems.map((s, i) => (
              <div key={s.name} className="flex items-center gap-1.5 text-[10px]">
                <span className={`w-3 h-3 flex items-center justify-center rounded-sm text-[8px] font-bold ${i < 3 ? "bg-[#40A9FF] text-white" : "bg-gray-700/60 text-screen-muted"}`}>
                  {i + 1}
                </span>
                <span className="text-screen-text flex-1 truncate">{s.name}</span>
                <div className="w-14 h-1 bg-black/40 rounded-none">
                  <div
                    className="h-full rounded-none"
                    style={{ width: `${(s.value / maxVal) * 100}%`, backgroundColor: colors[systems.findIndex((x) => x.name === s.name) % colors.length] }}
                  />
                </div>
                <span className="text-[#00b4ff] w-5 text-right">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderOverviewRealtimeTab = () => (
    <div className="p-3">
      <div className="text-xs text-[#40A9FF] font-medium mb-2" style={{ textShadow: "0 0 6px rgba(64,169,255,0.5)" }}>
        关键运行指标
      </div>
      <div className="flex gap-1.5 mb-2">
        <div className="bg-blue-900/30 border border-blue-700/30 rounded-nonep-2 flex-1 text-center">
          <div className="text-[10px] text-screen-muted">总功率</div>
          <div className="text-sm text-[#40A9FF] font-bold mt-0.5">612.3<span className="text-[10px] font-normal">MW</span></div>
        </div>
        <div className="bg-green-900/30 border border-green-700/30 rounded-nonep-2 flex-1 text-center">
          <div className="text-[10px] text-screen-muted">当前出力</div>
          <div className="text-sm text-green-400 font-bold mt-0.5">585.6<span className="text-[10px] font-normal">MW</span></div>
        </div>
        <div className="bg-orange-900/30 border border-orange-700/30 rounded-nonep-2 flex-1 text-center">
          <div className="text-[10px] text-screen-muted">机组运行</div>
          <div className="text-sm text-orange-400 font-bold mt-0.5">4<span className="text-[10px] font-normal">台</span></div>
        </div>
      </div>
      <div className="flex gap-1.5 mb-3">
        <div className="flex-1 bg-blue-900/30 border border-[#40A9FF]/25 rounded-nonep-2 text-center">
          <div className="text-[10px] text-screen-muted">负荷率</div>
          <div className="text-sm text-[#40A9FF] font-bold mt-0.5">92.6<span className="text-[10px] font-normal">%</span></div>
        </div>
        <div className="flex-1 bg-green-900/30 border border-green-700/30 rounded-nonep-2 text-center">
          <div className="text-[10px] text-screen-muted">年均发电量</div>
          <div className="text-sm text-green-400 font-bold mt-0.5">33.4<span className="text-[10px] font-normal">亿kWh</span></div>
        </div>
        <div className="flex-1 bg-orange-900/30 border border-orange-700/30 rounded-nonep-2 text-center">
          <div className="text-[10px] text-screen-muted">水头高度</div>
          <div className="text-sm text-orange-400 font-bold mt-0.5">110.5<span className="text-[10px] font-normal">m</span></div>
        </div>
      </div>
      <div className="text-xs text-[#40A9FF] font-medium mb-2" style={{ textShadow: "0 0 6px rgba(64,169,255,0.5)" }}>
        机组运行状态
      </div>
      <div className="bg-black/30 border border-[#40A9FF]/25 rounded-none">
        <div className="grid grid-cols-4 bg-[#40A9FF]/10 px-2 py-1 text-[10px] text-[#40A9FF]">
          <span>机组</span>
          <span className="text-center">状态</span>
          <span className="text-center">出力</span>
          <span className="text-center">功率因数</span>
        </div>
        {[
          { id: "1#", status: "运行", output: "153.2MW", pf: "0.92" },
          { id: "2#", status: "运行", output: "148.7MW", pf: "0.90" },
          { id: "3#", status: "运行", output: "152.1MW", pf: "0.91" },
          { id: "4#", status: "运行", output: "131.6MW", pf: "0.88" },
        ].map((g) => (
          <div key={g.id} className="grid grid-cols-4 px-2 py-1.5 text-xs border-t border-[#40A9FF]/10">
            <span className="text-screen-text">{g.id}机组</span>
            <span className="text-center text-green-400">{g.status}</span>
            <span className="text-center text-screen-text">{g.output}</span>
            <span className="text-center text-screen-muted">{g.pf}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderOverviewHealthTab = () => (
    <div className="p-3 space-y-3">
      <div>
        <div className="text-xs text-[#40A9FF] font-medium mb-2" style={{ textShadow: "0 0 6px rgba(64,169,255,0.5)" }}>
          设备健康度分布
        </div>
        <div className="bg-black/30 border border-[#40A9FF]/25 p-2 rounded-none">
          <ReactECharts
            option={{
              backgroundColor: "transparent",
              tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
              series: [{
                type: "pie",
                radius: ["45%", "70%"],
                center: ["50%", "50%"],
                data: [
                  { name: "健康", value: 85, itemStyle: { color: "#52c41a" } },
                  { name: "亚健康", value: 10, itemStyle: { color: "#faad14" } },
                  { name: "告警", value: 5, itemStyle: { color: "#f5222d" } },
                ],
                label: { show: true, fontSize: 9, color: "#8a94a6", formatter: "{b}\n{d}%" },
              }],
            }}
            style={{ height: 130 }}
            {...getChartProps("overview-health-pie", {
              deviceName: "全厂设备",
              metricPrefix: "健康分布",
            })}
          />
        </div>
      </div>
      <div>
        <div className="text-xs text-[#40A9FF] font-medium mb-2" style={{ textShadow: "0 0 6px rgba(64,169,255,0.5)" }}>
          今日告警统计
        </div>
        <div className="flex gap-2">
          <div className="flex-1 bg-black/30 border border-[#40A9FF]/25 p-2 rounded-nonetext-center">
            <div className="text-[10px] text-screen-muted">告警总数</div>
            <div className="text-lg text-[#40A9FF] font-bold">3</div>
          </div>
          <div className="flex-1 bg-red-900/30 border border-red-700/30 p-2 rounded-nonetext-center">
            <div className="text-[10px] text-screen-muted">严重</div>
            <div className="text-lg text-red-400 font-bold">1</div>
          </div>
          <div className="flex-1 bg-orange-900/30 border border-orange-700/30 p-2 rounded-nonetext-center">
            <div className="text-[10px] text-screen-muted">警告</div>
            <div className="text-lg text-orange-400 font-bold">2</div>
          </div>
        </div>
      </div>
      <div>
        <div className="text-xs text-[#40A9FF] font-medium mb-2" style={{ textShadow: "0 0 6px rgba(64,169,255,0.5)" }}>
          设备健康度趋势
        </div>
        <div className="bg-black/30 border border-[#40A9FF]/25 p-2 rounded-none">
          <ReactECharts
            option={{
              backgroundColor: "transparent",
              grid: { top: 15, right: 10, bottom: 20, left: 35 },
              tooltip: { trigger: "axis" },
              xAxis: {
                type: "category",
                data: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
                axisLine: { lineStyle: { color: "rgba(64,158,255,0.3)" } },
                axisLabel: { color: "#8a94a6", fontSize: 9 },
                axisTick: { show: false },
              },
              yAxis: {
                type: "value",
                min: 80,
                max: 100,
                axisLabel: { color: "#8a94a6", fontSize: 9, formatter: "{value}%" },
                splitLine: { lineStyle: { color: "rgba(64,158,255,0.1)" } },
              },
              series: [{
                type: "line",
                data: [96.2, 95.8, 96.5, 95.3, 94.8, 95.6, 96.0],
                smooth: true,
                symbol: "none",
                itemStyle: { color: "#52c41a" },
                lineStyle: { width: 1.5 },
                areaStyle: {
                  color: {
                    type: "linear", x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                      { offset: 0, color: "rgba(82, 196, 26, 0.3)" },
                      { offset: 1, color: "rgba(82, 196, 26, 0)" },
                    ],
                  },
                },
              }],
            }}
            style={{ height: 140 }}
            {...getChartProps("overview-health-trend", {
              deviceName: "全厂设备",
              metricPrefix: "健康度",
            })}
          />
        </div>
      </div>
    </div>
  );

  // 右侧栏：未选中节点时展示 3 张卡片（漫游路径 / 用水量统计 / 告警信息）
  const renderRightDefaultCards = () => {
    const waterAll = waterUsageData[waterDim];
    const waterData = waterAll.filter(
      (d) => d.date >= waterRange.start && d.date <= waterRange.end,
    );
    const waterOption = {
      backgroundColor: "transparent",
      grid: { top: 22, right: 10, bottom: 20, left: 38 },
      tooltip: { trigger: "axis" },
      xAxis: {
        type: "category",
        data: waterData.map((d) => d.label),
        axisLine: { lineStyle: { color: "rgba(64,158,255,0.3)" } },
        axisLabel: { color: "#8a94a6", fontSize: 8, interval: waterDim === "day" ? 4 : 0 },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        name: "m³",
        nameTextStyle: { color: "#8a94a6", fontSize: 8 },
        axisLabel: { color: "#8a94a6", fontSize: 8 },
        splitLine: { lineStyle: { color: "rgba(64,158,255,0.1)" } },
      },
      series: [{
        type: "bar",
        data: waterData.map((d) => d.value),
        itemStyle: {
          color: {
            type: "linear", x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "#40A9FF" },
              { offset: 1, color: "rgba(64,169,255,0.3)" },
            ],
          },
        },
        barWidth: "55%",
      }],
    };
    const switchWaterDim = (dim: "year" | "month" | "day") => {
      setWaterDim(dim);
      const data = waterUsageData[dim];
      setWaterRange({ start: data[0].date, end: data[data.length - 1].date });
    };
    const rangeInputCls =
      "bg-black/30 border border-[#40A9FF]/25 text-[10px] text-screen-text px-1 py-0.5 rounded-none flex-1 min-w-0";

    return (
      <div className="flex flex-col h-full overflow-auto p-2 gap-2">
        {/* 卡片1：漫游路径（与工具栏漫游路径组件保持一致） */}
        <div className="bg-black/30 border border-[#40A9FF]/25 p-2 rounded-none">
          <div className="text-xs text-[#40A9FF] font-medium mb-2" style={{ textShadow: "0 0 6px rgba(64,169,255,0.5)" }}>
            漫游路径（{roamingPaths.length}）
          </div>
          <div className="space-y-1">
            {roamingPaths.map((path) => (
              <div key={path.id} className="bg-black/30 border border-[#40A9FF]/20 px-2 py-1.5 text-xs rounded-none">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-screen-text font-medium truncate">{path.name}</span>
                      <span className={`px-1 py-px text-[9px] rounded-none ${path.type === "default" ? "bg-blue-500/20 text-blue-400" : "bg-green-500/20 text-green-400"}`}>
                        {path.type === "default" ? "默认" : "自定义"}
                      </span>
                    </div>
                    <div className="text-screen-muted mt-0.5 truncate" title={path.description}>
                      {path.description}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      message.info(
                        `实际项目中：将按“${path.name}”的关键帧自动飞行，依次经过设定对象，并按各节点设置的朝向、速度和停留时长播放（约${path.duration}秒）。`,
                      )
                    }
                    title="播放路径"
                    className="flex-shrink-0 text-[#40A9FF] hover:text-white hover:bg-[#40A9FF]/20 p-1 rounded-none transition-colors"
                  >
                    <Play size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 卡片2：用水量统计（技术供水系统，年/月/日快捷选择 + 自定义时间范围） */}
        <div className="bg-black/30 border border-[#40A9FF]/25 p-2 rounded-none">
          <div className="text-xs text-[#40A9FF] font-medium mb-1.5" style={{ textShadow: "0 0 6px rgba(64,169,255,0.5)" }}>
            用水量统计（技术供水系统）
          </div>
          <div className="flex items-center gap-1 mb-1.5">
            {([
              { key: "year" as const, label: "年" },
              { key: "month" as const, label: "月" },
              { key: "day" as const, label: "日" },
            ]).map((dim) => (
              <button
                key={dim.key}
                onClick={() => switchWaterDim(dim.key)}
                className={`px-2 py-0.5 text-[10px] rounded-none transition-colors ${
                  waterDim === dim.key
                    ? "bg-[#40A9FF] text-white"
                    : "bg-black/30 text-screen-muted hover:text-white"
                }`}
              >
                {dim.label}
              </button>
            ))}
          </div>
          {waterDim === "year" && (
            <div className="flex items-center gap-1 mb-1.5">
              <select
                className={rangeInputCls}
                value={waterRange.start}
                onChange={(e) => setWaterRange({ ...waterRange, start: e.target.value })}
              >
                {waterUsageData.year.map((d) => (
                  <option key={d.date} value={d.date} className="bg-gray-800">
                    {d.date}年
                  </option>
                ))}
              </select>
              <span className="text-screen-muted text-[10px]">至</span>
              <select
                className={rangeInputCls}
                value={waterRange.end}
                onChange={(e) => setWaterRange({ ...waterRange, end: e.target.value })}
              >
                {waterUsageData.year.map((d) => (
                  <option key={d.date} value={d.date} className="bg-gray-800">
                    {d.date}年
                  </option>
                ))}
              </select>
            </div>
          )}
          {waterDim === "month" && (
            <div className="flex items-center gap-1 mb-1.5">
              <input
                type="month"
                className={rangeInputCls}
                value={waterRange.start}
                onChange={(e) => setWaterRange({ ...waterRange, start: e.target.value })}
              />
              <span className="text-screen-muted text-[10px]">至</span>
              <input
                type="month"
                className={rangeInputCls}
                value={waterRange.end}
                onChange={(e) => setWaterRange({ ...waterRange, end: e.target.value })}
              />
            </div>
          )}
          {waterDim === "day" && (
            <div className="flex items-center gap-1 mb-1.5">
              <input
                type="date"
                className={rangeInputCls}
                value={waterRange.start}
                onChange={(e) => setWaterRange({ ...waterRange, start: e.target.value })}
              />
              <span className="text-screen-muted text-[10px]">至</span>
              <input
                type="date"
                className={rangeInputCls}
                value={waterRange.end}
                onChange={(e) => setWaterRange({ ...waterRange, end: e.target.value })}
              />
            </div>
          )}
          <ReactECharts option={waterOption} style={{ height: 130 }} />
        </div>

        {/* 卡片3：告警信息（复用现有告警组件） */}
        <div className="bg-black/30 border border-[#40A9FF]/25 p-2 rounded-none">
          <div className="text-xs text-[#FAAD14] font-medium mb-2" style={{ textShadow: "0 0 6px rgba(250,173,20,0.5)" }}>
            告警信息（{alarms.length}）
          </div>
          <div className="space-y-1.5">
            {alarms.map((alarm) => (
              <div key={alarm.id} className="bg-black/30 px-2 py-1.5 text-xs border-l-2 rounded-none" style={{ borderLeftColor: alarm.level === "serious" ? "#ff4d4f" : alarm.level === "normal" ? "#faad14" : "#40A9FF" }}>
                <div className="flex justify-between items-center">
                  <span className="text-screen-text font-medium">{alarm.equipmentName}</span>
                  <span className={`px-1.5 py-0.5 text-[10px] ${alarm.level === "serious" ? "bg-red-500/20 text-red-400" : alarm.level === "normal" ? "bg-orange-500/20 text-orange-400" : "bg-blue-500/20 text-blue-400"}`}>
                    {alarm.type}
                  </span>
                </div>
                <div className="text-screen-muted mt-0.5">{alarm.description}</div>
                <div className="text-screen-muted mt-0.5">{alarm.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // 右侧栏：选中节点后展示 3 张卡片（图纸统计 / 属性资料 / 改造资料）
  const renderRightNodeCards = () => {
    const nodeDocs = nodeInfo?.documents || [];
    const nodeReforms = generateReformRecords(selectedNode!);
    return (
      <div className="flex flex-col h-full overflow-auto p-2 gap-2">
        {/* 卡片1：图纸统计（列表展示当前节点图纸，点击条目弹窗展示） */}
        <div className="bg-black/30 border border-[#40A9FF]/25 p-2 rounded-none">
          <div className="text-xs text-[#40A9FF] font-medium mb-2" style={{ textShadow: "0 0 6px rgba(64,169,255,0.5)" }}>
            图纸统计（{nodeDocs.length}）
          </div>
          {nodeDocs.length === 0 ? (
            <div className="text-xs text-screen-muted py-3 text-center">该节点暂无图纸资料</div>
          ) : (
            <div className="space-y-1">
              {nodeDocs.map((doc: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setDrawingModal(doc)}
                  className="w-full text-left bg-black/30 border border-[#40A9FF]/20 px-2 py-1.5 text-xs rounded-none hover:bg-[#40A9FF]/10 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-screen-text font-medium truncate flex items-center gap-1">
                      <FileText size={11} className="text-[#40A9FF] flex-shrink-0" />
                      {doc.name}
                    </span>
                    <span className="text-screen-muted text-[10px] flex-shrink-0">{doc.fileType}</span>
                  </div>
                  <div className="text-screen-muted mt-0.5 text-[10px]">
                    {doc.category} · {doc.date} · {doc.fileSize}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 卡片2：属性资料（复用现有属性信息：基础信息 + 技术参数） */}
        <div className="bg-black/30 border border-[#40A9FF]/25 rounded-none">
          <div className="text-xs text-[#40A9FF] font-medium px-2 pt-2" style={{ textShadow: "0 0 6px rgba(64,169,255,0.5)" }}>
            属性资料
          </div>
          <div className="max-h-[280px] overflow-auto">
            {renderBasicInfoTab()}
            {renderTechParamsTab()}
          </div>
        </div>

        {/* 卡片3：改造资料（后台接口获取，无真实数据时使用Mock） */}
        <div className="bg-black/30 border border-[#40A9FF]/25 p-2 rounded-none">
          <div className="text-xs text-[#13C2C2] font-medium mb-2" style={{ textShadow: "0 0 6px rgba(19,194,194,0.5)" }}>
            改造资料（{nodeReforms.length}）
          </div>
          <div className="space-y-1.5">
            {nodeReforms.map((record, i) => (
              <div key={i} className="bg-black/30 border-l-2 border-[#13C2C2]/60 px-2 py-1.5 text-xs rounded-none">
                <div className="flex items-center justify-between">
                  <span className="text-screen-text font-medium">{record.type}</span>
                  <span className="text-screen-muted text-[10px]">{record.time}</span>
                </div>
                <div className="text-screen-text mt-0.5">{record.content}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col screen-bg screen-dark overflow-hidden">
      <TopNav
        viewMode={viewMode}
        focusMode={focusMode}
        onSceneChange={handleSceneChange}
      />

      <div className="flex-1 flex overflow-hidden">
        {leftPanelVisible ? (
          <div className="flex h-full flex-shrink-0 relative">
            <DevNote
              id="screen-left-panel"
              title="左侧面板（信息图表/结构导航）"
              summary="两种模式：信息图表（统计数据与趋势图表）或结构导航（设备/管路结构树），点击侧边按钮切换"
              items={[
                { label: "数据来源", value: "图表模式：screenStats.equipmentTotal/pipelineTotal、ONLINE_COUNT=230、alarms 长度与告警列表（取前5条）、systems 辅机系统列表；结构树模式：按 viewMode/focusMode 选择 overviewTreeData/equipmentTreeData/pipelineTreeData/panoramaTreeData" },
                { label: "图表内容", value: "统计卡（设备总数/管路总数/在线设备/今日告警）、机组出力趋势、水头/流量监测、告警数量趋势、设备在线率、辅机系统状态（全部标记“运行中”）、实时告警列表" },
                { label: "交互逻辑", value: "右上角“-”折叠；侧边“结构树/图表”按钮切换模式；结构树点击节点 → handleSelectNode 选中并联动右侧基础信息与中央高亮；图表数据点支持逐层钻取（见钻取弹窗标注）" },
                { label: "权限", value: "大屏所有已登录用户可用" },
                { label: "后续步骤", value: "正式系统：统计值由实时数据服务推送（每5秒刷新），树数据由结构树服务返回" },
              ]}
              wrapClassName="flex-shrink-0"
            >
            <div className="w-[320px] bg-screen-panel border-r border-[#40A9FF]/25 flex flex-col relative">
              <button
                onClick={() => setLeftPanelVisible(false)}
                title="隐藏左侧栏"
                className="absolute top-1 left-1 z-10 w-5 h-5 flex items-center justify-center bg-black/40 border border-[#40A9FF]/30 text-screen-muted hover:text-white hover:border-[#40A9FF] transition-colors rounded-none"
              >
                <ChevronLeft size={12} />
              </button>
              <div className="flex-1 overflow-hidden pt-6">
                {leftPanelMode === "chart"
                  ? renderLeftChartContent()
                  : renderLeftTreeContent()}
              </div>
            </div>
            </DevNote>
            <button
              onClick={() =>
                setLeftPanelMode(leftPanelMode === "chart" ? "tree" : "chart")
              }
              title={leftPanelMode === "chart" ? "切换到结构树模式" : "切换到图表模式"}
              className="absolute right-[-18px] top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-0.5 px-1 py-2.5 bg-black/70 border border-[#40A9FF]/50 text-[#40A9FF] hover:bg-[#40A9FF]/30 hover:border-[#40A9FF] hover:text-white transition-colors cursor-pointer rounded-none"
            >
              <ChevronRight size={10} />
              <span className="text-xs font-bold leading-tight">
                {leftPanelMode === "chart" ? "结构树" : "图表"}
              </span>
              <span className="text-[10px] text-screen-muted">切换</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setLeftPanelVisible(true)}
            title="展开左侧栏"
            className="w-6 flex-shrink-0 flex items-center justify-center text-screen-muted hover:text-white hover:bg-screen-hover border-r border-[#40A9FF]/25 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        )}

        <Scene3D
          key={`scene-${sceneResetKey}`}
          viewMode={viewMode}
          focusMode={focusMode}
          selectedNode={selectedNode}
          onSelectNode={handleSceneSelectNode}
          onEnterInterior={(focus) => handleEnterInterior(focus)}
        />

        {rightPanelVisible ? (
          <DevNote
            id="screen-right-panel"
            title="右侧面板（大屏数据/节点信息）"
            summary="未选中节点时展示 3 张卡片：漫游路径/用水量统计/告警信息；选中设备或管路后替换为 3 张卡片：图纸统计/属性资料/改造资料"
            items={[
              { label: "默认卡片", value: "漫游路径：展示全部漫游路径（roamingPaths，与工具栏漫游路径组件一致，点击播放提示自动飞行）；用水量统计：技术供水系统用水量（年/月/日快捷选择器 + 自定义时间范围，Mock 数据）；告警信息：复用 alarms 告警列表" },
              { label: "选中节点卡片", value: "图纸统计：nodeInfo.documents 图纸列表，点击条目弹窗展示图纸；属性资料：复用属性模板基础信息 + 技术参数；改造资料：generateReformRecords Mock 生成（正式系统由后台接口返回）" },
              { label: "切换规则", value: "selectedNode 为空 → 默认 3 张卡片；选中节点 → 节点 3 张卡片；切换选中对象自动刷新" },
              { label: "权限", value: "大屏所有已登录用户可查看" },
              { label: "后续步骤", value: "正式系统：用水量由计量服务返回，改造资料由改造管理接口返回，图纸预览加载 CAD/DWG 转换图" },
            ]}
            wrapClassName="flex-shrink-0"
          >
          <div className="w-[300px] flex-shrink-0 bg-screen-panel border-l border-[#40A9FF]/25 flex flex-col relative">
            <button
              onClick={() => setRightPanelVisible(false)}
              title="隐藏右侧栏"
              className="absolute top-1 right-1 z-10 w-5 h-5 flex items-center justify-center bg-black/40 border border-[#40A9FF]/30 text-screen-muted hover:text-white hover:border-[#40A9FF] transition-colors rounded-none"
            >
              <ChevronRight size={12} />
            </button>
            <div className="flex-1 overflow-auto pt-6">
              {selectedNode ? renderRightNodeCards() : renderRightDefaultCards()}
            </div>
          </div>
          </DevNote>
        ) : (
          <button
            onClick={() => setRightPanelVisible(true)}
            title="展开右侧栏"
            className="w-6 flex-shrink-0 flex items-center justify-center text-screen-muted hover:text-white hover:bg-screen-hover border-l border-[#40A9FF]/25 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      <BottomBar key={`bottom-${sceneResetKey}`} onReset={handleGlobalReset} />

      {/* 管路规格分布弹窗：点击管路统计柱状图后展示该系统下各规格管路长度 */}
      <Modal
        open={Boolean(pipelineModal)}
        onClose={() => setPipelineModal(null)}
        title={pipelineModal ? `管路规格分布 · ${pipelineModal.system}` : ""}
        width={640}
        footer={
          <button className="btn-default" onClick={() => setPipelineModal(null)}>
            关闭
          </button>
        }
      >
        {pipelineModal && (
          <ReactECharts
            option={{
              backgroundColor: "transparent",
              grid: { top: 20, right: 20, bottom: 30, left: 48 },
              tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
              xAxis: {
                type: "category",
                data: pipelineModal.data.map((d) => d.spec),
                axisLine: { lineStyle: { color: "rgba(64,158,255,0.3)" } },
                axisLabel: { color: "#6b7a90", fontSize: 11 },
                axisTick: { show: false },
              },
              yAxis: {
                type: "value",
                name: "长度(m)",
                nameTextStyle: { color: "#6b7a90", fontSize: 10 },
                axisLabel: { color: "#6b7a90", fontSize: 10 },
                splitLine: { lineStyle: { color: "rgba(64,158,255,0.15)" } },
              },
              series: [{
                type: "bar",
                data: pipelineModal.data.map((d) => d.length),
                itemStyle: {
                  color: {
                    type: "linear", x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                      { offset: 0, color: "#13C2C2" },
                      { offset: 1, color: "rgba(19,194,194,0.25)" },
                    ],
                  },
                },
                barWidth: "50%",
                label: { show: true, position: "top", color: "#13C2C2", fontSize: 10 },
              }],
            }}
            style={{ height: 320 }}
          />
        )}
      </Modal>

      {/* 改造明细弹窗：点击改造数据柱状图后展示该系统改造明细列表 */}
      <Modal
        open={Boolean(reformModal)}
        onClose={() => setReformModal(null)}
        title={reformModal ? `改造明细 · ${reformModal.system}` : ""}
        width={640}
        footer={
          <button className="btn-default" onClick={() => setReformModal(null)}>
            关闭
          </button>
        }
      >
        {reformModal && (
          <div className="max-h-[420px] overflow-auto rounded border border-admin-border">
            <div className="grid grid-cols-[110px_1fr_90px] bg-gray-50 px-3 py-2 text-xs font-medium text-admin-muted border-b border-admin-border">
              <span>改造时间</span>
              <span>改造资料</span>
              <span>改造范围</span>
            </div>
            {reformModal.items.map((item, i) => (
              <button
                key={i}
                onClick={() =>
                  message.info(
                    `实际项目中：点击该改造记录将跳转至后台管理对应设备的台账信息页面，展示“${item.title}”的改造时间与改造资料明细。`,
                  )
                }
                className="grid grid-cols-[110px_1fr_90px] border-b border-admin-border px-3 py-2 text-xs last:border-0 w-full text-left hover:bg-blue-50 transition-colors"
              >
                <span className="text-admin-muted">{item.time}</span>
                <div>
                  <div className="text-admin-text font-medium">{item.title}</div>
                  <div className="text-admin-muted mt-0.5 text-[11px]">{item.material}</div>
                </div>
                <span className="text-admin-muted">{item.unit}</span>
              </button>
            ))}
          </div>
        )}
      </Modal>

      {/* 图纸预览弹窗：点击图纸统计卡片条目后展示对应图纸 */}
      <Modal
        open={Boolean(drawingModal)}
        onClose={() => setDrawingModal(null)}
        title={drawingModal?.name || "图纸预览"}
        width={720}
        footer={
          <button className="btn-default" onClick={() => setDrawingModal(null)}>
            关闭
          </button>
        }
      >
        {drawingModal && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-admin-muted">
              <span>分类：{drawingModal.category}</span>
              <span>日期：{drawingModal.date}</span>
              <span>格式：{drawingModal.fileType}</span>
              <span>大小：{drawingModal.fileSize}</span>
            </div>
            <div className="flex h-[360px] items-center justify-center rounded border border-dashed border-admin-border bg-gray-50 text-admin-muted">
              <div className="text-center">
                <FileText size={40} className="mx-auto mb-2 text-gray-300" />
                <div className="text-sm">{drawingModal.name}</div>
                <div className="text-xs mt-1">图纸预览（实际系统将加载 CAD/DWG 转换后的图纸影像）</div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <DevNote
        id="screen-drilldown"
        title="数据钻取弹窗（数据溯源）"
        summary="点击图表数据点后逐层下钻，最终层展示测点/设备/告警详情、计算公式、原始时序数据，支持导出与3D定位"
        items={[
          { label: "触发方式", value: "点击任一图表数据点（机组出力/水头流量/告警趋势/在线率/玫瑰图/健康图/运行趋势）→ useChartDrillDown 依据 chartId+seriesIndex+值生成 DrillDownSession 并打开弹窗" },
          { label: "层级钻取", value: "面包屑导航 + 分类/对象表逐层下钻（drillInto/goToLevel），非最终层不可导出与定位；弹窗标题展示当前层级数值" },
          { label: "最终层内容", value: "三个Tab：数据源测点信息（测点编号/名称/KKS编码/采集装置/采样频率/数据质量）、指标计算公式（公式与参与变量及来源）、原始明细数据（近10小时20条采样，异常行标红）；存在超标时顶部红条展示阈值与判定规则" },
          { label: "操作", value: "跳转实时监测页面（仅测点类型）；导出原始时序数据 → 生成 CSV（含BOM，文件名 数据溯源_KKS编码_时间戳.csv）；3D模型定位 → 提示相机飞行定位到该测点所属模型" },
          { label: "异常判定", value: "isAbnormal：按阈值规则判断（如机组出力>180MW、压力>2.0MPa、振动>4.5mm/s等），异常时附带报警记录（时间/级别/处理中）" },
          { label: "后续步骤", value: "正式系统：钻取数据由测点元数据服务+历史数据库返回，3D定位联动 UE5 相机" },
        ]}
      >
      <DrillDownModal
        open={drillDownOpen}
        data={drillDownData}
        onClose={() => setDrillDownOpen(false)}
        onExport={(data) => {
          const headers = ["测点名称", "设备名称", "KKS编码", "采集时间", "指标值", "单位", "数据质量"];
          const rows: string[][] = [[data.pointName, data.deviceName, data.kksCode, data.timestamp, data.metricValue, data.unit, "正常"]];
          if (data.rawData?.length) {
            data.rawData.forEach((r) => {
              rows.push([data.pointName, data.deviceName, data.kksCode, r.timestamp, r.value, r.unit, r.quality]);
            });
          }
          const csv = [headers, ...rows].map((row) => row.map(c => `"${c}"`).join(",")).join("\n");
          const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `数据溯源_${data.kksCode || data.pointName}_${Date.now()}.csv`;
          a.click();
          URL.revokeObjectURL(url);
        }}
        onLocateBIM={handleLocateBIM}
      />
      </DevNote>
    </div>
  );
}
