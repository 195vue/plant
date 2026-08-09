import { type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  width?: number | string;
  children: ReactNode;
  footer?: ReactNode;
  maskClosable?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  width = 500,
  children,
  footer,
  maskClosable = true,
}: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in"
      onClick={() => maskClosable && onClose()}
    >
      <div
        className="bg-white rounded-lg shadow-xl flex flex-col max-h-[90vh]"
        style={{ width }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-admin-border">
            <h3 className="text-base font-medium text-admin-text">{title}</h3>
            <button
              onClick={onClose}
              className="text-admin-muted hover:text-admin-text transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-admin-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  content: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  okText?: string;
  cancelText?: string;
  danger?: boolean;
  okClass?: string;
}

export function ConfirmModal({
  open,
  title = "确认操作",
  content,
  onConfirm,
  onCancel,
  okText = "确定",
  cancelText = "取消",
  danger = false,
  okClass,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      width={400}
      footer={
        <>
          <button className="btn-default" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            className={okClass || cn(
              danger
                ? "bg-admin-danger text-white hover:bg-red-600"
                : "btn-primary"
            )}
            onClick={onConfirm}
          >
            {okText}
          </button>
        </>
      }
    >
      <div className="text-sm text-admin-text">{content}</div>
    </Modal>
  );
}
