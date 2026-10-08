import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchForm, type SearchField } from "@/components/common/SearchForm";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Modal, ConfirmModal } from "@/components/common/Modal";
import { Tag } from "@/components/common/Tag";
import { UploadBox, FormItem } from "@/components/common/UploadBox";
import { message } from "@/components/common/Message";
import ObjectSelector, {
  findModelObject,
  type ModelObject,
} from "./components/ObjectSelector";
import ModelViewerModal from "./components/ModelViewerModal";

export interface ModelItem {
  id: number;
  name: string;
  /** 关联对象：模型对应的结构树节点（可多个，如一个模型含几条管道） */
  objects: ModelObject[];
  fileFormat: string;
  fileSize: string;
  version: string;
  uploadUser: string;
  uploadTime: string;
  status: "pending" | "processing" | "published";
  publishTime?: string;
  remark?: string;
}

// 按 KKS 编码从结构树取关联对象（原型模拟：编码由建模人员提供）
const objects = (
  ...items: Array<[ModelObject["type"], string]>
): ModelObject[] =>
  items
    .map(([type, kks]) => findModelObject(type, kks))
    .filter((item): item is ModelObject => Boolean(item));

const initialModels: ModelItem[] = [
  {
    id: 1,
    name: "1号机组蜗壳模型",
    objects: objects(["equipment", "1MFA41"]),
    fileFormat: "FBX",
    fileSize: "45.2MB",
    version: "V1.0",
    uploadUser: "建模团队",
    uploadTime: "2026-09-15 10:30:00",
    status: "published",
    publishTime: "2026-09-18 14:00:00",
    remark: "蜗壳整体模型，LOD2精度",
  },
  {
    id: 2,
    name: "1号机组技术供水管路模型",
    objects: objects(
      ["pipeline", "1PAC10"],
      ["pipeline", "1PAC10AA"],
      ["pipeline", "1PAC10C"],
    ),
    fileFormat: "FBX",
    fileSize: "68.4MB",
    version: "V1.0",
    uploadUser: "建模团队",
    uploadTime: "2026-09-16 09:20:00",
    status: "published",
    publishTime: "2026-09-18 14:00:00",
    remark: "含技术供水主管、阀组及自动化元件，一个模型含3条管路",
  },
  {
    id: 3,
    name: "1号机组冷却水管路模型",
    objects: objects(
      ["pipeline", "1PAC13"],
      ["pipeline", "1PAC14"],
      ["pipeline", "1PAC15"],
      ["pipeline", "1PAC16"],
    ),
    fileFormat: "FBX",
    fileSize: "52.8MB",
    version: "V1.1",
    uploadUser: "建模团队",
    uploadTime: "2026-09-20 09:15:00",
    status: "processing",
    remark: "各轴承冷却水管路合并模型，V1.1修正了管径",
  },
  {
    id: 4,
    name: "1号机组水泵水轮机转动部件模型",
    objects: objects(["equipment", "1MFA10"]),
    fileFormat: "glTF",
    fileSize: "22.3MB",
    version: "V1.0",
    uploadUser: "建模团队",
    uploadTime: "2026-09-22 16:20:00",
    status: "pending",
    remark: "转轮、主轴等转动部件，轻量化后格式",
  },
  {
    id: 5,
    name: "全厂消防水管路模型",
    objects: objects(["pipeline", "YPAA11"]),
    fileFormat: "FBX",
    fileSize: "120.5MB",
    version: "V1.0",
    uploadUser: "建模团队",
    uploadTime: "2026-09-25 11:00:00",
    status: "pending",
    remark: "消防水供水母管段整体模型",
  },
  {
    id: 6,
    name: "充排油系统管路模型",
    objects: objects(["pipeline", "YQSA10BR001-F01"]),
    fileFormat: "OBJ",
    fileSize: "5.2MB",
    version: "V2.0",
    uploadUser: "建模团队",
    uploadTime: "2026-10-01 08:30:00",
    status: "pending",
    remark: "修改了法兰连接尺寸，V2.0版本",
  },
  {
    id: 7,
    name: "通风空调系统模型",
    objects: objects(["equipment", "YSAF"], ["equipment", "YSAM"]),
    fileFormat: "FBX",
    fileSize: "580MB",
    version: "V1.0",
    uploadUser: "建模团队",
    uploadTime: "2026-10-03 14:00:00",
    status: "processing",
    remark: "通风与空调系统合并模型",
  },
  {
    id: 8,
    name: "2号机组技术供水管路模型",
    objects: objects(
      ["pipeline", "2PAC10"],
      ["pipeline", "2PAC10AA"],
      ["pipeline", "2PAC10C"],
    ),
    fileFormat: "FBX",
    fileSize: "41.0MB",
    version: "V1.0",
    uploadUser: "建模团队",
    uploadTime: "2026-10-05 09:00:00",
    status: "pending",
    remark: "含2号机组技术供水主管、阀组及自动化元件",
  },
];

const fileFormatOptions = [
  { label: "FBX", value: "FBX" },
  { label: "glTF", value: "glTF" },
  { label: "GLB", value: "GLB" },
  { label: "OBJ", value: "OBJ" },
  { label: "USD", value: "USD" },
  { label: "3DTiles", value: "3DTiles" },
  { label: "其他", value: "其他" },
];

const statusOptions = [
  { label: "待处理", value: "pending" },
  { label: "处理中", value: "processing" },
  { label: "已发布", value: "published" },
];

const statusConfig: Record<
  string,
  { color: "yellow" | "blue" | "green"; label: string }
> = {
  pending: { color: "yellow", label: "待处理" },
  processing: { color: "blue", label: "处理中" },
  published: { color: "green", label: "已发布" },
};

const searchFields: SearchField[] = [
  {
    name: "keyword",
    label: "模型名称/编码",
    type: "input",
    placeholder: "请输入模型名称或KKS编码",
    width: "200px",
  },
  {
    name: "status",
    label: "状态",
    type: "select",
    options: statusOptions,
    width: "120px",
  },
  {
    name: "fileFormat",
    label: "文件格式",
    type: "select",
    options: fileFormatOptions,
    width: "120px",
  },
];

function formatDate(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export default function ModelList() {
  const [data, setData] = useState<ModelItem[]>(initialModels);
  const [searchValues, setSearchValues] = useState<Record<string, string>>({});
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewTarget, setPreviewTarget] = useState<ModelItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ModelItem | null>(null);

  // 上传表单状态
  const [form, setForm] = useState({
    name: "",
    objects: [] as ModelObject[],
    fileFormat: "FBX",
    version: "V1.0",
    remark: "",
  });

  const filteredData = useMemo(() => {
    let list = data;

    const keyword = (searchValues.keyword || "").trim().toLowerCase();
    if (keyword) {
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(keyword) ||
          item.objects.some((obj) => obj.kks.toLowerCase().includes(keyword)),
      );
    }
    if (searchValues.status) {
      list = list.filter((item) => item.status === searchValues.status);
    }
    if (searchValues.fileFormat) {
      list = list.filter((item) => item.fileFormat === searchValues.fileFormat);
    }
    return list;
  }, [data, searchValues]);

  const statusCounts = useMemo(() => {
    const result: Record<string, number> = {
      pending: 0,
      processing: 0,
      published: 0,
    };
    data.forEach((item) => {
      result[item.status]++;
    });
    return result;
  }, [data]);

  const handleUpload = () => {
    if (!form.name.trim()) {
      message.warning("请输入模型名称");
      return;
    }
    if (form.objects.length === 0) {
      message.warning("请选择关联对象");
      return;
    }
    const id = Math.max(...data.map((item) => item.id), 0) + 1;
    const now = formatDate(new Date());
    const newItem: ModelItem = {
      id,
      name: form.name.trim(),
      objects: form.objects,
      fileFormat: form.fileFormat,
      fileSize: "—",
      version: form.version,
      uploadUser: "建模团队",
      uploadTime: now,
      status: "pending",
      remark: form.remark.trim() || undefined,
    };
    setData((items) => [newItem, ...items]);
    setUploadOpen(false);
    setForm({
      name: "",
      objects: [],
      fileFormat: "FBX",
      version: "V1.0",
      remark: "",
    });
    message.success("模型上传成功，状态为待处理");
  };

  const handleStatusChange = (id: number, status: ModelItem["status"]) => {
    setData((items) =>
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              publishTime:
                status === "published"
                  ? formatDate(new Date())
                  : item.publishTime,
            }
          : item,
      ),
    );
    const label = statusConfig[status].label;
    message.success(`已标记为「${label}」`);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setData((items) => items.filter((item) => item.id !== deleteTarget.id));
    setDeleteTarget(null);
    message.success("已删除");
  };

  const columns: Column<ModelItem>[] = [
    {
      key: "name",
      title: "模型名称",
      width: 220,
      render: (record) => (
        <span className="text-admin-text font-medium">{record.name}</span>
      ),
    },
    {
      key: "objects",
      title: "关联对象",
      width: 200,
      render: (record) => {
        const first = record.objects[0];
        if (!first) return <span className="text-admin-muted">—</span>;
        return (
          <div className="flex items-center gap-1">
            <span className="truncate text-admin-text">{first.name}</span>
            {record.objects.length > 1 && (
              <Tag color="blue">+{record.objects.length - 1}</Tag>
            )}
          </div>
        );
      },
    },
    {
      key: "codes",
      title: "编码",
      width: 150,
      render: (record) => {
        const codes = record.objects.map((obj) => obj.kks).filter(Boolean);
        if (codes.length === 0) return <span className="text-admin-muted">—</span>;
        return (
          <div className="flex items-center gap-1">
            <span className="font-mono text-xs text-admin-text">
              {codes[0]}
            </span>
            {codes.length > 1 && <Tag color="gray">+{codes.length - 1}</Tag>}
          </div>
        );
      },
    },
    {
      key: "fileFormat",
      title: "格式",
      width: 80,
      render: (record) => <Tag color="purple">{record.fileFormat}</Tag>,
    },
    {
      key: "fileSize",
      title: "大小",
      width: 90,
      render: (record) => (
        <span className="text-admin-muted">{record.fileSize}</span>
      ),
    },
    {
      key: "version",
      title: "版本",
      width: 70,
      render: (record) => <Tag color="cyan">{record.version}</Tag>,
    },
    {
      key: "uploadUser",
      title: "上传人",
      width: 90,
      render: (record) => (
        <span className="text-admin-muted">{record.uploadUser}</span>
      ),
    },
    {
      key: "uploadTime",
      title: "上传时间",
      width: 150,
      render: (record) => (
        <span className="text-xs text-admin-muted">{record.uploadTime}</span>
      ),
    },
    {
      key: "status",
      title: "状态",
      width: 90,
      render: (record) => {
        const config = statusConfig[record.status];
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      key: "actions",
      title: "操作",
      width: 260,
      render: (record) => (
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="text-xs text-admin-primary hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              setPreviewTarget(record);
            }}
          >
            在线查看
          </button>
          <button
            className="text-xs text-admin-primary hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              message.info("文件存储待对接，当前为静态数据");
            }}
          >
            下载
          </button>
          {record.status === "pending" && (
            <button
              className="text-xs text-blue-600 hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange(record.id, "processing");
              }}
            >
              标记处理中
            </button>
          )}
          {record.status === "processing" && (
            <button
              className="text-xs text-green-600 hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange(record.id, "published");
              }}
            >
              标记已发布
            </button>
          )}
          <button
            className="text-xs text-red-500 hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(record);
            }}
          >
            删除
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title="模型管理"
        subtitle={`建模成果上传与发布管理：共 ${data.length} 个模型 · 待处理 ${statusCounts.pending} · 处理中 ${statusCounts.processing} · 已发布 ${statusCounts.published}`}
        extra={
          <button
            onClick={() => setUploadOpen(true)}
            className="btn-primary flex items-center gap-1 text-xs"
          >
            <Plus size={14} />
            上传模型
          </button>
        }
      />

      <div className="mt-2 flex min-h-0 flex-1 flex-col gap-2">
        <SearchForm
          fields={searchFields}
          values={searchValues}
          onChange={(name, value) =>
            setSearchValues((prev) => ({ ...prev, [name]: value }))
          }
          onSearch={() => {}}
          onReset={() => setSearchValues({})}
        />
        <div className="min-h-0 flex-1 overflow-auto">
          <DataTable
            columns={columns}
            data={filteredData}
            rowKey="id"
            pageSize={15}
            emptyText="暂无模型数据"
          />
        </div>
      </div>

      {/* 上传弹窗 */}
      <Modal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="上传模型"
        width={620}
        footer={
          <>
            <button
              onClick={() => setUploadOpen(false)}
              className="btn-secondary text-xs"
            >
              取消
            </button>
            <button onClick={handleUpload} className="btn-primary text-xs">
              确认上传
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <FormItem label="模型名称" required>
            <input
              className="input-base text-sm"
              placeholder="请输入模型名称"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </FormItem>
          <FormItem
            label="关联对象"
            required
            hint="从结构树中选择模型对应的设备或管路，可多选（如一个模型含几条管道），编码取所选节点的KKS"
          >
            <ObjectSelector
              value={form.objects}
              onChange={(items) => setForm({ ...form, objects: items })}
            />
          </FormItem>
          <FormItem label="文件格式">
            <select
              className="input-base text-sm"
              value={form.fileFormat}
              onChange={(e) => setForm({ ...form, fileFormat: e.target.value })}
            >
              {fileFormatOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </FormItem>
          <FormItem label="版本号">
            <input
              className="input-base text-sm"
              placeholder="如 V1.0"
              value={form.version}
              onChange={(e) => setForm({ ...form, version: e.target.value })}
            />
          </FormItem>
          <FormItem label="模型文件">
            <UploadBox
              accept=".fbx,.gltf,.glb,.obj,.usd,.usda,.usdc,.3dtiles"
              maxSize={500}
              hint="支持 FBX / glTF / GLB / OBJ / USD / 3DTiles，最大500MB"
            />
          </FormItem>
          <FormItem label="备注">
            <textarea
              className="input-base resize-none text-sm"
              rows={3}
              placeholder="模型说明（精度、面数、坐标系等）"
              value={form.remark}
              onChange={(e) => setForm({ ...form, remark: e.target.value })}
            />
          </FormItem>
        </div>
      </Modal>

      {/* 在线查看（模型预览） */}
      <ModelViewerModal
        model={
          previewTarget
            ? {
                ...previewTarget,
                statusLabel: statusConfig[previewTarget.status].label,
              }
            : null
        }
        onClose={() => setPreviewTarget(null)}
      />

      {/* 删除确认 */}
      <ConfirmModal
        open={!!deleteTarget}
        title="删除确认"
        content={`确定要删除模型「${deleteTarget?.name}」吗？`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        danger
        okText="删除"
      />
    </div>
  );
}
