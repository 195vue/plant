import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { ConfirmModal } from "@/components/common/Modal";
import { message } from "@/components/common/Message";
import { APP_TITLE } from "@/lib/appConfig";
import { DevNote } from "@/components/devNotes/DevNote";

interface TopNavProps {
  viewMode: "overview" | "interior";
  focusMode: "panorama" | "equipment" | "pipeline";
  onSceneChange: (scene: "panorama" | "equipment" | "pipeline" | "overview") => void;
}

export function TopNav({ viewMode, focusMode, onSceneChange }: TopNavProps) {
  const navigate = useNavigate();
  const { currentUser, canAccessAdmin, logout } = useAuthStore();
  const [currentTime, setCurrentTime] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, "0");
      const d = String(now.getDate()).padStart(2, "0");
      const h = String(now.getHours()).padStart(2, "0");
      const min = String(now.getMinutes()).padStart(2, "0");
      const s = String(now.getSeconds()).padStart(2, "0");
      setCurrentTime(`${y}-${m}-${d} ${h}:${min}:${s}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    message.success("已退出登录");
    navigate("/login");
  };

  // Tab 配置（微观视图下的视图切换）
  const interiorTabs = [
    { key: "panorama" as const, label: "厂房全景" },
    { key: "equipment" as const, label: "设备总览" },
    { key: "pipeline" as const, label: "管路总览" },
  ];

  return (
    <>
      <div className="h-[56px] bg-screen-bg border-b border-[#40A9FF]/30 flex items-center justify-between px-4 relative z-20 flex-shrink-0"
        style={{ boxShadow: "0 0 15px rgba(64,169,255,0.08)" }}
      >
        {/* 左侧 Logo - 发光标题 */}
        <div className="flex items-center gap-2 flex-shrink-0" style={{ width: "390px" }}>
          <ShieldCheck size={22} className="text-[#40A9FF] flex-shrink-0" style={{ filter: "drop-shadow(0 0 4px rgba(64,169,255,0.6))" }} />
          <span className="text-white font-bold whitespace-nowrap" style={{ fontSize: "15px", textShadow: "0 0 8px rgba(64,169,255,0.5)" }}>
            {APP_TITLE}
          </span>
        </div>

        {/* 中间 导航区 */}
        <DevNote
          id="screen-topnav-tabs"
          title="顶部导航（厂区模型/工程总览）"
          summary="切换工程总览与厂区模型场景；厂区模型内含厂房全景/设备总览/管路总览三个微观视图"
          items={[
            { label: "数据来源", value: "viewMode（overview/interior）与 focusMode（panorama/equipment/pipeline）由 Screen 页面维护，onSceneChange 回调驱动" },
            { label: "交互逻辑", value: "点击“厂区模型”→ 进入 interior 且 focusMode=panorama；点击“工程总览”→ 进入 overview；三个微观Tab仅在厂区模型（interior）下显示，点击切换 focusMode 并重置选中节点、右侧切回“统计”Tab" },
            { label: "场景联动", value: "切换场景时中央三维视图做过渡动画并提示“实际项目中三维相机将平滑切换…”（原型为 message 占位）" },
            { label: "权限", value: "大屏所有已登录用户可见（含浏览人员）" },
            { label: "后续步骤", value: "正式系统：由 UE5 像素流场景切换服务控制相机过渡与场景加载" },
          ]}
        >
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-1">
            {[
              { key: "interior", label: "厂区模型", scene: "panorama" as const },
              { key: "overview", label: "工程总览", scene: "overview" as const },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => onSceneChange(tab.scene)}
                className={`relative px-4 py-2 text-sm transition-all ${
                  viewMode === tab.key
                    ? "text-white font-bold"
                    : "text-screen-muted hover:text-white"
                }`}
              >
                {tab.label}
                {viewMode === tab.key && (
                  <span className="absolute bottom-0 left-0 h-0.5 w-full bg-[#40A9FF]" />
                )}
              </button>
            ))}
          </div>

          {viewMode === "interior" && (
            <div className="flex items-center gap-1 border-l border-[#40A9FF]/20 pl-3">
              {interiorTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => onSceneChange(tab.key)}
                  className={`px-3 py-2 text-xs transition-all relative ${
                    focusMode === tab.key
                      ? "text-[#40A9FF] font-bold"
                      : "text-screen-muted hover:text-white"
                  }`}
                >
                  {tab.label}
                  {focusMode === tab.key && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-px bg-[#40A9FF]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        </DevNote>

        {/* 右侧：时间、用户名、后台管理、退出 */}
        <DevNote
          id="screen-topnav-user"
          title="顶部右侧（时间/用户/后台管理/退出）"
          summary="实时时钟、当前登录用户、后台管理入口与退出操作"
          items={[
            { label: "数据来源", value: "currentTime 由 setInterval 每秒刷新（yyyy-MM-dd HH:mm:ss）；currentUser.realName 来自登录态；canAccessAdmin() 校验后台访问权限" },
            { label: "交互逻辑", value: "后台管理按钮仅 canAccessAdmin() 为 true 时显示，点击跳转 /admin/dashboard；退出点击后弹确认框，确认后 logout() 并返回 /login" },
            { label: "权限", value: "后台管理入口仅管理员/操作人员可见；浏览人员不显示该入口（canAccessAdmin 判定）" },
            { label: "后续步骤", value: "无接口调用，退出沿用全局认证状态管理" },
          ]}
        >
        <div className="flex items-center gap-4">
          <span className="text-white text-sm font-mono">
            {currentTime}
          </span>
          <span className="text-white text-sm">
            {currentUser?.realName}
          </span>
          {canAccessAdmin() && (
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-white hover:text-[#40A9FF] border border-[#40A9FF]/30 hover:border-[#40A9FF] transition-colors rounded-none"
            >
              <Settings size={14} />
              后台管理
            </button>
          )}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-white hover:text-[#ff4d4f] border border-[#40A9FF]/30 hover:border-[#ff4d4f] transition-colors rounded-none"
          >
            <LogOut size={14} />
            退出
          </button>
        </div>
        </DevNote>
      </div>

      {/* 退出确认弹窗 */}
      <ConfirmModal
        open={showLogoutConfirm}
        content="确定退出吗？"
        okText="确定退出"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  );
}
