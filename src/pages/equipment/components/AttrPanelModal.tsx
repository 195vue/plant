import { Modal } from "@/components/common/Modal";
import { Box } from "lucide-react";

export interface AttrItem {
  name: string;
  value: string;
  unit?: string;
}

interface AttrPanelModalProps {
  open: boolean;
  title: string;
  code?: string;
  attrs: AttrItem[];
  onClose: () => void;
}

// 属性面板弹窗：只读显示某节点的全部属性
export default function AttrPanelModal({
  open,
  title,
  code,
  attrs,
  onClose,
}: AttrPanelModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="属性面板"
      width={640}
      footer={
        <button className="btn-default" onClick={onClose}>
          关闭
        </button>
      }
    >
      {/* 设备标题 */}
      <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <Box size={20} className="text-admin-primary" />
        <div>
          <div className="text-sm font-medium text-admin-text">{title}</div>
          {code && (
            <div className="text-xs text-admin-muted font-mono">{code}</div>
          )}
        </div>
      </div>

      {/* 属性列表（只读） */}
      <div className="border border-admin-border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2.5 text-left font-medium text-admin-muted border-b border-admin-border w-40">
                属性名
              </th>
              <th className="px-3 py-2.5 text-left font-medium text-admin-muted border-b border-admin-border">
                属性值
              </th>
            </tr>
          </thead>
          <tbody>
            {attrs.length === 0 ? (
              <tr>
                <td
                  colSpan={2}
                  className="text-center py-8 text-admin-muted"
                >
                  暂无属性数据
                </td>
              </tr>
            ) : (
              attrs.map((a, i) => (
                <tr key={i} className={i % 2 === 1 ? "bg-gray-50/50" : ""}>
                  <td className="px-3 py-2.5 text-admin-text border-b border-admin-border">
                    {a.name}
                    {a.unit && (
                      <span className="text-admin-muted ml-1">({a.unit})</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-admin-text border-b border-admin-border">
                    {a.value || (
                      <span className="text-admin-muted">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
