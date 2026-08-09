import { useState, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import {
  Plus, Edit, Trash2, BookOpen, FileText, CheckCircle, XCircle, Info,
  Search, Upload, Download, Power,
} from "lucide-react";
import { dictCategories as mockCats, dictItems as mockItems } from "@/mock";
import type { DictCategory, DictItem } from "@/types";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchForm, type SearchField } from "@/components/common/SearchForm";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Modal, ConfirmModal } from "@/components/common/Modal";
import { FormItem } from "@/components/common/UploadBox";
import { StatusTag, Tag as TagComp } from "@/components/common/Tag";
import { message } from "@/components/common/Message";
import { cn } from "@/lib/utils";

// mock 引用情况
const usageRecords: Record<number, { module: string; count: number; lastUse: string }[]> = {
  1: [
    { module: "设备管理-设备类型", count: 12, lastUse: "2026-08-05 09:30" },
    { module: "管路数字化-管路分类", count: 8, lastUse: "2026-08-04 16:20" },
  ],
  12: [
    { module: "阀门管理-阀门类型", count: 15, lastUse: "2026-08-05 10:00" },
    { module: "管路数字化-管件类型", count: 3, lastUse: "2026-08-03 14:00" },
  ],
};

// mock 操作日志
const operationLogs: Record<number, { type: string; operator: string; time: string; content: string }[]> = {
  1: [
    { type: "新增", operator: "admin", time: "2026-01-01 09:00", content: "新增字典项：水工" },
    { type: "编辑", operator: "admin", time: "2026-08-01 10:30", content: "修改字典值：HYDRAULIC" },
    { type: "启用", operator: "admin", time: "2026-08-01 10:30", content: "启用字典项" },
  ],
  12: [
    { type: "新增", operator: "admin", time: "2026-01-10 10:00", content: "新增字典项：闸阀" },
    { type: "编辑", operator: "admin", time: "2026-08-02 09:15", content: "修改备注信息" },
  ],
};

const opColorMap: Record<string, "blue" | "green" | "orange" | "red" | "gray" | "purple"> = {
  新增: "green", 编辑: "orange", 停用: "red", 启用: "blue", 删除: "red",
};

const dictSearchFields: SearchField[] = [
  { name: "code", label: "字典编码", type: "input", placeholder: "请输入编码" },
  { name: "name", label: "字典名称", type: "input", placeholder: "请输入名称" },
  { name: "status", label: "状态", type: "select", options: [
    { label: "启用", value: "enabled" },
    { label: "停用", value: "disabled" },
  ], width: "120px" },
];

export default function DictManage() {
  const [categories, setCategories] = useState<DictCategory[]>(mockCats);
  const [items, setItems] = useState<DictItem[]>(mockItems);
  const [selectedCat, setSelectedCat] = useState<number>(mockCats[0]?.id);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [searchValues, setSearchValues] = useState<Record<string, any>>({});
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // 弹窗状态
  const [itemOpen, setItemOpen] = useState(false);
  const [itemMode, setItemMode] = useState<"add" | "edit">("add");
  const [currentItem, setCurrentItem] = useState<DictItem | null>(null);
  const [itemForm, setItemForm] = useState<Record<string, any>>({});
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [catOpen, setCatOpen] = useState(false);
  const [catMode, setCatMode] = useState<"add" | "edit">("add");
  const [editCat, setEditCat] = useState<DictCategory | null>(null);
  const [catForm, setCatForm] = useState<Record<string, any>>({});
  const [importOpen, setImportOpen] = useState(false);

  const setItem = (n: string, v: any) => setItemForm({ ...itemForm, [n]: v });

  // 统计
  const totalCats = categories.length;
  const totalItems = items.length;
  const enabledCount = items.filter((i) => i.status === "enabled").length;
  const disabledCount = items.filter((i) => i.status === "disabled").length;

  // 当前分类下的字典项（带筛选）
  const filteredItems = useMemo(() => {
    let list = items.filter((i) => i.categoryId === selectedCat);
    if (searchValues.code) list = list.filter((i) => i.code.toLowerCase().includes(searchValues.code.toLowerCase()));
    if (searchValues.name) list = list.filter((i) => i.name.includes(searchValues.name));
    if (searchValues.status) list = list.filter((i) => i.status === searchValues.status);
    if (searchValues.keyword) {
      const kw = searchValues.keyword.toLowerCase();
      list = list.filter((i) => i.code.toLowerCase().includes(kw) || i.name.includes(searchValues.keyword));
    }
    return list;
  }, [items, selectedCat, searchValues]);

  const currentCat = categories.find((c) => c.id === selectedCat);
  const currentItemDetail = items.find((i) => i.id === selectedItemId) || null;

  const defaultItemCode = currentCat
    ? `${currentCat.code.toUpperCase()}_${String(filteredItems.length + 1).padStart(2, "0")}`
    : "";

  // 操作
  const openAddItem = () => {
    setItemMode("add");
    setCurrentItem(null);
    setItemForm({ code: defaultItemCode, sort: 0, status: "enabled" });
    setItemOpen(true);
  };

  const openEditItem = (r: DictItem) => {
    setItemMode("edit");
    setCurrentItem(r);
    setItemForm({ ...r });
    setItemOpen(true);
  };

  const submitItem = () => {
    if (!itemForm.code?.trim()) return message.warning("请填写字典编码");
    if (!itemForm.name?.trim()) return message.warning("请填写字典名称");
    if (items.some((i) => i.code === itemForm.code && i.id !== currentItem?.id))
      return message.warning("字典编码已存在");
    const now = "2026-08-05 15:00";
    if (itemMode === "add") {
      const newId = Math.max(...items.map((i) => i.id), 0) + 1;
      setItems([...items, {
        id: newId, categoryId: selectedCat, code: itemForm.code, name: itemForm.name,
        value: itemForm.value || undefined, sort: Number(itemForm.sort) || 0,
        status: itemForm.status, createTime: now, updateTime: now, remark: itemForm.remark || undefined,
      }]);
      message.success("字典项新增成功");
    } else if (currentItem) {
      setItems(items.map((i) => i.id === currentItem.id ? {
        ...i, code: itemForm.code, name: itemForm.name, value: itemForm.value || undefined,
        sort: Number(itemForm.sort) || 0, status: itemForm.status, updateTime: now, remark: itemForm.remark || undefined,
      } : i));
      message.success("字典项编辑成功");
    }
    setItemOpen(false);
  };

  const toggleStatus = (r: DictItem) => {
    const newStatus = r.status === "enabled" ? "disabled" : "enabled";
    setItems(items.map((i) => i.id === r.id ? { ...i, status: newStatus, updateTime: "2026-08-05 15:00" } : i));
    message.success(`已${newStatus === "enabled" ? "启用" : "停用"}：${r.name}`);
  };

  const confirmDelete = () => {
    if (deleteId !== null) {
      setItems(items.filter((i) => i.id !== deleteId));
      if (selectedItemId === deleteId) setSelectedItemId(null);
      message.success("删除成功");
    }
    setDeleteId(null);
  };

  const handleBatchDelete = () => {
    if (selectedRows.length === 0) return message.warning("请先勾选要删除的字典项");
    const ids = selectedRows.map(Number);
    setItems(items.filter((i) => !ids.includes(i.id)));
    message.success(`已删除${selectedRows.length}条`);
    setSelectedRows([]);
  };

  // 分类操作
  const openAddCat = () => {
    setCatMode("add");
    setEditCat(null);
    setCatForm({ sort: 0 });
    setCatOpen(true);
  };

  const openEditCat = (c: DictCategory) => {
    setCatMode("edit");
    setEditCat(c);
    setCatForm({ ...c });
    setCatOpen(true);
  };

  const submitCat = () => {
    if (!catForm.name?.trim()) return message.warning("请填写分类名称");
    if (!catForm.code?.trim()) return message.warning("请填写分类编码");
    if (catMode === "add" && categories.some((c) => c.code === catForm.code))
      return message.warning("分类编码已存在");
    if (catMode === "add") {
      const newId = Math.max(...categories.map((c) => c.id), 0) + 1;
      setCategories([...categories, {
        id: newId, name: catForm.name, code: catForm.code,
        description: catForm.description, sort: Number(catForm.sort) || 0,
      }]);
      setSelectedCat(newId);
      message.success("分类新增成功");
    } else if (editCat) {
      setCategories(categories.map((c) => c.id === editCat.id ? {
        ...c, name: catForm.name, code: catForm.code,
        description: catForm.description, sort: Number(catForm.sort) || 0,
      } : c));
      message.success("分类编辑成功");
    }
    setCatOpen(false);
  };

  const deleteCat = (c: DictCategory) => {
    const count = items.filter((i) => i.categoryId === c.id).length;
    if (count > 0) return message.warning(`该分类下有${count}个字典项，无法删除`);
    setCategories(categories.filter((cc) => cc.id !== c.id));
    if (selectedCat === c.id) setSelectedCat(categories[0]?.id);
    message.success("分类删除成功");
  };

  const linkBtn = (icon: React.ReactNode, label: string, onClick: () => void, danger = false) => (
    <button className={`${danger ? "btn-link-danger" : "btn-link"} flex items-center gap-0.5 text-xs`} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {icon}{label}
    </button>
  );

  // 表格列定义
  const columns: Column<DictItem>[] = [
    { key: "index", title: "序号", width: 50, render: (_, i) => i + 1 },
    { key: "code", title: "字典编码", width: 110, render: (r) => <span className="font-mono text-xs">{r.code}</span> },
    { key: "name", title: "字典名称", width: 100, render: (r) => r.name },
    { key: "value", title: "字典值", width: 80, render: (r) => r.value ? <span className="font-mono text-xs text-admin-muted">{r.value}</span> : <span className="text-admin-muted">-</span> },
    { key: "sort", title: "排序", width: 50, render: (r) => r.sort },
    { key: "status", title: "状态", width: 60, render: (r) => <StatusTag status={r.status} /> },
    { key: "createTime", title: "创建时间", width: 110, render: (r) => r.createTime?.split(" ")[0] || "-" },
    { key: "updateTime", title: "更新时间", width: 110, render: (r) => r.updateTime?.split(" ")[0] || "-" },
    {
      key: "action", title: "操作", width: 140,
      render: (r) => (
        <div className="flex items-center gap-1.5">
          {linkBtn(<Edit size={12} />, "编辑", () => openEditItem(r))}
          {linkBtn(<Power size={12} />, r.status === "enabled" ? "停用" : "启用", () => toggleStatus(r))}
          {linkBtn(<Trash2 size={12} />, "删除", () => setDeleteId(r.id), true)}
        </div>
      ),
    },
  ];

  // 统计卡片
  const StatCard = ({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: string }) => (
    <div className="admin-card p-4 flex items-center gap-3">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
        {Icon}
      </div>
      <div>
        <div className="text-xs text-admin-muted">{title}</div>
        <div className="text-xl font-bold text-admin-text">{value}</div>
      </div>
    </div>
  );

  // 图表配置
  const distChartOption = useMemo(() => {
    const data = categories.map((c) => ({
      name: c.name,
      count: items.filter((i) => i.categoryId === c.id).length,
    }));
    return {
      tooltip: { trigger: "axis", formatter: (p: any) => `${p[0].name}<br/>字典项: ${p[0].value}个<br/><span style="color:#3b82f6">点击查看该分类</span>` },
      grid: { left: 60, right: 20, top: 30, bottom: 70 },
      xAxis: { type: "category", data: data.map((d) => d.name), axisLabel: { fontSize: 10, rotate: 35, interval: 0 } },
      yAxis: { type: "value", name: "数量" },
      series: [{
        type: "bar", data: data.map((d) => d.count),
        itemStyle: { color: "#3b82f6", borderRadius: [4, 4, 0, 0] }, barWidth: 24,
        label: { show: true, position: "top", fontSize: 10 },
      }],
    };
  }, [categories, items]);

  const statusChartOption = useMemo(() => {
    return {
      tooltip: { trigger: "item", formatter: (p: any) => `${p.name}<br/>数量: ${p.value}<br/>占比: ${p.percent}%<br/><span style="color:#10b981">点击筛选该状态</span>` },
      series: [{
        type: "pie", radius: ["45%", "70%"],
        data: [
          { name: "启用", value: enabledCount, itemStyle: { color: "#10b981" } },
          { name: "停用", value: disabledCount, itemStyle: { color: "#9ca3af" } },
        ],
        label: { show: true, formatter: "{b}: {c}", fontSize: 11 },
        center: ["40%", "50%"],
      }],
      graphic: [{
        type: "text", left: "32%", top: "42%",
        style: { text: String(totalItems), fontSize: 20, fontWeight: "bold", fill: "#374151" },
      }, {
        type: "text", left: "33%", top: "58%",
        style: { text: "总数", fontSize: 11, fill: "#9ca3af" },
      }],
    };
  }, [enabledCount, disabledCount, totalItems]);

  // 图表联动
  const handleDistClick = (params: any) => {
    const cat = categories.find((c) => c.name === params.name);
    if (cat) {
      setSelectedCat(cat.id);
      message.info(`已切换到分类：${cat.name}`);
    }
  };
  const handleStatusClick = (params: any) => {
    const status = params.name === "启用" ? "enabled" : "disabled";
    setSearchValues({ ...searchValues, status });
    message.info(`已按状态筛选：${params.name}`);
  };

  return (
    <div className="space-y-4">
      <PageHeader title="数据字典" subtitle="维护系统数据字典分类与字典项" />

      {/* 区域1：统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="字典分类总数" value={totalCats} icon={<BookOpen size={24} className="text-white" />} color="bg-blue-500" />
        <StatCard title="字典项总数" value={totalItems} icon={<FileText size={24} className="text-white" />} color="bg-green-500" />
        <StatCard title="已启用" value={enabledCount} icon={<CheckCircle size={24} className="text-white" />} color="bg-purple-500" />
        <StatCard title="已停用" value={disabledCount} icon={<XCircle size={24} className="text-white" />} color="bg-orange-500" />
      </div>

      {/* 区域2：筛选查询区 */}
      <SearchForm
        fields={dictSearchFields}
        values={searchValues}
        onChange={(name, value) => setSearchValues({ ...searchValues, [name]: value })}
        onSearch={() => message.info("搜索完成")}
        onReset={() => { setSearchValues({}); message.info("已重置搜索条件"); }}
      />

      {/* 区域3：主内容区 */}
      <div className="flex gap-3">
        {/* 左侧分类树 */}
        <div className="admin-card flex flex-col flex-shrink-0" style={{ width: 200 }}>
          <div className="flex items-center justify-between px-3 py-3 border-b border-admin-border">
            <span className="text-sm font-medium text-admin-text">字典分类</span>
            <button className="btn-link flex items-center gap-0.5 text-xs" onClick={openAddCat}>
              <Plus size={12} />新增分类
            </button>
          </div>
          <div className="flex-1 overflow-auto p-1" style={{ maxHeight: "calc(100vh - 480px)" }}>
            {categories.map((c) => {
              const count = items.filter((i) => i.categoryId === c.id).length;
              const active = selectedCat === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCat(c.id)}
                  className={cn(
                    "group flex items-center gap-2 px-3 py-2 cursor-pointer rounded text-sm transition-colors",
                    active ? "bg-admin-primary text-white" : "text-admin-text hover:bg-blue-50"
                  )}
                >
                  <BookOpen size={14} className={active ? "text-white" : "text-admin-muted flex-shrink-0"} />
                  <span className="truncate flex-1">{c.name}</span>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded flex-shrink-0",
                    active ? "bg-white/20 text-white" : "bg-gray-100 text-admin-muted"
                  )}>{count}</span>
                  <div className="flex items-center gap-1 flex-shrink-0" style={{ width: 32 }}>
                    <button onClick={(e) => { e.stopPropagation(); openEditCat(c); }} className={active ? "text-white hover:text-blue-100" : "text-admin-muted hover:text-admin-text"}>
                      <Edit size={12} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); deleteCat(c); }} className={active ? "text-white hover:text-red-200" : "text-admin-muted hover:text-red-500"}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 中间表格 */}
        <div className="flex-1 admin-card p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-admin-text">
              {currentCat?.name} - 字典项（{filteredItems.length}）
            </span>
            <div className="flex items-center gap-2">
              <button className="btn-primary flex items-center gap-1" onClick={openAddItem}>
                <Plus size={14} />新增字典项
              </button>
              <button className="btn-default flex items-center gap-1" onClick={() => setImportOpen(true)}>
                <Upload size={14} />批量导入
              </button>
              <button className="btn-default flex items-center gap-1" onClick={() => message.info("开始导出")}>
                <Download size={14} />导出
              </button>
              <button className="btn-danger flex items-center gap-1" onClick={handleBatchDelete}>
                <Trash2 size={14} />批量删除
              </button>
            </div>
          </div>
          <DataTable
            columns={columns}
            data={filteredItems}
            pageSize={10}
            emptyText="暂无字典项"
            selectable
            onSelectChange={setSelectedRows}
            onRowClick={(r) => setSelectedItemId(r.id)}
          />
        </div>

        {/* 右侧详情面板 */}
        <DictDetailPanel item={currentItemDetail} category={currentCat} />
      </div>

      {/* 区域4：底部图表 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="admin-card p-4">
          <div className="text-sm font-medium text-admin-text mb-3">字典项分布</div>
          <ReactECharts option={distChartOption} style={{ height: 200 }} onEvents={{ click: handleDistClick }} />
        </div>
        <div className="admin-card p-4">
          <div className="text-sm font-medium text-admin-text mb-3">状态分布</div>
          <div className="flex gap-4 items-center">
            <ReactECharts option={statusChartOption} style={{ height: 180, width: 180 }} onEvents={{ click: handleStatusClick }} />
            <div className="flex-1 space-y-3">
              <div className="p-2 rounded bg-gray-50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-admin-muted">启用率</span>
                  <span className="text-xs font-medium text-green-600">{totalItems > 0 ? ((enabledCount / totalItems) * 100).toFixed(1) : "0.0"}%</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded overflow-hidden">
                  <div className="h-full bg-green-500 transition-all" style={{ width: `${totalItems > 0 ? (enabledCount / totalItems) * 100 : 0}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded border border-gray-100">
                  <div className="text-[10px] text-admin-muted mb-0.5">启用</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-green-600">{enabledCount}</span>
                    <span className="text-[10px] text-admin-muted">项</span>
                  </div>
                </div>
                <div className="p-2 rounded border border-gray-100">
                  <div className="text-[10px] text-admin-muted mb-0.5">停用</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-gray-400">{disabledCount}</span>
                    <span className="text-[10px] text-admin-muted">项</span>
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-admin-muted leading-relaxed p-2 rounded bg-blue-50/50 border border-blue-100">
                <div className="flex items-center gap-1 mb-0.5">
                  <Info size={11} className="text-blue-400" />
                  <span className="text-blue-500 font-medium">提示</span>
                </div>
                点击图表扇区可筛选对应状态的字典项
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 字典项弹窗 */}
      <Modal
        open={itemOpen}
        onClose={() => setItemOpen(false)}
        title={itemMode === "add" ? "新增字典项" : "编辑字典项"}
        width={520}
        footer={
          <>
            <button className="btn-default" onClick={() => setItemOpen(false)}>取消</button>
            <button className="btn-primary" onClick={submitItem}>确定</button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <FormItem label="字典编码" required>
            <input className="input-base" value={itemForm.code || ""} onChange={(e) => setItem("code", e.target.value)} placeholder="自动生成，可修改" />
          </FormItem>
          <FormItem label="字典名称" required>
            <input className="input-base" value={itemForm.name || ""} onChange={(e) => setItem("name", e.target.value)} placeholder="请输入字典名称" />
          </FormItem>
          <FormItem label="排序号">
            <input type="number" className="input-base" value={itemForm.sort ?? 0} onChange={(e) => setItem("sort", e.target.value)} placeholder="请输入排序号" />
          </FormItem>
          <FormItem label="状态">
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input type="checkbox" checked={itemForm.status === "enabled"}
                onChange={(e) => setItem("status", e.target.checked ? "enabled" : "disabled")} />
              <span className="text-sm">{itemForm.status === "enabled" ? "启用" : "停用"}</span>
            </label>
          </FormItem>
        </div>
        <FormItem label="字典值">
          <input className="input-base" value={itemForm.value || ""} onChange={(e) => setItem("value", e.target.value)} placeholder="请输入字典值（系统引用标识）" />
        </FormItem>
        <FormItem label="备注">
          <textarea className="input-base" rows={2} value={itemForm.remark || ""} onChange={(e) => setItem("remark", e.target.value)} placeholder="请输入备注信息（选填，最多200字）" maxLength={200} />
        </FormItem>
      </Modal>

      {/* 分类弹窗 */}
      <Modal
        open={catOpen}
        onClose={() => setCatOpen(false)}
        title={catMode === "add" ? "新增分类" : "编辑分类"}
        width={480}
        footer={
          <>
            <button className="btn-default" onClick={() => setCatOpen(false)}>取消</button>
            <button className="btn-primary" onClick={submitCat}>确定</button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <FormItem label="分类名称" required>
            <input className="input-base" value={catForm.name || ""} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} placeholder="请输入分类名称" />
          </FormItem>
          <FormItem label="分类编码" required>
            <input className="input-base" value={catForm.code || ""} onChange={(e) => setCatForm({ ...catForm, code: e.target.value })} placeholder="请输入分类编码" />
          </FormItem>
        </div>
        <FormItem label="排序号">
          <input type="number" className="input-base" value={catForm.sort ?? 0} onChange={(e) => setCatForm({ ...catForm, sort: e.target.value })} placeholder="请输入排序号，默认0" />
        </FormItem>
        <FormItem label="分类描述">
          <textarea className="input-base" rows={2} value={catForm.description || ""} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })} placeholder="请输入分类描述" />
        </FormItem>
      </Modal>

      {/* 批量导入弹窗 */}
      <Modal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="批量导入字典项"
        width={560}
        footer={
          <>
            <button className="btn-default" onClick={() => setImportOpen(false)}>取消</button>
            <button className="btn-primary" onClick={() => { message.success("导入成功：30条，失败：0条，跳过：0条"); setImportOpen(false); }}>开始导入</button>
          </>
        }
      >
        <div className="text-xs text-admin-muted mb-3 leading-relaxed">
          请下载导入模板，按模板格式填写后上传。导入时系统会自动校验编码唯一性，重复编码将跳过。
        </div>
        <button className="btn-default flex items-center gap-1 mb-3" onClick={() => message.info("模板下载中")}>
          <Download size={14} />下载模板
        </button>
        <div className="border-2 border-dashed border-admin-border rounded-lg p-6 text-center">
          <Upload size={32} className="mx-auto text-admin-muted mb-2" />
          <div className="text-xs text-admin-text mb-1">点击或拖拽文件到此处上传</div>
          <div className="text-[10px] text-admin-muted">支持 .xlsx / .xls 格式，文件大小限制 5MB</div>
        </div>
      </Modal>

      {/* 删除确认 */}
      <ConfirmModal
        open={deleteId !== null}
        content="确认删除该字典项吗？"
        danger
        okText="删除"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

// ===== 右侧详情面板 =====
function DictDetailPanel({ item, category }: { item: DictItem | null; category?: DictCategory }) {
  const [activeTab, setActiveTab] = useState<"basic" | "usage" | "log">("basic");

  if (!item) {
    return (
      <div className="admin-card flex flex-col items-center justify-center" style={{ width: 320, minHeight: 400 }}>
        <Search size={40} className="text-admin-muted opacity-50 mb-3" />
        <span className="text-sm text-admin-muted">请选择字典项查看详情</span>
      </div>
    );
  }

  const basicInfo: { label: string; value: React.ReactNode }[] = [
    { label: "字典编码", value: <span className="font-mono">{item.code}</span> },
    { label: "字典名称", value: item.name },
    { label: "字典值", value: item.value ? <span className="font-mono text-admin-muted">{item.value}</span> : "-" },
    { label: "所属分类", value: category?.name || "-" },
    { label: "排序号", value: item.sort },
    { label: "状态", value: <StatusTag status={item.status} /> },
    { label: "创建时间", value: item.createTime || "-" },
    { label: "更新时间", value: item.updateTime || "-" },
    { label: "备注", value: item.remark || "-" },
  ];

  const usage = usageRecords[item.id] || [];
  const logs = operationLogs[item.id] || [];

  const tabs = [
    { key: "basic", label: "基本信息" },
    { key: "usage", label: "使用情况" },
    { key: "log", label: "操作日志" },
  ] as const;

  return (
    <div className="admin-card flex flex-col flex-shrink-0" style={{ width: 320 }}>
      {/* 顶部标题 */}
      <div className="px-4 py-3 border-b border-admin-border">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold text-admin-text truncate">{item.name}</h3>
          <StatusTag status={item.status} />
        </div>
        <span className="text-xs text-admin-muted font-mono">{item.code}</span>
      </div>

      {/* Tab栏 */}
      <div className="flex border-b border-admin-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 text-xs transition-colors relative ${
              activeTab === tab.key ? "text-admin-primary font-medium" : "text-admin-muted hover:text-admin-text"
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-admin-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Tab内容 */}
      <div className="flex-1 overflow-auto p-4" style={{ maxHeight: "calc(100vh - 520px)" }}>
        {activeTab === "basic" && (
          <div className="space-y-3">
            {basicInfo.map((it) => (
              <div key={it.label} className="flex items-start gap-2">
                <span className="text-xs text-admin-muted w-20 flex-shrink-0">{it.label}：</span>
                <span className="text-xs text-admin-text flex-1 break-all">{it.value}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "usage" && (
          <div>
            {usage.length === 0 ? (
              <div className="text-center py-8 text-xs text-admin-muted border border-dashed border-admin-border rounded">该字典项暂未被引用</div>
            ) : (
              <div className="space-y-3">
                {usage.map((u, i) => (
                  <div key={i} className="border border-admin-border rounded p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-admin-text">{u.module}</span>
                      <TagComp color="blue">{u.count}条数据</TagComp>
                    </div>
                    <div className="text-[10px] text-admin-muted">最后使用：{u.lastUse}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "log" && (
          <div className="space-y-3">
            {logs.length === 0 ? (
              <div className="text-center py-8 text-xs text-admin-muted border border-dashed border-admin-border rounded">暂无操作记录</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="flex gap-2">
                  <div className="flex flex-col items-center">
                    <div className={`w-2 h-2 rounded-full ${i === logs.length - 1 ? "bg-gray-300" : "bg-admin-primary"}`} />
                    {i < logs.length - 1 && <div className="w-0.5 flex-1 bg-admin-border" style={{ minHeight: 30 }} />}
                  </div>
                  <div className="flex-1 pb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <TagComp color={opColorMap[log.type] || "gray"}>{log.type}</TagComp>
                      <span className="text-[10px] text-admin-muted">{log.operator}</span>
                      <span className="text-[10px] text-admin-muted">{log.time}</span>
                    </div>
                    <div className="text-xs text-admin-text">{log.content}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
