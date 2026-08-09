import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ReactECharts from "echarts-for-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { TopNav } from "@/components/screen/TopNav";
import { Scene3D } from "@/components/screen/Scene3D";
import { BottomBar } from "@/components/screen/BottomBar";
import { TreePanel, type TreeNodeData } from "@/components/common/TreePanel";
import DrillDownModal, { type DrillDownData } from "@/components/screen/DrillDownModal";
import { useChartDrillDown } from "@/components/screen/useChartDrillDown";
import { message } from "@/components/common/Message";
import {
  overviewTreeData,
  equipmentTreeData,
  pipelineTreeData,
  panoramaTreeData,
  overallStats,
  equipmentInfo,
  componentInfo,
  generateNodeInfo,
} from "@/mock/screen";
import { systems, alarms, screenStats } from "@/mock/index";

const ONLINE_COUNT = 230;
const OFFLINE_COUNT = 18;

const labelMap: Record<string, string> = {
  code: "编码",
  name: "名称",
  type: "类型",
  system: "所属系统",
  major: "所属专业",
  location: "安装位置",
  model: "型号",
  manufacturer: "厂家",
  commissionDate: "投运日期",
  spec: "规格",
  material: "材质",
  length: "长度/数量",
  position: "所属位置",
  usage: "所属用途",
  count: "包含数量",
};

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

  const [viewMode, setViewMode] = useState<"overview" | "interior">("overview");
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

  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownData, setDrillDownData] = useState<DrillDownData | null>(null);
  const chartInstancesRef = useRef<Map<string, any>>(new Map());

  const handleDrillDown = useCallback((data: DrillDownData) => {
    setDrillDownData(data);
    setDrillDownOpen(true);
  }, []);

  const handleLocateBIM = useCallback((kksCode: string) => {
    message.info(
      `实际项目中：三维相机将飞行定位到测点“${kksCode}”所属模型，闪烁高亮并在右侧打开对应运行数据。`
    );
    setDrillDownOpen(false);
  }, []);

  const { bindChartEvents } = useChartDrillDown({
    onDrillDown: handleDrillDown,
    onLocateBIM: handleLocateBIM,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const onChartReady = useCallback(
    (chartId: string, meta: { deviceName: string; metricPrefix: string }) =>
      (instance: any) => {
        if (!instance || !instance.on) return;
        chartInstancesRef.current.set(chartId, instance);
        bindChartEvents(chartId, instance, meta);
      },
    [bindChartEvents]
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
      overview: "返回工程总览默认观察点，加载大坝、厂房、水库和开关站等宏观对象",
      panorama: "切换到厂房全景，综合显示建筑、设备和管网模型",
      equipment: "切换到设备总览，淡化管网并按运行状态高亮设备",
      pipeline: "切换到管路总览，淡化设备并按所属系统高亮管线",
    };
    message.info(`实际项目中：三维相机将平滑${sceneDescriptions[scene]}。`);
  };

  const handleBackToOverview = () => {
    setViewMode("overview");
    setFocusMode("panorama");
    setSelectedNode(undefined);
    setOverviewActiveTab("stats");
    message.info(
      "实际项目中：三维相机将退出厂房内部并飞行返回工程总览，恢复大坝、库区、厂房和开关站的全局视角。"
    );
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

  const handleSceneSelectNode = (title: string) => {
    setSelectedNode(
      { key: title, title, code: "", type: "component" } as TreeNodeData
    );
    setRightActiveTab("basic");
  };

  const handleGlobalReset = () => {
    setViewMode("overview");
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
    const waterFlowOption = {
      backgroundColor: "transparent",
      grid: { top: 28, right: 40, bottom: 20, left: 38 },
      tooltip: { trigger: "axis" },
      legend: {
        data: ["水头", "流量"],
        textStyle: { color: "#8a94a6", fontSize: 9 },
        top: 0,
        right: 0,
        itemWidth: 8,
        itemHeight: 5,
        itemGap: 4,
      },
      xAxis: {
        type: "category",
        data: ["00", "04", "08", "12", "16", "20", "24"],
        axisLine: { lineStyle: { color: "rgba(0, 180, 255, 0.3)" } },
        axisLabel: { color: "#8a94a6", fontSize: 9 },
        axisTick: { show: false },
      },
      yAxis: [
        {
          type: "value",
          name: "水头(m)",
          nameTextStyle: { color: "#52c41a", fontSize: 9 },
          min: 120,
          max: 145,
          axisLabel: { color: "#8a94a6", fontSize: 9 },
          splitLine: { lineStyle: { color: "rgba(0, 180, 255, 0.1)" } },
        },
        {
          type: "value",
          name: "流量(m³/s)",
          nameTextStyle: { color: "#00b4ff", fontSize: 9 },
          min: 100,
          max: 140,
          axisLabel: { color: "#8a94a6", fontSize: 9 },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: "水头",
          type: "line",
          yAxisIndex: 0,
          data: [137.5, 138.2, 137.8, 136.9, 137.2, 138.0, 137.5],
          smooth: true,
          symbol: "none",
          itemStyle: { color: "#52c41a" },
          lineStyle: { width: 1.5 },
        },
        {
          name: "流量",
          type: "line",
          yAxisIndex: 1,
          data: [118.5, 122.3, 120.1, 115.8, 117.2, 121.5, 119.0],
          smooth: true,
          symbol: "none",
          itemStyle: { color: "#00b4ff" },
          lineStyle: { width: 1.5 },
        },
      ],
    };

    const alarmTrendOption = {
      backgroundColor: "transparent",
      grid: { top: 20, right: 10, bottom: 20, left: 35 },
      tooltip: { trigger: "axis" },
      xAxis: {
        type: "category",
        data: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
        axisLine: { lineStyle: { color: "rgba(0, 180, 255, 0.3)" } },
        axisLabel: { color: "#8a94a6", fontSize: 9 },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        axisLabel: { color: "#8a94a6", fontSize: 9 },
        splitLine: { lineStyle: { color: "rgba(0, 180, 255, 0.1)" } },
      },
      series: [{
        type: "bar",
        data: [5, 2, 4, 1, 6, 2, 3],
        itemStyle: {
          color: {
            type: "linear", x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "#faad14" },
              { offset: 1, color: "rgba(250, 173, 20, 0.3)" },
            ],
          },
        },
        barWidth: "50%",
      }],
    };

    const onlineRateOption = {
      backgroundColor: "transparent",
      grid: { top: 20, right: 10, bottom: 20, left: 35 },
      tooltip: { trigger: "axis" },
      xAxis: {
        type: "category",
        data: ["00", "04", "08", "12", "16", "20", "24"],
        axisLine: { lineStyle: { color: "rgba(0, 180, 255, 0.3)" } },
        axisLabel: { color: "#8a94a6", fontSize: 9 },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        min: 88,
        max: 100,
        axisLabel: { color: "#8a94a6", fontSize: 9, formatter: "{value}%" },
        splitLine: { lineStyle: { color: "rgba(0, 180, 255, 0.1)" } },
      },
      series: [{
        type: "line",
        data: [92.7, 93.1, 92.3, 93.5, 92.7, 93.1, 92.7],
        smooth: true,
        symbol: "none",
        itemStyle: { color: "#00b4ff" },
        lineStyle: { width: 1.5 },
        areaStyle: {
          color: {
            type: "linear", x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(0, 180, 255, 0.3)" },
              { offset: 1, color: "rgba(0, 180, 255, 0)" },
            ],
          },
        },
      }],
    };

    return (
      <div className="flex flex-col h-full overflow-auto p-2 gap-2">
        {/* 区域1：统计卡片 */}
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="设备总数" value={screenStats.equipmentTotal} color="#00b4ff" />
          <StatCard label="管路总数" value={screenStats.pipelineTotal} color="#00b4ff" />
          <StatCard label="在线设备" value={ONLINE_COUNT} color="#52c41a" />
          <StatCard label="今日告警" value={alarms.length} color="#faad14" />
        </div>

        {/* 区域2：机组出力趋势 */}
        <div className="bg-black/30 border border-[#40A9FF]/25 p-2 rounded-none">
          <div className="text-xs text-[#40A9FF] font-medium mb-1" style={{ textShadow: "0 0 6px rgba(64,169,255,0.5)" }}>
            机组出力趋势 (MW)
          </div>
          <ReactECharts
            option={powerTrendOption}
            style={{ height: 110 }}
            onChartReady={onChartReady("left-trend", { deviceName: "1#-4#机组", metricPrefix: "机组出力" })}
          />
        </div>

        {/* 区域3：水头/流量监测 */}
        <div className="bg-black/30 border border-[#40A9FF]/25 p-2 rounded-none">
          <div className="text-xs text-green-400 font-medium mb-1" style={{ textShadow: "0 0 8px rgba(82, 196, 26, 0.6)" }}>
            水头/流量监测
          </div>
          <ReactECharts
            option={waterFlowOption}
            style={{ height: 90 }}
            onChartReady={onChartReady("left-waterflow", { deviceName: "全厂机组", metricPrefix: "水头/流量" })}
          />
        </div>

        {/* 区域4：告警数量趋势 */}
        <div className="bg-black/30 border border-[#40A9FF]/25 p-2 rounded-none">
          <div className="text-xs text-orange-400 font-medium mb-1" style={{ textShadow: "0 0 8px rgba(250, 173, 20, 0.6)" }}>
            告警数量趋势
          </div>
          <ReactECharts
            option={alarmTrendOption}
            style={{ height: 80 }}
            onChartReady={onChartReady("left-alarm", { deviceName: "全厂设备", metricPrefix: "告警" })}
          />
        </div>

        {/* 区域5：设备在线率 */}
        <div className="bg-black/30 border border-[#40A9FF]/25 p-2 rounded-none">
          <div className="text-xs text-[#40A9FF] font-medium mb-1" style={{ textShadow: "0 0 6px rgba(64,169,255,0.5)" }}>
            设备在线率 (%)
          </div>
          <ReactECharts
            option={onlineRateOption}
            style={{ height: 80 }}
            onChartReady={onChartReady("left-online", { deviceName: "全厂设备", metricPrefix: "在线率" })}
          />
        </div>

        {/* 区域6：辅机系统状态 */}
        <div className="bg-black/30 border border-[#40A9FF]/25 p-2 rounded-none">
          <div className="text-xs text-[#40A9FF] font-medium mb-2" style={{ textShadow: "0 0 6px rgba(64,169,255,0.5)" }}>
            辅机系统状态
          </div>
          <div className="space-y-1.5">
            {systems.map((systemName) => (
              <div key={systemName} className="flex items-center justify-between text-xs">
                <span className="text-screen-text">{systemName}</span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" style={{ boxShadow: "0 0 4px rgba(82, 196, 26, 0.6)" }}></span>
                  <span className="text-green-400">运行中</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 区域7：实时告警列表 */}
        <div className="bg-black/30 border border-[#40A9FF]/25 p-2 rounded-none">
          <div className="text-xs text-[#40A9FF] font-medium mb-2" style={{ textShadow: "0 0 6px rgba(64,169,255,0.5)" }}>
            实时告警列表
          </div>
          <div className="space-y-1.5">
            {alarms.slice(0, 5).map((alarm) => (
              <div key={alarm.id} className="bg-black/30 px-2 py-1.5 text-xs border-l-2 rounded-none" style={{ borderLeftColor: alarm.level === "serious" ? "#ff4d4f" : alarm.level === "normal" ? "#faad14" : "#40A9FF" }}>
                <div className="flex justify-between items-center">
                  <span className="text-screen-text font-medium">{alarm.equipmentName}</span>
                  <span className={`px-1.5 py-0.5 rounded-nonetext-xs ${alarm.level === "serious" ? "bg-red-500/20 text-red-400" : alarm.level === "normal" ? "bg-orange-500/20 text-orange-400" : "bg-blue-500/20 text-blue-400"}`}>
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
    const basic = nodeInfo?.basic || {};
    const entries = Object.entries(basic);
    if (entries.length === 0) {
      return (
        <div className="p-3 text-center">
          <div className="text-xs text-[#40A9FF] font-medium mb-3" style={{ textShadow: "0 0 6px rgba(64,169,255,0.5)" }}>
            系统设备分布
          </div>
          <div className="bg-black/30 border border-[#40A9FF]/25 p-2 mb-3 rounded-none">
            <ReactECharts
              option={{
                backgroundColor: "transparent",
                tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
                legend: {
                  orient: "vertical",
                  right: 10,
                  top: "center",
                  textStyle: { color: "#8a94a6", fontSize: 9 },
                  itemWidth: 8,
                  itemHeight: 6,
                },
                series: [
                  {
                    type: "pie",
                    radius: ["40%", "70%"],
                    center: ["40%", "50%"],
                    data: screenStats.equipmentBySystem,
                    itemStyle: {
                      borderColor: "rgba(0, 180, 255, 0.3)",
                      borderWidth: 1,
                    },
                    label: { show: false },
                    emphasis: {
                      label: { show: true, fontSize: 10, fontWeight: "bold", color: "#00b4ff" },
                    },
                  },
                ],
              }}
              style={{ height: 150 }}
              onChartReady={onChartReady("overview-pie-small", { deviceName: "全厂设备", metricPrefix: "系统分布" })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-blue-900/30 border border-[#40A9FF]/25 rounded-nonep-2">
              <div className="text-xs text-screen-muted">设备总数</div>
              <div className="text-xl text-[#40A9FF] font-bold mt-1">{screenStats.equipmentTotal}</div>
            </div>
            <div className="bg-green-900/30 border border-[#40A9FF]/25 rounded-nonep-2">
              <div className="text-xs text-screen-muted">管路总数</div>
              <div className="text-xl text-green-400 font-bold mt-1">{screenStats.pipelineTotal}</div>
            </div>
            <div className="bg-orange-900/30 border border-[#40A9FF]/25 rounded-nonep-2">
              <div className="text-xs text-screen-muted">在线设备</div>
              <div className="text-xl text-orange-400 font-bold mt-1">{ONLINE_COUNT}</div>
            </div>
            <div className="bg-purple-900/30 border border-[#40A9FF]/25 rounded-nonep-2">
              <div className="text-xs text-screen-muted">图纸总数</div>
              <div className="text-xl text-purple-400 font-bold mt-1">{screenStats.drawingTotal}</div>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="p-3">
        <div className="text-xs text-[#40A9FF] font-medium mb-2" style={{ textShadow: "0 0 6px rgba(64,169,255,0.5)" }}>
          基础信息
        </div>
        <div className="space-y-1.5">
          {entries.map(([k, v]) => (
            <div key={k} className="flex text-xs bg-black/30 rounded-nonepx-2 py-1.5 border-l-2 border-[#40A9FF]/50">
              <span className="w-20 text-screen-muted flex-shrink-0">
                {labelMap[k] || k}
              </span>
              <span className="flex-1 text-screen-text">{String(v)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTechParamsTab = () => {
    if (!nodeInfo?.techParams || nodeInfo.techParams.length === 0) {
      return (
        <div className="p-3 text-center">
          <div className="text-xs text-[#40A9FF] font-medium mb-2">技术参数</div>
          <div className="text-xs text-screen-muted py-4">暂无技术参数信息</div>
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
              {nodeInfo.techParams.map((p: any, i: number) => (
                <tr key={i} className="border-t border-screen-border">
                  <td className="px-2 py-1.5 text-screen-text">{p.name}</td>
                  <td className="px-2 py-1.5 text-screen-text">{p.value}</td>
                  <td className="px-2 py-1.5 text-screen-muted">{p.unit || "—"}</td>
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
          onChartReady={onChartReady("right-runtime", {
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
            onChartReady={onChartReady("overview-rose", { deviceName: "全厂设备", metricPrefix: "系统设备分布" })}
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
            onChartReady={onChartReady("overview-health-pie", { deviceName: "全厂设备", metricPrefix: "健康分布" })}
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
            onChartReady={onChartReady("overview-health-trend", { deviceName: "全厂设备", metricPrefix: "健康度" })}
          />
        </div>
      </div>
    </div>
  );

  const renderOverviewTabContent = () => {
    switch (overviewActiveTab) {
      case "stats":
        return renderOverviewStatsTab();
      case "realtime":
        return renderOverviewRealtimeTab();
      case "health":
        return renderOverviewHealthTab();
    }
  };

  const renderRightTabContent = () => {
    switch (rightActiveTab) {
      case "basic":
        return renderBasicInfoTab();
      case "tech":
        return renderTechParamsTab();
      case "runtime":
        return renderRuntimeTab();
      case "linked":
        return renderLinkedTab();
      case "history":
        return renderHistoryTab();
    }
  };

  return (
    <div className="w-full h-full flex flex-col screen-bg screen-dark overflow-hidden">
      <TopNav
        viewMode={viewMode}
        focusMode={focusMode}
        onSceneChange={handleSceneChange}
        onBackToOverview={handleBackToOverview}
      />

      <div className="flex-1 flex overflow-hidden">
        {leftPanelVisible ? (
          <div className="flex h-full flex-shrink-0 relative">
            <div className="w-[320px] bg-screen-panel border-r border-[#40A9FF]/25 flex flex-col relative">
              <button
                onClick={() => setLeftPanelVisible(false)}
                title="隐藏左侧栏"
                className="absolute top-1 left-1 z-10 w-5 h-5 flex items-center justify-center bg-black/40 border border-[#40A9FF]/30 text-screen-muted hover:text-white hover:border-[#40A9FF] transition-colors rounded-none"
              >
                <ChevronLeft size={12} />
              </button>
              <div className="px-7 py-2 border-b border-[#40A9FF]/25">
                <span className="text-sm font-medium text-white">
                  {leftPanelMode === "chart" ? "信息图表" : "结构导航"}
                </span>
              </div>
              <div className="flex-1 overflow-hidden">
                {leftPanelMode === "chart"
                  ? renderLeftChartContent()
                  : renderLeftTreeContent()}
              </div>
            </div>
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
          onBackToOverview={handleBackToOverview}
        />

        {rightPanelVisible ? (
          <div className="w-[300px] flex-shrink-0 bg-screen-panel border-l border-[#40A9FF]/25 flex flex-col relative">
            <button
              onClick={() => setRightPanelVisible(false)}
              title="隐藏右侧栏"
              className="absolute top-1 right-1 z-10 w-5 h-5 flex items-center justify-center bg-black/40 border border-[#40A9FF]/30 text-screen-muted hover:text-white hover:border-[#40A9FF] transition-colors rounded-none"
            >
              <ChevronRight size={12} />
            </button>
            <div className="px-3 py-2 border-b border-[#40A9FF]/25">
              <span className="text-sm font-medium text-white">
                {selectedNode ? "属性信息" : "统计信息"}
              </span>
            </div>
            <div className="flex border-b border-[#40A9FF]/25">
              {(selectedNode ? RIGHT_TABS : OVERVIEW_TABS).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    if (selectedNode) {
                      setRightActiveTab(tab.key);
                    } else {
                      setOverviewActiveTab(tab.key);
                    }
                  }}
                  className={`flex-1 py-1.5 text-xs transition-colors ${
                    (selectedNode ? rightActiveTab : overviewActiveTab) === tab.key
                      ? "text-[#40A9FF] border-b-2 border-[#40A9FF]"
                      : "text-screen-muted hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-auto">
              {selectedNode ? renderRightTabContent() : renderOverviewTabContent()}
            </div>
          </div>
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
    </div>
  );
}
