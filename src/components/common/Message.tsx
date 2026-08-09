import { create } from "zustand";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

type MessageType = "success" | "error" | "warning" | "info";

interface MessageItem {
  id: number;
  type: MessageType;
  content: string;
}

interface MessageState {
  messages: MessageItem[];
  addMessage: (type: MessageType, content: string) => void;
  removeMessage: (id: number) => void;
}

let messageId = 0;

export const useMessageStore = create<MessageState>((set) => ({
  messages: [],
  addMessage: (type, content) => {
    const id = ++messageId;
    set((state) => ({ messages: [...state.messages, { id, type, content }] }));
    setTimeout(() => {
      set((state) => ({
        messages: state.messages.filter((m) => m.id !== id),
      }));
    }, 3000);
  },
  removeMessage: (id) => {
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== id),
    }));
  },
}));

export function message(type: MessageType, content: string) {
  useMessageStore.getState().addMessage(type, content);
}

message.success = (content: string) => message("success", content);
message.error = (content: string) => message("error", content);
message.warning = (content: string) => message("warning", content);
message.info = (content: string) => message("info", content);

const iconMap = {
  success: <CheckCircle size={18} className="text-green-500" />,
  error: <XCircle size={18} className="text-red-500" />,
  warning: <AlertCircle size={18} className="text-orange-500" />,
  info: <Info size={18} className="text-blue-500" />,
};

const bgMap = {
  success: "bg-white border-green-200",
  error: "bg-white border-red-200",
  warning: "bg-white border-orange-200",
  info: "bg-white border-blue-200",
};

export function MessageContainer() {
  const { messages, removeMessage } = useMessageStore();

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded shadow-lg border min-w-[280px] animate-slide-down",
            bgMap[msg.type]
          )}
        >
          {iconMap[msg.type]}
          <span className="text-sm text-admin-text flex-1">{msg.content}</span>
          <button
            onClick={() => removeMessage(msg.id)}
            className="text-admin-muted hover:text-admin-text"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

// 右键菜单组件
interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  useEffect(() => {
    const handleClick = () => onClose();
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [onClose]);

  // 调整位置防止超出屏幕
  const adjustedX = Math.min(x, window.innerWidth - 160);
  const adjustedY = Math.min(y, window.innerHeight - items.length * 36 - 12);

  return (
    <div
      className="fixed z-[9999] bg-white rounded shadow-lg border border-admin-border py-1 min-w-[120px] animate-fade-in"
      style={{ left: adjustedX, top: adjustedY }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, index) => (
        <div
          key={index}
          onClick={() => {
            item.onClick();
            onClose();
          }}
          className="flex items-center gap-2 px-3 py-2 text-sm text-admin-text hover:bg-blue-50 hover:text-admin-primary cursor-pointer transition-colors"
        >
          {item.icon}
          {item.label}
        </div>
      ))}
    </div>
  );
}
