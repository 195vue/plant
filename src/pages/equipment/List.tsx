import { useState, useMemo } from "react";
import { Box, AlertCircle, Wrench, Power } from "lucide-react";
import { equipments as mockEquipments } from "@/mock";
import type { Equipment } from "@/types";
import { StatusTag } from "@/components/common/Tag";
import EquipmentDetailPanel from "./components/EquipmentDetailPanel";
import EquipmentBottomPanel from "./components/EquipmentBottomPanel";
import StructureTreeSelect, { type TreeSelectFilter } from "@/components/common/StructureTreeSelect";
import { buildStructureTree, findNode } from "@/mock/structureTree";
import { DevNote } from "@/components/devNotes/DevNote";

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
      <DevNote
        id="equipment-status-bar"
        title="设备状态统计栏"
        summary="展示当前筛选范围设备总数及运行/停止/故障/检修数量"
        items={[
          { label: "数据来源", value: "statusStats：由 filteredData（当前筛选结果）按 status 字段统计 total/running/stopped/fault/maintenance" },
          { label: "交互逻辑", value: "纯统计展示，不设置点击；统计值随结构树节点选择和单设备选择同步变化" },
          { label: "后续步骤", value: "正式系统：由设备数字化后台接口按筛选条件返回状态计数" },
          { label: "权限", value: "管理员/操作人员可见" },
        ]}
        wrapClassName="block flex-shrink-0"
      >
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
      </DevNote>

      {/* 三栏布局：结构树 + 表格 + 详情 */}
      <div className="flex gap-3 flex-1 min-h-0">
        {/* 左侧：结构树 */}
        <DevNote
          id="equipment-tree"
          title="设备结构树"
          summary="按KKS编码体系四级定位设备，点击节点筛选设备列表"
          items={[
            { label: "数据来源", value: "buildStructureTree('equipment')（mock/structureTree）；节点含 id/parentId/level/category/name/kks/sort" },
            { label: "校验规则", value: "搜索框「搜索名称/KKS」实时模糊匹配节点名称或KKS编码，保留命中节点及祖先" },
            { label: "交互逻辑", value: "点击节点主体 → handleTreeSelect：收集节点及后代KKS编码组成前缀集合，按前缀筛选设备；点击展开标识仅展开/收起不筛选；有子节点时点击主体同时展开" },
            { label: "后续步骤", value: "正式系统：由结构树服务按位置→系统→子系统→设备返回层级数据" },
            { label: "权限", value: "管理员/操作人员可筛选查看" },
          ]}
          wrapClassName="flex flex-shrink-0"
        >
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
        </DevNote>

        {/* 中间：设备表格 */}
        <DevNote
          id="equipment-list"
          title="设备列表"
          summary="展示当前筛选结果设备，支持选择单设备查看详情"
          items={[
            { label: "数据来源", value: "filteredData：按 treeFilter 规则筛选 mockEquipments（设备ID精确/前缀集合/节点名称匹配/全部）" },
            { label: "字段", value: "设备编码/设备名称/运行状态（运行/停止/故障/检修）/编码状态（已挂接/未挂接）/操作（查看）" },
            { label: "交互逻辑", value: "标题区显示「共N条·筛选说明」（全部设备/节点名称（结构树节点）/设备名称（单设备））；点击行或「查看」→ handleSelectEquipment 进入单设备筛选，右侧详情与底部5卡联动" },
            { label: "后续步骤", value: "正式系统：设备列表由设备数字化后台接口按筛选条件分页返回" },
            { label: "权限", value: "管理员/操作人员可查看；本页不提供新增/编辑/删除/导入/导出" },
          ]}
          wrapClassName="flex flex-1 min-w-[300px]"
        >
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
        </DevNote>

        {/* 右侧：详情面板 */}
        <DevNote
          id="equipment-detail"
          title="设备详情面板"
          summary="展示当前设备基本信息/属性资料/图纸资料三个页签"
          items={[
            { label: "数据来源", value: "currentEquip（当前筛选结果第一条或单设备选择）；属性资料来自设备关联属性集合，图纸资料按 关联对象类型=设备 且 关联对象ID=当前设备ID 查询" },
            { label: "交互逻辑", value: "头部显示设备类型/名称/编码；三个页签切换（基本信息/属性资料/图纸资料），切换页签保留设备，切换设备保留页签；「×」关闭显式选择后继续显示筛选结果第一条" },
            { label: "后续步骤", value: "正式系统：基础信息由设备接口返回，属性由属性管理模块读取模板+实例值，图纸由图纸管理模块按关联关系查询" },
            { label: "权限", value: "管理员/操作人员可查看；属性维护在属性管理模块完成，不在此页提供编辑" },
          ]}
          wrapClassName="flex flex-shrink-0"
        >
          <div className="w-[380px] flex-shrink-0 admin-card overflow-hidden flex flex-col">
            <EquipmentDetailPanel
              equipment={currentEquip}
              onClose={() => setSelectedEquipId(null)}
            />
          </div>
        </DevNote>
      </div>

      {/* 底部：关联信息区 */}
      <DevNote
        id="equipment-bottom"
        title="底部关联信息区（层级统计）"
        summary="按当前筛选范围统计模型图/清单统计/设备类型构成/运行状态/KKS编码挂接"
        items={[
          { label: "数据来源", value: "scopeEquipments（当前筛选结果）+ scopeLabel（全部设备或节点名称）；管件/类型/系统/挂接率由数组 reduce 实时计算" },
          { label: "交互逻辑", value: "标题栏「层级统计」+ 收起/展开统计按钮（默认展开）；模型图卡片点击提示「查看3D模型大图」，其余卡片仅展示" },
          { label: "后续步骤", value: "正式系统：按选中层级统计设备总数/类型数/系统数/运行状态分布/编码挂接率" },
          { label: "权限", value: "管理员/操作人员可见" },
        ]}
        wrapClassName="block flex-shrink-0"
      >
        <EquipmentBottomPanel
          equipment={currentEquip}
          scopeEquipments={filteredData}
          scopeLabel={treeFilter.nodeName || "全部设备"}
        />
      </DevNote>
    </div>
  );
}
