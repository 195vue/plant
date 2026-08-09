import { useState } from "react";
import { Eye, FileText } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Modal } from "@/components/common/Modal";
import { message, ContextMenu } from "@/components/common/Message";
import PipelineTreeView, { type TreeNodeData } from "./components/PipelineTreeView";
import PipelineDetailPanel from "./components/PipelineDetailPanel";

export default function PipelineTree() {
  const [selectedNode, setSelectedNode] = useState<TreeNodeData | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    node: TreeNodeData;
  } | null>(null);
  // 属性查看弹窗
  const [attrOpen, setAttrOpen] = useState(false);
  // 关联资料弹窗
  const [docsOpen, setDocsOpen] = useState(false);

  const handleSelect = (node: TreeNodeData) => {
    setSelectedNode(node);
  };

  const handleContextMenu = (node: TreeNodeData, x: number, y: number) => {
    setContextMenu({ x, y, node });
  };

  // 右键菜单项
  const contextMenuItems = contextMenu
    ? [
        {
          label: "查看属性",
          icon: <Eye size={14} />,
          onClick: () => {
            setSelectedNode(contextMenu.node);
            setAttrOpen(true);
          },
        },
        {
          label: "查看关联资料",
          icon: <FileText size={14} />,
          onClick: () => {
            setSelectedNode(contextMenu.node);
            setDocsOpen(true);
          },
        },
      ]
    : [];

  // 属性弹窗内容
  const attrData = selectedNode?.data || {};
  const attrItems: { label: string; value: any }[] = selectedNode
    ? [
        { label: "编码", value: attrData.code },
        { label: "名称", value: attrData.name },
        { label: "类型", value: attrData.componentType || selectedNode.title },
        { label: "规格", value: attrData.dn || attrData.spec },
        { label: "材质", value: attrData.material },
        { label: "所属位置", value: attrData.position },
        { label: "所属系统", value: attrData.system },
        { label: "所属用途", value: attrData.usage },
        { label: "设计压力(MPa)", value: attrData.designPressure },
        { label: "设计温度(℃)", value: attrData.designTemperature },
        { label: "工作介质", value: attrData.medium },
        { label: "壁厚(mm)", value: attrData.wallThickness },
      ]
    : [];

  return (
    <div className="space-y-4">
      <PageHeader
        title="管路结构树"
        subtitle="按位置→系统→用途→管件四级结构浏览管路"
      />

      <div className="flex gap-4" style={{ height: "calc(100vh - 160px)" }}>
        {/* 左侧树形结构 */}
        <div className="w-[350px] flex-shrink-0 admin-card flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-admin-border">
            <h3 className="text-sm font-medium text-admin-text">结构树</h3>
          </div>
          <div className="flex-1 overflow-hidden">
            <PipelineTreeView
              selectedKey={selectedNode?.key || ""}
              onSelect={handleSelect}
              onContextMenu={handleContextMenu}
            />
          </div>
        </div>

        {/* 右侧详情面板 */}
        <div className="flex-1 admin-card overflow-hidden">
          <PipelineDetailPanel
            pipeline={selectedNode?.data || null}
            onClose={() => setSelectedNode(null)}
          />
        </div>
      </div>

      {/* 右键菜单 */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* 属性查看弹窗 */}
      <Modal
        open={attrOpen}
        onClose={() => setAttrOpen(false)}
        title="管件属性"
        width={560}
        footer={
          <button className="btn-default" onClick={() => setAttrOpen(false)}>
            关闭
          </button>
        }
      >
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          {attrItems.map((item) => (
            <div key={item.label} className="flex items-start gap-2">
              <span className="text-sm text-admin-muted whitespace-nowrap w-28 text-right">
                {item.label}：
              </span>
              <span className="text-sm text-admin-text flex-1 break-all">
                {item.value || <span className="text-admin-muted">-</span>}
              </span>
            </div>
          ))}
        </div>
      </Modal>

      {/* 关联资料弹窗 */}
      <Modal
        open={docsOpen}
        onClose={() => setDocsOpen(false)}
        title="关联资料"
        width={560}
        footer={
          <button className="btn-default" onClick={() => setDocsOpen(false)}>
            关闭
          </button>
        }
      >
        <div className="text-sm text-admin-muted text-center py-8">
          该管件暂无关联资料，可在资料管理模块上传关联资料。
        </div>
      </Modal>
    </div>
  );
}
