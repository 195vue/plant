import { alarms, equipments, systems } from "@/mock";
import type { Equipment } from "@/types";
import type {
  DrillDownData,
  DrillDownNode,
  DrillDownSession,
} from "./DrillDownModal";

export interface DrillClickContext {
  chartId: string;
  seriesIndex: number;
  dataIndex: number;
  value: number;
  unit: string;
  deviceName: string;
  params: any;
}

type DetailFactory = (
  overrides?: Partial<DrillClickContext>,
) => DrillDownData;

const unitNames = ["1#机组", "2#机组", "3#机组", "4#机组"];

const statusLabel: Record<Equipment["status"], string> = {
  running: "运行",
  stopped: "停止",
  maintenance: "检修",
  fault: "故障",
};

const makeNode = (
  node: Omit<DrillDownNode, "id"> & { id?: string },
): DrillDownNode => ({
  ...node,
  id: node.id || `${node.type}-${node.label}`,
});

const normalizeName = (value: string) =>
  value.replace(/[系统设备#号机组\s]/g, "");

const equipmentForSystem = (systemName: string) => {
  const normalized = normalizeName(systemName);
  const matches = equipments.filter((equipment) => {
    const system = normalizeName(equipment.system);
    return system.includes(normalized) || normalized.includes(system);
  });
  return matches.length > 0 ? matches : equipments.slice(0, 8);
};

const deviceDetail = (
  base: DrillDownData,
  equipment: Equipment,
): DrillDownData => ({
  ...base,
  detailType: "device",
  pointName: equipment.name,
  deviceName: equipment.name,
  kksCode: equipment.code,
  metricValue: statusLabel[equipment.status],
  unit: "",
  dataSource: {
    pointId: `OBJ-${equipment.id}`,
    pointName: equipment.name,
    kksCode: equipment.code,
    deviceName: equipment.name,
    collectionDevice: "设备数字化数据中心",
    sampleRate: "资产信息变更时同步",
    dataQuality: equipment.codeStatus === "linked" ? "正常" : "待完善",
  },
  formula: {
    description: "设备详情来源于设备数字化模块及KKS关联关系。",
    formula: "—",
    inputs: [],
  },
  rawData: [],
  abnormal:
    equipment.status === "fault"
      ? {
          isAbnormal: true,
          threshold: "运行状态不得为故障",
          actualValue: "故障",
          rule: "设备运行状态为故障时标记异常",
          alarmRecord: {
            time: base.timestamp,
            level: "严重",
            status: "处理中",
          },
        }
      : undefined,
});

const alarmDetail = (
  base: DrillDownData,
  alarm: (typeof alarms)[number],
  index: number,
): DrillDownData => ({
  ...base,
  detailType: "alarm",
  pointName: alarm.type,
  deviceName: alarm.equipmentName,
  kksCode: equipments.find((item) => item.name.includes(alarm.equipmentName.replace("#", "号")))?.code || `ALM-${index + 1}`,
  metricValue: alarm.level === "serious" ? "严重" : alarm.level === "normal" ? "警告" : "提示",
  unit: "",
  timestamp: alarm.time,
  dataSource: {
    pointId: `ALM-${String(alarm.id).padStart(4, "0")}`,
    pointName: alarm.type,
    kksCode: `ALM-${String(alarm.id).padStart(4, "0")}`,
    deviceName: alarm.equipmentName,
    collectionDevice: "告警管理服务",
    sampleRate: "事件触发",
    dataQuality: "正常",
  },
  formula: {
    description: alarm.description,
    formula: "—",
    inputs: [],
  },
  rawData: [],
  abnormal: {
    isAbnormal: true,
    threshold: "按关联测点告警阈值判定",
    actualValue: alarm.description,
    rule: "测点连续达到告警条件后生成事件",
    alarmRecord: {
      time: alarm.time,
      level: alarm.level === "serious" ? "严重" : alarm.level === "normal" ? "警告" : "提示",
      status: "处理中",
    },
  },
});

const equipmentNodes = (
  base: DrillDownData,
  pool: Equipment[],
  prefix: string,
) =>
  pool.map((equipment, index) =>
    makeNode({
      id: `${prefix}-equipment-${equipment.id}`,
      label: equipment.name,
      type: "object",
      value: equipment.code,
      status: statusLabel[equipment.status],
      scope: equipment.type,
      description: equipment.location,
      detail: deviceDetail(base, equipment),
    }),
  );

const buildPowerSession = (
  context: DrillClickContext,
  detailFactory: DetailFactory,
): DrillDownSession => {
  const time = context.params?.name || `${String(context.dataIndex * 2).padStart(2, "0")}:00`;
  const baseValues = [153.2, 148.7, 152.1, 131.6];
  const units = unitNames.map((unitName, index) => {
    const value = Number((baseValues[index] + context.dataIndex * 0.2).toFixed(1));
    const detail = detailFactory({
      seriesIndex: index,
      value,
      unit: "MW",
      deviceName: unitName,
      params: { name: time, value },
    });
    detail.detailType = "measurement";
    return makeNode({
      id: `power-unit-${index}`,
      label: unitName,
      type: "object",
      value: value.toFixed(1),
      unit: "MW",
      status: "运行",
      scope: time,
      children: [
        makeNode({
          id: `power-point-${index}`,
          label: `${unitName}有功功率测点`,
          type: "point",
          value: value.toFixed(1),
          unit: "MW",
          status: "正常",
          scope: "PMU实时测点",
          detail,
        }),
      ],
    });
  });

  return {
    chartId: context.chartId,
    title: "机组出力趋势数据钻取",
    description: "全厂趋势 → 指定时刻各机组出力 → 机组功率测点与历史数据",
    root: makeNode({
      id: `power-time-${context.dataIndex}`,
      label: `${time} 全厂出力`,
      type: "summary",
      value: units.reduce((sum, unit) => sum + Number(unit.value), 0).toFixed(1),
      unit: "MW",
      status: "正常",
      description: "当前时刻四台机组有功功率汇总",
      children: units,
    }),
  };
};

const buildWaterFlowSession = (
  context: DrillClickContext,
  detailFactory: DetailFactory,
): DrillDownSession => {
  const metricName = context.seriesIndex === 0 ? "净水头" : "发电流量";
  const unit = context.seriesIndex === 0 ? "m" : "m³/s";
  const time = context.params?.name || `${String(context.dataIndex * 4).padStart(2, "0")}:00`;
  const units = unitNames.map((unitName, index) => {
    const factor = 1 + (index - 1.5) * 0.012;
    const value = Number((context.value * factor).toFixed(2));
    const detail = detailFactory({
      value,
      unit,
      deviceName: unitName,
      params: { name: time, value },
    });
    detail.detailType = "measurement";
    return makeNode({
      id: `water-unit-${context.seriesIndex}-${index}`,
      label: unitName,
      type: "object",
      value: value.toFixed(2),
      unit,
      status: "正常",
      scope: time,
      children: [
        makeNode({
          id: `water-point-${context.seriesIndex}-${index}`,
          label: `${unitName}${metricName}测点`,
          type: "point",
          value: value.toFixed(2),
          unit,
          status: "正常",
          scope: "SCADA实时测点",
          detail,
        }),
      ],
    });
  });

  return {
    chartId: context.chartId,
    title: "水头/流量监测数据钻取",
    description: "全厂指标趋势 → 指定时刻各机组指标 → 具体机组测点与历史数据",
    root: makeNode({
      id: `water-time-${context.seriesIndex}-${context.dataIndex}`,
      label: `${time} ${metricName}`,
      type: "summary",
      value: context.value.toFixed(2),
      unit,
      status: "正常",
      description: `当前时刻全厂${metricName}汇总`,
      children: units,
    }),
  };
};

const buildAlarmSession = (
  context: DrillClickContext,
  detailFactory: DetailFactory,
): DrillDownSession => {
  const day = context.params?.name || `第${context.dataIndex + 1}日`;
  const base = detailFactory();
  const levelConfig = [
    { label: "严重", status: "严重", ratio: 0.25 },
    { label: "警告", status: "警告", ratio: 0.5 },
    { label: "提示", status: "提示", ratio: 0.25 },
  ];
  const alarmPool = alarms.length > 0 ? alarms : [];
  const levels = levelConfig.map((level, levelIndex) => {
    const count = Math.max(1, Math.round(context.value * level.ratio));
    const events = Array.from({ length: count }, (_, eventIndex) => {
      const source =
        alarmPool[(levelIndex + eventIndex) % Math.max(1, alarmPool.length)] || {
          id: eventIndex + 1,
          time: base.timestamp,
          equipmentName: `${eventIndex + 1}#机组`,
          type: `${level.label}告警`,
          level: levelIndex === 0 ? "serious" : levelIndex === 1 ? "normal" : "tip",
          description: "关联测点达到告警条件",
        };
      return makeNode({
        id: `alarm-event-${levelIndex}-${eventIndex}`,
        label: `${source.equipmentName} - ${source.type}`,
        type: "event",
        value: source.time,
        status: level.label,
        scope: source.equipmentName,
        description: source.description,
        detail: alarmDetail(base, source as (typeof alarms)[number], eventIndex),
      });
    });
    return makeNode({
      id: `alarm-level-${levelIndex}`,
      label: `${level.label}告警`,
      type: "category",
      value: String(count),
      unit: "条",
      status: level.status,
      scope: day,
      description: `${day}${level.label}级别告警事件`,
      children: events,
    });
  });

  return {
    chartId: context.chartId,
    title: "告警数量趋势数据钻取",
    description: "日期告警总数 → 告警级别分布 → 告警事件列表 → 关联设备详情",
    root: makeNode({
      id: `alarm-day-${context.dataIndex}`,
      label: `${day}告警总数`,
      type: "summary",
      value: String(context.value),
      unit: "条",
      status: context.value > 10 ? "异常" : "正常",
      description: "按日期汇总全厂告警事件",
      children: levels,
    }),
  };
};

const buildOnlineSession = (
  context: DrillClickContext,
  detailFactory: DetailFactory,
): DrillDownSession => {
  const base = detailFactory();
  const systemNodes = systems.slice(0, 6).map((system, systemIndex) => {
    const pool = equipmentForSystem(system).slice(0, 6);
    const offlineCount = systemIndex % 3 === 0 ? 1 : 0;
    const onlinePool = pool.slice(offlineCount);
    const offlinePool = pool.slice(0, offlineCount);
    const total = Math.max(1, pool.length);
    const rate = Math.round((onlinePool.length / total) * 100);
    return makeNode({
      id: `online-system-${systemIndex}`,
      label: system,
      type: "category",
      value: String(rate),
      unit: "%",
      status: rate >= 90 ? "正常" : "异常",
      scope: `${total}台设备`,
      children: [
        makeNode({
          id: `online-status-${systemIndex}`,
          label: "在线设备",
          type: "category",
          value: String(onlinePool.length),
          unit: "台",
          status: "在线",
          scope: system,
          children: equipmentNodes(base, onlinePool, `online-${systemIndex}`),
        }),
        makeNode({
          id: `offline-status-${systemIndex}`,
          label: "离线设备",
          type: "category",
          value: String(offlinePool.length),
          unit: "台",
          status: offlinePool.length > 0 ? "离线" : "正常",
          scope: system,
          children: equipmentNodes(base, offlinePool, `offline-${systemIndex}`),
        }),
      ],
    });
  });

  return {
    chartId: context.chartId,
    title: "设备在线率数据钻取",
    description: "全厂在线率 → 各系统在线率 → 在线/离线设备列表 → 设备详情",
    root: makeNode({
      id: "online-overall",
      label: "全厂设备在线率",
      type: "summary",
      value: context.value.toFixed(1),
      unit: "%",
      status: context.value >= 90 ? "正常" : "异常",
      description: "按设备通信状态统计全厂在线率",
      children: systemNodes,
    }),
  };
};

const buildDistributionSession = (
  context: DrillClickContext,
  detailFactory: DetailFactory,
  mode: "system" | "major" = "system",
): DrillDownSession => {
  const selectedName = context.params?.name || (mode === "system" ? "当前系统" : "当前专业");
  const base = detailFactory();
  const source =
    mode === "system"
      ? equipmentForSystem(selectedName)
      : equipments.filter((equipment) => equipment.major === selectedName);
  const pool = source.length > 0 ? source : equipments.slice(0, 14);
  const grouped = new Map<string, Equipment[]>();
  pool.forEach((equipment) => {
    const list = grouped.get(equipment.type) || [];
    list.push(equipment);
    grouped.set(equipment.type, list);
  });
  const typeNodes = Array.from(grouped.entries()).map(([type, list], index) =>
    makeNode({
      id: `distribution-type-${index}`,
      label: type,
      type: "category",
      value: String(list.length),
      unit: "台",
      status: "正常",
      scope: selectedName,
      children: equipmentNodes(base, list, `distribution-${index}`),
    }),
  );

  return {
    chartId: context.chartId,
    title: mode === "system" ? "系统设备分布数据钻取" : "专业设备分布数据钻取",
    description:
      mode === "system"
        ? "所属系统 → 设备类型分布 → 设备列表 → 设备详情及三维定位"
        : "所属专业 → 设备类型分布 → 设备列表 → 设备详情及三维定位",
    root: makeNode({
      id: `distribution-${mode}-${context.dataIndex}`,
      label: selectedName,
      type: "summary",
      value: String(context.value),
      unit: "台",
      status: "正常",
      description: `${selectedName}设备数量汇总`,
      children: typeNodes,
    }),
  };
};

const buildHealthSession = (
  context: DrillClickContext,
  detailFactory: DetailFactory,
  fromTrend: boolean,
): DrillDownSession => {
  const base = detailFactory();
  const healthLevels = fromTrend
    ? [
        { label: "健康", count: 85, status: "健康" },
        { label: "亚健康", count: 10, status: "亚健康" },
        { label: "告警", count: 5, status: "异常" },
      ]
    : [
        {
          label: context.params?.name || "健康",
          count: Math.max(1, Math.round(context.value)),
          status: context.params?.name || "健康",
        },
      ];
  const levelNodes = healthLevels.map((level, levelIndex) => {
    const systemNodes = systems.slice(0, 5).map((system, systemIndex) => {
      const pool = equipmentForSystem(system).slice(
        0,
        Math.max(1, Math.min(4, ((levelIndex + systemIndex) % 4) + 1)),
      );
      return makeNode({
        id: `health-system-${levelIndex}-${systemIndex}`,
        label: system,
        type: "category",
        value: String(pool.length),
        unit: "台",
        status: level.status,
        scope: level.label,
        children: equipmentNodes(
          base,
          pool,
          `health-${levelIndex}-${systemIndex}`,
        ),
      });
    });
    return makeNode({
      id: `health-level-${levelIndex}`,
      label: level.label,
      type: "category",
      value: String(level.count),
      unit: fromTrend ? "%" : "台",
      status: level.status,
      scope: fromTrend ? context.params?.name || "指定日期" : "全厂设备",
      children: systemNodes,
    });
  });

  return {
    chartId: context.chartId,
    title: fromTrend ? "设备健康度趋势数据钻取" : "设备健康度分布数据钻取",
    description: fromTrend
      ? "指定日期健康度 → 健康等级分布 → 各系统设备列表 → 设备详情"
      : "健康等级 → 各系统数量 → 设备列表 → 设备详情",
    root: makeNode({
      id: `health-root-${context.dataIndex}`,
      label: fromTrend
        ? `${context.params?.name || "指定日期"}健康度`
        : `${context.params?.name || "健康"}设备`,
      type: "summary",
      value: context.value.toFixed(context.unit === "%" ? 1 : 0),
      unit: context.unit,
      status: context.params?.name === "告警" ? "异常" : "正常",
      description: fromTrend ? "指定日期全厂设备健康度汇总" : "按健康等级汇总设备",
      children: levelNodes,
    }),
  };
};

const buildRuntimeSession = (
  context: DrillClickContext,
  detailFactory: DetailFactory,
): DrillDownSession => {
  const metrics = [
    { label: "压力", unit: "MPa", value: 1.58 },
    { label: "温度", unit: "℃", value: 42.5 },
    { label: "振动", unit: "mm/s", value: 2.3 },
  ];
  const metricNodes = metrics.map((metric, index) => {
    const detail = detailFactory({
      seriesIndex: index,
      value: index === context.seriesIndex ? context.value : metric.value,
      unit: metric.unit,
      params: {
        name: context.params?.name,
        value: index === context.seriesIndex ? context.value : metric.value,
      },
    });
    detail.detailType = "measurement";
    return makeNode({
      id: `runtime-metric-${index}`,
      label: metric.label,
      type: "category",
      value: String(index === context.seriesIndex ? context.value : metric.value),
      unit: metric.unit,
      status: "正常",
      scope: context.deviceName,
      children: [
        makeNode({
          id: `runtime-point-${index}`,
          label: `${context.deviceName}${metric.label}测点`,
          type: "point",
          value: String(index === context.seriesIndex ? context.value : metric.value),
          unit: metric.unit,
          status: "正常",
          scope: "实时运行数据",
          detail,
        }),
      ],
    });
  });

  return {
    chartId: context.chartId,
    title: "设备运行趋势数据钻取",
    description: "当前设备 → 运行指标 → 指定测点 → 原始时序数据",
    root: makeNode({
      id: `runtime-device-${context.deviceName}`,
      label: context.deviceName,
      type: "summary",
      status: "运行",
      description: "当前设备可下钻的运行指标",
      children: metricNodes,
    }),
  };
};

export function createDrillDownSession(
  context: DrillClickContext,
  detailFactory: DetailFactory,
): DrillDownSession {
  switch (context.chartId) {
    case "left-trend":
    case "overview-gauge":
      return buildPowerSession(context, detailFactory);
    case "left-waterflow":
      return buildWaterFlowSession(context, detailFactory);
    case "left-alarm":
      return buildAlarmSession(context, detailFactory);
    case "left-online":
      return buildOnlineSession(context, detailFactory);
    case "overview-rose":
    case "overview-pie-small":
      return buildDistributionSession(context, detailFactory);
    case "overview-major-bar":
      return buildDistributionSession(context, detailFactory, "major");
    case "overview-health-pie":
      return buildHealthSession(context, detailFactory, false);
    case "overview-health-trend":
      return buildHealthSession(context, detailFactory, true);
    case "right-runtime":
      return buildRuntimeSession(context, detailFactory);
    default: {
      const detail = detailFactory();
      detail.detailType = "measurement";
      return {
        chartId: context.chartId,
        title: "指标数据钻取",
        description: "汇总指标 → 具体测点 → 原始时序数据",
        root: makeNode({
          id: `fallback-${context.chartId}`,
          label: detail.pointName,
          type: "summary",
          value: detail.metricValue,
          unit: detail.unit,
          status: "正常",
          children: [
            makeNode({
              id: `fallback-point-${context.chartId}`,
              label: detail.pointName,
              type: "point",
              value: detail.metricValue,
              unit: detail.unit,
              status: "正常",
              detail,
            }),
          ],
        }),
      };
    }
  }
}
