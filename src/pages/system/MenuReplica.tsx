import { useMemo, useState } from "react";
import {
  Box,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  CircleHelp,
  CircleDot,
  FolderTree,
  Menu as MenuIcon,
  Plus,
  RotateCcw,
  Search,
} from "lucide-react";
import { message } from "@/components/common/Message";
import {
  useSystemStore,
  type EnableStatus,
  type MenuType,
  type SystemMenu,
} from "@/store/system";
import {
  ActionButton,
  CompactTable,
  FormRow,
  LinkButton,
  ModalButton,
  QueryField,
  QueryPanel,
  RadioGroup,
  Segmented,
  SystemConfirm,
  SystemModal,
  SystemPage,
  compactInputClass,
  type CompactColumn,
} from "./components/SystemAdmin";

interface MenuRow extends SystemMenu {
  level: number;
  hasChildren: boolean;
}

const emptySearch = {
  name: "",
  status: "",
};

const menuIconOptions = [
  "Monitor",
  "LayoutDashboard",
  "Cpu",
  "Box",
  "GitBranch",
  "Network",
  "Settings",
  "FileText",
  "Building2",
  "BriefcaseBusiness",
  "User",
  "ShieldCheck",
  "BookOpen",
  "Layers3",
  "FileSearch",
  "ClipboardList",
  "LogIn",
  "Menu",
];

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

const typeLabel = (type: MenuType) => {
  if (type === "directory") return "目录";
  if (type === "menu") return "菜单";
  return "按钮";
};

const helpLabel = (label: string, help: string) => (
  <span className="inline-flex items-center justify-end gap-1" title={help}>
    <span>{label}</span>
    <CircleHelp size={12} className="text-slate-400" />
  </span>
);

export default function MenuReplica() {
  const { menus, addMenu, updateMenu, deleteMenus } = useSystemStore();
  const [searchValues, setSearchValues] = useState(emptySearch);
  const [appliedSearch, setAppliedSearch] = useState(emptySearch);
  const [expanded, setExpanded] = useState<Set<number>>(
    new Set(menus.map((menu) => menu.id))
  );
  const [editing, setEditing] = useState<SystemMenu | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [deleteIds, setDeleteIds] = useState<number[]>([]);
  const [form, setForm] = useState({
    parentId: "",
    type: "directory" as MenuType,
    name: "",
    icon: "",
    path: "",
    component: "",
    componentName: "",
    permission: "",
    sort: "1",
    visible: true,
    alwaysShow: false,
    cache: true,
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

  const parentMenus = useMemo(() => {
    const excluded = editing
      ? new Set([editing.id, ...getDescendants(menus, editing.id)])
      : new Set<number>();
    return menus
      .filter((menu) => menu.type !== "button" && !excluded.has(menu.id))
      .sort((a, b) => a.sort - b.sort);
  }, [editing, menus]);

  const openForm = (record?: SystemMenu, parent?: SystemMenu) => {
    setEditing(record || null);
    setIconPickerOpen(false);
    if (record) {
      setForm({
        parentId: record.parentId == null ? "" : String(record.parentId),
        type: record.type,
        name: record.name,
        icon: record.icon,
        path: record.path,
        component: record.component,
        componentName: record.componentName || "",
        permission: record.permission,
        sort: String(record.sort),
        visible: record.visible,
        alwaysShow: record.alwaysShow ?? false,
        cache: record.cache ?? true,
        status: record.status,
      });
    } else {
      setForm({
        parentId: parent ? String(parent.id) : "",
        type: parent?.type === "menu" ? "button" : parent ? "menu" : "directory",
        name: "",
        icon: "",
        path: "",
        component: "",
        componentName: "",
        permission: "",
        sort: "1",
        visible: true,
        alwaysShow: false,
        cache: true,
        status: "enabled",
      });
    }
    setFormOpen(true);
  };

  const submitForm = () => {
    if (!form.name.trim()) return message.warning("请输入菜单名称");
    if (!form.path.trim()) return message.warning("请输入路由地址");
    if (!form.sort.trim()) return message.warning("请输入显示排序");
    const payload = {
      parentId: form.parentId ? Number(form.parentId) : null,
      type: form.type,
      name: form.name.trim(),
      icon: form.icon.trim(),
      path: form.path.trim(),
      component: form.component.trim(),
      componentName: form.componentName.trim(),
      permission: form.permission.trim(),
      sort: Math.max(0, Number(form.sort) || 0),
      visible: form.visible,
      alwaysShow: form.alwaysShow,
      cache: form.cache,
      status: form.status,
    };

    if (editing) {
      updateMenu(editing.id, payload);
      message.success("菜单已修改");
    } else {
      addMenu({
        id: Math.max(0, ...menus.map((menu) => menu.id)) + 1,
        ...payload,
        createdAt: new Date().toLocaleString("zh-CN", { hour12: false }),
      });
      if (payload.parentId) {
        setExpanded((current) => new Set([...current, payload.parentId!]));
      }
      message.success("菜单已新增");
    }
    setFormOpen(false);
  };

  const toggleAll = () => {
    const branchIds = menus
      .filter((menu) => menus.some((item) => item.parentId === menu.id))
      .map((menu) => menu.id);
    setExpanded(expanded.size ? new Set() : new Set(branchIds));
  };

  const columns: CompactColumn<MenuRow>[] = [
    {
      key: "name",
      title: "菜单名称",
      width: 230,
      render: (record) => (
        <div
          className="flex items-center gap-1.5"
          style={{ paddingLeft: `${record.level * 20}px` }}
        >
          {record.hasChildren ? (
            <button
              type="button"
              className="text-slate-400 hover:text-blue-500"
              onClick={() =>
                setExpanded((current) => {
                  const next = new Set(current);
                  next.has(record.id) ? next.delete(record.id) : next.add(record.id);
                  return next;
                })
              }
            >
              {expanded.has(record.id) || matchSet ? (
                <ChevronDown size={13} />
              ) : (
                <ChevronRight size={13} />
              )}
            </button>
          ) : (
            <span className="w-[13px]" />
          )}
          {record.type === "directory" ? (
            <FolderTree size={13} className="text-blue-500" />
          ) : record.type === "menu" ? (
            <MenuIcon size={13} className="text-green-500" />
          ) : (
            <CircleDot size={13} className="text-amber-500" />
          )}
          <span>{record.name}</span>
        </div>
      ),
    },
    {
      key: "type",
      title: "类型",
      width: 80,
      render: (record) => (
        <span
          className={`inline-flex rounded-sm px-2 py-0.5 text-[11px] ${
            record.type === "directory"
              ? "bg-blue-50 text-blue-500"
              : record.type === "menu"
                ? "bg-green-50 text-green-600"
                : "bg-amber-50 text-amber-600"
          }`}
        >
          {typeLabel(record.type)}
        </span>
      ),
    },
    { key: "icon", title: "图标", width: 105, render: (record) => record.icon || "-" },
    { key: "sort", title: "排序", width: 70 },
    {
      key: "permission",
      title: "权限标识",
      width: 190,
      render: (record) => record.permission || "-",
    },
    {
      key: "component",
      title: "组件路径",
      width: 180,
      render: (record) => record.component || "-",
    },
    {
      key: "componentName",
      title: "组件名称",
      width: 130,
      render: (record) => record.componentName || "-",
    },
    {
      key: "status",
      title: "状态",
      width: 80,
      render: (record) => (
        <button
          type="button"
          className={`rounded-sm px-2 py-0.5 text-[11px] ${
            record.status === "enabled"
              ? "bg-blue-50 text-blue-500"
              : "bg-slate-100 text-slate-400"
          }`}
          onClick={() =>
            updateMenu(record.id, {
              status: record.status === "enabled" ? "disabled" : "enabled",
            })
          }
        >
          {record.status === "enabled" ? "开启" : "关闭"}
        </button>
      ),
    },
    {
      key: "visible",
      title: "显示",
      width: 75,
      render: (record) => (record.visible ? "显示" : "隐藏"),
    },
    {
      key: "cache",
      title: "缓存",
      width: 75,
      render: (record) =>
        record.type === "menu" ? (record.cache === false ? "否" : "是") : "-",
    },
    { key: "createdAt", title: "创建时间", width: 165 },
    {
      key: "actions",
      title: "操作",
      width: 145,
      render: (record) => (
        <div className="flex items-center gap-3">
          <LinkButton onClick={() => openForm(record)}>修改</LinkButton>
          {record.type !== "button" && (
            <LinkButton onClick={() => openForm(undefined, record)}>新增</LinkButton>
          )}
          <LinkButton
            danger
            onClick={() =>
              setDeleteIds([record.id, ...getDescendants(menus, record.id)])
            }
          >
            删除
          </LinkButton>
        </div>
      ),
    },
  ];

  return (
    <SystemPage>
      <QueryPanel
        fields={
          <>
            <QueryField label="菜单名称">
              <input
                className={`${compactInputClass} w-48`}
                placeholder="请输入菜单名称"
                value={searchValues.name}
                onChange={(event) =>
                  setSearchValues((current) => ({ ...current, name: event.target.value }))
                }
              />
            </QueryField>
            <QueryField label="状态">
              <select
                className={`${compactInputClass} w-32`}
                value={searchValues.status}
                onChange={(event) =>
                  setSearchValues((current) => ({ ...current, status: event.target.value }))
                }
              >
                <option value="">请选择状态</option>
                <option value="enabled">开启</option>
                <option value="disabled">关闭</option>
              </select>
            </QueryField>
          </>
        }
        actions={
          <>
            <ActionButton
              icon={<Search size={13} />}
              onClick={() => setAppliedSearch({ ...searchValues })}
            >
              搜索
            </ActionButton>
            <ActionButton
              icon={<RotateCcw size={13} />}
              onClick={() => {
                setSearchValues(emptySearch);
                setAppliedSearch(emptySearch);
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
              icon={<ChevronsUpDown size={13} />}
              onClick={toggleAll}
            >
              展开/折叠
            </ActionButton>
          </>
        }
      />

      <CompactTable
        columns={columns}
        data={rows}
        minWidth={1580}
        pagination={false}
        emptyText="暂无菜单数据"
      />

      <SystemModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "编辑" : "新增"}
        width={540}
        footer={
          <>
            <ModalButton primary onClick={submitForm}>确定</ModalButton>
            <ModalButton onClick={() => setFormOpen(false)}>取消</ModalButton>
          </>
        }
      >
        <FormRow label="上级菜单" className="mb-2.5">
          <select
            className={`${compactInputClass} w-full`}
            value={form.parentId}
            onChange={(event) =>
              setForm((current) => ({ ...current, parentId: event.target.value }))
            }
          >
            <option value="">主类目</option>
            {parentMenus.map((menu) => (
              <option key={menu.id} value={menu.id}>
                {menu.name}
              </option>
            ))}
          </select>
        </FormRow>
        <FormRow label="菜单名称" required className="mb-2.5">
          <input
            className={`${compactInputClass} w-full`}
            placeholder="请输入菜单名称"
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
          />
        </FormRow>
        <FormRow label="菜单类型" required className="mb-2.5">
          <Segmented
            value={form.type}
            options={[
              { label: "目录", value: "directory" },
              { label: "菜单", value: "menu" },
              { label: "按钮", value: "button" },
            ]}
            onChange={(value) => {
              setIconPickerOpen(false);
              setForm((current) => ({ ...current, type: value as MenuType }));
            }}
          />
        </FormRow>
        <FormRow label="菜单图标" className="mb-2.5">
          <div className="relative w-44">
            <div className="flex">
              <input
                className={`${compactInputClass} min-w-0 flex-1 rounded-r-none`}
                placeholder="请选择菜单图标"
                value={form.icon}
                onChange={(event) =>
                  setForm((current) => ({ ...current, icon: event.target.value }))
                }
              />
              <button
                type="button"
                title="选择菜单图标"
                onClick={() => setIconPickerOpen((current) => !current)}
                className="flex h-8 w-9 items-center justify-center rounded-r-sm border border-l-0 border-slate-200 bg-white text-slate-500 hover:text-blue-500"
              >
                <Box size={13} />
              </button>
            </div>
            {iconPickerOpen && (
              <div className="absolute left-0 top-9 z-30 grid w-[300px] grid-cols-3 gap-1 rounded-sm border border-slate-200 bg-white p-2 shadow-lg">
                {menuIconOptions.map((icon) => (
                  <button
                    type="button"
                    key={icon}
                    title={icon}
                    onClick={() => {
                      setForm((current) => ({ ...current, icon }));
                      setIconPickerOpen(false);
                    }}
                    className="truncate rounded-sm px-2 py-1.5 text-left text-[11px] text-slate-500 hover:bg-blue-50 hover:text-blue-500"
                  >
                    {icon}
                  </button>
                ))}
              </div>
            )}
          </div>
        </FormRow>
        <FormRow
          label={helpLabel("路由地址", "访问该菜单时使用的路由地址")}
          required
          className="mb-2.5"
        >
          <input
            className={`${compactInputClass} w-full`}
            placeholder="请输入路由地址"
            value={form.path}
            onChange={(event) =>
              setForm((current) => ({ ...current, path: event.target.value }))
            }
          />
        </FormRow>
        <FormRow label="显示排序" required className="mb-2.5">
          <input
            type="number"
            min={0}
            className={`${compactInputClass} w-24`}
            value={form.sort}
            onChange={(event) =>
              setForm((current) => ({ ...current, sort: event.target.value }))
            }
          />
        </FormRow>
        <FormRow
          label={helpLabel("菜单状态", "关闭后该菜单及其路由不可使用")}
          className="mb-2.5"
        >
          <RadioGroup
            value={form.status}
            options={[
              { label: "开启", value: "enabled" },
              { label: "关闭", value: "disabled" },
            ]}
            onChange={(value) =>
              setForm((current) => ({ ...current, status: value as EnableStatus }))
            }
          />
        </FormRow>
        <FormRow
          label={helpLabel("显示状态", "隐藏后不在菜单栏显示，但路由仍然保留")}
          className="mb-2.5"
        >
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
        <FormRow
          label={helpLabel("总是显示", "目录只有一个子菜单时是否仍显示目录")}
          className="mb-0"
        >
          <RadioGroup
            value={form.alwaysShow}
            options={[
              { label: "总是", value: true },
              { label: "不是", value: false },
            ]}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                alwaysShow: value as boolean,
              }))
            }
          />
        </FormRow>
      </SystemModal>

      <SystemConfirm
        open={deleteIds.length > 0}
        onCancel={() => setDeleteIds([])}
        onConfirm={() => {
          deleteMenus(deleteIds);
          setDeleteIds([]);
          message.success("菜单已删除");
        }}
      />
    </SystemPage>
  );
}
