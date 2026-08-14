import { useMemo, useState } from "react";
import { Download, RotateCcw, Search } from "lucide-react";
import { exportCsv } from "@/lib/exportCsv";
import { useSystemStore, type OperationAuditLog } from "@/store/system";
import {
  ActionButton,
  CompactTable,
  LinkButton,
  ModalButton,
  QueryField,
  QueryPanel,
  SystemModal,
  SystemPage,
  compactInputClass,
  type CompactColumn,
} from "./components/SystemAdmin";
import { DevNote } from "@/components/devNotes/DevNote";

const emptySearch = {
  operator: "",
  module: "",
  action: "",
  content: "",
  businessNo: "",
  operatedAtStart: "",
  operatedAtEnd: "",
};

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

export default function OperationLogReplica() {
  const operationLogs = useSystemStore((state) => state.operationLogs);
  const [searchValues, setSearchValues] = useState(emptySearch);
  const [appliedSearch, setAppliedSearch] = useState(emptySearch);
  const [detail, setDetail] = useState<OperationAuditLog | null>(null);

  const filteredData = useMemo(
    () =>
      operationLogs.filter((item) => {
        if (appliedSearch.operator && !item.operator.includes(appliedSearch.operator)) {
          return false;
        }
        if (appliedSearch.module && !item.module.includes(appliedSearch.module)) {
          return false;
        }
        if (appliedSearch.action && !item.action.includes(appliedSearch.action)) {
          return false;
        }
        if (appliedSearch.content && !item.content.includes(appliedSearch.content)) {
          return false;
        }
        if (appliedSearch.businessNo && !item.businessNo.includes(appliedSearch.businessNo)) {
          return false;
        }
        const operatedDate = item.operatedAt.slice(0, 10);
        if (appliedSearch.operatedAtStart && operatedDate < appliedSearch.operatedAtStart) {
          return false;
        }
        if (appliedSearch.operatedAtEnd && operatedDate > appliedSearch.operatedAtEnd) {
          return false;
        }
        return true;
      }),
    [appliedSearch, operationLogs]
  );

  const columns: CompactColumn<OperationAuditLog>[] = [
    { key: "id", title: "日志编号", width: 100 },
    { key: "operator", title: "操作人", width: 105 },
    {
      key: "module",
      title: "操作模块",
      width: 120,
      render: (record) => (
        <span className="inline-flex rounded-sm bg-blue-50 px-2 py-0.5 text-[11px] text-blue-500">
          {record.module}
        </span>
      ),
    },
    { key: "action", title: "操作名", width: 115 },
    {
      key: "content",
      title: "操作内容",
      width: 280,
      render: (record) => (
        <span className="block max-w-[260px] truncate" title={record.content}>
          {record.content}
        </span>
      ),
    },
    { key: "operatedAt", title: "操作时间", width: 165 },
    { key: "businessNo", title: "业务编号", width: 170 },
    { key: "ip", title: "操作IP", width: 130 },
    {
      key: "actions",
      title: "操作",
      width: 70,
      render: (record) => (
        <LinkButton onClick={() => setDetail(record)}>详情</LinkButton>
      ),
    },
  ];

  return (
    <SystemPage>
      <DevNote
        id="oplog-query"
        title="操作日志-查询与导出区"
        summary="按操作人/模块/操作名/内容/业务编号/时间查询操作日志"
        items={[
          { label: "查询条件", value: "操作人/操作模块/操作名/操作内容/业务编号（包含匹配）、操作时间起止" },
          { label: "交互逻辑", value: "搜索 → 应用条件筛选；重置 → 清空；导出 → CSV（日志编号/操作人/模块/操作名/内容/时间/业务编号/IP）" },
          { label: "权限", value: "管理员/操作人员可查看导出；浏览人员无后台入口" },
          { label: "后续步骤", value: "正式系统：日志由服务端审计模块采集，支持按时间归档" },
        ]}
        wrapClassName="block flex-shrink-0"
      >
      <QueryPanel
        fields={
          <>
            <QueryField label="操作人">
              <input
                className={`${compactInputClass} w-40`}
                placeholder="请输入操作人"
                value={searchValues.operator}
                onChange={(event) =>
                  setSearchValues((current) => ({
                    ...current,
                    operator: event.target.value,
                  }))
                }
              />
            </QueryField>
            <QueryField label="操作模块">
              <input
                className={`${compactInputClass} w-40`}
                placeholder="请输入操作模块"
                value={searchValues.module}
                onChange={(event) =>
                  setSearchValues((current) => ({
                    ...current,
                    module: event.target.value,
                  }))
                }
              />
            </QueryField>
            <QueryField label="操作名">
              <input
                className={`${compactInputClass} w-40`}
                placeholder="请输入操作名"
                value={searchValues.action}
                onChange={(event) =>
                  setSearchValues((current) => ({
                    ...current,
                    action: event.target.value,
                  }))
                }
              />
            </QueryField>
            <QueryField label="操作内容">
              <input
                className={`${compactInputClass} w-48`}
                placeholder="请输入操作内容"
                value={searchValues.content}
                onChange={(event) =>
                  setSearchValues((current) => ({
                    ...current,
                    content: event.target.value,
                  }))
                }
              />
            </QueryField>
            <QueryField label="业务编号">
              <input
                className={`${compactInputClass} w-44`}
                placeholder="请输入业务编号"
                value={searchValues.businessNo}
                onChange={(event) =>
                  setSearchValues((current) => ({
                    ...current,
                    businessNo: event.target.value,
                  }))
                }
              />
            </QueryField>
            <QueryField label="操作时间">
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  className={`${compactInputClass} w-32`}
                  value={searchValues.operatedAtStart}
                  onChange={(event) =>
                    setSearchValues((current) => ({
                      ...current,
                      operatedAtStart: event.target.value,
                    }))
                  }
                />
                <span className="text-slate-300">-</span>
                <input
                  type="date"
                  className={`${compactInputClass} w-32`}
                  value={searchValues.operatedAtEnd}
                  onChange={(event) =>
                    setSearchValues((current) => ({
                      ...current,
                      operatedAtEnd: event.target.value,
                    }))
                  }
                />
              </div>
            </QueryField>
          </>
        }
        actions={
          <>
            <ActionButton
              icon={<Search size={13} />}
              onClick={() => setAppliedSearch({ ...searchValues })}
            >
              搜索
            </ActionButton>
            <ActionButton
              icon={<RotateCcw size={13} />}
              onClick={() => {
                setSearchValues(emptySearch);
                setAppliedSearch(emptySearch);
              }}
            >
              重置
            </ActionButton>
            <ActionButton
              tone="success"
              icon={<Download size={13} />}
              onClick={() =>
                exportCsv(
                  "操作日志.csv",
                  [
                    "日志编号",
                    "操作人",
                    "操作模块",
                    "操作名",
                    "操作内容",
                    "操作时间",
                    "业务编号",
                    "操作IP",
                  ],
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
              导出
            </ActionButton>
          </>
        }
      />
      </DevNote>

      <DevNote
        id="oplog-table"
        title="操作日志-列表"
        summary="展示审计日志，行内查看详情"
        items={[
          { label: "列定义", value: "日志编号/操作人/操作模块/操作名/操作内容（截断）/操作时间/业务编号/操作IP/操作（详情）" },
          { label: "交互逻辑", value: "行内“详情”→ 弹窗展示完整操作内容与请求信息（只读）" },
          { label: "数据来源", value: "operationLogs（useSystemStore mock）" },
          { label: "权限", value: "管理员/操作人员可查看" },
        ]}
        wrapClassName="block flex flex-1"
      >
      <CompactTable
        columns={columns}
        data={filteredData}
        minWidth={1270}
        emptyText="暂无符合条件的操作日志"
      />
      </DevNote>

      <SystemModal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="操作日志详情"
        width={680}
        footer={<ModalButton primary onClick={() => setDetail(null)}>关闭</ModalButton>}
      >
        <div className="overflow-hidden rounded-sm border border-slate-200">
          {detailFields.map((field, index) => (
            <div
              key={field.key}
              className={`grid min-h-10 grid-cols-[120px_1fr] ${
                index < detailFields.length - 1 ? "border-b border-slate-100" : ""
              }`}
            >
              <div className="flex items-center bg-slate-50 px-4 text-slate-500">
                {field.label}
              </div>
              <div className="flex items-center break-all px-4 py-2 text-slate-600">
                {String(detail?.[field.key] ?? "-")}
              </div>
            </div>
          ))}
        </div>
      </SystemModal>
    </SystemPage>
  );
}
