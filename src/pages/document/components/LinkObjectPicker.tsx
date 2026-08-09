import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { equipments, pipelines } from "@/mock";
import { message } from "@/components/common/Message";

interface LinkObjectPickerProps {
  open: boolean;
  type?: string; // "equipment" | "pipeline"
  onClose: () => void;
  onSelect: (item: { id: number; code: string; name: string }) => void;
}

// 关联对象选择器：根据类型弹出设备或管路列表，单选
export default function LinkObjectPicker({
  open,
  type,
  onClose,
  onSelect,
}: LinkObjectPickerProps) {
  const [keyword, setKeyword] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // 弹窗打开时重置
  useEffect(() => {
    if (open) {
      setKeyword("");
      setSelectedId(null);
    }
  }, [open]);

  const isEquipment = type === "equipment";
  const list = isEquipment ? equipments : type === "pipeline" ? pipelines : [];
  const filtered = list.filter(
    (x) =>
      !keyword ||
      x.name.includes(keyword) ||
      x.code.toLowerCase().includes(keyword.toLowerCase())
  );

  const handleConfirm = () => {
    if (selectedId === null) {
      message.warning("请选择一个关联对象");
      return;
    }
    const item = list.find((x) => x.id === selectedId);
    if (item) {
      onSelect({ id: item.id, code: item.code, name: item.name });
    }
  };

  const title = isEquipment ? "选择设备" : type === "pipeline" ? "选择管路" : "选择关联对象";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width={700}
      footer={
        <>
          <button className="btn-default" onClick={onClose}>
            取消
          </button>
          <button className="btn-primary" onClick={handleConfirm}>
            确定
          </button>
        </>
      }
    >
      {/* 搜索框 */}
      <div className="flex items-center gap-2 mb-3">
        <input
          className="input-base"
          placeholder="请输入编码或名称搜索"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") setKeyword(e.currentTarget.value);
          }}
        />
        <button className="btn-primary whitespace-nowrap flex items-center gap-1">
          <Search size={14} />
          搜索
        </button>
      </div>

      {/* 列表 */}
      <div
        className="border border-admin-border rounded overflow-auto"
        style={{ maxHeight: "360px" }}
      >
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="w-10 px-2 py-2 text-center border-b border-admin-border"></th>
              <th className="px-3 py-2 text-left font-medium text-admin-muted border-b border-admin-border w-28">
                编码
              </th>
              <th className="px-3 py-2 text-left font-medium text-admin-muted border-b border-admin-border">
                名称
              </th>
              {isEquipment ? (
                <>
                  <th className="px-3 py-2 text-left font-medium text-admin-muted border-b border-admin-border w-28">
                    类型
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-admin-muted border-b border-admin-border w-28">
                    系统
                  </th>
                </>
              ) : (
                <>
                  <th className="px-3 py-2 text-left font-medium text-admin-muted border-b border-admin-border w-28">
                    系统
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-admin-muted border-b border-admin-border w-24">
                    用途
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-admin-muted">
                  暂无数据
                </td>
              </tr>
            ) : (
              filtered.map((item: any) => (
                <tr
                  key={item.id}
                  className={`border-b border-admin-border hover:bg-blue-50 cursor-pointer ${
                    selectedId === item.id ? "bg-blue-50" : ""
                  }`}
                  onClick={() => setSelectedId(item.id)}
                >
                  <td className="w-10 px-2 py-2 text-center">
                    <input
                      type="radio"
                      checked={selectedId === item.id}
                      onChange={() => setSelectedId(item.id)}
                      className="cursor-pointer"
                    />
                  </td>
                  <td className="px-3 py-2 font-mono text-admin-text">{item.code}</td>
                  <td className="px-3 py-2 text-admin-text">{item.name}</td>
                  {isEquipment ? (
                    <>
                      <td className="px-3 py-2 text-admin-text">{item.type}</td>
                      <td className="px-3 py-2 text-admin-text">{item.system}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2 text-admin-text">{item.system}</td>
                      <td className="px-3 py-2 text-admin-text">{item.usage}</td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-admin-muted mt-2">共 {filtered.length} 条，单选</p>
    </Modal>
  );
}
