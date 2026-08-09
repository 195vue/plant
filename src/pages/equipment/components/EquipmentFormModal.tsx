import { useState, useEffect } from "react";
import { Modal } from "@/components/common/Modal";
import { FormItem } from "@/components/common/UploadBox";
import { message } from "@/components/common/Message";
import {
  equipmentTypes,
  majors,
  systems,
  positions,
  codes,
} from "@/mock";

interface EquipmentFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (form: Record<string, any>) => void;
}

// 新增设备弹窗：选择未挂接编码、填写设备基础信息
export default function EquipmentFormModal({
  open,
  onClose,
  onSubmit,
}: EquipmentFormModalProps) {
  const [form, setForm] = useState<Record<string, any>>({});

  // 弹窗打开时重置表单
  useEffect(() => {
    if (open) setForm({});
  }, [open]);

  const set = (name: string, value: any) => setForm({ ...form, [name]: value });

  // 未挂接的设备编码列表
  const unlinkedCodes = codes.filter(
    (c) => !c.isLinked && c.type === "equipment"
  );

  // 提交校验
  const handleSubmit = () => {
    if (!form.code) return message.warning("请选择设备编码");
    if (!form.name?.trim()) return message.warning("请填写设备名称");
    if (!form.type) return message.warning("请选择设备类型");
    if (!form.system || !form.major || !form.location)
      return message.warning("请完善必填项");
    onSubmit(form);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="新增设备"
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
        <FormItem label="选择编码" required>
          <select
            className="input-base"
            value={form.code || ""}
            onChange={(e) => set("code", e.target.value)}
          >
            <option value="">请选择未挂接编码</option>
            {unlinkedCodes.map((c) => (
              <option key={c.id} value={c.code}>
                {c.code}（{c.name}）
              </option>
            ))}
          </select>
        </FormItem>
        <FormItem label="设备名称" required>
          <input
            className="input-base"
            value={form.name || ""}
            onChange={(e) => set("name", e.target.value)}
            placeholder="请输入设备名称"
          />
        </FormItem>
        <FormItem label="设备类型" required>
          <select
            className="input-base"
            value={form.type || ""}
            onChange={(e) => set("type", e.target.value)}
          >
            <option value="">请选择</option>
            {equipmentTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </FormItem>
        <FormItem label="所属系统" required>
          <select
            className="input-base"
            value={form.system || ""}
            onChange={(e) => set("system", e.target.value)}
          >
            <option value="">请选择</option>
            {systems.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </FormItem>
        <FormItem label="运行状态" required>
          <select
            className="input-base"
            value={form.status || ""}
            onChange={(e) => set("status", e.target.value)}
          >
            <option value="">请选择</option>
            <option value="running">运行中</option>
            <option value="stopped">已停机</option>
            <option value="maintenance">检修中</option>
            <option value="fault">故障</option>
          </select>
        </FormItem>
        <FormItem label="所属专业" required>
          <select
            className="input-base"
            value={form.major || ""}
            onChange={(e) => set("major", e.target.value)}
          >
            <option value="">请选择</option>
            {majors.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </FormItem>
        <FormItem label="安装位置" required>
          <select
            className="input-base"
            value={form.location || ""}
            onChange={(e) => set("location", e.target.value)}
          >
            <option value="">请选择</option>
            {positions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </FormItem>
        <FormItem label="型号">
          <input
            className="input-base"
            value={form.model || ""}
            onChange={(e) => set("model", e.target.value)}
            placeholder="请输入型号"
          />
        </FormItem>
        <FormItem label="厂家">
          <input
            className="input-base"
            value={form.manufacturer || ""}
            onChange={(e) => set("manufacturer", e.target.value)}
            placeholder="请输入厂家"
          />
        </FormItem>
        <FormItem label="投运日期">
          <input
            type="date"
            className="input-base"
            value={form.commissionDate || ""}
            onChange={(e) => set("commissionDate", e.target.value)}
          />
        </FormItem>
      </div>
      <FormItem label="备注">
        <textarea
          className="input-base"
          rows={3}
          value={form.remark || ""}
          onChange={(e) => set("remark", e.target.value)}
          placeholder="请输入备注信息"
        />
      </FormItem>
    </Modal>
  );
}
