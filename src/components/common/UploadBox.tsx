import { useState, type ReactNode } from "react";
import { Upload, X, File as FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadBoxProps {
  accept?: string;
  maxSize?: number; // MB
  onFileChange?: (file: File | null) => void;
  hint?: string;
}

export function UploadBox({
  accept = "*",
  maxSize = 50,
  onFileChange,
  hint,
}: UploadBoxProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFile = (selectedFile: File) => {
    if (selectedFile.size > maxSize * 1024 * 1024) {
      alert(`文件大小不能超过${maxSize}MB`);
      return;
    }
    setFile(selectedFile);
    onFileChange?.(selectedFile);
    // 模拟上传进度
    setProgress(0);
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(timer);
          return 100;
        }
        return p + 10;
      });
    }, 100);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + "B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + "KB";
    return (bytes / (1024 * 1024)).toFixed(1) + "MB";
  };

  return (
    <div className="w-full">
      {!file ? (
        <div
          className={cn(
            "border-2 border-dashed rounded p-6 text-center cursor-pointer transition-colors",
            dragging
              ? "border-admin-primary bg-blue-50"
              : "border-admin-border hover:border-admin-primary hover:bg-blue-50"
          )}
          onClick={() => document.getElementById("upload-input")?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (e.dataTransfer.files[0]) {
              handleFile(e.dataTransfer.files[0]);
            }
          }}
        >
          <Upload
            size={32}
            className="mx-auto text-admin-muted mb-2"
          />
          <p className="text-sm text-admin-text">
            点击或拖拽文件到此处上传
          </p>
          {hint && <p className="text-xs text-admin-muted mt-1">{hint}</p>}
          <input
            id="upload-input"
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFile(e.target.files[0]);
            }}
          />
        </div>
      ) : (
        <div className="border border-admin-border rounded p-3 bg-gray-50">
          <div className="flex items-center gap-2">
            <FileIcon size={20} className="text-admin-primary" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-admin-text truncate">{file.name}</p>
              <p className="text-xs text-admin-muted">{formatSize(file.size)}</p>
            </div>
            <button
              onClick={() => {
                setFile(null);
                onFileChange?.(null);
              }}
              className="text-admin-muted hover:text-admin-danger"
            >
              <X size={16} />
            </button>
          </div>
          {progress < 100 && (
            <div className="mt-2">
              <div className="h-1 bg-gray-200 rounded">
                <div
                  className="h-full bg-admin-primary rounded transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-admin-muted mt-1">上传中 {progress}%</p>
            </div>
          )}
          {progress === 100 && (
            <p className="text-xs text-admin-success mt-1">上传成功</p>
          )}
        </div>
      )}
    </div>
  );
}

interface FormItemProps {
  label: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
  hint?: string;
}

export function FormItem({ label, required, children, className, hint }: FormItemProps) {
  return (
    <div className={cn("flex items-start gap-2 mb-4", className)}>
      <label className="text-sm text-admin-text whitespace-nowrap w-24 text-right pt-1.5">
        {required && <span className="text-admin-danger mr-1">*</span>}
        {label}：
      </label>
      <div className="flex-1">
        {children}
        {hint && <p className="text-xs text-admin-muted mt-1">{hint}</p>}
      </div>
    </div>
  );
}
