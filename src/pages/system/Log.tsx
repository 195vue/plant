import { useState, useMemo } from "react";
import {
  AlertTriangle, BarChart3, CheckCircle, Clipboard, Clock,
  Download, FileText, Gauge, Info, Users, XCircle,
} from "lucide-react";
import ReactECharts from "echarts-for-react";
import { operationLogs as mockLogs } from "@/mock";
import type { OperationLog } from "@/types";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchForm, type SearchField } from "@/components/common/SearchForm";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Tag } from "@/components/common/Tag";
import { message } from "@/components/common/Message";
import { ConfirmModal } from "@/components/common/Modal";

const typeOptions = [
  "登录", "登出", "新增", "编辑", "删除", "查询", "下载", "导出", "审批",
].map((v) => ({ label: v, value: v }));

const statusOptions = [
  { label: "成功", value: "success" },
  { label: "失败", value: "failed" },
];

const typeColorMap: Record<string, "blue" | "green" | "orange" | "red" | "purple" | "gray" | "yellow"> = {
  登录: "blue", 登出: "gray", 新增: "green", 编辑: "orange", 删除: "red",
  查询: "blue", 下载: "purple", 导出: "purple", 审批: "yellow",
};

// 耗时列颜色计算
function getDurationColor(ms: number): string {
  if (ms > 1000) return "text-red-500 font-bold";
  if (ms > 500) return "text-orange-500";
  return "text-admin-text";
}

type SearchValues = Record<string, string>;

function filterLogs(logs: OperationLog[], values: SearchValues) {
  const keyword = values.keyword?.trim().toLowerCase();
  return logs.filter((item) => {
    if (values.user && !item.user.includes(values.user.trim())) return false;
    if (values.type && item.type !== values.type) return false;
    if (values.status && item.status !== values.status) return false;
    if (values.module && item.module !== values.module) return false;
    if (values.time_start && item.time < values.time_start) return false;
    if (values.time_end && item.time > `${values.time_end} 23:59:59`) return false;
    if (keyword) {
      const searchableText = [
        item.description, item.module, item.user, item.ip, item.logNo, item.traceId,
      ].filter(Boolean).join(" ").toLowerCase();
      if (!searchableText.includes(keyword)) return false;
    }
    return true;
  });
}

export default function LogQuery() {
  const sortedData = useMemo(
    () => [...mockLogs].sort((a, b) => b.time.localeCompare(a.time)),
    []
  );
  const [draftSearchValues, setDraftSearchValues] = useState<SearchValues>({});
  const [appliedSearchValues, setAppliedSearchValues] = useState<SearchValues>({});
  const [selectedId, setSelectedId] = useState<number | null>(
    () => [...mockLogs].sort((a, b) => b.time.localeCompare(a.time))[0]?.id ?? null
  );
  const [exportOpen, setExportOpen] = useState(false);

  // 模块选项动态生成
  const moduleOptions = useMemo(() => {
    const set = new Set(sortedData.map((d) => d.module));
    return Array.from(set).sort().map((v) => ({ label: v, value: v }));
  }, [sortedData]);

  const searchFields: SearchField[] = useMemo(() => [
    { name: "user", label: "操作用户", type: "input", placeholder: "用户名 / 姓名", width: "140px" },
    { name: "type", label: "操作类型", type: "select", options: typeOptions, width: "120px" },
    { name: "status", label: "操作状态", type: "select", options: statusOptions, width: "100px" },
    { name: "module", label: "操作模块", type: "select", options: moduleOptions, width: "160px" },
    { name: "time", label: "操作时间", type: "dateRange" },
    {
      name: "keyword", label: "关键字", type: "input",
      placeholder: "描述/编号/ID/IP", width: "170px",
    },
  ], [moduleOptions]);

  const filteredData = useMemo(() => {
    return filterLogs(sortedData, appliedSearchValues);
  }, [sortedData, appliedSearchValues]);

  const current = useMemo(
    () => filteredData.find((d) => d.id === selectedId) || filteredData[0] || null,
    [filteredData, selectedId]
  );

  const totalLogs = filteredData.length;
  const successCount = filteredData.filter((d) => d.status === "success").length;
  const failedCount = filteredData.filter((d) => d.status === "failed").length;
  const failRate = totalLogs > 0 ? ((failedCount / totalLogs) * 100).toFixed(1) + "%" : "0%";
  const typeDistOption = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach((d) => { counts[d.type] = (counts[d.type] || 0) + 1; });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return {
      tooltip: { trigger: "axis", formatter: (p: any) => `${p[0].name}<br/>次数: ${p[0].value}<br/><span style="color:#3b82f6">点击筛选该类型</span>` },
      grid: { left: 60, right: 20, top: 20, bottom: 30 },
      xAxis: { type: "category", data: sorted.map(([k]) => k), axisLabel: { fontSize: 11 } },
      yAxis: { type: "value", name: "次数" },
      series: [{
        type: "bar",
        data: sorted.map(([, v]) => v),
        itemStyle: { color: "#3b82f6", borderRadius: [4, 4, 0, 0] },
        barWidth: 28,
      }],
    };
  }, [filteredData]);

  const moduleDistOption = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach((d) => { counts[d.module] = (counts[d.module] || 0) + 1; });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return {
      tooltip: { trigger: "axis", formatter: (p: any) => `${p[0].name}<br/>访问次数: ${p[0].value}<br/><span style="color:#10b981">点击筛选该模块</span>` },
      grid: { left: 100, right: 40, top: 10, bottom: 20 },
      xAxis: { type: "value", name: "访问次数" },
      yAxis: { type: "category", data: sorted.map(([k]) => k), axisLabel: { fontSize: 11 } },
      series: [{
        type: "bar",
        data: sorted.map(([, v]) => v),
        itemStyle: { color: "#10b981", borderRadius: [0, 4, 4, 0] },
        barWidth: 20,
      }],
    };
  }, [filteredData]);

  const hourDistOption = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const counts = new Array(24).fill(0);
    filteredData.forEach((d) => {
      const h = parseInt(d.time.split(" ")[1]?.split(":")[0] || "0", 10);
      if (h >= 0 && h < 24) counts[h]++;
    });
    return {
      tooltip: { trigger: "axis" },
      grid: { left: 40, right: 20, top: 30, bottom: 30 },
      xAxis: { type: "category", data: hours.map((h) => `${h}时`), axisLabel: { fontSize: 10, interval: 2 } },
      yAxis: { type: "value", name: "日志数" },
      series: [{
        type: "line",
        data: counts,
        smooth: true,
        itemStyle: { color: "#f59e0b" },
        areaStyle: { color: "rgba(245, 158, 11, 0.2)" },
        lineStyle: { width: 2 },
      }],
    };
  }, [filteredData]);

  const userRankOption = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach((d) => { counts[d.user] = (counts[d.user] || 0) + 1; });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
    return {
      tooltip: { trigger: "item", formatter: (p: any) => `${p.name}<br/>操作次数: ${p.value}<br/><span style="color:#722ed1">点击筛选该用户</span>` },
      series: [{
        type: "pie",
        radius: ["35%", "65%"],
        data: sorted.map(([name, value]) => ({ name, value })),
        label: { show: true, fontSize: 11 },
        emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: "rgba(0,0,0,0.3)" } },
      }],
    };
  }, [filteredData]);

  const applyFilters = (values: SearchValues, notice?: string) => {
    const nextData = filterLogs(sortedData, values);
    setDraftSearchValues(values);
    setAppliedSearchValues(values);
    setSelectedId(nextData[0]?.id ?? null);
    if (notice) message.info(notice);
  };

  const handleSearch = () => {
    const nextData = filterLogs(sortedData, draftSearchValues);
    setAppliedSearchValues({ ...draftSearchValues });
    setSelectedId(nextData[0]?.id ?? null);
    message.success(`查询完成，共找到 ${nextData.length} 条日志`);
  };

  const handleReset = () => {
    applyFilters({});
    message.info("已重置全部查询条件");
  };

  const copyText = async (label: string, value?: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      message.success(`${label}已复制`);
    } catch {
      message.error("复制失败，请手动复制");
    }
  };

  // 图表点击联动
  const handleTypeChartClick = (params: any) => {
    if (params.name) {
      applyFilters(
        { ...appliedSearchValues, type: params.name },
        `已按操作类型筛选：${params.name}`
      );
    }
  };
  const handleModuleChartClick = (params: any) => {
    if (params.name) {
      applyFilters(
        { ...appliedSearchValues, module: params.name },
        `已按操作模块筛选：${params.name}`
      );
    }
  };
  const handleUserChartClick = (params: any) => {
    if (params.name) {
      applyFilters(
        { ...appliedSearchValues, user: params.name },
        `已按操作用户筛选：${params.name}`
      );
    }
  };

  const columns: Column<OperationLog>[] = [
    { key: "index", title: "序号", width: 56, render: (_, i) => i + 1 },
    {
      key: "logNo", title: "日志编号", width: 145,
      render: (r) => <span className="font-mono text-xs text-admin-muted">{r.logNo || `LOG-${r.id}`}</span>,
    },
    { key: "user", title: "操作用户", width: 96, render: (r) => r.user },
    {
      key: "type", title: "操作类型", width: 82,
      render: (r) => <Tag color={typeColorMap[r.type] || "gray"}>{r.type}</Tag>,
    },
    {
      key: "description", title: "操作描述", width: 210,
      render: (r) => (
        <div className="max-w-[190px] truncate" title={r.description}>{r.description}</div>
      ),
    },
    {
      key: "module", title: "操作模块", width: 130,
      render: (r) => <div className="max-w-[115px] truncate" title={r.module}>{r.module}</div>,
    },
    { key: "ip", title: "操作IP", width: 112, render: (r) => r.ip },
    { key: "time", title: "操作时间", width: 150, render: (r) => r.time },
    { key: "duration", title: "耗时(ms)", width: 84, render: (r) => <span className={getDurationColor(r.duration)}>{r.duration}</span> },
    {
      key: "status", title: "操作状态", width: 80,
      render: (r) => (
        <Tag color={r.status === "success" ? "green" : "red"}>
          {r.status === "success" ? "成功" : "失败"}
        </Tag>
      ),
    },
  ];

  const StatCard = ({
    title, value, icon: Icon, color,
  }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
  }) => (
    <div className="admin-card p-4 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
        {Icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm text-admin-muted">{title}</div>
        <div className="text-2xl font-semibold text-admin-text">{value}</div>
        <div className="text-[11px] text-admin-muted mt-0.5">当前查询结果</div>
      </div>
    </div>
  );

  const DetailRow = ({
    label, children,
  }: {
    label: string;
    children: React.ReactNode;
  }) => (
    <div className="grid grid-cols-[86px_minmax(0,1fr)] gap-3 py-2 border-b border-gray-100 last:border-0">
      <span className="text-admin-muted">{label}</span>
      <div className="text-admin-text min-w-0 break-all text-right">{children}</div>
    </div>
  );

  return (
    <div className="space-y-4">
      <PageHeader title="日志查询" subtitle="审计系统操作行为，支持多条件检索与异常追踪" />

      <SearchForm
        fields={searchFields}
        values={draftSearchValues}
        onChange={(name, value) => {
          setDraftSearchValues((previous) => ({ ...previous, [name]: value }));
        }}
        onSearch={handleSearch}
        onReset={handleReset}
        extraButtons={
          <button
            className="btn-purple flex items-center gap-1"
            onClick={() => setExportOpen(true)}
            disabled={filteredData.length === 0}
          >
            <Download size={14} />导出日志
          </button>
        }
      />

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="日志总数"
          value={totalLogs}
          icon={<FileText size={24} className="text-white" />}
          color="bg-blue-500"
        />
        <StatCard
          title="成功日志"
          value={successCount}
          icon={<CheckCircle size={24} className="text-white" />}
          color="bg-green-500"
        />
        <StatCard
          title="失败日志"
          value={failedCount}
          icon={<XCircle size={24} className="text-white" />}
          color="bg-red-500"
        />
        <StatCard
          title="失败率"
          value={failRate}
          icon={<Gauge size={24} className="text-white" />}
          color="bg-orange-500"
        />
      </div>

      <div className="flex gap-4 items-stretch">
        <div className="flex-1 min-w-0 admin-card p-4 min-h-[540px] flex flex-col">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <div className="text-sm font-medium text-admin-text">日志列表</div>
              <div className="text-xs text-admin-muted mt-0.5">
                共 {filteredData.length} 条，默认按操作时间从新到旧排列
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-admin-muted">
              <Info size={13} />
              点击任意行查看完整详情
            </div>
          </div>
          <DataTable
            key={JSON.stringify(appliedSearchValues)}
            columns={columns}
            data={filteredData}
            onRowClick={(record) => {
              setSelectedId(record.id);
            }}
            activeRowId={current?.id}
            pageSize={10}
            emptyText="暂无日志数据"
            rowClassName={(record) => record.status === "failed" ? "border-l-2 border-l-red-400" : ""}
          />
        </div>

        {/* 右侧详情面板 */}
        <div className="w-[390px] flex-shrink-0 admin-card min-h-[540px] max-h-[660px] overflow-hidden flex flex-col">
          {current ? (
            <>
              <div className="px-4 py-3 bg-gray-50 border-b border-admin-border">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-admin-text">
                    <FileText size={15} className="text-admin-primary" />
                    日志详情
                  </div>
                  <Tag color={current.status === "success" ? "green" : "red"}>
                    {current.status === "success" ? "成功" : "失败"}
                  </Tag>
                </div>
                <div className="mt-2 flex items-center gap-2 min-w-0">
                  <Tag color={typeColorMap[current.type] || "gray"}>{current.type}</Tag>
                  <span className="text-xs text-admin-text truncate" title={current.description}>
                    {current.description}
                  </span>
                </div>
              </div>

              {current.status === "failed" && current.error && (
                <div className="mx-4 mt-3 p-3 rounded border border-red-200 bg-red-50 flex gap-2">
                  <AlertTriangle size={16} className="text-admin-danger flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-admin-danger">操作失败</div>
                    <div className="text-xs text-red-700 mt-1 leading-5">{current.error}</div>
                  </div>
                </div>
              )}

              <div className="flex-1 min-h-0 overflow-auto p-4">
                <div className="text-xs">
                  <DetailRow label="日志编号">
                    <button
                      className="inline-flex items-center justify-end gap-1 font-mono hover:text-admin-primary"
                      onClick={() => copyText("日志编号", current.logNo)}
                    >
                      {current.logNo || "-"}<Clipboard size={12} />
                    </button>
                  </DetailRow>
                  <DetailRow label="追踪ID">
                    <button
                      className="inline-flex items-center justify-end gap-1 font-mono hover:text-admin-primary"
                      onClick={() => copyText("追踪ID", current.traceId)}
                    >
                      {current.traceId || "-"}<Clipboard size={12} />
                    </button>
                  </DetailRow>
                  <DetailRow label="操作描述">{current.description}</DetailRow>
                  <DetailRow label="操作用户">{current.user}</DetailRow>
                  <DetailRow label="操作类型">
                    <Tag color={typeColorMap[current.type] || "gray"}>{current.type}</Tag>
                  </DetailRow>
                  <DetailRow label="操作模块">{current.module}</DetailRow>
                  <DetailRow label="操作IP">
                  <button
                      className="inline-flex items-center justify-end gap-1 font-mono hover:text-admin-primary"
                      onClick={() => copyText("操作IP", current.ip)}
                  >
                      {current.ip}<Clipboard size={12} />
                    </button>
                  </DetailRow>
                  <DetailRow label="操作时间">{current.time}</DetailRow>
                  <DetailRow label="处理耗时">
                    <span className={getDurationColor(current.duration)}>{current.duration} ms</span>
                  </DetailRow>
                  <DetailRow label="操作状态">
                    <Tag color={current.status === "success" ? "green" : "red"}>
                      {current.status === "success" ? "成功" : "失败"}
                    </Tag>
                  </DetailRow>
                  {current.status === "failed" && (
                    <DetailRow label="失败原因">
                      <span className="text-admin-danger">{current.error || "未知错误"}</span>
                    </DetailRow>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-xs text-admin-muted">
              <FileText size={36} className="text-gray-300" />
              当前查询条件下暂无日志详情
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="admin-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={16} className="text-admin-primary" />
            <span className="text-sm font-medium text-admin-text">操作类型分布</span>
          </div>
          <ReactECharts option={typeDistOption} style={{ height: 200 }} onEvents={{ click: handleTypeChartClick }} />
        </div>

        <div className="admin-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={16} className="text-admin-primary" />
            <span className="text-sm font-medium text-admin-text">模块访问统计</span>
          </div>
          <ReactECharts option={moduleDistOption} style={{ height: 200 }} onEvents={{ click: handleModuleChartClick }} />
        </div>

        <div className="admin-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} className="text-admin-primary" />
            <span className="text-sm font-medium text-admin-text">时段分布</span>
          </div>
          <ReactECharts option={hourDistOption} style={{ height: 200 }} />
        </div>

        <div className="admin-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users size={16} className="text-admin-primary" />
            <span className="text-sm font-medium text-admin-text">用户活动</span>
          </div>
          <ReactECharts option={userRankOption} style={{ height: 200 }} onEvents={{ click: handleUserChartClick }} />
        </div>
      </div>

      <ConfirmModal
        open={exportOpen}
        title="导出日志"
        okText="确认导出"
        onCancel={() => setExportOpen(false)}
        onConfirm={() => {
          setExportOpen(false);
          message.success(`已按当前查询条件导出 ${filteredData.length} 条日志`);
        }}
        content={
          <div className="space-y-2">
            <p>将导出当前查询结果，共 {filteredData.length} 条日志。</p>
            <p className="text-xs text-admin-muted">
              导出文件仅包含当前账号有权查看的字段，敏感请求参数将保持脱敏。
            </p>
          </div>
        }
      />
    </div>
  );
}
