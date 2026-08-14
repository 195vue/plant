import { useMemo, useState } from "react";
import { Download, Eye } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchForm, type SearchField } from "@/components/common/SearchForm";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Modal } from "@/components/common/Modal";
import { StatusTag, Tag } from "@/components/common/Tag";
import { useSystemStore, type LoginAuditLog } from "@/store/system";
import { exportCsv } from "@/lib/exportCsv";

const searchFields: SearchField[] = [
  { name: "username", label: "用户名称", type: "input", placeholder: "请输入用户名称" },
  { name: "address", label: "登录地址", type: "input", placeholder: "请输入登录地址" },
  { name: "loginAt", label: "登录日期", type: "dateRange" },
];

const detailFields: Array<{ label: string; key: keyof LoginAuditLog }> = [
  { label: "日志编号", key: "id" },
  { label: "操作类型", key: "operationType" },
  { label: "用户名称", key: "username" },
  { label: "登录地址", key: "address" },
  { label: "浏览器", key: "browser" },
  { label: "登录结果", key: "result" },
  { label: "登录日期", key: "loginAt" },
];

export default function LoginLogManage() {
  const loginLogs = useSystemStore((state) => state.loginLogs);
  const [searchValues, setSearchValues] = useState<Record<string, string>>({});
  const [appliedSearch, setAppliedSearch] = useState<Record<string, string>>({});
  const [detail, setDetail] = useState<LoginAuditLog | null>(null);

  const filteredData = useMemo(
    () =>
      loginLogs.filter((item) => {
        if (appliedSearch.username && !item.username.includes(appliedSearch.username)) return false;
        if (appliedSearch.address && !item.address.includes(appliedSearch.address)) return false;
        if (
          appliedSearch.loginAt_start &&
          item.loginAt.slice(0, 10) < appliedSearch.loginAt_start
        ) {
          return false;
        }
        if (
          appliedSearch.loginAt_end &&
          item.loginAt.slice(0, 10) > appliedSearch.loginAt_end
        ) {
          return false;
        }
        return true;
      }),
    [appliedSearch, loginLogs]
  );

  const columns: Column<LoginAuditLog>[] = [
    { key: "id", title: "日志编号", width: 110 },
    {
      key: "operationType",
      title: "操作类型",
      width: 110,
      render: (record) => (
        <Tag color={record.operationType === "登录" ? "blue" : "gray"}>
          {record.operationType}
        </Tag>
      ),
    },
    { key: "username", title: "用户名称", width: 140 },
    { key: "address", title: "登录地址", width: 260 },
    { key: "browser", title: "浏览器", width: 160 },
    {
      key: "result",
      title: "登录结果",
      width: 110,
      render: (record) => <StatusTag status={record.result} />,
    },
    { key: "loginAt", title: "登录日期", width: 180 },
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
        title="登录日志"
        subtitle="查询平台用户登录与退出记录"
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
                "登录日志.csv",
                ["日志编号", "操作类型", "用户名称", "登录地址", "浏览器", "登录结果", "登录日期"],
                filteredData.map((item) => [
                  item.id,
                  item.operationType,
                  item.username,
                  item.address,
                  item.browser,
                  item.result === "success" ? "成功" : "失败",
                  item.loginAt,
                ])
              )
            }
          >
            <Download size={14} />
            导出
          </button>
          <span className="ml-auto text-xs text-admin-muted">
            共 {filteredData.length} 条登录记录
          </span>
        </div>
        <div className="flex-1 min-h-0">
          <DataTable
            columns={columns}
            data={filteredData}
            emptyText="暂无符合条件的登录日志"
          />
        </div>
      </div>

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="登录日志详情"
        width={620}
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
              className={`grid grid-cols-[120px_1fr] ${
                index < detailFields.length - 1 ? "border-b border-admin-border" : ""
              }`}
            >
              <div className="bg-gray-50 px-4 py-3 text-sm text-admin-muted">
                {field.label}
              </div>
              <div className="break-all px-4 py-3 text-sm text-admin-text">
                {field.key === "result" ? (
                  <StatusTag status={detail?.result || ""} />
                ) : (
                  String(detail?.[field.key] ?? "-")
                )}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
