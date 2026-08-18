import { useState } from "react";
import {
  FileText,
  MousePointerClick,
  Eye,
  Download,
} from "lucide-react";
import { Tag } from "@/components/common/Tag";
import { message } from "@/components/common/Message";
import { documents } from "@/mock";
import type { Pipeline } from "@/types";

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs text-admin-muted whitespace-nowrap w-20 text-right">
        {label}：
      </span>
      <span className="text-xs text-admin-text flex-1 break-all">
        {value || <span className="text-admin-muted">-</span>}
      </span>
    </div>
  );
}

type TopTab = "basic" | "attr" | "docs";

interface PipelineDetailPanelProps {
  pipeline: Pipeline | null;
  onClose: () => void;
}

export default function PipelineDetailPanel({
  pipeline,
  onClose,
}: PipelineDetailPanelProps) {
  const [topTab, setTopTab] = useState<TopTab>("basic");

  if (!pipeline) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-admin-muted">
        <MousePointerClick size={48} className="text-gray-300 mb-3" />
        <p className="text-sm">请选择管路查看详情</p>
      </div>
    );
  }

  const basicInfo = [
    { label: "管路编码", value: <span className="font-mono">{pipeline.code}</span> },
    { label: "管路名称", value: pipeline.name },
    { label: "所属位置", value: pipeline.position },
    { label: "所属系统", value: pipeline.system },
    { label: "管路用途", value: pipeline.usage },
    { label: "介质类型", value: pipeline.medium || "-" },
    { label: "规格(DN)", value: pipeline.dn || "-" },
    { label: "材质", value: pipeline.material || "-" },
    { label: "长度", value: pipeline.length ? `${pipeline.length} m` : "-" },
    { label: "起点设备", value: pipeline.startDevice || "-" },
    { label: "终点设备", value: pipeline.endDevice || "-" },
  ];

  const techAttrs = [
    { name: "规格(DN)", value: pipeline.dn, unit: "" },
    { name: "材质", value: pipeline.material, unit: "" },
    { name: "壁厚", value: pipeline.wallThickness, unit: "mm" },
    { name: "设计压力", value: pipeline.designPressure, unit: "MPa" },
    { name: "设计温度", value: pipeline.designTemperature, unit: "℃" },
    { name: "工作介质", value: pipeline.medium, unit: "" },
    { name: "安装日期", value: pipeline.installDate, unit: "" },
  ];

  const relatedDocs = documents.filter(
    (d) => d.linkedType === "pipeline" && d.linkedId === pipeline.id
  );

  const topTabs: { key: TopTab; label: string; icon: React.ReactNode }[] = [
    { key: "basic", label: "基本信息", icon: <FileText size={13} /> },
    { key: "attr", label: "属性资料", icon: <FileText size={13} /> },
    { key: "docs", label: "图纸资料", icon: <FileText size={13} /> },
  ];

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-4 py-3 border-b border-admin-border flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-2 min-w-0">
          <Tag color="cyan">{pipeline.usage}</Tag>
          <h3 className="text-sm font-semibold text-admin-text truncate">{pipeline.name}</h3>
          <span className="text-xs text-admin-muted font-mono whitespace-nowrap">{pipeline.code}</span>
        </div>
        <button
          className="text-admin-muted hover:text-admin-text p-1 rounded hover:bg-gray-200 transition-colors flex-shrink-0"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      <div className="flex border-b border-admin-border px-4 bg-white">
        {topTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setTopTab(tab.key)}
            className={`flex items-center gap-1 px-3 py-2 text-xs transition-colors border-b-2 -mb-px ${
              topTab === tab.key
                ? "border-admin-primary text-admin-primary font-medium"
                : "border-transparent text-admin-muted hover:text-admin-text"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        {topTab === "basic" && (
          <div className="p-4 space-y-3">
            {basicInfo.map((item) => (
              <InfoItem key={item.label} label={item.label} value={item.value} />
            ))}
          </div>
        )}

        {topTab === "attr" && (
          <div className="p-4">
            <div className="text-xs font-medium text-admin-text mb-2 flex items-center gap-2">
              <span className="w-1 h-3 bg-blue-500 rounded inline-block" />
              技术参数
              <span className="text-admin-muted font-normal">（{techAttrs.length} 项）</span>
            </div>
            <div className="border border-admin-border rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-admin-muted border-b border-admin-border w-1/2">
                      属性名
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-admin-muted border-b border-admin-border">
                      属性值
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {techAttrs.map((attr, idx) => (
                    <tr key={attr.name} className={idx % 2 === 1 ? "bg-gray-50/50" : ""}>
                      <td className="px-3 py-2 text-admin-text border-b border-admin-border">
                        {attr.name}
                      </td>
                      <td className="px-3 py-2 text-admin-text border-b border-admin-border">
                        {attr.value || <span className="text-admin-muted">-</span>}
                        {attr.unit && (
                          <span className="text-admin-muted ml-1">({attr.unit})</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {topTab === "docs" && (
          <div className="p-4">
            {relatedDocs.length > 0 ? (
              <div className="space-y-2">
                {relatedDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="border border-admin-border rounded p-2 flex items-center gap-2 hover:bg-gray-50 transition-colors"
                  >
                    <FileText size={14} className="text-purple-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-admin-text truncate">{doc.name}</div>
                      <div className="text-[10px] text-admin-muted">
                        {doc.category} · {doc.fileType} · {doc.uploadTime}
                      </div>
                    </div>
                    <button
                      className="text-blue-500 hover:underline text-xs"
                      onClick={() => message.info(`预览：${doc.name}`)}
                    >
                      <Eye size={12} />
                    </button>
                    <button
                      className="text-green-500 hover:underline text-xs"
                      onClick={() => message.success(`下载：${doc.name}`)}
                    >
                      <Download size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-admin-muted text-sm">
                暂无图纸资料
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
