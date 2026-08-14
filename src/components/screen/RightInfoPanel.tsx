import { useState, useEffect, useRef, useCallback } from "react";
import {
  PanelRightClose,
  PanelRightOpen,
  FileText,
  Settings2,
  FolderOpen,
  Gauge,
  Download,
  Eye,
  Radio,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import type { TreeNodeData } from "@/components/common/TreePanel";
import { overallStats, equipmentInfo, componentInfo, generateNodeInfo } from "@/mock/screen";
import DocumentPreviewModal from "@/pages/document/components/DocumentPreviewModal";
import HistoricalTrendModal from "./HistoricalTrendModal";
import { message } from "@/components/common/Message";
import type { DocumentItem } from "@/types";

interface RightInfoPanelProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  selectedNode?: TreeNodeData;
  viewMode: "overview" | "interior";
  focusMode: "panorama" | "equipment" | "pipeline";
}

type TabKey = "basic" | "tech" | "documents" | "design" | "realtime";

type TrendDirection = "up" | "down" | "flat";

interface MeasurementPoint {
  name: string;
  value: number;
  unit: string;
  trend: TrendDirection;
  baseValue: number;
  fluctuation: number;
}

const initialMeasurements: MeasurementPoint[] = [
  { name: "有功功率", value: 152.3, unit: "MW", trend: "up", baseValue: 152.3, fluctuation: 5 },
  { name: "无功功率", value: 21.5, unit: "MVar", trend: "flat", baseValue: 21.5, fluctuation: 3 },
  { name: "定子电压", value: 13.8, unit: "kV", trend: "flat", baseValue: 13.8, fluctuation: 0.3 },
  { name: "定子电流", value: 6520, unit: "A", trend: "down", baseValue: 6520, fluctuation: 150 },
  { name: "轴承温度", value: 45.2, unit: "℃", trend: "up", baseValue: 45.2, fluctuation: 2 },
  { name: "冷却水流量", value: 128.5, unit: "m³/h", trend: "flat", baseValue: 128.5, fluctuation: 4 },
];

export function RightInfoPanel({
  collapsed,
  onToggleCollapse,
  selectedNode,
  viewMode,
  focusMode,
}: RightInfoPanelProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("basic");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [realtimeMeasurements, setRealtimeMeasurements] = useState<MeasurementPoint[]>(initialMeasurements);
  const [equipmentStatus, setEquipmentStatus] = useState<"running" | "stopped" | "fault">("running");
  const [runDuration, setRunDuration] = useState<{ hours: number; minutes: number }>({ hours: 12, minutes: 35 });
  const [realtimeModalOpen, setRealtimeModalOpen] = useState(false);
  const [currentMeasurement, setCurrentMeasurement] = useState<MeasurementPoint | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [overviewTab, setOverviewTab] = useState<"stats" | "realtime" | "valve" | "flow" | "health">("stats");

  const tabs = [
    { key: "basic" as TabKey, label: "基本信息", icon: FileText },
    { key: "tech" as TabKey, label: "技术参数", icon: Settings2 },
    { key: "documents" as TabKey, label: "关联资料", icon: FolderOpen },
    { key: "design" as TabKey, label: "设计参数", icon: Gauge },
    { key: "realtime" as TabKey, label: "实时状态", icon: Radio },
  ];

  // 获取选中节点的信息
  const getNodeInfo = () => {
    if (!selectedNode) return null;
    // 优先从设备信息中获取
    if (equipmentInfo[selectedNode.title]) {
      return equipmentInfo[selectedNode.title];
    }
    // 从管件信息中获取
    if (componentInfo[selectedNode.title]) {
      return componentInfo[selectedNode.title];
    }
    // 回退：为系统/位置/专业/用途等父级节点生成汇总信息
    const generated = generateNodeInfo(selectedNode);
    if (generated) return generated;
    return null;
  };

  const nodeInfo: any = getNodeInfo();

  // 如果指定了 tab，则切换
  useEffect(() => {
    if (selectedNode?.data?.tab === "documents" && activeTab !== "documents") {
      setActiveTab("documents");
    }
  }, [selectedNode]);

  useEffect(() => {
    setRealtimeMeasurements(initialMeasurements);
    setEquipmentStatus("running");
    setRunDuration({ hours: 12, minutes: 35 });
  }, [selectedNode]);

  const refreshRealtimeData = useCallback(() => {
    setRealtimeMeasurements((prev) =>
      prev.map((m) => {
        const delta = (Math.random() - 0.5) * m.fluctuation;
        const newVal = Number((m.baseValue + delta).toFixed(m.unit === "A" ? 0 : 2));
        let trend: TrendDirection = "flat";
        if (newVal > m.value + 0.01) trend = "up";
        else if (newVal < m.value - 0.01) trend = "down";
        return { ...m, value: newVal, trend };
      })
    );
    setRunDuration((prev) => {
      let newMin = prev.minutes + 1;
      let newHour = prev.hours;
      if (newMin >= 60) {
        newMin = 0;
        newHour += 1;
      }
      return { hours: newHour, minutes: newMin };
    });
  }, []);

  useEffect(() => {
    if (activeTab === "realtime" && selectedNode) {
      refreshTimerRef.current = setInterval(refreshRealtimeData, 5000);
      return () => {
        if (refreshTimerRef.current) {
          clearInterval(refreshTimerRef.current);
          refreshTimerRef.current = null;
        }
      };
    }
  }, [activeTab, selectedNode, refreshRealtimeData]);

  if (collapsed) {
    return (
      <div className="w-10 bg-screen-panel border-l border-[#40A9FF]/25 flex flex-col items-center py-2">
        <button
          onClick={onToggleCollapse}
          className="text-screen-muted hover:text-white p-1"
        >
          <PanelRightOpen size={18} />
        </button>
      </div>
    );
  }

  // 工程总览视角下显示统计信息
  const renderOverviewStats = () => (
    <div className="flex flex-col h-full">
      {/* 标签卡 */}
      <div className="flex border-b border-[#40A9FF]/25">
        {[
          { key: "stats" as const, label: "统计" },
          { key: "realtime" as const, label: "实时状态" },
          { key: "valve" as const, label: "阀门开度" },
          { key: "flow" as const, label: "流量监测" },
          { key: "health" as const, label: "设备健康" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setOverviewTab(tab.key)}
            className={`flex-1 py-2 text-xs transition-colors ${
              overviewTab === tab.key
                ? "text-blue-400 border-b-2 border-blue-500"
                : "text-screen-muted hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-auto p-3">
        {overviewTab === "stats" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-900/30 border border-blue-700/30 rounded-nonep-3">
                <div className="text-xs text-screen-muted">设备总数</div>
                <div className="text-2xl text-blue-400 font-bold mt-1">{overallStats.equipmentTotal}</div>
              </div>
              <div className="bg-green-900/30 border border-green-700/30 rounded-nonep-3">
                <div className="text-xs text-screen-muted">管路总数</div>
                <div className="text-2xl text-green-400 font-bold mt-1">{overallStats.pipelineTotal}</div>
              </div>
              <div className="bg-purple-900/30 border border-purple-700/30 rounded-nonep-3">
                <div className="text-xs text-screen-muted">管件总数</div>
                <div className="text-2xl text-purple-400 font-bold mt-1">{overallStats.componentTotal}</div>
              </div>
              <div className="bg-orange-900/30 border border-orange-700/30 rounded-nonep-3">
                <div className="text-xs text-screen-muted">阀门总数</div>
                <div className="text-2xl text-orange-400 font-bold mt-1">{overallStats.valveTotal}</div>
              </div>
            </div>
            <div className="text-sm text-white font-medium mt-4 mb-2">按系统分类统计</div>
            <div className="space-y-2">
              {overallStats.bySystem.map((item) => (
                <div key={item.system} className="flex items-center justify-between bg-black/30 rounded-nonepx-3 py-2">
                  <span className="text-sm text-white">{item.system}</span>
                  <div className="flex gap-3 text-xs">
                    <span className="text-blue-400">设备 {item.equipment}</span>
                    <span className="text-green-400">管路 {item.pipeline}</span>
                    <span className="text-purple-400">管件 {item.component}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {overviewTab === "realtime" && (
          <div className="space-y-2">
            <div className="text-xs text-screen-muted mb-2">关键设备实时运行状态</div>
            {[
              { name: "1#水泵水轮机", status: "运行", power: "152.8 MW", color: "green" },
              { name: "2#水泵水轮机", status: "运行", power: "148.5 MW", color: "green" },
              { name: "3#水泵水轮机", status: "运行", power: "155.2 MW", color: "green" },
              { name: "4#水泵水轮机", status: "停机", power: "0 MW", color: "gray" },
              { name: "1#主变压器", status: "运行", power: "150 MVA", color: "green" },
              { name: "2#主变压器", status: "运行", power: "150 MVA", color: "green" },
              { name: "1#技术供水泵", status: "运行", power: "55 kW", color: "green" },
              { name: "2#技术供水泵", status: "告警", power: "52 kW", color: "yellow" },
              { name: "1#低压空压机", status: "运行", power: "75 kW", color: "green" },
              { name: "1#渗漏排水泵", status: "停机", power: "0 kW", color: "gray" },
            ].map((eq) => (
              <div key={eq.name} className="flex items-center justify-between bg-black/30 rounded-nonepx-3 py-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${eq.color === "green" ? "bg-green-400" : eq.color === "yellow" ? "bg-yellow-400" : "bg-gray-500"} ${eq.status === "运行" ? "animate-pulse" : ""}`} />
                  <span className="text-xs text-white">{eq.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-screen-muted">{eq.power}</span>
                  <span className={`text-xs ${eq.color === "green" ? "text-green-400" : eq.color === "yellow" ? "text-yellow-400" : "text-gray-500"}`}>{eq.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {overviewTab === "valve" && (
          <div className="space-y-2">
            <div className="text-xs text-screen-muted mb-2">关键阀门开度状态</div>
            {[
              { name: "技术供水总阀", opening: 100, status: "全开" },
              { name: "1#机组进水阀", opening: 100, status: "全开" },
              { name: "2#机组进水阀", opening: 100, status: "全开" },
              { name: "3#机组进水阀", opening: 75, status: "调节" },
              { name: "4#机组进水阀", opening: 0, status: "全关" },
              { name: "厂房排水阀", opening: 30, status: "调节" },
              { name: "消防水总阀", opening: 100, status: "全开" },
              { name: "透平油供油阀", opening: 50, status: "调节" },
            ].map((valve) => (
              <div key={valve.name} className="bg-black/30 rounded-nonepx-3 py-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-white">{valve.name}</span>
                  <span className={`text-xs ${valve.status === "全开" ? "text-green-400" : valve.status === "全关" ? "text-red-400" : "text-yellow-400"}`}>
                    {valve.opening}% · {valve.status}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${valve.opening === 100 ? "bg-green-500" : valve.opening === 0 ? "bg-red-500" : "bg-yellow-500"}`}
                    style={{ width: `${valve.opening}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {overviewTab === "flow" && (
          <div className="space-y-3">
            <div className="text-xs text-screen-muted mb-2">关键测点流量监测</div>
            {[
              { name: "水库入库流量", value: 1280, unit: "m³/s", max: 2000, color: "#36cfc9" },
              { name: "水库出库流量", value: 1150, unit: "m³/s", max: 2000, color: "#40a9ff" },
              { name: "1#机组流量", value: 320, unit: "m³/s", max: 400, color: "#73d13d" },
              { name: "2#机组流量", value: 315, unit: "m³/s", max: 400, color: "#73d13d" },
              { name: "3#机组流量", value: 325, unit: "m³/s", max: 400, color: "#73d13d" },
              { name: "4#机组流量", value: 0, unit: "m³/s", max: 400, color: "#b37feb" },
              { name: "技术供水总流量", value: 580, unit: "m³/h", max: 800, color: "#ffc53d" },
              { name: "厂房排水流量", value: 120, unit: "m³/h", max: 300, color: "#ff85c0" },
            ].map((item) => (
              <div key={item.name} className="bg-black/30 rounded-nonepx-3 py-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-white">{item.name}</span>
                  <span className="text-sm font-bold" style={{ color: item.color }}>{item.value} {item.unit}</span>
                </div>
                <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(item.value / item.max) * 100}%`, background: item.color }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {overviewTab === "health" && (
          <div className="space-y-3">
            <div className="text-xs text-screen-muted mb-2">设备健康状态评估</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-900/30 border border-green-700/30 rounded-nonep-3 text-center">
                <div className="text-xs text-screen-muted">健康设备</div>
                <div className="text-2xl text-green-400 font-bold mt-1">146</div>
                <div className="text-[10px] text-green-400/70 mt-1">93.6%</div>
              </div>
              <div className="bg-yellow-900/30 border border-yellow-700/30 rounded-nonep-3 text-center">
                <div className="text-xs text-screen-muted">关注设备</div>
                <div className="text-2xl text-yellow-400 font-bold mt-1">8</div>
                <div className="text-[10px] text-yellow-400/70 mt-1">5.1%</div>
              </div>
              <div className="bg-orange-900/30 border border-orange-700/30 rounded-nonep-3 text-center">
                <div className="text-xs text-screen-muted">异常设备</div>
                <div className="text-2xl text-orange-400 font-bold mt-1">2</div>
                <div className="text-[10px] text-orange-400/70 mt-1">1.3%</div>
              </div>
              <div className="bg-blue-900/30 border border-blue-700/30 rounded-nonep-3 text-center">
                <div className="text-xs text-screen-muted">综合健康度</div>
                <div className="text-2xl text-blue-400 font-bold mt-1">92.5</div>
                <div className="text-[10px] text-blue-400/70 mt-1">分</div>
              </div>
            </div>
            <div className="text-xs text-white font-medium mt-3 mb-2">重点关注设备</div>
            <div className="space-y-2">
              {[
                { name: "2#技术供水泵", score: 72, issue: "轴承温度偏高", level: "yellow" },
                { name: "1#低压空压机", score: 68, issue: "排气压力波动", level: "yellow" },
                { name: "3#机组进水阀", score: 65, issue: "密封圈老化", level: "orange" },
                { name: "4#水泵水轮机", score: 45, issue: "计划停机检修", level: "red" },
              ].map((eq) => (
                <div key={eq.name} className="bg-black/30 rounded-nonepx-3 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white">{eq.name}</span>
                    <span className={`text-xs font-bold ${eq.level === "yellow" ? "text-yellow-400" : eq.level === "orange" ? "text-orange-400" : "text-red-400"}`}>
                      {eq.score}分
                    </span>
                  </div>
                  <div className="text-[10px] text-screen-muted">{eq.issue}</div>
                  <div className="h-1 bg-gray-700 rounded-full overflow-hidden mt-1">
                    <div className={`h-full rounded-full ${eq.level === "yellow" ? "bg-yellow-500" : eq.level === "orange" ? "bg-orange-500" : "bg-red-500"}`} style={{ width: `${eq.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // 微观视图信息面板 - 显示当前视图的概览信息
  const renderInteriorInfo = () => (
    <div className="p-4 space-y-4">
      {/* 视图标题 */}
      <div className="text-center py-3 border-b border-[#40A9FF]/25">
        <div className="text-lg text-[#40A9FF] font-bold">
          {focusMode === "panorama" ? "坝后厂房全景" : 
           focusMode === "equipment" ? "设备总览" : "管路总览"}
        </div>
        <div className="text-xs text-screen-muted mt-1">
          {focusMode === "panorama" ? "融合展示厂房结构、管网系统与设备分布" :
           focusMode === "equipment" ? "设备高亮显示，管网淡化，点击设备查看属性" :
           "管网高亮显示，设备淡化，点击管路查看属性"}
        </div>
      </div>

      {/* 坝后厂房五层信息 */}
      <div className="space-y-2">
        <div className="text-xs text-screen-muted font-medium">楼层信息</div>
        {[
          { name: "发电机层", elevation: "EL.660.5m", color: "blue", equipment: 12, pipeline: 8 },
          { name: "母线层", elevation: "EL.650.5m", color: "purple", equipment: 9, pipeline: 6 },
          { name: "水轮机层", elevation: "EL.645.0m", color: "green", equipment: 18, pipeline: 12 },
          { name: "蜗壳层", elevation: "EL.630.0m", color: "yellow", equipment: 6, pipeline: 5 },
          { name: "尾水管层", elevation: "EL.615.0m", color: "cyan", equipment: 4, pipeline: 3 },
        ].map((floor) => (
          <div key={floor.name} className="bg-black/30 rounded-nonepx-3 py-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-white">{floor.name}</span>
              <span className="text-xs text-screen-muted">{floor.elevation}</span>
            </div>
            <div className="flex gap-4 text-xs">
              <span className="text-blue-400">设备 {floor.equipment}台</span>
              <span className="text-green-400">管路 {floor.pipeline}条</span>
            </div>
          </div>
        ))}
      </div>

      {/* 操作提示 */}
      <div className="bg-blue-900/20 border border-blue-700/30 rounded-nonep-3">
        <div className="text-xs text-blue-400 font-medium mb-2">操作提示</div>
        <ul className="text-xs text-screen-muted space-y-1">
          <li>• 使用左侧结构树导航定位设备或管路</li>
          <li>• 在3D场景中点击设备/管路查看详情</li>
          <li>• 使用右侧工具栏进行剖切、测量等操作</li>
          <li>• 点击顶部面包屑"工程总览"可返回宏观视图</li>
        </ul>
      </div>
    </div>
  );

  const renderEmpty = () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <FileText size={40} className="text-screen-muted mx-auto mb-2" />
        <p className="text-sm text-screen-muted">
          请从结构树或3D场景中选择设备查看属性
        </p>
      </div>
    </div>
  );

  const renderBasicInfo = () => {
    if (!nodeInfo?.basic) {
      return (
        <div className="text-sm text-screen-muted text-center py-8">
          暂无基本信息
        </div>
      );
    }
    const entries = Object.entries(nodeInfo.basic);
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
    return (
      <div className="p-3 space-y-2">
        {entries.map(([key, value]) => (
          <div key={key} className="flex text-sm">
            <span className="w-20 text-screen-muted flex-shrink-0">
              {labelMap[key] || key}
            </span>
            <span className="flex-1 text-white">{String(value)}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderTechParams = () => {
    if (!nodeInfo?.techParams || nodeInfo.techParams.length === 0) {
      return (
        <div className="text-sm text-screen-muted text-center py-8">
          暂无技术参数
        </div>
      );
    }
    return (
      <div className="p-3 space-y-2">
        {nodeInfo.techParams.map((param: any, index: number) => (
          <div key={index} className="flex text-sm">
            <span className="w-32 text-screen-muted flex-shrink-0">
              {param.name}
            </span>
            <span className="flex-1 text-white">
              {param.value} {param.unit}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderDocuments = () => {
    const linkedEquipments = nodeInfo?.linkedEquipments || [];
    const documents = nodeInfo?.documents || [];
    if (documents.length === 0 && linkedEquipments.length === 0) {
      return (
        <div className="text-sm text-screen-muted text-center py-8">
          暂无关联资料
        </div>
      );
    }
    return (
      <div className="p-3 space-y-4">
        {/* 关联设备（管件特有） */}
        {linkedEquipments.length > 0 && (
          <div>
            <div className="text-xs text-[#40A9FF] font-medium mb-2">关联设备</div>
            <div className="space-y-1.5">
              {linkedEquipments.map((eq: any, index: number) => (
                <div key={index} className="flex items-center justify-between bg-black/30 rounded-nonepx-3 py-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400">{eq.code}</span>
                    <span className="text-white">{eq.name}</span>
                  </div>
                  <span className="text-screen-muted">{eq.model}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* 关联资料 */}
        {documents.length > 0 && (
          <div>
            {linkedEquipments.length > 0 && (
              <div className="text-xs text-[#40A9FF] font-medium mb-2">关联资料</div>
            )}
            <table className="w-full text-xs">
              <thead>
                <tr className="text-screen-muted border-b border-[#40A9FF]/25">
                  <th className="text-left py-2">资料名称</th>
                  <th className="text-left py-2">分类</th>
                  <th className="text-left py-2">上传日期</th>
                  <th className="text-left py-2">操作</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc: any, index: number) => (
              <tr key={index} className="border-b border-[#40A9FF]/25/50">
                <td className="py-2 text-white">{doc.name}</td>
                <td className="py-2 text-screen-muted">{doc.category}</td>
                <td className="py-2 text-screen-muted">{doc.date}</td>
                <td className="py-2">
                  <div className="flex gap-2">
                    <button
                      className="text-blue-400 hover:text-blue-300"
                      title="预览"
                      onClick={() => {
                        // 构造预览用的文档对象
                        const previewItem: DocumentItem = {
                          id: Date.now() + index,
                          name: doc.name,
                          category: doc.category,
                          fileType: doc.fileType || "PDF",
                          fileSize: doc.fileSize || "2.0MB",
                          uploadUser: "系统管理员",
                          uploadTime: doc.date,
                          linkedType: "equipment",
                          linkedName: nodeInfo.basic?.name,
                        };
                        setPreviewDoc(previewItem);
                        setPreviewOpen(true);
                      }}
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      className="text-blue-400 hover:text-blue-300"
                      title="下载"
                      onClick={() => message.success(`开始下载：${doc.name}`)}
                    >
                      <Download size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderDesignParams = () => {
    const designParams = nodeInfo?.designParams || [];
    if (designParams.length === 0) {
      return (
        <div className="text-sm text-screen-muted text-center py-8">
          暂无设计参数
        </div>
      );
    }
    return (
      <div className="p-3">
        <div className="grid grid-cols-2 gap-3">
          {designParams.map((param: any, index: number) => (
            <div
              key={index}
              className="bg-black/30 border border-[#40A9FF]/25 rounded-nonep-3 text-center"
            >
              <div className="text-xs text-screen-muted">{param.name}</div>
              <div className="text-lg text-blue-400 font-bold mt-1">
                {param.value}
              </div>
              <div className="text-xs text-screen-muted">{param.unit}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-screen-muted mt-4 text-center">
          当前为设计参数，数据来源于设备台账录入
        </p>
      </div>
    );
  };

  const renderRealtimeStatus = () => {
    if (!nodeInfo) {
      return (
        <div className="text-sm text-screen-muted text-center py-8">
          暂无实时状态数据
        </div>
      );
    }

    const statusConfig = {
      running: { color: "bg-green-500", label: "运行", textColor: "text-green-400" },
      stopped: { color: "bg-gray-500", label: "停机", textColor: "text-gray-400" },
      fault: { color: "bg-red-500", label: "故障", textColor: "text-red-400" },
    };
    const status = statusConfig[equipmentStatus];

    const getTrendIcon = (trend: TrendDirection) => {
      if (trend === "up") return <TrendingUp size={14} className="text-red-400" />;
      if (trend === "down") return <TrendingDown size={14} className="text-green-400" />;
      return <Minus size={14} className="text-gray-400" />;
    };

    const getTrendText = (trend: TrendDirection) => {
      if (trend === "up") return "↑";
      if (trend === "down") return "↓";
      return "→";
    };

    return (
      <div className="p-3 space-y-4">
        <div className="bg-black/30 border border-[#40A9FF]/25 rounded-nonep-3">
          <div className="text-xs text-screen-muted mb-2">运行状态</div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${status.color}`}></span>
              <span className={`text-sm font-medium ${status.textColor}`}>{status.label}</span>
            </div>
            <div className="text-sm text-screen-muted">
              已运行 <span className="text-white font-medium">{runDuration.hours}</span>小时
              <span className="text-white font-medium">{runDuration.minutes}</span>分
            </div>
          </div>
        </div>

        <div>
          <div className="text-xs text-screen-muted mb-2">测点数据</div>
          <div className="space-y-1">
            {realtimeMeasurements.map((m, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-black/30 rounded-nonepx-3 py-2"
              >
                <span className="text-xs text-screen-muted w-20 flex-shrink-0">{m.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white font-bold">{m.value}</span>
                  <span className="text-xs text-screen-muted">{m.unit}</span>
                  {getTrendIcon(m.trend)}
                  <span className="text-xs" style={{ color: m.trend === "up" ? "#f87171" : m.trend === "down" ? "#4ade80" : "#9ca3af" }}>
                    {getTrendText(m.trend)}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setCurrentMeasurement(m);
                    setRealtimeModalOpen(true);
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  历史趋势
                </button>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-screen-muted text-center">
          数据每5秒自动刷新
        </p>
      </div>
    );
  };

  return (
    <>
      <div className="w-[360px] bg-screen-panel border-l border-[#40A9FF]/25 flex flex-col">
        {/* 标题 */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#40A9FF]/25">
          <span className="text-sm font-medium text-white">
            {selectedNode 
              ? "属性信息" 
              : viewMode === "overview" 
                ? "工程统计" 
                : focusMode === "equipment" 
                  ? "设备总览" 
                  : focusMode === "pipeline" 
                    ? "管路总览" 
                    : "厂房全景"}
          </span>
          <button
            onClick={onToggleCollapse}
            className="text-screen-muted hover:text-white"
          >
            <PanelRightClose size={18} />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-auto">
          {/* 宏观视图：未选择节点时显示统计信息 */}
          {viewMode === "overview" && !selectedNode ? (
            renderOverviewStats()
          ) : viewMode === "interior" && !selectedNode ? (
            // 微观视图：未选择节点时显示全景视图信息
            renderInteriorInfo()
          ) : !selectedNode ? (
            renderEmpty()
          ) : (
            <>
              {/* 标签卡 */}
              <div className="flex border-b border-[#40A9FF]/25">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex-1 flex flex-col items-center gap-1 py-2 text-xs transition-colors ${
                        activeTab === tab.key
                          ? "text-blue-400 border-b-2 border-blue-500"
                          : "text-screen-muted hover:text-white"
                      }`}
                    >
                      <Icon size={14} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
              {/* 标签内容 */}
              {activeTab === "basic" && renderBasicInfo()}
              {activeTab === "tech" && renderTechParams()}
              {activeTab === "documents" && renderDocuments()}
              {activeTab === "design" && renderDesignParams()}
              {activeTab === "realtime" && renderRealtimeStatus()}
            </>
          )}
        </div>
      </div>

      {/* 资料预览弹窗 */}
      <DocumentPreviewModal
        open={previewOpen}
        document={previewDoc}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewDoc(null);
        }}
      />

      {/* 历史趋势弹窗 */}
      <HistoricalTrendModal
        open={realtimeModalOpen}
        onClose={() => {
          setRealtimeModalOpen(false);
          setCurrentMeasurement(null);
        }}
        pointName={currentMeasurement?.name || ""}
        deviceName={nodeInfo?.basic?.name || selectedNode?.title || ""}
      />
    </>
  );
}
