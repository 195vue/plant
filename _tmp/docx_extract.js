// 提取 docx 文本（段落+表格），按文档顺序输出
const fs = require('fs');
const path = require('path');
const JSZip = require('c:/Users/云/Documents/trae_projects/plant/node_modules/jszip');

async function extract(docxPath, outPath) {
  const data = fs.readFileSync(docxPath);
  const zip = await JSZip.loadAsync(data);
  const xml = await zip.file('word/document.xml').async('string');
  const lines = [];
  // 按顶层 w:p 与 w:tbl 切分（采用简单游标解析，保证顺序）
  let i = 0;
  let pos = xml.indexOf('<w:body>');
  const bodyStart = xml.indexOf('>', pos) + 1;
  let cur = bodyStart;
  const re = /<w:(p|tbl)(?=[\s>])/g;
  let m;
  const tags = [];
  while ((m = re.exec(xml)) !== null) {
    tags.push({ tag: m[1], start: m.index });
  }
  const readText = (s, e) => {
    const seg = xml.slice(s, e);
    // 去掉标签得到纯文本
    let out = seg.replace(/<w:t[^>]*>/g, '').replace(/<\/w:t>/g, '').replace(/<w:tab\/>/g, '\t');
    out = out.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    return out;
  };
  for (let k = 0; k < tags.length; k++) {
    const t = tags[k];
    const segStart = cur;
    const segEnd = t.start;
    if (segEnd > segStart) {
      const txt = readText(segStart, segEnd).trim();
      if (txt) lines.push(txt);
    }
    if (t.tag === 'p') {
      // 找到段落结束
      const closeRe = /<\/w:p>/g; closeRe.lastIndex = t.start;
      const c = closeRe.exec(xml);
      const txt = readText(t.start, c.index).trim();
      lines.push(txt);
      cur = closeRe.lastIndex;
      // 跳过此段落内部的 tags
      while (k + 1 < tags.length && tags[k + 1].start < cur) k++;
    } else {
      // tbl
      const closeRe = /<\/w:tbl>/g; closeRe.lastIndex = t.start;
      const c = closeRe.exec(xml);
      const tblSeg = xml.slice(t.start, c.index);
      // 解析行与单元格
      const rows = [];
      const rowRe = /<w:tr(?=[\s>])/g; const trClose = /<\/w:tr>/g;
      let rm;
      const rowTags = [];
      while ((rm = rowRe.exec(tblSeg)) !== null) {
        trClose.lastIndex = rm.index;
        const tc = trClose.exec(tblSeg);
        rowTags.push({ start: rm.index, end: tc.index });
      }
      for (let r = 0; r < rowTags.length; r++) {
        const rowSeg = tblSeg.slice(rowTags[r].start, rowTags[r].end);
        const cells = [];
        const cellRe = /<w:tc(?=[\s>])/g;
        let cm; const cellList = [];
        while ((cm = cellRe.exec(rowSeg)) !== null) cellList.push(cm.index);
        cellList.push(rowSeg.length);
        for (let cc = 0; cc < cellList.length - 1; cc++) {
          const cellSeg = rowSeg.slice(cellList[cc], cellList[cc + 1]);
          let txt = cellSeg.replace(/<w:t[^>]*>/g, '').replace(/<\/w:t>/g, '').replace(/<w:tab\/>/g, ' ');
          txt = txt.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
          cells.push(txt);
        }
        rows.push(cells.join(' | '));
      }
      if (rows.length) lines.push('<<TABLE>>');
      rows.forEach(r => lines.push(r));
      if (rows.length) lines.push('<<ENDTABLE>>');
      cur = closeRe.lastIndex;
      while (k + 1 < tags.length && tags[k + 1].start < cur) k++;
    }
  }
  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
  console.log('done:', outPath, lines.length, 'lines');
}

const docx = process.argv[2];
const out = process.argv[3] || docx.replace(/\.docx$/i, '.txt');
extract(docx, out);
