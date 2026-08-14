import { useMemo, useState } from "react";
import {
  ArrowUpDown,
  BookOpen,
  Box,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  ClipboardList,
  Cpu,
  FileSearch,
  FileText,
  GitBranch,
  Layers3,
  LayoutDashboard,
  LogIn,
  Menu as MenuIcon,
  Monitor,
  Network,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  User,
  type LucideIcon,
} from "lucide-react";
import { message } from "@/components/common/Message";
import {
  ActionButton,
  compactInputClass,
  FormRow,
  LinkButton,
  ModalButton,
  RadioGroup,
  Segmented,
  SystemConfirm,
  SystemModal,
  SystemPage,
  ToggleSwitch,
} from "@/pages/system/components/SystemAdmin";
import {
  useSystemStore,
  type EnableStatus,
  type MenuType,
  type SystemMenu,
} from "@/store/system";
import { DevNote } from "@/components/devNotes/DevNote";

interface MenuRow extends SystemMenu {
  level: number;
  hasChildren: boolean;
}

const iconMap: Record<string, LucideIcon> = {
  Monitor,
  LayoutDashboard,
  Cpu,
  Box,
  GitBranch,
  Network,
  Settings,
  FileText,
  Building2,
  BriefcaseBusiness,
  User,
  ShieldCheck,
  BookOpen,
  Layers3,
  FileSearch,
  ClipboardList,
  LogIn,
  Menu: MenuIcon,
};

function MenuGlyph({ name }: { name: string }) {
  const Icon = iconMap[name] || MenuIcon;
  return <Icon size={13} strokeWidth={1.8} className="text-slate-700" />;
}

const getDescendants = (menus: SystemMenu[], id: number) => {
  const result: number[] = [];
  const visit = (parentId: number) => {
    menus
      .filter((menu) => menu.parentId === parentId)
      .forEach((menu) => {
        result.push(menu.id);
        visit(menu.id);
      });
  };
  visit(id);
  return result;
};

export default function MenuManage() {
  const { menus, addMenu, updateMenu, deleteMenus } = useSystemStore();
  const [searchValues, setSearchValues] = useState({ name: "", status: "" });
  const [appliedSearch, setAppliedSearch] = useState({ name: "", status: "" });
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [editing, setEditing] = useState<SystemMenu | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteIds, setDeleteIds] = useState<number[]>([]);
  const [form, setForm] = useState({
    parentId: "",
    type: "menu" as MenuType,
    name: "",
    icon: "",
    path: "",
    component: "",
    permission: "",
    sort: "1",
    visible: true,
    alwaysShow: true,
    status: "enabled" as EnableStatus,
  });

  const matchSet = useMemo(() => {
    if (!appliedSearch.name && !appliedSearch.status) return null;
    const result = new Set<number>();
    const addAncestors = (menu: SystemMenu) => {
      result.add(menu.id);
      if (menu.parentId != null) {
        const parent = menus.find((item) => item.id === menu.parentId);
        if (parent) addAncestors(parent);
      }
    };
    menus.forEach((menu) => {
      if (
        (!appliedSearch.name || menu.name.includes(appliedSearch.name)) &&
        (!appliedSearch.status || menu.status === appliedSearch.status)
      ) {
        addAncestors(menu);
      }
    });
    return result;
  }, [appliedSearch, menus]);

  const rows = useMemo(() => {
    const result: MenuRow[] = [];
    const visit = (parentId: number | null, level: number) => {
      menus
        .filter((menu) => menu.parentId === parentId)
        .sort((a, b) => a.sort - b.sort)
        .forEach((menu) => {
          if (matchSet && !matchSet.has(menu.id)) return;
          const hasChildren = menus.some((item) => item.parentId === menu.id);
          result.push({ ...menu, level, hasChildren });
          if (hasChildren && (expanded.has(menu.id) || matchSet)) {
            visit(menu.id, level + 1);
          }
        });
    };
    visit(null, 0);
    return result;
  }, [expanded, matchSet, menus]);

  const expandableIds = useMemo(
    () =>
      menus
        .filter((menu) => menus.some((item) => item.parentId === menu.id))
        .map((menu) => menu.id),
    [menus]
  );
  const allExpanded =
    expandableIds.length > 0 && expandableIds.every((id) => expanded.has(id));

  const parentMenus = useMemo(() => {
    if (!editing) return menus.filter((menu) => menu.type !== "button");
    const excluded = new Set([editing.id, ...getDescendants(menus, editing.id)]);
    return menus.filter(
      (menu) => menu.type !== "button" && !excluded.has(menu.id)
    );
  }, [editing, menus]);

  const openForm = (record?: SystemMenu, parentId?: number) => {
    setEditing(record || null);
    setForm(
      record
        ? {
            parentId: record.parentId == null ? "" : String(record.parentId),
            type: record.type,
            name: record.name,
            icon: record.icon,
            path: record.path,
            component: record.component,
            permission: record.permission,
            sort: String(record.sort),
            visible: record.visible,
            alwaysShow: record.alwaysShow ?? true,
            status: record.status,
          }
        : {
            parentId: parentId ? String(parentId) : "",
            type: parentId ? "menu" : "directory",
            name: "",
            icon: "",
            path: "",
            component: "",
            permission: "",
            sort: "1",
            visible: true,
            alwaysShow: true,
            status: "enabled",
          }
    );
    setFormOpen(true);
  };

  const submitForm = () => {
    if (!form.name.trim()) return message.warning("请输入菜单名称");
    if (!form.path.trim()) return message.warning("请输入路由地址");
    if (!form.sort || Number(form.sort) < 1) {
      return message.warning("请输入正确的显示排序");
    }
    const payload = {
      parentId: form.parentId ? Number(form.parentId) : null,
      type: form.type,
      name: form.name.trim(),
      icon: form.icon.trim(),
      path: form.path.trim(),
      component: editing?.component || "",
      permission: editing?.permission || "",
      sort: Math.max(1, Number(form.sort) || 1),
      visible: form.visible,
      alwaysShow: form.alwaysShow,
      status: form.status,
    };
    if (editing) {
      updateMenu(editing.id, payload);
      message.success("菜单信息已修改");
    } else {
      addMenu({
        id: Math.max(0, ...menus.map((menu) => menu.id)) + 1,
        ...payload,
        createdAt: new Date().toLocaleString("zh-CN", { hour12: false }),
      });
      if (payload.parentId) {
        setExpanded((current) => new Set([...current, payload.parentId!]));
      }
      message.success("菜单节点已新增");
    }
    setFormOpen(false);
  };

  return (
    <SystemPage>
      <DevNote
        id="menu-query"
        title="菜单管理-查询与操作区"
        summary="按菜单名称/状态查询，提供新增/展开折叠/刷新菜单缓存"
        items={[
          { label: "查询条件", value: "菜单名称（包含）、状态（开启/关闭）；命中时保留父级链路" },
          { label: "交互逻辑", value: "新增 → 表单弹窗；展开/折叠全部层级；刷新菜单缓存 → 提示“菜单缓存刷新成功”（原型占位）" },
          { label: "权限", value: "管理员可维护菜单" },
        ]}
        wrapClassName="block flex-shrink-0"
      >
      <div className="flex shrink-0 flex-wrap items-center gap-x-7 gap-y-2 rounded-sm border border-slate-200 bg-white px-3 py-2">
        <label className="flex items-center gap-2 whitespace-nowrap">
          <span>菜单名称</span>
          <input
            className={`${compactInputClass} w-44`}
            value={searchValues.name}
            placeholder="请输入菜单名称"
            onChange={(event) =>
              setSearchValues((current) => ({ ...current, name: event.target.value }))
            }
          />
        </label>
        <label className="flex items-center gap-2 whitespace-nowrap">
          <span>状态</span>
          <select
            className={`${compactInputClass} w-44`}
            value={searchValues.status}
            onChange={(event) =>
              setSearchValues((current) => ({ ...current, status: event.target.value }))
            }
          >
            <option value="">请选择菜单状态</option>
            <option value="enabled">开启</option>
            <option value="disabled">关闭</option>
          </select>
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <ActionButton
            icon={<Search size={13} />}
            onClick={() => setAppliedSearch(searchValues)}
          >
            搜索
          </ActionButton>
          <ActionButton
            icon={<RotateCcw size={13} />}
            onClick={() => {
              setSearchValues({ name: "", status: "" });
              setAppliedSearch({ name: "", status: "" });
            }}
          >
            重置
          </ActionButton>
          <ActionButton
            tone="primary"
            icon={<Plus size={13} />}
            onClick={() => openForm()}
          >
            新增
          </ActionButton>
          <ActionButton
            tone="danger"
            icon={<ChevronsUpDown size={13} />}
            onClick={() =>
              setExpanded(allExpanded ? new Set() : new Set(expandableIds))
            }
          >
            展开/折叠
          </ActionButton>
          <ActionButton
            icon={<RefreshCw size={13} />}
            onClick={() => message.success("菜单缓存刷新成功")}
          >
            刷新菜单缓存
          </ActionButton>
        </div>
      </div>
      </DevNote>

      <DevNote
        id="menu-table"
        title="菜单管理-树形列表"
        summary="树形展示菜单层级，行内提供新增下级/编辑/删除"
        items={[
          { label: "列定义", value: "菜单名称（缩进+展开箭头）/图标/排序/权限标识/组件路径/状态（开关切换）/操作（新增下级/编辑/删除）" },
          { label: "交互逻辑", value: "展开/收起子菜单；行内操作：新增下级（上级=当前行）、编辑、删除（有子菜单提示先删除子菜单）；状态开关直接更新" },
          { label: "数据来源", value: "menus（useSystemStore）；rows 按 parentId 递归 + sort 排序生成" },
          { label: "权限", value: "管理员可维护" },
        ]}
        wrapClassName="block flex flex-1"
      >
      <div className="min-h-0 flex-1 overflow-auto rounded-sm border border-slate-200 bg-white">
        <table className="w-full min-w-[920px] border-collapse text-[12px]">
          <thead className="sticky top-0 z-10 bg-white text-slate-500">
            <tr className="h-10 border-b border-slate-100">
              <th className="w-[18%] px-3 text-left font-normal">菜单名称</th>
              <th className="w-[7%] px-3 text-center font-normal">图标</th>
              <th className="w-[7%] px-3 text-left font-normal">排序</th>
              <th className="w-[16%] px-3 text-left font-normal">权限标识</th>
              <th className="px-3 text-left font-normal">组件路径</th>
              <th className="w-[9%] px-3 text-center font-normal">
                <span className="inline-flex items-center gap-1">
                  <ArrowUpDown size={11} className="text-slate-300" />
                  状态
                </span>
              </th>
              <th className="w-[16%] px-3 text-center font-normal">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((record) => (
              <tr
                key={record.id}
                className="h-10 border-b border-slate-100 text-slate-600 hover:bg-blue-50/40"
              >
                <td className="px-3">
                  <div
                    className="flex items-center gap-1"
                    style={{ paddingLeft: `${record.level * 18}px` }}
                  >
                    {record.hasChildren ? (
                      <button
                        type="button"
                        className="text-slate-500"
                        onClick={() =>
                          setExpanded((current) => {
                            const next = new Set(current);
                            next.has(record.id) ? next.delete(record.id) : next.add(record.id);
                            return next;
                          })
                        }
                      >
                        {expanded.has(record.id) || matchSet ? (
                          <ChevronDown size={12} />
                        ) : (
                          <ChevronRight size={12} />
                        )}
                      </button>
                    ) : (
                      <span className="w-3" />
                    )}
                    <span>{record.name}</span>
                  </div>
                </td>
                <td className="px-3 text-center">
                  <span className="inline-flex items-center justify-center">
                    <MenuGlyph name={record.icon} />
                  </span>
                </td>
                <td className="px-3">{record.sort}</td>
                <td className="px-3">{record.permission || ""}</td>
                <td className="px-3">{record.component || ""}</td>
                <td className="px-3 text-center">
                  <ToggleSwitch
                    checked={record.status === "enabled"}
                    onChange={(checked) =>
                      updateMenu(record.id, {
                        status: checked ? "enabled" : "disabled",
                      })
                    }
                  />
                </td>
                <td className="px-3">
                  <div className="flex items-center justify-center gap-3">
                    <LinkButton onClick={() => openForm(record)}>修改</LinkButton>
                    <LinkButton onClick={() => openForm(undefined, record.id)}>新增</LinkButton>
                    <LinkButton
                      danger
                      onClick={() =>
                        setDeleteIds([record.id, ...getDescendants(menus, record.id)])
                      }
                    >
                      删除
                    </LinkButton>
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={7} className="h-40 text-center text-slate-400">
                  暂无菜单数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </DevNote>

      <SystemModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "编辑" : "新增"}
        width={480}
        footer={
          <>
            <ModalButton primary onClick={submitForm}>确定</ModalButton>
            <ModalButton onClick={() => setFormOpen(false)}>取消</ModalButton>
          </>
        }
      >
        <DevNote
          id="menu-form-modal"
          title="菜单管理-新增/编辑弹窗"
          summary="维护菜单9个字段（4项必填：菜单名称/菜单类型/路由地址/显示排序）"
          items={[
            { label: "字段清单", value: "上级菜单/菜单名称*/菜单类型*（目录/菜单/按钮）/菜单图标/路由地址*/显示排序*/菜单状态/显示状态/总是显示" },
            { label: "校验规则", value: "名称必填“请输入菜单名称”；路由必填“请输入路由地址”；排序为数字且≥1“请输入正确的显示排序”" },
            { label: "交互逻辑", value: "新增：上级菜单可选（空=主类目），行内“新增”自动带入当前行为上级；编辑：回填全部字段；删除：连同全部后代一并删除（getDescendants）并确认" },
            { label: "权限", value: "管理员可维护；保存后刷新菜单缓存" },
          ]}
          wrapClassName="block w-full"
        >
        <FormRow label="上级菜单">
          <select
            className={`${compactInputClass} w-full`}
            value={form.parentId}
            onChange={(event) =>
              setForm((current) => ({ ...current, parentId: event.target.value }))
            }
          >
            <option value="">主类目</option>
            {parentMenus.map((menu) => (
              <option key={menu.id} value={menu.id}>{menu.name}</option>
            ))}
          </select>
        </FormRow>
        <FormRow label="菜单名称" required>
          <input
            className={`${compactInputClass} w-full`}
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="请输入菜单名称"
          />
        </FormRow>
        <FormRow label="菜单类型" required>
          <Segmented
            value={form.type}
            options={[
              { value: "directory", label: "目录" },
              { value: "menu", label: "菜单" },
              { value: "button", label: "按钮" },
            ]}
            onChange={(value) =>
              setForm((current) => ({ ...current, type: value as MenuType }))
            }
          />
        </FormRow>
        <FormRow label="菜单图标">
          <div className="flex w-[180px]">
            <input
              className={`${compactInputClass} min-w-0 flex-1 rounded-r-none`}
              value={form.icon}
              onChange={(event) =>
                setForm((current) => ({ ...current, icon: event.target.value }))
              }
            />
            <button
              type="button"
              className="flex h-8 w-9 items-center justify-center rounded-r-sm border border-l-0 border-slate-200 text-slate-500"
              title="选择图标"
            >
              <MenuGlyph name={form.icon} />
            </button>
          </div>
        </FormRow>
        <FormRow label="路由地址" required>
          <input
            className={`${compactInputClass} w-full`}
            value={form.path}
            onChange={(event) =>
              setForm((current) => ({ ...current, path: event.target.value }))
            }
            placeholder="请输入路由地址"
          />
        </FormRow>
        <FormRow label="显示排序" required>
          <input
            type="number"
            min={1}
            className={`${compactInputClass} w-24`}
            value={form.sort}
            onChange={(event) =>
              setForm((current) => ({ ...current, sort: event.target.value }))
            }
          />
        </FormRow>
        <FormRow label="菜单状态">
          <RadioGroup
            value={form.status}
            options={[
              { label: "开启", value: "enabled" },
              { label: "关闭", value: "disabled" },
            ]}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                status: value as EnableStatus,
              }))
            }
          />
        </FormRow>
        <FormRow label="显示状态">
          <RadioGroup
            value={form.visible}
            options={[
              { label: "显示", value: true },
              { label: "隐藏", value: false },
            ]}
            onChange={(value) =>
              setForm((current) => ({ ...current, visible: value as boolean }))
            }
          />
        </FormRow>
        <FormRow label="总是显示">
          <RadioGroup
            value={form.alwaysShow}
            options={[
              { label: "总是", value: true },
              { label: "不是", value: false },
            ]}
            onChange={(value) =>
              setForm((current) => ({ ...current, alwaysShow: value as boolean }))
            }
          />
        </FormRow>
        </DevNote>
      </SystemModal>

      <SystemConfirm
        open={deleteIds.length > 0}
        onConfirm={() => {
          deleteMenus(deleteIds);
          setDeleteIds([]);
          message.success("菜单节点已删除");
        }}
        onCancel={() => setDeleteIds([])}
      />
    </SystemPage>
  );
}
