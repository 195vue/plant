import { useState, useMemo } from "react";
import { Plus, Download, Trash2, Edit, Eye } from "lucide-react";
import { documents as mockDocuments, equipments, pipelines } from "@/mock";
import type { DocumentItem } from "@/types";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchForm, type SearchField } from "@/components/common/SearchForm";
import { DataTable, type Column } from "@/components/common/DataTable";
import { ConfirmModal } from "@/components/common/Modal";
import { Tag } from "@/components/common/Tag";
import { message } from "@/components/common/Message";
import DocumentFormModal from "./components/DocumentFormModal";
import DocumentPreviewModal from "./components/DocumentPreviewModal";

// 资料分类选项
export const categoryOptions = [
  { label: "设备说明书", value: "设备说明书" },
  { label: "检修记录", value: "检修记录" },
  { label: "验收报告", value: "验收报告" },
  { label: "操作手册", value: "操作手册" },
  { label: "照片影像", value: "照片影像" },
  { label: "其他", value: "其他" },
];

// 分类标签颜色映射
export const categoryColorMap: Record<
  string,
  "blue" | "orange" | "green" | "purple" | "yellow" | "gray"
> = {
  设备说明书: "blue",
  检修记录: "orange",
  验收报告: "green",
  操作手册: "purple",
  照片影像: "yellow",
  其他: "gray",
};

// 文件格式标签颜色映射
export const formatColorMap: Record<
  string,
  "red" | "blue" | "green" | "purple" | "orange" | "gray"
> = {
  PDF: "red",
  DOC: "blue",
  DOCX: "blue",
  XLS: "green",
  XLSX: "green",
  JPG: "purple",
  PNG: "purple",
  MP4: "orange",
};

// 关联对象类型选项
const linkedTypeOptions = [
  { label: "设备", value: "equipment" },
  { label: "管件", value: "pipeline" },
];

// 搜索字段配置
const searchFields: SearchField[] = [
  { name: "name", label: "资料名称", type: "input", placeholder: "请输入资料名称" },
  { name: "category", label: "资料分类", type: "select", options: categoryOptions },
  { name: "linkedType", label: "关联对象类型", type: "select", options: linkedTypeOptions },
  { name: "linkedCode", label: "关联对象编码", type: "input", placeholder: "请输入关联对象编码" },
  { name: "uploadTime", label: "上传时间", type: "dateRange" },
];

// 根据资料关联对象类型+ID查找对应编码
export const getLinkedCode = (doc: DocumentItem): string => {
  if (!doc.linkedId || !doc.linkedType) return "";
  const list = doc.linkedType === "equipment" ? equipments : pipelines;
  return list.find((x) => x.id === doc.linkedId)?.code || "";
};

export default function DocumentList() {
  const [data, setData] = useState<DocumentItem[]>(mockDocuments);
  const [searchValues, setSearchValues] = useState<Record<string, any>>({});
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  // 弹窗状态
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [current, setCurrent] = useState<DocumentItem | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // 前端搜索过滤
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (searchValues.name && !item.name.includes(searchValues.name)) return false;
      if (searchValues.category && item.category !== searchValues.category) return false;
      if (searchValues.linkedType && item.linkedType !== searchValues.linkedType) return false;
      if (searchValues.linkedCode) {
        const code = getLinkedCode(item);
        if (!code || !code.toLowerCase().includes(searchValues.linkedCode.toLowerCase()))
          return false;
      }
      if (searchValues.uploadTime_start && item.uploadTime < searchValues.uploadTime_start)
        return false;
      if (
        searchValues.uploadTime_end &&
        item.uploadTime > searchValues.uploadTime_end + " 23:59:59"
      )
        return false;
      return true;
    });
  }, [data, searchValues]);

  // 链接按钮
  const linkBtn = (
    icon: React.ReactNode,
    label: string,
    onClick: () => void,
    danger = false
  ) => (
    <button
      className={`${danger ? "btn-link-danger" : "btn-link"} flex items-center gap-0.5`}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );

  // 表格列定义（勾选框 + 9列 = 10列）
  const columns: Column<DocumentItem>[] = [
    { key: "index", title: "序号", width: 60, render: (_, i) => i + 1 },
    { key: "name", title: "资料名称", width: 220, render: (r) => r.name },
    {
      key: "category",
      title: "资料分类",
      width: 100,
      render: (r) => <Tag color={categoryColorMap[r.category] || "gray"}>{r.category}</Tag>,
    },
    {
      key: "fileType",
      title: "文件格式",
      width: 80,
      render: (r) => <Tag color={formatColorMap[r.fileType] || "gray"}>{r.fileType}</Tag>,
    },
    { key: "fileSize", title: "文件大小", width: 90, render: (r) => r.fileSize },
    {
      key: "linked",
      title: "关联对象",
      width: 200,
      render: (r) => {
        if (!r.linkedId || !r.linkedName) {
          return <span className="text-admin-muted">未关联</span>;
        }
        const code = getLinkedCode(r);
        return (
          <span className="text-admin-text">
            {code ? `${code} - ${r.linkedName}` : r.linkedName}
          </span>
        );
      },
    },
    { key: "uploadUser", title: "上传人", width: 100, render: (r) => r.uploadUser },
    { key: "uploadTime", title: "上传时间", width: 160, render: (r) => r.uploadTime },
    {
      key: "action",
      title: "操作",
      width: 260,
      render: (r) => (
        <div className="flex items-center gap-2">
          {linkBtn(<Eye size={13} />, "预览", () => {
            setCurrent(r);
            setPreviewOpen(true);
          })}
          {linkBtn(<Download size={13} />, "下载", () =>
            message.success(`开始下载：${r.name}`)
          )}
          {linkBtn(<Edit size={13} />, "编辑", () => {
            setCurrent(r);
            setEditOpen(true);
          })}
          {linkBtn(
            <Trash2 size={13} />,
            "删除",
            () => {
              setDeleteId(r.id);
              setDeleteOpen(true);
            },
            true
          )}
        </div>
      ),
    },
  ];

  // 批量下载
  const handleBatchDownload = () => {
    if (selectedKeys.length === 0) {
      message.warning("请先选择要下载的资料");
      return;
    }
    message.success(`已开始下载 ${selectedKeys.length} 个资料`);
  };

  // 批量删除
  const handleBatchDelete = () => {
    if (selectedKeys.length === 0) {
      message.warning("请先选择要删除的资料");
      return;
    }
    setDeleteId(-1);
    setDeleteOpen(true);
  };

  // 确认删除（单个或批量）
  const confirmDelete = () => {
    if (deleteId === -1) {
      setData(data.filter((item) => !selectedKeys.includes(String(item.id))));
      setSelectedKeys([]);
    } else if (deleteId !== null) {
      setData(data.filter((item) => item.id !== deleteId));
    }
    setDeleteOpen(false);
    message.success("删除成功");
  };

  // 提交上传，保存后即时生效。
  const submitUpload = (form: Record<string, any>) => {
    const newId = Math.max(...data.map((d) => d.id), 0) + 1;
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const uploadTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate()
    )} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const newDoc: DocumentItem = {
      id: newId,
      name: form.name,
      category: form.category,
      fileType: form.fileType || "PDF",
      fileSize: form.fileSize || "2.5MB",
      linkedType: form.linkedType,
      linkedId: form.linkedId,
      linkedName: form.linkedName,
      uploadUser: "系统管理员",
      uploadTime,
      remark: form.remark,
    };
    setData([newDoc, ...data]);
    setUploadOpen(false);
    message.success("资料上传成功");
  };

  // 提交编辑（更新覆盖，无版本管理）
  const submitEdit = (form: Record<string, any>) => {
    setData(
      data.map((item) =>
        item.id === current?.id
          ? {
              ...item,
              name: form.name,
              category: form.category,
              linkedType: form.linkedType,
              linkedId: form.linkedId,
              linkedName: form.linkedName,
              fileType: form.fileType || item.fileType,
              fileSize: form.fileSize || item.fileSize,
              remark: form.remark,
            }
          : item
      )
    );
    setEditOpen(false);
    message.success("资料更新成功");
  };

  return (
    <div className="space-y-4">
      <PageHeader title="资料管理" subtitle="管理水电站各类资料文档，支持上传、预览、下载" />

      <SearchForm
        fields={searchFields}
        values={searchValues}
        onChange={(name, value) => setSearchValues({ ...searchValues, [name]: value })}
        onSearch={() => message.info("搜索完成")}
        onReset={() => {
          setSearchValues({});
          message.info("已重置搜索条件");
        }}
        extraButtons={
          <>
            <button
              className="btn-primary flex items-center gap-1"
              onClick={() => setUploadOpen(true)}
            >
              <Plus size={14} />
              上传资料
            </button>
            <button
              className="btn-default flex items-center gap-1"
              onClick={handleBatchDownload}
            >
              <Download size={14} />
              批量下载
            </button>
            <button
              className="btn-danger flex items-center gap-1"
              onClick={handleBatchDelete}
            >
              <Trash2 size={14} />
              批量删除
            </button>
          </>
        }
      />

      <DataTable
        columns={columns}
        data={filteredData}
        selectable
        selectedKeys={selectedKeys}
        onSelectChange={setSelectedKeys}
        pageSize={10}
        emptyText="暂无资料数据"
      />

      {/* 上传资料弹窗 */}
      <DocumentFormModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSubmit={submitUpload}
      />

      {/* 编辑资料弹窗 */}
      <DocumentFormModal
        open={editOpen}
        editData={current}
        onClose={() => setEditOpen(false)}
        onSubmit={submitEdit}
      />

      {/* 预览弹窗 */}
      <DocumentPreviewModal
        open={previewOpen}
        document={current}
        onClose={() => setPreviewOpen(false)}
      />

      {/* 删除确认弹窗 */}
      <ConfirmModal
        open={deleteOpen}
        content={
          deleteId === -1
            ? `确认删除选中的 ${selectedKeys.length} 个资料吗？`
            : "确认删除该资料吗？"
        }
        danger
        okText="删除"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
