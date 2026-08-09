import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { ConfirmModal } from "@/components/common/Modal";
import { message } from "@/components/common/Message";

interface TopNavProps {
  viewMode: "overview" | "interior";
  focusMode: "panorama" | "equipment" | "pipeline";
  onSceneChange: (scene: "panorama" | "equipment" | "pipeline" | "overview") => void;
  onBackToOverview: () => void;
}

export function TopNav({ viewMode, focusMode, onSceneChange, onBackToOverview }: TopNavProps) {
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
        <div className="flex items-center gap-2 flex-shrink-0" style={{ width: "340px" }}>
          <ShieldCheck size={22} className="text-[#40A9FF] flex-shrink-0" style={{ filter: "drop-shadow(0 0 4px rgba(64,169,255,0.6))" }} />
          <span className="text-white font-bold whitespace-nowrap overflow-hidden text-ellipsis" style={{ fontSize: "17px", textShadow: "0 0 8px rgba(64,169,255,0.5)" }}>
            乌江渡水电站数字孪生管理平台
          </span>
        </div>

        {/* 中间 导航区 */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {viewMode === "overview" ? (
            // 宏观场景：仅显示"工程总览"
            <span className="px-4 py-2 text-sm text-white font-bold border-b-2 border-[#40A9FF]">
              工程总览
            </span>
          ) : (
            // 微观场景：面包屑 + Tab 切换
            <div className="flex items-center gap-3">
              {/* 面包屑：工程总览 > 厂房内部 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={onBackToOverview}
                  className="px-3 py-2 text-sm text-screen-muted hover:text-[#40A9FF] transition-colors"
                  title="返回工程总览"
                >
                  工程总览
                </button>
                <ChevronRight size={14} className="text-screen-muted" />
                <span className="px-3 py-2 text-sm text-white font-medium">
                  厂房内部
                </span>
              </div>

              {/* Tab 切换：厂房全景 / 设备总览 / 管路总览 */}
              <div className="flex items-center gap-1 border-l border-[#40A9FF]/20 pl-3">
                {interiorTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => onSceneChange(tab.key)}
                    className={`px-4 py-2 text-sm transition-all relative ${
                      focusMode === tab.key
                        ? "text-white font-bold"
                        : "text-screen-muted hover:text-white"
                    }`}
                  >
                    {tab.label}
                    {focusMode === tab.key && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-0.5 bg-[#40A9FF]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 右侧：时间、用户名、后台管理、退出 */}
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
