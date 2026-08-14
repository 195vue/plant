import { useMemo, useState, type ReactNode } from "react";
import {
  Box,
  Check,
  ChevronDown,
  ChevronRight,
  FolderTree,
  Layers,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { Tag } from "@/components/common/Tag";
import {
  buildStructureTree,
  type TreeNode,
} from "@/mock/structureTree";
import { DevNote } from "@/components/devNotes/DevNote";

export interface ModelLinkOption {
  key: string;
  id: number;
  type: "equipment" | "pipeline";
  code: string;
  name: string;
  system: string;
  level: TreeNode["level"];
  isGroup: boolean;
}

interface ModelLinkSelectorProps {
  options: readonly ModelLinkOption[];
  selectedKeys: string[];
  onChange: (keys: string[]) => void;
  sourceText?: string;
}

function includesExactCode(sourceText: string, code: string) {
  const escapedCode = code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^A-Z0-9])${escapedCode}([^A-Z0-9]|$)`, "i").test(
    sourceText,
  );
}

function filterCandidateTree(
  nodes: TreeNode[],
  candidateIds: Set<number>,
  matchKeys?: Set<number>,
): TreeNode[] {
  return nodes.flatMap((node) => {
    const children = node.children
      ? filterCandidateTree(node.children, candidateIds, matchKeys)
      : [];
    const isCandidate = candidateIds.has(node.id);
    const matchesKeyword = !matchKeys || matchKeys.has(node.id);

    if (!matchesKeyword || (!isCandidate && children.length === 0)) return [];

    return [
      {
        ...node,
        children: children.length > 0 ? children : undefined,
      },
    ];
  });
}

function collectTreeOptions(
  nodes: TreeNode[],
  optionById: Map<number, ModelLinkOption>,
) {
  const result: ModelLinkOption[] = [];

  const walk = (items: TreeNode[]) => {
    items.forEach((node) => {
      const option = optionById.get(node.id);
      if (option) result.push(option);
      if (node.children) walk(node.children);
    });
  };

  walk(nodes);
  return result;
}

function filterTreeByKeyword(
  nodes: TreeNode[],
  keyword: string,
  ancestorMatches = false,
): TreeNode[] {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) return nodes;

  return nodes.flatMap((node) => {
    const selfMatches =
      node.name.toLowerCase().includes(normalizedKeyword) ||
      node.kks.toLowerCase().includes(normalizedKeyword);
    const branchMatches = ancestorMatches || selfMatches;
    const children = node.children
      ? filterTreeByKeyword(node.children, keyword, branchMatches)
      : [];

    if (!branchMatches && children.length === 0) return [];

    return [
      {
        ...node,
        children: children.length > 0 ? children : undefined,
      },
    ];
  });
}

export default function ModelLinkSelector({
  options,
  selectedKeys,
  onChange,
  sourceText = "",
}: ModelLinkSelectorProps) {
  const [keyword, setKeyword] = useState("");
  const [modelType, setModelType] = useState<ModelLinkOption["type"]>(
    "equipment",
  );
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(
    () =>
      new Set(
        buildStructureTree("equipment").map((node) => `equipment-${node.id}`),
      ),
  );

  const structureTree = useMemo(
    () => buildStructureTree(modelType),
    [modelType],
  );
  const activeOptions = useMemo(
    () => options.filter((item) => item.type === modelType),
    [modelType, options],
  );
  const optionById = useMemo(
    () => new Map(activeOptions.map((item) => [item.id, item] as const)),
    [activeOptions],
  );
  const candidateTree = useMemo(
    () =>
      filterCandidateTree(
        structureTree,
        new Set(optionById.keys()),
      ),
    [optionById, structureTree],
  );
  const visibleTree = useMemo(
    () => filterTreeByKeyword(candidateTree, keyword),
    [candidateTree, keyword],
  );
  const visibleOptions = useMemo(
    () => collectTreeOptions(visibleTree, optionById),
    [optionById, visibleTree],
  );

  const recommendedOptions = useMemo(() => {
    if (!sourceText.trim()) return [];
    const codeCount = new Map<string, number>();
    options.forEach((item) => {
      const code = item.code.toUpperCase();
      if (!code) return;
      codeCount.set(code, (codeCount.get(code) || 0) + 1);
    });
    return options.filter(
      (item) =>
        Boolean(item.code) &&
        codeCount.get(item.code.toUpperCase()) === 1 &&
        includesExactCode(sourceText, item.code),
    );
  }, [options, sourceText]);

  const selectedOptions = selectedKeys
    .map((key) => options.find((item) => item.key === key))
    .filter((item): item is ModelLinkOption => Boolean(item));
  const recommendedKeys = new Set(
    recommendedOptions.map((item) => item.key),
  );

  const changeModelType = (nextType: ModelLinkOption["type"]) => {
    setModelType(nextType);
    setKeyword("");
    setExpandedKeys(
      new Set(
        buildStructureTree(nextType).map((node) => `${nextType}-${node.id}`),
      ),
    );
  };

  const toggleExpanded = (nodeId: number) => {
    const key = `${modelType}-${nodeId}`;
    setExpandedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSelection = (key: string) => {
    onChange(
      selectedKeys.includes(key)
        ? selectedKeys.filter((item) => item !== key)
        : [...selectedKeys, key],
    );
  };

  const selectCurrentResults = () => {
    onChange(
      Array.from(
        new Set([...selectedKeys, ...visibleOptions.map((item) => item.key)]),
      ),
    );
  };

  const applyRecommendations = () => {
    onChange(
      Array.from(
        new Set([
          ...selectedKeys,
          ...recommendedOptions.map((item) => item.key),
        ]),
      ),
    );
  };

  const renderNode = (node: TreeNode, level: number): ReactNode => {
    const hasChildren = Boolean(node.children?.length);
    const expanded =
      Boolean(keyword.trim()) ||
      expandedKeys.has(`${modelType}-${node.id}`);
    const option = optionById.get(node.id);
    const checked = option ? selectedKeys.includes(option.key) : false;
    const icon =
      node.level === "L1" ? (
        <Layers size={13} className="flex-shrink-0 text-blue-500" />
      ) : node.level === "L2" ? (
        <FolderTree size={13} className="flex-shrink-0 text-cyan-600" />
      ) : (
        <Box
          size={13}
          className={`flex-shrink-0 ${
            node.category === "system"
              ? "text-purple-500"
              : "text-orange-500"
          }`}
        />
      );

    return (
      <div key={`${modelType}-${node.id}`}>
        <div
          className={`flex min-h-8 cursor-pointer items-center gap-1.5 border-b border-admin-border/70 pr-3 text-xs transition-colors ${
            checked ? "bg-blue-50" : "hover:bg-gray-50"
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() =>
            option ? toggleSelection(option.key) : toggleExpanded(node.id)
          }
        >
          {hasChildren ? (
            <button
              type="button"
              className="flex h-5 w-5 flex-shrink-0 items-center justify-center text-admin-muted hover:text-admin-primary"
              title={expanded ? "收起节点" : "展开节点"}
              onClick={(event) => {
                event.stopPropagation();
                toggleExpanded(node.id);
              }}
            >
              {expanded ? (
                <ChevronDown size={13} />
              ) : (
                <ChevronRight size={13} />
              )}
            </button>
          ) : (
            <span className="w-5 flex-shrink-0" />
          )}
          {icon}
          <span className="min-w-0 flex-1 truncate text-admin-text">
            {node.name}
          </span>
          {node.kks && (
            <span className="flex-shrink-0 font-mono text-[10px] text-admin-muted">
              {node.kks}
            </span>
          )}
          {option?.isGroup && node.equipmentCount > 0 && (
            <span className="flex-shrink-0 text-[10px] text-admin-muted">
              {node.equipmentCount}
              {modelType === "equipment" ? "台" : "条"}
            </span>
          )}
          {option && recommendedKeys.has(option.key) && (
            <span className="flex-shrink-0 rounded bg-green-50 px-1.5 py-0.5 text-[10px] text-green-700">
              自动匹配
            </span>
          )}
          {option && (
            <input
              type="checkbox"
              className="ml-1 flex-shrink-0 cursor-pointer"
              checked={checked}
              aria-label={`选择${node.name}`}
              onClick={(event) => event.stopPropagation()}
              onChange={() => toggleSelection(option.key)}
            />
          )}
        </div>
        {hasChildren &&
          expanded &&
          node.children!.map((child) => renderNode(child, level + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-2.5">
      <DevNote
        id="drawing-link-auto-match"
        title="KKS编码自动匹配区"
        summary="从资料编号/名称/文件名中自动识别KKS编码并推荐唯一匹配对象"
        items={[
          { label: "匹配规则", value: "sourceText（资料编号+名称+文件名）中按词边界精确匹配候选KKS编码（includesExactCode）；仅当该编码在候选集中唯一时推荐；无唯一匹配时提示人工检索" },
          { label: "交互逻辑", value: "存在推荐时绿色高亮显示识别出的编码并出现“采用推荐”按钮（一键加入已选）；无推荐时蓝色提示" },
          { label: "后续步骤", value: "正式系统：由服务端解析资料并调用KKS编码识别服务返回匹配候选" },
        ]}
        wrapClassName="block w-full"
      >
      <div
        className={`flex items-start justify-between gap-3 rounded border px-3 py-2.5 ${
          recommendedOptions.length > 0
            ? "border-green-200 bg-green-50"
            : "border-blue-100 bg-blue-50/60"
        }`}
      >
        <div className="flex min-w-0 items-start gap-2">
          <Sparkles
            size={15}
            className={
              recommendedOptions.length > 0
                ? "mt-0.5 flex-shrink-0 text-green-600"
                : "mt-0.5 flex-shrink-0 text-admin-primary"
            }
          />
          <div className="min-w-0">
            <div className="text-xs font-medium text-admin-text">
              KKS编码自动匹配
            </div>
            {recommendedOptions.length > 0 ? (
              <div className="mt-1 text-[11px] leading-5 text-green-700">
                已从资料编号、名称或文件名中识别到{" "}
                {recommendedOptions.map((item) => item.code).join("、")}，共{" "}
                {recommendedOptions.length} 个唯一匹配对象。
              </div>
            ) : (
              <div className="mt-1 text-[11px] leading-5 text-admin-muted">
                系统将识别资料中的KKS编码；无法唯一匹配时，请按编码、名称或所属系统人工检索。
              </div>
            )}
          </div>
        </div>
        {recommendedOptions.length > 0 && (
          <button
            type="button"
            className="flex flex-shrink-0 items-center gap-1 rounded bg-green-600 px-2.5 py-1.5 text-xs text-white hover:bg-green-700"
            onClick={applyRecommendations}
          >
            <Check size={12} />
            采用推荐
          </button>
        )}
      </div>
      </DevNote>

      <div className="grid grid-cols-[minmax(240px,1fr)_160px] gap-2">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-admin-muted"
          />
          <input
            className="input-base w-full pl-8"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索结构树节点名称或KKS编码"
          />
        </div>
        <select
          className="input-base w-full"
          value={modelType}
          onChange={(event) =>
            changeModelType(event.target.value as ModelLinkOption["type"])
          }
        >
          <option value="equipment">设备结构树</option>
          <option value="pipeline">管路结构树</option>
        </select>
      </div>

      <DevNote
        id="drawing-link-tree"
        title="结构树选择器（左树/右选）"
        summary="按设备或管路结构树多选挂接对象，支持任意层级与当前结果批量选择"
        items={[
          { label: "数据来源", value: "candidateTree：buildStructureTree(type) 中剔除不可挂接节点；可见节点按关键字过滤（名称或KKS），命中时保留祖先链" },
          { label: "交互逻辑", value: "类型下拉切换设备/管路结构树（清空关键字并默认展开首层）；节点点击：有勾选框节点切换选中，无勾选框节点仅展开/收起；“选择当前结果”批量勾选可见项；右侧已选对象可单个移除或清空" },
          { label: "挂接能力", value: "结构树任意层级均可选择（含组织节点 L1-L3），支持一份资料挂接多个组织节点或末级模型（符合图纸管理需求）；保存后立即生效并同步到数字孪生页面的关联资料" },
          { label: "权限", value: "管理员/操作人员可维护挂接；浏览人员不可修改" },
        ]}
        wrapClassName="block w-full"
      >
      <div className="grid h-[300px] grid-cols-[minmax(0,1.45fr)_minmax(230px,0.75fr)] overflow-hidden rounded border border-admin-border">
        <div className="flex min-w-0 flex-col border-r border-admin-border">
          <div className="flex h-10 items-center justify-between border-b border-admin-border bg-gray-50 px-3">
            <span className="text-xs font-medium text-admin-text">
              {modelType === "equipment" ? "设备结构树" : "管路结构树"}
              <span className="ml-1 font-normal text-admin-muted">
                {visibleOptions.length}/{activeOptions.length}项
              </span>
            </span>
            <button
              type="button"
              className="text-xs text-admin-primary hover:underline disabled:text-admin-muted disabled:no-underline"
              disabled={visibleOptions.length === 0}
              onClick={selectCurrentResults}
            >
              选择当前结果
            </button>
          </div>
          <div className="flex-1 overflow-auto">
            {visibleTree.length > 0 ? (
              visibleTree.map((node) => renderNode(node, 0))
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-admin-muted">
                当前结构树中未找到匹配节点
              </div>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-col bg-slate-50/50">
          <div className="flex h-10 items-center justify-between border-b border-admin-border px-3">
            <span className="text-xs font-medium text-admin-text">
              已选对象
              <span className="ml-1 font-normal text-admin-muted">
                {selectedOptions.length}项
              </span>
            </span>
            {selectedOptions.length > 0 && (
              <button
                type="button"
                className="text-xs text-admin-danger hover:underline"
                onClick={() => onChange([])}
              >
                清空
              </button>
            )}
          </div>
          <div className="flex-1 overflow-auto p-2">
            {selectedOptions.length > 0 ? (
              <div className="space-y-1.5">
                {selectedOptions.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-start gap-2 rounded border border-admin-border bg-white px-2.5 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="min-w-0 flex-1 truncate font-mono text-[11px] font-medium text-admin-text">
                          {item.code || `${item.level}组织节点`}
                        </span>
                        <Tag
                          color={
                            item.isGroup
                              ? "purple"
                              : item.type === "equipment"
                                ? "blue"
                                : "cyan"
                          }
                        >
                          {item.isGroup
                            ? "组织节点"
                            : item.type === "equipment"
                              ? "设备"
                              : "管路"}
                        </Tag>
                      </div>
                      <div className="mt-0.5 truncate text-[11px] text-admin-muted">
                        {item.name}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="mt-0.5 flex-shrink-0 text-admin-muted hover:text-admin-danger"
                      title="移除"
                      onClick={() => toggleSelection(item.key)}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center px-4 text-center text-xs leading-5 text-admin-muted">
                暂未选择挂接对象，可从左侧选择组织节点、设备或管路。
              </div>
            )}
          </div>
        </div>
      </div>
      </DevNote>

      <div className="flex items-center justify-between text-[10px] text-admin-muted">
        <span>结构树任意层级均可选择，支持一份资料挂接多个组织节点或末级模型。</span>
        <span>保存后立即生效，并同步到数字孪生页面的关联资料。</span>
      </div>
    </div>
  );
}
