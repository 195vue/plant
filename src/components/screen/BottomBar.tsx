import { useState } from "react";
import { Search, Camera, RotateCcw } from "lucide-react";
import { message } from "@/components/common/Message";

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
      "实际项目中：将清除当前选中对象，退出模型工具和漫游模式，并恢复工程总览默认视角。"
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

      {/* 右侧：快捷操作按钮 */}
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
    </div>
  );
}
