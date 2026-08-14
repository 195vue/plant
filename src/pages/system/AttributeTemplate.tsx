import { useMemo, useState } from "react";
import {
  Copy,
  Edit3,
  FilePlus2,
  Layers3,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Modal, ConfirmModal } from "@/components/common/Modal";
import { Tag } from "@/components/common/Tag";
import { message } from "@/components/common/Message";
import {
  ATTRIBUTE_FIELD_CATEGORIES,
  type AttributeTemplateDefinition,
  type AttributeTemplateField,
  type AttributeTemplateScope,
  useAttributeTemplates,
} from "@/lib/attributeTemplateStore";
import { DevNote } from "@/components/devNotes/DevNote";

const createField = (index: number): AttributeTemplateField => ({
  id: `field-${Date.now()}-${index}`,
  name: "",
  unit: "",
  category: "基础信息",
});

export default function AttributeTemplateManage() {
  const { templates, setTemplates } = useAttributeTemplates();
  const [scope, setScope] = useState<"all" | AttributeTemplateScope>("all");
  const [keyword, setKeyword] = useState("");
  const [editing, setEditing] = useState<AttributeTemplateDefinition | null>(
    null,
  );
  const [previewing, setPreviewing] =
    useState<AttributeTemplateDefinition | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<AttributeTemplateDefinition | null>(null);

  const filteredTemplates = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return templates.filter((template) => {
      if (scope !== "all" && template.scope !== scope) return false;
      return (
        !normalizedKeyword ||
        `${template.name} ${template.matchKey} ${template.fields
          .map((field) => field.name)
          .join(" ")}`
          .toLowerCase()
          .includes(normalizedKeyword)
      );
    });
  }, [keyword, scope, templates]);

  const openCreate = () => {
    const defaultScope = scope === "all" ? "equipment" : scope;
    setEditing({
      id: `${defaultScope}-${Date.now()}`,
      scope: defaultScope,
      name: "",
      matchKey: "",
      fields: [createField(0)],
    });
  };

  const saveTemplate = () => {
    if (!editing) return;
    if (!editing.name.trim() || !editing.matchKey.trim()) {
      message.warning("请填写模板名称和自动匹配类型");
      return;
    }
    if (
      editing.fields.length === 0 ||
      editing.fields.some((field) => !field.name.trim())
    ) {
      message.warning("模板至少包含一项有效属性");
      return;
    }
    const fieldNames = editing.fields.map((field) => field.name.trim());
    if (new Set(fieldNames).size !== fieldNames.length) {
      message.warning("同一模板中的属性名称不能重复");
      return;
    }
    const duplicated = templates.some(
      (template) =>
        template.id !== editing.id &&
        template.scope === editing.scope &&
        template.matchKey.trim() === editing.matchKey.trim(),
    );
    if (duplicated) {
      message.warning("同一对象类型下的自动匹配类型不能重复");
      return;
    }

    const exists = templates.some((template) => template.id === editing.id);
    setTemplates(
      exists
        ? templates.map((template) =>
            template.id === editing.id ? editing : template,
          )
        : [...templates, editing],
    );
    setEditing(null);
    message.success("属性模板已保存");
  };

  const copyTemplate = (template: AttributeTemplateDefinition) => {
    const copy: AttributeTemplateDefinition = {
      ...template,
      id: `${template.scope}-${Date.now()}`,
      name: `${template.name}副本`,
      matchKey: `${template.matchKey}副本`,
      fields: template.fields.map((field, index) => ({
        ...field,
        id: `field-${Date.now()}-${index}`,
      })),
    };
    setTemplates([...templates, copy]);
    message.success(`已复制“${template.name}”`);
  };

  const updateField = (
    index: number,
    patch: Partial<AttributeTemplateField>,
  ) => {
    if (!editing) return;
    setEditing({
      ...editing,
      fields: editing.fields.map((field, fieldIndex) =>
        fieldIndex === index ? { ...field, ...patch } : field,
      ),
    });
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <DevNote
        id="attrtpl-header"
        title="属性模板库-页头与新增"
        summary="统一维护设备/管路标准属性模板"
        items={[
          { label: "数据来源", value: "templates（useAttributeTemplates，本地store）；业务页面按对象类型自动匹配模板（resolveAttributeTemplate）" },
          { label: "交互逻辑", value: "新增模板 → 打开模板编辑弹窗" },
          { label: "权限", value: "管理员/操作人员可维护；浏览人员仅查看" },
        ]}
        wrapClassName="block flex-shrink-0"
      >
      <div className="admin-card flex flex-shrink-0 items-center justify-between px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <Layers3 size={18} className="text-admin-primary" />
            <h1 className="text-base font-semibold text-admin-text">
              属性模板库
            </h1>
          </div>
          <p className="mt-1 text-xs text-admin-muted">
            统一维护设备、管路标准属性；业务页面按对象类型自动匹配模板。
          </p>
        </div>
        <button
          className="btn-primary flex items-center gap-1.5"
          onClick={openCreate}
        >
          <FilePlus2 size={14} />
          新增模板
        </button>
      </div>
      </DevNote>

      <DevNote
        id="attrtpl-filter"
        title="属性模板库-筛选区"
        summary="按对象类型/关键字过滤模板列表"
        items={[
          { label: "交互逻辑", value: "三个Tab：全部/设备模板/管路模板（scope）；搜索框按 模板名称/匹配类型/属性名称 过滤；右侧显示模板总数" },
          { label: "数据来源", value: "filteredTemplates（useMemo 按 scope+keyword 过滤 templates）" },
          { label: "权限", value: "管理员/操作人员" },
        ]}
        wrapClassName="block flex-shrink-0"
      >
      <div className="admin-card flex flex-shrink-0 items-center gap-2 p-3">
        <div className="flex rounded border border-admin-border p-0.5">
          {[
            { key: "all" as const, label: "全部模板" },
            { key: "equipment" as const, label: "设备模板" },
            { key: "pipeline" as const, label: "管路模板" },
          ].map((item) => (
            <button
              key={item.key}
              className={`rounded px-3 py-1.5 text-xs ${
                scope === item.key
                  ? "bg-admin-primary text-white"
                  : "text-admin-muted hover:bg-gray-50"
              }`}
              onClick={() => setScope(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="relative w-72">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-admin-muted"
          />
          <input
            className="input-base w-full pl-8"
            placeholder="搜索模板名称、匹配类型或属性"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>
        <span className="ml-auto text-xs text-admin-muted">
          共 {filteredTemplates.length} 个模板
        </span>
      </div>
      </DevNote>

      <DevNote
        id="attrtpl-grid"
        title="属性模板库-模板卡片"
        summary="卡片展示模板名称/类型/匹配项与属性列表，行内编辑/复制/删除"
        items={[
          { label: "卡片内容", value: "模板名称 + 类型Tag（设备/管路）+ 自动匹配类型（matchKey）+ 属性数；属性列表展示前6项（名称/单位），多于6项显示“更多属性（N项）”打开预览弹窗" },
          { label: "交互逻辑", value: "编辑模板 → 弹窗维护模板字段；复制 → 生成副本模板；删除 → 确认框（删除后引用该模板的对象将匹配失败并提示维护）" },
          { label: "数据来源", value: "templates（useAttributeTemplates）；字段分类含 基础信息/技术参数（ATTRIBUTE_FIELD_CATEGORIES）" },
          { label: "权限", value: "管理员/操作人员可编辑复制删除；浏览人员仅查看" },
        ]}
        wrapClassName="block flex flex-1"
      >
      <div className="admin-card min-h-0 flex-1 overflow-auto p-3">
        {filteredTemplates.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-admin-muted">
            <Layers3 size={42} className="mb-2 text-gray-300" />
            <div className="text-sm">暂无匹配模板</div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="rounded-lg border border-admin-border bg-white p-3 transition-shadow hover:shadow-md"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-admin-text">
                      {template.name}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Tag
                        color={
                          template.scope === "equipment" ? "blue" : "cyan"
                        }
                      >
                        {template.scope === "equipment"
                          ? "设备模板"
                          : "管路模板"}
                      </Tag>
                      <span className="text-[10px] text-admin-muted">
                        自动匹配：{template.matchKey}
                      </span>
                    </div>
                  </div>
                  <span className="whitespace-nowrap text-xs text-admin-muted">
                    {template.fields.length}项
                  </span>
                </div>

                <div className="overflow-hidden rounded border border-admin-border">
                  <div className="grid grid-cols-[1fr_70px] bg-gray-50 px-2 py-1 text-[10px] text-admin-muted">
                    <span>属性名称</span>
                    <span>单位</span>
                  </div>
                  {template.fields.slice(0, 6).map((field) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-[1fr_70px] border-t border-admin-border px-2 py-1.5 text-xs"
                    >
                      <span className="truncate text-admin-text">
                        {field.name}
                      </span>
                      <span className="truncate text-admin-muted">
                        {field.unit || "—"}
                      </span>
                    </div>
                  ))}
                </div>

                {template.fields.length > 6 && (
                  <button
                    className="mt-1 text-xs text-admin-primary hover:underline"
                    onClick={() => setPreviewing(template)}
                  >
                    更多属性（{template.fields.length - 6}项）
                  </button>
                )}

                <div className="mt-3 flex items-center gap-3 border-t border-admin-border pt-2 text-xs">
                  <button
                    className="flex items-center gap-1 text-admin-primary hover:underline"
                    onClick={() =>
                      setEditing({
                        ...template,
                        fields: template.fields.map((field) => ({ ...field })),
                      })
                    }
                  >
                    <Edit3 size={12} />
                    编辑模板
                  </button>
                  <button
                    className="flex items-center gap-1 text-admin-primary hover:underline"
                    onClick={() => copyTemplate(template)}
                  >
                    <Copy size={12} />
                    复制
                  </button>
                  <button
                    className="ml-auto flex items-center gap-1 text-admin-danger hover:underline"
                    onClick={() => setDeleteTarget(template)}
                  >
                    <Trash2 size={12} />
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </DevNote>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.name ? `编辑“${editing.name}”` : "新增属性模板"}
        width={760}
        footer={
          <>
            <button className="btn-default" onClick={() => setEditing(null)}>
              取消
            </button>
            <button className="btn-primary" onClick={saveTemplate}>
              保存模板
            </button>
          </>
        }
      >
        {editing && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <label className="text-xs text-admin-muted">
                模板类型
                <select
                  className="input-base mt-1 w-full"
                  value={editing.scope}
                  onChange={(event) =>
                    setEditing({
                      ...editing,
                      scope: event.target.value as AttributeTemplateScope,
                    })
                  }
                >
                  <option value="equipment">设备模板</option>
                  <option value="pipeline">管路模板</option>
                </select>
              </label>
              <label className="text-xs text-admin-muted">
                模板名称
                <input
                  className="input-base mt-1 w-full"
                  value={editing.name}
                  onChange={(event) =>
                    setEditing({ ...editing, name: event.target.value })
                  }
                />
              </label>
              <label className="text-xs text-admin-muted">
                自动匹配类型
                <input
                  className="input-base mt-1 w-full"
                  value={editing.matchKey}
                  onChange={(event) =>
                    setEditing({ ...editing, matchKey: event.target.value })
                  }
                />
              </label>
            </div>

            <div className="overflow-hidden rounded border border-admin-border">
              <div className="flex items-center justify-between bg-gray-50 px-3 py-2">
                <span className="text-xs font-medium text-admin-text">
                  模板属性项
                </span>
                <button
                  className="btn-primary flex items-center gap-1 text-xs"
                  onClick={() =>
                    setEditing({
                      ...editing,
                      fields: [
                        ...editing.fields,
                        createField(editing.fields.length),
                      ],
                    })
                  }
                >
                  <Plus size={12} />
                  新增属性
                </button>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-t border-admin-border bg-gray-50/60 text-admin-muted">
                    <th className="px-2 py-2 text-left font-medium">属性名称</th>
                    <th className="w-32 px-2 py-2 text-left font-medium">分类</th>
                    <th className="w-24 px-2 py-2 text-left font-medium">单位</th>
                    <th className="w-16 px-2 py-2 text-center font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {editing.fields.map((field, index) => (
                    <tr
                      key={field.id}
                      className="border-t border-admin-border"
                    >
                      <td className="px-2 py-1.5">
                        <input
                          className="input-base w-full"
                          value={field.name}
                          onChange={(event) =>
                            updateField(index, { name: event.target.value })
                          }
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <select
                          className="input-base w-full"
                          value={field.category}
                          onChange={(event) =>
                            updateField(index, { category: event.target.value })
                          }
                        >
                          {ATTRIBUTE_FIELD_CATEGORIES.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          className="input-base w-full"
                          value={field.unit}
                          onChange={(event) =>
                            updateField(index, { unit: event.target.value })
                          }
                        />
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <button
                          className="text-admin-danger"
                          title="删除属性"
                          onClick={() =>
                            setEditing({
                              ...editing,
                              fields: editing.fields.filter(
                                (_, fieldIndex) => fieldIndex !== index,
                              ),
                            })
                          }
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(previewing)}
        onClose={() => setPreviewing(null)}
        title={previewing ? `${previewing.name}全部属性` : "模板属性"}
        width={560}
        footer={
          <button className="btn-default" onClick={() => setPreviewing(null)}>
            关闭
          </button>
        }
      >
        <div className="max-h-[440px] overflow-auto rounded border border-admin-border">
          {previewing?.fields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-[40px_1fr_120px_80px] border-b border-admin-border px-3 py-2 text-xs last:border-0"
            >
              <span className="text-admin-muted">{index + 1}</span>
              <span className="text-admin-text">{field.name}</span>
              <span className="text-admin-muted">{field.category}</span>
              <span className="text-admin-muted">{field.unit || "—"}</span>
            </div>
          ))}
        </div>
      </Modal>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        content={`确定删除“${deleteTarget?.name || ""}”模板吗？删除后对应对象将无法自动导入该模板。`}
        okText="删除"
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          setTemplates(
            templates.filter((template) => template.id !== deleteTarget.id),
          );
          setDeleteTarget(null);
          message.success("模板已删除");
        }}
      />
    </div>
  );
}
