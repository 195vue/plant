import { useState, useMemo } from "react";
import { Box, AlertCircle, Wrench, Power } from "lucide-react";
import { equipments as mockEquipments } from "@/mock";
import type { Equipment } from "@/types";
import { StatusTag } from "@/components/common/Tag";
import EquipmentDetailPanel from "./components/EquipmentDetailPanel";
import EquipmentBottomPanel from "./components/EquipmentBottomPanel";
import StructureTreeSelect, { type TreeSelectFilter } from "@/components/common/StructureTreeSelect";
import { buildStructureTree, findNode } from "@/mock/structureTree";

interface TreeFilter {
  nodeId?: number;
  nodeName?: string;
  kks?: string;
  equipmentId?: number;
  descendantIds?: number[];
}

export default function EquipmentList() {
  const [data, setData] = useState<Equipment[]>(mockEquipments);
  const [treeFilter, setTreeFilter] = useState<TreeFilter>({});
  const [selectedEquipId, setSelectedEquipId] = useState<number | null>(null);

  // 构建选中节点及其所有后代的KKS前缀集合
  const kksPrefixes = useMemo(() => {
    if (!treeFilter.nodeId) return [];
    const tree = buildStructureTree("equipment");
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
    if (treeFilter.equipmentId) {
      list = list.filter((e) => e.id === treeFilter.equipmentId);
    } else if (kksPrefixes.length > 0) {
      list = list.filter((e) => {
        const code = e.code.toUpperCase();
        return kksPrefixes.some((prefix) => code.startsWith(prefix));
      });
    } else if (treeFilter.nodeName) {
      const kw = treeFilter.nodeName.toLowerCase();
      list = list.filter((e) =>
        e.system.toLowerCase().includes(kw) ||
        e.location.toLowerCase().includes(kw) ||
        e.name.toLowerCase().includes(kw) ||
        e.code.toLowerCase().includes(kw)
      );
    }
    return list;
  }, [data, treeFilter, kksPrefixes]);

  const currentEquip = useMemo(() => {
    if (selectedEquipId !== null) {
      const found = data.find((e) => e.id === selectedEquipId);
      if (found) return found;
    }
    return filteredData[0] || null;
  }, [filteredData, selectedEquipId, data]);

  const filterLabel = useMemo(() => {
    if (treeFilter.equipmentId) {
      const eq = data.find((e) => e.id === treeFilter.equipmentId);
      return eq ? `${eq.name}（单设备）` : "";
    }
    if (treeFilter.nodeName) return `${treeFilter.nodeName}（结构树节点）`;
    return "全部设备";
  }, [treeFilter, data]);

  const handleTreeSelect = (filter: TreeSelectFilter) => {
    setTreeFilter({
      nodeId: filter.nodeId,
      nodeName: filter.name,
      kks: filter.kks,
      descendantIds: filter.descendantIds,
    });
    setSelectedEquipId(null);
  };

  const handleSelectEquipment = (id: number) => {
    setSelectedEquipId(id);
    setTreeFilter({ equipmentId: id });
  };

  // 设备状态统计
  const statusStats = useMemo(() => {
    const total = filteredData.length;
    const running = filteredData.filter((e) => e.status === "running").length;
    const stopped = filteredData.filter((e) => e.status === "stopped").length;
    const fault = filteredData.filter((e) => e.status === "fault").length;
    const maintenance = filteredData.filter((e) => e.status === "maintenance").length;
    return { total, running, stopped, fault, maintenance };
  }, [filteredData]);

  return (
    <div className="h-full flex flex-col gap-3">
      {/* 统计栏 */}
      <div className="flex items-center gap-4 px-4 py-2 admin-card flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <Box size={14} className="text-blue-500" />
          <span className="text-xs text-admin-muted">设备总数</span>
          <span className="text-sm font-semibold text-admin-text">{statusStats.total}</span>
        </div>
        <span className="text-admin-border">|</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs text-admin-muted">运行中</span>
          <span className="text-sm font-semibold text-green-600">{statusStats.running}</span>
        </div>
        <span className="text-admin-border">|</span>
        <div className="flex items-center gap-1.5">
          <Power size={14} className="text-gray-400" />
          <span className="text-xs text-admin-muted">已停机</span>
          <span className="text-sm font-semibold text-gray-600">{statusStats.stopped}</span>
        </div>
        <span className="text-admin-border">|</span>
        <div className="flex items-center gap-1.5">
          <AlertCircle size={14} className="text-red-500" />
          <span className="text-xs text-admin-muted">故障</span>
          <span className="text-sm font-semibold text-red-600">{statusStats.fault}</span>
        </div>
        <span className="text-admin-border">|</span>
        <div className="flex items-center gap-1.5">
          <Wrench size={14} className="text-orange-500" />
          <span className="text-xs text-admin-muted">检修中</span>
          <span className="text-sm font-semibold text-orange-600">{statusStats.maintenance}</span>
        </div>
      </div>

      {/* 三栏布局：结构树 + 表格 + 详情 */}
      <div className="flex gap-3 flex-1 min-h-0">
        {/* 左侧：结构树 */}
        <div className="w-[240px] flex-shrink-0 admin-card flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-admin-border bg-gray-50">
            <h3 className="text-xs font-semibold text-admin-text">设备结构树</h3>
            <div className="text-[10px] text-admin-muted mt-0.5">基于KKS编码体系</div>
          </div>
          <div className="flex-1 overflow-hidden">
            <StructureTreeSelect
              selectedNodeId={treeFilter.nodeId}
              onSelect={handleTreeSelect}
              title="设备结构树"
              treeType="equipment"
            />
          </div>
        </div>

        {/* 中间：设备表格 */}
        <div className="flex-1 min-w-[300px] admin-card overflow-hidden flex flex-col">
          <div className="px-3 py-2 border-b border-admin-border bg-gray-50 flex items-center justify-between">
            <span className="text-xs font-semibold text-admin-text">设备列表</span>
            <span className="text-xs text-admin-muted">共 {filteredData.length} 条 · {filterLabel}</span>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-gray-50 z-10">
                <tr className="text-admin-muted border-b border-admin-border">
                  <th className="px-3 py-2 text-left font-medium whitespace-nowrap">设备编码</th>
                  <th className="px-3 py-2 text-left font-medium whitespace-nowrap">设备名称</th>
                  <th className="px-3 py-2 text-center font-medium whitespace-nowrap">运行状态</th>
                  <th className="px-3 py-2 text-center font-medium whitespace-nowrap">编码状态</th>
                  <th className="px-3 py-2 text-center font-medium whitespace-nowrap">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-admin-muted">暂无设备数据</td>
                  </tr>
                ) : filteredData.map((eq) => (
                  <tr
                    key={eq.id}
                    className={`border-b border-admin-border cursor-pointer transition-colors ${
                      currentEquip?.id === eq.id ? "bg-blue-50" : "hover:bg-gray-50"
                    }`}
                    onClick={() => handleSelectEquipment(eq.id)}
                  >
                    <td className="px-3 py-2 font-mono text-admin-text">{eq.code}</td>
                    <td className="px-3 py-2 text-admin-text">{eq.name}</td>
                    <td className="px-3 py-2 text-center"><StatusTag status={eq.status} /></td>
                    <td className="px-3 py-2 text-center"><StatusTag status={eq.codeStatus} /></td>
                    <td className="px-3 py-2 text-center">
                      <button className="text-blue-500 hover:underline" onClick={(e) => { e.stopPropagation(); handleSelectEquipment(eq.id); }}>查看</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 右侧：详情面板 */}
        <div className="w-[380px] flex-shrink-0 admin-card overflow-hidden flex flex-col">
          <EquipmentDetailPanel
            equipment={currentEquip}
            onClose={() => setSelectedEquipId(null)}
          />
        </div>
      </div>

      {/* 底部：关联信息区 */}
      <EquipmentBottomPanel
        equipment={currentEquip}
      />
    </div>
  );
}
