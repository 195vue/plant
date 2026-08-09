// Excel转JSON脚本：读取结构树Excel并生成JSON数据
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = 'C:\\Users\\云\\Desktop\\电厂数字孪生\\xuqiu1\\设备及管路结构树_整理版.xlsx';
const wb = XLSX.readFile(filePath);
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

console.log('=== 表头与前5行 ===');
for (let i = 0; i < Math.min(5, rows.length); i++) {
  console.log('行' + i + ':', JSON.stringify(rows[i].slice(0, 15)));
}
console.log('总行数:', rows.length);

let l1 = 0, l2 = 0, l3 = 0;
for (let i = 1; i < rows.length; i++) {
  const row = rows[i];
  if (!row[0]) continue;
  const level = row[3];
  if (level === '一级') l1++;
  else if (level === '二级') l2++;
  else if (level === '三级') l3++;
}
console.log('一级: ' + l1 + ', 二级: ' + l2 + ', 三级: ' + l3);

const nodes = [];
for (let i = 1; i < rows.length; i++) {
  const row = rows[i];
  if (!row[0]) continue;
  // KKS目录在 row[10]-row[14]（一级目录到五级目录）
  const dir1 = row[10] || '';
  const dir2 = row[11] || '';
  const dir3 = row[12] || '';
  const dir4 = row[13] || '';
  const dir5 = row[14] || '';
  // 该节点的KKS编码 = 非空目录值拼接
  const kks = (dir1 + dir2 + dir3 + dir4 + dir5).trim();
  nodes.push({
    id: Number(row[1]),
    parentId: Number(row[2]),
    level: row[3],        // 一级/二级/三级/四级
    category: row[4],     // 设备/系统目录
    name: row[5],
    typeCode: row[6] || '',
    kks: kks,
    sort: Number(row[0]),
  });
}

const outputPath = path.join(__dirname, '..', 'src', 'mock', 'structureTree.json');
fs.writeFileSync(outputPath, JSON.stringify(nodes, null, 2), 'utf-8');
console.log('\n已生成: ' + outputPath);
console.log('节点总数: ' + nodes.length);

console.log('\n=== 前20个节点预览 ===');
nodes.slice(0, 20).forEach(function(n) {
  console.log('[' + n.level + '] ' + n.category + ' | ' + n.name + ' | KKS: ' + n.kks);
});

// 统计一级节点（系统分类）
console.log('\n=== 一级节点列表 ===');
nodes.filter(function(n) { return n.level === '一级'; }).forEach(function(n) {
  console.log(n.id + ' | ' + n.category + ' | ' + n.name + ' | KKS: ' + n.kks);
});

// 统计四级节点数量
let l4 = nodes.filter(function(n) { return n.level === '四级'; }).length;
console.log('\n四级节点: ' + l4);
