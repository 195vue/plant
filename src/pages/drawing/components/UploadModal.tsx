import { useState, useEffect } from "react";
import { Modal } from "@/components/common/Modal";
import { UploadBox, FormItem } from "@/components/common/UploadBox";
import { message } from "@/components/common/Message";

// 下拉选项
const majorOptions = [
  { label: "水工", value: "水工" },
  { label: "机械", value: "机械" },
  { label: "电气", value: "电气" },
  { label: "暖通", value: "暖通" },
  { label: "消防", value: "消防" },
  { label: "其他", value: "其他" },
];
const positionOptions = [
  { label: "坝后厂房", value: "坝后厂房" },
  { label: "大坝", value: "大坝" },
  { label: "厂区", value: "厂区" },
];
const categoryOptions = [
  { label: "竣工图", value: "竣工图" },
  { label: "设计图", value: "设计图" },
  { label: "施工图", value: "施工图" },
  { label: "变更图", value: "变更图" },
  { label: "其他", value: "其他" },
];

interface UploadModalProps {
  open: boolean;
  defaultCode: string;
  modelOptions: UploadModelOption[];
  onClose: () => void;
  onSubmit: (form: UploadFormValues) => void;
}

export interface UploadModelOption {
  value: string;
  label: string;
}

export interface UploadFormValues {
  code: string;
  name: string;
  major: string;
  category: string;
  position: string;
  linkedModelKey: string;
  file: File;
  remark: string;
}

// 上传资料弹窗
export default function UploadModal({
  open,
  defaultCode,
  modelOptions,
  onClose,
  onSubmit,
}: UploadModalProps) {
  const [form, setForm] = useState<Partial<UploadFormValues>>({});

  // 弹窗打开时初始化默认编号
  useEffect(() => {
    if (open) {
      setForm({ code: defaultCode });
    }
  }, [open, defaultCode]);

  const set = <K extends keyof UploadFormValues>(
    name: K,
    value: UploadFormValues[K] | undefined
  ) => setForm((current) => ({ ...current, [name]: value }));

  // 提交校验
  const handleSubmit = () => {
    if (!form.code?.trim()) {
      message.warning("请填写资料编号");
      return;
    }
    if (!form.name?.trim()) {
      message.warning("请填写资料名称");
      return;
    }
    if (!form.major || !form.category || !form.position) {
      message.warning("请完善必填项");
      return;
    }
    if (!form.file) {
      message.warning("请选择资料文件");
      return;
    }
    onSubmit({
      code: form.code,
      name: form.name,
      major: form.major,
      category: form.category,
      position: form.position,
      linkedModelKey: form.linkedModelKey || "",
      file: form.file,
      remark: form.remark || "",
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="上传资料"
      width={600}
      footer={
        <>
          <button className="btn-default" onClick={onClose}>
            取消
          </button>
          <button className="btn-primary" onClick={handleSubmit}>
            确认上传
          </button>
        </>
      }
    >
      <FormItem label="资料编号" required>
        <input
          className="input-base"
          value={form.code || ""}
          onChange={(e) => set("code", e.target.value)}
          placeholder="自动生成，可修改"
        />
      </FormItem>
      <FormItem label="资料名称" required>
        <input
          className="input-base"
          value={form.name || ""}
          onChange={(e) => set("name", e.target.value)}
          placeholder="请输入资料名称"
        />
      </FormItem>
      <FormItem label="所属专业" required>
        <select className="input-base" value={form.major || ""} onChange={(e) => set("major", e.target.value)}>
          <option value="">请选择</option>
          {majorOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </FormItem>
      <FormItem label="资料分类" required>
        <select className="input-base" value={form.category || ""} onChange={(e) => set("category", e.target.value)}>
          <option value="">请选择</option>
          {categoryOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </FormItem>
      <FormItem label="所属位置" required>
        <select className="input-base" value={form.position || ""} onChange={(e) => set("position", e.target.value)}>
          <option value="">请选择</option>
          {positionOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </FormItem>
      <FormItem label="关联模型" hint="可选，上传后可继续维护挂接关系">
        <select
          className="input-base"
          value={form.linkedModelKey || ""}
          onChange={(e) => set("linkedModelKey", e.target.value)}
        >
          <option value="">暂不挂接</option>
          {modelOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FormItem>
      <FormItem label="资料文件" required>
        <UploadBox
          accept=".pdf,.dwg"
          maxSize={50}
          hint="支持PDF/DWG格式，单文件≤50MB"
          onFileChange={(file) => set("file", file || undefined)}
        />
      </FormItem>
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
