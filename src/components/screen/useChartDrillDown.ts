import { useCallback, useRef } from "react";
import type { DrillDownData } from "@/components/screen/DrillDownModal";

interface DrillDownCallbacks {
  onDrillDown: (data: DrillDownData) => void;
  onLocateBIM?: (kksCode: string) => void;
}

// ── 每个图表的测点元数据配置 ──────────────────────────────────

interface PointMeta {
  pointName: string;
  kksCode: string;
  collectionDevice: string;
  sampleRate: string;
  dataQuality: string;
  formulaDesc: string;
  formula: string;
  formulaInputs: { name: string; value: string; source: string }[];
  metricRange: string;
  threshold: string;
  abnormalRule: string;
  alarmLevel: string;
}

/** 根据 chartId + seriesIndex + 点击值 返回该测点的完整元数据 */
function getPointMeta(
  chartId: string,
  seriesIndex: number,
  dataIndex: number,
  value: number,
  params: any
): PointMeta {
  switch (chartId) {
    // ── 左侧面板：机组出力趋势 (4条线) ──
    case "left-trend": {
      const units = ["1#机组", "2#机组", "3#机组", "4#机组"];
      const kks = ["10MKA01CG001", "10MKA02CG001", "10MKA03CG001", "10MKA04CG001"];
      const u = units[seriesIndex] || units[0];
      const k = kks[seriesIndex] || kks[0];
      const current = value.toFixed(1);
      const I = (value / (1.732 * 13.8 * 0.92)).toFixed(0);
      return {
        pointName: `${u}有功功率`,
        kksCode: k,
        collectionDevice: "PMU同步相量测量装置",
        sampleRate: "1秒/次",
        dataQuality: "正常",
        formulaDesc: "机组有功功率实时计算，基于机端电压、电流和功率因数",
        formula: "P = √3 × U_line × I_line × cos(φ)",
        formulaInputs: [
          { name: "U_line", value: "13.8 kV", source: "机端电压互感器(PT)" },
          { name: "I_line", value: `${I} A`, source: "机端电流互感器(CT)" },
          { name: "cos(φ)", value: "0.92", source: "功率因数变送器" },
        ],
        metricRange: "0 ~ 200 MW",
        threshold: "上限: 180 MW / 下限: 0 MW",
        abnormalRule: "连续3个采样点超上限阈值180MW",
        alarmLevel: "警告",
      };
    }

    // ── 左侧面板：水头/流量监测 (双Y轴, 2条线) ──
    case "left-waterflow": {
      if (seriesIndex === 0) {
        // 水头
        return {
          pointName: "机组净水头",
          kksCode: "10PMA01CL001",
          collectionDevice: "压力变送器 (罗斯蒙特3051CD)",
          sampleRate: "5秒/次",
          dataQuality: "正常",
          formulaDesc: "净水头 = 上库水位 - 下库水位 - 水力损失",
          formula: "H_net = H_upper - H_lower - H_loss",
          formulaInputs: [
            { name: "H_upper", value: "635.20 m", source: "上库水位计 10LKA01CL001" },
            { name: "H_lower", value: "495.00 m", source: "下库水位计 10LKA02CL001" },
            { name: "H_loss", value: "2.18 m", source: "水力损失计算(沿程+局部)" },
          ],
          metricRange: "100 ~ 150 m",
          threshold: "下限: 110 m",
          abnormalRule: "净水头低于110m持续5分钟",
          alarmLevel: "严重",
        };
      } else {
        // 流量
        return {
          pointName: "发电流量",
          kksCode: "10PFA01CF001",
          collectionDevice: "电磁流量计 (ABB FEP315)",
          sampleRate: "5秒/次",
          dataQuality: "正常",
          formulaDesc: "发电流量 = 机组功率 / (水的密度 × 重力加速度 × 净水头 × 机组效率)",
          formula: "Q = P / (ρ × g × H_net × η)",
          formulaInputs: [
            { name: "P", value: `${value.toFixed(1)} MW`, source: "机组有功功率" },
            { name: "ρ", value: "1000 kg/m³", source: "水的密度" },
            { name: "g", value: "9.81 m/s²", source: "重力加速度" },
            { name: "H_net", value: "137.82 m", source: "净水头计算值" },
            { name: "η", value: "0.920", source: "机组效率曲线" },
          ],
          metricRange: "0 ~ 150 m³/s",
          threshold: "上限: 140 m³/s",
          abnormalRule: "流量超过140m³/s持续30秒",
          alarmLevel: "警告",
        };
      }
    }

    // ── 左侧面板：告警数量趋势 (柱状图) ──
    case "left-alarm": {
      const days = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
      const day = days[dataIndex] || "今日";
      return {
        pointName: `${day}告警数量`,
        kksCode: "10ALM-SYS001",
        collectionDevice: "告警管理服务器 (AMS)",
        sampleRate: "事件触发",
        dataQuality: "正常",
        formulaDesc: "按日统计全厂告警事件数量，包含严重/警告/提示三级",
        formula: "count = COUNT(alarm_events WHERE date = target_date)",
        formulaInputs: [
          { name: "date", value: day, source: "查询日期" },
          { name: "scope", value: "全厂设备", source: "告警范围" },
          { name: "levels", value: "严重+警告+提示", source: "告警级别" },
        ],
        metricRange: "0 ~ 50 条",
        threshold: "上限: 10 条/日",
        abnormalRule: "单日告警超过10条触发批量告警预警",
        alarmLevel: "提示",
      };
    }

    // ── 左侧面板：设备在线率 ──
    case "left-online": {
      return {
        pointName: "设备在线率",
        kksCode: "10SYS-STAT001",
        collectionDevice: "SCADA数据采集服务器",
        sampleRate: "60秒/次",
        dataQuality: "正常",
        formulaDesc: "在线设备数 / 设备总数 × 100%",
        formula: "rate = (N_online / N_total) × 100%",
        formulaInputs: [
          { name: "N_online", value: "230 台", source: "实时通信状态统计" },
          { name: "N_total", value: "248 台", source: "设备资产台账" },
          { name: "N_offline", value: "18 台", source: "离线设备统计" },
        ],
        metricRange: "0 ~ 100 %",
        threshold: "下限: 90%",
        abnormalRule: "在线率低于90%持续15分钟",
        alarmLevel: "警告",
      };
    }

    // ── 概览Tab：系统设备分布 (玫瑰图/饼图) ──
    case "overview-rose":
    case "overview-pie-small": {
      const sysName = params?.name || "系统";
      const sysValue = params?.value ?? value;
      return {
        pointName: `系统设备分布 - ${sysName}`,
        kksCode: `10EAM-${String(dataIndex + 1).padStart(3, "0")}`,
        collectionDevice: "设备资产管理系统 (EAM)",
        sampleRate: "日同步",
        dataQuality: "正常",
        formulaDesc: `按系统统计${sysName}下的设备数量`,
        formula: `count = COUNT(equipment WHERE system = '${sysName}')`,
        formulaInputs: [
          { name: "system", value: sysName, source: "设备分类" },
          { name: "count", value: `${sysValue} 台`, source: "设备台账" },
        ],
        metricRange: "0 ~ 50 台",
        threshold: "—",
        abnormalRule: "—",
        alarmLevel: "—",
      };
    }

    // ── 概览Tab：设备专业分布 (柱状图) ──
    case "overview-major-bar": {
      const majorName = params?.name || "专业";
      const majorValue = params?.value ?? value;
      return {
        pointName: `专业设备分布 - ${majorName}`,
        kksCode: `10EAM-MAJ-${String(dataIndex + 1).padStart(3, "0")}`,
        collectionDevice: "设备资产管理系统 (EAM)",
        sampleRate: "日同步",
        dataQuality: "正常",
        formulaDesc: `按专业统计${majorName}类设备数量`,
        formula: `count = COUNT(equipment WHERE major = '${majorName}')`,
        formulaInputs: [
          { name: "major", value: majorName, source: "设备专业分类" },
          { name: "count", value: `${majorValue} 台`, source: "设备台账" },
        ],
        metricRange: "0 ~ 100 台",
        threshold: "—",
        abnormalRule: "—",
        alarmLevel: "—",
      };
    }

    // ── 概览Tab：实时功率仪表盘 ──
    case "overview-gauge": {
      return {
        pointName: "全厂总有功功率",
        kksCode: "10AGC-PWR-SUM",
        collectionDevice: "AGC自动发电控制系统",
        sampleRate: "1秒/次",
        dataQuality: "正常",
        formulaDesc: "全厂4台机组有功功率之和",
        formula: "P_total = P_1# + P_2# + P_3# + P_4#",
        formulaInputs: [
          { name: "P_1#", value: "153.2 MW", source: "1#机组PMU" },
          { name: "P_2#", value: "148.7 MW", source: "2#机组PMU" },
          { name: "P_3#", value: "152.1 MW", source: "3#机组PMU" },
          { name: "P_4#", value: "131.6 MW", source: "4#机组PMU" },
        ],
        metricRange: "0 ~ 800 MW",
        threshold: "上限: 600 MW",
        abnormalRule: "总有功超过额定容量600MW",
        alarmLevel: "严重",
      };
    }

    // ── 概览Tab：设备健康度分布 (饼图) ──
    case "overview-health-pie": {
      const healthName = params?.name || "健康";
      return {
        pointName: `设备健康度分布 - ${healthName}`,
        kksCode: `10HEALTH-${String(dataIndex + 1).padStart(3, "0")}`,
        collectionDevice: "设备健康评估系统",
        sampleRate: "1小时/次",
        dataQuality: "正常",
        formulaDesc: `按健康等级统计${healthName}状态设备数量`,
        formula: `count = COUNT(equipment WHERE health_level = '${healthName}')`,
        formulaInputs: [
          { name: "level", value: healthName, source: "健康评估等级" },
          { name: "count", value: `${value} 台`, source: "健康评估结果" },
        ],
        metricRange: "0 ~ 248 台",
        threshold: healthName === "告警" ? "上限: 10台" : "—",
        abnormalRule: healthName === "告警" ? "告警状态设备超过10台" : "—",
        alarmLevel: healthName === "告警" ? "警告" : "—",
      };
    }

    // ── 概览Tab：设备健康度趋势 ──
    case "overview-health-trend": {
      return {
        pointName: "全厂设备健康度指数",
        kksCode: "10HEALTH-IDX001",
        collectionDevice: "设备健康评估服务器",
        sampleRate: "1小时/次",
        dataQuality: "正常",
        formulaDesc: "综合设备完好率、缺陷率、运行参数偏差率计算健康度指数",
        formula: "HI = 0.4×R_good + 0.3×(1-R_defect) + 0.3×(1-R_deviation)",
        formulaInputs: [
          { name: "R_good", value: "0.955", source: "设备完好率" },
          { name: "R_defect", value: "0.032", source: "缺陷率" },
          { name: "R_deviation", value: "0.015", source: "参数偏差率" },
        ],
        metricRange: "0 ~ 100 %",
        threshold: "下限: 85%",
        abnormalRule: "健康度指数低于85%持续24小时",
        alarmLevel: "警告",
      };
    }

    // ── 右侧面板：趋势曲线 (压力/温度/振动, 3条线) ──
    case "right-runtime": {
      const metrics = [
        { name: "压力", unit: "MPa", kks: "10MKA01CP001", device: "压力变送器(横河EJA)", formula: "P = sensor_signal × range_factor", desc: "机组蜗壳进口压力实时监测" },
        { name: "温度", unit: "℃", kks: "10MKA01CT001", device: "铂电阻PT100", formula: "T = R_pt × conversion_factor", desc: "推力轴承瓦温实时监测" },
        { name: "振动", unit: "mm/s", kks: "10MKA01CV001", device: "振动速度传感器", formula: "V = signal × sensitivity", desc: "上机架振动速度实时监测" },
      ];
      const m = metrics[seriesIndex] || metrics[0];
      return {
        pointName: m.name,
        kksCode: m.kks,
        collectionDevice: m.device,
        sampleRate: "1秒/次",
        dataQuality: "正常",
        formulaDesc: m.desc,
        formula: m.formula,
        formulaInputs: [
          { name: "signal", value: "4-20mA", source: "传感器输出" },
          { name: "range_factor", value: m.unit === "MPa" ? "0-2.5" : m.unit === "℃" ? "0-150" : "0-10", source: "量程配置" },
          { name: "conversion", value: "1.00", source: "标定系数" },
        ],
        metricRange: m.unit === "MPa" ? "0 ~ 2.5 MPa" : m.unit === "℃" ? "0 ~ 150 ℃" : "0 ~ 10 mm/s",
        threshold: m.unit === "MPa" ? "上限: 2.0 MPa" : m.unit === "℃" ? "上限: 80 ℃" : "上限: 4.5 mm/s",
        abnormalRule: m.unit === "MPa" ? "压力超过2.0MPa持续30秒" : m.unit === "℃" ? "瓦温超过80℃持续60秒" : "振动超过4.5mm/s持续30秒",
        alarmLevel: "警告",
      };
    }

    default: {
      // 通用 fallback
      return {
        pointName: params?.seriesName || params?.name || "未知测点",
        kksCode: `10UNK-${String(dataIndex + 1).padStart(3, "0")}`,
        collectionDevice: "SCADA数据采集装置",
        sampleRate: "5秒/次",
        dataQuality: "正常",
        formulaDesc: "指标计算说明",
        formula: "value = f(raw_signal)",
        formulaInputs: [
          { name: "raw_signal", value: "4-20mA", source: "传感器输出" },
        ],
        metricRange: "0-100",
        threshold: "—",
        abnormalRule: "—",
        alarmLevel: "—",
      };
    }
  }
}

/** 根据测点类型生成真实感的原始时序数据 */
function generateRawData(
  baseValue: number,
  unit: string,
  count: number = 20,
  variation: number = 0.05,
  intervalMs: number = 1800000
): { timestamp: string; value: string; unit: string; quality: string }[] {
  const now = new Date();
  const rows: { timestamp: string; value: string; unit: string; quality: string }[] = [];
  for (let i = 0; i < count; i++) {
    const t = new Date(now.getTime() - i * intervalMs);
    const noise = (Math.random() - 0.5) * 2 * variation * baseValue;
    const v = baseValue + noise;
    const isAbnormal = Math.random() < 0.05;
    rows.push({
      timestamp: `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")} ${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}:${String(t.getSeconds()).padStart(2, "0")}`,
      value: v.toFixed(unit === "%" ? 1 : 2),
      unit,
      quality: isAbnormal ? "异常" : "正常",
    });
  }
  return rows.reverse();
}

export function useChartDrillDown(callbacks: DrillDownCallbacks) {
  const chartRefs = useRef<Map<string, any>>(new Map());

  const generateDrillDownData = useCallback(
    (args: {
      chartId: string;
      seriesIndex: number;
      dataIndex: number;
      value: number;
      unit: string;
      deviceName: string;
      params: any;
    }): DrillDownData => {
      const { chartId, seriesIndex, dataIndex, value, unit, deviceName, params } = args;
      const meta = getPointMeta(chartId, seriesIndex, dataIndex, value, params);

      const now = new Date();
      const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

      // 判断是否异常
      const isAbnormal =
        meta.alarmLevel !== "—" &&
        meta.alarmLevel !== "提示" &&
        value > 0 &&
        (
          (chartId === "left-trend" && value > 180) ||
          (chartId === "left-waterflow" && seriesIndex === 0 && value < 110) ||
          (chartId === "left-waterflow" && seriesIndex === 1 && value > 140) ||
          (chartId === "left-online" && value < 90) ||
          (chartId === "overview-health-trend" && value < 85) ||
          (chartId === "right-runtime" && seriesIndex === 0 && value > 2.0) ||
          (chartId === "right-runtime" && seriesIndex === 1 && value > 80) ||
          (chartId === "right-runtime" && seriesIndex === 2 && value > 4.5)
        );

      return {
        pointName: meta.pointName,
        deviceName,
        kksCode: meta.kksCode,
        metricValue: value.toString(),
        unit,
        timestamp,
        dataSource: {
          pointId: `PT-${meta.kksCode}-${timestamp.replace(/[-: ]/g, "").slice(0, 14)}`,
          pointName: meta.pointName,
          kksCode: meta.kksCode,
          deviceName,
          collectionDevice: meta.collectionDevice,
          sampleRate: meta.sampleRate,
          dataQuality: meta.dataQuality,
        },
        formula: {
          description: meta.formulaDesc,
          formula: meta.formula,
          inputs: meta.formulaInputs,
        },
        rawData: generateRawData(
          value,
          unit,
          20,
          chartId === "left-alarm" ? 0.15 : 0.05,
          chartId === "left-alarm" ? 3600000 : chartId === "overview-health-trend" ? 3600000 : 300000
        ),
        abnormal: isAbnormal
          ? {
              isAbnormal: true,
              threshold: meta.threshold,
              actualValue: value.toString(),
              rule: meta.abnormalRule,
              alarmRecord: {
                time: timestamp,
                level: meta.alarmLevel,
                status: "处理中",
              },
            }
          : undefined,
      };
    },
    []
  );

  const bindChartEvents = useCallback(
    (chartId: string, chartInstance: any, meta: { deviceName: string; metricPrefix: string }) => {
      if (!chartInstance) return;
      chartRefs.current.set(chartId, chartInstance);

      // 检测图表类型，设置正确的 tooltip trigger
      const currentOption = chartInstance.getOption();
      const seriesList = (currentOption?.series as any[]) || [];
      const hasPie = seriesList.some((s) => s?.type === "pie");
      const hasGauge = seriesList.some((s) => s?.type === "gauge");
      const trigger = hasPie || hasGauge ? "item" : "axis";

      chartInstance.setOption({
        tooltip: {
          trigger,
          backgroundColor: "rgba(10, 25, 47, 0.9)",
          borderColor: "#40A9FF",
          borderWidth: 1,
          textStyle: { color: "#e6f1ff", fontSize: 12 },
          formatter: (params: any) => {
            const p = Array.isArray(params) ? params[0] : params;
            if (!p) return "";
            const pointName = p.seriesName || p.name || meta.metricPrefix;
            const val = Array.isArray(p.value) ? (p.value[1]?.toString() ?? "0") : (p.value?.toString() ?? "0");
            const unit = getUnitForMetric(pointName, chartId);
            const now = new Date();
            const ts = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
            return `<div style="padding:6px 10px;min-width:180px;">
              <div style="color:#40A9FF;font-weight:bold;margin-bottom:6px;font-size:13px;border-bottom:1px solid rgba(64,169,255,0.3);padding-bottom:4px;">${pointName}</div>
              <div style="margin:3px 0;">指标值：<span style="color:#52c41a;font-weight:bold;font-size:14px;">${val} ${unit}</span></div>
              <div style="margin:2px 0;color:#8a94a6;">测点名称：${pointName}</div>
              <div style="margin:2px 0;color:#8a94a6;">设备：${meta.deviceName}</div>
              <div style="margin:2px 0;color:#8a94a6;">采集时间：${ts}</div>
              <div style="margin-top:6px;color:#40A9FF;font-size:11px;border-top:1px dashed rgba(64,169,255,0.3);padding-top:4px;">点击下钻查看详情 →</div>
            </div>`;
          },
        },
      });

      chartInstance.off("click");
      chartInstance.on("click", (params: any) => {
        if (params.componentType === "series" || params.componentType === "markPoint") {
          const seriesIndex = params.seriesIndex ?? 0;
          const dataIndex = params.dataIndex ?? 0;
          const rawValue = Array.isArray(params.value)
            ? Number(params.value[1] ?? params.value[0] ?? 0)
            : Number(params.value ?? 0);

          const pointName = params.seriesName || params.name || meta.metricPrefix;
          const unit = getUnitForMetric(pointName, chartId);

          const drillData = generateDrillDownData({
            chartId,
            seriesIndex,
            dataIndex,
            value: rawValue,
            unit,
            deviceName: meta.deviceName,
            params,
          });
          callbacks.onDrillDown(drillData);
        }
      });
    },
    [callbacks, generateDrillDownData]
  );

  return { bindChartEvents, generateDrillDownData, chartRefs };
}

function getUnitForMetric(metricName: string, chartId?: string): string {
  // 优先根据 chartId 判断
  if (chartId) {
    if (chartId === "left-trend") return "MW";
    if (chartId === "left-waterflow") {
      if (metricName.includes("水头") || metricName.includes("head")) return "m";
      return "m³/s";
    }
    if (chartId === "left-alarm") return "条";
    if (chartId === "left-online") return "%";
    if (chartId === "overview-rose" || chartId === "overview-pie-small" || chartId === "overview-major-bar") return "台";
    if (chartId === "overview-gauge") return "MW";
    if (chartId === "overview-health-pie") return "台";
    if (chartId === "overview-health-trend") return "%";
    if (chartId === "right-runtime") {
      if (metricName.includes("压力")) return "MPa";
      if (metricName.includes("温度")) return "℃";
      if (metricName.includes("振动")) return "mm/s";
      return "";
    }
  }
  // fallback: 按名称判断
  const name = metricName.toLowerCase();
  if (name.includes("压力") || name.includes("pressure")) return "MPa";
  if (name.includes("温度") || name.includes("temp")) return "℃";
  if (name.includes("振动") || name.includes("vibration")) return "mm/s";
  if (name.includes("流量") || name.includes("flow")) return "m³/s";
  if (name.includes("功率") || name.includes("power") || name.includes("出力")) return "MW";
  if (name.includes("水头") || name.includes("head")) return "m";
  if (name.includes("电流") || name.includes("current")) return "A";
  if (name.includes("电压") || name.includes("voltage")) return "kV";
  if (name.includes("率") || name.includes("rate") || name.includes("%")) return "%";
  if (name.includes("数量") || name.includes("count") || name.includes("分布")) return "台";
  if (name.includes("告警")) return "条";
  return "";
}
