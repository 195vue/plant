import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Monitor,
  FileText,
  Box,
  GitBranch,
  FolderOpen,
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
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { ConfirmModal } from "@/components/common/Modal";
import { message } from "@/components/common/Message";
import { cn } from "@/lib/utils";

interface MenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  children?: MenuItem[];
}

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, currentRole, logout, canAccessAdmin, hasPermission } =
    useAuthStore();

  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
          label: "管路数字化",
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
      path: "/admin/system/user",
      children: [
        {
          key: "system-org",
          label: "组织机构",
          icon: <Building2 size={16} />,
          path: "/admin/system/org",
        },
        {
          key: "system-user",
          label: "用户与角色",
          icon: <User size={16} />,
          path: "/admin/system/user",
        },
        {
          key: "system-dict",
          label: "数据字典",
          icon: <FolderOpen size={16} />,
          path: "/admin/system/dict",
        },
        {
          key: "system-log",
          label: "日志查询",
          icon: <FileText size={16} />,
          path: "/admin/system/log",
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

  const getCurrentMenuKey = () => {
    const path = location.pathname;
    // 找到匹配的一级菜单
    for (const menu of filteredMenus) {
      if (menu.children) {
        for (const child of menu.children) {
          if (path === child.path || path.startsWith(child.path + "/")) {
            return menu.key;
          }
        }
      }
      if (path === menu.path || path.startsWith(menu.path + "/")) {
        return menu.key;
      }
    }
    return "dashboard";
  };

  // 当路径变化时，自动展开包含当前路径的父菜单
  useEffect(() => {
    const currentKey = getCurrentMenuKey();
    const menu = filteredMenus.find((m) => m.key === currentKey);
    if (menu && menu.children) {
      setExpandedMenus((prev) => {
        if (prev.has(currentKey)) return prev;
        const next = new Set(prev);
        next.add(currentKey);
        return next;
      });
    }
  }, [location.pathname]);

  const getCurrentMenuLabel = () => {
    const currentKey = getCurrentMenuKey();
    const menu = filteredMenus.find((m) => m.key === currentKey);
    if (!menu) return "";
    const path = location.pathname;
    if (menu.children) {
      const child = menu.children.find(
        (c) => path === c.path || path.startsWith(c.path + "/")
      );
      return child ? `${menu.label} / ${child.label}` : menu.label;
    }
    return menu.label;
  };

  const handleLogout = () => {
    logout();
    message.success("已退出登录");
    navigate("/login");
  };

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
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-blue-400" />
                <span className="text-white text-sm font-medium whitespace-nowrap">
                  数字孪生管理平台
                </span>
              </div>
            )}
          </div>

          {/* 菜单区域 */}
          <div className="flex-1 overflow-y-auto py-2">
            {filteredMenus.map((menu) => (
              <div key={menu.key}>
                <div
                  onClick={() => {
                    if (menu.children) {
                      toggleMenu(menu.key);
                    } else {
                      navigate(menu.path);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 cursor-pointer text-sm transition-colors relative",
                    getCurrentMenuKey() === menu.key
                      ? "text-white bg-admin-sidebarActive"
                      : "text-gray-300 hover:text-white hover:bg-admin-sidebarHover"
                  )}
                  title={menu.label}
                >
                  {getCurrentMenuKey() === menu.key && (
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
                        expandedMenus.has(menu.key) && "rotate-90"
                      )}
                    />
                  )}
                </div>
                {/* 子菜单 */}
                {menu.children && !collapsed && expandedMenus.has(menu.key) && (
                  <div className="bg-admin-sidebarActive">
                    {menu.children.map((child) => {
                      const active =
                        location.pathname === child.path ||
                        location.pathname.startsWith(child.path + "/");
                      return (
                        <div
                          key={child.key}
                          onClick={() => navigate(child.path)}
                          className={cn(
                            "flex items-center gap-3 pl-12 pr-4 py-2 cursor-pointer text-sm transition-colors",
                            active
                              ? "text-blue-400 bg-blue-600/20"
                              : "text-gray-400 hover:text-white hover:bg-admin-sidebarHover"
                          )}
                        >
                          <span className="flex-shrink-0">{child.icon}</span>
                          <span className="whitespace-nowrap">{child.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
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
