import { Modal } from "@/components/common/Modal";
import { Tag } from "@/components/common/Tag";
import { message } from "@/components/common/Message";
import {
  FileText,
  Image as ImageIcon,
  Video,
  File as FileIcon,
  Download,
  X,
} from "lucide-react";
import type { DocumentItem } from "@/types";
import { categoryColorMap, getLinkedCode } from "../List";

interface DocumentPreviewModalProps {
  open: boolean;
  document: DocumentItem | null;
  onClose: () => void;
}

// 文件类型分类
type FileKind = "pdf" | "word" | "excel" | "image" | "video" | "other";

const getFileKind = (fileType: string): FileKind => {
  const t = (fileType || "").toUpperCase();
  if (t === "PDF") return "pdf";
  if (t === "DOC" || t === "DOCX") return "word";
  if (t === "XLS" || t === "XLSX") return "excel";
  if (t === "JPG" || t === "PNG") return "image";
  if (t === "MP4") return "video";
  return "other";
};

// 资料预览弹窗：PDF/Word/Excel占位预览，图片显示占位图，视频显示播放器占位，其他提示下载
export default function DocumentPreviewModal({
  open,
  document,
  onClose,
}: DocumentPreviewModalProps) {
  if (!document) return null;
  const kind = getFileKind(document.fileType);
  const linkedCode = getLinkedCode(document);

  const handleDownload = () =>
    message.success(`开始下载：${document.name}`);

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={800}
      footer={
        <>
          <button className="btn-default" onClick={onClose}>
            关闭
          </button>
          <button
            className="btn-primary flex items-center gap-1"
            onClick={handleDownload}
          >
            <Download size={14} />
            下载
          </button>
        </>
      }
    >
      {/* 顶部：资料名称 + 分类标签 + 关联对象 + 关闭按钮 */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-admin-border">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="text-base font-medium text-admin-text truncate">
            {document.name}
          </span>
          <Tag color={categoryColorMap[document.category] || "gray"}>
            {document.category}
          </Tag>
          {document.linkedName ? (
            <span className="text-xs text-admin-muted">
              关联对象：
              <span className="text-admin-primary">
                {linkedCode
                  ? `${linkedCode} - ${document.linkedName}`
                  : document.linkedName}
              </span>
            </span>
          ) : (
            <span className="text-xs text-admin-muted">关联对象：未关联</span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-admin-muted hover:text-admin-text transition-colors ml-2"
        >
          <X size={18} />
        </button>
      </div>

      {/* 预览区域 */}
      <div
        className="bg-gray-50 border border-admin-border rounded flex items-center justify-center"
        style={{ height: "440px" }}
      >
        {(kind === "pdf" || kind === "word" || kind === "excel") && (
          <div className="flex flex-col items-center gap-3 text-admin-muted">
            <FileText size={64} className="text-admin-primary" />
            <p className="text-sm">在线预览中...</p>
            <p className="text-xs">
              {document.fileType} 文件 · {document.fileSize}
            </p>
          </div>
        )}

        {kind === "image" && (
          <div className="flex flex-col items-center gap-3 text-admin-muted">
            <div className="w-72 h-44 bg-gradient-to-br from-gray-200 to-gray-300 rounded flex items-center justify-center">
              <ImageIcon size={40} className="text-gray-400" />
            </div>
            <p className="text-xs">
              图片预览（占位）· {document.fileType}
            </p>
          </div>
        )}

        {kind === "video" && (
          <div className="flex flex-col items-center gap-2 text-admin-muted">
            <div className="w-80 h-44 bg-black rounded flex items-center justify-center relative overflow-hidden">
              <Video size={48} className="text-white opacity-80" />
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black bg-opacity-60 px-3 py-1 rounded">
                <div className="w-0 h-0 border-y-4 border-y-transparent border-l-8 border-l-white"></div>
                <div className="w-32 h-1 bg-white bg-opacity-30 rounded">
                  <div className="w-1/4 h-full bg-admin-primary rounded"></div>
                </div>
                <span className="text-xs text-white">00:30 / 02:00</span>
              </div>
            </div>
            <p className="text-xs">视频播放器（占位）· {document.fileType}</p>
          </div>
        )}

        {kind === "other" && (
          <div className="flex flex-col items-center gap-3 text-admin-muted">
            <FileIcon size={64} className="text-gray-400" />
            <p className="text-sm">不支持在线预览，请下载查看</p>
            <button
              className="btn-primary flex items-center gap-1"
              onClick={handleDownload}
            >
              <Download size={14} />
              下载文件
            </button>
          </div>
        )}
      </div>

      {/* 底部文件信息 */}
      <p className="text-xs text-admin-muted mt-2">
        文件格式：{document.fileType} · 文件大小：{document.fileSize} · 上传人：
        {document.uploadUser} · 上传时间：{document.uploadTime}
      </p>
    </Modal>
  );
}
