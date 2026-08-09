// 结构树工具模块：设备结构树 + 管路结构树（基于真实电厂KKS编码数据）
import equipmentRawNodes from './equipmentStructureTree.json';
import pipelineRawNodes from './pipelineStructureTree.json';

// ===== 类型定义 =====
export type TreeType = 'equipment' | 'pipeline';

export interface RawNode {
  id: number;
  parentId: number;
  level: string;        // 一级/二级/三级/四级
  category: string;     // 设备/管路/系统目录
  name: string;
  typeCode: string;
  kks: string;
  sort: number;
}

export type NodeLevel = 'L1' | 'L2' | 'L3' | 'L4';

export interface TreeNode {
  id: number;
  parentId: number;
  level: NodeLevel;
  category: 'equipment' | 'pipeline' | 'system';  // 设备/管路/系统目录
  name: string;
  kks: string;
  sort: number;
  childCount: number;     // 直接子节点数
  descendantCount: number; // 所有后代数
  equipmentCount: number;  // 末级设备/管路数
  children?: TreeNode[];
}

// ===== 层级映射 =====
const levelMap: Record<string, NodeLevel> = {
  '一级': 'L1',
  '二级': 'L2',
  '三级': 'L3',
  '四级': 'L4',
};

// ===== 数据源 =====
const dataSources: Record<TreeType, RawNode[]> = {
  equipment: equipmentRawNodes as RawNode[],
  pipeline: pipelineRawNodes as RawNode[],
};

// 叶子节点类别（用于统计末级数量）
const leafCategories: Record<TreeType, string[]> = {
  equipment: ['设备'],
  pipeline: ['管路'],
};

// ===== 统计每个节点的后代数和设备/管路数 =====
function computeCounts(raw: RawNode[], leafCats: string[]): Map<number, { descendant: number; equipment: number }> {
  const counts = new Map<number, { descendant: number; equipment: number }>();
  raw.forEach((n) => counts.set(n.id, { descendant: 0, equipment: 0 }));
  const childMap = new Map<number, number[]>();
  raw.forEach((n) => {
    if (n.parentId >= 0) {
      if (!childMap.has(n.parentId)) childMap.set(n.parentId, []);
      childMap.get(n.parentId)!.push(n.id);
    }
  });
  raw.forEach((n) => {
    const hasChild = childMap.has(n.id) && childMap.get(n.id)!.length > 0;
    if (!hasChild && leafCats.includes(n.category)) {
      counts.set(n.id, { descendant: 0, equipment: 1 });
    }
  });
  const sorted = [...raw].sort((a, b) => b.id - a.id);
  sorted.forEach((n) => {
    if (n.parentId > 0) {
      const parent = counts.get(n.parentId);
      const self = counts.get(n.id);
      if (parent && self) {
        parent.descendant += 1 + self.descendant;
        parent.equipment += self.equipment;
      }
    }
  });
  return counts;
}

const countsCache: Record<TreeType, Map<number, { descendant: number; equipment: number }>> = {
  equipment: computeCounts(dataSources.equipment, leafCategories.equipment),
  pipeline: computeCounts(dataSources.pipeline, leafCategories.pipeline),
};

// ===== 构建树 =====
export function buildStructureTree(treeType: TreeType = 'equipment'): TreeNode[] {
  const raw = dataSources[treeType];
  const counts = countsCache[treeType];
  const leafCats = leafCategories[treeType];

  const childMap = new Map<number, RawNode[]>();
  raw.forEach((n) => {
    if (n.parentId >= 0) {
      if (!childMap.has(n.parentId)) childMap.set(n.parentId, []);
      childMap.get(n.parentId)!.push(n);
    }
  });

  const build = (parentId: number): TreeNode[] => {
    const children = childMap.get(parentId) || [];
    return children
      .sort((a, b) => a.sort - b.sort)
      .map((n) => {
        const c = counts.get(n.id) || { descendant: 0, equipment: 0 };
        const nodeChildren = build(n.id);
        const category: TreeNode['category'] = leafCats.includes(n.category)
          ? (treeType === 'equipment' ? 'equipment' : 'pipeline')
          : 'system';
        return {
          id: n.id,
          parentId: n.parentId,
          level: levelMap[n.level] || 'L1',
          category,
          name: n.name,
          kks: n.kks,
          sort: n.sort,
          childCount: nodeChildren.length,
          descendantCount: c.descendant,
          equipmentCount: c.equipment,
          children: nodeChildren.length > 0 ? nodeChildren : undefined,
        };
      });
  };

  return build(0);
}

// ===== 查询函数（纯函数，适用于任意TreeNode[]） =====
export function findNode(nodes: TreeNode[], id: number): TreeNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children) {
      const found = findNode(n.children, id);
      if (found) return found;
    }
  }
  return null;
}

// 获取所有后代ID
export function getDescendantIds(nodes: TreeNode[], id: number): number[] {
  const node = findNode(nodes, id);
  if (!node || !node.children) return [];
  const ids: number[] = [];
  const walk = (n: TreeNode) => {
    n.children?.forEach((c) => {
      ids.push(c.id);
      walk(c);
    });
  };
  walk(node);
  return ids;
}

// 获取节点路径（从根到该节点）
export function getNodePath(nodes: TreeNode[], id: number): TreeNode[] {
  const path: TreeNode[] = [];
  const find = (arr: TreeNode[], targetId: number): boolean => {
    for (const n of arr) {
      if (n.id === targetId) {
        path.push(n);
        return true;
      }
      if (n.children && find(n.children, targetId)) {
        path.unshift(n);
        return true;
      }
    }
    return false;
  };
  find(nodes, id);
  return path;
}

// 搜索匹配的节点key集合（含祖先）
export function collectMatchKeys(nodes: TreeNode[], keyword: string): Set<number> {
  const result = new Set<number>();
  const kw = keyword.trim().toLowerCase();
  if (!kw) return result;
  const walk = (n: TreeNode): boolean => {
    let childMatch = false;
    n.children?.forEach((c) => { if (walk(c)) childMatch = true; });
    const selfMatch = n.name.toLowerCase().includes(kw) || n.kks.toLowerCase().includes(kw);
    if (selfMatch || childMatch) {
      result.add(n.id);
      return true;
    }
    return false;
  };
  nodes.forEach((n) => walk(n));
  return result;
}

// ===== 统计信息 =====
export function getTreeStats(treeType: TreeType = 'equipment') {
  const raw = dataSources[treeType];
  const leafCats = leafCategories[treeType];
  const l1 = raw.filter((n) => n.level === '一级').length;
  const l2 = raw.filter((n) => n.level === '二级').length;
  const l3 = raw.filter((n) => n.level === '三级').length;
  const l4 = raw.filter((n) => n.level === '四级').length;
  const leaf = raw.filter((n) => leafCats.includes(n.category)).length;
  const system = raw.filter((n) => n.category === '系统目录').length;
  return { total: raw.length, l1, l2, l3, l4, equipment: leaf, system };
}

// 获取一级分类列表
export function getRootCategories(treeType: TreeType = 'equipment'): RawNode[] {
  return dataSources[treeType]
    .filter((n) => n.level === '一级')
    .sort((a, b) => a.sort - b.sort);
}

// 根据KKS前缀查找节点
export function findByKksPrefix(nodes: TreeNode[], prefix: string): TreeNode | null {
  const kw = prefix.trim().toUpperCase();
  if (!kw) return null;
  const find = (arr: TreeNode[]): TreeNode | null => {
    for (const n of arr) {
      if (n.kks.toUpperCase() === kw) return n;
      if (n.children) {
        const found = find(n.children);
        if (found) return found;
      }
    }
    return null;
  };
  return find(nodes);
}

// 获取原始数据（供管理页面使用）
export function getRawNodes(treeType: TreeType = 'equipment'): RawNode[] {
  return dataSources[treeType];
}
