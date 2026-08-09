import { useState, useEffect } from "react";
import { Modal } from "@/components/common/Modal";
import { FormItem } from "@/components/common/UploadBox";
import { message } from "@/components/common/Message";
import { positions, systems } from "@/mock";
import type { Pipeline } from "@/types";

interface PipelineEditModalProps {
  open: boolean;
  pipeline: Pipeline | null;
  onClose: () => void;
  onSubmit: (form: Record<string, any>) => void;
}

const usageOptions = ["主管路", "分支管路", "设备连接管"];
const materialOptions = ["碳钢", "不锈钢", "镀锌钢管", "PE", "PVC", "其他"];

// 管路编辑弹窗
export default function PipelineEditModal({
  open,
  pipeline,
  onClose,
  onSubmit,
}: PipelineEditModalProps) {
  const [form, setForm] = useState<Record<string, any>>({});

  // 弹窗打开时初始化表单
  useEffect(() => {
    if (open && pipeline) {
      setForm({ ...pipeline });
    }
  }, [open, pipeline]);

  const set = (name: string, value: any) => setForm({ ...form, [name]: value });

  // 提交校验
  const handleSubmit = () => {
    if (!form.name?.trim()) return message.warning("请填写管路名称");
    if (!form.dn?.trim()) return message.warning("请填写规格(DN)");
    if (!form.material) return message.warning("请选择材质");
    onSubmit(form);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="编辑管路"
      width={640}
      footer={
        <>
          <button className="btn-default" onClick={onClose}>
            取消
          </button>
          <button className="btn-primary" onClick={handleSubmit}>
            确定
          </button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-x-6">
        <FormItem label="管路编码">
          <input className="input-base" value={form.code || ""} readOnly />
        </FormItem>
        <FormItem label="管路名称" required>
          <input
            className="input-base"
            value={form.name || ""}
            onChange={(e) => set("name", e.target.value)}
            placeholder="请输入管路名称"
          />
        </FormItem>
        <FormItem label="所属位置">
          <select
            className="input-base"
            value={form.position || ""}
            onChange={(e) => set("position", e.target.value)}
          >
            {positions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </FormItem>
        <FormItem label="所属系统">
          <select
            className="input-base"
            value={form.system || ""}
            onChange={(e) => set("system", e.target.value)}
          >
            {systems.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </FormItem>
        <FormItem label="管路用途">
          <select
            className="input-base"
            value={form.usage || ""}
            onChange={(e) => set("usage", e.target.value)}
          >
            {usageOptions.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </FormItem>
        <FormItem label="规格(DN)" required>
          <input
            className="input-base"
            value={form.dn || ""}
            onChange={(e) => set("dn", e.target.value)}
            placeholder="如 DN300"
          />
        </FormItem>
        <FormItem label="材质">
          <select
            className="input-base"
            value={form.material || ""}
            onChange={(e) => set("material", e.target.value)}
          >
            {materialOptions.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </FormItem>
        <FormItem label="长度(m)">
          <input
            type="number"
            className="input-base"
            value={form.length ?? ""}
            onChange={(e) => set("length", Number(e.target.value))}
            placeholder="请输入长度"
          />
        </FormItem>
      </div>
    </Modal>
  );
}
