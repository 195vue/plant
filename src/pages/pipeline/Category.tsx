import { useState, useMemo } from "react";
import {
  pipelines as mockPipelines,
} from "@/mock";
import type { Pipeline } from "@/types";
import { StatusTag } from "@/components/common/Tag";
import PipelineDetailPanel from "./components/PipelineDetailPanel";
import PipelineBottomPanel from "./components/PipelineBottomPanel";
import StructureTreeSelect, { type TreeSelectFilter } from "@/components/common/StructureTreeSelect";
import { buildStructureTree, findNode } from "@/mock/structureTree";

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

        {/* 中间：管路表格 */}
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
                  <th className="px-3 py-2 text-center font-medium whitespace-nowrap">运行状态</th>
                  <th className="px-3 py-2 text-center font-medium whitespace-nowrap">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-admin-muted">暂无管路数据</td>
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
                    <td className="px-3 py-2 text-center"><StatusTag status={p.status || "stopped"} /></td>
                    <td className="px-3 py-2 text-center">
                      <button className="text-blue-500 hover:underline" onClick={(e) => { e.stopPropagation(); handleSelectPipeline(p.id); }}>查看</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 右侧：详情面板 */}
        <div className="w-[380px] flex-shrink-0 admin-card overflow-hidden flex flex-col">
          <PipelineDetailPanel
            pipeline={currentPipeline}
            onClose={() => setSelectedPipelineId(null)}
          />
        </div>
      </div>

      {/* 底部：关联信息区 */}
      <PipelineBottomPanel pipeline={currentPipeline} />
    </div>
  );
}
