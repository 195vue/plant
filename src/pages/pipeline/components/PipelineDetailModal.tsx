import { useState } from "react";
import { Eye, Download } from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { Tag } from "@/components/common/Tag";
import { DataTable, type Column } from "@/components/common/DataTable";
import { message } from "@/components/common/Message";
import { documents } from "@/mock";
import type { Pipeline, DocumentItem } from "@/types";

interface PipelineDetailModalProps {
  open: boolean;
  pipeline: Pipeline | null;
  onClose: () => void;
}

// 信息项
function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-sm text-admin-muted whitespace-nowrap w-24 text-right">
        {label}：
      </span>
      <span className="text-sm text-admin-text flex-1 break-all">
        {value || <span className="text-admin-muted">-</span>}
      </span>
    </div>
  );
}

export default function PipelineDetailModal({
  open,
  pipeline,
  onClose,
}: PipelineDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"basic" | "tech" | "docs">(
    "basic"
  );

  if (!pipeline) return null;

  // 基本信息
  const basicInfo = [
    { label: "管路编码", value: pipeline.code },
    { label: "管路名称", value: pipeline.name },
    { label: "所属位置", value: pipeline.position },
    { label: "所属系统", value: pipeline.system },
    { label: "管路用途", value: pipeline.usage },
    { label: "规格(DN)", value: pipeline.dn },
    { label: "材质", value: pipeline.material },
    { label: "长度(m)", value: pipeline.length },
    { label: "安装日期", value: pipeline.installDate },
  ];

  // 技术参数
  const techInfo = [
    { label: "设计压力(MPa)", value: pipeline.designPressure },
    { label: "设计温度(℃)", value: pipeline.designTemperature },
    { label: "工作介质", value: pipeline.medium },
    { label: "壁厚(mm)", value: pipeline.wallThickness },
    { label: "防腐方式", value: "环氧涂层" },
  ];

  // 关联资料
  const relatedDocs = documents.filter(
    (d) => d.linkedType === "pipeline" && d.linkedId === pipeline.id
  );
  const docColumns: Column<DocumentItem>[] = [
    { key: "name", title: "资料名称", width: 220, render: (r) => r.name },
    { key: "category", title: "分类", width: 110, render: (r) => r.category },
    {
      key: "fileType",
      title: "类型",
      width: 80,
      render: (r) => <Tag color="purple">{r.fileType}</Tag>,
    },
    {
      key: "uploadTime",
      title: "上传日期",
      width: 150,
      render: (r) => r.uploadTime,
    },
    {
      key: "action",
      title: "操作",
      width: 130,
      render: (r) => (
        <div className="flex items-center gap-2">
          <button
            className="btn-link flex items-center gap-0.5"
            onClick={() => message.info(`预览资料：${r.name}`)}
          >
            <Eye size={13} />
            预览
          </button>
          <button
            className="btn-link flex items-center gap-0.5"
            onClick={() => message.success(`开始下载：${r.name}`)}
          >
            <Download size={13} />
            下载
          </button>
        </div>
      ),
    },
  ];

  const tabs = [
    { key: "basic", label: "基本信息" },
    { key: "tech", label: "技术参数" },
    { key: "docs", label: "关联资料" },
  ] as const;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="管路详情"
      width={720}
      footer={
        <button className="btn-default" onClick={onClose}>
          关闭
        </button>
      }
    >
      {/* 标题区 */}
      <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <Tag color="blue">{pipeline.usage}</Tag>
        <span className="text-sm font-medium text-admin-text">
          {pipeline.name}
        </span>
        <span className="text-xs text-admin-muted font-mono">
          {pipeline.code}
        </span>
      </div>
      {/* 标签卡 */}
      <div className="flex border-b border-admin-border mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? "border-admin-primary text-admin-primary font-medium"
                : "border-transparent text-admin-muted hover:text-admin-text"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* 内容 */}
      {activeTab === "basic" && (
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          {basicInfo.map((item) => (
            <InfoItem key={item.label} label={item.label} value={item.value} />
          ))}
        </div>
      )}
      {activeTab === "tech" && (
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          {techInfo.map((item) => (
            <InfoItem key={item.label} label={item.label} value={item.value} />
          ))}
        </div>
      )}
      {activeTab === "docs" && (
        <DataTable
          columns={docColumns}
          data={relatedDocs}
          pageSize={5}
          showPagination={false}
          emptyText="暂无关联资料"
        />
      )}
    </Modal>
  );
}
