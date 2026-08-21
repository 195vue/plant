import { useState, useMemo, useRef, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  ChevronRight,
  ChevronDown,
  Search,
  Settings,
  Box,
  FolderTree,
  RefreshCw,
  Layers,
  Cpu,
  Building2,
  FileText,
  Filter,
  SortAsc,
  ArrowUpDown,
  GripVertical,
  CheckCircle2,
  AlertCircle,
  X,
  FileSpreadsheet,
  Eye,
  GitBranch,
} from "lucide-react";
import { Modal, ConfirmModal } from "@/components/common/Modal";
import { FormItem, UploadBox } from "@/components/common/UploadBox";
import { Tag } from "@/components/common/Tag";
import { message } from "@/components/common/Message";
import {
  buildStructureTree,
  findNode,
  getDescendantIds,
  getNodePath,
  collectMatchKeys,
  getTreeStats,
  collectSubtreeIds,
  buildSubTreeFromNodes,
  countNodes,
  type TreeNode,
  type NodeLevel,
  type TreeType,
} from "@/mock/structureTree";
import { DevNote } from "@/components/devNotes/DevNote";

// 层级配置
const levelConfig: Record<NodeLevel, { label: string; color: any; icon: React.ReactNode }> = {
  L1: { label: "一级", color: "blue", icon: <Layers size={13} className="text-blue-500" /> },
  L2: { label: "二级", color: "cyan", icon: <FolderTree size={13} className="text-cyan-500" /> },
  L3: { label: "三级", color: "purple", icon: <Box size={13} className="text-purple-500" /> },
  L4: { label: "四级", color: "orange", icon: <Cpu size={13} className="text-orange-500" /> },
};

const getCategoryColumnLabel = (treeType: TreeType) => {
  if (treeType === "total") return "节点分类";
  return treeType === "equipment" ? "设备分类" : "管路分类";
};

const getNodeCategoryLabel = (category: TreeNode["category"]) => {
  if (category === "equipment") return "设备";
  if (category === "pipeline") return "管路";
  return "系统目录";
};

const getTreeTitle = (treeType: TreeType) => {
  if (treeType === "total") return "总结构树";
  return treeType === "equipment" ? "设备结构树" : "管路结构树";
};

const getTreeLeafLabel = (treeType: TreeType) => {
  if (treeType === "total") return "末级";
  return treeType === "equipment" ? "设备" : "管路";
};

const getTemplateCsv = (treeType: TreeType) => {
  if (treeType === "total") {
    return [
      "节点名称,KKS编码,父节点KKS,节点分类,层级,排序号",
      "1号机组,1,,系统目录,一级,1",
      "1号机组水泵水轮机,1MFA,1,系统目录,二级,1",
      "1号机组转轮,1MFA10HB001,1MFA,设备,四级,1",
      "技术供水系统,1SVA,,系统目录,一级,2",
      "1号机冷却水主管,1SVA10BR001A,1SVA10BR001,管路,四级,1",
    ].join("\n");
  }
  const objectCategory = treeType === "equipment" ? "设备" : "管路";
  const examples = treeType === "equipment"
    ? [
        "1号机组,1,,系统目录,一级,1",
        "1号机组水泵水轮机,1MFA,1,系统目录,二级,1",
        "1号机组转动部件,1MFA10,1MFA,系统目录,三级,1",
        `1号机组转轮,1MFA10HB001,1MFA10,${objectCategory},四级,1`,
      ]
    : [
        "技术供水系统,1SVA,,系统目录,一级,1",
        "1号机技术供水,1SVA10,1SVA,系统目录,二级,1",
        "冷却水支路,1SVA10BR001,1SVA10,系统目录,三级,1",
        `冷却水主管,1SVA10BR001A,1SVA10BR001,${objectCategory},四级,1`,
      ];

  return [
    "节点名称,KKS编码,父节点KKS,节点分类,层级,排序号",
    ...examples,
  ].join("\n");
};

export default function StructureTreeManage() {
  const [treeType, setTreeType] = useState<TreeType>("total");
  // 总结构树（设备+管路合并）与由勾选节点派生的设备/管路子树
  const totalTree = useMemo(() => buildStructureTree("total"), []);
  // 勾选节点集合（级联：勾选上级节点时其下所有子孙节点一并纳入）
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<number>>(new Set());
  const [deriveMode, setDeriveMode] = useState<"select" | "result">("select");

  // 复选框显示状态：checked=节点被选中（含整支级联）；indeterminate=仅部分后代被选中
  const [checkedIds, indeterminateIds] = useMemo(() => {
    const checked = new Set<number>();
    const indeterminate = new Set<number>();
    const hasSelectedDesc = (n: TreeNode): boolean =>
      (n.children?.some((c) => selectedNodeIds.has(c.id) || hasSelectedDesc(c))) ?? false;
    const allDescSelected = (n: TreeNode): boolean => {
      if (!n.children || n.children.length === 0) return false;
      return n.children.every((c) => selectedNodeIds.has(c.id) && allDescSelected(c));
    };
    const walk = (nodes: TreeNode[]) => {
      nodes.forEach((n) => {
        if (selectedNodeIds.has(n.id)) {
          checked.add(n.id);
        } else if (allDescSelected(n)) {
          checked.add(n.id);
        } else if (hasSelectedDesc(n)) {
          indeterminate.add(n.id);
        }
        if (n.children) walk(n.children);
      });
    };
    walk(totalTree);
    return [checked, indeterminate];
  }, [totalTree, selectedNodeIds]);

  const subtree = useMemo(
    () => buildSubTreeFromNodes(totalTree, selectedNodeIds),
    [totalTree, selectedNodeIds]
  );
  const displayTree = treeType === "total" ? totalTree : subtree;
  const subtreeCount = useMemo(() => countNodes(subtree), [subtree]);
  const subtreeLeafCount = useMemo(() => {
    let count = 0;
    const walk = (nodes: TreeNode[]) =>
      nodes.forEach((n) => {
        if (!n.children || n.children.length === 0) count += 1;
        else walk(n.children);
      });
    walk(subtree);
    return count;
  }, [subtree]);

  // 设备/管路子树勾选结果持久化：切换 tab 或刷新后仍显示已生成的树
  const getSavedState = (t: TreeType) => {
    try {
      const raw = localStorage.getItem(`structureTree.${t}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ids: new Set<number>(Array.isArray(parsed.ids) ? parsed.ids : []),
          mode: parsed.mode === "result" ? "result" as const : "select" as const,
        };
      }
    } catch { /* 忽略异常 */ }
    return { ids: new Set<number>(), mode: "select" as const };
  };

  useEffect(() => {
    if (treeType === "total") return;
    localStorage.setItem(
      `structureTree.${treeType}`,
      JSON.stringify({ ids: [...selectedNodeIds], mode: deriveMode })
    );
  }, [selectedNodeIds, deriveMode, treeType]);

  const stats = useMemo(() => getTreeStats(treeType), [treeType]);
  const leafLabel = getTreeLeafLabel(treeType);
  const treeTitle = getTreeTitle(treeType);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<Set<number>>(new Set([1, 2, 3]));
  const [keyword, setKeyword] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [listKeyword, setListKeyword] = useState("");
  const [listLevelFilter, setListLevelFilter] = useState<string>("");
  const [listCategoryFilter, setListCategoryFilter] = useState<string>("");
  const [listSortBy, setListSortBy] = useState<"sort" | "name" | "kks">("sort");
  const [listSortAsc, setListSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const [editOpen, setEditOpen] = useState(false);
  const [editNode, setEditNode] = useState<TreeNode | null>(null);
  const [isAddChild, setIsAddChild] = useState(false);
  const [isAddRoot, setIsAddRoot] = useState(false);
  const [form, setForm] = useState({ name: "", kks: "", sort: 0 });
  const [deleteNode, setDeleteNode] = useState<TreeNode | null>(null);
  const [batchDeleteIds, setBatchDeleteIds] = useState<number[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const importFileRef = useRef<HTMLInputElement>(null);

  const matchKeys = useMemo(() => collectMatchKeys(displayTree, keyword), [keyword, displayTree]);
  const selectedNode = useMemo(() => (selectedId ? findNode(displayTree, selectedId) : null), [selectedId, displayTree]);
  const nodePath = useMemo(() => (selectedId ? getNodePath(displayTree, selectedId) : []), [selectedId, displayTree]);

  // 计算左侧树选中节点的所有后代ID集合，用于筛选中间列表
  const filteredNodeIds = useMemo(() => {
    if (!selectedId) return null;
    const descendants = getDescendantIds(displayTree, selectedId);
    return new Set<number>([selectedId, ...descendants]);
  }, [selectedId, displayTree]);

  const filteredDescendantCount = useMemo(() => {
    if (!selectedNode) return 0;
    return selectedNode.descendantCount + 1;
  }, [selectedNode]);

  const handleToggle = (id: number) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelect = (node: TreeNode) => {
    setSelectedId(node.id);
    setCurrentPage(1);
    if (node.children && node.children.length > 0 && !expandedKeys.has(node.id)) {
      handleToggle(node.id);
    }
  };

  const handleExpandAll = (nodes?: TreeNode[]) => {
    const all = new Set<number>();
    const walk = (ns: TreeNode[]) => {
      ns.forEach((n) => {
        if (n.children && n.children.length > 0) {
          all.add(n.id);
          walk(n.children);
        }
      });
    };
    walk(nodes || displayTree);
    setExpandedKeys(all);
  };

  const handleCollapseAll = () => setExpandedKeys(new Set());

  const handleAddChild = (parent: TreeNode) => {
    setEditNode(parent);
    setIsAddChild(true);
    setIsAddRoot(false);
    const siblings = parent.children || [];
    setForm({ name: "", kks: "", sort: siblings.length + 1 });
    setEditOpen(true);
  };

  const handleAddRoot = () => {
    setEditNode(null);
    setIsAddChild(false);
    setIsAddRoot(true);
    setForm({ name: "", kks: "", sort: stats.l1 + 1 });
    setEditOpen(true);
  };

  const handleEdit = (node: TreeNode) => {
    setEditNode(node);
    setIsAddChild(false);
    setIsAddRoot(false);
    setForm({
      name: node.name,
      kks: node.kks,
      sort: node.sort,
    });
    setEditOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return message.warning("请填写节点名称");
    // 根据层级自动推断节点分类
    let level: NodeLevel;
    if (isAddRoot) {
      level = "L1";
    } else if (isAddChild && editNode) {
      const parentLevel = parseInt(editNode.level.slice(1));
      const childLevel = Math.min(4, parentLevel + 1);
      level = `L${childLevel}` as NodeLevel;
    } else if (editNode) {
      level = editNode.level;
    } else {
      level = "L1";
    }
    const category: TreeNode["category"] = level === "L4"
      ? (treeType === "equipment" ? "equipment" : "pipeline")
      : "system";

    if (isAddChild && editNode) {
      message.success(`已在「${editNode.name}」下新增${levelConfig[level]?.label}节点「${form.name}」（分类：${getNodeCategoryLabel(category)}）`);
    } else if (isAddRoot) {
      message.success(`已新增一级节点「${form.name}」`);
    } else if (editNode) {
      message.success(`节点「${form.name}」已更新`);
    }
    setEditOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!deleteNode) return;
    message.success(`已删除节点「${deleteNode.name}」及 ${deleteNode.descendantCount} 个子节点`);
    setDeleteNode(null);
    if (selectedId === deleteNode.id) setSelectedId(null);
  };

  const handleBatchDelete = () => {
    setBatchDeleteIds(Array.from(selectedIds));
  };

  const handleConfirmBatchDelete = () => {
    message.success(`已批量删除 ${batchDeleteIds.length} 个节点`);
    setBatchDeleteIds([]);
    setSelectedIds(new Set());
  };

  const toggleSelectOne = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (ids: number[]) => {
    const allSelected = ids.length > 0 && ids.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  // 导出导入模板
  const handleDownloadTemplate = () => {
    const blob = new Blob(["\ufeff" + getTemplateCsv(treeType)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "结构树导入模板.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success("模板下载成功");
  };

  const handleImport = () => {
    setImportOpen(true);
    setImportFile(null);
    setImportPreview([]);
  };

  const handleImportFileChange = (file: File | null) => {
    setImportFile(file);
    if (file) {
      const sample = treeType === "equipment"
        ? [
            { name: "3号机组", kks: "3", parentKks: "", category: "系统目录", level: "一级", sort: 3, status: "可导入" },
            { name: "3号机组水泵水轮机", kks: "3MFA", parentKks: "3", category: "系统目录", level: "二级", sort: 1, status: "可导入" },
            { name: "3号机组转轮", kks: "3MFA10HB001", parentKks: "3MFA", category: "设备", level: "四级", sort: 1, status: "可导入" },
          ]
        : treeType === "total"
        ? [
            { name: "3号机组", kks: "3", parentKks: "", category: "系统目录", level: "一级", sort: 3, status: "可导入" },
            { name: "3号机组水泵水轮机", kks: "3MFA", parentKks: "3", category: "系统目录", level: "二级", sort: 1, status: "可导入" },
            { name: "3号机组转轮", kks: "3MFA10HB001", parentKks: "3MFA", category: "设备", level: "四级", sort: 1, status: "可导入" },
            { name: "3号机冷却水主管", kks: "3SVA10BR001", parentKks: "3SVA10", category: "管路", level: "四级", sort: 1, status: "可导入" },
          ]
        : [
            { name: "技术供水系统", kks: "3SVA", parentKks: "", category: "系统目录", level: "一级", sort: 3, status: "可导入" },
            { name: "3号机技术供水", kks: "3SVA10", parentKks: "3SVA", category: "系统目录", level: "二级", sort: 1, status: "可导入" },
            { name: "3号机冷却水主管", kks: "3SVA10BR001", parentKks: "3SVA10", category: "管路", level: "四级", sort: 1, status: "可导入" },
          ];
      setImportPreview(sample);
      message.success(`已读取文件「${file.name}」，共 ${sample.length} 条待导入数据`);
    }
  };

  const handleConfirmImport = () => {
    if (!importFile) return message.warning("请先选择导入文件");
    message.success(`导入成功，共新增 ${importPreview.length} 个节点`);
    setImportOpen(false);
  };

  // 移动节点排序
  const handleMoveNode = (node: TreeNode, direction: "up" | "down") => {
    message.info(`已将节点「${node.name}」${direction === "up" ? "上移" : "下移"}`);
  };

  // 复制节点
  const handleCopyNode = (node: TreeNode) => {
    message.success(`已复制节点「${node.name}」及其子节点`);
  };

  // ===== 总结构树/设备/管路 tab 切换（恢复各自已保存的勾选与生成状态） =====
  const switchTreeType = (t: TreeType) => {
    setTreeType(t);
    setSelectedId(null);
    setSelectedIds(new Set());
    const saved = getSavedState(t);
    setSelectedNodeIds(saved.ids);
    setDeriveMode(saved.mode);
    setKeyword("");
    setListKeyword("");
    setListLevelFilter("");
    setListCategoryFilter("");
    setCurrentPage(1);
    // 选择态且已有勾选时，展开已勾选节点的祖先链，便于直接查看
    if (saved.mode === "select" && saved.ids.size > 0) {
      const keys = new Set<number>();
      saved.ids.forEach((id) =>
        getNodePath(totalTree, id).slice(0, -1).forEach((n) => keys.add(n.id))
      );
      setExpandedKeys(keys);
    } else {
      setExpandedKeys(new Set([1, 2, 3]));
    }
  };

  // ===== 设备/管路结构树：级联勾选（勾选上级节点=其下所有子孙节点一并选中；取消=取消该节点整棵子树） =====
  const toggleSelectNode = (node: TreeNode) => {
    setSelectedNodeIds((prev) => {
      const subtreeIds = collectSubtreeIds(totalTree, node.id);
      if (subtreeIds.length === 0) return prev;
      // 该分支（含自身及全部子孙）是否已全部选中
      const allSelected = subtreeIds.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) {
        subtreeIds.forEach((id) => next.delete(id));
      } else {
        subtreeIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleResetSelection = () => {
    setSelectedNodeIds(new Set());
    setSelectedId(null);
    setKeyword("");
    setExpandedKeys(new Set([1, 2, 3]));
    message.info("已重置勾选");
  };

  const handleGenerateSubtree = () => {
    if (selectedNodeIds.size === 0) return message.warning("请先勾选需要纳入的节点");
    setDeriveMode("result");
    setSelectedId(null);
    setKeyword("");
    setExpandedKeys(new Set());
    message.success(`已生成${treeTitle}，共 ${subtreeCount} 个节点、末级 ${subtreeLeafCount} 个`);
  };

  const handleBackToSelect = () => {
    setDeriveMode("select");
    setSelectedId(null);
    setKeyword("");
    // 回到选择态时，将已勾选节点的祖先链展开，勾选状态反映到总结构树上
    const keys = new Set<number>();
    selectedNodeIds.forEach((id) =>
      getNodePath(totalTree, id).slice(0, -1).forEach((n) => keys.add(n.id))
    );
    setExpandedKeys(keys.size > 0 ? keys : new Set([1, 2, 3]));
  };

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Tab 切换 */}
      <DevNote
        id="structure-tab"
        title="结构树类型Tab（总结构树/设备/管路）"
        summary="总结构树为设备+管路合并的一棵总树，可维护；设备/管路结构树由总结构树勾选生成，只读"
        items={[
          { label: "数据来源", value: "总结构树：equipmentStructureTree.json + pipelineStructureTree.json 合并（管路 id 偏移）；设备/管路结构树：从总结构树勾选节点生成（buildSubTreeFromNodes），勾选结果持久化于 localStorage" },
          { label: "层级规则", value: "设备结构树：位置→系统→子系统→设备；管路结构树：位置→系统→用途→管路/管件；总结构树同时含设备与管路末级节点（四级）" },
          { label: "交互逻辑", value: "总结构树可增删改维护；设备/管路结构树为只读子树（勾选上级节点时其下所有下级节点一并选中，不干扰同级；取消=取消该节点整棵子树），生成后可【重新生成结构树】返回勾选态（原勾选结构自动反映到总树上）；再次进入自动恢复已生成的树" },
          { label: "权限", value: "管理员/操作人员在总结构树维护；设备/管路结构树仅可点击节点查看信息（原型未区分，正式系统按角色）" },
        ]}
        wrapClassName="block flex-shrink-0"
      >
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          className={`px-4 py-1.5 text-xs font-medium rounded-t border-b-2 transition-colors ${
            treeType === "total"
              ? "border-blue-500 text-blue-600 bg-blue-50"
              : "border-transparent text-admin-muted hover:text-admin-text"
          }`}
          onClick={() => switchTreeType("total")}
        >
          <Layers size={13} className="inline mr-1" /> 总结构树
        </button>
        <button
          className={`px-4 py-1.5 text-xs font-medium rounded-t border-b-2 transition-colors ${
            treeType === "equipment"
              ? "border-blue-500 text-blue-600 bg-blue-50"
              : "border-transparent text-admin-muted hover:text-admin-text"
          }`}
          onClick={() => switchTreeType("equipment")}
        >
          <Box size={13} className="inline mr-1" /> 设备结构树
        </button>
        <button
          className={`px-4 py-1.5 text-xs font-medium rounded-t border-b-2 transition-colors ${
            treeType === "pipeline"
              ? "border-blue-500 text-blue-600 bg-blue-50"
              : "border-transparent text-admin-muted hover:text-admin-text"
          }`}
          onClick={() => switchTreeType("pipeline")}
        >
          <GitBranch size={13} className="inline mr-1" /> 管路结构树
        </button>
      </div>
      </DevNote>

      {/* ===== 总结构树：完整维护视图 ===== */}
      {treeType === "total" ? (
      <>
      {/* 统计概览栏 + 操作按钮 */}
      <DevNote
        id="structure-toolbar"
        title="统计概览与操作栏"
        summary="展示节点分布统计，提供批量删除、新增一级节点、导入导出与重置"
        items={[
          { label: "数据来源", value: "stats（getTreeStats）：总节点/一级/二级/三级/四级/末级设备或管路数量" },
          { label: "交互逻辑", value: "勾选列表节点后出现“已选N项+批量删除”；“新增一级节点”打开表单（默认层级一级、排序号=一级数+1）；“导入”下拉含 上传文件导入（弹窗）/下载导入模板（CSV，按设备/管路示例生成）；“导出”提示导出N个节点；“重置”清空全部筛选与选中" },
          { label: "权限", value: "新增/批量删除/导入/导出：管理员/操作人员；浏览人员仅查看" },
          { label: "后续步骤", value: "正式系统：导入导出由服务端批量处理并校验KKS唯一性" },
        ]}
        wrapClassName="block flex-shrink-0"
      >
      <div className="flex items-center gap-4 px-4 py-2 bg-admin-card border border-admin-border rounded flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <Building2 size={14} className="text-blue-500" />
          <span className="text-xs text-admin-muted">总节点</span>
          <span className="text-sm font-semibold text-admin-text">{stats.total}</span>
        </div>
        <span className="text-admin-border">|</span>
        <div className="flex items-center gap-1.5">
          <Layers size={14} className="text-blue-500" />
          <span className="text-xs text-admin-muted">一级分类</span>
          <span className="text-sm font-semibold text-blue-600">{stats.l1}</span>
        </div>
        <span className="text-admin-border">|</span>
        <div className="flex items-center gap-1.5">
          <FolderTree size={14} className="text-cyan-500" />
          <span className="text-xs text-admin-muted">二级</span>
          <span className="text-sm font-semibold text-cyan-600">{stats.l2}</span>
        </div>
        <span className="text-admin-border">|</span>
        <div className="flex items-center gap-1.5">
          <Box size={14} className="text-purple-500" />
          <span className="text-xs text-admin-muted">三级</span>
          <span className="text-sm font-semibold text-purple-600">{stats.l3}</span>
        </div>
        <span className="text-admin-border">|</span>
        <div className="flex items-center gap-1.5">
          <Cpu size={14} className="text-orange-500" />
          <span className="text-xs text-admin-muted">四级</span>
          <span className="text-sm font-semibold text-orange-600">{stats.l4}</span>
        </div>
        <span className="text-admin-border">|</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs text-admin-muted">{leafLabel}节点</span>
          <span className="text-sm font-semibold text-green-600">{stats.equipment}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs">
              <span className="text-blue-700">已选 {selectedIds.size} 项</span>
              <button className="btn-link-danger" onClick={handleBatchDelete}>
                <Trash2 size={11} /> 批量删除
              </button>
            </div>
          )}
          <button className="btn-success text-xs flex items-center gap-1" onClick={handleAddRoot}>
            <Plus size={12} /> 新增一级节点
          </button>
          <div className="relative group">
            <button className="btn-default text-xs flex items-center gap-1">
              <Upload size={12} /> 导入
              <ChevronDown size={11} />
            </button>
            <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-admin-border rounded shadow-lg z-50 hidden group-hover:block">
              <button className="w-full px-3 py-2 text-xs text-left hover:bg-gray-50 flex items-center gap-2" onClick={handleImport}>
                <Upload size={12} /> 上传文件导入
              </button>
              <button className="w-full px-3 py-2 text-xs text-left hover:bg-gray-50 flex items-center gap-2" onClick={handleDownloadTemplate}>
                <FileSpreadsheet size={12} /> 下载导入模板
              </button>
            </div>
          </div>
          <button className="btn-default text-xs flex items-center gap-1" onClick={() => message.success(`已导出 ${stats.total} 个节点`)}>
            <Download size={12} /> 导出
          </button>
          <button className="btn-default text-xs flex items-center gap-1" onClick={() => { setSelectedId(null); setSelectedIds(new Set()); setKeyword(""); setListKeyword(""); setListLevelFilter(""); setListCategoryFilter(""); setCurrentPage(1); setExpandedKeys(new Set([1, 2, 3])); }}>
            <RefreshCw size={12} /> 重置
          </button>
        </div>
      </div>
      </DevNote>

      <div className="flex gap-3 flex-1 min-h-0">
        {/* 左侧：结构树 */}
        <DevNote
          id="structure-tree"
          title="左侧结构树"
          summary="按四层结构浏览节点，支持搜索、展开/折叠、选择联动中间列表"
          items={[
            { label: "数据来源", value: "tree（buildStructureTree(treeType)）；matchKeys 按关键字过滤名称/KKS并保留命中节点及祖先" },
            { label: "交互逻辑", value: "搜索框实时过滤（保留命中节点与祖先链）；展开/折叠全部；点击节点 → handleSelect：选中并联动中间列表筛选（该节点及后代）、有子节点时自动展开；底部显示节点总数与“+新增一级节点”" },
            { label: "节点标记", value: "行内显示 层级图标/名称/KKS编码/末级设备或管路数量" },
            { label: "后续步骤", value: "正式系统：结构树由服务端按KKS体系返回" },
            { label: "权限", value: "管理员/操作人员可维护" },
          ]}
          wrapClassName="flex flex-shrink-0"
        >
        <div className="w-[300px] flex-shrink-0 admin-card flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-admin-border bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-admin-text">{treeTitle}</h3>
              <div className="flex items-center gap-1">
                <button onClick={() => handleExpandAll()} className="text-xs text-blue-500 hover:underline">展开</button>
                <span className="text-admin-muted">|</span>
                <button onClick={handleCollapseAll} className="text-xs text-blue-500 hover:underline">折叠</button>
              </div>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-admin-muted" />
              <input
                className="input-base text-xs pl-7"
                placeholder="搜索名称/KKS编码"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-auto p-2 min-h-0">
            {displayTree.map((node) => (
              <Tree_node
                key={node.id}
                node={node}
                objectLabel={leafLabel}
                level={0}
                selectedId={selectedId}
                expandedKeys={expandedKeys}
                onToggle={handleToggle}
                onSelect={handleSelect}
                matchKeys={matchKeys}
              />
            ))}
          </div>
          <div className="px-3 py-2 border-t border-admin-border bg-gray-50 text-[10px] text-admin-muted flex items-center justify-between">
            <span>共 {stats.total} 个节点</span>
            <button className="text-blue-500 hover:underline" onClick={handleAddRoot}>
              + 新增一级节点
            </button>
          </div>
        </div>
        </DevNote>

        {/* 中间：节点列表（可交互树形 + 筛选 + 分页 + 批量操作） */}
        <DevNote
          id="structure-list"
          title="中间节点列表"
          summary="平铺展示全部节点，支持筛选/排序/分页/批量选择与行内操作"
          items={[
            { label: "数据来源", value: "flatNodes 递归平铺 tree；筛选链：左侧选中节点的后代集合 → 关键字（名称/KKS）→ 层级 → 分类 → 排序（排序号/名称/KKS，升降序切换）" },
            { label: "行操作", value: "全选/反选（页级）；行内：上移/下移（handleMoveNode 提示）、复制（连同子节点）、编辑、删除、新增子节点（仅L1-L3）；点行选中联动右侧详情" },
            { label: "批量操作", value: "顶部“删除(N)”与工具栏“批量删除” → 确认后删除选中集合；左侧选中节点时顶部蓝条提示“当前筛选：xxx（含N个节点）+路径”并可“显示全部”" },
            { label: "权限", value: "管理员/操作人员可增删改；浏览人员仅查看" },
            { label: "后续步骤", value: "正式系统：列表分页由服务端返回，排序/移动持久化" },
          ]}
          wrapClassName="block flex flex-1"
        >
        <div className="flex-1 min-w-0 admin-card flex flex-col overflow-hidden">
          {/* 筛选指示器：左侧树选中时显示 */}
          {selectedNode && (
            <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <Filter size={12} className="text-blue-500" />
                <span className="text-admin-muted">当前筛选：</span>
                <span className="text-blue-600 font-medium">{selectedNode.name}</span>
                <span className="text-admin-muted">（含 {filteredDescendantCount} 个节点）</span>
                {nodePath.length > 1 && (
                  <span className="text-admin-muted ml-1">
                    路径：{nodePath.map(p => p.name).join(' / ')}
                  </span>
                )}
              </div>
              <button
                className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-0.5"
                onClick={() => { setSelectedId(null); setCurrentPage(1); }}
              >
                <X size={11} /> 显示全部
              </button>
            </div>
          )}
          <div className="px-4 py-2 border-b border-admin-border flex items-center gap-3 flex-wrap bg-gray-50">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <div className="relative flex-1 max-w-xs">
                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-admin-muted" />
                <input
                  className="input-base text-xs pl-7"
                  placeholder="过滤：名称/KKS编码"
                  value={listKeyword}
                  onChange={(e) => { setListKeyword(e.target.value); setCurrentPage(1); }}
                />
              </div>
              <select
                className="input-base text-xs"
                style={{ width: 100 }}
                value={listLevelFilter}
                onChange={(e) => { setListLevelFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="">全部层级</option>
                <option value="L1">一级</option>
                <option value="L2">二级</option>
                <option value="L3">三级</option>
                <option value="L4">四级</option>
              </select>
              <select
                className="input-base text-xs"
                style={{ width: 110 }}
                value={listCategoryFilter}
                onChange={(e) => { setListCategoryFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="">全部分类</option>
                {treeType === "total" ? (
                  <>
                    <option value="equipment">设备</option>
                    <option value="pipeline">管路</option>
                  </>
                ) : (
                  <option value={treeType === "equipment" ? "equipment" : "pipeline"}>{leafLabel}</option>
                )}
                <option value="system">系统目录</option>
              </select>
              <button
                className="text-xs px-2 py-1 border border-admin-border rounded hover:bg-white flex items-center gap-1 text-admin-muted"
                onClick={() => setListSortAsc(!listSortAsc)}
                title={listSortAsc ? "升序" : "降序"}
              >
                <SortAsc size={12} className={listSortAsc ? "" : "rotate-180"} />
              </button>
              <select
                className="input-base text-xs"
                style={{ width: 100 }}
                value={listSortBy}
                onChange={(e) => setListSortBy(e.target.value as any)}
              >
                <option value="sort">按排序号</option>
                <option value="name">按名称</option>
                <option value="kks">按KKS编码</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn-default text-xs flex items-center gap-1" onClick={handleAddRoot}>
                <Plus size={11} /> 新增
              </button>
              {selectedIds.size > 0 && (
                <button className="btn-warning text-xs flex items-center gap-1" onClick={handleBatchDelete}>
                  <Trash2 size={11} /> 删除({selectedIds.size})
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-auto min-h-0">
            <InteractiveNodeList
              nodes={displayTree}
              treeType={treeType}
              selectedId={selectedId}
              selectedIds={selectedIds}
              listKeyword={listKeyword}
              listLevelFilter={listLevelFilter}
              listCategoryFilter={listCategoryFilter}
              listSortBy={listSortBy}
              listSortAsc={listSortAsc}
              currentPage={currentPage}
              pageSize={pageSize}
              filteredNodeIds={filteredNodeIds}
              onSetPage={setCurrentPage}
              onToggleSelectOne={toggleSelectOne}
              onToggleSelectAll={toggleSelectAll}
              onSelect={handleSelect}
              onEdit={handleEdit}
              onDelete={setDeleteNode}
              onAddChild={handleAddChild}
              onMove={handleMoveNode}
              onCopy={handleCopyNode}
            />
          </div>
        </div>
        </DevNote>

        {/* 右侧：节点详情 */}
        <div className="w-[360px] flex-shrink-0 admin-card overflow-hidden flex flex-col">
          <NodeDetailPanel
            node={selectedNode}
            path={nodePath}
            treeType={treeType}
            onEdit={handleEdit}
            onAddChild={handleAddChild}
            onDelete={setDeleteNode}
          />
        </div>
      </div>
      </>
      ) : (
      /* ===== 设备/管路结构树：由总结构树勾选生成（只读） ===== */
      <DerivedTreePanel
        treeType={treeType}
        totalTree={totalTree}
        subtree={subtree}
        mode={deriveMode}
        leafLabel={leafLabel}
        selectedNodeIds={selectedNodeIds}
        checkedIds={checkedIds}
        indeterminateIds={indeterminateIds}
        subtreeCount={subtreeCount}
        subtreeLeafCount={subtreeLeafCount}
        selectedId={selectedId}
        keyword={keyword}
        expandedKeys={expandedKeys}
        nodePath={nodePath}
        selectedNode={selectedNode}
        filteredNodeIds={filteredNodeIds}
        listKeyword={listKeyword}
        listLevelFilter={listLevelFilter}
        listCategoryFilter={listCategoryFilter}
        listSortBy={listSortBy}
        listSortAsc={listSortAsc}
        currentPage={currentPage}
        pageSize={pageSize}
        onSwitchMode={handleBackToSelect}
        onToggleNode={toggleSelectNode}
        onReset={handleResetSelection}
        onGenerate={handleGenerateSubtree}
        onSelect={handleSelect}
        onToggle={handleToggle}
        onExpandAll={handleExpandAll}
        onCollapseAll={handleCollapseAll}
        onKeywordChange={setKeyword}
        onSetPage={setCurrentPage}
        onListKeywordChange={(v) => { setListKeyword(v); setCurrentPage(1); }}
        onListLevelFilterChange={(v) => { setListLevelFilter(v); setCurrentPage(1); }}
        onListCategoryFilterChange={(v) => { setListCategoryFilter(v); setCurrentPage(1); }}
        onListSortByChange={(v) => setListSortBy(v)}
        onListSortAscToggle={() => setListSortAsc((a) => !a)}
      />
      )}

      {/* 新增/编辑弹窗 */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={
          isAddChild && editNode
            ? `新增子节点（父节点：${editNode.name}）`
            : isAddRoot
            ? "新增一级节点"
            : editNode
            ? "编辑节点"
            : "新增节点"
        }
        width={520}
        footer={
          <>
            <button className="btn-default" onClick={() => setEditOpen(false)}>取消</button>
            <button className="btn-primary" onClick={handleSubmit}>确定</button>
          </>
        }
      >
        <DevNote
          id="structure-edit-modal"
          title="新增/编辑节点弹窗"
          summary="新增一级/子节点或编辑节点，层级与分类由系统自动确定"
          items={[
            { label: "数据来源", value: "editNode/isAddChild/isAddRoot 区分模式；form（名称/KKS/排序号）打开时按场景初始化（新增子节点排序号=兄弟数+1，新增一级=一级数+1）" },
            { label: "校验规则", value: "名称必填“请填写节点名称”；KKS 提示需遵循「机组号+系统代码+部件代码+编号」格式（如 1MFA10HB001），原型不做强校验" },
            { label: "层级规则", value: "新增一级=层级L1分类系统目录；新增子节点=父层级+1（上限L4），L4 分类为设备/管路、其余为系统目录；编辑保留原层级" },
            { label: "交互逻辑", value: "头部蓝条展示父节点与新节点层级（新增子节点时）；保存后提示新增/更新结果（原型不持久化）" },
            { label: "权限", value: "管理员/操作人员" },
          ]}
          wrapClassName="block w-full"
        >
        <div className="space-y-3">
          {isAddChild && editNode && (
            <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-700 flex items-start gap-2">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
              <div>
                <div>父节点：<b>{editNode.name}</b>（{editNode.kks || "无KKS"}）</div>
                <div className="mt-0.5">
                  新节点层级：<Tag color={levelConfig[`L${Math.min(4, parseInt(editNode.level.slice(1)) + 1)}` as NodeLevel]?.color}>
                    {levelConfig[`L${Math.min(4, parseInt(editNode.level.slice(1)) + 1)}` as NodeLevel]?.label}
                  </Tag>
                </div>
              </div>
            </div>
          )}
          {isAddRoot && (
            <div className="bg-green-50 border border-green-200 rounded p-2 text-xs text-green-700 flex items-start gap-2">
              <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5" />
              <div>新增为顶级节点，层级为 <Tag color="blue">一级</Tag></div>
            </div>
          )}
          <FormItem label="节点名称" required>
            <input className="input-base" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="请输入节点名称，如：1号机组技术供水泵" />
          </FormItem>
          <FormItem label="KKS编码">
            <input className="input-base font-mono" value={form.kks} onChange={(e) => setForm({ ...form, kks: e.target.value })} placeholder="如 1SVA10BB001" />
          </FormItem>
          <FormItem label="排序号">
            <input type="number" className="input-base" value={form.sort} onChange={(e) => setForm({ ...form, sort: Number(e.target.value) })} min={1} />
          </FormItem>
          <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-700">
            <div><b>节点层级：</b>
              {isAddRoot && <Tag color="blue">一级</Tag>}
              {isAddChild && editNode && (
                <Tag color={levelConfig[`L${Math.min(4, parseInt(editNode.level.slice(1)) + 1)}` as NodeLevel]?.color}>
                  {levelConfig[`L${Math.min(4, parseInt(editNode.level.slice(1)) + 1)}` as NodeLevel]?.label}
                </Tag>
              )}
              {editNode && !isAddChild && !isAddRoot && <Tag color={levelConfig[editNode.level]?.color}>{levelConfig[editNode.level]?.label}</Tag>}
              <span className="ml-2 text-blue-500">（层级与分类由系统自动确定，无需手动选择）</span>
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-yellow-700">
            <b>提示：</b>KKS编码需遵循「机组号+系统代码+部件代码+编号」格式，如 1MFA10HB001
          </div>
        </div>
        </DevNote>
      </Modal>

      {/* 单个删除确认 */}
      <ConfirmModal
        open={deleteNode !== null}
        content={
          <div className="space-y-2">
            <div>确定删除节点「<b>{deleteNode?.name}</b>」吗？</div>
            {deleteNode && deleteNode.descendantCount > 0 && (
              <div className="text-orange-600 text-xs flex items-center gap-1">
                <AlertCircle size={12} />
                该节点包含 {deleteNode.descendantCount} 个子节点，将一并删除。
              </div>
            )}
          </div>
        }
        okText="确认删除"
        okClass="btn-danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteNode(null)}
      />

      {/* 批量删除确认 */}
      <ConfirmModal
        open={batchDeleteIds.length > 0}
        content={
          <div className="space-y-2">
            <div>确定批量删除选中的 <b className="text-red-600">{batchDeleteIds.length}</b> 个节点吗？</div>
            <div className="text-orange-600 text-xs flex items-center gap-1">
              <AlertCircle size={12} />
              该操作不可恢复，包含的子节点也会被删除。
            </div>
          </div>
        }
        okText="确认批量删除"
        okClass="btn-danger"
        onConfirm={handleConfirmBatchDelete}
        onCancel={() => setBatchDeleteIds([])}
      />

      {/* 导入弹窗 */}
      <Modal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="批量导入结构树节点"
        width={720}
        footer={
          <>
            <button className="btn-default" onClick={handleDownloadTemplate}>
              <FileSpreadsheet size={12} /> 下载模板
            </button>
            <button className="btn-default" onClick={() => setImportOpen(false)}>取消</button>
            <button className="btn-primary" onClick={handleConfirmImport} disabled={!importFile}>
              <CheckCircle2 size={12} /> 确认导入
            </button>
          </>
        }
      >
        <DevNote
          id="structure-import-modal"
          title="批量导入结构树弹窗"
          summary="通过CSV/XLSX批量导入节点，导入前可预览校验结果"
          items={[
            { label: "校验规则", value: "支持 .csv/.xlsx；单次最多500条；必填列：节点名称/父节点KKS；KKS编码不可重复；模板列：节点名称/KKS编码/父节点KKS/节点分类/层级/排序号" },
            { label: "交互逻辑", value: "选择文件后解析生成导入预览（名称/KKS/父节点KKS/分类/层级/排序/状态可导入）；底部显示“N条可导入”；确认导入 → 提示新增N个节点；下载模板 → 生成 结构树导入模板.csv（按设备/管路各自示例）" },
            { label: "后续步骤", value: "正式系统：服务端校验KKS唯一性与父子关系并批量写入" },
            { label: "权限", value: "管理员/操作人员" },
          ]}
          wrapClassName="block w-full"
        >
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1 border border-admin-border rounded p-3 bg-gray-50">
              <div className="text-xs font-medium text-admin-text mb-2 flex items-center gap-1">
                <FileSpreadsheet size={13} className="text-green-600" /> 导入说明
              </div>
              <ul className="text-[11px] text-admin-muted space-y-1.5">
                <li>• 支持 <b>.csv / .xlsx</b> 格式</li>
                <li>• 单次最多导入 500 条</li>
                <li>• 需包含必填列：<br />节点名称 / 父节点KKS</li>
                <li>• KKS编码不可重复</li>
                <li>• 父节点KKS为空表示根节点</li>
              </ul>
              <button className="btn-success text-xs w-full mt-3 flex items-center justify-center gap-1" onClick={handleDownloadTemplate}>
                <Download size={12} /> 下载导入模板
              </button>
            </div>
            <div className="col-span-2">
              <UploadBox
                accept=".csv,.xlsx,.xls"
                maxSize={5}
                onFileChange={handleImportFileChange}
                hint="点击或拖拽文件到此处上传"
              />
            </div>
          </div>

          {importPreview.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-medium text-admin-text flex items-center gap-1">
                  <Eye size={13} /> 导入预览（{importPreview.length} 条）
                </div>
                <Tag color="green">{importPreview.filter(p => p.status === "可导入").length} 条可导入</Tag>
              </div>
              <div className="border border-admin-border rounded overflow-hidden max-h-[260px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-admin-muted font-medium border-b border-admin-border">状态</th>
                      <th className="px-3 py-2 text-left text-admin-muted font-medium border-b border-admin-border">节点名称</th>
                      <th className="px-3 py-2 text-left text-admin-muted font-medium border-b border-admin-border">KKS编码</th>
                      <th className="px-3 py-2 text-left text-admin-muted font-medium border-b border-admin-border">父节点KKS</th>
                      <th className="px-3 py-2 text-left text-admin-muted font-medium border-b border-admin-border">分类</th>
                      <th className="px-3 py-2 text-left text-admin-muted font-medium border-b border-admin-border">层级</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.map((row, idx) => (
                      <tr key={idx} className={idx > 0 ? "border-t border-admin-border" : ""}>
                        <td className="px-3 py-1.5"><span className="text-green-600">{row.status}</span></td>
                        <td className="px-3 py-1.5">{row.name}</td>
                        <td className="px-3 py-1.5 font-mono text-admin-muted">{row.kks}</td>
                        <td className="px-3 py-1.5 font-mono text-admin-muted">{row.parentKks || "-"}</td>
                        <td className="px-3 py-1.5"><Tag color={treeType === "equipment" ? "green" : "cyan"}>{row.category}</Tag></td>
                        <td className="px-3 py-1.5"><Tag color={row.level === "一级" ? "blue" : row.level === "二级" ? "cyan" : row.level === "三级" ? "purple" : "orange"}>{row.level}</Tag></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        </DevNote>
      </Modal>
    </div>
  );
}

// ===== 树节点渲染组件 =====
function Tree_node({
  node,
  objectLabel,
  level,
  selectedId,
  expandedKeys,
  onToggle,
  onSelect,
  matchKeys,
  checkable = false,
  checkedIds,
  indeterminateIds,
  onCheck,
}: {
  node: TreeNode;
  objectLabel: string;
  level: number;
  selectedId: number | null;
  expandedKeys: Set<number>;
  onToggle: (id: number) => void;
  onSelect: (node: TreeNode) => void;
  matchKeys: Set<number>;
  checkable?: boolean;
  checkedIds?: Set<number>;
  indeterminateIds?: Set<number>;
  onCheck?: (node: TreeNode) => void;
}) {
  const hasChildren = node.children && node.children.length > 0;
  const expanded = expandedKeys.has(node.id);
  const selected = !checkable && selectedId === node.id;
  const checked = checkable ? (checkedIds?.has(node.id) ?? false) : false;
  const indeterminate = checkable ? (indeterminateIds?.has(node.id) ?? false) : false;
  const visible = matchKeys.size === 0 || matchKeys.has(node.id);

  if (!visible) return null;

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1 cursor-pointer rounded text-sm transition-colors ${
          checkable
            ? checked
              ? "bg-blue-50"
              : indeterminate
              ? "bg-blue-50/60"
              : "text-admin-text hover:bg-blue-50"
            : selected
            ? "bg-blue-500 text-white"
            : "text-admin-text hover:bg-blue-50"
        }`}
        style={{ paddingLeft: `${level * 14 + 8}px` }}
        onClick={() => (checkable && onCheck ? onCheck(node) : onSelect(node))}
      >
        {checkable && (
          <input
            type="checkbox"
            checked={checked}
            ref={(el) => { if (el) el.indeterminate = indeterminate; }}
            onChange={() => onCheck?.(node)}
            onClick={(e) => e.stopPropagation()}
            className="cursor-pointer flex-shrink-0"
          />
        )}
        {hasChildren ? (
          <button onClick={(e) => { e.stopPropagation(); onToggle(node.id); }} className={selected ? "text-blue-200" : "text-admin-muted"}>
            {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
        ) : (
          <span className="w-3.5" />
        )}
        {levelConfig[node.level].icon}
        {node.kks && (
          <span className={`font-mono text-[10px] ${selected ? "text-blue-200" : "text-admin-muted"}`}>{node.kks}</span>
        )}
        <span className="truncate flex-1 text-xs">{node.name}</span>
        {node.equipmentCount > 0 && (
          <span className={`text-[10px] ${selected ? "text-blue-200" : "text-admin-muted"}`}>{node.equipmentCount}{objectLabel}</span>
        )}
      </div>
      {hasChildren && expanded && (
        <div>
          {node.children!.map((child) => (
            <Tree_node
              key={child.id}
              node={child}
              objectLabel={objectLabel}
              level={level + 1}
              selectedId={selectedId}
              expandedKeys={expandedKeys}
              onToggle={onToggle}
              onSelect={onSelect}
              matchKeys={matchKeys}
              checkable={checkable}
              checkedIds={checkedIds}
              indeterminateIds={indeterminateIds}
              onCheck={onCheck}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ===== 可交互节点列表 =====
function InteractiveNodeList({
  nodes,
  treeType,
  selectedId,
  selectedIds,
  listKeyword,
  listLevelFilter,
  listCategoryFilter,
  listSortBy,
  listSortAsc,
  currentPage,
  pageSize,
  filteredNodeIds,
  onSetPage,
  onToggleSelectOne,
  onToggleSelectAll,
  onSelect,
  onEdit,
  onDelete,
  onAddChild,
  onMove,
  onCopy,
  readOnly = false,
  checkable = false,
  checkedNodeIds,
  onToggleCheck,
  onToggleCheckAll,
}: {
  nodes: TreeNode[];
  treeType: TreeType;
  selectedId: number | null;
  selectedIds: Set<number>;
  listKeyword: string;
  listLevelFilter: string;
  listCategoryFilter: string;
  listSortBy: "sort" | "name" | "kks";
  listSortAsc: boolean;
  currentPage: number;
  pageSize: number;
  filteredNodeIds: Set<number> | null;
  onSetPage: (p: number) => void;
  onToggleSelectOne: (id: number) => void;
  onToggleSelectAll: (ids: number[]) => void;
  onSelect: (node: TreeNode) => void;
  onEdit?: (node: TreeNode) => void;
  onDelete?: (node: TreeNode) => void;
  onAddChild?: (parent: TreeNode) => void;
  onMove?: (node: TreeNode, dir: "up" | "down") => void;
  onCopy?: (node: TreeNode) => void;
  readOnly?: boolean;
  checkable?: boolean;
  checkedNodeIds?: Set<number>;
  onToggleCheck?: (node: TreeNode) => void;
  onToggleCheckAll?: (pageNodes: TreeNode[]) => void;
}) {
  const [hoverId, setHoverId] = useState<number | null>(null);

  const flatNodes = useMemo(() => {
    const list: { node: TreeNode; level: number; path: string }[] = [];
    const walk = (arr: TreeNode[], level: number, parentPath: string) => {
      arr.forEach((n) => {
        list.push({ node: n, level, path: parentPath });
        const currentPath = parentPath ? `${parentPath} / ${n.name}` : n.name;
        if (n.children) walk(n.children, level + 1, currentPath);
      });
    };
    walk(nodes, 0, "");
    return list;
  }, [nodes]);

  const filtered = useMemo(() => {
    let list = flatNodes;
    // 左侧树筛选联动：只显示选中节点及其后代
    if (filteredNodeIds) {
      list = list.filter(({ node }) => filteredNodeIds.has(node.id));
    }
    if (listKeyword.trim()) {
      const kw = listKeyword.toLowerCase();
      list = list.filter(({ node }) =>
        node.name.toLowerCase().includes(kw) ||
        node.kks.toLowerCase().includes(kw)
      );
    }
    if (listLevelFilter) {
      list = list.filter(({ node }) => node.level === listLevelFilter);
    }
    if (listCategoryFilter) {
      list = list.filter(({ node }) => node.category === listCategoryFilter);
    }
    const sorted = [...list].sort((a, b) => {
      let r = 0;
      if (listSortBy === "sort") r = a.node.sort - b.node.sort;
      else if (listSortBy === "name") r = a.node.name.localeCompare(b.node.name, "zh");
      else r = a.node.kks.localeCompare(b.node.kks);
      return listSortAsc ? r : -r;
    });
    return sorted;
  }, [flatNodes, listKeyword, listLevelFilter, listCategoryFilter, listSortBy, listSortAsc, filteredNodeIds]);

  const total = filtered.length;
  const pageNum = Math.max(1, Math.ceil(total / pageSize));
  const curPage = Math.min(currentPage, pageNum);
  const pageData = filtered.slice((curPage - 1) * pageSize, curPage * pageSize);

  const pageIds = pageData.map(p => p.node.id);
  const allSelected = pageIds.length > 0 && pageIds.every(id =>
    checkable ? (checkedNodeIds?.has(id) ?? false) : selectedIds.has(id)
  );

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-admin-muted text-sm py-16">
        <Filter size={40} className="mb-2 opacity-30" />
        <p>暂无符合条件的节点</p>
        <p className="text-xs mt-1">尝试调整筛选条件</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm" style={{ minWidth: "1100px" }}>
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {(checkable || !readOnly) && (
                <th className="px-3 py-2 w-10 border-b border-admin-border">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => (checkable ? onToggleCheckAll?.(pageData.map(p => p.node)) : onToggleSelectAll(pageIds))}
                    className="cursor-pointer"
                  />
                </th>
              )}
              <th className="px-3 py-2 text-left font-medium text-admin-muted border-b border-admin-border min-w-[200px]">
                <div className="flex items-center gap-1">
                  <ArrowUpDown size={11} className="opacity-50" />
                  节点名称
                </div>
              </th>
              <th className="px-3 py-2 text-left font-medium text-admin-muted border-b border-admin-border min-w-[200px]">所属路径</th>
              <th className="px-3 py-2 text-left font-medium text-admin-muted border-b border-admin-border w-32">KKS编码</th>
              <th className="px-3 py-2 text-left font-medium text-admin-muted border-b border-admin-border w-16">层级</th>
              <th className="px-3 py-2 text-left font-medium text-admin-muted border-b border-admin-border w-20">
                {getCategoryColumnLabel(treeType)}
              </th>
              <th className="px-3 py-2 text-right font-medium text-admin-muted border-b border-admin-border w-16">子节点</th>
              <th className="px-3 py-2 text-right font-medium text-admin-muted border-b border-admin-border w-16">{treeType === "total" ? "末级数" : treeType === "equipment" ? "设备数" : "管路数"}</th>
              <th className="px-3 py-2 text-right font-medium text-admin-muted border-b border-admin-border w-16">排序</th>
              {!readOnly && (
                <th className="px-3 py-2 text-center font-medium text-admin-muted border-b border-admin-border w-[180px]">操作</th>
              )}
            </tr>
          </thead>
          <tbody>
            {pageData.map(({ node, level, path }) => {
              const selected = selectedId === node.id;
              const checked = checkable ? (checkedNodeIds?.has(node.id) ?? false) : selectedIds.has(node.id);
              const hovered = hoverId === node.id;
              const canAddChild = node.level !== 'L4';
              return (
                <tr
                  key={node.id}
                  className={`border-b border-admin-border cursor-pointer transition-colors ${selected ? "bg-blue-50" : hovered ? "bg-gray-50/70" : ""}`}
                  onClick={() => onSelect(node)}
                  onMouseEnter={() => setHoverId(node.id)}
                  onMouseLeave={() => setHoverId(null)}
                >
                  {(checkable || !readOnly) && (
                    <td className="px-3 py-1.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => (checkable ? onToggleCheck?.(node) : onToggleSelectOne(node.id))}
                        className="cursor-pointer"
                      />
                    </td>
                  )}
                  <td className="px-3 py-1.5">
                    <div className="flex items-center gap-1">
                      {levelConfig[node.level].icon}
                      <span className="text-xs font-medium">{node.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-1.5">
                    <span className="text-xs text-admin-muted">{path || "-"}</span>
                  </td>
                  <td className="px-3 py-1.5">
                    {node.kks ? (
                      <span className="font-mono text-xs text-blue-600">{node.kks}</span>
                    ) : (
                      <span className="text-xs text-admin-muted">-</span>
                    )}
                  </td>
                  <td className="px-3 py-1.5"><Tag color={levelConfig[node.level].color} className="!text-[10px] !px-1.5 !py-0">{levelConfig[node.level].label}</Tag></td>
                  <td className="px-3 py-1.5">
                    <Tag color={node.category === "equipment" ? "green" : node.category === "pipeline" ? "cyan" : "gray"} className="!text-[10px] !px-1.5 !py-0">
                      {getNodeCategoryLabel(node.category)}
                    </Tag>
                  </td>
                  <td className="px-3 py-1.5 text-right text-xs">{node.childCount > 0 ? <b className="text-blue-600">{node.childCount}</b> : "0"}</td>
                  <td className="px-3 py-1.5 text-right text-xs">{node.equipmentCount > 0 ? <b className="text-green-600">{node.equipmentCount}</b> : "0"}</td>
                  <td className="px-3 py-1.5 text-right text-xs font-mono text-admin-muted">{node.sort}</td>
                  {!readOnly && (
                    <td className="px-3 py-1.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2 text-xs">
                        {canAddChild && (
                          <button className="text-blue-500 hover:underline" onClick={() => onAddChild?.(node)}>
                            新增
                          </button>
                        )}
                        <button className="text-blue-500 hover:underline" onClick={() => onEdit?.(node)}>
                          编辑
                        </button>
                        <button className="text-blue-500 hover:underline" onClick={() => onCopy?.(node)}>
                          复制
                        </button>
                        <button className="text-red-500 hover:underline" onClick={() => onDelete?.(node)}>
                          删除
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 分页栏 */}
      <div className="px-4 py-2 border-t border-admin-border bg-gray-50 flex items-center justify-between flex-shrink-0">
        <div className="text-xs text-admin-muted">
          共 <b className="text-admin-text">{total}</b> 条记录，第 {curPage} / {pageNum} 页
          {pageIds.length > 0 && (
            <span className="ml-3">
              本页 <b className="text-admin-text">{pageIds.filter(id => checkable ? (checkedNodeIds?.has(id) ?? false) : selectedIds.has(id)).length}</b> 条已选中
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            className="px-2 py-1 border border-admin-border rounded text-xs disabled:opacity-40"
            disabled={curPage <= 1}
            onClick={() => onSetPage(1)}
          >首页</button>
          <button
            className="px-2 py-1 border border-admin-border rounded text-xs disabled:opacity-40"
            disabled={curPage <= 1}
            onClick={() => onSetPage(curPage - 1)}
          >上一页</button>
          {Array.from({ length: Math.min(5, pageNum) }, (_, i) => {
            const start = Math.max(1, Math.min(curPage - 2, pageNum - 4));
            const p = start + i;
            if (p > pageNum) return null;
            return (
              <button
                key={p}
                className={`px-2 py-1 border rounded text-xs min-w-[28px] ${
                  p === curPage ? "bg-blue-500 text-white border-blue-500" : "border-admin-border hover:bg-white"
                }`}
                onClick={() => onSetPage(p)}
              >{p}</button>
            );
          })}
          <button
            className="px-2 py-1 border border-admin-border rounded text-xs disabled:opacity-40"
            disabled={curPage >= pageNum}
            onClick={() => onSetPage(curPage + 1)}
          >下一页</button>
          <button
            className="px-2 py-1 border border-admin-border rounded text-xs disabled:opacity-40"
            disabled={curPage >= pageNum}
            onClick={() => onSetPage(pageNum)}
          >末页</button>
        </div>
      </div>
    </div>
  );
}

// ===== 节点详情面板 =====
function NodeDetailPanel({
  node,
  path,
  treeType,
  onEdit,
  onAddChild,
  onDelete,
  readOnly = false,
}: {
  node: TreeNode | null;
  path: TreeNode[];
  treeType: TreeType;
  onEdit?: (node: TreeNode) => void;
  onAddChild?: (parent: TreeNode) => void;
  onDelete?: (node: TreeNode) => void;
  readOnly?: boolean;
}) {
  if (!node) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-admin-muted p-6">
        <Settings size={48} className="text-gray-300 mb-3" />
        <p className="text-sm">请选择节点查看详情</p>
        <p className="text-xs mt-1">点击左侧结构树或列表</p>
      </div>
    );
  }

  const canAddChild = !readOnly && node.level !== 'L4';
  const sameLevelNodes = useMemo(() => {
    if (!path || path.length < 2) return null;
    const parent = path[path.length - 2];
    return parent.children?.filter(c => c.level === node.level).length;
  }, [path, node]);
  const leafLabel2 = treeType === "total" ? "末级节点" : treeType === "equipment" ? "末级设备" : "末级管路";
  const leafUnit2 = treeType === "total" ? "个" : treeType === "equipment" ? "台" : "条";

  return (
    <DevNote
      id="structure-detail"
      title="右侧节点详情面板"
      summary="展示选中节点的路径、基础信息、直接子节点与操作入口"
      items={[
        { label: "数据来源", value: "node（当前选中节点）与 path（节点路径链，getNodePath）；基础信息含 名称/KKS/层级（含同级数）/分类/排序号/直接子节点数/后代数/末级设备或管路数" },
        { label: "交互逻辑", value: "无选中时显示“请选择节点查看详情”；有选中时头部显示图标+名称+KKS；面包屑路径；直接子节点列表（可点击进入下级，显示KKS/名称/数量/层级Tag）；L4节点无“新增子节点”按钮" },
        { label: "底部操作", value: readOnly ? "只读视图：设备/管路结构树由总结构树勾选生成，仅可查看节点信息，无增删改入口" : "新增子节点（L1-L3）/编辑节点/删除节点（删除提示含N个子节点一并删除）" },
        { label: "使用说明", value: "固定提示：四级且分类为设备/管路=可关联末级节点；系统目录=仅分类用；修改结构树会同步影响设备数字化/管道数字化页筛选" },
        { label: "权限", value: readOnly ? "所有用户仅可查看" : "管理员/操作人员可增删改；浏览人员仅查看" },
      ]}
      wrapClassName="block w-full h-full"
    >
    <div className="h-full flex flex-col">
      <div className="px-4 py-2 border-b border-admin-border bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {levelConfig[node.level].icon}
          <h3 className="text-sm font-semibold text-admin-text truncate">{node.name}</h3>
        </div>
        <span className="font-mono text-xs text-admin-muted">{node.kks || "无KKS"}</span>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* 面包屑路径 */}
        {path.length > 0 && (
          <div className="p-2 bg-blue-50 rounded border border-blue-100">
            <div className="text-xs text-blue-700 font-medium mb-1 flex items-center gap-1">
              <FileText size={11} /> 节点路径
            </div>
            <div className="flex items-center flex-wrap gap-0.5 text-xs">
              {path.map((p, idx) => (
                <span key={p.id} className="flex items-center gap-0.5">
                  <span className={idx === path.length - 1 ? "text-blue-600 font-medium" : "text-admin-muted"}>{p.name}</span>
                  {idx < path.length - 1 && <ChevronRight size={10} className="text-admin-muted" />}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 基础信息 */}
        <div>
          <div className="text-xs font-medium text-admin-text mb-2">基础信息</div>
          <div className="border border-admin-border rounded overflow-hidden">
            <div className="grid grid-cols-[auto_1fr] text-xs">
              <div className="p-2 bg-gray-50/60 border-b border-admin-border text-admin-muted text-right">节点名称</div>
              <div className="p-2 border-b border-admin-border">{node.name}</div>
              <div className="p-2 bg-gray-50/60 border-b border-admin-border text-admin-muted text-right">KKS编码</div>
              <div className="p-2 border-b border-admin-border font-mono text-blue-600">{node.kks || "未分配"}</div>
              <div className="p-2 bg-gray-50/60 border-b border-admin-border text-admin-muted text-right">节点层级</div>
              <div className="p-2 border-b border-admin-border">
                <Tag color={levelConfig[node.level].color}>{levelConfig[node.level].label}</Tag>
                {sameLevelNodes && <span className="ml-2 text-admin-muted">同级 {sameLevelNodes} 个</span>}
              </div>
              <div className="p-2 bg-gray-50/60 border-b border-admin-border text-admin-muted text-right">节点分类</div>
              <div className="p-2 border-b border-admin-border">
                <Tag color={node.category === "equipment" ? "green" : node.category === "pipeline" ? "cyan" : "gray"}>
                  {getNodeCategoryLabel(node.category)}
                </Tag>
              </div>
              <div className="p-2 bg-gray-50/60 border-b border-admin-border text-admin-muted text-right">排序号</div>
              <div className="p-2 border-b border-admin-border font-mono">#{node.sort}</div>
              <div className="p-2 bg-gray-50/60 border-b border-admin-border text-admin-muted text-right">直接子节点</div>
              <div className="p-2 border-b border-admin-border"><b className="text-blue-600">{node.childCount}</b> 个</div>
              <div className="p-2 bg-gray-50/60 border-b border-admin-border text-admin-muted text-right">所有后代</div>
              <div className="p-2 border-b border-admin-border">{node.descendantCount} 个</div>
              <div className="p-2 bg-gray-50/60 text-admin-muted text-right">{leafLabel2}</div>
              <div className="p-2">
                <span className="text-green-600 font-medium">{node.equipmentCount}</span> {leafUnit2}
              </div>
            </div>
          </div>
        </div>

        {/* 直接子节点列表 */}
        {node.children && node.children.length > 0 && (
          <div>
            <div className="text-xs font-medium text-admin-text mb-2 flex items-center justify-between">
              <span>直接子节点（{node.children.length}）</span>
              {canAddChild && (
                <button className="text-blue-500 hover:underline text-xs" onClick={() => onAddChild(node)}>+ 新增子节点</button>
              )}
            </div>
            <div className="border border-admin-border rounded overflow-hidden max-h-[200px] overflow-y-auto">
              {node.children.map((child, idx) => (
                <div
                  key={child.id}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer hover:bg-blue-50 ${idx > 0 ? "border-t border-admin-border" : ""} ${idx % 2 === 1 ? "bg-gray-50/30" : ""}`}
                >
                  <GripVertical size={11} className="text-gray-300" />
                  {levelConfig[child.level].icon}
                  <span className="font-mono text-admin-muted text-[10px] min-w-[90px]">{child.kks || "-"}</span>
                  <span className="flex-1 truncate">{child.name}</span>
                  {child.equipmentCount > 0 && (
                    <span className="text-green-600 text-[10px]">{child.equipmentCount}{leafUnit2}</span>
                  )}
                  <Tag color={levelConfig[child.level].color} className="!text-[10px] !px-1.5 !py-0">{levelConfig[child.level].label}</Tag>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 分类说明 */}
        <div className="p-2 bg-purple-50 rounded border border-purple-100 text-xs text-purple-700">
          <div className="font-medium mb-0.5">使用说明</div>
          <ul className="text-[11px] space-y-0.5 pl-3 list-disc">
            {readOnly ? (
              <li>本结构树由总结构树勾选生成，为只读视图；如需调整请点击【重新生成结构树】返回勾选</li>
            ) : (
              <>
                <li>四级节点且分类为「{treeType === "total" ? "设备或管路" : treeType === "equipment" ? "设备" : "管路"}」= 可关联的末级节点</li>
                <li>系统目录 = 仅用于分类组织结构，非实际{treeType === "total" ? "设备或管路" : treeType === "equipment" ? "设备" : "管路"}</li>
                <li>修改结构树会同步影响「{treeType === "total" ? "设备数字化/管道数字化" : treeType === "equipment" ? "设备数字化" : "管道数字化"}」页的筛选</li>
              </>
            )}
          </ul>
        </div>
      </div>

      {/* 底部操作区 */}
      {!readOnly && (
      <div className="px-4 py-2 border-t border-admin-border bg-gray-50 grid grid-cols-2 gap-2">
        {canAddChild && (
          <button className="btn-primary text-xs flex items-center justify-center gap-1 col-span-2" onClick={() => onAddChild?.(node)}>
            <Plus size={12} /> 新增子节点
          </button>
        )}
        <button className="btn-default text-xs flex items-center justify-center gap-1" onClick={() => onEdit?.(node)}>
          <Edit size={12} /> 编辑节点
        </button>
        <button className="btn-danger text-xs flex items-center justify-center gap-1" onClick={() => onDelete?.(node)}>
          <Trash2 size={12} /> 删除节点
        </button>
      </div>
      )}
    </div>
    </DevNote>
  );
}

// ===== 设备/管路结构树面板（由总结构树勾选生成，只读） =====
function DerivedTreePanel({
  treeType,
  totalTree,
  subtree,
  mode,
  leafLabel,
  selectedNodeIds,
  checkedIds,
  indeterminateIds,
  subtreeCount,
  subtreeLeafCount,
  selectedId,
  keyword,
  expandedKeys,
  nodePath,
  selectedNode,
  filteredNodeIds,
  listKeyword,
  listLevelFilter,
  listCategoryFilter,
  listSortBy,
  listSortAsc,
  currentPage,
  pageSize,
  onSwitchMode,
  onToggleNode,
  onReset,
  onGenerate,
  onSelect,
  onToggle,
  onExpandAll,
  onCollapseAll,
  onKeywordChange,
  onSetPage,
  onListKeywordChange,
  onListLevelFilterChange,
  onListCategoryFilterChange,
  onListSortByChange,
  onListSortAscToggle,
}: {
  treeType: TreeType;
  totalTree: TreeNode[];
  subtree: TreeNode[];
  mode: "select" | "result";
  leafLabel: string;
  selectedNodeIds: Set<number>;
  checkedIds: Set<number>;
  indeterminateIds: Set<number>;
  subtreeCount: number;
  subtreeLeafCount: number;
  selectedId: number | null;
  keyword: string;
  expandedKeys: Set<number>;
  nodePath: TreeNode[];
  selectedNode: TreeNode | null;
  filteredNodeIds: Set<number> | null;
  listKeyword: string;
  listLevelFilter: string;
  listCategoryFilter: string;
  listSortBy: "sort" | "name" | "kks";
  listSortAsc: boolean;
  currentPage: number;
  pageSize: number;
  onSwitchMode: () => void;
  onToggleNode: (node: TreeNode) => void;
  onReset: () => void;
  onGenerate: () => void;
  onSelect: (node: TreeNode) => void;
  onToggle: (id: number) => void;
  onExpandAll: (nodes?: TreeNode[]) => void;
  onCollapseAll: () => void;
  onKeywordChange: (v: string) => void;
  onSetPage: (p: number) => void;
  onListKeywordChange: (v: string) => void;
  onListLevelFilterChange: (v: string) => void;
  onListCategoryFilterChange: (v: string) => void;
  onListSortByChange: (v: "sort" | "name" | "kks") => void;
  onListSortAscToggle: () => void;
}) {
  const isSelect = mode === "select";
  const tree = isSelect ? totalTree : subtree;
  const treeName = getTreeTitle(treeType);
  const matchKeys = useMemo(() => collectMatchKeys(tree, keyword), [tree, keyword]);
  const totalCount = useMemo(() => countNodes(totalTree), [totalTree]);
  const selectedCount = selectedNodeIds.size;

  return (
    <>
      {/* 状态栏 */}
      <DevNote
        id="structure-derived-toolbar"
        title="设备/管路结构树状态栏"
        summary="选择态：从总结构树勾选节点生成；结果态：只读子树，可返回重新生成"
        items={[
          { label: "数据来源", value: "选择源为总结构树（totalTree）；勾选节点后由 buildSubTreeFromNodes 生成子树（父级自动纳入）" },
          { label: "交互逻辑", value: "选择态：勾选上级节点时其下所有下级节点一并选中（不干扰同级）；再次勾选已选节点=取消该节点整棵子树；【生成" + treeName + "】进入结果态，【重置选择】清空勾选；结果态：点击节点查看详情，【重新生成结构树】返回勾选态（原勾选结构自动反映到总树上）" },
          { label: "状态规则", value: "勾选结果与生成状态持久化于 localStorage，再次进入自动恢复" },
          { label: "权限", value: "设备/管路结构树为只读，无增删改入口；正式系统可按角色控制" },
        ]}
        wrapClassName="block flex-shrink-0"
      >
      <div className="flex items-center gap-4 px-4 py-2 bg-admin-card border border-admin-border rounded flex-shrink-0">
        {isSelect ? (
          <>
            <span className="text-xs text-admin-muted">从「总结构树」勾选结构，生成{treeName}</span>
            <span className="text-sm font-semibold text-blue-600">已选节点 {selectedCount} 个</span>
            <span className="text-xs text-admin-muted">勾选上级节点，其下所有下级节点一并选中；取消=取消该节点整棵子树</span>
            <div className="ml-auto flex items-center gap-2">
              <button className="btn-success text-xs flex items-center gap-1" disabled={selectedCount === 0} onClick={onGenerate}>
                <CheckCircle2 size={12} /> 生成{treeName}
              </button>
              <button className="btn-default text-xs flex items-center gap-1" onClick={onReset}>
                <RefreshCw size={12} /> 重置选择
              </button>
            </div>
          </>
        ) : (
          <>
            <span className="text-xs font-medium text-admin-text">{treeName}</span>
            <span className="text-xs text-admin-muted">由总结构树勾选生成 · 共 {subtreeCount} 个节点 · 末级 {subtreeLeafCount} 个 · 只读</span>
            <div className="ml-auto flex items-center gap-2">
              <button className="btn-default text-xs flex items-center gap-1" onClick={onSwitchMode}>
                <GitBranch size={12} /> 重新生成结构树
              </button>
            </div>
          </>
        )}
      </div>
      </DevNote>

      <div className="flex gap-3 flex-1 min-h-0">
        {/* 左侧：结构树 */}
        <DevNote
          id="structure-derived-tree"
          title="左侧结构树"
          summary="选择态展示总结构树并支持勾选；结果态展示生成的只读子树"
          items={[
            { label: "数据来源", value: isSelect ? "totalTree（总结构树）" : "subtree（buildSubTreeFromNodes）" },
            { label: "交互逻辑", value: "搜索实时过滤（保留命中节点与祖先链）；展开/折叠全部；选择态点击行/复选框切换勾选，结果态点击节点查看右侧详情" },
            { label: "勾选规则", value: "勾选上级节点时其下所有下级节点一并选中；再次勾选已选节点=取消该节点整棵子树" },
            { label: "权限", value: "选择态所有用户可勾选；结果态仅查看" },
          ]}
          wrapClassName="flex flex-shrink-0"
        >
        <div className="w-[300px] flex-shrink-0 admin-card flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-admin-border bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-admin-text">{isSelect ? "总结构树（勾选结构）" : treeName}</h3>
              <div className="flex items-center gap-1">
                <button onClick={() => onExpandAll(tree)} className="text-xs text-blue-500 hover:underline">展开</button>
                <span className="text-admin-muted">|</span>
                <button onClick={onCollapseAll} className="text-xs text-blue-500 hover:underline">折叠</button>
              </div>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-admin-muted" />
              <input
                className="input-base text-xs pl-7"
                placeholder="搜索名称/KKS编码"
                value={keyword}
                onChange={(e) => onKeywordChange(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-auto p-2 min-h-0">
            {tree.map((node) => (
              <Tree_node
                key={node.id}
                node={node}
                objectLabel={leafLabel}
                level={0}
                selectedId={selectedId}
                expandedKeys={expandedKeys}
                onToggle={onToggle}
                onSelect={onSelect}
                matchKeys={matchKeys}
                checkable={isSelect}
                checkedIds={checkedIds}
                indeterminateIds={indeterminateIds}
                onCheck={onToggleNode}
              />
            ))}
          </div>
          <div className="px-3 py-2 border-t border-admin-border bg-gray-50 text-[10px] text-admin-muted flex items-center justify-between">
            {isSelect ? (
              <>
                <span>总结构树共 {totalCount} 个节点</span>
                <span>勾选上级，下级全选</span>
              </>
            ) : (
              <span>共 {subtreeCount} 个节点 · 末级 {subtreeLeafCount} 个</span>
            )}
          </div>
        </div>
        </DevNote>

        {/* 中间：节点列表（仅生成后展示，只读无操作按钮） */}
        {!isSelect && (
        <DevNote
          id="structure-derived-list"
          title="中间节点列表"
          summary="生成结构树后平铺展示节点，支持筛选/排序/分页，仅查看"
          items={[
            { label: "数据来源", value: "flatNodes 递归平铺 subtree（buildSubTreeFromNodes）" },
            { label: "交互逻辑", value: "筛选：关键字（名称/KKS）→ 层级 → 分类 → 排序（排序号/名称/KKS，升降序切换）+ 分页；点击行查看详情" },
            { label: "操作权限", value: "只读列表，无任何操作按钮" },
          ]}
          wrapClassName="block flex flex-1"
        >
        <div className="flex-1 min-w-0 admin-card flex flex-col overflow-hidden">
          <div className="px-4 py-2 border-b border-admin-border flex items-center gap-3 flex-wrap bg-gray-50">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <div className="relative flex-1 max-w-xs">
                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-admin-muted" />
                <input
                  className="input-base text-xs pl-7"
                  placeholder="过滤：名称/KKS编码"
                  value={listKeyword}
                  onChange={(e) => onListKeywordChange(e.target.value)}
                />
              </div>
              <select
                className="input-base text-xs"
                style={{ width: 100 }}
                value={listLevelFilter}
                onChange={(e) => onListLevelFilterChange(e.target.value)}
              >
                <option value="">全部层级</option>
                <option value="L1">一级</option>
                <option value="L2">二级</option>
                <option value="L3">三级</option>
                <option value="L4">四级</option>
              </select>
              <select
                className="input-base text-xs"
                style={{ width: 110 }}
                value={listCategoryFilter}
                onChange={(e) => onListCategoryFilterChange(e.target.value)}
              >
                <option value="">全部分类</option>
                <option value={treeType === "equipment" ? "equipment" : "pipeline"}>{leafLabel}</option>
                <option value="system">系统目录</option>
              </select>
              <button
                className="text-xs px-2 py-1 border border-admin-border rounded hover:bg-white flex items-center gap-1 text-admin-muted"
                onClick={onListSortAscToggle}
                title={listSortAsc ? "升序" : "降序"}
              >
                <SortAsc size={12} className={listSortAsc ? "" : "rotate-180"} />
              </button>
              <select
                className="input-base text-xs"
                style={{ width: 100 }}
                value={listSortBy}
                onChange={(e) => onListSortByChange(e.target.value as any)}
              >
                <option value="sort">按排序号</option>
                <option value="name">按名称</option>
                <option value="kks">按KKS编码</option>
              </select>
            </div>
          </div>
          <div className="flex-1 overflow-auto min-h-0">
            <InteractiveNodeList
              nodes={subtree}
              treeType={treeType}
              selectedId={selectedId}
              selectedIds={new Set()}
              listKeyword={listKeyword}
              listLevelFilter={listLevelFilter}
              listCategoryFilter={listCategoryFilter}
              listSortBy={listSortBy}
              listSortAsc={listSortAsc}
              currentPage={currentPage}
              pageSize={pageSize}
              filteredNodeIds={filteredNodeIds}
              onSetPage={onSetPage}
              onToggleSelectOne={() => {}}
              onToggleSelectAll={() => {}}
              onSelect={onSelect}
              readOnly
            />
          </div>
        </div>
        </DevNote>
        )}

        {/* 右侧：节点详情（只读） */}
        <div className="w-[360px] flex-shrink-0 admin-card overflow-hidden flex flex-col">
          {isSelect ? (
            <div className="flex-1 flex flex-col items-center justify-center text-admin-muted p-6">
              <Filter size={48} className="text-gray-300 mb-3" />
              <p className="text-sm">请在左侧结构树中勾选需要纳入{treeName}的结构</p>
              <p className="text-xs mt-1">勾选上级节点，其下所有下级节点一并选中</p>
              <p className="text-xs mt-1">点击【生成{treeName}】生成只读子树</p>
            </div>
          ) : (
            <NodeDetailPanel node={selectedNode} path={nodePath} treeType={treeType} readOnly />
          )}
        </div>
      </div>
    </>
  );
}
