import { useState, useEffect } from "react";
import { Modal } from "@/components/common/Modal";
import { FormItem } from "@/components/common/UploadBox";
import { message } from "@/components/common/Message";
import type { Drawing } from "@/types";

interface ApprovalModalProps {
  open: boolean;
  drawing: Drawing | null;
  onClose: () => void;
  onSubmit: (opinion: string, result: "approved" | "rejected") => void;
}

// 审批弹窗
export default function ApprovalModal({ open, drawing, onClose, onSubmit }: ApprovalModalProps) {
  const [opinion, setOpinion] = useState("");
  const [result, setResult] = useState<"approved" | "rejected">("approved");

  // 弹窗打开时重置表单
  useEffect(() => {
    if (open) {
      setOpinion("");
      setResult("approved");
    }
  }, [open]);

  const handleSubmit = () => {
    if (!opinion.trim()) {
      message.warning("请填写审批意见");
      return;
    }
    onSubmit(opinion, result);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="图纸审批"
      width={560}
      footer={
        <>
          <button className="btn-default" onClick={onClose}>
            取消
          </button>
          <button className="btn-primary" onClick={handleSubmit}>
            提交审批
          </button>
        </>
      }
    >
      {drawing && (
        <div className="space-y-3">
          {/* 只读图纸信息 */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-3 bg-gray-50 rounded text-sm">
            <div>
              <span className="text-admin-muted">图纸编号：</span>
              <span className="text-admin-text">{drawing.code}</span>
            </div>
            <div>
              <span className="text-admin-muted">版本：</span>
              <span className="text-admin-text">{drawing.version}</span>
            </div>
            <div className="col-span-2">
              <span className="text-admin-muted">图纸名称：</span>
              <span className="text-admin-text">{drawing.name}</span>
            </div>
            <div>
              <span className="text-admin-muted">所属专业：</span>
              <span className="text-admin-text">{drawing.major}</span>
            </div>
            <div>
              <span className="text-admin-muted">所属位置：</span>
              <span className="text-admin-text">{drawing.position}</span>
            </div>
          </div>
          <FormItem label="审批意见" required>
            <textarea
              className="input-base"
              rows={4}
              value={opinion}
              onChange={(e) => setOpinion(e.target.value)}
              placeholder="请输入审批意见"
            />
          </FormItem>
          <FormItem label="审批结果" required>
            <div className="flex items-center gap-6 pt-1.5">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="approvalResult"
                  checked={result === "approved"}
                  onChange={() => setResult("approved")}
                />
                <span className="text-sm text-admin-text">通过</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="approvalResult"
                  checked={result === "rejected"}
                  onChange={() => setResult("rejected")}
                />
                <span className="text-sm text-admin-text">驳回</span>
              </label>
            </div>
          </FormItem>
        </div>
      )}
    </Modal>
  );
}
