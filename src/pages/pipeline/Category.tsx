import { useState, useMemo } from "react";
import {
  pipelines as mockPipelines,
} from "@/mock";
import type { Pipeline } from "@/types";
import PipelineDetailPanel from "./components/PipelineDetailPanel";
import PipelineBottomPanel from "./components/PipelineBottomPanel";
import StructureTreeSelect, { type TreeSelectFilter } from "@/components/common/StructureTreeSelect";
import { buildStructureTree, findNode } from "@/mock/structureTree";
import { DevNote } from "@/components/devNotes/DevNote";

interface TreeFilter {
  nodeId?: number;
  nodeName?: string;
  kks?: string;
  pipelineId?: number;
  descendantIds?: number[];
}

export default function PipelineCategory() {
  const [data, setData] = useState<Pipeline[]>(mockPipelines);
  const [treeFilter, setTreeFilter] = useState<TreeFilter>({});
  const [selectedPipelineId, setSelectedPipelineId] = useState<number | null>(null);

  // 构建选中节点及其所有后代的KKS前缀集合
  const kksPrefixes = useMemo(() => {
    if (!treeFilter.nodeId) return [];
    const tree = buildStructureTree("pipeline");
    const allIds = [treeFilter.nodeId, ...(treeFilter.descendantIds || [])];
    const prefixSet = new Set<string>();
    allIds.forEach((id) => {
      const node = findNode(tree, id);
      if (node && node.kks && node.kks.trim()) {
        prefixSet.add(node.kks.toUpperCase());
      }
    });
    return Array.from(prefixSet);
  }, [treeFilter.nodeId, treeFilter.descendantIds]);

  const filteredData = useMemo(() => {
    let list = data;
    if (treeFilter.pipelineId) {
      list = list.filter((p) => p.id === treeFilter.pipelineId);
    } else if (kksPrefixes.length > 0) {
      list = list.filter((p) => {
        const code = p.code.toUpperCase();
        return kksPrefixes.some((prefix) => code.startsWith(prefix));
      });
    } else if (treeFilter.nodeName) {
      const kw = treeFilter.nodeName.toLowerCase();
      list = list.filter((p) =>
        p.system.toLowerCase().includes(kw) ||
        p.position.toLowerCase().includes(kw) ||
        p.name.toLowerCase().includes(kw) ||
        p.code.toLowerCase().includes(kw)
      );
    }
    return list;
  }, [data, treeFilter, kksPrefixes]);

  const currentPipeline = useMemo(() => {
    if (treeFilter.pipelineId) {
      const found = data.find((p) => p.id === treeFilter.pipelineId);
      if (found) return found;
    }
    if (selectedPipelineId !== null) {
      const found = filteredData.find((p) => p.id === selectedPipelineId);
      if (found) return found;
    }
    return filteredData[0] || null;
  }, [filteredData, selectedPipelineId, treeFilter.pipelineId, data]);

  const filterLabel = useMemo(() => {
    if (treeFilter.pipelineId) {
      const p = data.find((x) => x.id === treeFilter.pipelineId);
      return p ? `${p.name}（单管路）` : "";
    }
    if (treeFilter.nodeName) return `${treeFilter.nodeName}（结构树节点）`;
    return "全部管路";
  }, [treeFilter, data]);

  const handleTreeSelect = (filter: TreeSelectFilter) => {
    setTreeFilter({
      nodeId: filter.nodeId,
      nodeName: filter.name,
      kks: filter.kks,
      descendantIds: filter.descendantIds,
    });
    setSelectedPipelineId(null);
  };

  const handleSelectPipeline = (id: number) => {
    setSelectedPipelineId(id);
    setTreeFilter({ pipelineId: id });
  };

  return (
    <div className="h-full flex flex-col gap-3">
      {/* 三栏布局：结构树 + 表格 + 详情 */}
      <div className="flex gap-3 flex-1 min-h-0">
        {/* 左侧：结构树 */}
        <DevNote
          id="pipeline-tree"
          title="管路结构树"
          summary="按KKS编码体系四级定位管路，点击节点筛选管路列表"
          items={[
            { label: "数据来源", value: "buildStructureTree('pipeline')（mock/structureTree）；层级口径：位置(L1)→系统(L2)→用途(L3)→管路/管件(L4)" },
            { label: "校验规则", value: "搜索框「搜索名称/KKS」实时模糊匹配节点名称或KKS编码，保留命中节点及祖先" },
            { label: "交互逻辑", value: "点击节点主体 → handleTreeSelect：收集节点及后代KKS编码组成前缀集合，按前缀筛选管路；点击展开标识仅展开/收起不筛选；有子节点时点击主体同时展开" },
            { label: "后续步骤", value: "正式系统：由结构树服务按位置→系统→用途→管路/管件返回层级数据" },
            { label: "权限", value: "管理员/操作人员可筛选查看" },
          ]}
          wrapClassName="flex flex-shrink-0"
        >
          <div className="w-[240px] flex-shrink-0 admin-card flex flex-col overflow-hidden">
            <div className="px-3 py-2 border-b border-admin-border bg-gray-50">
              <h3 className="text-xs font-semibold text-admin-text">管路结构树</h3>
              <div className="text-[10px] text-admin-muted mt-0.5">基于KKS编码体系</div>
            </div>
            <div className="flex-1 overflow-hidden">
              <StructureTreeSelect
                selectedNodeId={treeFilter.nodeId}
                onSelect={handleTreeSelect}
                title="管路结构树"
                treeType="pipeline"
              />
            </div>
          </div>
        </DevNote>

        {/* 中间：管路表格 */}
        <DevNote
          id="pipeline-list"
          title="管路列表"
          summary="展示当前筛选结果管路，支持选择单管路查看详情"
          items={[
            { label: "数据来源", value: "filteredData：按 treeFilter 规则筛选 mockPipelines（管路ID精确/前缀集合/节点名称匹配/全部）" },
            { label: "字段", value: "管路编码/管路名称/所属系统/操作（查看）" },
            { label: "交互逻辑", value: "标题区显示「共N条·筛选说明」（全部管路/节点名称（结构树节点）/管路名称（单管路））；点击行或「查看」→ handleSelectPipeline 进入单管路筛选，右侧详情与底部统计卡联动" },
            { label: "后续步骤", value: "正式系统：管路列表由管道数字化后台接口按筛选条件分页返回" },
            { label: "权限", value: "管理员/操作人员可查看；本页不提供新增/编辑/删除/导入/导出" },
          ]}
          wrapClassName="flex flex-1 min-w-[300px]"
        >
          <div className="flex-1 min-w-[300px] admin-card overflow-hidden flex flex-col">
            <div className="px-3 py-2 border-b border-admin-border bg-gray-50 flex items-center justify-between">
              <span className="text-xs font-semibold text-admin-text">管路列表</span>
              <span className="text-xs text-admin-muted">共 {filteredData.length} 条 · {filterLabel}</span>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-gray-50 z-10">
                  <tr className="text-admin-muted border-b border-admin-border">
                    <th className="px-3 py-2 text-left font-medium whitespace-nowrap">管路编码</th>
                    <th className="px-3 py-2 text-left font-medium whitespace-nowrap">管路名称</th>
                    <th className="px-3 py-2 text-left font-medium whitespace-nowrap">所属系统</th>
                    <th className="px-3 py-2 text-center font-medium whitespace-nowrap">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-admin-muted">暂无管路数据</td>
                    </tr>
                  ) : filteredData.map((p) => (
                    <tr
                      key={p.id}
                      className={`border-b border-admin-border cursor-pointer transition-colors ${
                        currentPipeline?.id === p.id ? "bg-blue-50" : "hover:bg-gray-50"
                      }`}
                      onClick={() => handleSelectPipeline(p.id)}
                    >
                      <td className="px-3 py-2 font-mono text-admin-text">{p.code}</td>
                      <td className="px-3 py-2 text-admin-text">{p.name}</td>
                      <td className="px-3 py-2 text-admin-muted">{p.system}</td>
                      <td className="px-3 py-2 text-center">
                        <button className="text-blue-500 hover:underline" onClick={(e) => { e.stopPropagation(); handleSelectPipeline(p.id); }}>查看</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </DevNote>

        {/* 右侧：详情面板 */}
        <DevNote
          id="pipeline-detail"
          title="管路详情面板"
          summary="展示当前管路基本信息（含属性资料）与图纸资料两个页签"
          items={[
            { label: "数据来源", value: "currentPipeline（当前筛选结果第一条或单管路选择）；属性资料由管路基础数据直接生成（规格/材质/壁厚/设计压力/设计温度/工作介质/安装日期），并入基本信息页签下方展示；图纸资料按 关联对象类型=管路 且 关联对象ID=当前管路ID 查询" },
            { label: "交互逻辑", value: "头部显示管路用途/名称/编码；两个页签切换（基本信息含属性资料/图纸资料），切换页签保留管路，切换管路保留页签；「×」关闭显式选择后继续显示筛选结果第一条" },
            { label: "后续步骤", value: "正式系统：基础信息由管路接口返回，属性由属性管理模块按管路用途匹配模板，图纸由图纸管理模块按关联关系查询" },
            { label: "权限", value: "管理员/操作人员可查看；属性维护在属性管理模块完成，不在此页提供编辑" },
          ]}
          wrapClassName="flex flex-shrink-0"
        >
          <div className="w-[380px] flex-shrink-0 admin-card overflow-hidden flex flex-col">
            <PipelineDetailPanel
              pipeline={currentPipeline}
              onClose={() => setSelectedPipelineId(null)}
            />
          </div>
        </DevNote>
      </div>

      {/* 底部：关联信息区 */}
      <DevNote
        id="pipeline-bottom"
        title="底部关联信息区（层级统计）"
        summary="按当前筛选范围统计模型图/清单统计/管路长度/规格材质/管件统计"
        items={[
          { label: "数据来源", value: "scopePipelines（当前筛选结果）+ scopeLabel（全部管路或节点名称）；管件统计按管路 components 数组按类型汇总 quantity" },
          { label: "交互逻辑", value: "标题栏「层级统计」+ 收起/展开统计按钮（默认展开）；模型图卡片点击提示「查看管道模型大图」，其余卡片仅展示" },
          { label: "后续步骤", value: "正式系统：按选中层级统计管路总数/用途数/系统数/总长度/规格材质分布/管件数量" },
          { label: "权限", value: "管理员/操作人员可见" },
        ]}
        wrapClassName="block flex-shrink-0"
      >
        <PipelineBottomPanel
          pipeline={currentPipeline}
          scopePipelines={filteredData}
          scopeLabel={treeFilter.nodeName || "全部管路"}
        />
      </DevNote>
    </div>
  );
}
