import { useMemo, useState, type ReactNode } from "react";
import ReactECharts from "echarts-for-react";
import {
  BarChart3,
  Boxes,
  CheckCircle2,
  Download,
  Eye,
  File,
  FileText,
  History,
  Link2,
  PieChart,
  RefreshCw,
  Upload,
  XCircle,
} from "lucide-react";
import { drawings, equipments, pipelines } from "@/mock";
import type { DocumentItem, Drawing, DrawingVersion } from "@/types";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchForm, type SearchField } from "@/components/common/SearchForm";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Modal } from "@/components/common/Modal";
import { StatusTag, Tag } from "@/components/common/Tag";
import { message } from "@/components/common/Message";
import UploadModal, {
  type UploadFormValues,
} from "@/pages/drawing/components/UploadModal";

type ApprovalStatus = Drawing["approvalStatus"];
type ModelType = "equipment" | "pipeline";

interface ModelLink {
  key: string;
  type: ModelType;
  id: number;
  code: string;
  name: string;
  system: string;
}

type DrawingRecord = Omit<Drawing, "versions"> & {
  versions: DrawingVersion[];
  modelLinks: ModelLink[];
};

interface PreviewTarget {
  drawing: DrawingRecord;
  version: DrawingVersion;
}

interface UpdateFormState {
  fileFormat: string;
  fileSize: string;
  fileName: string;
  remark: string;
}

const fileTypeColorMap: Record<string, "red" | "blue" | "green" | "purple" | "gray"> = {
  PDF: "red",
  DWG: "blue",
  DXF: "blue",
  JPG: "purple",
  PNG: "purple",
  DOCX: "blue",
  XLSX: "green",
};

// Retained for the standalone document preview component.
export const categoryColorMap: Record<string, "blue" | "green" | "orange" | "purple" | "gray"> = {
  设备说明书: "blue",
  检修记录: "orange",
  验收报告: "green",
  设计图纸: "purple",
  竣工图纸: "blue",
  照片影像: "purple",
  检测报告: "green",
  操作规程: "gray",
};

export const getLinkedCode = (doc: DocumentItem): string => {
  if (!doc.linkedId || !doc.linkedType) return "";
  const source = doc.linkedType === "equipment" ? equipments : pipelines;
  return source.find((item) => item.id === doc.linkedId)?.code || "";
};

const approvalStatusOptions = [
  { label: "待审批", value: "pending" },
  { label: "已通过", value: "approved" },
  { label: "已驳回", value: "rejected" },
];

const linkedStatusOptions = [
  { label: "已挂接", value: "linked" },
  { label: "未挂接", value: "unlinked" },
];

const searchFields: SearchField[] = [
  {
    name: "keyword",
    label: "资料",
    type: "input",
    placeholder: "请输入编号或名称",
    width: "190px",
  },
  {
    name: "approvalStatus",
    label: "审批状态",
    type: "select",
    options: approvalStatusOptions,
    width: "120px",
  },
  {
    name: "linkedStatus",
    label: "模型挂接",
    type: "select",
    options: linkedStatusOptions,
    width: "120px",
  },
];

const modelCandidates: ModelLink[] = [
  ...equipments.slice(0, 10).map((item) => ({
    key: `equipment-${item.id}`,
    type: "equipment" as const,
    id: item.id,
    code: item.code,
    name: item.name,
    system: item.system,
  })),
  ...pipelines.slice(0, 8).map((item) => ({
    key: `pipeline-${item.id}`,
    type: "pipeline" as const,
    id: item.id,
    code: item.code,
    name: item.name,
    system: item.system,
  })),
];

const uploadModelOptions = modelCandidates.map((item) => ({
  value: item.key,
  label: `${item.type === "equipment" ? "设备" : "管路"} · ${item.code} · ${item.name}`,
}));

const initialModelLinkKeys: Record<number, string[]> = {
  1: ["equipment-1"],
  2: ["pipeline-1"],
  3: ["equipment-6"],
  6: ["equipment-1", "equipment-5"],
  8: ["pipeline-4"],
};

function formatDate(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function shiftMonth(dateText: string, months: number) {
  const date = new Date(dateText.replace(" ", "T"));
  date.setMonth(date.getMonth() - months);
  return formatDate(date);
}

function getVersionNames(currentVersion: string) {
  const match = currentVersion.match(/^V(\d+)\.(\d+)$/i);
  if (!match) return [currentVersion];
  const major = Number(match[1]);
  const minor = Number(match[2]);
  const names: string[] = [];

  for (let value = minor; value >= 0; value -= 1) {
    names.push(`V${major}.${value}`);
  }
  for (let value = major - 1; value >= 1; value -= 1) {
    names.push(`V${value}.0`);
  }
  return names;
}

function buildVersions(drawing: Drawing): DrawingVersion[] {
  return getVersionNames(drawing.version).map((version, index) => ({
    id: drawing.id * 100 + index + 1,
    drawingId: drawing.id,
    version,
    uploadTime: shiftMonth(drawing.uploadTime, index * 2),
    uploadUser: index === 0 ? drawing.uploadUser : ["系统管理员", "张操作", "张三"][index % 3],
    fileSize: drawing.fileSize,
    approvalStatus: index === 0 ? drawing.approvalStatus : "approved",
    approver: index === 0 && drawing.approvalStatus === "pending" ? undefined : "系统管理员",
    approveTime:
      index === 0 && drawing.approvalStatus === "pending"
        ? undefined
        : shiftMonth(drawing.uploadTime, index * 2),
    approveOpinion:
      index === 0
        ? drawing.approvalComment
        : index === getVersionNames(drawing.version).length - 1
          ? "初始版本审批通过"
          : "版本更新审批通过",
    remark:
      index === 0
        ? drawing.remark || (index === getVersionNames(drawing.version).length - 1 ? "初始版本" : "当前版本")
        : index === getVersionNames(drawing.version).length - 1
          ? "初始版本"
          : "历史修订版本",
  }));
}

function initializeRecords(): DrawingRecord[] {
  return drawings.map((drawing) => ({
    ...drawing,
    versions: buildVersions(drawing),
    modelLinks: (initialModelLinkKeys[drawing.id] || [])
      .map((key) => modelCandidates.find((item) => item.key === key))
      .filter((item): item is ModelLink => Boolean(item)),
  }));
}

function nextVersion(version: string) {
  const match = version.match(/^V(\d+)\.(\d+)$/i);
  if (!match) return "V1.1";
  return `V${Number(match[1])}.${Number(match[2]) + 1}`;
}

function readableFileSize(file?: globalThis.File) {
  if (!file) return "";
  if (file.size >= 1024 * 1024) return `${(file.size / 1024 / 1024).toFixed(1)}MB`;
  return `${Math.max(1, Math.round(file.size / 1024))}KB`;
}

function getFileFormat(fileName: string, fallback: string) {
  const extension = fileName.split(".").pop()?.toUpperCase();
  return extension || fallback;
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-admin-text">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function StatCard({
  icon,
  title,
  summary,
  children,
}: {
  icon: ReactNode;
  title: string;
  summary?: string;
  children: ReactNode;
}) {
  return (
    <div className="admin-card min-h-0 overflow-hidden p-3 flex flex-col">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-medium text-admin-text">
          {icon}
          {title}
        </div>
        {summary && <span className="text-[10px] text-admin-muted">{summary}</span>}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}

function BasicDetail({ drawing }: { drawing: DrawingRecord | null }) {
  if (!drawing) {
    return (
      <div className="admin-card w-[300px] flex-shrink-0 flex items-center justify-center text-sm text-admin-muted">
        请选择资料查看详情
      </div>
    );
  }

  const details = [
    { label: "资料编号", value: drawing.code },
    { label: "资料名称", value: drawing.name },
    { label: "所属专业", value: drawing.major },
    { label: "资料分类", value: drawing.category },
    { label: "所属位置", value: drawing.position },
    {
      label: "文件格式",
      value: <Tag color={fileTypeColorMap[drawing.fileFormat] || "gray"}>{drawing.fileFormat}</Tag>,
    },
    { label: "备注说明", value: drawing.remark || "—" },
  ];

  return (
    <aside className="admin-card w-[300px] flex-shrink-0 overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-admin-border">
        <div className="flex items-center gap-2 text-sm font-medium text-admin-text">
          <FileText size={15} className="text-admin-primary" />
          资料详情
        </div>
        <p className="mt-1 text-[11px] text-admin-muted">仅展示资料基础属性</p>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {details.map((item) => (
          <div key={item.label} className="flex items-start gap-2">
            <span className="w-[68px] flex-shrink-0 text-xs text-admin-muted">{item.label}</span>
            <span className="min-w-0 flex-1 break-all text-xs text-admin-text">{item.value}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}

export default function DrawingList() {
  const [data, setData] = useState<DrawingRecord[]>(initializeRecords);
  const [searchValues, setSearchValues] = useState<Record<string, string>>({});
  const [selectedId, setSelectedId] = useState<number | null>(drawings[0]?.id || null);

  const [uploadOpen, setUploadOpen] = useState(false);

  const [updateTarget, setUpdateTarget] = useState<DrawingRecord | null>(null);
  const [updateForm, setUpdateForm] = useState<UpdateFormState>({
    fileFormat: "PDF",
    fileSize: "",
    fileName: "",
    remark: "",
  });

  const [approvalTarget, setApprovalTarget] = useState<DrawingRecord | null>(null);
  const [approvalResult, setApprovalResult] = useState<"approved" | "rejected">("approved");
  const [approvalOpinion, setApprovalOpinion] = useState("");

  const [linkTarget, setLinkTarget] = useState<DrawingRecord | null>(null);
  const [pendingLinkKeys, setPendingLinkKeys] = useState<string[]>([]);
  const [versionModalTarget, setVersionModalTarget] = useState<DrawingRecord | null>(null);
  const [previewTarget, setPreviewTarget] = useState<PreviewTarget | null>(null);

  const filteredData = useMemo(() => {
    const keyword = (searchValues.keyword || "").trim().toLowerCase();
    return data.filter((item) => {
      if (keyword && !`${item.code} ${item.name}`.toLowerCase().includes(keyword)) return false;
      if (searchValues.approvalStatus && item.approvalStatus !== searchValues.approvalStatus) return false;
      if (searchValues.linkedStatus === "linked" && item.modelLinks.length === 0) return false;
      if (searchValues.linkedStatus === "unlinked" && item.modelLinks.length > 0) return false;
      return true;
    });
  }, [data, searchValues]);

  const selectedDrawing = data.find((item) => item.id === selectedId) || null;
  const statistics = useMemo(() => {
    const categoryMap = new Map<string, number>();
    filteredData.forEach((item) => {
      categoryMap.set(item.category, (categoryMap.get(item.category) || 0) + 1);
    });

    const approval = {
      approved: filteredData.filter((item) => item.approvalStatus === "approved").length,
      pending: filteredData.filter((item) => item.approvalStatus === "pending").length,
      rejected: filteredData.filter((item) => item.approvalStatus === "rejected").length,
    };
    const linkedCount = filteredData.filter((item) => item.modelLinks.length > 0).length;

    return {
      categories: Array.from(categoryMap, ([name, value]) => ({ name, value })),
      approval,
      linkedCount,
      unlinkedCount: filteredData.length - linkedCount,
    };
  }, [filteredData]);

  const openUpload = () => {
    setUploadOpen(true);
  };

  const submitUpload = (form: UploadFormValues) => {
    if (data.some((item) => item.code === form.code.trim())) return message.warning("资料编号已存在");
    const id = Math.max(...data.map((item) => item.id), 0) + 1;
    const now = formatDate(new Date());
    const fileSize = readableFileSize(form.file);
    const fileFormat = getFileFormat(form.file.name, "PDF");
    const linkedModel = modelCandidates.find((item) => item.key === form.linkedModelKey);
    const version: DrawingVersion = {
      id: id * 100 + 1,
      drawingId: id,
      version: "V1.0",
      uploadTime: now,
      uploadUser: "系统管理员",
      fileSize,
      approvalStatus: "pending",
      remark: form.remark.trim() || "初始版本",
    };
    const newDrawing: DrawingRecord = {
      id,
      code: form.code.trim(),
      name: form.name.trim(),
      version: "V1.0",
      major: form.major,
      category: form.category,
      position: form.position,
      fileFormat,
      fileSize,
      uploadUser: "系统管理员",
      uploadTime: now,
      approvalStatus: "pending",
      remark: form.remark.trim(),
      versions: [version],
      modelLinks: linkedModel ? [linkedModel] : [],
    };

    setData((items) => [newDrawing, ...items]);
    setSelectedId(id);
    setUploadOpen(false);
    message.success("资料上传成功，已进入待审批状态");
  };

  const openUpdate = (drawing: DrawingRecord) => {
    setSelectedId(drawing.id);
    setUpdateTarget(drawing);
    setUpdateForm({
      fileFormat: drawing.fileFormat,
      fileSize: "",
      fileName: "",
      remark: "",
    });
  };

  const submitUpdate = () => {
    if (!updateTarget) return;
    if (!updateForm.fileName) return message.warning("请选择更新文件");
    if (!updateForm.remark.trim()) return message.warning("请输入版本说明");

    const versionName = nextVersion(updateTarget.version);
    const now = formatDate(new Date());
    const newVersion: DrawingVersion = {
      id: Math.max(...updateTarget.versions.map((item) => item.id), updateTarget.id * 100) + 1,
      drawingId: updateTarget.id,
      version: versionName,
      uploadTime: now,
      uploadUser: "系统管理员",
      fileSize: updateForm.fileSize || updateTarget.fileSize,
      approvalStatus: "pending",
      remark: updateForm.remark.trim(),
    };

    setData((items) =>
      items.map((item) =>
        item.id === updateTarget.id
          ? {
              ...item,
              version: versionName,
              fileFormat: updateForm.fileFormat,
              fileSize: updateForm.fileSize || item.fileSize,
              uploadUser: "系统管理员",
              uploadTime: now,
              approvalStatus: "pending",
              approvalComment: undefined,
              versions: [newVersion, ...item.versions],
            }
          : item
      )
    );
    setUpdateTarget(null);
    message.success(`资料已更新为 ${versionName}，并重新进入审批`);
  };

  const openApproval = (drawing: DrawingRecord) => {
    setSelectedId(drawing.id);
    setApprovalTarget(drawing);
    setApprovalResult("approved");
    setApprovalOpinion("");
  };

  const submitApproval = () => {
    if (!approvalTarget) return;
    if (approvalResult === "rejected" && !approvalOpinion.trim()) {
      return message.warning("驳回时必须填写审批意见");
    }

    const now = formatDate(new Date());
    const opinion =
      approvalOpinion.trim() || (approvalResult === "approved" ? "审批通过" : "");
    setData((items) =>
      items.map((item) =>
        item.id === approvalTarget.id
          ? {
              ...item,
              approvalStatus: approvalResult,
              approvalComment: opinion,
              versions: item.versions.map((version, index) =>
                index === 0
                  ? {
                      ...version,
                      approvalStatus: approvalResult,
                      approver: "系统管理员",
                      approveTime: now,
                      approveOpinion: opinion,
                    }
                  : version
              ),
            }
          : item
      )
    );
    setApprovalTarget(null);
    message.success(approvalResult === "approved" ? "审批通过" : "已驳回");
  };

  const openModelLink = (drawing: DrawingRecord) => {
    setSelectedId(drawing.id);
    setLinkTarget(drawing);
    setPendingLinkKeys(drawing.modelLinks.map((item) => item.key));
  };

  const saveModelLinks = () => {
    if (!linkTarget) return;
    const links = modelCandidates.filter((item) => pendingLinkKeys.includes(item.key));
    setData((items) =>
      items.map((item) => (item.id === linkTarget.id ? { ...item, modelLinks: links } : item))
    );
    setLinkTarget(null);
    message.success("模型挂接关系已保存");
  };

  const showVersions = (drawing: DrawingRecord) => {
    setSelectedId(drawing.id);
    setVersionModalTarget(drawing);
  };

  const openCurrentPreview = (drawing: DrawingRecord) => {
    setSelectedId(drawing.id);
    setPreviewTarget({ drawing, version: drawing.versions[0] });
  };

  const downloadVersion = (drawing: DrawingRecord, version: DrawingVersion) => {
    message.success(`开始下载：${drawing.name}（${version.version}）`);
  };

  const actionButton = (
    label: string,
    onClick: () => void,
    color = "text-admin-primary"
  ) => (
    <button
      className={`text-xs hover:underline ${color}`}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      {label}
    </button>
  );

  const columns: Column<DrawingRecord>[] = [
    { key: "index", title: "序号", width: 52, render: (_, index) => index + 1 },
    {
      key: "code",
      title: "资料编号",
      width: 120,
      render: (record) => <span className="font-mono text-xs">{record.code}</span>,
    },
    {
      key: "name",
      title: "资料名称",
      width: 200,
      render: (record) => <span className="font-medium">{record.name}</span>,
    },
    {
      key: "version",
      title: "当前版本",
      width: 84,
      render: (record) => <Tag color="blue">{record.version}</Tag>,
    },
    { key: "major", title: "所属专业", width: 80, render: (record) => record.major },
    { key: "category", title: "资料分类", width: 88, render: (record) => record.category },
    {
      key: "file",
      title: "当前文件",
      width: 112,
      render: (record) => (
        <div className="flex items-center gap-1.5">
          <Tag color={fileTypeColorMap[record.fileFormat] || "gray"}>{record.fileFormat}</Tag>
          <span className="text-[11px] text-admin-muted">{record.fileSize}</span>
        </div>
      ),
    },
    { key: "uploadUser", title: "上传人", width: 92, render: (record) => record.uploadUser },
    {
      key: "uploadTime",
      title: "上传时间",
      width: 154,
      render: (record) => <span className="text-xs">{record.uploadTime}</span>,
    },
    {
      key: "approvalStatus",
      title: "审批状态",
      width: 92,
      render: (record) => <StatusTag status={record.approvalStatus} />,
    },
    {
      key: "linkedStatus",
      title: "模型挂接",
      width: 96,
      render: (record) =>
        record.modelLinks.length > 0 ? (
          <Tag color="green">已挂接 {record.modelLinks.length}</Tag>
        ) : (
          <Tag color="gray">未挂接</Tag>
        ),
    },
    {
      key: "action",
      title: "操作",
      width: 344,
      render: (record) => (
        <div className="flex items-center gap-3">
          {actionButton("查看", () => openCurrentPreview(record))}
          {actionButton("下载", () => downloadVersion(record, record.versions[0]))}
          {actionButton("更新", () => openUpdate(record))}
          {record.approvalStatus === "pending" &&
            actionButton("审批", () => openApproval(record), "text-orange-600")}
          {actionButton("模型挂接", () => openModelLink(record), "text-cyan-700")}
          {actionButton("版本记录", () => showVersions(record), "text-purple-600")}
        </div>
      ),
    },
  ];

  const versionColumns: Column<DrawingVersion>[] = [
    {
      key: "version",
      title: "版本号",
      width: 86,
      render: (version, index) => (
        <div className="flex items-center gap-1">
          <Tag color={index === 0 ? "blue" : "gray"}>{version.version}</Tag>
          {index === 0 && <span className="text-[10px] text-admin-primary">当前</span>}
        </div>
      ),
    },
    { key: "fileSize", title: "文件大小", width: 86, render: (version) => version.fileSize },
    { key: "uploadUser", title: "上传人", width: 100, render: (version) => version.uploadUser },
    {
      key: "uploadTime",
      title: "上传时间",
      width: 150,
      render: (version) => version.uploadTime,
    },
    {
      key: "approvalStatus",
      title: "审批状态",
      width: 90,
      render: (version) => <StatusTag status={version.approvalStatus} />,
    },
    { key: "approver", title: "审批人", width: 100, render: (version) => version.approver || "—" },
    {
      key: "approveTime",
      title: "审批时间",
      width: 150,
      render: (version) => version.approveTime || "—",
    },
    {
      key: "remark",
      title: "版本说明",
      width: 180,
      render: (version) => version.remark || "—",
    },
    {
      key: "action",
      title: "操作",
      width: 110,
      render: (version) => (
        <div className="flex items-center gap-3">
          <button
            className="text-xs text-admin-primary hover:underline"
            onClick={() => {
              if (!versionModalTarget) return;
              setPreviewTarget({ drawing: versionModalTarget, version });
              setVersionModalTarget(null);
            }}
          >
            查看
          </button>
          <button
            className="text-xs text-green-600 hover:underline"
            onClick={() => versionModalTarget && downloadVersion(versionModalTarget, version)}
          >
            下载
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PageHeader
        title="图纸管理"
        subtitle="资料上传、查看、下载、更新、审批、版本记录及模型挂接统一管理"
      />

      <div className="mt-2 flex-shrink-0">
        <SearchForm
          fields={searchFields}
          values={searchValues}
          onChange={(name, value) => setSearchValues((values) => ({ ...values, [name]: value }))}
          onSearch={() => {
            setSelectedId(filteredData[0]?.id || null);
            message.info(`查询完成，共 ${filteredData.length} 条`);
          }}
          onReset={() => {
            setSearchValues({});
            setSelectedId(data[0]?.id || null);
            message.info("已重置查询条件");
          }}
          extraButtons={
            <button className="btn-success flex items-center gap-1" onClick={openUpload}>
              <Upload size={14} />
              上传资料
            </button>
          }
        />
      </div>

      <div className="mt-2 flex flex-1 min-h-[270px] gap-2">
        <section className="admin-card min-w-0 flex-1 p-3 overflow-hidden">
          <DataTable
            columns={columns}
            data={filteredData}
            activeRowId={selectedId}
            onRowClick={(record) => setSelectedId(record.id)}
            pageSize={10}
            emptyText="暂无资料，请上传或调整查询条件"
          />
        </section>
        <BasicDetail drawing={selectedDrawing} />
      </div>

      <section className="mt-2 grid h-[170px] flex-shrink-0 grid-cols-3 gap-2">
        <StatCard
          icon={<PieChart size={14} className="text-admin-primary" />}
          title="资料分类分布"
          summary={`共 ${filteredData.length} 项`}
        >
          {statistics.categories.length > 0 ? (
            <ReactECharts
              style={{ height: "112px" }}
              option={{
                tooltip: { trigger: "item", formatter: "{b}：{c}项（{d}%）" },
                color: ["#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#06b6d4"],
                legend: {
                  orient: "vertical",
                  right: 4,
                  top: "middle",
                  itemWidth: 8,
                  itemHeight: 8,
                  textStyle: { fontSize: 10, color: "#64748b" },
                },
                series: [
                  {
                    type: "pie",
                    radius: ["48%", "72%"],
                    center: ["32%", "50%"],
                    label: { show: false },
                    data: statistics.categories,
                  },
                ],
              }}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-admin-muted">暂无数据</div>
          )}
        </StatCard>

        <StatCard
          icon={<BarChart3 size={14} className="text-green-600" />}
          title="审批状态分布"
          summary={`共 ${filteredData.length} 项`}
        >
          <div className="space-y-2.5 pt-1">
            {[
              { label: "已通过", value: statistics.approval.approved, color: "bg-green-500" },
              { label: "待审批", value: statistics.approval.pending, color: "bg-orange-500" },
              { label: "已驳回", value: statistics.approval.rejected, color: "bg-red-500" },
            ].map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex justify-between text-[10px]">
                  <span className="text-admin-muted">{item.label}</span>
                  <span className="font-medium text-admin-text">{item.value}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: `${filteredData.length ? (item.value / filteredData.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </StatCard>

        <StatCard
          icon={<Boxes size={14} className="text-orange-600" />}
          title="模型挂接情况"
          summary={`共 ${filteredData.length} 项`}
        >
          <div className="flex h-full items-center gap-5 px-3">
            <div className="relative h-[86px] w-[86px] flex-shrink-0 rounded-full"
              style={{
                background: filteredData.length
                  ? `conic-gradient(#22c55e 0 ${(statistics.linkedCount / filteredData.length) * 100}%, #e2e8f0 ${(statistics.linkedCount / filteredData.length) * 100}% 100%)`
                  : "#e2e8f0",
              }}
            >
              <div className="absolute inset-[10px] flex flex-col items-center justify-center rounded-full bg-white">
                <span className="text-lg font-semibold text-admin-text">{statistics.linkedCount}</span>
                <span className="text-[9px] text-admin-muted">已挂接</span>
              </div>
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-admin-muted">
                  <i className="h-2 w-2 rounded-full bg-green-500" />已挂接
                </span>
                <strong className="text-admin-text">{statistics.linkedCount}</strong>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-admin-muted">
                  <i className="h-2 w-2 rounded-full bg-slate-200" />未挂接
                </span>
                <strong className="text-admin-text">{statistics.unlinkedCount}</strong>
              </div>
            </div>
          </div>
        </StatCard>
      </section>

      <Modal
        open={Boolean(versionModalTarget)}
        onClose={() => setVersionModalTarget(null)}
        title="版本记录"
        width={980}
        footer={
          <button className="btn-default" onClick={() => setVersionModalTarget(null)}>
            关闭
          </button>
        }
      >
        {versionModalTarget && (
          <div>
            <div className="mb-3 flex items-center gap-3 rounded bg-admin-bg px-3 py-2.5">
              <History size={16} className="text-purple-600" />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-admin-text">
                  {versionModalTarget.name}
                </div>
                <div className="mt-0.5 text-xs text-admin-muted">
                  {versionModalTarget.code} · 当前版本 {versionModalTarget.version} · 共{" "}
                  {versionModalTarget.versions.length} 个版本
                </div>
              </div>
            </div>
            <div className="h-[420px]">
              <DataTable
                columns={versionColumns}
                data={versionModalTarget.versions}
                showPagination={false}
                emptyText="暂无版本记录"
              />
            </div>
          </div>
        )}
      </Modal>

      <UploadModal
        open={uploadOpen}
        defaultCode={`2026-${String(Math.max(...data.map((item) => item.id), 0) + 1).padStart(3, "0")}`}
        modelOptions={uploadModelOptions}
        onClose={() => setUploadOpen(false)}
        onSubmit={submitUpload}
      />

      <Modal
        open={Boolean(updateTarget)}
        onClose={() => setUpdateTarget(null)}
        title="更新资料"
        width={560}
        footer={
          <>
            <button className="btn-default" onClick={() => setUpdateTarget(null)}>取消</button>
            <button className="btn-primary flex items-center gap-1" onClick={submitUpdate}>
              <RefreshCw size={14} />
              确认更新
            </button>
          </>
        }
      >
        {updateTarget && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 rounded bg-admin-bg p-3 text-xs">
              <div>
                <span className="text-admin-muted">资料名称：</span>
                <span className="text-admin-text">{updateTarget.name}</span>
              </div>
              <div>
                <span className="text-admin-muted">当前版本：</span>
                <span className="text-admin-text">{updateTarget.version}</span>
              </div>
              <div>
                <span className="text-admin-muted">更新版本：</span>
                <span className="font-medium text-admin-primary">{nextVersion(updateTarget.version)}</span>
              </div>
              <div>
                <span className="text-admin-muted">更新后状态：</span>
                <span className="text-orange-600">待审批</span>
              </div>
            </div>
            <FormField label="更新文件" required>
              <input
                type="file"
                className="input-base w-full py-1.5"
                accept=".pdf,.dwg,.dxf,.jpg,.png,.doc,.docx,.xls,.xlsx"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setUpdateForm({
                    ...updateForm,
                    fileName: file?.name || "",
                    fileSize: readableFileSize(file),
                    fileFormat: getFileFormat(file?.name || "", updateForm.fileFormat),
                  });
                }}
              />
            </FormField>
            <FormField label="版本说明" required>
              <textarea
                className="input-base w-full"
                rows={3}
                placeholder="说明本次更新内容"
                value={updateForm.remark}
                onChange={(event) => setUpdateForm({ ...updateForm, remark: event.target.value })}
              />
            </FormField>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(approvalTarget)}
        onClose={() => setApprovalTarget(null)}
        title="资料审批"
        width={520}
        footer={
          <>
            <button className="btn-default" onClick={() => setApprovalTarget(null)}>取消</button>
            <button
              className={approvalResult === "approved" ? "btn-primary" : "btn-danger"}
              onClick={submitApproval}
            >
              确认{approvalResult === "approved" ? "通过" : "驳回"}
            </button>
          </>
        }
      >
        {approvalTarget && (
          <div className="space-y-4">
            <div className="rounded bg-admin-bg p-3">
              <div className="text-sm font-medium text-admin-text">{approvalTarget.name}</div>
              <div className="mt-1 text-xs text-admin-muted">
                {approvalTarget.code} · {approvalTarget.version} · {approvalTarget.fileFormat}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                className={`flex items-center justify-center gap-2 rounded border py-3 text-sm ${
                  approvalResult === "approved"
                    ? "border-green-500 bg-green-50 text-green-600"
                    : "border-admin-border text-admin-muted"
                }`}
                onClick={() => setApprovalResult("approved")}
              >
                <CheckCircle2 size={16} />
                通过
              </button>
              <button
                className={`flex items-center justify-center gap-2 rounded border py-3 text-sm ${
                  approvalResult === "rejected"
                    ? "border-red-500 bg-red-50 text-red-600"
                    : "border-admin-border text-admin-muted"
                }`}
                onClick={() => setApprovalResult("rejected")}
              >
                <XCircle size={16} />
                驳回
              </button>
            </div>
            <FormField label="审批意见" required={approvalResult === "rejected"}>
              <textarea
                className="input-base w-full"
                rows={3}
                placeholder={approvalResult === "rejected" ? "请输入驳回原因" : "请输入审批意见（选填）"}
                value={approvalOpinion}
                onChange={(event) => setApprovalOpinion(event.target.value)}
              />
            </FormField>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(linkTarget)}
        onClose={() => setLinkTarget(null)}
        title="模型挂接"
        width={720}
        footer={
          <>
            <button className="btn-default" onClick={() => setLinkTarget(null)}>取消</button>
            <button className="btn-primary flex items-center gap-1" onClick={saveModelLinks}>
              <Link2 size={14} />
              保存挂接
            </button>
          </>
        }
      >
        {linkTarget && (
          <div>
            <div className="mb-3 rounded bg-admin-bg p-3 text-xs">
              <span className="text-admin-muted">当前资料：</span>
              <span className="font-medium text-admin-text">{linkTarget.name}</span>
              <span className="ml-4 text-admin-muted">已选择 {pendingLinkKeys.length} 个模型</span>
            </div>
            <div className="max-h-[420px] overflow-auto rounded border border-admin-border">
              {modelCandidates.map((item) => {
                const checked = pendingLinkKeys.includes(item.key);
                return (
                  <label
                    key={item.key}
                    className={`flex cursor-pointer items-center gap-3 border-b border-admin-border px-3 py-2.5 last:border-0 ${
                      checked ? "bg-blue-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setPendingLinkKeys((keys) =>
                          checked ? keys.filter((key) => key !== item.key) : [...keys, item.key]
                        )
                      }
                    />
                    <Tag color={item.type === "equipment" ? "blue" : "cyan"}>
                      {item.type === "equipment" ? "设备" : "管路"}
                    </Tag>
                    <span className="w-[190px] font-mono text-xs text-admin-text">{item.code}</span>
                    <span className="min-w-0 flex-1 text-xs text-admin-text">{item.name}</span>
                    <span className="text-xs text-admin-muted">{item.system}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(previewTarget)}
        onClose={() => setPreviewTarget(null)}
        title="查看资料"
        width={760}
        footer={
          <>
            <button className="btn-default" onClick={() => setPreviewTarget(null)}>关闭</button>
            <button
              className="btn-primary flex items-center gap-1"
              onClick={() =>
                previewTarget && downloadVersion(previewTarget.drawing, previewTarget.version)
              }
            >
              <Download size={14} />
              下载
            </button>
          </>
        }
      >
        {previewTarget && (
          <div>
            <div className="mb-3 flex items-center justify-between gap-3 border-b border-admin-border pb-3">
              <div>
                <div className="text-base font-medium text-admin-text">{previewTarget.drawing.name}</div>
                <div className="mt-1 text-xs text-admin-muted">
                  {previewTarget.drawing.code} · {previewTarget.version.version} · {previewTarget.drawing.fileFormat}
                </div>
              </div>
              <StatusTag status={previewTarget.version.approvalStatus} />
            </div>
            <div className="h-[380px] rounded border border-admin-border bg-gray-50 flex flex-col items-center justify-center">
              {previewTarget.drawing.fileFormat === "PDF" ? (
                <FileText size={64} className="mb-3 text-red-400" />
              ) : (
                <File size={64} className="mb-3 text-blue-400" />
              )}
              <div className="text-sm text-admin-text">
                {previewTarget.drawing.fileFormat === "DWG"
                  ? "DWG文件请下载后使用专业工具查看"
                  : "资料在线预览"}
              </div>
              <div className="mt-1 text-xs text-admin-muted">
                {previewTarget.version.version} · {previewTarget.version.fileSize}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
