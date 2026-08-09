import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Box, GitBranch } from "lucide-react";
import EquipmentAttribute from "@/pages/equipment/Attribute";
import PipelineAttribute from "@/pages/pipeline/Attribute";
import { cn } from "@/lib/utils";

type AttrTab = "equipment" | "pipeline";

export default function AttributeManage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get("tab") as AttrTab) || "equipment";

  // 切换Tab时更新URL参数，保留equipId/pipelineId
  const switchTab = (next: AttrTab) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", next);
    // 切换时清掉另一个类型的id参数
    if (next === "equipment") {
      params.delete("pipelineId");
    } else {
      params.delete("equipId");
    }
    setSearchParams(params, { replace: true });
  };

  // 首次进入若无tab参数，补上默认值
  useEffect(() => {
    if (!searchParams.get("tab")) {
      const params = new URLSearchParams(searchParams);
      params.set("tab", "equipment");
      setSearchParams(params, { replace: true });
    }
  }, []);

  const tabs: { key: AttrTab; label: string; icon: React.ReactNode }[] = [
    { key: "equipment", label: "设备属性", icon: <Box size={14} /> },
    { key: "pipeline", label: "管路属性", icon: <GitBranch size={14} /> },
  ];

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Tab 切换栏 */}
      <div className="flex items-center gap-1 bg-admin-card border border-admin-border rounded p-1 flex-shrink-0">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => switchTab(t.key)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded transition-colors",
              tab === t.key
                ? "bg-blue-500 text-white"
                : "text-admin-muted hover:text-admin-text hover:bg-gray-100"
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* 内容区 */}
      <div className="flex-1 min-h-0">
        {tab === "equipment" ? <EquipmentAttribute /> : <PipelineAttribute />}
      </div>
    </div>
  );
}
