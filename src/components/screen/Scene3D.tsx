import { useState, useEffect } from "react";
import {
  Camera,
  Maximize2,
  Image as ImageIcon,
  Play,
  Square,
  Map,
  Plus,
  Pencil,
  Trash2,
  Columns,
  Ruler,
  ArrowUpDown,
  RotateCw,
  EyeOff,
  Focus,
  RotateCcw,
} from "lucide-react";
import { Modal, ConfirmModal } from "@/components/common/Modal";
import { message } from "@/components/common/Message";
import { roamingPaths } from "@/mock";
import type { RoamingPath } from "@/types";
import damBg from "@/assets/db.png";
import panoramaBg from "@/assets/qj.png";
import equipmentBg from "@/assets/sb.png";
import pipelineBg from "@/assets/gd.png";

interface Scene3DProps {
  viewMode: "overview" | "interior";
  focusMode: "panorama" | "equipment" | "pipeline";
  selectedNode?: { title: string; code?: string };
  onSelectNode?: (title: string) => void;
  onEnterInterior?: (focus: "panorama" | "equipment" | "pipeline") => void;
  onBackToOverview?: () => void;
}

const sceneNames: Record<string, string> = {
  "overview-panorama": "工程总览",
  "interior-panorama": "厂房全景",
  "interior-equipment": "设备总览",
  "interior-pipeline": "管路总览",
};

// 设备分布数据
const equipmentPoints = [
  { x: 20, y: 30, name: "1#水泵水轮机", color: "#36cfc9", status: "running", data: "温度:42.3℃ 振动:2.1mm/s 出力:156MW" },
  { x: 45, y: 35, name: "2#水泵水轮机", color: "#36cfc9", status: "running", data: "温度:41.8℃ 振动:1.9mm/s 出力:152MW" },
  { x: 70, y: 40, name: "1#发电电动机", color: "#ffc53d", status: "running", data: "电流:3800A 温度:62℃ 功率:158MW" },
  { x: 30, y: 55, name: "1#技术供水泵", color: "#40a9ff", status: "running", data: "流量:320m³/h 压力:0.8MPa" },
  { x: 55, y: 60, name: "1#主变压器", color: "#73d13d", status: "running", data: "油温:58℃ 负载率:78%" },
  { x: 75, y: 25, name: "1#低压空压机", color: "#ff85c0", status: "warning", data: "压力:0.65MPa ⚠ 振动:4.2mm/s" },
  { x: 15, y: 65, name: "进水口闸门", color: "#b37feb", status: "running", data: "开度:100% 流量:1280m³/s" },
  { x: 85, y: 55, name: "1#开关柜", color: "#ff7a45", status: "running", data: "电压:220kV 电流:1800A" },
  { x: 40, y: 20, name: "1#进水阀", color: "#5cdbd3", status: "running", data: "开度:85% 压差:0.12MPa" },
  { x: 65, y: 70, name: "2#技术供水泵", color: "#40a9ff", status: "running", data: "流量:315m³/h 压力:0.78MPa" },
];

// 管路系统数据
const pipelineSystems = [
  { name: "技术供水主管", y: 25, color: "blue", width: "70%", data: "流量:320m³/h 压力:0.8MPa" },
  { name: "排水主管", y: 38, color: "green", width: "60%", data: "流量:180m³/h 液位:正常" },
  { name: "气系统主管", y: 51, color: "yellow", width: "65%", data: "压力:0.65MPa 温度:28℃" },
  { name: "透平油主管", y: 64, color: "orange", width: "55%", data: "流量:45m³/h 油温:58℃" },
  { name: "消防水主管", y: 77, color: "red", width: "50%", data: "压力:0.5MPa 就绪" },
];

export function Scene3D({ viewMode, focusMode, selectedNode, onSelectNode, onEnterInterior, onBackToOverview }: Scene3DProps) {
  const [fps, setFps] = useState(60);
  const [roamingMode, setRoamingMode] = useState<"none" | "free" | "path">(
    "none"
  );
  const [showPathModal, setShowPathModal] = useState(false);
  const [pathList, setPathList] = useState<RoamingPath[]>(roamingPaths);
  const [deletePathId, setDeletePathId] = useState<number | null>(null);
  const [recording, setRecording] = useState(false);
  const [activeTool, setActiveTool] = useState<
    "none" | "clip" | "measure" | "stretch" | "rotate" | "hide" | "isolate"
  >("none");
  const [sceneTransition, setSceneTransition] = useState(false);
  const [activeFloor, setActiveFloor] = useState<"generator" | "turbine" | "spiral" | "drafttube">("generator");

  // 场景切换过渡动画
  useEffect(() => {
    setSceneTransition(true);
    const timer = setTimeout(() => setSceneTransition(false), 1200);
    return () => clearTimeout(timer);
  }, [viewMode, focusMode]);

  // 模拟FPS波动
  useEffect(() => {
    const timer = setInterval(() => {
      setFps(58 + Math.floor(Math.random() * 5));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // 楼层信息 - 按需求文档表5.3-1，坝后厂房按四层划分
  const floorInfo: Record<string, { name: string; elevation: string }> = {
    generator: { name: "发电机层", elevation: "EL.660.5m" },
    turbine: { name: "水轮机层", elevation: "EL.645.0m" },
    spiral: { name: "蜗壳层", elevation: "EL.630.0m" },
    drafttube: { name: "尾水管层", elevation: "EL.615.0m" },
  };

  // 当前场景名称
  const getCurrentSceneName = () => {
    if (viewMode === "interior") {
      if (focusMode === "panorama") return `厂房全景 - ${floorInfo[activeFloor].name}`;
      if (focusMode === "equipment") return `设备总览 - ${floorInfo[activeFloor].name}`;
      if (focusMode === "pipeline") return `管路总览 - ${floorInfo[activeFloor].name}`;
    }
    return sceneNames["overview-panorama"];
  };

  // 处理设备点点击
  const handleEquipmentClick = (eqName: string) => {
    if (onSelectNode) {
      onSelectNode(eqName);
    }
    message.info(
      `实际项目中：三维相机将飞行定位并高亮“${eqName}”，右侧自动打开基础信息，可继续查看技术参数、运行数据和操作记录。`
    );
  };

  // 处理管路点击
  const handlePipelineClick = (pipeName: string) => {
    if (onSelectNode) {
      onSelectNode(pipeName);
    }
    message.info(
      `实际项目中：三维相机将沿管线定位并高亮“${pipeName}”，右侧自动打开基础信息、技术参数、运行数据和关联设备。`
    );
  };

  const handleOverviewMarkerClick = (name: string, detail: string) => {
    onSelectNode?.(name);
    message.info(
      `实际项目中：三维相机将飞行定位并高亮“${name}”，右侧将打开${detail}。`
    );
  };

  const handleFreeRoam = () => {
    if (roamingMode === "free") {
      setRoamingMode("none");
      message.info(
        "实际项目中：将退出第一人称自由漫游，保留当前相机位置并恢复常规模型交互。"
      );
    } else {
      setRoamingMode("free");
      message.info(
        "实际项目中：将进入UE5第一人称自由漫游，可使用WASD移动、鼠标调整方向并滚轮控制移动速度。"
      );
    }
  };

  const handleStopRoam = () => {
    setRoamingMode("none");
    setRecording(false);
    message.info(
      "实际项目中：将停止当前漫游或录制，保留停止位置，并重新启用模型点选和属性查看。"
    );
  };

  const handlePlayPath = (path: RoamingPath) => {
    setRoamingMode("path");
    setShowPathModal(false);
    message.info(
      `实际项目中：将按“${path.name}”的关键帧自动飞行，依次经过设定对象，并按各节点设置的朝向、速度和停留时长播放。`
    );
  };

  const handleStartRecord = () => {
    setRecording(true);
    setShowPathModal(false);
    message.info(
      "实际项目中：将开始记录相机位置、朝向和停留点；可使用WASD移动，完成后点击“停止录制”生成自定义路线。"
    );
  };

  const handleStopRecord = () => {
    setRecording(false);
    const newPath: RoamingPath = {
      id: Date.now(),
      name: `自定义路线${pathList.filter((p) => p.type === "custom").length + 1}`,
      type: "custom",
      createTime: new Date().toLocaleString("zh-CN"),
      duration: 60,
      description: "用户自定义录制路线",
    };
    setPathList([...pathList, newPath]);
    message.success(
      "原型已生成一条自定义路线；实际项目中还将保存关键帧、相机朝向、停留时长和播放速度。"
    );
  };

  const handleDeletePath = () => {
    if (deletePathId !== null) {
      setPathList(pathList.filter((p) => p.id !== deletePathId));
      message.success("路径已删除");
      setDeletePathId(null);
    }
  };

  const TOOL_CONFIG = {
    clip: {
      name: "剖切",
      needSelection: false,
      description: "将生成可拖动的剖切面，可沿X、Y、Z轴调整位置，查看厂房和设备内部结构",
    },
    measure: {
      name: "测量",
      needSelection: false,
      description: "将进入空间测量模式，依次点击模型点位后显示距离、高差或夹角",
    },
    stretch: {
      name: "伸缩",
      needSelection: true,
      description: "将沿装配轴分解选中模型的构件，便于查看内部组成和装配关系",
    },
    rotate: {
      name: "旋转",
      needSelection: true,
      description: "将围绕选中模型中心旋转观察，并保留当前缩放和观察距离",
    },
    hide: {
      name: "隐藏",
      needSelection: true,
      description: "将临时隐藏选中模型，以便查看其后方或内部被遮挡的对象",
    },
    isolate: {
      name: "孤立",
      needSelection: true,
      description: "将隐藏其他对象，仅保留选中模型及必要的空间定位参照",
    },
  } as const;

  const handleToolToggle = (
    tool: "clip" | "measure" | "stretch" | "rotate" | "hide" | "isolate"
  ) => {
    const config = TOOL_CONFIG[tool];
    if (config.needSelection && !selectedNode) {
      message.warning(
        `请先选择设备或管件模型；实际项目中选中后，${config.description}。`
      );
      return;
    }
    if (activeTool === tool) {
      setActiveTool("none");
      message.info(
        `实际项目中：将退出${config.name}模式，并清除本次${config.name}产生的临时操作标记。`
      );
    } else {
      setActiveTool(tool);
      message.info(`实际项目中：${config.description}。`);
    }
  };

  const handleResetTools = () => {
    setActiveTool("none");
    message.info(
      "实际项目中：将清除剖切面和测量标记，恢复隐藏、孤立、伸缩及旋转前的模型状态。"
    );
  };

  // ===== 场景1：工程总览 - 水电站全景 =====
  const renderOverviewScene = () => (
    <div className="absolute inset-0">
      {/* 真实大坝背景图片 */}
      <div className="absolute inset-0">
        <img 
          src={damBg} 
          alt="乌江渡水电站大坝"
          className="w-full h-full object-cover"
          style={{ filter: "brightness(0.7) saturate(0.95)" }}
        />
        {/* 科技感遮罩层 */}
        <div className="absolute inset-0" style={{
          background: `
            linear-gradient(180deg, 
              rgba(10,22,40,0.5) 0%, 
              rgba(13,33,55,0.2) 30%, 
              rgba(13,33,55,0.2) 70%, 
              rgba(10,22,40,0.6) 100%
            )
          `
        }} />
        {/* 网格叠加 */}
        <div className="scene-grid absolute inset-0 opacity-20" />
      </div>

      {/* SVG叠加层 - 科技感元素 */}
      <div className="absolute inset-0 pointer-events-none">
        <svg viewBox="0 0 1200 700" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            {/* 网格滤镜 */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="strongGlow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* 水面波纹渐变 */}
            <linearGradient id="waterShine" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4a8ab0" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#2a5a7a" stopOpacity="0" />
            </linearGradient>
            {/* 坝顶高光渐变 */}
            <linearGradient id="damHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* 科技感网格 - 背景参考线 */}
          <g opacity="0.08">
            {Array.from({ length: 12 }).map((_, i) => (
              <line key={`h${i}`} x1="0" y1={i * 60} x2="1200" y2={i * 60} stroke="#00b4ff" strokeWidth="0.5" />
            ))}
            {Array.from({ length: 20 }).map((_, i) => (
              <line key={`v${i}`} x1={i * 60} y1="0" x2={i * 60} y2="700" stroke="#00b4ff" strokeWidth="0.5" />
            ))}
          </g>

          {/* 水面波纹特效 - 上游水库区域（画面上部） */}
          <g opacity="0.4">
            {[0, 1, 2, 3, 4].map((i) => (
              <path key={i} 
                d={`M${-100 + i * 250},180 Q${100 + i * 250},170 ${300 + i * 250},180 T${500 + i * 250},180`} 
                fill="none" 
                stroke={i % 2 === 0 ? "#4a8ab0" : "#3a7a9a"} 
                strokeWidth="1"
              >
                <animate attributeName="d" 
                  values={`M${-100 + i * 250},180 Q${100 + i * 250},170 ${300 + i * 250},180 T${500 + i * 250},180;M${-100 + i * 250},180 Q${100 + i * 250},190 ${300 + i * 250},180 T${500 + i * 250},180;M${-100 + i * 250},180 Q${100 + i * 250},170 ${300 + i * 250},180 T${500 + i * 250},180`} 
                  dur="4s" 
                  repeatCount="indefinite" 
                />
              </path>
            ))}
          </g>

          {/* 坝顶高光线 - 画面中间 */}
          <g opacity="0.6">
            <line x1="350" y1="350" x2="850" y2="350" stroke="url(#damHighlight)" strokeWidth="2" />
            <line x1="350" y1="355" x2="850" y2="355" stroke="#4a7a9a" strokeWidth="0.5" strokeDasharray="4,2" opacity="0.5">
              <animate attributeName="stroke-dashoffset" values="0;12" dur="2s" repeatCount="indefinite" />
            </line>
          </g>

          {/* 溢洪道位置标记 - 画面中上部 */}
          <g opacity="0.7">
            {[0, 1, 2, 3, 4].map((i) => (
              <g key={i}>
                {/* 溢洪道矩形标记 */}
                <rect 
                  x={420 + i * 80} 
                  y="380" 
                  width="40" 
                  height="15" 
                  fill="#1a3a5a" 
                  stroke="#3a7a9a" 
                  strokeWidth="1"
                  rx="2"
                  opacity="0.6"
                />
                {/* 水流动画 */}
                <rect 
                  x={425 + i * 80} 
                  y="395" 
                  width="30" 
                  height="80" 
                  fill="#3a7a9a" 
                  rx="2"
                  opacity="0.4"
                >
                  <animate 
                    attributeName="y" 
                    values="395;455;395" 
                    dur={`${1.5 + i * 0.3}s`} 
                    repeatCount="indefinite" 
                  />
                  <animate 
                    attributeName="opacity" 
                    values="0.4;0.7;0.4" 
                    dur={`${1.5 + i * 0.3}s`} 
                    repeatCount="indefinite" 
                  />
                </rect>
              </g>
            ))}
          </g>

          {/* 数据点发光效果 - 关键位置 */}
          <g filter="url(#strongGlow)">
            {/* 大坝中心点 */}
            <circle cx="600" cy="420" r="6" fill="#00b4ff" opacity="0.8">
              <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="600" cy="420" r="12" fill="none" stroke="#00b4ff" strokeWidth="1" opacity="0.5">
              <animate attributeName="r" values="6;25;6" dur="2.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0;0.5" dur="2.5s" repeatCount="indefinite" />
            </circle>
            
            {/* 上游水库点 */}
            <circle cx="400" cy="180" r="4" fill="#4dd0e1" opacity="0.7">
              <animate attributeName="opacity" values="0.7;1;0.7" dur="3s" repeatCount="indefinite" />
            </circle>
            
            {/* 厂房区域点 */}
            <circle cx="600" cy="500" r="5" fill="#7ad0a0" opacity="0.8">
              <animate attributeName="opacity" values="0.8;1;0.8" dur="2.5s" repeatCount="indefinite" />
            </circle>
            
            {/* 尾水渠点 */}
            <circle cx="600" cy="570" r="4" fill="#80d8ff" opacity="0.7">
              <animate attributeName="opacity" values="0.7;1;0.7" dur="2.8s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* 装饰光晕 */}
          <ellipse cx="600" cy="420" rx="150" ry="60" fill="#00b4ff" opacity="0.03">
            <animate attributeName="opacity" values="0.03;0.08;0.03" dur="4s" repeatCount="indefinite" />
          </ellipse>
          <ellipse cx="400" cy="180" rx="80" ry="40" fill="#4dd0e1" opacity="0.02">
            <animate attributeName="opacity" values="0.02;0.06;0.02" dur="3.5s" repeatCount="indefinite" />
          </ellipse>
          <ellipse cx="600" cy="570" rx="100" ry="30" fill="#80d8ff" opacity="0.02">
            <animate attributeName="opacity" values="0.02;0.05;0.02" dur="3s" repeatCount="indefinite" />
          </ellipse>

          {/* 数据流连接线 */}
          <g opacity="0.3" strokeDasharray="4,4">
            <line x1="400" y1="180" x2="600" y2="420" stroke="#4dd0e1" strokeWidth="1">
              <animate attributeName="stroke-dashoffset" values="0;16" dur="2s" repeatCount="indefinite" />
            </line>
            <line x1="600" y1="420" x2="600" y2="570" stroke="#80d8ff" strokeWidth="1">
              <animate attributeName="stroke-dashoffset" values="0;16" dur="2.5s" repeatCount="indefinite" />
            </line>
            <line x1="600" y1="500" x2="800" y2="570" stroke="#7ad0a0" strokeWidth="1">
              <animate attributeName="stroke-dashoffset" values="0;16" dur="3s" repeatCount="indefinite" />
            </line>
          </g>

          {/* 画面四角装饰 */}
          <g opacity="0.4" stroke="#00b4ff" strokeWidth="2" fill="none">
            {/* 左上角 */}
            <path d="M10,10 L10,40 M10,10 L40,10" />
            {/* 右上角 */}
            <path d="M1190,10 L1190,40 M1190,10 L1160,10" />
            {/* 左下角 */}
            <path d="M10,690 L10,660 M10,690 L40,690" />
            {/* 右下角 */}
            <path d="M1190,690 L1190,660 M1190,690 L1160,690" />
          </g>
        </svg>
      </div>

      {/* 场景标题 */}
      <div className="absolute top-[5%] left-1/2 -translate-x-1/2 text-center z-10">
        <div className="bg-black/40 backdrop-blur-sm px-6 py-2 rounded-none border border-[#40A9FF]/30">
          <div className="text-cyan-300 text-xl font-bold tracking-widest" style={{ textShadow: "0 0 10px rgba(64,158,255,0.8)" }}>
            乌江渡水电站工程总览
          </div>
          <div className="text-blue-400/60 text-xs mt-1">坝高 134m · 装机容量 630MW · 年均发电量 33.4亿kWh</div>
        </div>
      </div>

      {/* 大坝标记 - 点击展示大坝统计信息 */}
      <div 
        className="absolute cursor-pointer group z-20"
        style={{ top: "38%", left: "50%", transform: "translateX(-50%)" }}
        onClick={() =>
          handleOverviewMarkerClick(
            "大坝主体",
            "大坝基础信息、上下游水位、坝体监测指标及关联告警"
          )
        }
      >
        <div className="relative">
          {/* 发光标记点 */}
          <div className="w-8 h-8 rounded-full bg-cyan-400/30 animate-ping absolute -inset-2" />
          <div className="w-4 h-4 rounded-full bg-cyan-400 border-2 border-white shadow-lg shadow-cyan-400/50" />
          {/* 标签 - 带测点数据 */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/75 backdrop-blur-sm px-3 py-1.5 border border-[#40A9FF]/30 group-hover:border-cyan-400 transition-colors" style={{ borderRadius: 0 }}>
            <div className="text-xs text-cyan-300 font-medium">大坝主体 (坝高134m)</div>
            <div className="text-[10px] text-blue-300/70 mt-0.5">上游水位 608.5m · 库容 12.3亿m³</div>
          </div>
        </div>
      </div>

      {/* 水库标记 */}
      <div
        className="absolute cursor-pointer group z-20"
        style={{ top: "20%", left: "25%" }}
        onClick={() =>
          handleOverviewMarkerClick(
            "上游水库",
            "实时水位、库容、入库流量及变化趋势"
          )
        }
      >
        <div className="relative">
          <div className="w-6 h-6 rounded-full bg-blue-400/30 animate-ping absolute -inset-1" />
          <div className="w-3 h-3 rounded-full bg-blue-400 border-2 border-white shadow-lg shadow-blue-400/50" />
          <div className="absolute top-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/75 backdrop-blur-sm px-2 py-1 border border-blue-500/30" style={{ borderRadius: 0 }}>
            <div className="text-xs text-blue-300">上游水库</div>
            <div className="text-[10px] text-blue-400/70 mt-0.5">入库流量 1280m³/s</div>
          </div>
        </div>
      </div>

      {/* 厂房标记 - 点击进入微观场景 */}
      <div 
        className="absolute cursor-pointer group z-20"
        style={{ top: "50%", left: "50%", transform: "translateX(-50%)" }}
        onClick={() => {
          if (onEnterInterior) {
            onEnterInterior("panorama" as any);
            message.info(
              "实际项目中：三维相机将从工程总览飞行进入坝后厂房，加载建筑、设备和管网模型，并默认定位发电机层。"
            );
          }
        }}
      >
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-green-400/30 animate-ping absolute -inset-2" />
          <div className="w-4 h-4 rounded-full bg-green-400 border-2 border-white shadow-lg shadow-green-400/50" />
          <div className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/75 backdrop-blur-sm px-3 py-1.5 border border-green-500/30 group-hover:border-green-400 transition-colors" style={{ borderRadius: 0 }}>
            <div className="text-xs text-green-300 font-medium">坝后厂房 (4台机组)</div>
            <div className="text-[10px] text-green-400/70 mt-0.5">总出力 612.3MW · 机组4/4运行</div>
          </div>
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-blue-400/0 group-hover:text-blue-400 transition-colors whitespace-nowrap">
            点击进入内部 →
          </div>
        </div>
      </div>

      {/* 开关站标记 */}
      <div
        className="absolute cursor-pointer group z-20"
        style={{ bottom: "22%", left: "15%" }}
        onClick={() =>
          handleOverviewMarkerClick(
            "开关站",
            "母线电压、开关状态、间隔设备和实时告警"
          )
        }
      >
        <div className="relative">
          <div className="w-5 h-5 rounded-full bg-purple-400/30 animate-ping absolute -inset-1" />
          <div className="w-2.5 h-2.5 rounded-full bg-purple-400 border-2 border-white shadow-lg" />
          <div className="absolute top-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/75 backdrop-blur-sm px-2 py-1 border border-purple-500/30" style={{ borderRadius: 0 }}>
            <div className="text-xs text-purple-300">开关站</div>
            <div className="text-[10px] text-purple-400/70 mt-0.5">电压 220kV · 正常</div>
          </div>
        </div>
      </div>

      {/* 尾水渠标记 */}
      <div
        className="absolute cursor-pointer group z-20"
        style={{ bottom: "20%", left: "50%", transform: "translateX(-50%)" }}
        onClick={() =>
          handleOverviewMarkerClick(
            "尾水渠",
            "尾水位、出库流量、变化趋势及关联测点"
          )
        }
      >
        <div className="relative">
          <div className="w-5 h-5 rounded-full bg-cyan-300/30 animate-ping absolute -inset-1" />
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-300 border-2 border-white shadow-lg" />
          <div className="absolute top-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/75 backdrop-blur-sm px-2 py-1 border border-cyan-400/30" style={{ borderRadius: 0 }}>
            <div className="text-xs text-cyan-200">尾水渠</div>
            <div className="text-[10px] text-cyan-300/70 mt-0.5">出库流量 1150m³/s</div>
          </div>
        </div>
      </div>

      {/* 数据指标浮窗 */}
      <div className="absolute left-[3%] top-[18%] flex flex-col gap-2 z-10">
        {[
          { label: "入库流量", value: "1280 m³/s", color: "#36cfc9" },
          { label: "出库流量", value: "1150 m³/s", color: "#40a9ff" },
          { label: "水头", value: "120.5 m", color: "#73d13d" },
        ].map((item) => (
          <div key={item.label} className="bg-black/60 backdrop-blur-md border border-[#40A9FF]/30 rounded-none px-3 py-2 min-w-[110px]">
            <div className="text-[10px] text-[#40A9FF]/70">{item.label}</div>
            <div className="text-lg font-bold" style={{ color: item.color, textShadow: `0 0 8px ${item.color}50` }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* 右侧数据指标 */}
      <div className="absolute right-[3%] top-[18%] flex flex-col gap-2 z-10">
        {[
          { label: "总有功", value: "612.3 MW", color: "#ffc53d" },
          { label: "总无功", value: "85.2 MVar", color: "#ff85c0" },
          { label: "机组状态", value: "4台运行", color: "#73d13d" },
        ].map((item) => (
          <div key={item.label} className="bg-black/60 backdrop-blur-md border border-[#40A9FF]/30 rounded-none px-3 py-2 min-w-[110px] text-right">
            <div className="text-[10px] text-[#40A9FF]/70">{item.label}</div>
            <div className="text-lg font-bold" style={{ color: item.color, textShadow: `0 0 8px ${item.color}50` }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* 快速入口 - 设备总览/管路总览 */}
      <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 flex gap-3 z-10">
        <button
          onClick={() => {
            if (onEnterInterior) {
              onEnterInterior("equipment");
              message.info(
                "实际项目中：三维相机将进入厂房设备总览，淡化管网并按运行、告警和停机状态高亮设备。"
              );
            }
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-black/60 backdrop-blur-md border border-[#40A9FF]/40 rounded-none hover:bg-[#40A9FF]/20 hover:border-[#40A9FF] transition-all hover:shadow-lg hover:shadow-[#40A9FF]/20"
        >
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm text-screen-text">设备总览 (156台在线)</span>
        </button>
        <button
          onClick={() => {
            if (onEnterInterior) {
              onEnterInterior("pipeline");
              message.info(
                "实际项目中：三维相机将进入厂房管路总览，淡化设备并按系统颜色高亮管线及关键测点。"
              );
            }
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-black/60 backdrop-blur-md border border-[#40A9FF]/40 rounded-none hover:bg-[#40A9FF]/20 hover:border-[#40A9FF] transition-all hover:shadow-lg hover:shadow-[#40A9FF]/20"
        >
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-sm text-screen-text">管路总览 (56条系统)</span>
        </button>
      </div>

      {/* 操作提示 */}
      <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2 text-xs text-[#40A9FF]/70 bg-black/60 backdrop-blur-sm px-4 py-1.5 rounded-none border border-cyan-500/20 z-10">
        点击标记查看详情 · 点击厂房进入内部场景
      </div>
    </div>
  );

  // ===== 场景2/3：融合厂房内部视图 - 设备与管网共存 =====
  const renderFusionScene = () => {
    // 根据 focusMode 调整透明度
    // panorama: 设备和管网都显示
    // equipment: 设备高亮，管网淡化
    // pipeline: 管网高亮，设备淡化
    const equipmentHighlight = focusMode === "equipment" ? 1 : focusMode === "pipeline" ? 0.25 : 0.7;
    const pipelineHighlight = focusMode === "pipeline" ? 1 : focusMode === "equipment" ? 0.25 : 0.7;
    
    let titleText = "厂房全景视图";
    let subtitleText = "设备与管网融合展示 · 通过顶部导航切换视图";
    if (focusMode === "equipment") {
      titleText = "设备总览";
      subtitleText = "高亮显示设备分布，管网淡化 · 点击设备查看属性";
    } else if (focusMode === "pipeline") {
      titleText = "管路总览";
      subtitleText = "高亮显示管网系统，设备淡化 · 点击管路查看属性";
    }
    
    return (
    <div className="absolute inset-0">
      {/* 真实背景图片 - 根据 focusMode 切换 */}
      <div className="absolute inset-0">
        <img 
          src={focusMode === "equipment" ? equipmentBg : focusMode === "pipeline" ? pipelineBg : panoramaBg} 
          alt={titleText}
          className="w-full h-full object-cover"
          style={{ filter: "brightness(0.6) saturate(0.9)" }}
        />
        {/* 深色遮罩层 */}
        <div className="absolute inset-0" style={{
          background: "rgba(7, 11, 20, 0.55)"
        }} />
        {/* 科技感网格叠加 */}
        <div className="scene-grid absolute inset-0 opacity-15" />
      </div>

      {/* 场景标题 */}
      <div className="absolute top-[4%] left-1/2 -translate-x-1/2 text-center z-10">
        <div className="text-white text-base font-bold tracking-widest px-4 py-1" style={{ 
          textShadow: "0 0 10px rgba(64,169,255,0.8)",
          borderBottom: "1px solid rgba(64,169,255,0.3)",
        }}>
          {titleText}
        </div>
        <div className="text-[#40A9FF]/70 text-xs mt-1">{subtitleText}</div>
      </div>

      {/* 楼层切换按钮 - 四层：发电机层、水轮机层、蜗壳层、尾水管层 */}
      <div className="absolute top-[12%] left-1/2 -translate-x-1/2 flex gap-1 z-20">
        {(["generator", "turbine", "spiral", "drafttube"] as const).map((floor) => (
          <button
            key={floor}
            onClick={() => {
              setActiveFloor(floor);
              message.info(
                `实际项目中：三维相机将垂直飞行至${floorInfo[floor].name}（${floorInfo[floor].elevation}），并只突出该层设备和管线。`
              );
            }}
            className={`px-3 py-1.5 text-xs transition-colors rounded-none ${
              activeFloor === floor
                ? "bg-[#40A9FF]/20 text-white border border-[#40A9FF]"
                : "bg-black/50 text-[#8a94a6] border border-[#40A9FF]/20 hover:text-white hover:border-[#40A9FF]/50"
            }`}
          >
            {floorInfo[floor].name} ({floorInfo[floor].elevation})
          </button>
        ))}
      </div>

      {/* 厂房融合视图 - 透明覆盖层 */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ paddingTop: "16%" }}>
        <div className="relative" style={{ width: "90%", height: "74%" }}>
          {/* 厂房外框 - 透明边框 */}
          <div className="absolute inset-0 rounded-none" style={{ 
            border: "1px solid rgba(64,169,255,0.25)", 
            background: "transparent",
          }} />

          {/* 楼层分隔线 - 四层划分 */}
          <div className="absolute left-0 right-0" style={{ top: "25%", borderTop: "1px dashed rgba(64,158,255,0.3)" }}>
            <span className="absolute left-3 -top-5 text-xs text-[#40A9FF]/70 font-medium">发电机层 (EL.660.5m)</span>
          </div>
          <div className="absolute left-0 right-0" style={{ top: "50%", borderTop: "1px dashed rgba(64,158,255,0.3)" }}>
            <span className="absolute left-3 -top-5 text-xs text-[#40A9FF]/70 font-medium">水轮机层 (EL.645.0m)</span>
          </div>
          <div className="absolute left-0 right-0" style={{ top: "75%", borderTop: "1px dashed rgba(64,158,255,0.3)" }}>
            <span className="absolute left-3 -top-5 text-xs text-[#40A9FF]/70 font-medium">蜗壳层 (EL.630.0m)</span>
          </div>

          {/* 当前楼层高亮指示 - 四层：每层25%高度 */}
          <div className="absolute left-0 right-0 rounded-nonetransition-all" style={{
            top: activeFloor === "generator" ? "0%" : 
                 activeFloor === "turbine" ? "25%" : 
                 activeFloor === "spiral" ? "50%" : "75%",
            height: "25%",
            background: activeFloor === "generator" ? "rgba(24,144,255,0.08)" : 
                       activeFloor === "turbine" ? "rgba(82,196,26,0.08)" : 
                       activeFloor === "spiral" ? "rgba(250,173,20,0.08)" : "rgba(24,144,255,0.12)",
            borderTop: `2px solid ${
              activeFloor === "generator" ? "rgba(24,144,255,0.5)" :
              activeFloor === "turbine" ? "rgba(82,196,26,0.5)" :
              activeFloor === "spiral" ? "rgba(250,173,20,0.5)" :
              "rgba(24,144,255,0.6)"
            }`,
            pointerEvents: "none",
          }} />

          {/* ========== 第1层：管网系统（底层） ========== */}
          <div className="absolute inset-0" style={{ opacity: pipelineHighlight, transition: "opacity 0.5s" }}>
            {pipelineSystems.map((pipe) => (
              <div
                key={pipe.name}
                className={`absolute left-[6%] right-[6%] pipe-flow-${pipe.color} ${focusMode === "pipeline" ? "cursor-pointer group" : ""}`}
                style={{ top: `${pipe.y}%` }}
                onClick={() => focusMode === "pipeline" && handlePipelineClick(pipe.name)}
              >
                <div className="relative h-8 rounded" style={{
                  width: pipe.width,
                  background: pipe.color === "blue" ? "rgba(24,144,255,0.15)" :
                             pipe.color === "green" ? "rgba(82,196,26,0.15)" :
                             pipe.color === "yellow" ? "rgba(250,173,20,0.15)" :
                             pipe.color === "orange" ? "rgba(255,133,20,0.15)" :
                             "rgba(255,77,79,0.15)",
                  border: `1px solid ${pipe.color === "blue" ? "rgba(24,144,255,0.4)" :
                             pipe.color === "green" ? "rgba(82,196,26,0.4)" :
                             pipe.color === "yellow" ? "rgba(250,173,20,0.4)" :
                             pipe.color === "orange" ? "rgba(255,133,20,0.4)" :
                             "rgba(255,77,79,0.4)"}`,
                  overflow: "hidden",
                  boxShadow: focusMode === "pipeline" ? `0 0 12px ${pipe.color === "blue" ? "rgba(24,144,255,0.3)" : pipe.color === "green" ? "rgba(82,196,26,0.3)" : "rgba(250,173,20,0.3)"}` : "none",
                }}>
                  <div className="pipe-flow absolute inset-0" />
                </div>
                {/* 管路标签 + 测点数据气泡 */}
                <div className="absolute -top-5 left-2 text-xs font-medium"
                  style={{
                    color: pipe.color === "blue" ? "#1890ff" : pipe.color === "green" ? "#52c41a" : pipe.color === "yellow" ? "#faad14" : "#ff8520",
                    textShadow: "0 0 4px rgba(0,0,0,0.8)",
                    opacity: focusMode === "pipeline" ? 1 : 0.45,
                    transition: "opacity 0.5s",
                  }}
                >
                  <div>{pipe.name}</div>
                  <div className="text-[9px] opacity-80" style={{ color: "#c5d0de" }}>{pipe.data}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ========== 第2层：设备分布（顶层） ========== */}
          <div className="absolute inset-0" style={{ opacity: equipmentHighlight, transition: "opacity 0.5s" }}>
            {equipmentPoints.map((eq) => (
              <div
                key={eq.name}
                className={`absolute ${focusMode === "equipment" ? "cursor-pointer group" : ""}`}
                style={{ left: `${eq.x}%`, top: `${eq.y}%`, transform: "translate(-50%, -50%)" }}
                onClick={() => focusMode === "equipment" && handleEquipmentClick(eq.name)}
              >
                {/* 光环 */}
                <div className="absolute rounded-full equipment-ripple" style={{
                  width: focusMode === "equipment" ? "32px" : "24px", height: focusMode === "equipment" ? "32px" : "24px",
                  background: eq.color,
                  opacity: focusMode === "equipment" ? 0.4 : 0.2,
                  left: focusMode === "equipment" ? "-16px" : "-12px", top: focusMode === "equipment" ? "-16px" : "-12px",
                }} />
                {/* 设备点 */}
                <div className={`equipment-dot rounded-full transition-transform ${focusMode === "equipment" ? "group-hover:scale-150" : ""}`} style={{
                  width: focusMode === "equipment" ? "16px" : "12px", height: focusMode === "equipment" ? "16px" : "12px",
                  background: eq.color,
                  boxShadow: focusMode === "equipment" 
                    ? `0 0 20px ${eq.color}, 0 0 10px ${eq.color}` 
                    : `0 0 8px ${eq.color}`,
                  border: "2px solid rgba(255,255,255,0.6)",
                }} />
                {/* 设备标签 - 显示测点数据气泡 */}
                  <div className="equipment-label absolute left-5 top-1/2 -translate-y-1/2 whitespace-nowrap px-2 py-1 rounded text-xs"
                    style={{
                      background: "rgba(0,0,0,0.85)",
                      color: eq.color,
                      border: `1px solid ${eq.color}80`,
                      fontWeight: 600,
                      minWidth: "140px",
                    }}
                  >
                    <div className="flex items-center gap-1">
                      {eq.name}
                      <span className="text-[9px] opacity-70">
                        {eq.status === "running" ? "●运行" : eq.status === "warning" ? "▲告警" : "○停机"}
                      </span>
                    </div>
                    <div className="text-[9px] mt-0.5 opacity-80 leading-tight" style={{ color: eq.status === "warning" ? "#ff7875" : "#c5d0de" }}>
                      {eq.data}
                    </div>
                  </div>
              </div>
            ))}
          </div>

          {/* ========== 图例与信息层 ========== */}
          {/* 设备图例 */}
          {focusMode === "equipment" && (
            <div className="absolute bottom-3 right-3 flex flex-col gap-1.5 p-2.5 rounded-nonebg-black/60 border border-blue-500/30 backdrop-blur-sm">
              <div className="text-[10px] text-blue-400/70 mb-1">设备状态图例</div>
              {[
                { label: "运行中", color: "#36cfc9", count: "148台" },
                { label: "告警", color: "#ff85c0", count: "2台" },
                { label: "停机", color: "#b37feb", count: "6台" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-[10px]">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.color, boxShadow: `0 0 6px ${item.color}` }} />
                  <span style={{ color: item.color }}>{item.label}</span>
                  <span className="text-blue-400/60">{item.count}</span>
                </div>
              ))}
            </div>
          )}

          {/* 管路图例 */}
          {focusMode === "pipeline" && (
            <div className="absolute bottom-3 right-3 flex flex-col gap-1.5 p-2.5 rounded-nonebg-black/60 border border-blue-500/30 backdrop-blur-sm">
              <div className="text-[10px] text-blue-400/70 mb-1">管路系统图例</div>
              {[
                { label: "技术供水", color: "#1890ff", count: "4,280m" },
                { label: "排水系统", color: "#52c41a", count: "2,150m" },
                { label: "气系统", color: "#faad14", count: "1,820m" },
                { label: "透平油", color: "#ff8520", count: "2,330m" },
                { label: "消防水", color: "#ff4d4f", count: "2,000m" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-[10px]">
                  <span className="w-4 h-1.5 rounded" style={{ background: item.color, boxShadow: `0 0 4px ${item.color}` }} />
                  <span style={{ color: item.color }}>{item.label}</span>
                  <span className="text-blue-400/60">{item.count}</span>
                </div>
              ))}
            </div>
          )}

          {/* 操作提示 */}
          <div className="absolute bottom-3 left-3 text-[10px] text-blue-400/70 bg-black/60 px-2 py-1 rounded-nonebackdrop-blur-sm">
            {focusMode === "equipment" 
              ? "点击设备查看属性详情" 
              : focusMode === "pipeline" 
                ? "点击管路查看属性详情" 
                : "厂房全景视图 · 可通过顶部导航切换设备/管路总览"}
          </div>

          {/* 楼层标签 */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-[#40A9FF]/60">坝后厂房 - {floorInfo[activeFloor].name}</div>
        </div>
      </div>
    </div>
  );
};

  return (
    <div className="flex-1 relative scene-placeholder overflow-hidden">
      {/* 3D 场景占位 - 模拟UE5渲染画面 */}
      <div className="absolute inset-0">
        {/* 网格背景 */}
        <div className="scene-grid" />

        {/* 扫描线 */}
        <div className="scan-line" />

        {/* 场景切换过渡动画 */}
        {sceneTransition && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity">
            <div className="text-center">
              <div className="inline-block w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
              <div className="text-cyan-300 text-sm font-medium">
                正在切换到{viewMode === "overview" ? "工程总览" : focusMode === "equipment" ? "设备总览" : focusMode === "pipeline" ? "管路总览" : "厂房全景"}...
              </div>
              <div className="text-blue-400/50 text-xs mt-1">UE5 像素流场景渲染中</div>
            </div>
          </div>
        )}

        {/* 根据场景渲染不同内容 */}
        {viewMode === "overview" && renderOverviewScene()}
        {viewMode === "interior" && renderFusionScene()}

        {/* 选中设备高亮框 */}
        {selectedNode && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-blue-500 rounded-noneanimate-glow pointer-events-none">
            <div className="absolute -top-6 left-0 text-xs text-blue-400 bg-black/60 px-2 py-0.5 rounded-nonewhitespace-nowrap">
              {selectedNode.title}
            </div>
            {/* 四角标记 */}
            <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-blue-400" />
            <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-blue-400" />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-blue-400" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-blue-400" />
          </div>
        )}

        {/* UE5 标识 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-[120px] text-center pointer-events-none">
          <p className="text-blue-400/30 text-xs">UE5 Pixel Streaming</p>
        </div>
      </div>

      {/* HUD - 左上角 场景名称 */}
      <div className="absolute top-3 left-3 z-10">
        <div className="bg-black/60 text-white text-sm px-3 py-1 rounded-nonebackdrop-blur-sm">
          {selectedNode
            ? `${getCurrentSceneName().split(" - ")[0]} - ${selectedNode.title}`
            : getCurrentSceneName()}
        </div>
      </div>

      {/* HUD - 左下角 操作提示 */}
      <div className="absolute bottom-16 left-3 z-10">
        <div className="text-screen-muted text-xs bg-black/40 px-2 py-1 rounded-nonebackdrop-blur-sm">
          左键拖拽旋转视角，右键拖拽平移，滚轮缩放
          {roamingMode === "free" && " | WASD 控制移动"}
        </div>
      </div>

      {/* HUD - 右下角 视角控制按钮组 */}
      <div className="absolute bottom-16 right-3 z-10 flex gap-2">
        <button
          onClick={() =>
            message.info(
              "实际项目中：相机将平滑返回当前场景的默认观察点，并恢复初始朝向、缩放比例和旋转中心。"
            )
          }
          className="w-9 h-9 bg-black/60 text-white rounded-noneflex items-center justify-center hover:bg-blue-600 transition-colors"
          title="重置视角"
        >
          <Camera size={16} />
        </button>
        <button
          onClick={() => {
            if (document.fullscreenElement) {
              document.exitFullscreen();
            } else {
              document.documentElement.requestFullscreen();
            }
          }}
          className="w-9 h-9 bg-black/60 text-white rounded-noneflex items-center justify-center hover:bg-blue-600 transition-colors"
          title="全屏"
        >
          <Maximize2 size={16} />
        </button>
        <button
          onClick={() =>
            message.info(
              "实际项目中：将截取当前UE5三维视角及数据标注，并按场景名称和时间生成图片文件。"
            )
          }
          className="w-9 h-9 bg-black/60 text-white rounded-noneflex items-center justify-center hover:bg-blue-600 transition-colors"
          title="截图"
        >
          <ImageIcon size={16} />
        </button>
      </div>

      {/* 右侧浮动工具栏 - 3D模型操作工具 */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-1.5 p-1.5 rounded-none bg-black/60 backdrop-blur-sm border border-screen-border">
        <button
          onClick={() => handleToolToggle("clip")}
          title="剖切"
          className={`w-9 h-9 rounded-noneflex items-center justify-center transition-colors ${
            activeTool === "clip"
              ? "bg-blue-600 text-white"
              : "text-screen-text hover:bg-gray-700"
          }`}
        >
          <Columns size={18} />
        </button>
        <button
          onClick={() => handleToolToggle("measure")}
          title="测量"
          className={`w-9 h-9 rounded-noneflex items-center justify-center transition-colors ${
            activeTool === "measure"
              ? "bg-blue-600 text-white"
              : "text-screen-text hover:bg-gray-700"
          }`}
        >
          <Ruler size={18} />
        </button>
        <button
          onClick={() => handleToolToggle("stretch")}
          title="伸缩"
          className={`w-9 h-9 rounded-noneflex items-center justify-center transition-colors ${
            activeTool === "stretch"
              ? "bg-blue-600 text-white"
              : "text-screen-text hover:bg-gray-700"
          }`}
        >
          <ArrowUpDown size={18} />
        </button>
        <button
          onClick={() => handleToolToggle("rotate")}
          title="旋转"
          className={`w-9 h-9 rounded-noneflex items-center justify-center transition-colors ${
            activeTool === "rotate"
              ? "bg-blue-600 text-white"
              : "text-screen-text hover:bg-gray-700"
          }`}
        >
          <RotateCw size={18} />
        </button>
        <button
          onClick={() => handleToolToggle("hide")}
          title="隐藏"
          className={`w-9 h-9 rounded-noneflex items-center justify-center transition-colors ${
            activeTool === "hide"
              ? "bg-blue-600 text-white"
              : "text-screen-text hover:bg-gray-700"
          }`}
        >
          <EyeOff size={18} />
        </button>
        <button
          onClick={() => handleToolToggle("isolate")}
          title="孤立"
          className={`w-9 h-9 rounded-noneflex items-center justify-center transition-colors ${
            activeTool === "isolate"
              ? "bg-blue-600 text-white"
              : "text-screen-text hover:bg-gray-700"
          }`}
        >
          <Focus size={18} />
        </button>
        <div className="w-full h-px bg-screen-border my-0.5" />
        <button
          onClick={handleResetTools}
          title="重置"
          className="w-9 h-9 rounded-noneflex items-center justify-center text-screen-text hover:bg-red-600 hover:text-white transition-colors"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      {/* 底部漫游工具条 */}
      <div className="absolute bottom-0 left-0 right-0 h-[50px] bg-black/70 backdrop-blur-sm border-t border-screen-border flex items-center justify-center gap-3 z-10">
        <button
          onClick={handleFreeRoam}
          className={`flex items-center gap-1 px-4 py-1.5 rounded-nonetext-sm transition-colors ${
            roamingMode === "free"
              ? "bg-blue-600 text-white"
              : "bg-gray-800/80 text-screen-text hover:bg-gray-700"
          }`}
        >
          <Play size={14} />
          自由漫游
        </button>
        <button
          onClick={() => setShowPathModal(true)}
          className={`flex items-center gap-1 px-4 py-1.5 rounded-nonetext-sm transition-colors ${
            roamingMode === "path"
              ? "bg-blue-600 text-white"
              : "bg-gray-800/80 text-screen-text hover:bg-gray-700"
          }`}
        >
          <Map size={14} />
          路径漫游
        </button>
        {roamingMode !== "none" && (
          <button
            onClick={handleStopRoam}
            className="flex items-center gap-1 px-4 py-1.5 rounded-nonetext-sm bg-red-600/80 text-white hover:bg-red-600 transition-colors"
          >
            <Square size={14} />
            停止漫游
          </button>
        )}
        {recording && (
          <button
            onClick={handleStopRecord}
            className="flex items-center gap-1 px-4 py-1.5 rounded-nonetext-sm bg-orange-600 text-white hover:bg-orange-700 transition-colors animate-pulse"
          >
            <Square size={14} />
            停止录制
          </button>
        )}
        <span className="text-screen-muted text-xs ml-4">
          FPS: {fps} | {roamingMode === "free" ? "自由漫游中" : roamingMode === "path" ? "路径漫游中" : "静止"}
        </span>
      </div>

      {/* 漫游路径列表弹窗 */}
      <Modal
        open={showPathModal}
        onClose={() => setShowPathModal(false)}
        title="漫游路径管理"
        width={500}
        footer={
          <>
            {recording ? (
              <button
                onClick={handleStopRecord}
                className="flex items-center gap-1 px-4 py-1.5 rounded-nonetext-sm bg-orange-600 text-white hover:bg-orange-700"
              >
                <Square size={14} />
                停止录制
              </button>
            ) : (
              <button
                onClick={handleStartRecord}
                className="flex items-center gap-1 px-4 py-1.5 rounded-nonetext-sm bg-admin-primary text-white hover:bg-blue-600"
              >
                <Plus size={14} />
                新建路径
              </button>
            )}
            <button
              className="btn-default"
              onClick={() => setShowPathModal(false)}
            >
              关闭
            </button>
          </>
        }
      >
        <div className="overflow-auto" style={{ maxHeight: 300 }}>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-admin-muted border-b">序号</th>
                <th className="px-3 py-2 text-left text-admin-muted border-b">路径名称</th>
                <th className="px-3 py-2 text-left text-admin-muted border-b">类型</th>
                <th className="px-3 py-2 text-left text-admin-muted border-b">创建时间</th>
                <th className="px-3 py-2 text-left text-admin-muted border-b">时长</th>
                <th className="px-3 py-2 text-left text-admin-muted border-b">操作</th>
              </tr>
            </thead>
            <tbody>
              {pathList.map((path, index) => (
                <tr key={path.id} className="border-b border-admin-border">
                  <td className="px-3 py-2 text-admin-text">{index + 1}</td>
                  <td className="px-3 py-2 text-admin-text">{path.name}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-none${
                        path.type === "default"
                          ? "bg-blue-50 text-blue-600"
                          : "bg-green-50 text-green-600"
                      }`}
                    >
                      {path.type === "default" ? "默认路线" : "自定义"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-admin-muted text-xs">
                    {path.createTime}
                  </td>
                  <td className="px-3 py-2 text-admin-text">
                    约{path.duration}秒
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePlayPath(path)}
                        className="text-admin-primary hover:text-blue-600"
                        title="播放"
                      >
                        <Play size={14} />
                      </button>
                      {path.type === "custom" && (
                        <>
                          <button
                            onClick={() =>
                              message.info(
                                `实际项目中：将打开“${path.name}”编辑窗口，可修改路线名称、途经点、相机朝向、停留时长和播放速度。`
                              )
                            }
                            className="text-admin-primary hover:text-blue-600"
                            title="编辑"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeletePathId(path.id)}
                            className="text-admin-danger hover:text-red-600"
                            title="删除"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* 删除确认弹窗 */}
      <ConfirmModal
        open={deletePathId !== null}
        content="确定删除该漫游路径吗？"
        okText="删除"
        danger
        onConfirm={handleDeletePath}
        onCancel={() => setDeletePathId(null)}
      />
    </div>
  );
}
