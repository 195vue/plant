import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle } from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { UploadBox, FormItem } from "@/components/common/UploadBox";
import { message } from "@/components/common/Message";
import type { DocumentItem } from "@/types";
import { categoryOptions, getLinkedCode } from "../List";
import LinkObjectPicker from "./LinkObjectPicker";

// 关联对象类型选项（支持设备/管路/阀门/管件）
const linkedTypeOptions = [
  { label: "设备", value: "equipment" },
  { label: "管路", value: "pipeline" },
  { label: "阀门", value: "valve" },
  { label: "管件", value: "component" },
];

// 密级
const secretLevelOptions = [
  { label: "公开", value: "public" },
  { label: "内部", value: "internal" },
  { label: "秘密", value: "secret" },
  { label: "机密", value: "classified" },
  { label: "绝密", value: "topsecret" },
];

// 保管期限
const retentionOptions = [
  { label: "永久", value: "permanent" },
  { label: "长期(30年)", value: "long" },
  { label: "30年", value: "short30" },
  { label: "10年", value: "short10" },
  { label: "5年", value: "short5" },
];

// 载体类型
const carrierOptions = [
  { label: "电子", value: "electronic" },
  { label: "纸质", value: "paper" },
  { label: "纸质+电子", value: "both" },
];

// 立卷单位
const filingUnitOptions = [
  "机电检修部",
  "水工运维部",
  "设备管理部",
  "安全质量部",
  "工程技术部",
  "档案室",
];

interface DocumentFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (form: Record<string, any>) => void;
  editData?: DocumentItem | null;
}

// 上传/编辑资料弹窗（编辑模式额外支持替换文件与取消关联）
export default function DocumentFormModal({
  open,
  onClose,
  onSubmit,
  editData,
}: DocumentFormModalProps) {
  const isEdit = !!editData;
  const [form, setForm] = useState<Record<string, any>>({});
  const [pickerOpen, setPickerOpen] = useState(false);

  // 弹窗打开时初始化表单
  useEffect(() => {
    if (open) {
      if (editData) {
        setForm({
          name: editData.name,
          category: editData.category,
          linkedType: editData.linkedType,
          linkedId: editData.linkedId,
          linkedName: editData.linkedName,
          linkedCode: getLinkedCode(editData),
          remark: editData.remark,
          fileType: editData.fileType,
          fileSize: editData.fileSize,
          archiveNo: editData.archiveNo,
          secretLevel: editData.secretLevel,
          retention: editData.retention,
          carrier: editData.carrier,
          filingUnit: editData.filingUnit,
          filingUser: editData.filingUser,
        });
      } else {
        setForm({
          secretLevel: "internal",
          retention: "short10",
          carrier: "electronic",
        });
      }
    }
  }, [open, editData]);

  const set = (name: string, value: any) => setForm({ ...form, [name]: value });

  // 切换关联对象类型时清空已选
  const handleTypeChange = (value: string) => {
    setForm({
      ...form,
      linkedType: value,
      linkedId: undefined,
      linkedName: undefined,
      linkedCode: "",
    });
  };

  // 打开关联对象选择器
  const openPicker = () => {
    if (!form.linkedType) {
      message.warning("请先选择关联对象类型");
      return;
    }
    setPickerOpen(true);
  };

  // 选择关联对象回调
  const handlePick = (item: { id: number; code: string; name: string }) => {
    setForm({
      ...form,
      linkedId: item.id,
      linkedName: item.name,
      linkedCode: item.code,
    });
    setPickerOpen(false);
  };

  // 取消关联
  const handleUnlink = () => {
    setForm({
      ...form,
      linkedId: undefined,
      linkedName: undefined,
      linkedCode: "",
    });
    message.info("已取消关联");
  };

  // 提交校验（一份资料只能挂接一个关联对象）
  const handleSubmit = () => {
    if (!form.name?.trim()) return message.warning("请填写资料名称");
    if (!form.category) return message.warning("请选择资料分类");
    if (!form.linkedType) return message.warning("请选择关联对象类型");
    if (!form.linkedId) return message.warning("请选择关联对象");
    if (!isEdit && !form.fileType) return message.warning("请上传资料文件");
    if (!form.secretLevel) return message.warning("请选择密级");
    if (!form.retention) return message.warning("请选择保管期限");
    if (!form.carrier) return message.warning("请选择载体类型");
    onSubmit(form);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "编辑资料" : "上传资料"}
      width={600}
      footer={
        <>
          <button className="btn-default" onClick={onClose}>
            取消
          </button>
          <button className="btn-primary" onClick={handleSubmit}>
            {isEdit ? "保存" : "提交"}
          </button>
        </>
      }
    >
      <FormItem label="资料名称" required>
        <input
          className="input-base"
          value={form.name || ""}
          onChange={(e) => set("name", e.target.value)}
          placeholder="请输入资料名称"
        />
      </FormItem>

      <FormItem label="资料分类" required>
        <select
          className="input-base"
          value={form.category || ""}
          onChange={(e) => set("category", e.target.value)}
        >
          <option value="">请选择</option>
          {categoryOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {!isEdit && form.category && ["设计图纸", "竣工图纸"].includes(form.category) && (
          <p className="text-xs text-orange-500 mt-1 flex items-center gap-1">
            <AlertCircle size={11} />
            该分类资料上传后需经管理员审批通过后方可查看
          </p>
        )}
        {!isEdit && form.category && !["设计图纸", "竣工图纸"].includes(form.category) && (
          <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
            <CheckCircle size={11} />
            该分类资料上传后直接生效，无需审批
          </p>
        )}
      </FormItem>

      <FormItem label="关联对象类型" required>
        <select
          className="input-base"
          value={form.linkedType || ""}
          onChange={(e) => handleTypeChange(e.target.value)}
          disabled={isEdit}
        >
          <option value="">请选择</option>
          {linkedTypeOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </FormItem>

      <FormItem label="关联对象" required>
        <div className="flex items-center gap-2">
          <input
            className="input-base cursor-pointer"
            value={form.linkedCode ? `${form.linkedCode} - ${form.linkedName}` : ""}
            placeholder="请选择关联对象"
            readOnly
            onClick={openPicker}
          />
          {!form.linkedCode ? (
            <button
              type="button"
              className="btn-default whitespace-nowrap"
              onClick={openPicker}
            >
              选择
            </button>
          ) : (
            <button
              type="button"
              className="btn-danger whitespace-nowrap"
              onClick={handleUnlink}
            >
              取消关联
            </button>
          )}
        </div>
      </FormItem>

      <FormItem label="资料文件" required={!isEdit}>
        <UploadBox
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png,.mp4"
          maxSize={100}
          hint="支持PDF/DOC/DOCX/XLS/XLSX/JPG/PNG/MP4，单文件≤100MB"
          onFileChange={(file) => {
            if (file) {
              const ext = file.name.split(".").pop()?.toUpperCase() || "PDF";
              const sizeMB = (file.size / (1024 * 1024)).toFixed(1) + "MB";
              setForm({ ...form, fileType: ext, fileSize: sizeMB });
            }
          }}
        />
        {isEdit && (
          <p className="text-xs text-admin-muted mt-1">
            如需替换文件，请上传新文件；不上传则保留原文件（{form.fileType} / {form.fileSize}）
          </p>
        )}
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

      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        <FormItem label="档号" hint={!isEdit ? "可不填，提交后按规则自动生成" : "已归档资料请谨慎修改档号"}>
          <input
            className="input-base"
            value={form.archiveNo || ""}
            onChange={(e) => set("archiveNo", e.target.value)}
            placeholder="例：ZLDP-SB-2026-06-01"
          />
        </FormItem>

        <FormItem label="密级" required>
          <select className="input-base" value={form.secretLevel || ""} onChange={(e) => set("secretLevel", e.target.value)}>
            <option value="">请选择</option>
            {secretLevelOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </FormItem>

        <FormItem label="保管期限" required>
          <select className="input-base" value={form.retention || ""} onChange={(e) => set("retention", e.target.value)}>
            <option value="">请选择</option>
            {retentionOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </FormItem>

        <FormItem label="载体类型" required>
          <select className="input-base" value={form.carrier || ""} onChange={(e) => set("carrier", e.target.value)}>
            <option value="">请选择</option>
            {carrierOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </FormItem>

        <FormItem label="立卷单位">
          <select className="input-base" value={form.filingUnit || ""} onChange={(e) => set("filingUnit", e.target.value)}>
            <option value="">请选择</option>
            {filingUnitOptions.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </FormItem>

        <FormItem label="立卷人">
          <input
            className="input-base"
            value={form.filingUser || ""}
            onChange={(e) => set("filingUser", e.target.value)}
            placeholder="默认为当前登录用户"
          />
        </FormItem>
      </div>

      {/* 关联对象选择器 */}
      <LinkObjectPicker
        open={pickerOpen}
        type={form.linkedType}
        onClose={() => setPickerOpen(false)}
        onSelect={handlePick}
      />
    </Modal>
  );
}
