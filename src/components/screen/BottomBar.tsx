import { useState } from "react";
import { Search, Camera, RotateCcw } from "lucide-react";
import { message } from "@/components/common/Message";
import { DevNote } from "@/components/devNotes/DevNote";

interface BottomBarProps {
  onReset?: () => void;
}

export function BottomBar({ onReset }: BottomBarProps) {
  const [searchValue, setSearchValue] = useState("");

  const handleSearch = () => {
    const keyword = searchValue.trim();
    if (!keyword) {
      message.warning("请输入设备或管路的名称、KKS编码后再搜索");
      return;
    }
    message.info(
      `实际项目中：将检索“${keyword}”，匹配后由三维相机飞行定位并高亮模型，同时在右侧打开对象属性。`
    );
  };

  const handleReset = () => {
    onReset?.();
    message.info(
      "实际项目中：将清除当前选中对象，退出模型工具和漫游模式，并恢复厂区模型全景视角。"
    );
  };

  const handleScreenshot = () => {
    message.info(
      "实际项目中：将截取当前UE5三维画面及数据叠加层，并按项目名称和时间生成图片文件。"
    );
  };

  return (
    <div className="h-[48px] bg-screen-bg border-t border-[#40A9FF]/30 flex items-center justify-between px-4 text-xs">
      {/* 左侧：搜索框 */}
      <DevNote
        id="screen-bottom-search"
        title="设备/管路搜索框"
        summary="按名称或KKS编码检索设备或管路，命中后飞行定位并打开属性"
        items={[
          { label: "数据来源", value: "searchValue 本地输入状态；匹配范围：设备/管路名称、KKS编码（原型未做实际过滤，仅提示）" },
          { label: "校验规则", value: "输入为空点击搜索或回车 → 警告“请输入设备或管路的名称、KKS编码后再搜索”" },
          { label: "交互逻辑", value: "回车或点击搜索图标触发 handleSearch；原型提示“实际项目中将检索并飞行定位高亮模型，同时在右侧打开对象属性”" },
          { label: "后续步骤", value: "正式系统：调用模型检索服务返回匹配对象，UE5 相机定位高亮并联动右侧属性面板" },
          { label: "权限", value: "大屏所有已登录用户可用" },
        ]}
      >
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="搜索设备/管路编码或名称"
            className="w-64 bg-black/40 border border-[#40A9FF]/30 px-3 py-1.5 text-xs text-white placeholder-screen-muted focus:outline-none focus:border-[#40A9FF] rounded-none"
          />
          <button
            onClick={handleSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-screen-muted hover:text-[#40A9FF] transition-colors"
          >
            <Search size={14} />
          </button>
        </div>
      </div>
      </DevNote>

      {/* 右侧：快捷操作按钮 */}
      <DevNote
        id="screen-bottom-actions"
        title="底部快捷操作（全局复位/截图）"
        summary="一键复位全部视图状态，或截取当前三维画面"
        items={[
          { label: "交互逻辑", value: "全局复位 → onReset()（Screen 的 handleGlobalReset）：切回厂区模型/厂房全景、清空选中节点、展开左右面板并复位Tab、递增 sceneResetKey 重挂载 Scene3D；截图 → 原型提示“截取当前UE5画面及数据叠加层生成图片文件”" },
          { label: "联动", value: "全局复位同时清除漫游/录制/工具状态与钻取弹窗" },
          { label: "后续步骤", value: "正式系统：截图由像素流服务抓帧并叠加数据标注导出" },
          { label: "权限", value: "大屏所有已登录用户可用" },
        ]}
      >
      <div className="flex items-center gap-2">
        <button
          onClick={handleReset}
          className="flex items-center gap-1 px-3 py-1.5 bg-transparent border border-[#40A9FF]/30 text-white hover:bg-[#40A9FF]/10 hover:border-[#40A9FF] transition-colors rounded-none"
        >
          <RotateCcw size={14} />
          <span>全局复位</span>
        </button>
        <button
          onClick={handleScreenshot}
          className="flex items-center gap-1 px-3 py-1.5 bg-transparent border border-[#40A9FF]/30 text-white hover:bg-[#40A9FF]/10 hover:border-[#40A9FF] transition-colors rounded-none"
        >
          <Camera size={14} />
          <span>截图</span>
        </button>
      </div>
      </DevNote>
    </div>
  );
}
