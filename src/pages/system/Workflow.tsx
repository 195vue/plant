import { useState, useMemo } from "react";
import {
  Plus, Edit, Trash2, Play, Pause, Copy, CheckCircle, XCircle,
  Clock, FileText, Settings, GitBranch, ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchForm, type SearchField } from "@/components/common/SearchForm";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Modal, ConfirmModal } from "@/components/common/Modal";
import { Tag, StatusTag } from "@/components/common/Tag";
import { message } from "@/components/common/Message";

// Mock 工作流数据
interface WorkflowItem {
  id: string;
  name: string;
  code: string;
  category: string;
  status: "enabled" | "disabled";
  version: string;
  nodes: number;
  description: string;
  updateTime: string;
  creator: string;
}

const mockWorkflows: WorkflowItem[] = [
  { id: "WF001", name: "资料上传审批流程", code: "DOC_UPLOAD_APPROVAL", category: "图纸管理", status: "enabled", version: "v1.0", nodes: 3, description: "操作人员上传资料→管理员审核→通过发布/驳回退回", updateTime: "2026-08-01 10:00", creator: "系统管理员" },
];

// 流程节点Mock — 对应资料上传审批的实际链路
const mockNodes = [
  { id: 1, name: "上传资料", type: "start", assignee: "操作人员 / 管理员", status: "completed" },
  { id: 2, name: "管理员审核", type: "approval", assignee: "管理员", status: "current" },
  { id: 3, name: "通过发布 / 驳回退回", type: "end", assignee: "系统自动", status: "pending" },
];

const categoryOptions = [
  "设备管理", "图纸管理", "管路管理", "资料管理", "系统管理",
].map((v) => ({ label: v, value: v }));

const searchFields: SearchField[] = [
  { name: "name", label: "流程名称", type: "input", placeholder: "请输入流程名称" },
  { name: "category", label: "所属模块", type: "select", options: categoryOptions, width: "120px" },
  { name: "status", label: "状态", type: "select", options: [{ label: "启用", value: "enabled" }, { label: "停用", value: "disabled" }], width: "100px" },
];

export default function WorkflowManage() {
  const [data, setData] = useState<WorkflowItem[]>(mockWorkflows);
  const [searchValues, setSearchValues] = useState<Record<string, any>>({});
  const [selectedId, setSelectedId] = useState<string | null>(mockWorkflows[0]?.id || null);
  const [editOpen, setEditOpen] = useState(false);
  const [editMode, setEditMode] = useState<"add" | "edit">("add");
  const [editForm, setEditForm] = useState<Partial<WorkflowItem>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [designOpen, setDesignOpen] = useState(false);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (searchValues.name && !item.name.includes(searchValues.name)) return false;
      if (searchValues.category && item.category !== searchValues.category) return false;
      if (searchValues.status && item.status !== searchValues.status) return false;
      return true;
    });
  }, [data, searchValues]);

  const currentItem = filteredData.find((d) => d.id === selectedId) || null;

  // 统计
  const stats = {
    total: data.length,
    enabled: data.filter((d) => d.status === "enabled").length,
    disabled: data.filter((d) => d.status === "disabled").length,
    avgNodes: Math.round(data.reduce((sum, d) => sum + d.nodes, 0) / data.length * 10) / 10,
  };

  const columns: Column<WorkflowItem>[] = [
    {
      title: "流程编码",
      key: "code",
      width: "140px",
      render: (item) => (
        <span className="font-mono text-xs text-admin-primary">{item.code}</span>
      ),
    },
    {
      title: "流程名称",
      key: "name",
      width: "180px",
      render: (item) => (
        <span className="text-admin-text font-medium">{item.name}</span>
      ),
    },
    {
      title: "所属模块",
      key: "category",
      width: "100px",
      render: (item) => <Tag color="blue">{item.category}</Tag>,
    },
    {
      title: "流程说明",
      key: "description",
      width: "200px",
      render: (item) => (
        <span className="text-xs text-admin-muted truncate block max-w-[200px]">{item.description}</span>
      ),
    },
    {
      title: "节点数",
      key: "nodes",
      width: "70px",
      render: (item) => (
        <span className="flex items-center gap-0.5 text-admin-text">
          <GitBranch size={11} className="text-admin-muted" />
          {item.nodes}
        </span>
      ),
    },
    {
      title: "版本",
      key: "version",
      width: "70px",
      render: (item) => <Tag color="gray">{item.version}</Tag>,
    },
    {
      title: "状态",
      key: "status",
      width: "80px",
      render: (item) => (
        <StatusTag
          status={item.status}
          type="enable"
        />
      ),
    },
    {
      title: "更新时间",
      key: "updateTime",
      width: "140px",
      render: (item) => <span className="text-xs text-admin-muted">{item.updateTime}</span>,
    },
    {
      title: "操作",
      key: "action",
      width: "160px",
      render: (item) => (
        <div className="flex items-center gap-2">
          <button
            className="btn-link text-xs flex items-center gap-0.5"
            onClick={(e) => { e.stopPropagation(); message.info("编辑流程"); }}
          >
            <Edit size={12} /> 编辑
          </button>
          <button
            className="btn-link text-xs flex items-center gap-0.5"
            onClick={(e) => { e.stopPropagation(); message.info("打开流程设计器"); }}
          >
            <Settings size={12} /> 设计
          </button>
          <button
            className="btn-link text-xs flex items-center gap-0.5"
            onClick={(e) => { e.stopPropagation(); message.info(`流程已${item.status === "enabled" ? "停用" : "启用"}`); }}
          >
            {item.status === "enabled" ? <Pause size={12} /> : <Play size={12} />}
            {item.status === "enabled" ? "停用" : "启用"}
          </button>
        </div>
      ),
    },
  ];

  const handleAdd = () => {
    setEditMode("add");
    setEditForm({});
    setEditOpen(true);
  };

  const handleEdit = (item: WorkflowItem) => {
    setEditMode("edit");
    setEditForm(item);
    setEditOpen(true);
  };

  const handleSave = () => {
    if (!editForm.name || !editForm.code || !editForm.category) {
      message.warning("请填写必填项");
      return;
    }
    if (editMode === "add") {
      const newItem: WorkflowItem = {
        id: `WF${String(data.length + 1).padStart(3, "0")}`,
        name: editForm.name!,
        code: editForm.code!,
        category: editForm.category!,
        status: "enabled",
        version: "v1.0",
        nodes: editForm.nodes || 3,
        description: editForm.description || "",
        updateTime: new Date().toLocaleString("zh-CN"),
        creator: "当前用户",
      };
      setData([newItem, ...data]);
      message.success("流程创建成功");
    } else {
      setData(data.map((d) => (d.id === editForm.id ? { ...d, ...editForm, updateTime: new Date().toLocaleString("zh-CN") } as WorkflowItem : d)));
      message.success("流程修改成功");
    }
    setEditOpen(false);
  };

  const handleToggleStatus = (item: WorkflowItem) => {
    setData(data.map((d) => (d.id === item.id ? { ...d, status: d.status === "enabled" ? "disabled" : "enabled" } : d)));
    message.success(`流程已${item.status === "enabled" ? "停用" : "启用"}`);
  };

  const handleCopy = (item: WorkflowItem) => {
    const newItem: WorkflowItem = {
      ...item,
      id: `WF${String(data.length + 1).padStart(3, "0")}`,
      name: `${item.name}_副本`,
      version: "v1.0",
      status: "disabled",
      updateTime: new Date().toLocaleString("zh-CN"),
    };
    setData([newItem, ...data]);
    message.success("流程已复制");
  };

  const handleDelete = () => {
    if (deleteId) {
      setData(data.filter((d) => d.id !== deleteId));
      message.success("流程已删除");
      setDeleteId(null);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <PageHeader title="工作流管理" />

      <div className="flex gap-4 flex-1 min-h-0 mt-2">
        {/* 左侧 */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* 统计卡片 */}
          <div className="grid grid-cols-4 gap-2 mb-2 flex-shrink-0">
            <div className="admin-card p-2 flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-blue-500/15 flex items-center justify-center">
                <FileText size={16} className="text-blue-500" />
              </div>
              <div>
                <div className="text-[10px] text-admin-muted">流程总数</div>
                <div className="text-lg font-bold text-admin-text">{stats.total}</div>
              </div>
            </div>
            <div className="admin-card p-2 flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-green-500/15 flex items-center justify-center">
                <CheckCircle size={16} className="text-green-500" />
              </div>
              <div>
                <div className="text-[10px] text-admin-muted">启用中</div>
                <div className="text-lg font-bold text-green-500">{stats.enabled}</div>
              </div>
            </div>
            <div className="admin-card p-2 flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-gray-500/15 flex items-center justify-center">
                <Pause size={16} className="text-gray-400" />
              </div>
              <div>
                <div className="text-[10px] text-admin-muted">已停用</div>
                <div className="text-lg font-bold text-gray-400">{stats.disabled}</div>
              </div>
            </div>
            <div className="admin-card p-2 flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-purple-500/15 flex items-center justify-center">
                <GitBranch size={16} className="text-purple-500" />
              </div>
              <div>
                <div className="text-[10px] text-admin-muted">平均节点</div>
                <div className="text-lg font-bold text-purple-500">{stats.avgNodes}</div>
              </div>
            </div>
          </div>

          <SearchForm
            fields={searchFields}
            values={searchValues}
            onChange={(name, value) => setSearchValues({ ...searchValues, [name]: value })}
            onSearch={() => message.info("搜索完成")}
            onReset={() => setSearchValues({})}
            extraButtons={
              <>
                <button className="btn-primary flex items-center gap-1" onClick={handleAdd}>
                  <Plus size={14} />
                  新增流程
                </button>
              </>
            }
          />

          <div className="admin-card p-3 flex-1 overflow-hidden flex flex-col min-h-0 mt-2">
            <DataTable
              columns={columns}
              data={filteredData}
              onRowClick={(r) => setSelectedId(r.id)}
              activeRowId={selectedId}
              pageSize={10}
              emptyText="暂无工作流数据"
            />
          </div>

          {/* 流程节点图 */}
          <div className="admin-card p-3 mt-2 flex-shrink-0">
            <div className="text-xs font-medium text-admin-text mb-3 flex items-center gap-1">
              <GitBranch size={12} className="text-admin-primary" />
              流程节点图
              {currentItem && (
                <span className="text-admin-muted ml-2">- {currentItem.name}</span>
              )}
            </div>
            {currentItem ? (
              <div className="overflow-x-auto">
                <div className="flex items-center gap-1 min-w-fit py-2">
                  {/* 节点1：上传资料（已完成） */}
                  <div className="flex-shrink-0">
                    <div className="border-2 border-green-500 bg-green-50 rounded-lg px-4 py-2 min-w-[140px]">
                      <div className="flex items-center gap-1.5 mb-1">
                        <CheckCircle size={12} className="text-green-500" />
                        <span className="text-xs font-medium text-admin-text">上传资料</span>
                      </div>
                      <div className="text-[10px] text-admin-muted mb-1">操作人：操作人员</div>
                      <Tag color="green">发起</Tag>
                    </div>
                  </div>
                  {/* 箭头 */}
                  <ArrowRight size={16} className="text-admin-muted flex-shrink-0" />
                  {/* 节点2：管理员审核（当前） */}
                  <div className="flex-shrink-0">
                    <div className="border-2 border-blue-500 bg-blue-50 rounded-lg px-4 py-2 min-w-[140px] ring-2 ring-blue-300/40">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Clock size={12} className="text-blue-500" />
                        <span className="text-xs font-medium text-admin-text">管理员审核</span>
                      </div>
                      <div className="text-[10px] text-admin-muted mb-1">操作人：管理员</div>
                      <Tag color="blue">审核</Tag>
                    </div>
                  </div>
                  {/* 箭头 */}
                  <ArrowRight size={16} className="text-admin-muted flex-shrink-0" />
                  {/* 节点3：通过发布（未到达） */}
                  <div className="flex-shrink-0">
                    <div className="border-2 border-gray-300 bg-gray-50 rounded-lg px-4 py-2 min-w-[140px]">
                      <div className="flex items-center gap-1.5 mb-1">
                        <CheckCircle size={12} className="text-gray-400" />
                        <span className="text-xs font-medium text-gray-500">通过发布</span>
                      </div>
                      <div className="text-[10px] text-gray-400 mb-1">操作人：系统判定</div>
                      <Tag color="gray">结束</Tag>
                    </div>
                  </div>
                  {/* 分叉箭头到节点4 */}
                  <div className="flex-shrink-0 flex flex-col items-center justify-center mx-1">
                    <div className="text-[9px] text-orange-500 mb-0.5">驳回</div>
                    <div className="w-px h-3 bg-gray-300"></div>
                    <div className="w-3 h-px bg-gray-300"></div>
                  </div>
                  {/* 节点4：驳回退回（未到达，从节点2分叉） */}
                  <div className="flex-shrink-0">
                    <div className="border-2 border-gray-300 bg-gray-50 rounded-lg px-4 py-2 min-w-[140px]">
                      <div className="flex items-center gap-1.5 mb-1">
                        <XCircle size={12} className="text-gray-400" />
                        <span className="text-xs font-medium text-gray-500">驳回退回</span>
                      </div>
                      <div className="text-[10px] text-gray-400 mb-1">操作人：系统判定</div>
                      <Tag color="gray">结束</Tag>
                    </div>
                  </div>
                </div>
                {/* 图例 */}
                <div className="flex items-center gap-4 mt-2 pt-2 border-t border-admin-border text-[10px] text-admin-muted">
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 border-2 border-green-500 rounded"></span> 已完成
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 border-2 border-blue-500 rounded"></span> 当前节点
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 border-2 border-gray-300 rounded"></span> 未到达
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-admin-muted text-xs">请选择流程查看节点图</div>
            )}
          </div>
        </div>

        {/* 右侧详情面板 */}
        <div className="w-[320px] flex-shrink-0 admin-card p-3 overflow-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>
          {currentItem ? (
            <>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-admin-border">
                <div className="flex items-center gap-2">
                  <GitBranch size={16} className="text-admin-primary" />
                  <span className="text-sm font-medium text-admin-text">{currentItem.name}</span>
                </div>
                <StatusTag
                  status={currentItem.status}
                  type="enable"
                />
              </div>

              {/* 基础信息 */}
              <div className="space-y-2 mb-4">
                <div className="text-xs text-admin-muted">基础信息</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-admin-muted">流程编码</span><span className="text-admin-primary font-mono">{currentItem.code}</span></div>
                  <div className="flex justify-between"><span className="text-admin-muted">所属模块</span><span className="text-admin-text">{currentItem.category}</span></div>
                  <div className="flex justify-between"><span className="text-admin-muted">版本</span><span className="text-admin-text">{currentItem.version}</span></div>
                  <div className="flex justify-between"><span className="text-admin-muted">创建人</span><span className="text-admin-text">{currentItem.creator}</span></div>
                  <div className="flex justify-between"><span className="text-admin-muted">更新时间</span><span className="text-admin-text">{currentItem.updateTime}</span></div>
                </div>
              </div>

              {/* 流程说明 */}
              <div className="mb-4">
                <div className="text-xs text-admin-muted mb-1">流程说明</div>
                <div className="text-xs text-admin-text bg-admin-bg p-2 rounded">{currentItem.description}</div>
              </div>

              {/* 流程节点 */}
              <div className="mb-4">
                <div className="text-xs text-admin-muted mb-2">流程节点</div>
                <div className="space-y-1">
                  {mockNodes.map((node, idx) => (
                    <div key={node.id} className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        node.status === "completed" ? "bg-green-500/20 text-green-600" :
                        node.status === "current" ? "bg-blue-500/20 text-blue-600 ring-2 ring-blue-400/40" :
                        "bg-gray-100 text-gray-400"
                      }`}>
                        {node.status === "completed" ? <CheckCircle size={12} /> : node.id}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-admin-text font-medium">{node.name}</div>
                        <div className="text-[10px] text-admin-muted">{node.assignee}</div>
                      </div>
                      <Tag color={node.type === "start" ? "green" : node.type === "end" ? "red" : node.type === "approval" ? "blue" : "gray"}>
                        {node.type === "start" ? "发起" : node.type === "end" ? "结束" : node.type === "approval" ? "审批" : "处理"}
                      </Tag>
                      {idx < mockNodes.length - 1 && (
                        <ArrowRight size={10} className="text-admin-muted absolute" style={{ marginLeft: "20px", marginTop: "28px" }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-admin-border">
                <button className="btn-default flex items-center gap-1 text-xs" onClick={() => handleEdit(currentItem)}>
                  <Edit size={12} /> 编辑
                </button>
                <button className="btn-default flex items-center gap-1 text-xs" onClick={() => handleCopy(currentItem)}>
                  <Copy size={12} /> 复制
                </button>
                <button className="btn-default flex items-center gap-1 text-xs" onClick={() => handleToggleStatus(currentItem)}>
                  {currentItem.status === "enabled" ? <Pause size={12} /> : <Play size={12} />}
                  {currentItem.status === "enabled" ? "停用" : "启用"}
                </button>
                <button className="btn-default flex items-center gap-1 text-xs" onClick={() => setDesignOpen(true)}>
                  <Settings size={12} /> 设计
                </button>
                <button className="btn-danger flex items-center gap-1 text-xs" onClick={() => setDeleteId(currentItem.id)}>
                  <Trash2 size={12} /> 删除
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-admin-muted text-xs">选择流程查看详情</div>
          )}
        </div>
      </div>

      {/* 新增/编辑弹窗 */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={editMode === "add" ? "新增工作流" : "编辑工作流"}
        width={500}
        footer={
          <>
            <button className="btn-default" onClick={() => setEditOpen(false)}>取消</button>
            <button className="btn-primary" onClick={handleSave}>保存</button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-admin-muted mb-1 block">流程名称 *</label>
              <input
                className="input-base w-full"
                value={editForm.name || ""}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="请输入流程名称"
              />
            </div>
            <div>
              <label className="text-xs text-admin-muted mb-1 block">流程编码 *</label>
              <input
                className="input-base w-full font-mono"
                value={editForm.code || ""}
                onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                placeholder="如：EQUIP_ACCEPTANCE"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-admin-muted mb-1 block">所属模块 *</label>
              <select
                className="input-base w-full"
                value={editForm.category || ""}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
              >
                <option value="">请选择</option>
                {categoryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-admin-muted mb-1 block">节点数</label>
              <input
                type="number"
                className="input-base w-full"
                value={editForm.nodes || 3}
                onChange={(e) => setEditForm({ ...editForm, nodes: parseInt(e.target.value) || 3 })}
                min={2}
                max={20}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-admin-muted mb-1 block">流程说明</label>
            <textarea
              className="input-base w-full"
              rows={3}
              value={editForm.description || ""}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              placeholder="请输入流程说明"
            />
          </div>
        </div>
      </Modal>

      {/* 流程设计弹窗 */}
      <Modal
        open={designOpen}
        onClose={() => setDesignOpen(false)}
        title={`流程设计 - ${currentItem?.name || ""}`}
        width={700}
        footer={
          <>
            <button className="btn-default" onClick={() => setDesignOpen(false)}>关闭</button>
            <button className="btn-primary" onClick={() => { message.success("流程设计已保存"); setDesignOpen(false); }}>保存设计</button>
          </>
        }
      >
        <div className="text-xs text-admin-muted mb-3">流程节点编排（可视化设计器占位）</div>
        <div className="flex items-center gap-2 overflow-x-auto p-4 bg-admin-bg rounded">
          {mockNodes.map((node, idx) => (
            <div key={node.id} className="flex items-center gap-2 flex-shrink-0">
              <div className="admin-card p-3 min-w-[120px] text-center">
                <div className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center text-xs font-bold ${
                  node.type === "start" ? "bg-green-500/20 text-green-600" :
                  node.type === "end" ? "bg-red-500/20 text-red-600" :
                  "bg-blue-500/20 text-blue-600"
                }`}>
                  {node.id}
                </div>
                <div className="text-xs font-medium text-admin-text">{node.name}</div>
                <div className="text-[10px] text-admin-muted mt-0.5">{node.assignee}</div>
              </div>
              {idx < mockNodes.length - 1 && (
                <ArrowRight size={16} className="text-admin-muted flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <button className="btn-default text-xs flex items-center gap-1" onClick={() => message.info("添加审批节点")}>
            <Plus size={12} /> 添加审批节点
          </button>
          <button className="btn-default text-xs flex items-center gap-1" onClick={() => message.info("添加条件分支")}>
            <GitBranch size={12} /> 添加条件分支
          </button>
        </div>
      </Modal>

      {/* 删除确认 */}
      <ConfirmModal
        open={deleteId !== null}
        content="确定删除该工作流吗？删除后不可恢复。"
        okText="删除"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
