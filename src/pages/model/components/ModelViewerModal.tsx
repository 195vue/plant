import { useEffect, useRef, useState } from "react";
import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { Tag } from "@/components/common/Tag";
import type { ModelObject } from "./ObjectSelector";
import equipmentBg from "@/assets/sb.png";
import pipelineBg from "@/assets/gd.png";

export interface ModelPreviewData {
  name: string;
  objects: ModelObject[];
  fileFormat: string;
  fileSize: string;
  version: string;
  uploadUser: string;
  uploadTime: string;
  statusLabel: string;
  publishTime?: string;
  remark?: string;
}

interface ModelViewerModalProps {
  model: ModelPreviewData | null;
  onClose: () => void;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const DEFAULT_VIEW = { x: -10, y: 18 };

export default function ModelViewerModal({
  model,
  onClose,
}: ModelViewerModalProps) {
  const [rotate, setRotate] = useState(DEFAULT_VIEW);
  const [zoom, setZoom] = useState(1);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
  } | null>(null);

  // 切换模型时复位视角
  useEffect(() => {
    if (model) {
      setRotate(DEFAULT_VIEW);
      setZoom(1);
    }
  }, [model]);

  const previewImage =
    model && model.objects[0]?.type === "equipment" ? equipmentBg : pipelineBg;

  const handlePointerDown = (event: React.PointerEvent) => {
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      baseX: rotate.x,
      baseY: rotate.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    setRotate({
      x: clamp(drag.baseX - dy * 0.35, -35, 35),
      y: clamp(drag.baseY + dx * 0.35, -40, 40),
    });
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  const infoRows: Array<{ label: string; value: string }> = model
    ? [
        { label: "文件格式", value: model.fileFormat },
        { label: "文件大小", value: model.fileSize },
        { label: "版本号", value: model.version },
        { label: "上传人", value: model.uploadUser },
        { label: "上传时间", value: model.uploadTime },
        { label: "发布时间", value: model.publishTime || "—" },
        { label: "备注", value: model.remark || "—" },
      ]
    : [];

  return (
    <Modal
      open={!!model}
      onClose={onClose}
      title={model ? `模型预览 - ${model.name}` : "模型预览"}
      width="1040px"
      footer={
        <>
          <span className="mr-auto text-[11px] text-admin-muted">
            当前为原型演示视图，正式系统接入三维模型预览服务（FBX / glTF / 3DTiles）在线加载。
          </span>
          <button onClick={onClose} className="btn-primary text-xs">
            关闭
          </button>
        </>
      }
    >
      {model && (
        <div className="flex h-[470px] gap-3">
          {/* 左侧：模型视图 */}
          <div
            className="relative min-w-0 flex-1 cursor-grab overflow-hidden rounded border border-admin-border active:cursor-grabbing"
            style={{
              backgroundColor: "#0d1522",
              backgroundImage:
                "linear-gradient(rgba(64,169,255,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(64,169,255,0.10) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <div className="flex h-full items-center justify-center">
              <img
                src={previewImage}
                alt={model.name}
                draggable={false}
                className="max-h-[86%] max-w-[86%] select-none object-contain transition-transform duration-75"
                style={{
                  transform: `perspective(1100px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale(${zoom})`,
                  filter: "drop-shadow(0 18px 32px rgba(0,0,0,0.55))",
                }}
              />
            </div>

            {/* 左上角格式标识 */}
            <div className="absolute left-3 top-3 flex items-center gap-1.5">
              <Tag color="purple">{model.fileFormat}</Tag>
              <Tag color="gray">{model.version}</Tag>
            </div>

            {/* 底部工具条 */}
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded border border-[#40A9FF]/30 bg-black/60 px-2 py-1.5 backdrop-blur">
              <button
                type="button"
                title="复位视角"
                className="flex h-6 w-6 items-center justify-center text-[#40A9FF] hover:text-white"
                onClick={() => {
                  setRotate(DEFAULT_VIEW);
                  setZoom(1);
                }}
              >
                <RotateCcw size={14} />
              </button>
              <button
                type="button"
                title="放大"
                className="flex h-6 w-6 items-center justify-center text-[#40A9FF] hover:text-white"
                onClick={() => setZoom((value) => clamp(value + 0.15, 0.5, 2.5))}
              >
                <ZoomIn size={14} />
              </button>
              <button
                type="button"
                title="缩小"
                className="flex h-6 w-6 items-center justify-center text-[#40A9FF] hover:text-white"
                onClick={() => setZoom((value) => clamp(value - 0.15, 0.5, 2.5))}
              >
                <ZoomOut size={14} />
              </button>
              <span className="ml-1 text-[10px] text-[#8a94a6]">
                拖拽调整视角
              </span>
            </div>
          </div>

          {/* 右侧：模型信息 */}
          <div className="flex w-[300px] flex-shrink-0 flex-col overflow-auto rounded border border-admin-border">
            <div className="border-b border-admin-border px-3 py-2.5">
              <div className="text-sm font-medium text-admin-text">
                {model.name}
              </div>
              <div className="mt-1.5 flex items-center gap-1.5">
                <Tag
                  color={
                    model.statusLabel === "已发布"
                      ? "green"
                      : model.statusLabel === "处理中"
                        ? "blue"
                        : "yellow"
                  }
                >
                  {model.statusLabel}
                </Tag>
                <span className="text-[11px] text-admin-muted">
                  共 {model.objects.length} 个关联对象
                </span>
              </div>
            </div>

            <div className="space-y-1.5 border-b border-admin-border px-3 py-2.5">
              {infoRows.map((row) => (
                <div key={row.label} className="flex items-start gap-2 text-xs">
                  <span className="w-16 flex-shrink-0 text-admin-muted">
                    {row.label}
                  </span>
                  <span className="min-w-0 flex-1 break-words text-admin-text">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex-1 px-3 py-2.5">
              <div className="mb-2 text-xs font-medium text-admin-text">
                关联对象
              </div>
              <div className="space-y-1">
                {model.objects.map((object) => (
                  <div
                    key={object.key}
                    className="rounded border border-admin-border bg-gray-50 px-2 py-1.5"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] font-medium text-admin-text">
                        {object.kks || "—"}
                      </span>
                      <Tag color={object.type === "equipment" ? "blue" : "cyan"}>
                        {object.type === "equipment" ? "设备" : "管路"}
                      </Tag>
                    </div>
                    <div className="mt-0.5 truncate text-[11px] text-admin-text">
                      {object.name}
                    </div>
                    <div className="mt-0.5 text-[10px] text-admin-muted">
                      {object.path}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
