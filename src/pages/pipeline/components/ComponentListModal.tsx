import { useMemo } from "react";
import { Modal } from "@/components/common/Modal";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Tag } from "@/components/common/Tag";
import { valves } from "@/mock";
import type { Pipeline } from "@/types";

// 管件行（管道段/阀门/弯头等）
interface ComponentRow {
  id: string;
  code: string;
  name: string;
  type: string;
  spec: string;
  material: string;
  quantity: number | string;
}

interface ComponentListModalProps {
  open: boolean;
  pipeline: Pipeline | null;
  onClose: () => void;
}

// 管件列表弹窗：根据管路生成关联管件
export default function ComponentListModal({
  open,
  pipeline,
  onClose,
}: ComponentListModalProps) {
  // 构建管件列表：管道段 + 关联阀门 + 弯头
  const components = useMemo<ComponentRow[]>(() => {
    if (!pipeline) return [];
    const list: ComponentRow[] = [
      {
        id: `pipe-${pipeline.id}`,
        code: pipeline.code,
        name: pipeline.name,
        type: "管道段",
        spec: pipeline.dn || "-",
        material: pipeline.material || "-",
        quantity: `${pipeline.length || 0} m`,
      },
    ];
    // 关联同系统阀门
    const relValves = valves.filter(
      (v) => v.system === pipeline.system
    );
    relValves.forEach((v) => {
      list.push({
        id: `valve-${v.id}`,
        code: v.code,
        name: v.name,
        type: v.type,
        spec: `DN${v.dn}`,
        material: v.material || "-",
        quantity: "1 个",
      });
    });
    // 弯头
    list.push({
      id: `elbow-${pipeline.id}`,
      code: `EL-${String(pipeline.id).padStart(3, "0")}`,
      name: `${pipeline.name}-弯头`,
      type: "弯头",
      spec: pipeline.dn || "-",
      material: pipeline.material || "-",
      quantity: `${Math.ceil((pipeline.length || 0) / 20)} 个`,
    });
    return list;
  }, [pipeline]);

  const columns: Column<ComponentRow>[] = [
    { key: "code", title: "管件编码", width: 120, render: (r) => r.code },
    { key: "name", title: "管件名称", width: 200, render: (r) => r.name },
    {
      key: "type",
      title: "管件类型",
      width: 100,
      render: (r) => {
        const color =
          r.type === "管道段"
            ? "blue"
            : r.type === "阀门"
            ? "purple"
            : "orange";
        return <Tag color={color as any}>{r.type}</Tag>;
      },
    },
    { key: "spec", title: "规格", width: 100, render: (r) => r.spec },
    { key: "material", title: "材质", width: 100, render: (r) => r.material },
    { key: "quantity", title: "数量", width: 100, render: (r) => r.quantity },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`管件列表${pipeline ? ` - ${pipeline.name}` : ""}`}
      width={780}
      footer={
        <button className="btn-default" onClick={onClose}>
          关闭
        </button>
      }
    >
      <DataTable
        columns={columns}
        data={components}
        pageSize={10}
        showPagination={false}
        emptyText="暂无管件数据"
      />
    </Modal>
  );
}
