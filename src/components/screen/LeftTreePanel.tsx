import { useState } from "react";
import { PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import { TreePanel, type TreeNodeData } from "@/components/common/TreePanel";
import { ContextMenu } from "@/components/common/Message";
import { overviewTreeData, equipmentTreeData, pipelineTreeData, panoramaTreeData, overallStats } from "@/mock/screen";

interface LeftTreePanelProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  viewMode: "overview" | "interior";
  focusMode: "panorama" | "equipment" | "pipeline";
  selectedKey?: string;
  onSelect: (node: TreeNodeData) => void;
}

export function LeftTreePanel({
  collapsed,
  onToggleCollapse,
  viewMode,
  focusMode,
  selectedKey,
  onSelect,
}: LeftTreePanelProps) {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    node: TreeNodeData;
  } | null>(null);

  // 获取树数据 - 根据 viewMode 和 focusMode
  const getTreeData = () => {
    if (viewMode === "overview") {
      // 宏观视图显示概览树
      return overviewTreeData;
    }
    // 微观视图根据焦点模式显示
    switch (focusMode) {
      case "equipment":
        return equipmentTreeData;
      case "pipeline":
        return pipelineTreeData;
      case "panorama":
      default:
        // 全景模式下显示融合结构树（设备+管路+厂房结构）
        return panoramaTreeData;
    }
  };

  const getSearchPlaceholder = () => {
    if (viewMode === "overview") {
      return "输入设备/管路名称搜索";
    }
    switch (focusMode) {
      case "equipment":
        return "输入设备名称搜索";
      case "pipeline":
        return "输入管路名称搜索";
      default:
        return "输入设备/管路名称搜索";
    }
  };

  const getStatsText = () => {
    if (viewMode === "overview") {
      return `共${overallStats.equipmentTotal}个设备，${overallStats.componentTotal}个管件`;
    }
    switch (focusMode) {
      case "equipment":
        return `共${overallStats.equipmentTotal}个设备`;
      case "pipeline":
        return `共${overallStats.pipelineTotal}条管路，${overallStats.componentTotal}个管件`;
      default:
        return `共${overallStats.equipmentTotal}个设备，${overallStats.componentTotal}个管件`;
    }
  };

  if (collapsed) {
    return (
      <div className="w-10 bg-screen-panel border-r border-[#40A9FF]/25 flex flex-col items-center py-2">
        <button
          onClick={onToggleCollapse}
          className="text-screen-muted hover:text-white p-1"
        >
          <PanelLeftOpen size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="w-[280px] bg-screen-panel border-r border-[#40A9FF]/25 flex flex-col">
      {/* 标题 */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#40A9FF]/25">
        <span className="text-sm font-medium text-white">
          {viewMode === "overview" 
            ? "工程结构导航" 
            : focusMode === "equipment" 
              ? "设备结构导航" 
              : focusMode === "pipeline" 
                ? "管路结构导航" 
                : "厂房结构导航"}
        </span>
        <button
          onClick={onToggleCollapse}
          className="text-screen-muted hover:text-white"
        >
          <PanelLeftClose size={18} />
        </button>
      </div>

      {/* 搜索框 + 树 */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <TreePanel
          data={getTreeData()}
          selectedKey={selectedKey}
          onSelect={onSelect}
          searchPlaceholder={getSearchPlaceholder()}
          showCount
          onContextMenu={(e, node) => {
            setContextMenu({ x: e.clientX, y: e.clientY, node });
          }}
        />
      </div>

      {/* 底部统计 */}
      <div className="px-3 py-2 border-t border-[#40A9FF]/25 text-xs text-screen-muted">
        {getStatsText()}
      </div>

      {/* 右键菜单 */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={[
            {
              label: "查看属性",
              onClick: () => onSelect(contextMenu.node),
            },
            {
              label: "查看关联资料",
              onClick: () => {
                onSelect({ ...contextMenu.node, data: { tab: "documents" } });
              },
            },
            {
              label: "定位到模型",
              onClick: () => {
                onSelect(contextMenu.node);
              },
            },
          ]}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
