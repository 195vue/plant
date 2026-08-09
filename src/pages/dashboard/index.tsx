import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ReactECharts from "echarts-for-react";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  GitBranch,
  FileText,
  Link2,
  AlertCircle,
  Activity,
  Network,
  TrendingUp as TrendingUpIcon,
} from "lucide-react";
import {
  screenStats,
  documents,
  codes,
  equipments,
  pipelines,
  operationLogs,
  alarms,
  drawings,
} from "@/mock";
import { message } from "@/components/common/Message";

export default function Dashboard() {
  const navigate = useNavigate();
  const [todoTab, setTodoTab] = useState<"all" | "approval" | "alert">("all");

  const today = new Date();
  const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
  const weekday = weekdays[today.getDay()];

  // ===== 统计计算 =====
  const totalCodes = codes.length;
  const linkedCodes = codes.filter((c) => c.isLinked).length;
  const unlinkedCodes = totalCodes - linkedCodes;
  const codeLinkRate = totalCodes > 0 ? Math.round((linkedCodes / totalCodes) * 100) : 0;

  const linkedEquipments = equipments.filter((e) => e.codeStatus === "linked").length;
  const unlinkedEquipments = equipments.filter((e) => e.codeStatus === "unlinked").length;

  const linkedPipelines = pipelines.filter((p) => p.codeStatus === "linked").length;
  const unlinkedPipelines = pipelines.filter((p) => p.codeStatus === "unlinked").length;

  const approvedDocs = documents.filter((d) => d.approvalStatus === "approved").length;
  const pendingDocs = documents.filter((d) => d.approvalStatus === "pending").length;
  const rejectedDocs = documents.filter((d) => d.approvalStatus === "rejected").length;

  const runningEquipments = equipments.filter((e) => e.status === "running").length;
  const faultEquipments = equipments.filter((e) => e.status === "fault").length;

  // ===== 统计卡片数据 =====
  const statCards = [
    {
      name: "设备总数",
      value: screenStats.equipmentTotal,
      unit: "台",
      icon: <Package size={20} />,
      color: "text-blue-500",
      bg: "bg-blue-50",
      trend: "+3",
      trendUp: true,
      sub: `运行中 ${runningEquipments}台`,
    },
    {
      name: "管路总数",
      value: screenStats.pipelineTotal,
      unit: "条",
      icon: <GitBranch size={20} />,
      color: "text-green-500",
      bg: "bg-green-50",
      trend: "+2",
      trendUp: true,
      sub: `已挂接 ${linkedPipelines}条`,
    },
    {
      name: "资料总数",
      value: documents.length + drawings.length,
      unit: "份",
      icon: <FileText size={20} />,
      color: "text-purple-500",
      bg: "bg-purple-50",
      trend: "+5",
      trendUp: true,
      sub: `待审批 ${pendingDocs}份`,
    },
    {
      name: "编码挂接率",
      value: codeLinkRate,
      unit: "%",
      icon: <Link2 size={20} />,
      color: codeLinkRate >= 80 ? "text-green-500" : "text-orange-500",
      bg: codeLinkRate >= 80 ? "bg-green-50" : "bg-orange-50",
      trend: `${unlinkedCodes}条待挂`,
      trendUp: unlinkedCodes <= 5,
      sub: `已挂接 ${linkedCodes}条`,
    },
    {
      name: "告警信息",
      value: alarms.length,
      unit: "条",
      icon: <AlertCircle size={20} />,
      color: alarms.length > 0 ? "text-red-500" : "text-green-500",
      bg: alarms.length > 0 ? "bg-red-50" : "bg-green-50",
      trend: `${faultEquipments}台故障`,
      trendUp: false,
      sub: `运行正常 ${runningEquipments}台`,
    },
  ];

  // ===== 图表1: 数字化进度总览 (环形图) =====
  const progressOption = useMemo(() => {
    return {
      tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
      legend: {
        bottom: 0,
        left: "center",
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { fontSize: 11, color: "#6b7280" },
      },
      series: [
        {
          name: "数字化进度",
          type: "pie",
          radius: ["42%", "68%"],
          center: ["50%", "42%"],
          avoidLabelOverlap: false,
          label: {
            show: true,
            position: "center",
            formatter: () => {
              return `{total|${codeLinkRate}%}\n{label|编码挂接率}`;
            },
            rich: {
              total: {
                fontSize: 24,
                fontWeight: "bold",
                color: "#1f2937",
                lineHeight: 30,
              },
              label: {
                fontSize: 11,
                color: "#6b7280",
                lineHeight: 20,
              },
            },
          },
          labelLine: { show: false },
          itemStyle: {
            borderWidth: 2,
            borderColor: "#fff",
          },
          data: [
            {
              value: linkedCodes,
              name: "已挂接编码",
              itemStyle: { color: "#3b82f6" },
            },
            {
              value: unlinkedCodes,
              name: "未挂接编码",
              itemStyle: { color: "#f59e0b" },
            },
          ],
        },
      ],
    };
  }, [linkedCodes, unlinkedCodes, codeLinkRate]);

  // ===== 图表2: 机组运行状态概览 (与大屏数据保持一致) =====
  const units = [
    { id: "1#机组", status: "运行", output: 153.2, pf: 0.92, capacity: 150 },
    { id: "2#机组", status: "运行", output: 148.7, pf: 0.90, capacity: 150 },
    { id: "3#机组", status: "运行", output: 152.1, pf: 0.91, capacity: 150 },
    { id: "4#机组", status: "检修", output: 0, pf: 0, capacity: 150 },
  ];
  const totalOutput = units.reduce((s, u) => s + u.output, 0);
  const runningCount = units.filter((u) => u.status === "运行").length;
  const unitStatusOption = useMemo(() => {
    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any) => {
          const idx = params[0].dataIndex;
          const u = units[idx];
          const loadRate = u.capacity > 0 ? ((u.output / u.capacity) * 100).toFixed(1) : "0.0";
          return `${u.id}<br/>状态: ${u.status}<br/>实时出力: ${u.output} MW<br/>额定容量: ${u.capacity} MW<br/>负荷率: ${loadRate}%`;
        },
      },
      grid: { top: 25, right: 20, bottom: 30, left: 45 },
      xAxis: {
        type: "category",
        data: units.map((u) => u.id),
        axisLine: { lineStyle: { color: "#e5e7eb" } },
        axisLabel: { color: "#6b7280", fontSize: 11 },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        name: "MW",
        nameTextStyle: { color: "#9ca3af", fontSize: 10 },
        max: 180,
        axisLabel: { color: "#6b7280", fontSize: 10 },
        splitLine: { lineStyle: { color: "#f3f4f6" } },
      },
      series: [
        {
          name: "实时出力",
          type: "bar",
          barWidth: "38%",
          data: units.map((u) => ({
            value: u.output,
            itemStyle: {
              color:
                u.status === "运行"
                  ? { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [
                      { offset: 0, color: "#34d399" },
                      { offset: 1, color: "#10b981" },
                    ] }
                  : u.status === "备用"
                  ? "#3b82f6"
                  : { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [
                      { offset: 0, color: "#fbbf24" },
                      { offset: 1, color: "#f59e0b" },
                    ] },
              borderRadius: [4, 4, 0, 0],
            },
          })),
          label: {
            show: true,
            position: "top",
            formatter: (params: any) => `${params.value} MW`,
            fontSize: 11,
            color: "#1f2937",
            fontWeight: "bold",
          },
          markLine: {
            silent: true,
            symbol: "none",
            data: [
              {
                yAxis: 150,
                lineStyle: { color: "#ef4444", type: "dashed", width: 1 },
                label: {
                  formatter: "额定 150MW",
                  color: "#ef4444",
                  fontSize: 10,
                  position: "insideEndTop",
                },
              },
            ],
          },
        },
      ],
    };
  }, []);

  // ===== 待办事项数据 =====
  const approvalTodos = documents
    .filter((d) => d.approvalStatus === "pending")
    .map((d, i) => ({
      id: `approval-${i}`,
      type: "资料审批",
      typeColor: "bg-orange-100 text-orange-600",
      description: `${d.name} 待审批`,
      initiator: d.uploadUser,
      time: d.uploadTime,
      level: ("pending" as const),
      module: "drawing",
    }));

  const drawingApprovalTodos = drawings
    .filter((d) => d.approvalStatus === "pending")
    .map((d, i) => ({
      id: `drawing-approval-${i}`,
      type: "图纸审批",
      typeColor: "bg-purple-100 text-purple-600",
      description: `${d.name} 待审批`,
      initiator: d.uploadUser,
      time: d.uploadTime,
      level: ("pending" as const),
      module: "drawing",
    }));

  const alertTodos = [
    ...(faultEquipments > 0
      ? [
          {
            id: "alert-fault",
            type: "设备告警",
            typeColor: "bg-red-100 text-red-600",
            description: `${faultEquipments}台设备处于故障状态，请及时处理`,
            initiator: "系统",
            time: new Date().toLocaleString("zh-CN"),
            level: ("alert" as const),
            module: "equipment",
          },
        ]
      : []),
    ...(unlinkedCodes > 5
      ? [
          {
            id: "alert-code",
            type: "编码提醒",
            typeColor: "bg-blue-100 text-blue-600",
            description: `${unlinkedCodes}条编码未挂接实体设备，请前往手动挂接`,
            initiator: "系统",
            time: new Date().toLocaleString("zh-CN"),
            level: ("alert" as const),
            module: "code",
          },
        ]
      : []),
  ];

  const allTodos = [...approvalTodos, ...drawingApprovalTodos, ...alertTodos];

  const filteredTodos =
    todoTab === "all"
      ? allTodos
      : todoTab === "approval"
      ? [...approvalTodos, ...drawingApprovalTodos]
      : alertTodos;

  const todoTabs = [
    { key: "all", label: "全部", count: allTodos.length },
    { key: "approval", label: "待审批", count: approvalTodos.length + drawingApprovalTodos.length },
    { key: "alert", label: "数据提醒", count: alertTodos.length },
  ];

  return (
    <div className="space-y-4">
      {/* 顶部欢迎卡片 */}
      <div className="admin-card p-5 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">
            管
          </div>
          <div>
            <h2 className="text-lg font-bold text-admin-text">你好，系统管理员 👋</h2>
            <p className="text-xs text-admin-muted mt-0.5">
              {dateStr} · {weekday} · 乌江渡水电站数字孪生管理平台
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-admin-muted">今日操作</div>
            <div className="text-lg font-bold text-blue-500">{operationLogs.length} 次</div>
          </div>
          <button
            onClick={() => navigate("/screen")}
            className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
          >
            进入大屏
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* 统计卡片区 */}
      <div className="grid grid-cols-5 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="admin-card p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => {
              if (stat.name === "设备总数") navigate("/admin/equipment");
              else if (stat.name === "管路总数") navigate("/admin/pipeline/category");
              else if (stat.name === "资料总数") navigate("/admin/drawing");
              else if (stat.name === "编码挂接率") navigate("/admin/system/structure-tree");
              else if (stat.name === "告警信息") navigate("/screen");
            }}
          >
            <div className="flex items-start justify-between mb-2">
              <div
                className={`w-9 h-9 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center`}
              >
                {stat.icon}
              </div>
              <div
                className={`flex items-center gap-0.5 text-xs font-medium ${
                  stat.trendUp ? "text-green-500" : "text-red-500"
                }`}
              >
                {stat.trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {stat.trend}
              </div>
            </div>
            <div className="text-xs text-admin-muted mb-1">{stat.name}</div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-admin-text">{stat.value}</span>
              <span className="text-xs text-admin-muted">{stat.unit}</span>
            </div>
            <div className="text-[10px] text-admin-muted mt-1">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* 图表区域：数字化进度总览 + 机组运行状态 并排 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 图表1: 数字化进度总览 */}
        <div className="admin-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
                <Network size={14} />
              </div>
              <span className="text-sm font-medium text-admin-text">数字化进度总览</span>
            </div>
            <button
              className="text-xs text-blue-500 hover:text-blue-700"
              onClick={() => navigate("/admin/system/structure-tree")}
            >
              查看详情 →
            </button>
          </div>
          <div style={{ height: 220 }}>
            <ReactECharts option={progressOption} style={{ height: "100%" }} />
          </div>
          <div className="flex items-center justify-center gap-6 pt-2 border-t border-admin-border">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-500">{linkedCodes}</div>
              <div className="text-[10px] text-admin-muted">已挂接编码</div>
            </div>
            <div className="w-px h-8 bg-admin-border"></div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-500">{unlinkedCodes}</div>
              <div className="text-[10px] text-admin-muted">待挂接编码</div>
            </div>
            <div className="w-px h-8 bg-admin-border"></div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-500">{linkedEquipments}</div>
              <div className="text-[10px] text-admin-muted">已挂接设备</div>
            </div>
          </div>
        </div>

        {/* 图表2: 机组运行状态概览 */}
        <div className="admin-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-green-50 text-green-500 flex items-center justify-center">
                <Activity size={14} />
              </div>
              <span className="text-sm font-medium text-admin-text">机组运行状态</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-green-500">● 运行</span>
              <span className="text-[10px] text-orange-500">● 检修</span>
            </div>
          </div>
          {/* 4台机组状态徽章 */}
          <div className="grid grid-cols-4 gap-2 mb-2">
            {units.map((u) => (
              <div
                key={u.id}
                className={`px-2 py-1.5 rounded text-center border ${
                  u.status === "运行"
                    ? "bg-green-50 border-green-200"
                    : u.status === "备用"
                    ? "bg-blue-50 border-blue-200"
                    : "bg-orange-50 border-orange-200"
                }`}
              >
                <div className="text-[10px] text-admin-muted">{u.id}</div>
                <div
                  className={`text-xs font-medium ${
                    u.status === "运行"
                      ? "text-green-600"
                      : u.status === "备用"
                      ? "text-blue-600"
                      : "text-orange-600"
                  }`}
                >
                  {u.status}
                </div>
                <div className="text-[10px] text-admin-text font-medium mt-0.5">
                  {u.output > 0 ? `${u.output} MW` : "—"}
                </div>
              </div>
            ))}
          </div>
          <div style={{ height: 180 }}>
            <ReactECharts option={unitStatusOption} style={{ height: "100%" }} />
          </div>
          <div className="flex items-center justify-center gap-6 pt-2 border-t border-admin-border">
            <div className="text-center">
              <div className="text-lg font-bold text-green-500">{runningCount}/4</div>
              <div className="text-[10px] text-admin-muted">运行机组</div>
            </div>
            <div className="w-px h-8 bg-admin-border"></div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-500">{totalOutput.toFixed(1)}</div>
              <div className="text-[10px] text-admin-muted">总有功(MW)</div>
            </div>
            <div className="w-px h-8 bg-admin-border"></div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-500">
                {((totalOutput / (4 * 150)) * 100).toFixed(1)}%
              </div>
              <div className="text-[10px] text-admin-muted">综合负荷率</div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部区域：待办事项(2列) + 核心运行速览(1列) 并排 */}
      <div className="grid grid-cols-3 gap-4">
        {/* 待办事项 (占2列) */}
        <div className="admin-card col-span-2">
          <div className="flex items-center justify-between px-4 py-3 border-b border-admin-border">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-blue-500" />
              <span className="text-sm font-medium text-admin-text">待办事项</span>
              {allTodos.length > 0 && (
                <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">
                  {allTodos.length}
                </span>
              )}
            </div>
            <button className="text-xs text-blue-500 hover:text-blue-700">
              查看全部
            </button>
          </div>

          {/* Tab切换 */}
          <div className="flex gap-1 px-4 py-2 border-b border-admin-border">
            {todoTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setTodoTab(tab.key as any)}
                className={`px-3 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
                  todoTab === tab.key
                    ? "bg-blue-500 text-white"
                    : "text-admin-muted hover:text-admin-text"
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className={`px-1 py-0 rounded-full text-[10px] ${
                      todoTab === tab.key
                        ? "bg-white/20 text-white"
                        : "bg-red-100 text-red-500"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* 待办列表 */}
          <div className="p-2 max-h-[320px] overflow-auto">
            {filteredTodos.length === 0 ? (
              <div className="text-center py-8 text-sm text-admin-muted">
                暂无待办事项 🎉
              </div>
            ) : (
              <div className="space-y-1">
                {filteredTodos.map((todo) => (
                  <div
                    key={todo.id}
                    className="flex items-center gap-3 p-3 rounded hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => {
                      message.info(`跳转到${todo.module}页面`);
                      navigate(`/admin/${todo.module}`);
                    }}
                  >
                    <span
                      className={`px-2 py-0.5 text-xs rounded ${todo.typeColor}`}
                    >
                      {todo.type}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-admin-text truncate">
                        {todo.description}
                      </div>
                      <div className="text-xs text-admin-muted mt-0.5">
                        {todo.initiator} · {todo.time}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {todo.level === "pending" && (
                        <span className="text-xs text-orange-500 font-medium">待处理</span>
                      )}
                      {todo.level === "alert" && (
                        <span className="text-xs text-red-500 font-medium">告警</span>
                      )}
                      <button
                        className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-0.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/${todo.module}`);
                        }}
                      >
                        去处理
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 核心运行速览 (占1列) */}
        <div className="admin-card flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-admin-border">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center">
                <TrendingUpIcon size={14} />
              </div>
              <span className="text-sm font-medium text-admin-text">核心运行速览</span>
            </div>
          </div>

          {/* 4项核心指标 2x2 */}
          <div className="grid grid-cols-2 gap-px bg-admin-border">
            <div className="bg-white p-3 text-center">
              <div className="text-[10px] text-admin-muted mb-0.5">总有功</div>
              <div className="text-base font-bold text-blue-500">
                {totalOutput.toFixed(1)}
                <span className="text-[10px] font-normal text-admin-muted ml-0.5">MW</span>
              </div>
            </div>
            <div className="bg-white p-3 text-center">
              <div className="text-[10px] text-admin-muted mb-0.5">今日发电量</div>
              <div className="text-base font-bold text-green-500">
                721.6
                <span className="text-[10px] font-normal text-admin-muted ml-0.5">万kWh</span>
              </div>
            </div>
            <div className="bg-white p-3 text-center">
              <div className="text-[10px] text-admin-muted mb-0.5">净水头</div>
              <div className="text-base font-bold text-orange-500">
                137.8
                <span className="text-[10px] font-normal text-admin-muted ml-0.5">m</span>
              </div>
            </div>
            <div className="bg-white p-3 text-center">
              <div className="text-[10px] text-admin-muted mb-0.5">综合负荷率</div>
              <div className="text-base font-bold text-indigo-500">
                {((totalOutput / (4 * 150)) * 100).toFixed(1)}
                <span className="text-[10px] font-normal text-admin-muted ml-0.5">%</span>
              </div>
            </div>
          </div>

          {/* 3项辅助指标 3列 */}
          <div className="grid grid-cols-3 gap-px bg-admin-border border-t border-admin-border">
            <div className="bg-white p-2.5 text-center">
              <div className="text-[10px] text-admin-muted">机组可用率</div>
              <div className="text-sm font-bold text-green-500 mt-0.5">
                {runningCount}/4
              </div>
            </div>
            <div className="bg-white p-2.5 text-center">
              <div className="text-[10px] text-admin-muted">设备在线率</div>
              <div className="text-sm font-bold text-blue-500 mt-0.5">92.7%</div>
            </div>
            <div className="bg-white p-2.5 text-center">
              <div className="text-[10px] text-admin-muted">当前告警</div>
              <div className="text-sm font-bold text-red-500 mt-0.5">{alarms.length}条</div>
            </div>
          </div>

          {/* 最新动态 */}
          <div className="flex-1 px-4 py-3 border-t border-admin-border overflow-hidden flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-admin-text flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                最新动态
              </span>
              <button
                className="text-[10px] text-blue-500 hover:text-blue-700"
                onClick={() => navigate("/admin/system/log")}
              >
                全部日志
              </button>
            </div>
            <div className="space-y-1.5 flex-1 overflow-auto pr-1 text-xs">
              <div className="flex items-start gap-2">
                <span className="text-[10px] text-admin-muted mt-0.5 shrink-0 w-28">
                  {new Date().getHours() - 1 < 10 ? `0${new Date().getHours() - 1}` : new Date().getHours() - 1}:23
                </span>
                <div className="flex-1 min-w-0">
                  <span className="inline-block px-1.5 py-px bg-yellow-100 text-yellow-600 text-[10px] rounded mr-1 align-middle">
                    参数
                  </span>
                  <span className="text-admin-text align-middle">
                    1#机组推力瓦温波动 72.5℃
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[10px] text-admin-muted mt-0.5 shrink-0 w-28">
                  {new Date().getHours() - 2 < 10 ? `0${new Date().getHours() - 2}` : new Date().getHours() - 2}:15
                </span>
                <div className="flex-1 min-w-0">
                  <span className="inline-block px-1.5 py-px bg-green-100 text-green-600 text-[10px] rounded mr-1 align-middle">
                    巡检
                  </span>
                  <span className="text-admin-text align-middle">
                    冷却水泵日常巡检完成，无异常
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[10px] text-admin-muted mt-0.5 shrink-0 w-28">
                  08:40
                </span>
                <div className="flex-1 min-w-0">
                  <span className="inline-block px-1.5 py-px bg-orange-100 text-orange-600 text-[10px] rounded mr-1 align-middle">
                    审批
                  </span>
                  <span className="text-admin-text align-middle">
                    3份图纸资料待管理员审批
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[10px] text-admin-muted mt-0.5 shrink-0 w-28">
                  08:02
                </span>
                <div className="flex-1 min-w-0">
                  <span className="inline-block px-1.5 py-px bg-red-100 text-red-600 text-[10px] rounded mr-1 align-middle">
                    告警
                  </span>
                  <span className="text-admin-text align-middle">
                    4#机组有功跌落0MW，已转检修状态
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
