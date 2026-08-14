import { useMemo, useState } from "react";
import { Download, Eye } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchForm, type SearchField } from "@/components/common/SearchForm";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Modal } from "@/components/common/Modal";
import { Tag } from "@/components/common/Tag";
import { useSystemStore, type OperationAuditLog } from "@/store/system";
import { exportCsv } from "@/lib/exportCsv";

const searchFields: SearchField[] = [
  { name: "operator", label: "操作人", type: "input", placeholder: "请输入操作人" },
  { name: "module", label: "操作模块", type: "input", placeholder: "请输入操作模块" },
  { name: "action", label: "操作名", type: "input", placeholder: "请输入操作名" },
  { name: "content", label: "操作内容", type: "input", placeholder: "请输入操作内容", advanced: true },
  { name: "operatedAt", label: "操作时间", type: "dateRange", advanced: true },
  { name: "businessNo", label: "业务编号", type: "input", placeholder: "请输入业务编号", advanced: true },
];

const detailFields: Array<{ label: string; key: keyof OperationAuditLog }> = [
  { label: "日志主键", key: "id" },
  { label: "操作人编号", key: "operatorId" },
  { label: "操作人名字", key: "operator" },
  { label: "操作人IP", key: "ip" },
  { label: "操作人UA", key: "userAgent" },
  { label: "操作模块", key: "module" },
  { label: "操作名", key: "action" },
  { label: "操作内容", key: "content" },
  { label: "请求URL", key: "requestUrl" },
  { label: "操作时间", key: "operatedAt" },
  { label: "业务编号", key: "businessNo" },
];

export default function OperationLogManage() {
  const operationLogs = useSystemStore((state) => state.operationLogs);
  const [searchValues, setSearchValues] = useState<Record<string, string>>({});
  const [appliedSearch, setAppliedSearch] = useState<Record<string, string>>({});
  const [detail, setDetail] = useState<OperationAuditLog | null>(null);

  const filteredData = useMemo(
    () =>
      operationLogs.filter((item) => {
        if (appliedSearch.operator && !item.operator.includes(appliedSearch.operator)) return false;
        if (appliedSearch.module && !item.module.includes(appliedSearch.module)) return false;
        if (appliedSearch.action && !item.action.includes(appliedSearch.action)) return false;
        if (appliedSearch.content && !item.content.includes(appliedSearch.content)) return false;
        if (appliedSearch.businessNo && !item.businessNo.includes(appliedSearch.businessNo)) return false;
        if (
          appliedSearch.operatedAt_start &&
          item.operatedAt.slice(0, 10) < appliedSearch.operatedAt_start
        ) {
          return false;
        }
        if (
          appliedSearch.operatedAt_end &&
          item.operatedAt.slice(0, 10) > appliedSearch.operatedAt_end
        ) {
          return false;
        }
        return true;
      }),
    [appliedSearch, operationLogs]
  );

  const columns: Column<OperationAuditLog>[] = [
    { key: "id", title: "日志编号", width: 110 },
    { key: "operator", title: "操作人", width: 120 },
    {
      key: "module",
      title: "操作模块",
      width: 130,
      render: (record) => <Tag color="blue">{record.module}</Tag>,
    },
    { key: "action", title: "操作名", width: 130 },
    {
      key: "content",
      title: "操作内容",
      width: 320,
      render: (record) => (
        <span className="block max-w-[300px] truncate" title={record.content}>
          {record.content}
        </span>
      ),
    },
    { key: "operatedAt", title: "操作时间", width: 180 },
    { key: "businessNo", title: "业务编号", width: 190 },
    { key: "ip", title: "操作IP", width: 140 },
    {
      key: "actions",
      title: "操作",
      width: 100,
      render: (record) => (
        <button
          className="btn-link flex items-center gap-1"
          onClick={() => setDetail(record)}
        >
          <Eye size={13} />
          详情
        </button>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col gap-3">
      <PageHeader
        title="操作日志"
        subtitle="查询平台用户在各业务模块中的操作记录"
      />
      <SearchForm
        fields={searchFields}
        values={searchValues}
        onChange={(name, value) =>
          setSearchValues((current) => ({ ...current, [name]: value }))
        }
        onSearch={() => setAppliedSearch(searchValues)}
        onReset={() => {
          setSearchValues({});
          setAppliedSearch({});
        }}
      />
      <div className="admin-card flex-1 min-h-0 p-3 flex flex-col">
        <div className="mb-3 flex items-center gap-2">
          <button
            className="btn-default flex items-center gap-1"
            onClick={() =>
              exportCsv(
                "操作日志.csv",
                ["日志编号", "操作人", "操作模块", "操作名", "操作内容", "操作时间", "业务编号", "操作IP"],
                filteredData.map((item) => [
                  item.id,
                  item.operator,
                  item.module,
                  item.action,
                  item.content,
                  item.operatedAt,
                  item.businessNo,
                  item.ip,
                ])
              )
            }
          >
            <Download size={14} />
            导出
          </button>
          <span className="ml-auto text-xs text-admin-muted">
            共 {filteredData.length} 条操作记录
          </span>
        </div>
        <div className="flex-1 min-h-0">
          <DataTable
            columns={columns}
            data={filteredData}
            emptyText="暂无符合条件的操作日志"
          />
        </div>
      </div>

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="操作日志详情"
        width={720}
        footer={
          <button className="btn-primary" onClick={() => setDetail(null)}>
            关闭
          </button>
        }
      >
        <div className="overflow-hidden rounded border border-admin-border">
          {detailFields.map((field, index) => (
            <div
              key={field.key}
              className={`grid grid-cols-[130px_1fr] ${
                index < detailFields.length - 1 ? "border-b border-admin-border" : ""
              }`}
            >
              <div className="bg-gray-50 px-4 py-3 text-sm text-admin-muted">
                {field.label}
              </div>
              <div className="break-all px-4 py-3 text-sm text-admin-text">
                {String(detail?.[field.key] ?? "-")}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
