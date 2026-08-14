import { useLayoutEffect, useRef, useState } from "react";
import { useDevNotesStore } from "@/store/devNotes";
import { MessageSquareText } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DevNoteItem {
  label: string;
  value: string;
}

export interface DevNoteProps {
  /** 唯一标识，用于当前展开项定位 */
  id: string;
  /** 控件名称 */
  title: string;
  /** 一句话说明该控件做什么 */
  summary: string;
  /** 详细标注项：数据来源/接口、校验规则、状态流转、权限、联动等 */
  items?: DevNoteItem[];
  /** 包裹层额外类名（默认 inline-flex），用于绝对定位等场景保持布局 */
  wrapClassName?: string;
  children?: React.ReactNode;
}

interface CardPos {
  top: number;
  left: number;
  width: number;
}

/**
 * 开发说明标注组件（方案A）
 * 包裹任意控件后，在全局"开发说明"开关打开时，控件右上角显示标注入口，
 * 点击弹出完整开发标注卡片。内容仅供开发参照，不参与业务逻辑。
 */
export function DevNote({
  id,
  title,
  summary,
  items = [],
  wrapClassName,
  children,
}: DevNoteProps) {
  const { visible, activeId, setActive } = useDevNotesStore();
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<CardPos | null>(null);

  const open = visible && activeId === id;

  // 卡片打开时基于包裹元素位置计算固定定位，避免被父容器裁剪或超出视口
  // 注意：该 hook 必须在条件返回之前声明，避免 hooks 数量不一致导致崩溃
  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const el = wrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const width = Math.min(320, vw - 16);
      const maxH = Math.min(420, vh - 16);
      const cardH = cardRef.current?.offsetHeight || maxH;

      // 水平：优先与包裹元素左对齐，超右边界则向左收
      let left = rect.left;
      if (left + width > vw - 8) left = Math.max(8, vw - 8 - width);
      // 垂直：优先放下方，放不下放上方，再不行贴顶
      let top = rect.bottom + 6;
      if (top + maxH > vh - 8) {
        const above = rect.top - cardH - 6;
        top = above >= 8 ? above : 8;
      }
      setPos({ top, left, width });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  // wrapClassName 含 absolute/fixed 时不再叠加 relative，避免内联定位覆盖
  const needsRelative = !/absolute|fixed/.test(wrapClassName || "");
  // wrapClassName 指定了其他 display 时不再叠加 inline-flex
  const hasDisplayClass = /(^|\s)(block|flex|grid|inline-block|inline)(\s|$)/.test(
    wrapClassName || "",
  );
  const displayClass = hasDisplayClass ? "" : "inline-flex";

  if (!visible) {
    // 定位型标注（wrapClassName 含 absolute/fixed）：即使关闭开发说明也必须保留
    // wrap 层，否则被包裹元素（如大屏浮动工具栏）会失去绝对定位而铺满父容器
    const keepWrap = /absolute|fixed/.test(wrapClassName || "");
    if (keepWrap) {
      return (
        <div
          ref={wrapRef}
          className={cn(
            "devnote-wrap",
            needsRelative && "relative",
            displayClass,
            wrapClassName,
          )}
        >
          {children}
        </div>
      );
    }
    return <>{children}</>;
  }

  const toggleOpen = () => setActive(open ? null : id);

  return (
    <div
      ref={wrapRef}
      className={cn(
        "devnote-wrap",
        needsRelative && "relative",
        displayClass,
        wrapClassName,
      )}
    >
      {children}
      {/* 标注入口标记（定位在包裹元素内，避免被父容器裁剪） */}
      <button
        type="button"
        onClick={toggleOpen}
        title={`开发说明：${title}`}
        className="devnote-marker"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          zIndex: 50,
          width: 18,
          height: 18,
          borderRadius: 9999,
          background: open ? "#fa8c16" : "#ffc53d",
          border: "1px solid #fff",
          boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "#fff",
        }}
      >
        <MessageSquareText size={11} />
      </button>

      {/* 标注卡片（fixed 定位，自动避让视口边界） */}
      {open && pos && (
        <div
          ref={cardRef}
          className="devnote-card"
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            width: pos.width,
            zIndex: 999,
            maxHeight: "min(420px, calc(100vh - 16px))",
            overflow: "auto",
            background: "#fffdf5",
            border: "1px solid #ffe58f",
            borderRadius: 8,
            boxShadow: "0 6px 24px rgba(0,0,0,0.18)",
            padding: "12px 14px",
            fontSize: 12,
            lineHeight: 1.6,
            textAlign: "left",
          }}
        >
          <div style={{ fontWeight: 700, color: "#874d00", marginBottom: 4 }}>
            {title}
          </div>
          <div style={{ color: "#614700", marginBottom: 8 }}>{summary}</div>
          {items.length > 0 && (
            <div style={{ borderTop: "1px dashed #ffe58f", paddingTop: 8 }}>
              {items.map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    gap: 8,
                    marginBottom: 4,
                    color: "#5c5c5c",
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      minWidth: 64,
                      fontWeight: 600,
                      color: "#8c6d1f",
                    }}
                  >
                    {item.label}：
                  </span>
                  <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
