import { useParams, useNavigate } from "react-router-dom";
import { Download, Eye, FileText, Image as ImageIcon, File } from "lucide-react";
import { drawings } from "@/mock";
import type { DrawingVersion } from "@/types";
import { BackButton, Card } from "@/components/common/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Tag, StatusTag } from "@/components/common/Tag";
import { message } from "@/components/common/Message";

// 模拟版本历史数据
const mockVersions: DrawingVersion[] = [
  {
    id: 1,
    drawingId: 0,
    version: "V1.1",
    uploadTime: "2026-07-20 14:20:00",
    uploadUser: "张操作",
    fileSize: "5.8MB",
    approvalStatus: "approved",
    approver: "系统管理员",
    approveTime: "2026-07-21 10:00:00",
    approveOpinion: "审核通过，符合规范要求",
  },
  {
    id: 2,
    drawingId: 0,
    version: "V1.0",
    uploadTime: "2026-06-10 09:00:00",
    uploadUser: "系统管理员",
    fileSize: "5.2MB",
    approvalStatus: "approved",
    approver: "系统管理员",
    approveTime: "2026-06-11 10:00:00",
    approveOpinion: "初始版本审核通过",
  },
];

// 模拟审批历史数据
const mockApprovals = [
  {
    id: 1,
    version: "V1.1",
    approver: "系统管理员",
    approveTime: "2026-07-21 10:00:00",
    result: "approved" as const,
    opinion: "审核通过，符合规范要求",
  },
  {
    id: 2,
    version: "V1.0",
    approver: "系统管理员",
    approveTime: "2026-06-11 10:00:00",
    result: "approved" as const,
    opinion: "初始版本审核通过",
  },
];

export default function DrawingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const drawing = drawings.find((d) => d.id === Number(id));

  // 图纸不存在时的兜底展示
  if (!drawing) {
    return (
      <div className="space-y-4">
        <BackButton text="返回图纸列表" onClick={() => navigate("/admin/drawing")} />
        <Card title="图纸详情">
          <div className="text-center py-12 text-admin-muted">图纸不存在或已被删除</div>
        </Card>
      </div>
    );
  }

  // 基本信息字段（两列布局）
  const basicInfo: { label: string; value: React.ReactNode }[] = [
    { label: "图纸编号", value: drawing.code },
    { label: "图纸名称", value: drawing.name },
    { label: "所属专业", value: drawing.major },
    { label: "图纸分类", value: drawing.category },
    { label: "所属位置", value: drawing.position },
    { label: "当前版本", value: drawing.version },
    { label: "文件格式", value: <Tag color="red">{drawing.fileFormat}</Tag> },
    { label: "文件大小", value: drawing.fileSize },
    { label: "上传人", value: drawing.uploadUser },
    { label: "上传时间", value: drawing.uploadTime },
    { label: "审批状态", value: <StatusTag status={drawing.approvalStatus} /> },
    { label: "备注", value: drawing.remark || "-" },
  ];

  // 版本历史列定义
  const versionColumns: Column<DrawingVersion>[] = [
    { key: "version", title: "版本号", width: 90, render: (r) => r.version },
    { key: "uploadTime", title: "上传时间", width: 160, render: (r) => r.uploadTime },
    { key: "uploadUser", title: "上传人", width: 100, render: (r) => r.uploadUser },
    { key: "fileSize", title: "文件大小", width: 100, render: (r) => r.fileSize },
    {
      key: "approvalStatus",
      title: "审批状态",
      width: 90,
      render: (r) => <StatusTag status={r.approvalStatus} />,
    },
    { key: "approver", title: "审批人", width: 100, render: (r) => r.approver || "-" },
    { key: "approveTime", title: "审批时间", width: 160, render: (r) => r.approveTime || "-" },
    {
      key: "action",
      title: "操作",
      width: 140,
      render: (r) => (
        <div className="flex items-center gap-2">
          <button
            className="btn-link flex items-center gap-0.5"
            onClick={() => message.success(`下载版本：${r.version}`)}
          >
            <Download size={13} />
            下载
          </button>
          <button
            className="btn-link flex items-center gap-0.5"
            onClick={() => message.info(`查看版本：${r.version}`)}
          >
            <Eye size={13} />
            查看
          </button>
        </div>
      ),
    },
  ];

  // 审批历史列定义
  const approvalColumns: Column<(typeof mockApprovals)[number]>[] = [
    { key: "version", title: "版本号", width: 100, render: (r) => r.version },
    { key: "approver", title: "审批人", width: 120, render: (r) => r.approver },
    { key: "approveTime", title: "审批时间", width: 180, render: (r) => r.approveTime },
    {
      key: "result",
      title: "审批结果",
      width: 100,
      render: (r) => <StatusTag status={r.result} />,
    },
    { key: "opinion", title: "审批意见", render: (r) => r.opinion },
  ];

  // 图纸预览区：根据文件格式差异化展示
  const renderPreview = () => {
    if (drawing.fileFormat === "PDF") {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-admin-muted">
          <FileText size={56} className="text-red-400 mb-3" />
          <p className="text-sm text-admin-text mb-1">{drawing.name}</p>
          <p className="text-xs text-admin-muted mb-4">PDF文件，可在线预览</p>
          <button
            className="btn-primary flex items-center gap-1"
            onClick={() => message.success("打开在线预览")}
          >
            <Eye size={14} />
            在线预览
          </button>
        </div>
      );
    }
    if (drawing.fileFormat === "DWG") {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-admin-muted">
          <File size={56} className="text-blue-400 mb-3" />
          <p className="text-sm text-admin-text mb-1">{drawing.name}</p>
          <p className="text-xs text-admin-muted mb-4">
            DWG格式不支持在线预览，请下载后使用专业工具查看
          </p>
          <button
            className="btn-primary flex items-center gap-1"
            onClick={() => message.success(`开始下载：${drawing.name}`)}
          >
            <Download size={14} />
            下载文件
          </button>
        </div>
      );
    }
    // 图片格式（JPG/PNG等）
    return (
      <div className="flex flex-col items-center justify-center py-16 text-admin-muted">
        <ImageIcon size={56} className="text-green-400 mb-3" />
        <p className="text-sm text-admin-text mb-1">{drawing.name}</p>
        <p className="text-xs text-admin-muted mb-4">图片文件，点击查看大图</p>
        <img
          src="/favicon.svg"
          alt={drawing.name}
          className="max-w-xs max-h-48 border border-admin-border rounded mb-4"
        />
        <button
          className="btn-primary flex items-center gap-1"
          onClick={() => message.info("查看大图")}
        >
          <Eye size={14} />
          查看大图
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <BackButton text="返回图纸列表" onClick={() => navigate("/admin/drawing")} />

      {/* 基本信息卡片 */}
      <Card title="基本信息">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          {basicInfo.map((item) => (
            <div key={item.label} className="flex items-start gap-2">
              <span className="text-sm text-admin-muted whitespace-nowrap w-20 text-right">
                {item.label}：
              </span>
              <span className="text-sm text-admin-text flex-1 break-all">{item.value}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 图纸预览区卡片 */}
      <Card title="图纸预览">{renderPreview()}</Card>

      {/* 版本历史卡片 */}
      <Card title="版本历史">
        <DataTable
          columns={versionColumns}
          data={mockVersions}
          pageSize={10}
          showPagination={false}
          emptyText="暂无版本历史"
        />
      </Card>

      {/* 审批历史卡片 */}
      <Card title="审批历史">
        <DataTable
          columns={approvalColumns}
          data={mockApprovals}
          pageSize={10}
          showPagination={false}
          emptyText="暂无审批记录"
        />
      </Card>
    </div>
  );
}
