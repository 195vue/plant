const XLSX = require('xlsx');
const fs = require('fs');

const SRC = 'C:/Users/云/Desktop/电厂数字孪生/设备及管路结构树整理.xlsx';
const TPL = 'C:/Users/云/Desktop/电厂数字孪生/设备属性模版库.xlsx';
const wb = XLSX.readFile(SRC);

// ===== 读取整理版两个 sheet =====
const eqRows = XLSX.utils.sheet_to_json(wb.Sheets['设备结构树'], { header: 1, defval: '' });
const pipeRows = XLSX.utils.sheet_to_json(wb.Sheets['管路结构树'], { header: 1, defval: '' });

// ===== 生成设备结构树 =====
// 列: 0序号 1位置 2系统 3系统编码 4子系统 5子系统编码 6设备名称 7KKS编码 8设备类型
const eqData = eqRows.slice(1).filter(r => String(r[1]).trim());
const nodes = [];
let seq = 0;
const add = (parentId, level, category, name, kks, sort) => {
  seq += 1;
  nodes.push({ id: seq, parentId, level, category, name, typeCode: '', kks: String(kks).trim(), sort });
  return seq;
};

// L1 位置
const posNodes = {};
eqData.forEach(r => {
  const pos = String(r[1]).trim();
  if (!posNodes[pos]) posNodes[pos] = add(0, '一级', '系统目录', pos, '', 1);
});
// L2 系统
const sysNodes = {};
eqData.forEach(r => {
  const pos = String(r[1]).trim();
  const sys = String(r[2]).trim();
  const key = `${pos}|${sys}`;
  if (!sysNodes[key]) sysNodes[key] = add(posNodes[pos], '二级', '系统目录', sys, String(r[3]).trim(), 1);
});
// L3 子系统
const subNodes = {};
eqData.forEach(r => {
  const pos = String(r[1]).trim();
  const sys = String(r[2]).trim();
  const sub = String(r[4]).trim();
  const key = `${pos}|${sys}|${sub}`;
  if (sub && !subNodes[key]) subNodes[key] = add(sysNodes[`${pos}|${sys}`], '三级', '系统目录', sub, String(r[5]).trim(), 1);
});
// L4 设备行：先收集，按 KKS 判断是否前缀节点
const eqKks = eqData.map(r => String(r[7]).trim()).filter(Boolean);
const isPrefix = (kks) => eqKks.some(other => other.length > kks.length && other.startsWith(kks));
// 建一个按 KKS 的节点查找表（含 L3 的 kks），用于找父节点
const kksIndex = {};
nodes.forEach(n => { if (n.kks) kksIndex[n.kks] = n; });
// 按 KKS 长度升序处理设备行，保证父节点先建立
const rowsByIdx = eqData
  .map((r, idx) => ({ r, idx }))
  .sort((a, b) => String(a.r[7]).trim().length - String(b.r[7]).trim().length);
rowsByIdx.forEach(({ r, idx }) => {
  const pos = String(r[1]).trim();
  const sys = String(r[2]).trim();
  const sub = String(r[4]).trim();
  const name = String(r[6]).trim();
  const kks = String(r[7]).trim();
  // 找最近前缀父节点
  let parent = null;
  if (kks) {
    for (let len = kks.length - 1; len >= 1; len--) {
      const prefix = kks.slice(0, len);
      if (kksIndex[prefix]) { parent = kksIndex[prefix]; break; }
    }
  }
  if (!parent) parent = sub ? subNodes[`${pos}|${sys}|${sub}`] : sysNodes[`${pos}|${sys}`];
  if (!parent) parent = posNodes[pos];
  const category = kks && isPrefix(kks) ? '系统目录' : '设备';
  add(parent, '四级', category, name, kks, idx + 1);
  if (kks && !kksIndex[kks]) kksIndex[kks] = nodes[nodes.length - 1];
});
fs.writeFileSync('src/mock/equipmentStructureTree.json', JSON.stringify(nodes, null, 2), 'utf8');
console.log('设备结构树节点数:', nodes.length, '| 末级设备:', nodes.filter(n => n.category === '设备').length);

// ===== 生成管路结构树 =====
// 列: 0序号 1位置 2系统 3用途 4管路/管件名称 5KKS编码 6类型
const pipeData = pipeRows.slice(1).filter(r => String(r[1]).trim());
const pNodes = [];
seq = 0;
const padd = (parentId, level, category, name, kks, sort) => {
  seq += 1;
  pNodes.push({ id: seq, parentId, level, category, name, typeCode: '', kks: String(kks).trim(), sort });
  return seq;
};
const pPos = {};
pipeData.forEach(r => {
  const pos = String(r[1]).trim();
  if (!pPos[pos]) pPos[pos] = padd(0, '一级', '系统目录', pos, '', 1);
});
const pSys = {};
pipeData.forEach(r => {
  const pos = String(r[1]).trim();
  const sys = String(r[2]).trim();
  const key = `${pos}|${sys}`;
  if (!pSys[key]) pSys[key] = padd(pPos[pos], '二级', '系统目录', sys, '', 1);
});
const pUsage = {};
pipeData.forEach(r => {
  const pos = String(r[1]).trim();
  const sys = String(r[2]).trim();
  const usage = String(r[3]).trim();
  const key = `${pos}|${sys}|${usage}`;
  if (!pUsage[key]) pUsage[key] = padd(pSys[`${pos}|${sys}`], '三级', '系统目录', usage, '', 1);
});
pipeData.forEach((r, idx) => {
  const pos = String(r[1]).trim();
  const sys = String(r[2]).trim();
  const usage = String(r[3]).trim();
  padd(pUsage[`${pos}|${sys}|${usage}`] || pSys[`${pos}|${sys}`], '四级', '管路', String(r[4]).trim(), String(r[5]).trim(), idx + 1);
});
fs.writeFileSync('src/mock/pipelineStructureTree.json', JSON.stringify(pNodes, null, 2), 'utf8');
console.log('管路结构树节点数:', pNodes.length, '| 管路:', pNodes.filter(n => n.category === '管路').length);

// ===== 生成设备列表（末级设备） =====
const majorsMap = {
  水泵水轮机: '机械', 主进水阀: '机械', 部件: '机械', 控制屏柜: '电气', 其他设备: '其他',
  水泵: '机械', '滤水器/热交换器': '机械', 发电电动机: '电气', 变压器: '电气', 馈电屏: '电气',
  母线: '电气', 电抗器: '电气', 蓄电池: '电气', 摄像机: '电气', 拦污栅: '水工',
  '门槽/栅槽': '水工', 闸门: '水工', 启闭机: '水工', 调速器: '机械', 励磁: '电气',
};
const equipmentList = [];
let eid = 0;
eqData.forEach(r => {
  const kks = String(r[7]).trim();
  if (!kks || isPrefix(kks)) return; // 只取末级设备
  const type = String(r[8]).trim() || '其他设备';
  eid += 1;
  const system = String(r[4]).trim() || String(r[2]).trim();
  const location = String(r[1]).trim();
  const name = String(r[6]).trim();
  const baseAttrs = [
    { name: '设备名称', value: name },
    { name: 'KKS编码', value: kks },
    { name: '所属系统', value: system },
    { name: '安装位置', value: location },
    { name: '设备类型', value: type },
  ];
  equipmentList.push({
    id: eid,
    code: kks,
    name,
    type,
    system,
    major: majorsMap[type] || '机械',
    location,
    model: '',
    manufacturer: '',
    commissionDate: '2018-06-01',
    status: 'running',
    codeStatus: eid % 7 === 0 ? 'unlinked' : 'linked',
    attributes: baseAttrs.map((a, i) => ({
      id: eid * 100 + i + 1,
      equipmentId: eid,
      name: a.name,
      value: a.value,
      type: 'text',
      category: '基础信息',
    })),
  });
});
fs.writeFileSync('src/mock/generated-equipments.json', JSON.stringify(equipmentList, null, 2), 'utf8');
console.log('设备列表条数:', equipmentList.length);

// ===== 生成管路列表 =====
const usageDefaults = {
  技术供水管路: { dn: 'DN150', material: 'Q235B', pressure: 0.8, medium: '水', length: 120 },
  冷却水管路: { dn: 'DN100', material: 'Q235B', pressure: 0.6, medium: '水', length: 80 },
  消防水管路: { dn: 'DN200', material: '无缝钢管', pressure: 0.5, medium: '水', length: 200 },
  排水管路: { dn: 'DN200', material: 'Q235B', pressure: 0.3, medium: '水', length: 150 },
  供油管路: { dn: 'DN80', material: '不锈钢', pressure: 0.6, medium: '透平油', length: 60 },
  其他管路: { dn: 'DN100', material: '镀锌钢管', pressure: 0.6, medium: '水', length: 90 },
};
const pipelineList = [];
pipeData.forEach((r, idx) => {
  const usage = String(r[3]).trim() || '其他管路';
  const def = usageDefaults[usage] || usageDefaults['其他管路'];
  pipelineList.push({
    id: idx + 1,
    code: String(r[5]).trim(),
    name: String(r[4]).trim(),
    position: String(r[1]).trim(),
    system: String(r[2]).trim(),
    usage,
    dn: def.dn,
    material: def.material,
    length: def.length,
    wallThickness: 8,
    designPressure: def.pressure,
    designTemperature: 40,
    medium: def.medium,
    installDate: '2018-06-01',
    codeStatus: 'linked',
    status: 'running',
  });
});
fs.writeFileSync('src/mock/generated-pipelines.json', JSON.stringify(pipelineList, null, 2), 'utf8');
console.log('管路列表条数:', pipelineList.length);

// ===== 统计：系统分布（用于 screenStats） =====
const sysCount = {};
eqData.forEach(r => {
  const sys = String(r[2]).trim();
  if (!sysCount[sys]) sysCount[sys] = 0;
  sysCount[sys] += 1;
});
console.log('系统数:', Object.keys(sysCount).length);
console.log('系统分布:', JSON.stringify(sysCount));
// 设备类型分布
const typeCount = {};
eqData.forEach(r => {
  const t = String(r[8]).trim() || '其他设备';
  if (!typeCount[t]) typeCount[t] = 0;
  typeCount[t] += 1;
});
console.log('设备类型分布:', JSON.stringify(typeCount));
// 位置列表
const posList = [...new Set(eqData.map(r => String(r[1]).trim()))];
console.log('位置列表:', JSON.stringify(posList));

// ===== 生成 generatedData.ts（TS 数据文件） =====
const eq2 = JSON.parse(fs.readFileSync('src/mock/generated-equipments.json', 'utf8'));
const pipe2 = JSON.parse(fs.readFileSync('src/mock/generated-pipelines.json', 'utf8'));
const tsContent =
  `// 由 gen_mock.cjs 从「设备及管路结构树整理.xlsx」生成，请勿手动编辑
import type { Equipment, Pipeline } from "@/types";

export const equipmentData: Equipment[] = ${JSON.stringify(eq2, null, 2)} as Equipment[];

export const pipelineData: Pipeline[] = ${JSON.stringify(pipe2, null, 2)} as Pipeline[];
`;
fs.writeFileSync('src/mock/generatedData.ts', tsContent, 'utf8');
console.log('generatedData.ts 已生成');
