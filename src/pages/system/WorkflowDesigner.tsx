import { useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Save, Send, ArrowLeft, Play, Circle, Diamond, Square } from "lucide-react";
import { workflows as mockWorkflows } from "@/mock";
import { message } from "@/components/common/Message";
import { cn } from "@/lib/utils";
import WorkflowPropertyPanel from "./components/WorkflowPropertyPanel";

// 节点类型
export type NodeType = "start" | "approval" | "condition" | "end";

export interface FlowNode {
  id: string;
  type: NodeType;
  name: string;
  approvalType?: "single" | "countersign" | "or-sign";
  approver?: string;
  opinionRequired?: boolean;
  conditionName?: string;
  conditions?: { field: string; operator: string; value: string }[];
  x: number;
  y: number;
}
export interface FlowEdge {
  id: string;
  from: string;
  to: string;
  condition?: string;
}

const NODE_W = 150;
const NODE_H = 70;

// 节点类型配置
const nodeTypeConfig: Record<NodeType, { label: string; color: string; icon: React.ReactNode }> = {
  start: { label: "开始节点", color: "bg-green-500", icon: <Play size={14} /> },
  approval: { label: "审批节点", color: "bg-blue-500", icon: <Circle size={14} /> },
  condition: { label: "条件分支", color: "bg-orange-500", icon: <Diamond size={14} /> },
  end: { label: "结束节点", color: "bg-red-500", icon: <Square size={14} /> },
};

// 节点面板可拖拽项
const panelNodes: NodeType[] = ["start", "approval", "condition", "end"];

// 预设示例流程图
const presetNodes: FlowNode[] = [
  { id: "n1", type: "start", name: "开始", x: 40, y: 80 },
  { id: "n2", type: "approval", name: "部门负责人审批", approvalType: "single", approver: "部门负责人", opinionRequired: true, x: 260, y: 80 },
  { id: "n3", type: "condition", name: "金额判断", conditionName: "金额>10000", conditions: [{ field: "金额", operator: ">", value: "10000" }], x: 480, y: 80 },
  { id: "n4", type: "approval", name: "主管领导审批", approvalType: "countersign", approver: "主管领导", opinionRequired: true, x: 700, y: 80 },
  { id: "n5", type: "end", name: "结束", x: 920, y: 80 },
];
const presetEdges: FlowEdge[] = [
  { id: "e1", from: "n1", to: "n2" },
  { id: "e2", from: "n2", to: "n3" },
  { id: "e3", from: "n3", to: "n4", condition: "金额>10000" },
  { id: "e4", from: "n4", to: "n5" },
];

export default function WorkflowDesigner() {
  const { id } = useParams();
  const navigate = useNavigate();
  const wf = mockWorkflows.find((w) => w.id === Number(id));
  const [name, setName] = useState(wf?.name || "新建工作流");
  const [nodes, setNodes] = useState<FlowNode[]>(presetNodes);
  const [edges, setEdges] = useState<FlowEdge[]>(presetEdges);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const selectedNode = nodes.find((n) => n.id === selectedId) || null;
  const selectedEdgeObj = edges.find((e) => e.id === selectedEdge) || null;

  // 添加节点（拖拽放置）
  const addNode = (type: NodeType, x: number, y: number) => {
    const startCount = nodes.filter((n) => n.type === "start").length;
    const endCount = nodes.filter((n) => n.type === "end").length;
    if (type === "start" && startCount >= 1) return message.warning("每个工作流只能有一个开始节点");
    if (type === "end" && endCount >= 1) return message.warning("每个工作流只能有一个结束节点");
    const newId = `n${Date.now()}`;
    const label = nodeTypeConfig[type].label;
    setNodes([...nodes, { id: newId, type, name: label, x, y }]);
    message.success(`已添加${label}`);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("nodeType") as NodeType;
    if (!type) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left + canvasRef.current!.scrollLeft - NODE_W / 2;
    const y = e.clientY - rect.top + canvasRef.current!.scrollTop - NODE_H / 2;
    addNode(type, Math.max(0, x), Math.max(0, y));
  };

  // 删除节点
  const deleteNode = (nodeId: string) => {
    setNodes(nodes.filter((n) => n.id !== nodeId));
    setEdges(edges.filter((e) => e.from !== nodeId && e.to !== nodeId));
    setSelectedId(null);
    message.success("节点已删除");
  };

  // 更新节点属性
  const updateNode = (patch: Partial<FlowNode>) => {
    if (!selectedNode) return;
    setNodes(nodes.map((n) => (n.id === selectedNode.id ? { ...n, ...patch } : n)));
  };

  // 更新连线条件
  const updateEdgeCondition = (val: string) => {
    if (!selectedEdgeObj) return;
    setEdges(edges.map((ed) => (ed.id === selectedEdgeObj.id ? { ...ed, condition: val } : ed)));
  };

  // 删除连线
  const deleteEdge = (edgeId: string) => {
    setEdges(edges.filter((ed) => ed.id !== edgeId));
    setSelectedEdge(null);
    message.success("连线已删除");
  };

  // 更新条件规则字段
  const updateCondition = (patch: Partial<{ field: string; operator: string; value: string }>) => {
    if (!selectedNode) return;
    const cur = (selectedNode.conditions || [])[0] || { field: "", operator: ">", value: "" };
    updateNode({ conditions: [{ ...cur, ...patch }] });
  };

  // 连线（选中节点后点目标）
  const startConnectRef = useRef<string | null>(null);
  const handleNodeClick = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (startConnectRef.current && startConnectRef.current !== nodeId) {
      // 建立连线
      const exists = edges.some((ed) => ed.from === startConnectRef.current && ed.to === nodeId);
      if (!exists) {
        setEdges([...edges, { id: `e${Date.now()}`, from: startConnectRef.current!, to: nodeId }]);
        message.success("已建立连线");
      }
      startConnectRef.current = null;
      setSelectedId(null);
    } else {
      setSelectedId(nodeId);
      setSelectedEdge(null);
    }
  };

  // 保存
  const handleSave = () => message.success("工作流已保存");

  // 环路检测
  const hasCycle = useMemo(() => {
    const adj: Record<string, string[]> = {};
    edges.forEach((e) => { (adj[e.from] ||= []).push(e.to); });
    const visited: Record<string, number> = {};
    let cycle = false;
    const dfs = (u: string) => {
      visited[u] = 1;
      (adj[u] || []).forEach((v) => {
        if (visited[v] === 1) cycle = true;
        else if (!visited[v]) dfs(v);
      });
      visited[u] = 2;
    };
    nodes.forEach((n) => { if (!visited[n.id]) dfs(n.id); });
    return cycle;
  }, [nodes, edges]);

  // 发布校验
  const handlePublish = () => {
    const startCount = nodes.filter((n) => n.type === "start").length;
    const endCount = nodes.filter((n) => n.type === "end").length;
    if (startCount !== 1) return message.error("必须有且仅有一个开始节点");
    if (endCount !== 1) return message.error("必须有且仅有一个结束节点");
    if (nodes.length < 2) return message.error("请添加足够的节点");
    if (hasCycle) return message.error("审批节点不可形成环路，请检查");
    if (edges.length === 0) return message.error("请先建立节点连线");
    message.success("校验通过，工作流已发布");
  };

  // 渲染连线
  const renderEdges = () => (
    <svg className="absolute inset-0 pointer-events-none" style={{ width: "100%", height: "100%" }}>
      <defs>
        <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" fill="#1890ff" />
        </marker>
      </defs>
      {edges.map((e) => {
        const from = nodes.find((n) => n.id === e.from);
        const to = nodes.find((n) => n.id === e.to);
        if (!from || !to) return null;
        const x1 = from.x + NODE_W;
        const y1 = from.y + NODE_H / 2;
        const x2 = to.x;
        const y2 = to.y + NODE_H / 2;
        const mx = (x1 + x2) / 2;
        return (
          <g key={e.id} className="cursor-pointer pointer-events-auto" onClick={(ev) => { ev.stopPropagation(); setSelectedEdge(e.id); setSelectedId(null); }}>
            <path d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`} fill="none"
              stroke={selectedEdge === e.id ? "#faad14" : "#1890ff"} strokeWidth={2} markerEnd="url(#arrow)" />
            {e.condition && (
              <text x={mx} y={y1 - 8} fill="#faad14" fontSize="11" textAnchor="middle">{e.condition}</text>
            )}
          </g>
        );
      })}
    </svg>
  );

  return (
    <div className="flex flex-col h-full">
      {/* 顶部工具栏 */}
      <div className="flex items-center gap-3 mb-3 p-3 bg-admin-card border border-admin-border rounded">
        <button className="btn-default flex items-center gap-1" onClick={() => navigate("/admin/system/workflow")}>
          <ArrowLeft size={14} />返回
        </button>
        <span className="text-sm text-admin-muted">工作流名称：</span>
        <input className="input-base" style={{ width: 240 }} value={name} onChange={(e) => setName(e.target.value)} />
        <div className="flex-1" />
        <span className="text-xs text-admin-muted">提示：点击两个节点可建立连线</span>
        <button className="btn-primary flex items-center gap-1" onClick={handleSave}>
          <Save size={14} />保存
        </button>
        <button className="bg-admin-success text-white px-4 py-1.5 rounded text-sm hover:bg-green-600 flex items-center gap-1 transition-colors" onClick={handlePublish}>
          <Send size={14} />发布
        </button>
      </div>

      <div className="flex gap-3 flex-1 min-h-0">
        {/* 左侧节点面板 */}
        <div className="admin-card p-3 flex flex-col gap-2" style={{ width: 200 }}>
          <h3 className="text-sm font-medium text-admin-text mb-1">节点面板</h3>
          {panelNodes.map((t) => (
            <div
              key={t}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("nodeType", t)}
              className="flex items-center gap-2 px-3 py-2 border border-admin-border rounded cursor-move text-sm hover:border-admin-primary hover:bg-blue-50 transition-colors"
            >
              <span className={cn("w-5 h-5 rounded flex items-center justify-center text-white", nodeTypeConfig[t].color)}>
                {nodeTypeConfig[t].icon}
              </span>
              {nodeTypeConfig[t].label}
            </div>
          ))}
          <p className="text-xs text-admin-muted mt-2 leading-relaxed">拖拽节点到画布添加，点击两个节点建立连线，双击节点编辑属性。</p>
        </div>

        {/* 中间画布 */}
        <div
          ref={canvasRef}
          className="flex-1 admin-card relative overflow-auto"
          style={{ backgroundImage: "radial-gradient(#e8e8e8 1px, transparent 1px)", backgroundSize: "16px 16px" }}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => { setSelectedId(null); setSelectedEdge(null); startConnectRef.current = null; }}
        >
          <div className="relative" style={{ width: 1200, height: 500 }}>
            {renderEdges()}
            {nodes.map((n) => {
              const cfg = nodeTypeConfig[n.type];
              return (
                <div
                  key={n.id}
                  onClick={(e) => handleNodeClick(n.id, e)}
                  onDoubleClick={(e) => { e.stopPropagation(); setSelectedId(n.id); }}
                  className={cn(
                    "absolute rounded-lg border-2 shadow-sm cursor-pointer transition-all p-2 text-white flex flex-col justify-center items-center",
                    cfg.color,
                    selectedId === n.id ? "border-yellow-400 ring-2 ring-yellow-300" : "border-transparent"
                  )}
                  style={{ left: n.x, top: n.y, width: NODE_W, height: NODE_H }}
                >
                  <div className="flex items-center gap-1 text-xs opacity-90">{cfg.icon}{cfg.label}</div>
                  <div className="text-sm font-medium mt-0.5 text-center px-1 truncate w-full">{n.name}</div>
                  {n.type === "approval" && n.approver && (
                    <div className="text-[11px] opacity-80 truncate w-full text-center">审批人：{n.approver}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 右侧属性面板 */}
        <WorkflowPropertyPanel
          selectedNode={selectedNode}
          selectedEdgeObj={selectedEdgeObj}
          onUpdateNode={updateNode}
          onUpdateEdgeCondition={updateEdgeCondition}
          onDeleteEdge={deleteEdge}
          onUpdateCondition={updateCondition}
          onDeleteNode={deleteNode}
        />
      </div>
    </div>
  );
}
