import { useMemo, useState, type ReactNode } from "react";
import {
  ChevronRight,
  Download,
  Edit3,
  Eye,
  File,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  History,
  Link2,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import { drawings, equipments, pipelines } from "@/mock";
import {
  buildStructureTree,
  type TreeNode,
} from "@/mock/structureTree";
import type { DocumentItem, Drawing, DrawingVersion } from "@/types";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchForm, type SearchField } from "@/components/common/SearchForm";
import { DataTable, type Column } from "@/components/common/DataTable";
import { ConfirmModal, Modal } from "@/components/common/Modal";
import { Tag } from "@/components/common/Tag";
import { message } from "@/components/common/Message";
import UploadModal, {
  type UploadFormValues,
} from "@/pages/drawing/components/UploadModal";
import ModelLinkSelector, {
  type ModelLinkOption,
} from "@/pages/drawing/components/ModelLinkSelector";
import { DevNote } from "@/components/devNotes/DevNote";

interface MaterialDirectory {
  id: number;
  name: string;
  parentId: number | null;
}

interface ModelLink extends ModelLinkOption {
  id: number;
}

type DrawingRecord = Omit<Drawing, "versions" | "directoryId"> & {
  directoryId: number;
  versions: DrawingVersion[];
  modelLinks: ModelLink[];
};

interface PreviewTarget {
  drawing: DrawingRecord;
  version: DrawingVersion;
}

interface UpdateFormState {
  file?: globalThis.File;
  fileFormat: string;
  fileSize: string;
  remark: string;
}

interface DirectoryFormState {
  name: string;
  parentId: number | null;
}

const fileTypeColorMap: Record<
  string,
  "red" | "blue" | "green" | "purple" | "gray"
> = {
  PDF: "red",
  DWG: "blue",
  DXF: "blue",
  JPG: "purple",
  PNG: "purple",
  DOCX: "blue",
  XLSX: "green",
};

export const categoryColorMap: Record<
  string,
  "blue" | "green" | "orange" | "purple" | "gray"
> = {
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

const initialDirectories: MaterialDirectory[] = [
  { id: 1, name: "工程图纸", parentId: null },
  { id: 2, name: "设备资料", parentId: null },
  { id: 3, name: "管路资料", parentId: null },
  { id: 4, name: "其他资料", parentId: null },
  { id: 5, name: "水工图纸", parentId: 1 },
  { id: 6, name: "机电图纸", parentId: 1 },
];

const linkedStatusOptions = [
  { label: "已挂接", value: "linked" },
  { label: "未挂接", value: "unlinked" },
];

const majorOptions = [
  { label: "水工", value: "水工" },
  { label: "机械", value: "机械" },
  { label: "电气", value: "电气" },
  { label: "暖通", value: "暖通" },
  { label: "消防", value: "消防" },
  { label: "其他", value: "其他" },
];

const categoryOptions = [
  { label: "竣工图", value: "竣工图" },
  { label: "设计图", value: "设计图" },
  { label: "施工图", value: "施工图" },
  { label: "变更图", value: "变更图" },
  { label: "其他", value: "其他" },
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
    name: "major",
    label: "所属专业",
    type: "select",
    options: majorOptions,
    width: "120px",
  },
  {
    name: "category",
    label: "资料分类",
    type: "select",
    options: categoryOptions,
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

function buildModelCandidates(type: "equipment" | "pipeline"): ModelLink[] {
  const candidates: ModelLink[] = [];

  const walk = (nodes: TreeNode[], system = "") => {
    nodes.forEach((node) => {
      const currentSystem = node.level === "L2" ? node.name : system;
      candidates.push({
        key: `${type}-${node.id}`,
        type,
        id: node.id,
        code: node.kks,
        name: node.name,
        system: currentSystem || node.name,
        level: node.level,
        isGroup: node.category === "system",
      });
      if (node.children) walk(node.children, currentSystem);
    });
  };

  walk(buildStructureTree(type));
  return candidates;
}

const modelCandidates: ModelLink[] = [
  ...buildModelCandidates("equipment"),
  ...buildModelCandidates("pipeline"),
];

const initialModelLinkReferences: Record<
  number,
  Array<Pick<ModelLink, "type" | "code">>
> = {
  1: [{ type: "equipment", code: "1MFA10HB001" }],
  2: [{ type: "pipeline", code: "1PAC10" }],
  3: [{ type: "equipment", code: "1MFB10AP001" }],
  6: [
    { type: "equipment", code: "1MFA10HB001" },
    { type: "equipment", code: "1MFB10AA001" },
  ],
  8: [{ type: "pipeline", code: "YPAA12" }],
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
  const names = getVersionNames(drawing.version);
  return names.map((version, index) => ({
    id: drawing.id * 100 + index + 1,
    drawingId: drawing.id,
    version,
    uploadTime: shiftMonth(drawing.uploadTime, index * 2),
    uploadUser:
      index === 0
        ? drawing.uploadUser
        : ["系统管理员", "张操作", "张三"][index % 3],
    fileSize: drawing.fileSize,
    fileFormat: drawing.fileFormat,
    remark:
      index === 0
        ? drawing.remark || (names.length === 1 ? "初始版本" : "当前版本")
        : index === names.length - 1
          ? "初始版本"
          : "历史修订版本",
  }));
}

function initialDirectoryId(drawing: Drawing) {
  if (drawing.name.includes("管") || drawing.name.includes("P&ID")) return 3;
  if (drawing.major === "水工") return 5;
  if (drawing.category.includes("图")) return 6;
  return 4;
}

function initializeRecords(): DrawingRecord[] {
  return drawings.map((drawing) => ({
    ...drawing,
    directoryId: drawing.directoryId || initialDirectoryId(drawing),
    versions: buildVersions(drawing),
    modelLinks: (initialModelLinkReferences[drawing.id] || [])
      .map((reference) =>
        modelCandidates.find(
          (item) =>
            item.type === reference.type && item.code === reference.code,
        ),
      )
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
  if (file.size >= 1024 * 1024) {
    return `${(file.size / 1024 / 1024).toFixed(1)}MB`;
  }
  return `${Math.max(1, Math.round(file.size / 1024))}KB`;
}

function getFileFormat(fileName: string, fallback: string) {
  return fileName.split(".").pop()?.toUpperCase() || fallback;
}

function flattenDirectories(
  directories: MaterialDirectory[],
  parentId: number | null = null,
  depth = 0,
): Array<MaterialDirectory & { depth: number }> {
  return directories
    .filter((item) => item.parentId === parentId)
    .flatMap((item) => [
      { ...item, depth },
      ...flattenDirectories(directories, item.id, depth + 1),
    ]);
}

function getDescendantIds(
  directoryId: number,
  directories: MaterialDirectory[],
): number[] {
  const childIds = directories
    .filter((item) => item.parentId === directoryId)
    .flatMap((item) => getDescendantIds(item.id, directories));
  return [directoryId, ...childIds];
}

function getDirectoryPath(
  directoryId: number,
  directories: MaterialDirectory[],
) {
  const path: string[] = [];
  let current = directories.find((item) => item.id === directoryId);
  while (current) {
    path.unshift(current.name);
    current = directories.find((item) => item.id === current?.parentId);
  }
  return path.join(" / ") || "未分类";
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

export default function DrawingList() {
  const [data, setData] = useState<DrawingRecord[]>(initializeRecords);
  const [directories, setDirectories] =
    useState<MaterialDirectory[]>(initialDirectories);
  const [selectedDirectoryId, setSelectedDirectoryId] = useState<number | null>(
    null,
  );
  const [searchValues, setSearchValues] = useState<Record<string, string>>({});
  const [uploadOpen, setUploadOpen] = useState(false);
  const [detailTarget, setDetailTarget] = useState<DrawingRecord | null>(null);
  const [updateTarget, setUpdateTarget] = useState<DrawingRecord | null>(null);
  const [updateForm, setUpdateForm] = useState<UpdateFormState>({
    fileFormat: "PDF",
    fileSize: "",
    remark: "",
  });
  const [linkTarget, setLinkTarget] = useState<DrawingRecord | null>(null);
  const [pendingLinkKeys, setPendingLinkKeys] = useState<string[]>([]);
  const [versionModalTarget, setVersionModalTarget] =
    useState<DrawingRecord | null>(null);
  const [previewTarget, setPreviewTarget] = useState<PreviewTarget | null>(null);
  const [directoryModalMode, setDirectoryModalMode] = useState<
    "add" | "edit" | null
  >(null);
  const [directoryForm, setDirectoryForm] = useState<DirectoryFormState>({
    name: "",
    parentId: null,
  });
  const [deleteDirectoryTarget, setDeleteDirectoryTarget] =
    useState<MaterialDirectory | null>(null);

  const flatDirectories = useMemo(
    () => flattenDirectories(directories),
    [directories],
  );

  const filteredData = useMemo(() => {
    const keyword = (searchValues.keyword || "").trim().toLowerCase();
    const directoryScope = selectedDirectoryId
      ? new Set(getDescendantIds(selectedDirectoryId, directories))
      : null;

    return data.filter((item) => {
      if (directoryScope && !directoryScope.has(item.directoryId)) return false;
      if (
        keyword &&
        !`${item.code} ${item.name}`.toLowerCase().includes(keyword)
      ) {
        return false;
      }
      if (searchValues.major && item.major !== searchValues.major) return false;
      if (searchValues.category && item.category !== searchValues.category) {
        return false;
      }
      if (
        searchValues.linkedStatus === "linked" &&
        item.modelLinks.length === 0
      ) {
        return false;
      }
      if (
        searchValues.linkedStatus === "unlinked" &&
        item.modelLinks.length > 0
      ) {
        return false;
      }
      return true;
    });
  }, [data, directories, searchValues, selectedDirectoryId]);

  const directoryCounts = useMemo(() => {
    const result = new Map<number, number>();
    directories.forEach((directory) => {
      const scope = new Set(getDescendantIds(directory.id, directories));
      result.set(
        directory.id,
        data.filter((item) => scope.has(item.directoryId)).length,
      );
    });
    return result;
  }, [data, directories]);

  const activeDirectory = selectedDirectoryId
    ? directories.find((item) => item.id === selectedDirectoryId) || null
    : null;

  const nextRecordId = Math.max(...data.map((item) => item.id), 0) + 1;
  const makeCode = (id: number) => `2026-${String(id).padStart(3, "0")}`;

  const submitUpload = (form: UploadFormValues) => {
    if (form.mode === "single") {
      if (data.some((item) => item.code === form.code.trim())) {
        message.warning("资料编号已存在");
        return;
      }
      const id = nextRecordId;
      const now = formatDate(new Date());
      const fileSize = readableFileSize(form.file);
      const fileFormat = getFileFormat(form.file.name, "PDF");
      const linkedModels = modelCandidates.filter((item) =>
        form.linkedModelKeys.includes(item.key),
      );
      const version: DrawingVersion = {
        id: id * 100 + 1,
        drawingId: id,
        version: "V1.0",
        uploadTime: now,
        uploadUser: "系统管理员",
        fileSize,
        fileFormat,
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
        directoryId: form.directoryId,
        fileFormat,
        fileSize,
        uploadUser: "系统管理员",
        uploadTime: now,
        remark: form.remark.trim(),
        versions: [version],
        modelLinks: linkedModels,
      };

      setData((items) => [newDrawing, ...items]);
      setSelectedDirectoryId(form.directoryId);
      setUploadOpen(false);
      message.success(
        linkedModels.length > 0
          ? `资料上传成功，已挂接 ${linkedModels.length} 个对象`
          : "资料上传成功，已生成V1.0",
      );
      return;
    }

    const readyItems = form.items.filter((item) => item.status === "ready");
    const now = formatDate(new Date());
    const newRecords = readyItems.map((item, index) => {
      const id = nextRecordId + index;
      const version: DrawingVersion = {
        id: id * 100 + 1,
        drawingId: id,
        version: "V1.0",
        uploadTime: now,
        uploadUser: "系统管理员",
        fileSize: item.sizeText,
        fileFormat: item.extension,
        remark: form.remark.trim() || "ZIP批量导入初始版本",
      };
      return {
        id,
        code: makeCode(id),
        name: item.name.trim(),
        version: "V1.0",
        major: form.major,
        category: form.category,
        position: form.position,
        directoryId: form.directoryId,
        fileFormat: item.extension,
        fileSize: item.sizeText,
        uploadUser: "系统管理员",
        uploadTime: now,
        remark: form.remark.trim(),
        versions: [version],
        modelLinks: [],
      } satisfies DrawingRecord;
    });

    setData((items) => [...newRecords, ...items]);
    setSelectedDirectoryId(form.directoryId);
    const skipped = form.items.filter((item) => item.status === "skipped").length;
    const failed = form.items.filter((item) => item.status === "failed").length;
    message.success(
      `批量导入完成：成功 ${newRecords.length} 项，跳过 ${skipped} 项，失败 ${failed} 项`,
    );
  };

  const openUpdate = (drawing: DrawingRecord) => {
    setUpdateTarget(drawing);
    setUpdateForm({
      fileFormat: drawing.fileFormat,
      fileSize: "",
      remark: "",
    });
  };

  const selectUpdateFile = (file?: globalThis.File) => {
    if (!file) {
      setUpdateForm((current) => ({
        ...current,
        file: undefined,
        fileSize: "",
      }));
      return;
    }
    const format = getFileFormat(file.name, "");
    if (!["PDF", "DWG"].includes(format)) {
      message.warning("更新文件只支持PDF或DWG格式");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      message.warning("更新文件大小不能超过50MB");
      return;
    }
    setUpdateForm((current) => ({
      ...current,
      file,
      fileFormat: format,
      fileSize: readableFileSize(file),
    }));
  };

  const submitUpdate = () => {
    if (!updateTarget) return;
    if (!updateForm.file) {
      message.warning("请选择更新文件");
      return;
    }
    if (!updateForm.remark.trim()) {
      message.warning("请输入版本说明");
      return;
    }

    const versionName = nextVersion(updateTarget.version);
    const now = formatDate(new Date());
    const newVersion: DrawingVersion = {
      id:
        Math.max(
          ...updateTarget.versions.map((item) => item.id),
          updateTarget.id * 100,
        ) + 1,
      drawingId: updateTarget.id,
      version: versionName,
      uploadTime: now,
      uploadUser: "系统管理员",
      fileSize: updateForm.fileSize,
      fileFormat: updateForm.fileFormat,
      remark: updateForm.remark.trim(),
    };

    setData((items) =>
      items.map((item) =>
        item.id === updateTarget.id
          ? {
              ...item,
              version: versionName,
              fileFormat: updateForm.fileFormat,
              fileSize: updateForm.fileSize,
              uploadUser: "系统管理员",
              uploadTime: now,
              versions: [newVersion, ...item.versions],
            }
          : item,
      ),
    );
    setUpdateTarget(null);
    message.success(
      `资料已更新为 ${versionName}，并继承 ${updateTarget.modelLinks.length} 项模型挂接关系`,
    );
  };

  const openModelLink = (drawing: DrawingRecord) => {
    setLinkTarget(drawing);
    setPendingLinkKeys(drawing.modelLinks.map((item) => item.key));
  };

  const saveModelLinks = () => {
    if (!linkTarget) return;
    const links = modelCandidates.filter((item) =>
      pendingLinkKeys.includes(item.key),
    );
    setData((items) =>
      items.map((item) =>
        item.id === linkTarget.id ? { ...item, modelLinks: links } : item,
      ),
    );
    setDetailTarget((current) =>
      current?.id === linkTarget.id ? { ...current, modelLinks: links } : current,
    );
    setLinkTarget(null);
    message.success("模型挂接关系已保存并立即生效");
  };

  const downloadVersion = (
    drawing: DrawingRecord,
    version: DrawingVersion,
  ) => {
    message.success(`开始下载：${drawing.name}（${version.version}）`);
  };

  const openAddDirectory = () => {
    setDirectoryForm({
      name: "",
      parentId: selectedDirectoryId,
    });
    setDirectoryModalMode("add");
  };

  const openEditDirectory = (directory: MaterialDirectory) => {
    setDirectoryForm({
      name: directory.name,
      parentId: directory.parentId,
    });
    setDirectoryModalMode("edit");
  };

  const saveDirectory = () => {
    const name = directoryForm.name.trim();
    if (!name) {
      message.warning("请输入目录名称");
      return;
    }
    const editingId =
      directoryModalMode === "edit" ? selectedDirectoryId : null;
    if (
      directories.some(
        (item) =>
          item.id !== editingId &&
          item.parentId === directoryForm.parentId &&
          item.name === name,
      )
    ) {
      message.warning("同级目录名称已存在");
      return;
    }

    if (directoryModalMode === "add") {
      const id = Math.max(...directories.map((item) => item.id), 0) + 1;
      setDirectories((items) => [
        ...items,
        { id, name, parentId: directoryForm.parentId },
      ]);
      setSelectedDirectoryId(id);
      message.success("目录新增成功");
    } else if (selectedDirectoryId) {
      setDirectories((items) =>
        items.map((item) =>
          item.id === selectedDirectoryId ? { ...item, name } : item,
        ),
      );
      message.success("目录名称已更新");
    }
    setDirectoryModalMode(null);
  };

  const requestDeleteDirectory = (directory: MaterialDirectory) => {
    if (directories.some((item) => item.parentId === directory.id)) {
      message.warning("该目录存在子目录，请先删除子目录");
      return;
    }
    if (data.some((item) => item.directoryId === directory.id)) {
      message.warning("该目录下存在资料，请先移动资料后再删除");
      return;
    }
    setDeleteDirectoryTarget(directory);
  };

  const confirmDeleteDirectory = () => {
    if (!deleteDirectoryTarget) return;
    setDirectories((items) =>
      items.filter((item) => item.id !== deleteDirectoryTarget.id),
    );
    if (selectedDirectoryId === deleteDirectoryTarget.id) {
      setSelectedDirectoryId(null);
    }
    setDeleteDirectoryTarget(null);
    message.success("目录已删除");
  };

  const actionButton = (
    label: string,
    onClick: () => void,
    color = "text-admin-primary",
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
      render: (record) => (
        <span className="font-mono text-xs">{record.code}</span>
      ),
    },
    {
      key: "name",
      title: "资料名称",
      width: 210,
      render: (record) => <span className="font-medium">{record.name}</span>,
    },
    {
      key: "directory",
      title: "所属目录",
      width: 140,
      render: (record) => (
        <span className="text-xs">
          {getDirectoryPath(record.directoryId, directories)}
        </span>
      ),
    },
    {
      key: "version",
      title: "当前版本",
      width: 84,
      render: (record) => <Tag color="blue">{record.version}</Tag>,
    },
    { key: "major", title: "所属专业", width: 80, render: (record) => record.major },
    {
      key: "category",
      title: "资料分类",
      width: 88,
      render: (record) => record.category,
    },
    {
      key: "file",
      title: "当前文件",
      width: 112,
      render: (record) => (
        <div className="flex items-center gap-1.5">
          <Tag color={fileTypeColorMap[record.fileFormat] || "gray"}>
            {record.fileFormat}
          </Tag>
          <span className="text-[11px] text-admin-muted">{record.fileSize}</span>
        </div>
      ),
    },
    {
      key: "uploadTime",
      title: "更新时间",
      width: 150,
      render: (record) => <span className="text-xs">{record.uploadTime}</span>,
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
      width: 304,
      render: (record) => (
        <div className="flex items-center gap-3">
          {actionButton("查看", () => setDetailTarget(record))}
          {actionButton("下载", () =>
            downloadVersion(record, record.versions[0]),
          )}
          {actionButton("更新", () => openUpdate(record))}
          {actionButton(
            "模型挂接",
            () => openModelLink(record),
            "text-cyan-700",
          )}
          {actionButton(
            "版本记录",
            () => setVersionModalTarget(record),
            "text-purple-600",
          )}
        </div>
      ),
    },
  ];

  const versionColumns: Column<DrawingVersion>[] = [
    {
      key: "version",
      title: "版本号",
      width: 96,
      render: (version, index) => (
        <div className="flex items-center gap-1">
          <Tag color={index === 0 ? "blue" : "gray"}>{version.version}</Tag>
          {index === 0 && (
            <span className="text-[10px] text-admin-primary">当前</span>
          )}
        </div>
      ),
    },
    {
      key: "fileFormat",
      title: "格式",
      width: 72,
      render: (version) => (
        <Tag color={fileTypeColorMap[version.fileFormat || ""] || "gray"}>
          {version.fileFormat || "—"}
        </Tag>
      ),
    },
    {
      key: "fileSize",
      title: "文件大小",
      width: 90,
      render: (version) => version.fileSize,
    },
    {
      key: "uploadUser",
      title: "上传人",
      width: 100,
      render: (version) => version.uploadUser,
    },
    {
      key: "uploadTime",
      title: "上传时间",
      width: 160,
      render: (version) => version.uploadTime,
    },
    {
      key: "remark",
      title: "版本说明",
      width: 210,
      render: (version) => version.remark || "—",
    },
    {
      key: "action",
      title: "操作",
      width: 120,
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
            onClick={() =>
              versionModalTarget &&
              downloadVersion(versionModalTarget, version)
            }
          >
            下载
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title="图纸管理"
        subtitle="资料目录、上传、查看、下载、版本更新及模型挂接统一管理"
      />

      <div className="mt-2 flex min-h-0 flex-1 gap-2">
        <DevNote
          id="drawing-directory"
          title="资料目录（左侧）"
          summary="自定义资料目录分类并快速筛选；支持新增/编辑/删除目录"
          items={[
            { label: "数据来源", value: "directories 本地状态（初始4个一级目录：工程图纸/设备资料/管路资料/其他资料 + 工程图纸下2个子目录）；目录计数 = 该目录及所有子目录下的资料数（getDescendantIds 递归）" },
            { label: "交互逻辑", value: "点击“全部资料”→ 显示全部；点击目录 → 按目录及子目录范围筛选列表；右上角+新增目录（默认上级=当前选中目录）；行内悬停显示编辑/删除；删除前校验：有子目录提示先删子目录，有资料提示先移动资料" },
            { label: "校验规则", value: "新增/编辑时同级目录重名警告“同级目录名称已存在”；名称必填" },
            { label: "权限", value: "管理员/操作人员可新增编辑删除；浏览人员仅可查看筛选" },
            { label: "后续步骤", value: "正式系统：目录结构由资料管理服务持久化" },
          ]}
          wrapClassName="flex flex-shrink-0"
        >
        <aside className="admin-card flex w-[248px] flex-shrink-0 flex-col overflow-hidden">
          <div className="flex flex-shrink-0 items-center justify-between border-b border-admin-border px-3 py-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-admin-text">
                <FolderOpen size={16} className="text-admin-primary" />
                资料目录
              </div>
              <div className="mt-0.5 text-[10px] text-admin-muted">
                自定义分类与快速筛选
              </div>
            </div>
            <button
              className="rounded p-1.5 text-admin-primary hover:bg-blue-50"
              title="新增目录"
              onClick={openAddDirectory}
            >
              <FolderPlus size={16} />
            </button>
          </div>

          <div className="min-h-0 flex-1 scroll-pb-12 overflow-auto p-2 pb-12">
            <button
              className={`mb-1 flex w-full items-center gap-2 rounded px-2.5 py-2 text-left text-xs transition ${
                selectedDirectoryId === null
                  ? "bg-admin-primary text-white"
                  : "text-admin-text hover:bg-blue-50"
              }`}
              onClick={() => setSelectedDirectoryId(null)}
            >
              <FolderOpen size={14} />
              <span className="flex-1">全部资料</span>
              <span
                className={
                  selectedDirectoryId === null
                    ? "text-blue-100"
                    : "text-admin-muted"
                }
              >
                {data.length}
              </span>
            </button>

            {flatDirectories.map((directory) => {
              const selected = selectedDirectoryId === directory.id;
              const hasChildren = directories.some(
                (item) => item.parentId === directory.id,
              );
              return (
                <div
                  key={directory.id}
                  className={`group mb-1 flex items-center rounded transition ${
                    selected
                      ? "bg-admin-primary text-white"
                      : "text-admin-text hover:bg-blue-50"
                  }`}
                  style={{ paddingLeft: `${directory.depth * 14 + 6}px` }}
                >
                  <button
                    className="flex min-w-0 flex-1 items-center gap-1.5 py-2 text-left text-xs"
                    onClick={() => setSelectedDirectoryId(directory.id)}
                  >
                    {directory.depth > 0 && (
                      <ChevronRight
                        size={12}
                        className={selected ? "text-blue-100" : "text-gray-400"}
                      />
                    )}
                    {hasChildren ? (
                      <FolderOpen size={14} className="flex-shrink-0" />
                    ) : (
                      <Folder size={14} className="flex-shrink-0" />
                    )}
                    <span className="truncate">{directory.name}</span>
                    <span
                      className={`ml-auto ${
                        selected ? "text-blue-100" : "text-admin-muted"
                      }`}
                    >
                      {directoryCounts.get(directory.id) || 0}
                    </span>
                  </button>
                  <div
                    className={`mr-1 flex items-center ${
                      selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    <button
                      className={`rounded p-1 ${
                        selected
                          ? "hover:bg-blue-500"
                          : "text-admin-muted hover:text-admin-primary"
                      }`}
                      title="编辑目录"
                      onClick={() => {
                        setSelectedDirectoryId(directory.id);
                        openEditDirectory(directory);
                      }}
                    >
                      <Edit3 size={12} />
                    </button>
                    <button
                      className={`rounded p-1 ${
                        selected
                          ? "hover:bg-red-500"
                          : "text-admin-muted hover:text-admin-danger"
                      }`}
                      title="删除目录"
                      onClick={() => requestDeleteDirectory(directory)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex-shrink-0 border-t border-admin-border bg-slate-50 px-3 py-2 text-[10px] leading-4 text-admin-muted">
            选择父目录后点击右上角新增，可创建下级目录；有子目录或资料的目录不可直接删除。
          </div>
        </aside>
        </DevNote>

        <main className="flex min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
          <DevNote
            id="drawing-search"
            title="查询区与上传入口"
            summary="按编号/名称、专业、分类、挂接状态组合查询；上传资料按钮进入上传弹窗"
            items={[
              { label: "查询条件", value: "资料（编号/名称模糊匹配 code+name）、所属专业（水工/机械/电气/暖通/消防/其他）、资料分类（竣工图/设计图/施工图/变更图/其他）、模型挂接（已挂接=modelLinks长度>0 / 未挂接）" },
              { label: "交互逻辑", value: "条件为即时筛选（filteredData useMemo），点“查询”提示结果条数；点“重置”清空全部条件；上传资料按钮打开 UploadModal（默认目录=当前选中目录）" },
              { label: "权限", value: "上传资料：管理员/操作人员；浏览人员不显示上传入口（原型未区分，正式系统按角色）" },
              { label: "后续步骤", value: "正式系统：查询由资料管理服务分页检索" },
            ]}
            wrapClassName="block flex-shrink-0"
          >
          <SearchForm
            fields={searchFields}
            values={searchValues}
            onChange={(name, value) =>
              setSearchValues((values) => ({ ...values, [name]: value }))
            }
            onSearch={() =>
              message.info(`查询完成，共 ${filteredData.length} 条`)
            }
            onReset={() => {
              setSearchValues({});
              message.info("已重置查询条件");
            }}
            extraButtons={
              <button
                className="btn-success flex items-center gap-1"
                onClick={() => setUploadOpen(true)}
              >
                <Upload size={14} />
                上传资料
              </button>
            }
          />
          </DevNote>

          <DevNote
            id="drawing-table"
            title="资料列表"
            summary="展示筛选结果资料，行内提供查看/下载/更新/模型挂接/版本记录操作"
            items={[
              { label: "列定义", value: "序号/资料编号/资料名称/所属目录（完整路径）/当前版本（Tag）/所属专业/资料分类/当前文件（格式Tag+大小）/更新时间/模型挂接（已挂接N或未挂接）/操作" },
              { label: "行操作", value: "查看→详情弹窗；下载→下载当前版本（原型仅提示）；更新→版本升级弹窗（生成Vx.y+1）；模型挂接→挂接弹窗；版本记录→版本列表弹窗" },
              { label: "数据来源", value: "data 本地初始化：drawings（mock）经 buildVersions 生成版本链（按V主.次递减回溯），模型挂接按 initialModelLinkReferences 关联 modelCandidates" },
              { label: "权限", value: "管理员/操作人员可更新与挂接；浏览人员仅查看/下载" },
              { label: "后续步骤", value: "正式系统：列表由资料服务分页返回，版本/挂接关系由服务端维护" },
            ]}
            wrapClassName="block flex flex-1"
          >
          <section className="admin-card mt-2 flex min-h-[320px] flex-1 flex-col overflow-hidden p-3">
            <div className="mb-3 flex items-center justify-between border-b border-admin-border pb-2">
              <div>
                <div className="text-sm font-medium text-admin-text">
                  {activeDirectory ? activeDirectory.name : "全部资料"}
                </div>
                <div className="mt-0.5 text-[10px] text-admin-muted">
                  {activeDirectory
                    ? getDirectoryPath(activeDirectory.id, directories)
                    : "展示全部目录下的资料"}
                </div>
              </div>
              <span className="text-xs text-admin-muted">
                共 <strong className="font-medium text-admin-text">{filteredData.length}</strong> 项
              </span>
            </div>
            <div className="min-h-0 flex-1">
              <DataTable
                columns={columns}
                data={filteredData}
                pageSize={10}
                emptyText="暂无资料，请上传或调整查询条件"
              />
            </div>
          </section>
          </DevNote>
        </main>
      </div>

      <UploadModal
        open={uploadOpen}
        defaultCode={makeCode(nextRecordId)}
        defaultDirectoryId={selectedDirectoryId || directories[0]?.id || 1}
        directories={flatDirectories.map((directory) => ({
          id: directory.id,
          name: `${"　".repeat(directory.depth)}${directory.name}`,
        }))}
        existingNames={data.map((item) => item.name)}
        modelOptions={modelCandidates}
        onClose={() => setUploadOpen(false)}
        onSubmit={submitUpload}
      />

      <Modal
        open={Boolean(detailTarget)}
        onClose={() => setDetailTarget(null)}
        title="资料详情"
        width={900}
        footer={
          <>
            <button className="btn-default" onClick={() => setDetailTarget(null)}>
              关闭
            </button>
            <button
              className="btn-primary flex items-center gap-1"
              onClick={() =>
                detailTarget &&
                downloadVersion(detailTarget, detailTarget.versions[0])
              }
            >
              <Download size={14} />
              下载当前版本
            </button>
          </>
        }
      >
        {detailTarget && (
          <DevNote
            id="drawing-detail"
            title="资料详情弹窗"
            summary="查看资料基本信息、备注、模型挂接与在线预览"
            items={[
              { label: "数据来源", value: "detailTarget（当前选中资料）：基本信息含所属目录完整路径/专业/分类/位置/大小/上传人/更新时间/版本数量；模型挂接来自 modelLinks" },
              { label: "交互逻辑", value: "左侧头部文件图标+名称+编号+版本Tag；信息表与备注；模型挂接区展示挂接对象（组织节点/设备/管路Tag），“维护挂接”→ 打开挂接弹窗；右侧为PDF/DWG预览占位（DWG提示调用轻量化预览服务），“打开预览”→ 进入查看资料弹窗" },
              { label: "底部操作", value: "下载当前版本（原型提示）；关闭" },
              { label: "后续步骤", value: "正式系统：预览由 PDF 在线预览服务 / DWG 轻量化转换服务渲染" },
              { label: "权限", value: "管理员/操作人员可维护挂接；全部角色可查看" },
            ]}
            wrapClassName="block w-full"
          >
          <div className="grid grid-cols-[1fr_310px] gap-5">
            <div>
              <div className="mb-4 flex items-start gap-3 rounded-lg border border-admin-border bg-slate-50 p-4">
                <div
                  className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg ${
                    detailTarget.fileFormat === "PDF"
                      ? "bg-red-50 text-red-500"
                      : "bg-blue-50 text-blue-500"
                  }`}
                >
                  {detailTarget.fileFormat === "PDF" ? (
                    <FileText size={26} />
                  ) : (
                    <File size={26} />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-base font-medium text-admin-text">
                    {detailTarget.name}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-admin-muted">
                    <span className="font-mono">{detailTarget.code}</span>
                    <Tag color="blue">{detailTarget.version}</Tag>
                    <Tag
                      color={
                        fileTypeColorMap[detailTarget.fileFormat] || "gray"
                      }
                    >
                      {detailTarget.fileFormat}
                    </Tag>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
                {[
                  ["所属目录", getDirectoryPath(detailTarget.directoryId, directories)],
                  ["所属专业", detailTarget.major],
                  ["资料分类", detailTarget.category],
                  ["所属位置", detailTarget.position],
                  ["文件大小", detailTarget.fileSize],
                  ["上传人", detailTarget.uploadUser],
                  ["更新时间", detailTarget.uploadTime],
                  ["版本数量", `${detailTarget.versions.length} 个`],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-start gap-2 border-b border-admin-border pb-2">
                    <span className="w-[68px] flex-shrink-0 text-admin-muted">
                      {label}
                    </span>
                    <span className="min-w-0 flex-1 break-all text-admin-text">
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <div className="mb-2 text-xs font-medium text-admin-text">
                  备注说明
                </div>
                <div className="rounded border border-admin-border bg-gray-50 px-3 py-2 text-xs leading-5 text-admin-muted">
                  {detailTarget.remark || "—"}
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-admin-text">
                    模型挂接
                  </span>
                  <button
                    className="text-xs text-admin-primary hover:underline"
                    onClick={() => {
                      openModelLink(detailTarget);
                      setDetailTarget(null);
                    }}
                  >
                    维护挂接
                  </button>
                </div>
                {detailTarget.modelLinks.length > 0 ? (
                  <div className="space-y-1.5">
                    {detailTarget.modelLinks.map((model) => (
                      <div
                        key={model.key}
                        className="flex items-center gap-2 rounded border border-admin-border px-3 py-2 text-xs"
                      >
                        <Link2 size={13} className="text-cyan-600" />
                        <span className="font-mono text-admin-text">
                          {model.code || `${model.level}组织节点`}
                        </span>
                        <Tag
                          color={
                            model.isGroup
                              ? "purple"
                              : model.type === "equipment"
                                ? "blue"
                                : "cyan"
                          }
                        >
                          {model.isGroup
                            ? "组织节点"
                            : model.type === "equipment"
                              ? "设备"
                              : "管路"}
                        </Tag>
                        <span className="truncate text-admin-muted">
                          {model.name}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded border border-dashed border-admin-border px-3 py-5 text-center text-xs text-admin-muted">
                    当前资料未挂接模型
                  </div>
                )}
              </div>
            </div>

            <div className="flex min-h-[430px] flex-col items-center justify-center rounded-lg border border-admin-border bg-gray-50">
              {detailTarget.fileFormat === "PDF" ? (
                <FileText size={70} className="mb-3 text-red-300" />
              ) : (
                <File size={70} className="mb-3 text-blue-300" />
              )}
              <div className="text-sm font-medium text-admin-text">
                {detailTarget.fileFormat === "DWG"
                  ? "DWG文件预览"
                  : "PDF在线预览"}
              </div>
              <div className="mt-1 px-6 text-center text-xs leading-5 text-admin-muted">
                {detailTarget.fileFormat === "DWG"
                  ? "实际项目中调用DWG轻量化预览服务，原型仅展示文件信息。"
                  : "实际项目中在此加载PDF文件内容，支持翻页和缩放。"}
              </div>
              <button
                className="btn-default mt-4 flex items-center gap-1"
                onClick={() =>
                  setPreviewTarget({
                    drawing: detailTarget,
                    version: detailTarget.versions[0],
                  })
                }
              >
                <Eye size={14} />
                打开预览
              </button>
            </div>
          </div>
          </DevNote>
        )}
      </Modal>

      <Modal
        open={Boolean(versionModalTarget)}
        onClose={() => setVersionModalTarget(null)}
        title="版本记录"
        width={980}
        footer={
          <button
            className="btn-default"
            onClick={() => setVersionModalTarget(null)}
          >
            关闭
          </button>
        }
      >
        {versionModalTarget && (
          <DevNote
            id="drawing-version"
            title="版本记录弹窗"
            summary="查看资料全部历史版本，支持查看/下载指定版本"
            items={[
              { label: "数据来源", value: "versions 数组（buildVersions 由当前版本按 V主.次 递减回溯生成，含初始版本）；头部显示当前版本与版本总数" },
              { label: "交互逻辑", value: "版本列表：版本号（当前版本蓝色Tag）/格式/大小/上传人/上传时间/版本说明；行操作查看（打开预览弹窗指定版本）、下载（原型提示）" },
              { label: "后续步骤", value: "正式系统：版本链由文件版本服务维护，支持回滚与差异对比" },
              { label: "权限", value: "全部角色可查看；下载权限按角色控制" },
            ]}
            wrapClassName="block w-full"
          >
          <div>
            <div className="mb-3 flex items-center gap-3 rounded bg-admin-bg px-3 py-2.5">
              <History size={16} className="text-purple-600" />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-admin-text">
                  {versionModalTarget.name}
                </div>
                <div className="mt-0.5 text-xs text-admin-muted">
                  {versionModalTarget.code} · 当前版本{" "}
                  {versionModalTarget.version} · 共{" "}
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
          </DevNote>
        )}
      </Modal>

      <Modal
        open={Boolean(updateTarget)}
        onClose={() => setUpdateTarget(null)}
        title="更新资料"
        width={580}
        footer={
          <>
            <button className="btn-default" onClick={() => setUpdateTarget(null)}>
              取消
            </button>
            <button
              className="btn-primary flex items-center gap-1"
              onClick={submitUpdate}
            >
              <RefreshCw size={14} />
              确认更新
            </button>
          </>
        }
      >
        {updateTarget && (
          <DevNote
            id="drawing-update"
            title="更新资料弹窗"
            summary="上传新文件生成下一版本，版本号自动递增"
            items={[
              { label: "数据来源", value: "updateTarget（当前资料）；更新版本 = nextVersion（如 V1.0→V1.1、V1.9→V2.0）" },
              { label: "校验规则", value: "文件仅支持PDF/DWG（selectUpdateFile 校验），≤50MB；未选文件提示“请选择更新文件”；版本说明必填“请输入版本说明”" },
              { label: "交互逻辑", value: "确认更新 → 生成新版本并插入版本列表头部、资料当前版本同步更新、上传人=系统管理员；模型挂接自动继承当前 N 项关系（提示“已更新为Vx.y，并继承N项模型挂接关系”）" },
              { label: "权限", value: "管理员/操作人员" },
              { label: "后续步骤", value: "正式系统：文件上传到对象存储并登记新版本记录" },
            ]}
            wrapClassName="block w-full"
          >
          <div className="space-y-4">
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
                <span className="font-medium text-admin-primary">
                  {nextVersion(updateTarget.version)}
                </span>
              </div>
              <div>
                <span className="text-admin-muted">更新规则：</span>
                <span className="text-green-600">保存后直接生效</span>
              </div>
              <div className="col-span-2 flex items-center gap-1.5 border-t border-admin-border pt-2">
                <Link2 size={13} className="text-cyan-600" />
                <span className="text-admin-muted">模型挂接：</span>
                <span className="text-cyan-700">
                  自动继承当前 {updateTarget.modelLinks.length} 项挂接关系
                </span>
              </div>
            </div>
            <FormField label="更新文件" required>
              <input
                type="file"
                className="input-base w-full py-1.5"
                accept=".pdf,.dwg"
                onChange={(event) =>
                  selectUpdateFile(event.target.files?.[0])
                }
              />
              <p className="mt-1 text-[10px] text-admin-muted">
                仅支持PDF、DWG，单文件最大50MB
              </p>
            </FormField>
            <FormField label="版本说明" required>
              <textarea
                className="input-base w-full"
                rows={3}
                placeholder="说明本次更新内容"
                value={updateForm.remark}
                onChange={(event) =>
                  setUpdateForm((current) => ({
                    ...current,
                    remark: event.target.value,
                  }))
                }
              />
            </FormField>
          </div>
          </DevNote>
        )}
      </Modal>

      <Modal
        open={Boolean(linkTarget)}
        onClose={() => setLinkTarget(null)}
        title="模型挂接"
        width={980}
        footer={
          <>
            <button className="btn-default" onClick={() => setLinkTarget(null)}>
              取消
            </button>
            <button
              className="btn-primary flex items-center gap-1"
              onClick={saveModelLinks}
            >
              <Link2 size={14} />
              保存挂接
            </button>
          </>
        }
      >
        {linkTarget && (
          <DevNote
            id="drawing-link-modal"
            title="模型挂接弹窗"
            summary="为资料选择设备/管路结构树中的组织节点或模型作为挂接对象"
            items={[
              { label: "数据来源", value: "modelCandidates：由设备/管路结构树全部节点生成（key=type-nodeId，含code/name/system/level/isGroup）；打开时以当前资料 modelLinks 回填已选" },
              { label: "交互逻辑", value: "顶部显示当前资料与已选数量；内部 ModelLinkSelector（KKS自动匹配+设备/管路树多选）；保存挂接 → 按 pendingLinkKeys 重新生成 modelLinks 并同步到详情弹窗，提示“模型挂接关系已保存并立即生效”" },
              { label: "挂接能力", value: "支持非末级组织节点（如地下厂房）与末级设备/管路，一份资料可挂接多个对象（满足图纸管理需求）" },
              { label: "权限", value: "管理员/操作人员可修改挂接" },
            ]}
            wrapClassName="block w-full"
          >
          <div>
            <div className="mb-3 flex items-center justify-between rounded bg-admin-bg px-3 py-2.5 text-xs">
              <div className="min-w-0">
                <span className="text-admin-muted">当前资料：</span>
                <span className="font-medium text-admin-text">
                  {linkTarget.name}
                </span>
                <span className="ml-2 font-mono text-admin-muted">
                  {linkTarget.code}
                </span>
              </div>
              <span className="flex-shrink-0 text-admin-muted">
                已选择{" "}
                <strong className="font-medium text-admin-primary">
                  {pendingLinkKeys.length}
                </strong>{" "}
                个挂接对象
              </span>
            </div>
            <ModelLinkSelector
              options={modelCandidates}
              selectedKeys={pendingLinkKeys}
              onChange={setPendingLinkKeys}
              sourceText={`${linkTarget.code} ${linkTarget.name}`}
            />
          </div>
          </DevNote>
        )}
      </Modal>

      <Modal
        open={Boolean(previewTarget)}
        onClose={() => setPreviewTarget(null)}
        title="查看资料"
        width={760}
        footer={
          <>
            <button
              className="btn-default"
              onClick={() => setPreviewTarget(null)}
            >
              关闭
            </button>
            <button
              className="btn-primary flex items-center gap-1"
              onClick={() =>
                previewTarget &&
                downloadVersion(previewTarget.drawing, previewTarget.version)
              }
            >
              <Download size={14} />
              下载
            </button>
          </>
        }
      >
        {previewTarget && (
          <DevNote
            id="drawing-preview"
            title="查看资料弹窗（预览）"
            summary="预览指定版本的资料文件，支持下载当前版本"
            items={[
              { label: "数据来源", value: "previewTarget（资料+指定版本，来源：详情弹窗“打开预览”或版本记录“查看”）" },
              { label: "交互逻辑", value: "头部显示资料名/编号/版本/格式；中间为PDF/DWG预览占位（PDF=在线预览，DWG=提示下载后使用专业工具）；底部下载当前版本（原型提示）" },
              { label: "后续步骤", value: "正式系统：PDF在线渲染、DWG轻量化预览，按版本返回文件流" },
              { label: "权限", value: "全部角色可查看" },
            ]}
            wrapClassName="block w-full"
          >
          <div>
            <div className="mb-3 border-b border-admin-border pb-3">
              <div className="text-base font-medium text-admin-text">
                {previewTarget.drawing.name}
              </div>
              <div className="mt-1 text-xs text-admin-muted">
                {previewTarget.drawing.code} · {previewTarget.version.version} ·{" "}
                {previewTarget.version.fileFormat ||
                  previewTarget.drawing.fileFormat}
              </div>
            </div>
            <div className="flex h-[380px] flex-col items-center justify-center rounded border border-admin-border bg-gray-50">
              {(previewTarget.version.fileFormat ||
                previewTarget.drawing.fileFormat) === "PDF" ? (
                <FileText size={64} className="mb-3 text-red-400" />
              ) : (
                <File size={64} className="mb-3 text-blue-400" />
              )}
              <div className="text-sm text-admin-text">
                {(previewTarget.version.fileFormat ||
                  previewTarget.drawing.fileFormat) === "DWG"
                  ? "DWG文件请下载后使用专业工具查看"
                  : "资料在线预览"}
              </div>
              <div className="mt-1 text-xs text-admin-muted">
                {previewTarget.version.version} · {previewTarget.version.fileSize}
              </div>
            </div>
          </div>
          </DevNote>
        )}
      </Modal>

      <Modal
        open={Boolean(directoryModalMode)}
        onClose={() => setDirectoryModalMode(null)}
        title={directoryModalMode === "add" ? "新增资料目录" : "编辑资料目录"}
        width={480}
        footer={
          <>
            <button
              className="btn-default"
              onClick={() => setDirectoryModalMode(null)}
            >
              取消
            </button>
            <button className="btn-primary" onClick={saveDirectory}>
              保存
            </button>
          </>
        }
      >
        <DevNote
          id="drawing-directory-modal"
          title="新增/编辑目录弹窗"
          summary="创建或重命名资料目录，可指定上级目录"
          items={[
            { label: "交互逻辑", value: "新增：上级目录默认=当前选中目录（可改，空=一级目录）；编辑：上级目录锁定，仅可改名称；保存后新增目录自动选中并定位" },
            { label: "校验规则", value: "名称必填“请输入目录名称”；同级重名警告“同级目录名称已存在”" },
            { label: "权限", value: "管理员/操作人员" },
          ]}
          wrapClassName="block w-full"
        >
        <div className="space-y-4">
          <FormField label="上级目录">
            <select
              className="input-base w-full"
              value={directoryForm.parentId || ""}
              disabled={directoryModalMode === "edit"}
              onChange={(event) =>
                setDirectoryForm((current) => ({
                  ...current,
                  parentId: event.target.value
                    ? Number(event.target.value)
                    : null,
                }))
              }
            >
              <option value="">无（一级目录）</option>
              {flatDirectories.map((directory) => (
                <option key={directory.id} value={directory.id}>
                  {"　".repeat(directory.depth)}
                  {directory.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="目录名称" required>
            <input
              className="input-base w-full"
              value={directoryForm.name}
              placeholder="请输入目录名称"
              onChange={(event) =>
                setDirectoryForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
          </FormField>
        </div>
        </DevNote>
      </Modal>

      <ConfirmModal
        open={Boolean(deleteDirectoryTarget)}
        title="删除资料目录"
        content={
          <>
            确认删除目录
            <strong className="mx-1 text-admin-text">
              {deleteDirectoryTarget?.name}
            </strong>
            吗？删除后无法恢复。
          </>
        }
        danger
        okText="删除"
        onConfirm={confirmDeleteDirectory}
        onCancel={() => setDeleteDirectoryTarget(null)}
      />
    </div>
  );
}
