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
  AlertCircle,
  Network,
  Layers3,
  Settings,
  Activity,
} from "lucide-react";
import {
  screenStats,
  documents,
  operationLogs,
  alarms,
  drawings,
  equipments,
  pipelines,
} from "@/mock";
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

  const today = new Date();
  const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
  const weekday = weekdays[today.getDay()];

  // ===== 统计计算 =====
  const linkedDocuments = documents.filter((d) => d.linkedId).length;

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
      name: "告警信息",
      value: alarms.length,
      unit: "条",
      icon: <AlertCircle size={20} />,
      color: alarms.length > 0 ? "text-red-500" : "text-green-500",
      bg: alarms.length > 0 ? "bg-red-50" : "bg-green-50",
      trend: alarms.length > 0 ? "+0" : "0",
      trendUp: false,
    },
  ];

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

  // ===== 快捷入口 =====
  const quickEntries = [
    { name: "设备数字化", desc: "设备台账与属性管理", icon: <Package size={20} />, color: "text-blue-600", bg: "bg-blue-50", gradient: "from-blue-50 to-blue-50/40", border: "hover:border-blue-300", path: "/admin/equipment" },
    { name: "管道数字化", desc: "管路台账与属性管理", icon: <GitBranch size={20} />, color: "text-green-600", bg: "bg-green-50", gradient: "from-green-50 to-green-50/40", border: "hover:border-green-300", path: "/admin/pipeline/category" },
    { name: "资料管理", desc: "图纸资料与模型挂接", icon: <FileText size={20} />, color: "text-purple-600", bg: "bg-purple-50", gradient: "from-purple-50 to-purple-50/40", border: "hover:border-purple-300", path: "/admin/drawing" },
    { name: "结构树管理", desc: "编码与结构树维护", icon: <Network size={20} />, color: "text-cyan-600", bg: "bg-cyan-50", gradient: "from-cyan-50 to-cyan-50/40", border: "hover:border-cyan-300", path: "/admin/system/structure-tree" },
    { name: "属性模板库", desc: "属性模板与字段配置", icon: <Layers3 size={20} />, color: "text-amber-600", bg: "bg-amber-50", gradient: "from-amber-50 to-amber-50/40", border: "hover:border-amber-300", path: "/admin/system/attribute-template" },
    { name: "系统管理", desc: "用户组织与权限配置", icon: <Settings size={20} />, color: "text-slate-600", bg: "bg-slate-100", gradient: "from-slate-50 to-slate-50/40", border: "hover:border-slate-300", path: "/admin/system/user" },
  ];

  // ===== 待办事项数据（资料/模型完善类提醒，基于挂接数据统计） =====
  const [todoTab, setTodoTab] = useState<"all" | "data" | "model">("all");

  const linkedEquipIds = new Set(
    documents.filter((d) => d.linkedType === "equipment" && d.linkedId).map((d) => d.linkedId),
  );
  const linkedPipeIds = new Set(
    documents.filter((d) => d.linkedType === "pipeline" && d.linkedId).map((d) => d.linkedId),
  );
  const unlinkedDrawings = drawings.length; // 原型图纸库当前均未挂接
  const unlinkedDocs = documents.filter((d) => !d.linkedId).length;
  const unlinkedEquipCount = equipments.filter((e) => !linkedEquipIds.has(e.id)).length;
  const unlinkedPipeCount = pipelines.filter((p) => !linkedPipeIds.has(p.id)).length;

  const dataTodos = [
    ...(unlinkedDrawings > 0
      ? [{
          id: "todo-drawing",
          type: "图纸挂接",
          typeColor: "bg-blue-100 text-blue-600",
          description: `${unlinkedDrawings}份图纸尚未挂接至设备/管路`,
          initiator: "系统",
          time: new Date().toLocaleString("zh-CN"),
          level: "pending" as const,
          module: "drawing",
        }]
      : []),
    ...(unlinkedDocs > 0
      ? [{
          id: "todo-doc",
          type: "资料挂接",
          typeColor: "bg-cyan-100 text-cyan-700",
          description: `${unlinkedDocs}份资料尚未挂接模型`,
          initiator: "系统",
          time: new Date().toLocaleString("zh-CN"),
          level: "pending" as const,
          module: "drawing",
        }]
      : []),
  ];

  const modelTodos = [
    ...(unlinkedEquipCount > 0
      ? [{
          id: "todo-equip-doc",
          type: "设备资料缺失",
          typeColor: "bg-amber-100 text-amber-700",
          description: `${unlinkedEquipCount}台设备尚无关联资料，请补充完善`,
          initiator: "系统",
          time: new Date().toLocaleString("zh-CN"),
          level: "pending" as const,
          module: "equipment",
        }]
      : []),
    ...(unlinkedPipeCount > 0
      ? [{
          id: "todo-pipe-doc",
          type: "管路资料缺失",
          typeColor: "bg-orange-100 text-orange-700",
          description: `${unlinkedPipeCount}条管路尚无关联资料，请补充完善`,
          initiator: "系统",
          time: new Date().toLocaleString("zh-CN"),
          level: "pending" as const,
          module: "pipeline",
        }]
      : []),
  ];

  const allTodos = [...dataTodos, ...modelTodos];
  const filteredTodos = todoTab === "all" ? allTodos : todoTab === "data" ? dataTodos : modelTodos;
  const todoTabs = [
    { key: "all" as const, label: "全部", count: allTodos.length },
    { key: "data" as const, label: "资料完善", count: dataTodos.length },
    { key: "model" as const, label: "模型完善", count: modelTodos.length },
  ];

  const todoModulePath = (module: string) => {
    if (module === "equipment") return "/admin/equipment";
    if (module === "pipeline") return "/admin/pipeline/category";
    return "/admin/drawing";
  };

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
        title="统计卡片区（4张）"
        summary="设备总数/管路总数/资料总数/告警信息，点击跳转对应模块"
        items={[
          { label: "数据来源", value: "设备总数=screenStats.equipmentTotal；管路总数=screenStats.pipelineTotal；资料总数=documents.length+drawings.length；告警信息=alarms.length" },
          { label: "校验规则", value: "告警>0红色" },
          { label: "交互逻辑", value: "点击跳转：设备总数→/admin/equipment；管路总数→/admin/pipeline/category；资料总数→/admin/drawing；告警信息→/screen" },
          { label: "后续步骤", value: "正式系统：各卡片数值由对应业务模块统计接口返回" },
          { label: "权限", value: "管理员/操作人员可见；浏览人员仅告警信息可点" },
        ]}
        wrapClassName="block"
      >
        <div className="grid grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <div
              key={stat.name}
              className="admin-card p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                if (stat.name === "设备总数") navigate("/admin/equipment");
                else if (stat.name === "管路总数") navigate("/admin/pipeline/category");
                else if (stat.name === "资料总数") navigate("/admin/drawing");
                else if (stat.name === "告警信息") navigate("/screen");
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <div
                  className={`w-9 h-9 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center`}
                >
                  {stat.icon}
                </div>
                {stat.trend && (
                  <div
                    className={`flex items-center gap-0.5 text-xs font-medium ${
                      stat.trendUp ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {stat.trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {stat.trend}
                  </div>
                )}
              </div>
              <div className="text-xs text-admin-muted mb-1">{stat.name}</div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-admin-text">{stat.value}</span>
                <span className="text-xs text-admin-muted">{stat.unit}</span>
              </div>
              {stat.sub && <div className="text-[10px] text-admin-muted mt-1">{stat.sub}</div>}
            </div>
          ))}
        </div>
      </DevNote>

      {/* 快捷入口 + 模型实时数据点统计（横向排列，55分） */}
      <div className="grid grid-cols-2 gap-4">
        <DevNote
          id="dashboard-quick-entries"
          title="快捷入口"
          summary="常用模块一键直达"
          items={[
            { label: "数据来源", value: "静态配置（名称/描述/图标/路由）" },
            { label: "交互逻辑", value: "点击卡片跳转对应模块：设备数字化→/admin/equipment；管道数字化→/admin/pipeline/category；资料管理→/admin/drawing；结构树管理→/admin/system/structure-tree；属性模板库→/admin/system/attribute-template；系统管理→/admin/system/user" },
            { label: "后续步骤", value: "正式系统：入口列表由后台按用户权限动态返回" },
            { label: "权限", value: "全部角色可见；无权限模块自动隐藏" },
          ]}
          wrapClassName="block"
        >
          <div className="admin-card">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-admin-border">
              <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <ArrowRight size={13} />
              </div>
              <span className="text-sm font-medium text-admin-text">快捷入口</span>
            </div>
            <div className="p-3">
              <div className="grid grid-cols-3 gap-3">
                {quickEntries.map((entry) => (
                  <div
                    key={entry.name}
                    className={`group flex items-center gap-3 p-4 rounded-xl border border-admin-border bg-gradient-to-br ${entry.gradient} hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer ${entry.border}`}
                    onClick={() => navigate(entry.path)}
                  >
                    <div
                      className={`w-11 h-11 rounded-lg ${entry.bg} ${entry.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}
                    >
                      {entry.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-medium text-admin-text">{entry.name}</div>
                      <div className="text-xs text-admin-muted truncate mt-1">{entry.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DevNote>

        {/* 图表区域：模型实时数据点统计 */}
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
        summary="按全部/资料完善/模型完善分类展示数据完善类提醒，支持点击跳转处理"
        items={[
          { label: "数据来源", value: "dataTodos（图纸挂接：drawings 未挂接数；资料挂接：documents 无 linkedId 数）+ modelTodos（设备/管路资料缺失：documents 挂接对象集合反查 equipments/pipelines 中无关联的数量）" },
          { label: "校验规则", value: "对应数量为 0 时该待办不生成；无任何待办时显示「暂无待办事项 🎉」；页签计数角标显示各分类数量" },
          { label: "交互逻辑", value: "三个页签切换 filteredTodos；点击整行或「去处理」跳转：图纸/资料→/admin/drawing；设备→/admin/equipment；管路→/admin/pipeline/category" },
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
                  onClick={() => setTodoTab(tab.key)}
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
                      onClick={() => navigate(todoModulePath(todo.module))}
                    >
                      <span className={`px-2 py-0.5 text-xs rounded ${todo.typeColor}`}>
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
                        <span className="text-xs text-orange-500 font-medium">待处理</span>
                        <button
                          className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-0.5"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(todoModulePath(todo.module));
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
