import { useState, useEffect } from "react";
import { X, Download, ExternalLink, AlertTriangle, CheckCircle, Database, Calculator, Table } from "lucide-react";
import { message } from "@/components/common/Message";

export interface DrillDownData {
  pointName: string;
  deviceName: string;
  kksCode: string;
  metricValue: string;
  unit: string;
  timestamp: string;
  dataSource: {
    pointId: string;
    pointName: string;
    kksCode: string;
    deviceName: string;
    collectionDevice: string;
    sampleRate: string;
    dataQuality: string;
  };
  formula: {
    description: string;
    formula: string;
    inputs: { name: string; value: string; source: string }[];
  };
  rawData: {
    timestamp: string;
    value: string;
    unit: string;
    quality: string;
  }[];
  abnormal?: {
    isAbnormal: boolean;
    threshold: string;
    actualValue: string;
    rule: string;
    alarmRecord?: {
      time: string;
      level: string;
      status: string;
    };
  };
}

interface DrillDownModalProps {
  open: boolean;
  onClose: () => void;
  data: DrillDownData | null;
  onExport?: (data: DrillDownData) => void;
  onLocateBIM?: (kksCode: string) => void;
}

type TabKey = "source" | "formula" | "raw";

export default function DrillDownModal({ open, onClose, data, onExport, onLocateBIM }: DrillDownModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("source");

  // 切换不同图表的钻取数据时，重置 Tab 到"数据源测点信息"
  useEffect(() => {
    if (open && data) {
      setActiveTab("source");
    }
  }, [data, open]);

  if (!open || !data) return null;

  const rawData = data.rawData || [];

  const handleOpenRealtime = () => {
    message.info(
      `实际项目中：将跳转至“${data.pointName}”实时监测页面，并自动携带KKS编码、测点编号和当前查询时间范围。`
    );
  };

  const handleExport = () => {
    onExport?.(data);
    message.success(
      `实际项目中：将按测点“${data.dataSource.pointId}”和当前时间范围生成CSV文件，包含数值、单位、质量码及异常标记。`
    );
  };

  const tabs = [
    { key: "source" as TabKey, label: "数据源测点信息", icon: Database },
    { key: "formula" as TabKey, label: "指标计算公式", icon: Calculator },
    { key: "raw" as TabKey, label: "原始明细数据", icon: Table },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gradient-to-b from-[#0d1b2a] to-[#0a1628] border border-[#40A9FF]/50 shadow-2xl w-[720px] max-h-[85vh] flex flex-col">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#40A9FF]/30 bg-[#40A9FF]/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#40A9FF]/30 flex items-center justify-center">
              <Database size={16} className="text-[#40A9FF]" />
            </div>
            <div>
              <h3 className="text-base font-medium text-white">
                {data.pointName}
                <span className="text-sm text-screen-muted ml-2">/ {data.deviceName}</span>
              </h3>
              <div className="text-xs text-screen-muted mt-0.5">
                KKS: <span className="text-[#40A9FF] font-mono">{data.kksCode}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-screen-muted">当前值</div>
              <div className="text-lg font-bold text-[#40A9FF]">
                {data.metricValue} <span className="text-xs font-normal">{data.unit}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-screen-muted hover:text-white transition-colors w-7 h-7 flex items-center justify-center"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 异常提示 */}
        {data.abnormal?.isAbnormal && (
          <div className="mx-5 mt-3 px-3 py-2 bg-red-500/20 border border-red-500/50 flex items-center gap-2 text-sm">
            <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <span className="text-red-400 font-medium">异常数据：</span>
              <span className="text-screen-text">
                实际值 {data.abnormal.actualValue}，阈值 {data.abnormal.threshold}，判定规则：{data.abnormal.rule}
              </span>
            </div>
          </div>
        )}

        {/* Tab切换 */}
        <div className="flex border-b border-[#40A9FF]/30 px-5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm transition-colors border-b-2 -mb-px ${
                  activeTab === tab.key
                    ? "text-[#40A9FF] border-[#40A9FF]"
                    : "text-screen-muted hover:text-white border-transparent"
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab内容 */}
        <div className="flex-1 overflow-auto p-5">
          {activeTab === "source" && (
            <div className="space-y-4">
              <div className="bg-black/30 border border-[#40A9FF]/20 p-4 rounded">
                <div className="text-xs text-[#40A9FF] font-medium mb-3">测点基本信息</div>
                <div className="grid grid-cols-2 gap-y-2 gap-x-6 text-sm">
                  <div>
                    <span className="text-screen-muted">测点编号：</span>
                    <span className="text-screen-text font-mono">{data.dataSource.pointId}</span>
                  </div>
                  <div>
                    <span className="text-screen-muted">测点名称：</span>
                    <span className="text-screen-text">{data.dataSource.pointName}</span>
                  </div>
                  <div>
                    <span className="text-screen-muted">KKS编码：</span>
                    <span className="text-[#40A9FF] font-mono">{data.dataSource.kksCode}</span>
                  </div>
                  <div>
                    <span className="text-screen-muted">所属设备：</span>
                    <span className="text-screen-text">{data.dataSource.deviceName}</span>
                  </div>
                  <div>
                    <span className="text-screen-muted">采集装置：</span>
                    <span className="text-screen-text">{data.dataSource.collectionDevice}</span>
                  </div>
                  <div>
                    <span className="text-screen-muted">采样频率：</span>
                    <span className="text-screen-text">{data.dataSource.sampleRate}</span>
                  </div>
                  <div>
                    <span className="text-screen-muted">数据质量：</span>
                    <span className={data.dataSource.dataQuality === "正常" ? "text-green-400" : "text-red-400"}>
                      <CheckCircle size={12} className="inline mr-1" />
                      {data.dataSource.dataQuality}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-black/30 border border-[#40A9FF]/20 p-4 rounded">
                <div className="text-xs text-[#40A9FF] font-medium mb-3">操作</div>
                <div className="flex gap-2">
                  <button
                    onClick={handleOpenRealtime}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#40A9FF]/20 border border-[#40A9FF]/50 text-[#40A9FF] text-sm hover:bg-[#40A9FF]/30 transition-colors rounded"
                  >
                    <ExternalLink size={14} />
                    跳转实时监测页面
                  </button>
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#40A9FF]/20 border border-[#40A9FF]/50 text-[#40A9FF] text-sm hover:bg-[#40A9FF]/30 transition-colors rounded"
                  >
                    <Download size={14} />
                    导出原始时序数据
                  </button>
                  <button
                    onClick={() => onLocateBIM?.(data.kksCode)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#40A9FF]/20 border border-[#40A9FF]/50 text-[#40A9FF] text-sm hover:bg-[#40A9FF]/30 transition-colors rounded"
                  >
                    <ExternalLink size={14} />
                    3D模型定位
                  </button>
                </div>
              </div>

              {data.abnormal?.alarmRecord && (
                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded">
                  <div className="text-xs text-red-400 font-medium mb-3">关联报警记录</div>
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="text-screen-muted">报警时间：</span>
                      <span className="text-screen-text">{data.abnormal.alarmRecord.time}</span>
                    </div>
                    <div>
                      <span className="text-screen-muted">报警级别：</span>
                      <span className="text-red-400">{data.abnormal.alarmRecord.level}</span>
                    </div>
                    <div>
                      <span className="text-screen-muted">处理状态：</span>
                      <span className="text-screen-text">{data.abnormal.alarmRecord.status}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "formula" && (
            <div className="space-y-4">
              <div className="bg-black/30 border border-[#40A9FF]/20 p-4 rounded">
                <div className="text-xs text-[#40A9FF] font-medium mb-3">指标计算说明</div>
                <div className="text-sm text-screen-text mb-4">{data.formula.description}</div>
                <div className="bg-[#0a1628] border border-[#40A9FF]/20 p-3 rounded font-mono text-sm text-green-400">
                  {data.formula.formula}
                </div>
              </div>

              <div className="bg-black/30 border border-[#40A9FF]/20 p-4 rounded">
                <div className="text-xs text-[#40A9FF] font-medium mb-3">参与运算变量</div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-screen-muted border-b border-[#40A9FF]/20">
                      <th className="text-left py-2">变量名</th>
                      <th className="text-left py-2">当前值</th>
                      <th className="text-left py-2">数据来源</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.formula.inputs.map((input, i) => (
                      <tr key={i} className="border-b border-[#40A9FF]/10">
                        <td className="py-2 text-green-300 font-mono">{input.name}</td>
                        <td className="py-2 text-screen-text">{input.value}</td>
                        <td className="py-2 text-screen-muted">{input.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "raw" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-screen-muted">
                  共 {rawData.length} 条采样数据，展示最近10小时
                </div>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-1 text-xs text-[#40A9FF] hover:text-[#69b1ff] transition-colors"
                >
                  <Download size={12} />
                  导出全部原始数据
                </button>
              </div>

              <div className="bg-black/30 border border-[#40A9FF]/20 rounded overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#40A9FF]/10 text-[#40A9FF]">
                      <th className="text-left px-3 py-2">采集时间</th>
                      <th className="text-left px-3 py-2">
                        {data.pointName} ({data.unit})
                      </th>
                      <th className="text-left px-3 py-2">数据质量</th>
                      <th className="text-left px-3 py-2">异常标记</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rawData.map((row, i) => (
                      <tr
                        key={i}
                        className={`border-t border-[#40A9FF]/10 ${
                          row.quality === "异常" ? "bg-red-500/10" : ""
                        }`}
                      >
                        <td className="px-3 py-1.5 text-screen-muted font-mono">{row.timestamp}</td>
                        <td
                          className={`px-3 py-1.5 font-mono ${
                            row.quality === "异常" ? "text-red-400" : "text-screen-text"
                          }`}
                        >
                          {row.value} {row.unit}
                        </td>
                        <td className="px-3 py-1.5">
                          {row.quality === "正常" ? (
                            <span className="text-green-400">● 正常</span>
                          ) : (
                            <span className="text-red-400">● 异常</span>
                          )}
                        </td>
                        <td className="px-3 py-1.5">
                          {row.quality === "异常" ? (
                            <span className="text-red-400">超阈值</span>
                          ) : (
                            <span className="text-screen-muted">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* 底部操作 */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#40A9FF]/30 bg-black/30">
          <div className="text-xs text-screen-muted">
            数据采集时间：{data.timestamp} | 刷新频率：5秒
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-sm bg-[#40A9FF]/20 text-[#40A9FF] hover:bg-[#40A9FF]/30 transition-colors rounded"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
