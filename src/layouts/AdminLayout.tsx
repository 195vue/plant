import { useState, useEffect } from "react";
import { Navigate, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Monitor,
  FileText,
  Box,
  GitBranch,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu as MenuIcon,
  User,
  KeyRound,
  LogOut,
  ShieldCheck,
  Building2,
  Network,
  Cpu,
  Layers3,
  BriefcaseBusiness,
  BookOpen,
  FileSearch,
  ClipboardList,
  LogIn,
  X,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { ConfirmModal } from "@/components/common/Modal";
import { message } from "@/components/common/Message";
import { cn } from "@/lib/utils";
import { APP_TITLE } from "@/lib/appConfig";

interface MenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  children?: MenuItem[];
}

interface VisitedTab {
  path: string;
  label: string;
  closable: boolean;
}

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, currentRole, logout, hasPermission, canAccessAdmin } =
    useAuthStore();

  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [visitedTabs, setVisitedTabs] = useState<VisitedTab[]>([
    { path: "/admin/dashboard", label: "工作台", closable: false },
  ]);

  const toggleMenu = (key: string) => {
    setExpandedMenus((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // 生成菜单 - 严格按需求文档功能清单配置
  const menus: MenuItem[] = [
    {
      key: "screen",
      label: "工程总览",
      icon: <Monitor size={18} />,
      path: "/screen",
    },
    {
      key: "dashboard",
      label: "工作台",
      icon: <LayoutDashboard size={18} />,
      path: "/admin/dashboard",
    },
    {
      key: "digital",
      label: "机电数字化",
      icon: <Cpu size={18} />,
      path: "/admin/equipment",
      children: [
        {
          key: "equipment-list",
          label: "设备数字化",
          icon: <Box size={16} />,
          path: "/admin/equipment",
        },
        {
          key: "pipeline-category",
          label: "管道数字化",
          icon: <GitBranch size={16} />,
          path: "/admin/pipeline/category",
        },
        {
          key: "structure-tree",
          label: "结构树管理",
          icon: <Network size={16} />,
          path: "/admin/system/structure-tree",
        },
        {
          key: "attribute",
          label: "属性管理",
          icon: <Settings size={16} />,
          path: "/admin/attribute",
        },
      ],
    },
    {
      key: "drawing",
      label: "图纸管理",
      icon: <FileText size={18} />,
      path: "/admin/drawing",
    },
    {
      key: "system",
      label: "系统配置",
      icon: <Settings size={18} />,
      path: "/admin/system/department",
      children: [
        {
          key: "system-department",
          label: "部门管理",
          icon: <Building2 size={16} />,
          path: "/admin/system/department",
        },
        {
          key: "system-position",
          label: "岗位管理",
          icon: <BriefcaseBusiness size={16} />,
          path: "/admin/system/position",
        },
        {
          key: "system-user",
          label: "用户管理",
          icon: <User size={16} />,
          path: "/admin/system/user",
        },
        {
          key: "system-role",
          label: "角色管理",
          icon: <ShieldCheck size={16} />,
          path: "/admin/system/role",
        },
        {
          key: "system-dict",
          label: "数据字典",
          icon: <BookOpen size={16} />,
          path: "/admin/system/dict",
        },
        {
          key: "system-attribute-template",
          label: "属性模板库",
          icon: <Layers3 size={16} />,
          path: "/admin/system/attribute-template",
        },
        {
          key: "system-log",
          label: "日志查询",
          icon: <FileSearch size={16} />,
          path: "/admin/system/log/operation",
          children: [
            {
              key: "system-log-operation",
              label: "操作日志",
              icon: <ClipboardList size={15} />,
              path: "/admin/system/log/operation",
            },
            {
              key: "system-log-login",
              label: "登录日志",
              icon: <LogIn size={15} />,
              path: "/admin/system/log/login",
            },
          ],
        },
        {
          key: "system-menu",
          label: "菜单管理",
          icon: <MenuIcon size={16} />,
          path: "/admin/system/menu",
        },
      ],
    },
  ];

  // 根据权限过滤菜单
  const filteredMenus = menus.filter((menu) => {
    if (menu.key === "screen") return true;
    if (menu.key === "dashboard") return true;
    if (menu.key === "digital") return true;
    if (menu.key === "drawing") return true;
    return hasPermission(menu.key);
  });

  const findMenuChain = (
    items: MenuItem[],
    path: string,
    parents: MenuItem[] = []
  ): MenuItem[] | null => {
    for (const item of items) {
      if (item.children) {
        const childChain = findMenuChain(item.children, path, [...parents, item]);
        if (childChain) return childChain;
      }
      if (path === item.path || path.startsWith(item.path + "/")) {
        return [...parents, item];
      }
    }
    return null;
  };

  const currentMenuChain =
    findMenuChain(filteredMenus, location.pathname) ||
    filteredMenus.filter((item) => item.key === "dashboard");

  // 当路径变化时，自动展开包含当前路径的父菜单
  useEffect(() => {
    setExpandedMenus((prev) => {
      const next = new Set(prev);
      currentMenuChain.forEach((menu) => {
        if (menu.children) next.add(menu.key);
      });
      return next;
    });
  }, [location.pathname]);

  useEffect(() => {
    const current = currentMenuChain[currentMenuChain.length - 1];
    if (!current || location.pathname === "/screen") return;
    setVisitedTabs((tabs) => {
      if (tabs.some((tab) => tab.path === location.pathname)) return tabs;
      return [
        ...tabs,
        {
          path: location.pathname,
          label: current.label,
          closable: location.pathname !== "/admin/dashboard",
        },
      ];
    });
  }, [location.pathname]);

  const getCurrentMenuLabel = () =>
    currentMenuChain.map((item) => item.label).join(" / ");

  const handleLogout = () => {
    logout();
    message.success("已退出登录");
    navigate("/login");
  };

  const closeTab = (tab: VisitedTab) => {
    if (!tab.closable) return;
    const index = visitedTabs.findIndex((item) => item.path === tab.path);
    const nextTabs = visitedTabs.filter((item) => item.path !== tab.path);
    setVisitedTabs(nextTabs);
    if (location.pathname === tab.path) {
      const fallback = nextTabs[Math.max(0, Math.min(index - 1, nextTabs.length - 1))];
      navigate(fallback?.path || "/admin/dashboard");
    }
  };

  const renderMenuItems = (items: MenuItem[], level = 0) =>
    items.map((menu) => {
      const active = currentMenuChain.some((item) => item.key === menu.key);
      const isExpanded = expandedMenus.has(menu.key);
      return (
        <div key={menu.key}>
          <div
            onClick={() => {
              if (menu.children && !(collapsed && level === 0)) {
                toggleMenu(menu.key);
              } else {
                navigate(menu.path);
              }
            }}
            className={cn(
              "flex items-center gap-3 py-2 cursor-pointer text-sm transition-colors relative",
              level === 0
                ? active
                  ? "text-white bg-admin-sidebarActive"
                  : "text-gray-300 hover:text-white hover:bg-admin-sidebarHover"
                : active
                  ? "text-blue-400 bg-blue-600/20"
                  : "text-gray-400 hover:text-white hover:bg-admin-sidebarHover"
            )}
            style={{
              paddingLeft: collapsed && level === 0 ? 16 : 16 + level * 24,
              paddingRight: 16,
            }}
            title={menu.label}
          >
            {level === 0 && active && (
              <span className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
            )}
            <span className="flex-shrink-0">{menu.icon}</span>
            {!collapsed && (
              <span className="flex-1 whitespace-nowrap">{menu.label}</span>
            )}
            {!collapsed && menu.children && (
              <ChevronRight
                size={14}
                className={cn(
                  "text-gray-400 transition-transform",
                  isExpanded && "rotate-90"
                )}
              />
            )}
          </div>
          {menu.children && !collapsed && isExpanded && (
            <div className={level === 0 ? "bg-admin-sidebarActive" : ""}>
              {renderMenuItems(menu.children, level + 1)}
            </div>
          )}
        </div>
      );
    });

  if (!canAccessAdmin()) {
    return <Navigate to="/screen" replace />;
  }

  return (
    <div className="w-full h-full flex flex-col bg-admin-bg">
      {/* 顶部布局：左导航 + 右内容 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧导航栏 */}
        <div
          className={cn(
            "bg-admin-sidebar flex flex-col transition-all duration-300 flex-shrink-0",
            collapsed ? "w-16" : "w-[220px]"
          )}
        >
          {/* Logo 区域 */}
          <div className="h-[50px] flex items-center justify-center border-b border-gray-700">
            {collapsed ? (
              <ShieldCheck size={24} className="text-blue-400" />
            ) : (
              <div className="flex items-center gap-2 px-3">
                <ShieldCheck size={20} className="flex-shrink-0 text-blue-400" />
                <span className="text-white text-xs font-medium leading-4">
                  {APP_TITLE}
                </span>
              </div>
            )}
          </div>

          {/* 菜单区域 */}
          <div className="flex-1 overflow-y-auto py-2">
            {renderMenuItems(filteredMenus)}
          </div>

          {/* 折叠按钮 */}
          <div className="p-2 border-t border-gray-700">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-full flex items-center justify-center gap-2 py-2 text-gray-300 hover:text-white hover:bg-admin-sidebarHover rounded transition-colors"
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              {!collapsed && <span className="text-sm">收起菜单</span>}
            </button>
          </div>
        </div>

        {/* 右侧内容区 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 顶部栏 */}
          <div className="h-[50px] bg-white border-b border-admin-border flex items-center justify-between px-4 flex-shrink-0">
            {/* 面包屑 */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-admin-muted">首页</span>
              {getCurrentMenuLabel() && (
                <>
                  <ChevronRight size={14} className="text-admin-muted" />
                  <span className="text-admin-text">{getCurrentMenuLabel()}</span>
                </>
              )}
            </div>

            {/* 用户菜单 */}
            <div className="relative">
              <div
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                  <User size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-admin-text">
                    {currentUser?.realName}
                  </span>
                  <span className="text-xs text-admin-muted">
                    {currentRole?.name}
                  </span>
                </div>
              </div>
              {showUserMenu && (
                <div
                  className="absolute right-0 top-full mt-1 w-32 bg-white rounded shadow-lg border border-admin-border py-1 z-50"
                  onClick={() => setShowUserMenu(false)}
                >
                  <div
                    onClick={() => message.info("修改密码功能")}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-admin-text hover:bg-blue-50 hover:text-admin-primary cursor-pointer"
                  >
                    <KeyRound size={14} />
                    修改密码
                  </div>
                  <div
                    onClick={() => setShowLogoutConfirm(true)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-admin-text hover:bg-red-50 hover:text-admin-danger cursor-pointer"
                  >
                    <LogOut size={14} />
                    退出登录
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex h-9 flex-shrink-0 items-center gap-1 overflow-x-auto border-b border-admin-border bg-white px-2">
            {visitedTabs.map((tab) => {
              const active = tab.path === location.pathname;
              return (
                <button
                  type="button"
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  className={cn(
                    "group flex h-7 shrink-0 items-center gap-1.5 rounded-sm border px-2.5 text-[12px] transition-colors",
                    active
                      ? "border-blue-400 bg-blue-50 text-blue-500"
                      : "border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:text-blue-500"
                  )}
                >
                  <span>{tab.label}</span>
                  {tab.closable && (
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label={`关闭${tab.label}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        closeTab(tab);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          event.stopPropagation();
                          closeTab(tab);
                        }
                      }}
                      className="rounded-sm text-slate-300 hover:bg-slate-200 hover:text-slate-500"
                    >
                      <X size={12} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 内容区域 */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-3">
            <Outlet />
          </div>
        </div>
      </div>

      {/* 底部状态栏 */}
      <div className="h-[24px] bg-gray-100 border-t border-admin-border flex items-center justify-center text-xs text-admin-muted" />

      {/* 退出确认弹窗 */}
      <ConfirmModal
        open={showLogoutConfirm}
        content="确定退出登录吗？"
        okText="确定退出"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
}
