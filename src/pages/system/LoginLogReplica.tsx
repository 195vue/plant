import { useMemo, useState } from "react";
import { Download, RotateCcw, Search } from "lucide-react";
import { exportCsv } from "@/lib/exportCsv";
import { useSystemStore, type LoginAuditLog } from "@/store/system";
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
  username: "",
  address: "",
  result: "",
  loginAtStart: "",
  loginAtEnd: "",
};

const detailFields: Array<{ label: string; key: keyof LoginAuditLog }> = [
  { label: "日志编号", key: "id" },
  { label: "操作类型", key: "operationType" },
  { label: "用户名称", key: "username" },
  { label: "登录地址", key: "address" },
  { label: "浏览器", key: "browser" },
  { label: "登录结果", key: "result" },
  { label: "登录日期", key: "loginAt" },
];

export default function LoginLogReplica() {
  const loginLogs = useSystemStore((state) => state.loginLogs);
  const [searchValues, setSearchValues] = useState(emptySearch);
  const [appliedSearch, setAppliedSearch] = useState(emptySearch);
  const [detail, setDetail] = useState<LoginAuditLog | null>(null);

  const filteredData = useMemo(
    () =>
      loginLogs.filter((item) => {
        if (appliedSearch.username && !item.username.includes(appliedSearch.username)) {
          return false;
        }
        if (appliedSearch.address && !item.address.includes(appliedSearch.address)) {
          return false;
        }
        if (appliedSearch.result && item.result !== appliedSearch.result) return false;
        const loginDate = item.loginAt.slice(0, 10);
        if (appliedSearch.loginAtStart && loginDate < appliedSearch.loginAtStart) {
          return false;
        }
        if (appliedSearch.loginAtEnd && loginDate > appliedSearch.loginAtEnd) {
          return false;
        }
        return true;
      }),
    [appliedSearch, loginLogs]
  );

  const columns: CompactColumn<LoginAuditLog>[] = [
    { key: "id", title: "日志编号", width: 105 },
    {
      key: "operationType",
      title: "操作类型",
      width: 100,
      render: (record) => (
        <span
          className={`inline-flex rounded-sm px-2 py-0.5 text-[11px] ${
            record.operationType === "登录"
              ? "bg-blue-50 text-blue-500"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {record.operationType}
        </span>
      ),
    },
    { key: "username", title: "用户名称", width: 130 },
    { key: "address", title: "登录地址", width: 260 },
    { key: "browser", title: "浏览器", width: 160 },
    {
      key: "result",
      title: "登录结果",
      width: 100,
      render: (record) => (
        <span
          className={`inline-flex rounded-sm px-2 py-0.5 text-[11px] ${
            record.result === "success"
              ? "bg-green-50 text-green-600"
              : "bg-red-50 text-red-500"
          }`}
        >
          {record.result === "success" ? "成功" : "失败"}
        </span>
      ),
    },
    { key: "loginAt", title: "登录日期", width: 170 },
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
        id="loginlog-query"
        title="登录日志-查询与导出区"
        summary="按用户名/登录地址/结果/日期查询登录日志"
        items={[
          { label: "查询条件", value: "用户名称/登录地址（包含匹配）、登录结果（成功/失败）、登录日期起止" },
          { label: "交互逻辑", value: "搜索 → 应用条件筛选；重置 → 清空；导出 → CSV（日志编号/操作类型/用户名/地址/浏览器/结果/日期）" },
          { label: "权限", value: "管理员/操作人员可查看；浏览人员无后台入口" },
          { label: "后续步骤", value: "正式系统：登录审计由统一认证服务记录" },
        ]}
        wrapClassName="block flex-shrink-0"
      >
      <QueryPanel
        fields={
          <>
            <QueryField label="用户名称">
              <input
                className={`${compactInputClass} w-44`}
                placeholder="请输入用户名称"
                value={searchValues.username}
                onChange={(event) =>
                  setSearchValues((current) => ({
                    ...current,
                    username: event.target.value,
                  }))
                }
              />
            </QueryField>
            <QueryField label="登录地址">
              <input
                className={`${compactInputClass} w-48`}
                placeholder="请输入登录地址"
                value={searchValues.address}
                onChange={(event) =>
                  setSearchValues((current) => ({
                    ...current,
                    address: event.target.value,
                  }))
                }
              />
            </QueryField>
            <QueryField label="登录结果">
              <select
                className={`${compactInputClass} w-32`}
                value={searchValues.result}
                onChange={(event) =>
                  setSearchValues((current) => ({
                    ...current,
                    result: event.target.value,
                  }))
                }
              >
                <option value="">请选择结果</option>
                <option value="success">成功</option>
                <option value="failed">失败</option>
              </select>
            </QueryField>
            <QueryField label="登录日期">
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  className={`${compactInputClass} w-32`}
                  value={searchValues.loginAtStart}
                  onChange={(event) =>
                    setSearchValues((current) => ({
                      ...current,
                      loginAtStart: event.target.value,
                    }))
                  }
                />
                <span className="text-slate-300">-</span>
                <input
                  type="date"
                  className={`${compactInputClass} w-32`}
                  value={searchValues.loginAtEnd}
                  onChange={(event) =>
                    setSearchValues((current) => ({
                      ...current,
                      loginAtEnd: event.target.value,
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
                  "登录日志.csv",
                  [
                    "日志编号",
                    "操作类型",
                    "用户名称",
                    "登录地址",
                    "浏览器",
                    "登录结果",
                    "登录日期",
                  ],
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
              导出
            </ActionButton>
          </>
        }
      />
      </DevNote>

      <DevNote
        id="loginlog-table"
        title="登录日志-列表"
        summary="展示登录审计记录，行内查看详情"
        items={[
          { label: "列定义", value: "日志编号/操作类型（登录/退出Tag）/用户名称/登录地址/浏览器/登录结果（成功/失败Tag）/登录日期/操作（详情）" },
          { label: "交互逻辑", value: "行内“详情”→ 弹窗只读展示日志编号/操作类型/用户名/地址/浏览器/结果/日期" },
          { label: "数据来源", value: "loginLogs（useSystemStore mock）" },
          { label: "权限", value: "管理员/操作人员可查看" },
        ]}
        wrapClassName="block flex flex-1"
      >
      <CompactTable
        columns={columns}
        data={filteredData}
        minWidth={1100}
        emptyText="暂无符合条件的登录日志"
      />
      </DevNote>

      <SystemModal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="登录日志详情"
        width={600}
        footer={<ModalButton primary onClick={() => setDetail(null)}>关闭</ModalButton>}
      >
        <div className="overflow-hidden rounded-sm border border-slate-200">
          {detailFields.map((field, index) => (
            <div
              key={field.key}
              className={`grid min-h-10 grid-cols-[110px_1fr] ${
                index < detailFields.length - 1 ? "border-b border-slate-100" : ""
              }`}
            >
              <div className="flex items-center bg-slate-50 px-4 text-slate-500">
                {field.label}
              </div>
              <div className="flex items-center break-all px-4 py-2 text-slate-600">
                {field.key === "result"
                  ? detail?.result === "success"
                    ? "成功"
                    : "失败"
                  : String(detail?.[field.key] ?? "-")}
              </div>
            </div>
          ))}
        </div>
      </SystemModal>
    </SystemPage>
  );
}
