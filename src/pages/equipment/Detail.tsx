import { useParams, useNavigate } from "react-router-dom";
import { Download, Eye, FileText } from "lucide-react";
import { equipments, documents } from "@/mock";
import { BackButton, Card } from "@/components/common/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Tag } from "@/components/common/Tag";
import { message } from "@/components/common/Message";
import type { DocumentItem } from "@/types";

// 属性展示行
interface AttrRow {
  name: string;
  value: string;
  unit?: string;
}

export default function EquipmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const equipment = equipments.find((e) => e.id === Number(id));

  // 设备不存在时的兜底展示
  if (!equipment) {
    return (
      <div className="space-y-4">
        <BackButton text="返回设备列表" onClick={() => navigate("/admin/equipment")} />
        <Card title="设备详情">
          <div className="text-center py-12 text-admin-muted">
            设备不存在或已被删除
          </div>
        </Card>
      </div>
    );
  }

  // 基本信息字段（两列布局）
  const basicInfo: { label: string; value: React.ReactNode }[] = [
    { label: "设备编码", value: equipment.code },
    { label: "设备名称", value: equipment.name },
    { label: "设备类型", value: equipment.type },
    { label: "所属系统", value: equipment.system },
    { label: "所属专业", value: equipment.major },
    { label: "安装位置", value: equipment.location },
    { label: "型号", value: equipment.model || "-" },
    { label: "厂家", value: equipment.manufacturer || "-" },
    { label: "投运日期", value: equipment.commissionDate || "-" },
    { label: "备注", value: equipment.remark || "-" },
  ];

  // 属性信息：直接使用设备已生成的属性列表
  const attrRows: AttrRow[] = (equipment.attributes || []).map((a) => ({
    name: a.name,
    value: a.value || "",
    unit: a.unit,
  }));

  // 关联资料：linkedType 为 equipment 且 linkedId 匹配
  const relatedDocs = documents.filter(
    (d) => d.linkedType === "equipment" && d.linkedId === equipment.id
  );

  // 资料列表列定义
  const docColumns: Column<DocumentItem>[] = [
    { key: "name", title: "资料名称", width: 260, render: (r) => r.name },
    { key: "category", title: "分类", width: 120, render: (r) => r.category },
    {
      key: "fileType",
      title: "文件类型",
      width: 90,
      render: (r) => <Tag color="purple">{r.fileType}</Tag>,
    },
    { key: "fileSize", title: "文件大小", width: 100, render: (r) => r.fileSize },
    { key: "uploadTime", title: "上传日期", width: 160, render: (r) => r.uploadTime },
    {
      key: "action",
      title: "操作",
      width: 140,
      render: (r) => (
        <div className="flex items-center gap-2">
          <button
            className="btn-link flex items-center gap-0.5"
            onClick={() => message.info(`预览资料：${r.name}`)}
          >
            <Eye size={13} />
            预览
          </button>
          <button
            className="btn-link flex items-center gap-0.5"
            onClick={() => message.success(`开始下载：${r.name}`)}
          >
            <Download size={13} />
            下载
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <BackButton text="返回设备列表" onClick={() => navigate("/admin/equipment")} />

      {/* 基本信息卡片 */}
      <Card title="基本信息">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          {basicInfo.map((item) => (
            <div key={item.label} className="flex items-start gap-2">
              <span className="text-sm text-admin-muted whitespace-nowrap w-20 text-right">
                {item.label}：
              </span>
              <span className="text-sm text-admin-text flex-1 break-all">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* 属性信息卡片 */}
      <Card title={`属性信息（${equipment.type}）`}>
        {attrRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-admin-muted">
            <FileText size={40} className="text-gray-300 mb-2" />
            <span className="text-sm">该设备类型暂无属性模板</span>
          </div>
        ) : (
          <div className="border border-admin-border rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2.5 text-left font-medium text-admin-muted border-b border-admin-border w-1/2">
                    属性名
                  </th>
                  <th className="px-3 py-2.5 text-left font-medium text-admin-muted border-b border-admin-border">
                    属性值
                  </th>
                </tr>
              </thead>
              <tbody>
                {attrRows.map((row, idx) => (
                  <tr
                    key={row.name}
                    className={idx % 2 === 1 ? "bg-gray-50/50" : ""}
                  >
                    <td className="px-3 py-2.5 text-admin-text border-b border-admin-border">
                      {row.name}
                      {row.unit && (
                        <span className="text-admin-muted ml-1">
                          ({row.unit})
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-admin-text border-b border-admin-border">
                      {row.value || (
                        <span className="text-admin-muted">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 关联资料卡片 */}
      <Card title={`关联资料（${relatedDocs.length}）`}>
        <DataTable
          columns={docColumns}
          data={relatedDocs}
          pageSize={10}
          showPagination={false}
          emptyText="暂无关联资料"
        />
      </Card>
    </div>
  );
}
