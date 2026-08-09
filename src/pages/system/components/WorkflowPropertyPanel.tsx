import { GitBranch } from "lucide-react";
import { FormItem } from "@/components/common/UploadBox";
import { message } from "@/components/common/Message";
import type { FlowNode, FlowEdge } from "../WorkflowDesigner";

// 审批人选项
const approverOptions = ["系统管理员", "部门负责人", "主管领导", "张操作", "李浏览", "张三", "李四"];

interface Props {
  selectedNode: FlowNode | null;
  selectedEdgeObj: FlowEdge | null;
  onUpdateNode: (patch: Partial<FlowNode>) => void;
  onUpdateEdgeCondition: (val: string) => void;
  onDeleteEdge: (id: string) => void;
  onUpdateCondition: (patch: Partial<{ field: string; operator: string; value: string }>) => void;
  onDeleteNode: (id: string) => void;
}

// 工作流右侧属性面板
export default function WorkflowPropertyPanel({
  selectedNode, selectedEdgeObj, onUpdateNode, onUpdateEdgeCondition,
  onDeleteEdge, onUpdateCondition, onDeleteNode,
}: Props) {
  return (
    <div className="admin-card p-4 overflow-auto" style={{ width: 300 }}>
      <h3 className="text-sm font-medium text-admin-text mb-3 flex items-center gap-1">
        <GitBranch size={15} className="text-admin-primary" />属性配置
      </h3>
      {/* 连线属性 */}
      {selectedEdgeObj && (
        <div className="space-y-3">
          <FormItem label="连线条件">
            <input className="input-base" value={selectedEdgeObj.condition || ""}
              onChange={(e) => onUpdateEdgeCondition(e.target.value)}
              placeholder={"如：金额大于10000"} />
          </FormItem>
          <button className="btn-danger w-full" onClick={() => onDeleteEdge(selectedEdgeObj.id)}>
            删除连线
          </button>
        </div>
      )}
      {/* 节点属性 */}
      {selectedNode && (
        <div className="space-y-1">
          <FormItem label="节点名称" required>
            <input className="input-base" value={selectedNode.name} onChange={(e) => onUpdateNode({ name: e.target.value })} />
          </FormItem>
          {selectedNode.type === "approval" && (
            <>
              <FormItem label="审批类型">
                <select className="input-base" value={selectedNode.approvalType || "single"}
                  onChange={(e) => onUpdateNode({ approvalType: e.target.value as any })}>
                  <option value="single">单人审批</option>
                  <option value="countersign">多人会签</option>
                  <option value="or-sign">多人或签</option>
                </select>
              </FormItem>
              <FormItem label="审批人">
                <select className="input-base" value={selectedNode.approver || ""}
                  onChange={(e) => onUpdateNode({ approver: e.target.value })}>
                  <option value="">请选择</option>
                  {approverOptions.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </FormItem>
              <FormItem label="审批意见">
                <select className="input-base" value={selectedNode.opinionRequired ? "required" : "optional"}
                  onChange={(e) => onUpdateNode({ opinionRequired: e.target.value === "required" })}>
                  <option value="required">必填</option>
                  <option value="optional">选填</option>
                </select>
              </FormItem>
            </>
          )}
          {selectedNode.type === "condition" && (
            <>
              <FormItem label="条件名称">
                <input className="input-base" value={selectedNode.conditionName || ""}
                  onChange={(e) => onUpdateNode({ conditionName: e.target.value })} placeholder="如：金额判断" />
              </FormItem>
              <FormItem label="条件规则">
                <div className="flex gap-1">
                  <input className="input-base" value={selectedNode.conditions?.[0]?.field || ""} placeholder="字段"
                    onChange={(e) => onUpdateCondition({ field: e.target.value })} />
                  <select className="input-base" style={{ width: 60 }} value={selectedNode.conditions?.[0]?.operator || ">"}
                    onChange={(e) => onUpdateCondition({ operator: e.target.value })}>
                    <option value={">"}>{">"}</option>
                    <option value={"<"}>{"<"}</option>
                    <option value="=">=</option>
                  </select>
                  <input className="input-base" value={selectedNode.conditions?.[0]?.value || ""} placeholder="值"
                    onChange={(e) => onUpdateCondition({ value: e.target.value })} />
                </div>
              </FormItem>
            </>
          )}
          <button className="btn-danger w-full mt-2" onClick={() => onDeleteNode(selectedNode.id)}>删除节点</button>
        </div>
      )}
      {!selectedNode && !selectedEdgeObj && (
        <p className="text-sm text-admin-muted text-center mt-8">请选择节点或连线进行配置</p>
      )}
    </div>
  );
}
