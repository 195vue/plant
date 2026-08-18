import { cn } from "@/lib/utils";

type TagColor =
  | "blue"
  | "green"
  | "orange"
  | "red"
  | "gray"
  | "purple"
  | "yellow"
  | "cyan";

const colorMap: Record<TagColor, string> = {
  blue: "bg-blue-50 text-blue-600 border-blue-200",
  green: "bg-green-50 text-green-600 border-green-200",
  orange: "bg-orange-50 text-orange-600 border-orange-200",
  red: "bg-red-50 text-red-600 border-red-200",
  gray: "bg-gray-100 text-gray-600 border-gray-200",
  purple: "bg-purple-50 text-purple-600 border-purple-200",
  yellow: "bg-yellow-50 text-yellow-600 border-yellow-200",
  cyan: "bg-cyan-50 text-cyan-600 border-cyan-200",
};

interface TagProps {
  color?: TagColor;
  children: React.ReactNode;
  className?: string;
}

export function Tag({ color = "blue", children, className }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs border",
        colorMap[color],
        className
      )}
    >
      {children}
    </span>
  );
}

// 状态标签快捷组件
export function StatusTag({
  status,
}: {
  status: string;
}) {
  const statusConfig: Record<
    string,
    { color: TagColor; label: string }
  > = {
    // 挂接状态
    linked: { color: "green", label: "已挂接" },
    unlinked: { color: "gray", label: "未挂接" },
    // 启用状态
    enabled: { color: "green", label: "启用" },
    disabled: { color: "gray", label: "停用" },
    // 日志状态
    success: { color: "green", label: "成功" },
    failed: { color: "red", label: "失败" },
    // 待办状态
    todo: { color: "yellow", label: "待处理" },
    done: { color: "green", label: "已处理" },
  };

  const config = statusConfig[status] || { color: "gray", label: status };
  return <Tag color={config.color}>{config.label}</Tag>;
}
