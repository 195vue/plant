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
import { APP_TITLE } from "@/lib/appConfig";
import { DevNote } from "@/components/devNotes/DevNote";

const MOCK_REALTIME_POINTS = [
  { type: "压力", count: 186, color: "#3b82f6" },
  { type: "温度", count: 154, color: "#f97316" },
  { type: "振动", count: 96, color: "#8b5cf6" },
  { type: "液位", count: 48, color: "#06b6d4" },
  { type: "电气量", count: 132, color: "#eab308" },
  { type: "开关量", count: 214, color: "#10b981" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [todoTab, setTodoTab] = useState<"all" | "data" | "alert">("all");

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

  const linkedDocuments = documents.filter((d) => d.linkedId).length;

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
      sub: `已关联 ${linkedDocuments}份`,
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

  // 本阶段尚未接入实时数据，使用 Mock 数据展示模型测点类型和数量。
  const totalRealtimePoints = MOCK_REALTIME_POINTS.reduce(
    (sum, item) => sum + item.count,
    0,
  );
  const realtimePointOption = useMemo(() => {
    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any) =>
          `${params[0].name}<br/>已接入测点：${params[0].value} 个`,
      },
      grid: { top: 10, right: 30, bottom: 25, left: 58 },
      xAxis: {
        type: "value",
        name: "点",
        nameTextStyle: { color: "#9ca3af", fontSize: 10 },
        axisLine: { lineStyle: { color: "#e5e7eb" } },
        axisLabel: { color: "#6b7280", fontSize: 10 },
        splitLine: { lineStyle: { color: "#f3f4f6" } },
      },
      yAxis: {
        type: "category",
        data: MOCK_REALTIME_POINTS.map((item) => item.type),
        axisLine: { lineStyle: { color: "#e5e7eb" } },
        axisLabel: { color: "#4b5563", fontSize: 11 },
        axisTick: { show: false },
      },
      series: [
        {
          name: "已接入测点",
          type: "bar",
          barWidth: 14,
          data: MOCK_REALTIME_POINTS.map((item) => ({
            value: item.count,
            itemStyle: { color: item.color, borderRadius: [0, 4, 4, 0] },
          })),
          label: {
            show: true,
            position: "right",
            formatter: "{c}",
            fontSize: 10,
            color: "#374151",
          },
        },
      ],
    };
  }, []);

  // ===== 待办事项数据 =====
  const dataTodos = [
    ...(unlinkedEquipments > 0
      ? [
          {
            id: "data-equipment-link",
            type: "设备挂接",
            typeColor: "bg-blue-100 text-blue-600",
            description: `${unlinkedEquipments}台设备尚未完成编码挂接`,
            initiator: "系统",
            time: new Date().toLocaleString("zh-CN"),
            level: "pending" as const,
            module: "equipment",
          },
        ]
      : []),
    ...(unlinkedPipelines > 0
      ? [
          {
            id: "data-pipeline-link",
            type: "管路挂接",
            typeColor: "bg-cyan-100 text-cyan-700",
            description: `${unlinkedPipelines}条管路尚未完成编码挂接`,
            initiator: "系统",
            time: new Date().toLocaleString("zh-CN"),
            level: "pending" as const,
            module: "pipeline",
          },
        ]
      : []),
  ];

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

  const allTodos = [...dataTodos, ...alertTodos];

  const filteredTodos =
    todoTab === "all"
      ? allTodos
      : todoTab === "data"
      ? dataTodos
      : alertTodos;

  const todoTabs = [
    { key: "all", label: "全部", count: allTodos.length },
    { key: "data", label: "数据完善", count: dataTodos.length },
    { key: "alert", label: "数据提醒", count: alertTodos.length },
  ];

  return (
    <div className="space-y-4">
      {/* 顶部欢迎卡片 */}
      <DevNote
        id="dashboard-welcome"
        title="欢迎信息卡片"
        summary="展示登录用户、日期星期、平台名称和今日操作次数"
        items={[
          { label: "数据来源", value: "operationLogs（mock）长度作为今日操作次数；日期星期由前端 new Date() 实时生成；平台名称 APP_TITLE" },
          { label: "校验规则", value: "无输入校验；昵称固定「你好，系统管理员」" },
          { label: "交互逻辑", value: "纯信息展示；右侧「进入大屏」按钮跳转 /screen" },
          { label: "后续步骤", value: "正式系统：今日操作次数应调用后台「操作日志统计接口」按当天统计" },
          { label: "权限", value: "管理员/操作人员/浏览人员可见" },
        ]}
        wrapClassName="block"
      >
        <div className="admin-card p-5 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">
              管
            </div>
            <div>
              <h2 className="text-lg font-bold text-admin-text">你好，系统管理员 👋</h2>
              <p className="text-xs text-admin-muted mt-0.5">
                {dateStr} · {weekday} · {APP_TITLE}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-admin-muted">今日操作</div>
              <div className="text-lg font-bold text-blue-500">{operationLogs.length} 次</div>
            </div>
            <DevNote
              id="dashboard-enter-screen"
              title="进入大屏按钮"
              summary="跳转至孪生全景大屏"
              items={[
                { label: "数据来源", value: "无数据依赖，路由跳转 /screen" },
                { label: "交互逻辑", value: "onClick 调用 navigate('/screen')" },
                { label: "后续步骤", value: "正式系统：跳转时携带当前用户权限，进入工程总览视图" },
                { label: "权限", value: "管理员/操作人员/浏览人员可见" },
              ]}
            >
              <button
                onClick={() => navigate("/screen")}
                className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
              >
                进入大屏
                <ArrowRight size={14} />
              </button>
            </DevNote>
          </div>
        </div>
      </DevNote>

      {/* 统计卡片区 */}
      <DevNote
        id="dashboard-stat-cards"
        title="统计卡片区（5张）"
        summary="设备总数/管路总数/资料总数/编码挂接率/告警信息，点击跳转对应模块"
        items={[
          { label: "数据来源", value: "设备总数=screenStats.equipmentTotal；管路总数=screenStats.pipelineTotal；资料总数=documents.length+drawings.length；编码挂接率=linkedCodes/totalCodes×100%；告警信息=alarms.length" },
          { label: "校验规则", value: "编码挂接率≥80%绿色，否则橙色；告警>0红色" },
          { label: "交互逻辑", value: "点击跳转：设备总数→/admin/equipment；管路总数→/admin/pipeline/category；资料总数→/admin/drawing；编码挂接率→/admin/system/structure-tree；告警信息→/screen" },
          { label: "后续步骤", value: "正式系统：各卡片数值由对应业务模块统计接口返回" },
          { label: "权限", value: "管理员/操作人员可见；浏览人员仅告警信息可点" },
        ]}
        wrapClassName="block"
      >
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
      </DevNote>

      {/* 图表区域：数字化进度总览 + 模型实时数据点统计 并排 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 图表1: 数字化进度总览 */}
        <DevNote
          id="dashboard-progress"
          title="数字化进度总览"
          summary="环形图展示编码挂接进度，下方统计已挂接/待挂接编码与已挂接设备"
          items={[
            { label: "数据来源", value: "linkedCodes/unlinkedCodes/linkedEquipments：由 codes、equipments（mock）统计；环形图 center 显示编码挂接率 codeLinkRate" },
            { label: "交互逻辑", value: "右上角「查看详情 →」跳转 /admin/system/structure-tree" },
            { label: "后续步骤", value: "正式系统：编码挂接率=已挂接编码数÷编码总数×100%，由编码关联接口返回" },
            { label: "权限", value: "管理员/操作人员可见，可点击查看详情" },
          ]}
          wrapClassName="block"
        >
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
        </DevNote>

        {/* 模型实时数据点统计 */}
        <DevNote
          id="dashboard-realtime-points"
          title="模型实时数据点统计"
          summary="按测点类型统计已接入测点数，柱状图展示分布"
          items={[
            { label: "数据来源", value: "MOCK_REALTIME_POINTS（mock）：压力186/温度154/振动96/液位48/电气量132/开关量214；右上角标注「Mock 数据」" },
            { label: "校验规则", value: "暂无真实数据接入，原型阶段使用 mock" },
            { label: "交互逻辑", value: "无点击操作；6类测点以卡片+横向柱状图展示，下方统计已接入测点总数/数据类型数/关联模型数" },
            { label: "后续步骤", value: "正式系统：已接入测点数由实时数据服务按测点类型统计接口返回；关联模型数由模型关联接口返回" },
            { label: "权限", value: "管理员/操作人员可见" },
          ]}
          wrapClassName="block"
        >
          <div className="admin-card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
                  <Network size={14} />
                </div>
                <span className="text-sm font-medium text-admin-text">模型实时数据点统计</span>
              </div>
              <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700">
                Mock 数据
              </span>
            </div>
            <div className="grid grid-cols-6 gap-2 mb-2">
              {MOCK_REALTIME_POINTS.map((item) => (
                <div
                  key={item.type}
                  className="rounded border border-admin-border bg-gray-50/60 px-2 py-1.5 text-center"
                >
                  <div className="text-[10px] text-admin-muted">{item.type}</div>
                  <div className="mt-0.5 text-sm font-semibold" style={{ color: item.color }}>
                    {item.count}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ height: 180 }}>
              <ReactECharts option={realtimePointOption} style={{ height: "100%" }} />
            </div>
            <div className="flex items-center justify-center gap-6 pt-2 border-t border-admin-border">
              <div className="text-center">
                <div className="text-lg font-bold text-cyan-600">{totalRealtimePoints}</div>
                <div className="text-[10px] text-admin-muted">已接入测点</div>
              </div>
              <div className="w-px h-8 bg-admin-border"></div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-500">{MOCK_REALTIME_POINTS.length}</div>
                <div className="text-[10px] text-admin-muted">数据类型</div>
              </div>
              <div className="w-px h-8 bg-admin-border"></div>
              <div className="text-center">
                <div className="text-lg font-bold text-violet-500">82</div>
                <div className="text-[10px] text-admin-muted">关联模型数</div>
              </div>
            </div>
          </div>
        </DevNote>
      </div>

      {/* 待办事项 */}
      <DevNote
        id="dashboard-todos"
        title="待办事项"
        summary="按全部/数据完善/数据提醒分类展示待办，支持点击跳转处理"
        items={[
          { label: "数据来源", value: "dataTodos（设备挂接/管路挂接：按 equipments/pipelines 中未挂接数量生成）+ alertTodos（设备告警：faultEquipments>0；编码提醒：unlinkedCodes>5）" },
          { label: "校验规则", value: "无待办时显示「暂无待办事项 🎉」；页签计数角标显示各分类数量" },
          { label: "交互逻辑", value: "三个页签切换 filteredTodos；点击整行或「去处理」跳转 /admin/{module}（equipment→设备数字化、pipeline→结构树管理、code→结构树管理）" },
          { label: "后续步骤", value: "正式系统：待办事项由待办服务按用户权限返回，含审批类待办（资料/图纸审批）" },
          { label: "权限", value: "管理员/操作人员可见；浏览人员不显示" },
        ]}
        wrapClassName="block"
      >
        <div>
          <div className="admin-card">
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

        </div>
      </DevNote>
    </div>
  );
}
