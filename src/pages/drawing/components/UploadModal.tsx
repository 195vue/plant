import { useEffect, useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import {
  AlertCircle,
  Archive,
  CheckCircle2,
  FileArchive,
  FileText,
  Files,
  Link2,
  Pencil,
  SkipForward,
  X,
} from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { UploadBox, FormItem } from "@/components/common/UploadBox";
import { message } from "@/components/common/Message";
import { Tag } from "@/components/common/Tag";
import ModelLinkSelector, {
  getRecommendedModelOptions,
  type ModelLinkOption,
} from "@/pages/drawing/components/ModelLinkSelector";
import { DevNote } from "@/components/devNotes/DevNote";

const majorOptions = [
  { label: "水工", value: "水工" },
  { label: "机械", value: "机械" },
  { label: "电气", value: "电气" },
  { label: "暖通", value: "暖通" },
  { label: "消防", value: "消防" },
  { label: "其他", value: "其他" },
];
const positionOptions = [
  { label: "坝后厂房", value: "坝后厂房" },
  { label: "大坝", value: "大坝" },
  { label: "厂区", value: "厂区" },
];
const categoryOptions = [
  { label: "竣工图", value: "竣工图" },
  { label: "设计图", value: "设计图" },
  { label: "施工图", value: "施工图" },
  { label: "变更图", value: "变更图" },
  { label: "其他", value: "其他" },
];

export interface UploadDirectoryOption {
  id: number;
  name: string;
}

interface UploadModalProps {
  open: boolean;
  defaultCode: string;
  defaultDirectoryId: number;
  directories: readonly UploadDirectoryOption[];
  existingNames: readonly string[];
  existingCodes: readonly string[];
  modelOptions: readonly ModelLinkOption[];
  onClose: () => void;
  onSubmit: (form: UploadFormValues) => void;
}

export interface SingleUploadFormValues {
  mode: "single";
  code: string;
  name: string;
  major: string;
  category: string;
  position: string;
  directoryId: number;
  linkedModelKeys: string[];
  file: File;
  remark: string;
}

export type BatchUploadStatus =
  | "ready"
  | "skipped"
  | "failed"
  | "success";

export interface BatchUploadItem {
  id: string;
  path: string;
  originalName: string;
  name: string;
  extension: "PDF" | "DWG" | string;
  size: number;
  sizeText: string;
  status: BatchUploadStatus;
  reason?: string;
  validationError?: string;
}

export interface BatchUploadFormValues {
  mode: "batch";
  major: string;
  category: string;
  position: string;
  directoryId: number;
  zipFile: File;
  items: BatchUploadItem[];
  remark: string;
}

export interface MultiUploadItem {
  id: string;
  file: File;
  name: string;
  code: string;
  extension: string;
  sizeText: string;
  linkedModelKeys: string[];
  status: "ready" | "failed";
  reason?: string;
  validationError?: string;
}

export interface MultiUploadFormValues {
  mode: "multi";
  major: string;
  category: string;
  position: string;
  directoryId: number;
  items: MultiUploadItem[];
  remark: string;
}

export type UploadFormValues =
  | SingleUploadFormValues
  | MultiUploadFormValues
  | BatchUploadFormValues;

interface CommonFormState {
  major: string;
  category: string;
  position: string;
  directoryId?: number;
  remark: string;
}

interface SingleFormState {
  code: string;
  name: string;
  linkedModelKeys: string[];
  file?: File;
}

const VALID_BATCH_EXTENSIONS = new Set(["PDF", "DWG"]);
const MAX_BATCH_FILE_SIZE = 50 * 1024 * 1024;
const MAX_BATCH_VALID_COUNT = 100;
const MAX_MULTI_COUNT = 50;

function getFileExtension(fileName: string) {
  return fileName.split(".").pop()?.toUpperCase() || "";
}

function removeExtension(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "");
}

function formatSize(bytes: number) {
  if (!bytes) return "—";
  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))}KB`;
}

function normalizeName(value: string) {
  return value.trim().toLocaleLowerCase("zh-CN");
}

function validateBatchItem(
  item: BatchUploadItem,
  name: string,
  existingNames: readonly string[],
): Pick<BatchUploadItem, "name" | "status" | "reason"> {
  const normalizedName = normalizeName(name);
  if (!normalizedName) {
    return { name, status: "failed", reason: "资料名称不能为空" };
  }
  if (item.validationError) {
    return {
      name,
      status: "failed",
      reason: item.validationError,
    };
  }
  if (existingNames.some((existing) => normalizeName(existing) === normalizedName)) {
    return {
      name,
      status: "skipped",
      reason: "存在同名资料，修改名称后可重新导入",
    };
  }
  return { name, status: "ready", reason: undefined };
}

/** 按默认编号递增，跳过已被占用的编号 */
function nextAvailableCode(baseCode: string, usedCodes: readonly string[]) {
  const match = baseCode.match(/^(.*?)(\d+)$/);
  if (!match) return baseCode;
  const prefix = match[1];
  const width = match[2].length;
  const used = new Set(usedCodes);
  let value = Number(match[2]);
  while (used.has(`${prefix}${String(value).padStart(width, "0")}`)) {
    value += 1;
  }
  return `${prefix}${String(value).padStart(width, "0")}`;
}

/** 多文件逐行校验：名称/编号需在资料库与本次批次内唯一 */
function validateMultiItem(
  item: MultiUploadItem,
  items: readonly MultiUploadItem[],
  existingNames: readonly string[],
  existingCodes: readonly string[],
): Pick<MultiUploadItem, "status" | "reason"> {
  if (item.validationError) {
    return { status: "failed", reason: item.validationError };
  }
  const name = normalizeName(item.name);
  const code = item.code.trim();
  if (!name) return { status: "failed", reason: "资料名称不能为空" };
  if (!code) return { status: "failed", reason: "资料编号不能为空" };
  if (
    existingNames.some((existing) => normalizeName(existing) === name) ||
    items.some(
      (other) => other.id !== item.id && normalizeName(other.name) === name,
    )
  ) {
    return { status: "failed", reason: "存在同名资料，请修改名称" };
  }
  if (
    existingCodes.includes(code) ||
    items.some((other) => other.id !== item.id && other.code.trim() === code)
  ) {
    return { status: "failed", reason: "资料编号重复，请修改编号" };
  }
  return { status: "ready", reason: undefined };
}

export default function UploadModal({
  open,
  defaultCode,
  defaultDirectoryId,
  directories,
  existingNames,
  existingCodes,
  modelOptions,
  onClose,
  onSubmit,
}: UploadModalProps) {
  const [mode, setMode] = useState<UploadFormValues["mode"]>("single");
  const [common, setCommon] = useState<CommonFormState>({
    major: "",
    category: "",
    position: "",
    remark: "",
  });
  const [single, setSingle] = useState<SingleFormState>({
    code: "",
    name: "",
    linkedModelKeys: [],
  });
  const [zipFile, setZipFile] = useState<File>();
  const [batchItems, setBatchItems] = useState<BatchUploadItem[]>([]);
  const [parsingZip, setParsingZip] = useState(false);
  const [batchSubmitted, setBatchSubmitted] = useState(false);
  const [multiItems, setMultiItems] = useState<MultiUploadItem[]>([]);
  const [selectedMultiIds, setSelectedMultiIds] = useState<string[]>([]);
  const [batchLinkOpen, setBatchLinkOpen] = useState(false);
  const [batchLinkKeys, setBatchLinkKeys] = useState<string[]>([]);
  const [batchApplyMode, setBatchApplyMode] = useState<"merge" | "override">(
    "merge",
  );
  const [onlyUnlinked, setOnlyUnlinked] = useState(false);
  const [linkIndex, setLinkIndex] = useState<number | null>(null);
  const [linkDraftKeys, setLinkDraftKeys] = useState<string[]>([]);
  const [draggingMulti, setDraggingMulti] = useState(false);
  const multiInputRef = useRef<HTMLInputElement>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setMode("single");
      setCommon({
        major: "",
        category: "",
        position: "",
        directoryId: defaultDirectoryId,
        remark: "",
      });
      setSingle({
        code: defaultCode,
        name: "",
        linkedModelKeys: [],
      });
      setZipFile(undefined);
      setBatchItems([]);
      setParsingZip(false);
      setBatchSubmitted(false);
      setMultiItems([]);
      setSelectedMultiIds([]);
      setBatchLinkOpen(false);
      setBatchLinkKeys([]);
      setBatchApplyMode("merge");
      setOnlyUnlinked(false);
      setLinkIndex(null);
      setLinkDraftKeys([]);
    }
    wasOpenRef.current = open;
  }, [defaultCode, defaultDirectoryId, open]);

  const batchStatistics = useMemo(
    () =>
      batchItems.reduce(
        (result, item) => {
          result[item.status] += 1;
          return result;
        },
        { ready: 0, skipped: 0, failed: 0, success: 0 },
      ),
    [batchItems],
  );

  const setCommonValue = <K extends keyof CommonFormState>(
    name: K,
    value: CommonFormState[K],
  ) => setCommon((current) => ({ ...current, [name]: value }));

  const parseZip = async (file: File | null) => {
    if (!file) {
      setZipFile(undefined);
      setBatchItems([]);
      return;
    }
    if (getFileExtension(file.name) !== "ZIP") {
      message.warning("压缩包批量上传只支持ZIP格式");
      setZipFile(undefined);
      setBatchItems([]);
      return;
    }
    if (file.size > 200 * 1024 * 1024) {
      message.warning("ZIP压缩包大小不能超过200MB");
      setZipFile(undefined);
      setBatchItems([]);
      return;
    }

    setZipFile(file);
    setParsingZip(true);
    setBatchSubmitted(false);
    try {
      const zip = await JSZip.loadAsync(file);
      let validSequence = 0;
      const rows = Object.values(zip.files)
        .filter(
          (entry) =>
            !entry.dir &&
            !entry.name.startsWith("__MACOSX/") &&
            !entry.name.split("/").pop()?.startsWith("."),
        )
        .map((entry, index) => {
          const originalName = entry.name.split("/").pop() || entry.name;
          const extension = getFileExtension(originalName);
          const internalEntry = entry as typeof entry & {
            _data?: { uncompressedSize?: number };
          };
          const size = internalEntry._data?.uncompressedSize || 0;
          let validationError: string | undefined;

          if (!VALID_BATCH_EXTENSIONS.has(extension)) {
            validationError = "仅导入PDF、DWG文件";
          } else if (size > MAX_BATCH_FILE_SIZE) {
            validationError = "ZIP内单个文件不能超过50MB";
          } else {
            validSequence += 1;
            if (validSequence > MAX_BATCH_VALID_COUNT) {
              validationError = "有效文件数量超过100个";
            }
          }

          const row: BatchUploadItem = {
            id: `${index}-${entry.name}`,
            path: entry.name,
            originalName,
            name: removeExtension(originalName),
            extension,
            size,
            sizeText: formatSize(size),
            status: "ready",
            validationError,
          };
          return {
            ...row,
            ...validateBatchItem(row, row.name, existingNames),
          };
        });

      setBatchItems(rows);
      if (rows.length === 0) {
        message.warning("ZIP压缩包中未发现可处理的文件");
      } else {
        message.info(`解析完成，共识别 ${rows.length} 个文件`);
      }
    } catch {
      setBatchItems([]);
      message.error("ZIP压缩包解析失败，请检查文件是否完整");
    } finally {
      setParsingZip(false);
    }
  };

  const updateBatchName = (id: string, name: string) => {
    setBatchItems((items) =>
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              ...validateBatchItem(item, name, existingNames),
            }
          : item,
      ),
    );
  };

  const revalidateMultiItems = (next: MultiUploadItem[]) =>
    next.map((item) => ({
      ...item,
      ...validateMultiItem(item, next, existingNames, existingCodes),
    }));

  const appendMultiFiles = (files: File[]) => {
    if (files.length === 0) return;
    const usedCodes = [...existingCodes, ...multiItems.map((item) => item.code)];
    const accepted: MultiUploadItem[] = [];
    let duplicated = 0;
    let overflow = false;

    files.forEach((file) => {
      if (multiItems.length + accepted.length >= MAX_MULTI_COUNT) {
        overflow = true;
        return;
      }
      if (
        [...multiItems, ...accepted].some(
          (item) =>
            item.file.name === file.name && item.file.size === file.size,
        )
      ) {
        duplicated += 1;
        return;
      }

      const extension = getFileExtension(file.name);
      const code = nextAvailableCode(defaultCode, usedCodes);
      usedCodes.push(code);

      let validationError: string | undefined;
      if (!VALID_BATCH_EXTENSIONS.has(extension)) {
        validationError = "仅支持PDF、DWG格式";
      } else if (file.size > MAX_BATCH_FILE_SIZE) {
        validationError = "单个文件不能超过50MB";
      }

      accepted.push({
        id: `${Date.now()}-${accepted.length}-${file.name}`,
        file,
        name: removeExtension(file.name),
        code,
        extension,
        sizeText: formatSize(file.size),
        linkedModelKeys: [],
        status: "ready",
        validationError,
      });
    });

    if (accepted.length > 0) {
      setMultiItems((items) => revalidateMultiItems([...items, ...accepted]));
      message.info(`已添加 ${accepted.length} 个文件，可逐份挂接模型`);
    }
    if (duplicated > 0) message.warning(`已跳过 ${duplicated} 个重复文件`);
    if (overflow) {
      message.warning(`单次最多上传 ${MAX_MULTI_COUNT} 个文件`);
    }
  };

  const updateMultiItem = (
    id: string,
    patch: Partial<Pick<MultiUploadItem, "name" | "code">>,
  ) => {
    setMultiItems((items) =>
      revalidateMultiItems(
        items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      ),
    );
  };

  const removeMultiItem = (id: string) => {
    setMultiItems((items) => {
      const next = items.filter((item) => item.id !== id);
      return revalidateMultiItems(next);
    });
    setSelectedMultiIds((ids) => ids.filter((item) => item !== id));
  };

  const recommendKeysFor = (item: MultiUploadItem) =>
    getRecommendedModelOptions(
      modelOptions,
      `${item.code} ${item.name} ${item.file.name}`,
    ).map((option) => option.key);

  const openLinkEditor = (index: number) => {
    const item = multiItems[index];
    if (!item) return;
    setLinkIndex(index);
    setLinkDraftKeys(
      item.linkedModelKeys.length > 0
        ? item.linkedModelKeys
        : recommendKeysFor(item),
    );
  };

  const saveLink = (goNext: boolean) => {
    if (linkIndex === null) return;
    const currentIndex = linkIndex;
    const currentKeys = [...linkDraftKeys];
    setMultiItems((items) =>
      items.map((item, index) =>
        index === currentIndex
          ? { ...item, linkedModelKeys: currentKeys }
          : item,
      ),
    );

    const nextItem = multiItems[currentIndex + 1];
    if (goNext && nextItem) {
      setLinkIndex(currentIndex + 1);
      setLinkDraftKeys(
        nextItem.linkedModelKeys.length > 0
          ? nextItem.linkedModelKeys
          : recommendKeysFor(nextItem),
      );
      return;
    }

    setLinkIndex(null);
    message.success(`第 ${currentIndex + 1} 份资料的挂接关系已保存`);
  };

  const copyPreviousLink = () => {
    if (linkIndex === null || linkIndex === 0) return;
    setLinkDraftKeys([...multiItems[linkIndex - 1].linkedModelKeys]);
    message.info("已复制上一份资料的挂接模型，可继续调整");
  };

  const toggleMultiSelect = (id: string) =>
    setSelectedMultiIds((ids) =>
      ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id],
    );

  const toggleSelectAll = () => {
    const selectable = multiItems.filter((item) => item.status === "ready");
    const allSelected =
      selectable.length > 0 &&
      selectable.every((item) => selectedMultiIds.includes(item.id));
    setSelectedMultiIds(allSelected ? [] : selectable.map((item) => item.id));
  };

  const openBatchLink = () => {
    const targets = multiItems.filter(
      (item) => selectedMultiIds.includes(item.id) && item.status === "ready",
    );
    if (targets.length === 0) {
      message.warning("请先勾选要挂接的资料");
      return;
    }
    const firstKeys = [...targets[0].linkedModelKeys].sort().join("|");
    const allSame = targets.every(
      (item) => [...item.linkedModelKeys].sort().join("|") === firstKeys,
    );
    setBatchLinkKeys(
      allSame && targets[0].linkedModelKeys.length > 0
        ? [...targets[0].linkedModelKeys]
        : recommendKeysFor(targets[0]),
    );
    setBatchApplyMode("merge");
    setBatchLinkOpen(true);
  };

  const saveBatchLink = () => {
    const ids = selectedMultiItems
      .filter((item) => item.status === "ready")
      .map((item) => item.id);
    if (ids.length === 0) return;
    if (batchLinkKeys.length === 0) {
      message.warning("请选择要挂接的模型");
      return;
    }
    setMultiItems((items) =>
      items.map((item) => {
        if (!ids.includes(item.id)) return item;
        const linkedModelKeys =
          batchApplyMode === "merge"
            ? Array.from(new Set([...item.linkedModelKeys, ...batchLinkKeys]))
            : [...batchLinkKeys];
        return { ...item, linkedModelKeys };
      }),
    );
    setBatchLinkOpen(false);
    message.success(`已为 ${ids.length} 份资料保存挂接关系`);
  };

  const clearSelectedLinks = () => {
    if (selectedMultiItems.length === 0) {
      message.warning("请先勾选要清除挂接的资料");
      return;
    }
    const ids = selectedMultiItems.map((item) => item.id);
    setMultiItems((items) =>
      items.map((item) =>
        ids.includes(item.id) ? { ...item, linkedModelKeys: [] } : item,
      ),
    );
    message.success(`已清除 ${ids.length} 份资料的挂接关系`);
  };

  const multiLinkedCount = multiItems.filter(
    (item) => item.linkedModelKeys.length > 0,
  ).length;
  const visibleMultiItems = onlyUnlinked
    ? multiItems.filter((item) => item.linkedModelKeys.length === 0)
    : multiItems;
  const linkItem = linkIndex !== null ? multiItems[linkIndex] : undefined;
  const selectableMultiItems = multiItems.filter(
    (item) => item.status === "ready",
  );
  const selectedMultiItems = multiItems.filter((item) =>
    selectedMultiIds.includes(item.id),
  );
  const allSelectableSelected =
    selectableMultiItems.length > 0 &&
    selectableMultiItems.every((item) => selectedMultiIds.includes(item.id));
  const linkGroupCounts = useMemo(() => {
    const counts = new Map<string, number>();
    multiItems.forEach((item) => {
      if (item.linkedModelKeys.length === 0) return;
      const key = [...item.linkedModelKeys].sort().join("|");
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  }, [multiItems]);

  const validateCommon = () => {
    if (!common.directoryId) {
      message.warning("请选择所属目录");
      return false;
    }
    if (!common.major || !common.category || !common.position) {
      message.warning("请完善所属专业、资料分类和所属位置");
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (batchSubmitted) {
      onClose();
      return;
    }
    if (!validateCommon()) return;

    if (mode === "batch") {
      if (!zipFile) {
        message.warning("请选择ZIP压缩包");
        return;
      }
      if (parsingZip) {
        message.warning("正在解析ZIP压缩包，请稍候");
        return;
      }
      const readyItems = batchItems.filter((item) => item.status === "ready");
      if (readyItems.length === 0) {
        message.warning("当前没有可导入的资料，请先处理跳过或失败项");
        return;
      }
      onSubmit({
        mode: "batch",
        major: common.major,
        category: common.category,
        position: common.position,
        directoryId: common.directoryId!,
        zipFile,
        items: batchItems,
        remark: common.remark,
      });
      setBatchItems((items) =>
        items.map((item) =>
          item.status === "ready"
            ? { ...item, status: "success", reason: "已生成独立资料记录" }
            : item,
        ),
      );
      setBatchSubmitted(true);
      return;
    }

    if (mode === "multi") {
      if (multiItems.length === 0) {
        message.warning("请选择要上传的资料文件");
        return;
      }
      const failedCount = multiItems.filter(
        (item) => item.status === "failed",
      ).length;
      if (failedCount > 0) {
        message.warning(
          `有 ${failedCount} 个文件校验未通过，请修改名称/编号或移除后再上传`,
        );
        return;
      }
      onSubmit({
        mode: "multi",
        major: common.major,
        category: common.category,
        position: common.position,
        directoryId: common.directoryId!,
        items: multiItems,
        remark: common.remark,
      });
      return;
    }

    if (!single.code.trim()) {
      message.warning("请填写资料编号");
      return;
    }
    if (!single.name.trim()) {
      message.warning("请填写资料名称");
      return;
    }
    if (!single.file) {
      message.warning("请选择资料文件");
      return;
    }
    if (!VALID_BATCH_EXTENSIONS.has(getFileExtension(single.file.name))) {
      message.warning("单个资料只支持PDF或DWG格式");
      return;
    }
    onSubmit({
      mode: "single",
      code: single.code,
      name: single.name,
      major: common.major,
      category: common.category,
      position: common.position,
      directoryId: common.directoryId!,
      linkedModelKeys: single.linkedModelKeys,
      file: single.file,
      remark: common.remark,
    });
  };

  const commonFields = (
    <>
      <FormItem label="所属目录" required>
        <select
          className="input-base"
          value={common.directoryId || ""}
          disabled={batchSubmitted}
          onChange={(event) =>
            setCommonValue("directoryId", Number(event.target.value))
          }
        >
          <option value="">请选择</option>
          {directories.map((directory) => (
            <option key={directory.id} value={directory.id}>
              {directory.name}
            </option>
          ))}
        </select>
      </FormItem>
      <div className="grid grid-cols-3 gap-x-3">
        <FormItem label="所属专业" required>
          <select
            className="input-base"
            value={common.major}
            disabled={batchSubmitted}
            onChange={(event) => setCommonValue("major", event.target.value)}
          >
            <option value="">请选择</option>
            {majorOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormItem>
        <FormItem label="资料分类" required>
          <select
            className="input-base"
            value={common.category}
            disabled={batchSubmitted}
            onChange={(event) => setCommonValue("category", event.target.value)}
          >
            <option value="">请选择</option>
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormItem>
        <FormItem label="所属位置" required>
          <select
            className="input-base"
            value={common.position}
            disabled={batchSubmitted}
            onChange={(event) => setCommonValue("position", event.target.value)}
          >
            <option value="">请选择</option>
            {positionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormItem>
      </div>
    </>
  );

  const submitLabel = batchSubmitted
    ? "完成"
    : mode === "single"
      ? "确认上传"
      : mode === "multi"
        ? `确认上传（${multiItems.length}份）`
        : `确认导入${batchStatistics.ready ? `（${batchStatistics.ready}项）` : ""}`;

  return (
    <>
    <Modal
      open={open}
      onClose={onClose}
      title="上传资料"
      width={1080}
      footer={
        <>
          <button className="btn-default" onClick={onClose}>
            {batchSubmitted ? "关闭" : "取消"}
          </button>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={parsingZip}
          >
            {submitLabel}
          </button>
        </>
      }
    >
      <DevNote
        id="drawing-upload-mode"
        title="上传模式切换（单个/多文件/压缩包）"
        summary="支持单个资料上传、多文件逐份挂接模型上传，以及ZIP压缩包批量上传"
        items={[
          { label: "交互逻辑", value: "三个Tab切换 mode（single/multi/batch）；多文件模式逐行编辑名称与编号，并逐份挂接模型；压缩包导入提交后锁定，按钮文案变为“确认导入（N项）/完成/关闭”" },
          { label: "校验规则", value: "提交时逐项校验：所属目录/专业/分类/位置必填；单文件模式校验编号、名称、文件；多文件模式每份资料名称/编号在资料库与本次批次内唯一且必须挂接模型；压缩包模式校验ZIP文件与可导入项" },
          { label: "权限", value: "管理员/操作人员可上传；浏览人员无上传入口" },
        ]}
        wrapClassName="block w-full"
      >
      <div className="mb-5 grid grid-cols-3 overflow-hidden rounded-lg border border-admin-border bg-slate-50 p-1">
        <button
          type="button"
          disabled={batchSubmitted}
          className={`flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm transition ${
            mode === "single"
              ? "bg-white font-medium text-admin-primary shadow-sm"
              : "text-admin-muted hover:text-admin-text"
          }`}
          onClick={() => setMode("single")}
        >
          <FileText size={16} />
          单个资料上传
        </button>
        <button
          type="button"
          disabled={batchSubmitted}
          className={`flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm transition ${
            mode === "multi"
              ? "bg-white font-medium text-admin-primary shadow-sm"
              : "text-admin-muted hover:text-admin-text"
          }`}
          onClick={() => setMode("multi")}
        >
          <Files size={16} />
          多文件上传
        </button>
        <button
          type="button"
          disabled={batchSubmitted}
          className={`flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm transition ${
            mode === "batch"
              ? "bg-white font-medium text-admin-primary shadow-sm"
              : "text-admin-muted hover:text-admin-text"
          }`}
          onClick={() => setMode("batch")}
        >
          <FileArchive size={16} />
          压缩包批量上传
        </button>
      </div>
      </DevNote>

      {mode === "single" ? (
        <>
          <DevNote
            id="drawing-upload-single"
            title="单个资料上传"
            summary="一次上传一个PDF/DWG文件并生成V1.0，可同时挂接设备/管路模型"
            items={[
              { label: "数据来源", value: "资料编号默认自动生成（2026-NNN，可修改）；上传后提交到 List 的 submitUpload：编号重复则警告“资料编号已存在”，否则新增记录 V1.0、上传人=系统管理员" },
              { label: "校验规则", value: "文件仅支持PDF/DWG，≤50MB（UploadBox accept+maxSize，submitUpload 中 getFileFormat 校验）；编号/名称必填" },
              { label: "交互逻辑", value: "填写编号/名称/专业/分类/位置/目录/备注；可选关联模型（KKS自动匹配+树选择，详见模型挂接标注）；确认后生成V1.0并提示“已挂接N个对象”" },
              { label: "权限", value: "管理员/操作人员" },
            ]}
            wrapClassName="block w-full"
          >
          <div className="mb-4 rounded border border-blue-100 bg-blue-50/60 px-3 py-2 text-xs leading-5 text-blue-700">
            一次上传一个PDF或DWG文件，单文件最大50MB；上传后直接生成V1.0，可同时挂接一个或多个设备、管路模型。
          </div>
          {commonFields}
          <FormItem label="资料编号" required>
            <input
              className="input-base"
              value={single.code}
              onChange={(event) =>
                setSingle((current) => ({
                  ...current,
                  code: event.target.value,
                }))
              }
              placeholder="自动生成，可修改"
            />
          </FormItem>
          <FormItem label="资料名称" required>
            <input
              className="input-base"
              value={single.name}
              onChange={(event) =>
                setSingle((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="请输入资料名称"
            />
          </FormItem>
          <FormItem label="资料文件" required>
            <UploadBox
              accept=".pdf,.dwg"
              maxSize={50}
              hint="支持PDF/DWG格式，单文件≤50MB"
              onFileChange={(file) =>
                setSingle((current) => ({
                  ...current,
                  file: file || undefined,
                }))
              }
            />
          </FormItem>
          </DevNote>
          <FormItem
            label="关联模型"
            hint="可选；支持KKS编码自动推荐、条件检索和多模型挂接"
          >
            <ModelLinkSelector
              options={modelOptions}
              selectedKeys={single.linkedModelKeys}
              onChange={(linkedModelKeys) =>
                setSingle((current) => ({
                  ...current,
                  linkedModelKeys,
                }))
              }
              sourceText={`${single.code} ${single.name} ${single.file?.name || ""}`}
            />
          </FormItem>
        </>
      ) : mode === "multi" ? (
        <>
          <DevNote
            id="drawing-upload-multi"
            title="多文件上传（逐份挂接模型）"
            summary="一次多选PDF/DWG，每个文件独立生成资料记录，可逐份挂接模型"
            items={[
              { label: "交互逻辑", value: "点击或拖拽多选文件（≤50个）→ 每行自动生成递增值资料编号与文件名去扩展名的资料名称，可逐行修改；每行“挂接模型”打开独立挂接弹窗，保存后仅作用于该份资料" },
              { label: "挂接能力", value: "挂接模型为可选项，与单个上传一致，也可上传后在资料列表继续挂接；支持勾选多份批量挂接（一次选择应用到所有勾选行，已有挂接可选合并/覆盖），也支持逐份挂接；逐份弹窗支持KKS自动推荐（按编号+名称+文件名识别）、设备/管路结构树多选、“从上一份复制”与“保存并下一份”连续编辑" },
              { label: "校验规则", value: "仅PDF/DWG且单文件≤50MB；每份资料名称、编号在资料库与本次批次内唯一；挂接状态仅展示，不阻断上传" },
              { label: "后续步骤", value: "正式系统：多文件直传对象存储，逐份创建资料记录与挂接关系" },
            ]}
            wrapClassName="block w-full"
          >
          <div className="mb-4 rounded border border-blue-100 bg-blue-50/60 px-3 py-2 text-xs leading-5 text-blue-700">
            可一次选择多个PDF/DWG（最多50个，单文件≤50MB）；每个文件独立生成V1.0资料记录。挂接模型为可选项，可勾选多份批量挂接同一组模型，也可上传后在资料列表中继续挂接。
          </div>
          {commonFields}

          <FormItem label="资料文件" required>
            <input
              ref={multiInputRef}
              type="file"
              multiple
              accept=".pdf,.dwg"
              className="hidden"
              onChange={(event) => {
                appendMultiFiles(Array.from(event.target.files || []));
                event.target.value = "";
              }}
            />
            <div
              className={`cursor-pointer rounded border-2 border-dashed p-5 text-center transition-colors ${
                draggingMulti
                  ? "border-admin-primary bg-blue-50"
                  : "border-admin-border hover:border-admin-primary hover:bg-blue-50"
              }`}
              onClick={() => multiInputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setDraggingMulti(true);
              }}
              onDragLeave={() => setDraggingMulti(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDraggingMulti(false);
                appendMultiFiles(Array.from(event.dataTransfer.files || []));
              }}
            >
              <Files size={28} className="mx-auto mb-2 text-admin-muted" />
              <p className="text-sm text-admin-text">点击或拖拽多个文件到此处</p>
              <p className="mt-1 text-xs text-admin-muted">
                支持PDF/DWG，最多{MAX_MULTI_COUNT}个，单文件≤50MB，重复文件自动跳过
              </p>
            </div>
          </FormItem>

          {multiItems.length > 0 && (
            <div className="overflow-hidden rounded border border-admin-border">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-admin-border bg-gray-50 px-3 py-2.5">
                <div>
                  <div className="text-xs font-medium text-admin-text">
                    待上传文件（{multiItems.length}个）
                  </div>
                  <div className="mt-0.5 text-[10px] text-admin-muted">
                    挂接可选，上传后也可在资料列表继续挂接
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[11px]">
                  <span
                    className={
                      multiLinkedCount === multiItems.length
                        ? "text-green-600"
                        : "text-admin-muted"
                    }
                  >
                    已挂接 {multiLinkedCount}/{multiItems.length}
                  </span>
                  <label className="flex cursor-pointer items-center gap-1 text-admin-muted">
                    <input
                      type="checkbox"
                      checked={onlyUnlinked}
                      onChange={(event) => setOnlyUnlinked(event.target.checked)}
                    />
                    仅看未挂接
                  </label>
                  <span className="text-admin-muted">
                    已选 {selectedMultiItems.length} 份
                  </span>
                  <button
                    type="button"
                    className="rounded border border-admin-primary px-2 py-1 text-admin-primary transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-admin-border disabled:text-admin-muted"
                    disabled={selectedMultiItems.length === 0}
                    onClick={openBatchLink}
                  >
                    批量挂接
                  </button>
                  <button
                    type="button"
                    className="rounded border border-admin-border px-2 py-1 text-admin-muted transition hover:text-admin-text disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={selectedMultiItems.length === 0}
                    onClick={clearSelectedLinks}
                  >
                    清除挂接
                  </button>
                </div>
              </div>
              <div className="max-h-[320px] overflow-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 z-10 bg-white text-admin-muted">
                    <tr className="border-b border-admin-border">
                      <th className="w-8 px-2 py-2 text-left font-medium">
                        <input
                          type="checkbox"
                          checked={allSelectableSelected}
                          disabled={selectableMultiItems.length === 0}
                          onChange={toggleSelectAll}
                          title="全选"
                        />
                      </th>
                      <th className="w-10 px-2 py-2 text-left font-medium">序号</th>
                      <th className="w-[170px] px-2 py-2 text-left font-medium">文件名</th>
                      <th className="w-[180px] px-2 py-2 text-left font-medium">资料名称</th>
                      <th className="w-[120px] px-2 py-2 text-left font-medium">资料编号</th>
                      <th className="w-20 px-2 py-2 text-left font-medium">格式/大小</th>
                      <th className="w-[110px] px-2 py-2 text-left font-medium">挂接模型</th>
                      <th className="px-2 py-2 text-left font-medium">校验结果</th>
                      <th className="w-10 px-2 py-2 text-left font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleMultiItems.length === 0 ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-3 py-6 text-center text-admin-muted"
                        >
                          全部文件均已挂接模型
                        </td>
                      </tr>
                    ) : (
                      visibleMultiItems.map((item) => {
                        const index = multiItems.findIndex(
                          (target) => target.id === item.id,
                        );
                        const unlinked = item.linkedModelKeys.length === 0;
                        const isGroup =
                          !unlinked &&
                          (linkGroupCounts.get(
                            [...item.linkedModelKeys].sort().join("|"),
                          ) || 0) > 1;
                        return (
                          <tr
                            key={item.id}
                            className={`border-b border-admin-border last:border-0 ${
                              item.status === "failed" ? "bg-red-50/50" : ""
                            }`}
                          >
                            <td className="px-2 py-2">
                              <input
                                type="checkbox"
                                checked={selectedMultiIds.includes(item.id)}
                                disabled={item.status !== "ready"}
                                onChange={() => toggleMultiSelect(item.id)}
                              />
                            </td>
                            <td className="px-2 py-2 text-admin-muted">
                              {index + 1}
                            </td>
                            <td
                              className="max-w-[170px] truncate px-2 py-2 text-admin-text"
                              title={item.file.name}
                            >
                              {item.file.name}
                            </td>
                            <td className="px-2 py-2">
                              <input
                                className="input-base h-8 w-full text-xs"
                                value={item.name}
                                onChange={(event) =>
                                  updateMultiItem(item.id, {
                                    name: event.target.value,
                                  })
                                }
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                className="input-base h-8 w-full font-mono text-xs"
                                value={item.code}
                                onChange={(event) =>
                                  updateMultiItem(item.id, {
                                    code: event.target.value,
                                  })
                                }
                              />
                            </td>
                            <td className="px-2 py-2">
                              <Tag
                                color={
                                  item.extension === "PDF"
                                    ? "red"
                                    : item.extension === "DWG"
                                      ? "blue"
                                      : "gray"
                                }
                              >
                                {item.extension || "未知"}
                              </Tag>
                              <div className="mt-0.5 text-[10px] text-admin-muted">
                                {item.sizeText}
                              </div>
                            </td>
                            <td className="px-2 py-2">
                              <div className="flex flex-wrap items-center gap-1">
                                <button
                                  type="button"
                                  className={`flex items-center gap-1 text-xs hover:underline ${
                                    unlinked
                                      ? "text-admin-muted"
                                      : "text-cyan-700"
                                  }`}
                                  onClick={() => openLinkEditor(index)}
                                >
                                  <Link2 size={12} />
                                  {unlinked
                                    ? "去挂接"
                                    : `已挂接${item.linkedModelKeys.length}`}
                                </button>
                                {isGroup && <Tag color="cyan">同组</Tag>}
                              </div>
                            </td>
                            <td className="px-2 py-2">
                              {item.status === "failed" ? (
                                <span className="flex items-start gap-1 text-red-600">
                                  <AlertCircle
                                    size={13}
                                    className="mt-0.5 flex-shrink-0"
                                  />
                                  {item.reason}
                                </span>
                              ) : unlinked ? (
                                <span className="text-admin-muted">
                                  未挂接（可稍后挂接）
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-green-600">
                                  <CheckCircle2 size={13} />
                                  校验通过
                                </span>
                              )}
                            </td>
                            <td className="px-2 py-2">
                              <button
                                type="button"
                                className="text-admin-muted hover:text-admin-danger"
                                title="移除文件"
                                onClick={() => removeMultiItem(item.id)}
                              >
                                <X size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          </DevNote>
        </>
      ) : (
        <>
          <DevNote
            id="drawing-upload-batch"
            title="ZIP压缩包批量上传"
            summary="上传ZIP解析并校验每个文件，独立生成资料记录"
            items={[
              { label: "校验规则", value: "仅ZIP格式，≤200MB，有效文件≤100个，ZIP内单文件≤50MB且仅PDF/DWG；跳过__MACOSX/与隐藏文件；同名资料标记为跳过（可改名后重新校验）；格式/大小超限标记为失败" },
              { label: "交互逻辑", value: "选择ZIP后 JSZip 解析生成批量预览表（序号/文件/资料名称可改/格式/大小/校验结果）；提交时仅导入 ready 项，统计 成功/跳过/失败 并提示；批量模式不挂接模型、不覆盖已有资料或版本" },
              { label: "后续步骤", value: "正式系统：ZIP由服务端解压校验，资料名称查重走资料库" },
              { label: "权限", value: "管理员/操作人员" },
            ]}
            wrapClassName="block w-full"
          >
          <div className="mb-4 grid grid-cols-[1fr_auto] items-center gap-4 rounded border border-orange-200 bg-orange-50 px-3 py-2.5">
            <div className="flex items-start gap-2 text-xs leading-5 text-orange-800">
              <Archive size={16} className="mt-0.5 flex-shrink-0" />
              <span>
                ZIP最大200MB，最多导入100个有效文件；仅处理PDF、DWG，ZIP内单文件最大50MB。每个文件独立生成资料记录，ZIP本身不生成记录。
              </span>
            </div>
            <Tag color="orange">批量模式不挂接模型</Tag>
          </div>
          {commonFields}
          <FormItem label="ZIP压缩包" required>
            <UploadBox
              accept=".zip,application/zip"
              maxSize={200}
              hint="支持ZIP格式，压缩包≤200MB"
              onFileChange={(file) => void parseZip(file)}
            />
          </FormItem>
          </DevNote>

          {(parsingZip || batchItems.length > 0) && (
            <div className="mb-4 overflow-hidden rounded border border-admin-border">
              <div className="flex items-center justify-between border-b border-admin-border bg-gray-50 px-3 py-2.5">
                <div>
                  <div className="text-xs font-medium text-admin-text">
                    批量导入预览
                  </div>
                  <div className="mt-0.5 text-[10px] text-admin-muted">
                    可修改同名资料名称后重新校验；批量上传不会覆盖资料或更新已有版本。
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-blue-600">
                    待导入 {batchStatistics.ready}
                  </span>
                  <span className="text-green-600">
                    成功 {batchStatistics.success}
                  </span>
                  <span className="text-orange-600">
                    跳过 {batchStatistics.skipped}
                  </span>
                  <span className="text-red-600">
                    失败 {batchStatistics.failed}
                  </span>
                </div>
              </div>
              {parsingZip ? (
                <div className="flex h-40 items-center justify-center text-xs text-admin-muted">
                  正在解析ZIP目录和文件信息...
                </div>
              ) : (
                <div className="max-h-[300px] overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 z-10 bg-white text-admin-muted">
                      <tr className="border-b border-admin-border">
                        <th className="w-12 px-3 py-2 text-left font-medium">序号</th>
                        <th className="px-3 py-2 text-left font-medium">ZIP内文件</th>
                        <th className="w-[250px] px-3 py-2 text-left font-medium">资料名称</th>
                        <th className="w-16 px-3 py-2 text-left font-medium">格式</th>
                        <th className="w-20 px-3 py-2 text-left font-medium">大小</th>
                        <th className="w-[210px] px-3 py-2 text-left font-medium">校验结果</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchItems.map((item, index) => (
                        <tr
                          key={item.id}
                          className="border-b border-admin-border last:border-0"
                        >
                          <td className="px-3 py-2 text-admin-muted">{index + 1}</td>
                          <td className="max-w-[260px] truncate px-3 py-2 text-admin-text" title={item.path}>
                            {item.originalName}
                          </td>
                          <td className="px-3 py-2">
                            <div className="relative">
                              <Pencil
                                size={12}
                                className="absolute left-2 top-1/2 -translate-y-1/2 text-admin-muted"
                              />
                              <input
                                className="input-base h-8 w-full pl-7 text-xs"
                                value={item.name}
                                disabled={batchSubmitted || Boolean(item.validationError)}
                                onChange={(event) =>
                                  updateBatchName(item.id, event.target.value)
                                }
                              />
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <Tag color={item.extension === "PDF" ? "red" : item.extension === "DWG" ? "blue" : "gray"}>
                              {item.extension || "未知"}
                            </Tag>
                          </td>
                          <td className="px-3 py-2 text-admin-muted">{item.sizeText}</td>
                          <td className="px-3 py-2">
                            <div
                              className={`flex items-start gap-1.5 ${
                                item.status === "success"
                                  ? "text-green-600"
                                  : item.status === "skipped"
                                    ? "text-orange-600"
                                    : item.status === "failed"
                                      ? "text-red-600"
                                      : "text-blue-600"
                              }`}
                            >
                              {item.status === "success" ? (
                                <CheckCircle2 size={13} className="mt-0.5 flex-shrink-0" />
                              ) : item.status === "skipped" ? (
                                <SkipForward size={13} className="mt-0.5 flex-shrink-0" />
                              ) : item.status === "failed" ? (
                                <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
                              ) : (
                                <FileText size={13} className="mt-0.5 flex-shrink-0" />
                              )}
                              <span>
                                {item.reason ||
                                  (item.status === "ready" ? "校验通过，待导入" : "")}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <FormItem label="备注">
        <textarea
          className="input-base"
          rows={2}
          value={common.remark}
          disabled={batchSubmitted}
          onChange={(event) => setCommonValue("remark", event.target.value)}
          placeholder={
            mode === "single"
              ? "请输入资料备注"
              : "该备注将应用到本次成功导入的全部资料"
          }
        />
      </FormItem>
    </Modal>

    <Modal
      open={linkIndex !== null && Boolean(linkItem)}
      onClose={() => setLinkIndex(null)}
      title={
        linkItem
          ? `挂接模型 · 第 ${(linkIndex ?? 0) + 1}/${multiItems.length} 份`
          : "挂接模型"
      }
      width={920}
      footer={
        <>
          <button className="btn-default" onClick={() => setLinkIndex(null)}>
            取消
          </button>
          <button
            className="btn-default"
            onClick={copyPreviousLink}
            disabled={linkIndex === null || linkIndex === 0}
          >
            从上一份复制
          </button>
          <button className="btn-primary" onClick={() => saveLink(false)}>
            保存
          </button>
          <button
            className="btn-primary"
            onClick={() => saveLink(true)}
            disabled={linkIndex === null || linkIndex >= multiItems.length - 1}
          >
            保存并下一份
          </button>
        </>
      }
    >
      {linkItem && (
        <>
          <div className="mb-4 rounded border border-blue-100 bg-blue-50/60 px-3 py-2 text-xs leading-5 text-blue-700">
            当前资料：{linkItem.name}
            <span className="ml-2 font-mono text-[11px] text-blue-600">
              {linkItem.code}
            </span>
            <span className="ml-2 text-[11px] text-blue-500">
              {linkItem.file.name}
            </span>
          </div>
          <FormItem
            label="挂接模型"
            hint={`可选；当前弹窗仅作用于该份资料，已选 ${linkDraftKeys.length} 个对象`}
          >
            <ModelLinkSelector
              options={modelOptions}
              selectedKeys={linkDraftKeys}
              onChange={setLinkDraftKeys}
              sourceText={`${linkItem.code} ${linkItem.name} ${linkItem.file.name}`}
            />
          </FormItem>
        </>
      )}
    </Modal>

    <Modal
      open={batchLinkOpen}
      onClose={() => setBatchLinkOpen(false)}
      title={`批量挂接模型 · 已选 ${selectedMultiItems.length} 份`}
      width={920}
      footer={
        <>
          <button className="btn-default" onClick={() => setBatchLinkOpen(false)}>
            取消
          </button>
          <button className="btn-primary" onClick={saveBatchLink}>
            保存挂接（{selectedMultiItems.length}份）
          </button>
        </>
      }
    >
      {selectedMultiItems.length > 0 && (
        <>
          <div className="mb-4 rounded border border-blue-100 bg-blue-50/60 px-3 py-2 text-xs leading-5 text-blue-700">
            <div>
              本次选择将应用到以下 {selectedMultiItems.length} 份资料：
            </div>
            <div className="mt-1 text-[11px] text-blue-600">
              {selectedMultiItems
                .slice(0, 5)
                .map((item) => item.file.name)
                .join("、")}
              {selectedMultiItems.length > 5
                ? ` 等 ${selectedMultiItems.length} 份`
                : ""}
            </div>
          </div>
          {selectedMultiItems.some(
            (item) => item.linkedModelKeys.length > 0,
          ) && (
            <div className="mb-4 flex items-center gap-4 text-xs text-admin-text">
              <span className="text-admin-muted">已有挂接的处理方式：</span>
              <label className="flex cursor-pointer items-center gap-1">
                <input
                  type="radio"
                  checked={batchApplyMode === "merge"}
                  onChange={() => setBatchApplyMode("merge")}
                />
                合并（保留原有挂接并追加）
              </label>
              <label className="flex cursor-pointer items-center gap-1">
                <input
                  type="radio"
                  checked={batchApplyMode === "override"}
                  onChange={() => setBatchApplyMode("override")}
                />
                覆盖（以本次选择为准）
              </label>
            </div>
          )}
          <FormItem
            label="挂接模型"
            hint={`将应用到 ${selectedMultiItems.length} 份资料；已选 ${batchLinkKeys.length} 个对象`}
          >
            <ModelLinkSelector
              options={modelOptions}
              selectedKeys={batchLinkKeys}
              onChange={setBatchLinkKeys}
              sourceText={`${selectedMultiItems[0].code} ${
                selectedMultiItems[0].name
              } ${selectedMultiItems[0].file.name}`}
            />
          </FormItem>
        </>
      )}
    </Modal>
    </>
  );
}
