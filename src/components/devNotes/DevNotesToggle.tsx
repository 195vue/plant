import { useDevNotesStore } from "@/store/devNotes";
import { MessageSquareText } from "lucide-react";

/**
 * 全局"开发说明"开关按钮（方案A）
 * 固定在页面右下角，点击切换全部开发标注的显示/隐藏。
 * 开启后页面各控件的 DevNote 标注入口可见。
 */
export function DevNotesToggle() {
  const { visible, toggle } = useDevNotesStore();

  return (
    <button
      type="button"
      onClick={toggle}
      title={visible ? "关闭开发说明" : "开启开发说明"}
      className="devnotes-toggle"
      style={{
        position: "fixed",
        right: 20,
        bottom: 20,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 14px",
        borderRadius: 9999,
        border: "1px solid #d9b64e",
        background: visible ? "#fa8c16" : "#fff7e6",
        color: visible ? "#fff" : "#874d00",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
      }}
    >
      <MessageSquareText size={15} />
      {visible ? "关闭开发说明" : "开发说明"}
    </button>
  );
}
