import { useEffect, useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import {
  AlertCircle,
  Archive,
  CheckCircle2,
  FileArchive,
  FileText,
  Pencil,
  SkipForward,
} from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { UploadBox, FormItem } from "@/components/common/UploadBox";
import { message } from "@/components/common/Message";
import { Tag } from "@/components/common/Tag";
import ModelLinkSelector, {
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

export type UploadFormValues =
  | SingleUploadFormValues
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

export default function UploadModal({
  open,
  defaultCode,
  defaultDirectoryId,
  directories,
  existingNames,
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

  return (
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
            {batchSubmitted
              ? "完成"
              : mode === "single"
                ? "确认上传"
                : `确认导入${batchStatistics.ready ? `（${batchStatistics.ready}项）` : ""}`}
          </button>
        </>
      }
    >
      <DevNote
        id="drawing-upload-mode"
        title="上传模式切换（单个/批量）"
        summary="选择单个资料上传或ZIP压缩包批量上传"
        items={[
          { label: "交互逻辑", value: "两个Tab切换 mode（single/batch）；批量导入提交后锁定，按钮文案变为“确认导入（N项）/完成/关闭”" },
          { label: "校验规则", value: "提交时逐项校验：所属目录/专业/分类/位置必填；单文件模式校验编号、名称、文件；批量模式校验ZIP文件与可导入项" },
          { label: "权限", value: "管理员/操作人员可上传；浏览人员无上传入口" },
        ]}
        wrapClassName="block w-full"
      >
      <div className="mb-5 grid grid-cols-2 overflow-hidden rounded-lg border border-admin-border bg-slate-50 p-1">
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
  );
}
