// 用户与权限相关类型
export type UserRole = "admin" | "operator" | "viewer";

export interface User {
  id: number;
  username: string;
  password: string;
  realName: string;
  orgId: number;
  roleIds: number[];
  phone?: string;
  email?: string;
  status: "enabled" | "disabled";
  lastLoginTime?: string;
  position?: string;
  createTime?: string;
  loginIp?: string;
  manageScope?: string;
}

export interface Role {
  id: number;
  name: string;
  code: string;
  description?: string;
  isBuiltin: boolean;
  status: "enabled" | "disabled";
  createTime: string;
  permissions?: string[];
  dataScope?: "all" | "department" | "self";
}

export interface Organization {
  id: number;
  name: string;
  code: string;
  parentId: number | null;
  sort: number;
  status: "enabled" | "disabled";
  remark?: string;
  children?: Organization[];
}

// 设备相关类型
export interface Equipment {
  id: number;
  code: string;
  name: string;
  type: string;
  system: string;
  major: string;
  location: string;
  model?: string;
  manufacturer?: string;
  commissionDate?: string;
  remark?: string;
  status: "running" | "stopped" | "maintenance" | "fault";
  codeStatus: "linked" | "unlinked";
  attributes?: EquipmentAttribute[];
  documents?: DocumentItem[];
}

export interface EquipmentAttribute {
  id: number;
  equipmentId: number;
  name: string;
  value: string;
  type: "text" | "number" | "date" | "select";
  unit?: string;
  remark?: string;
  category?: string; // 属性分类（设备信息/特性参数）
}

// 属性模板相关类型
export interface AttrTemplateItem {
  name: string;
  enName: string;
  type: string;
  unit?: string;
  defaultValue?: string;
  pickList?: string;
}

export interface AttrTemplateCategory {
  name: string;
  attrs: AttrTemplateItem[];
}

export interface AttrTemplateGroup {
  className: string;
  categories: AttrTemplateCategory[];
}

export type EquipmentAttrTemplates = Record<string, AttrTemplateGroup>;

// 管路相关类型
export interface Pipeline {
  id: number;
  code: string;
  name: string;
  position: string;
  system: string;
  usage: string;
  dn?: string;
  material?: string;
  length?: number;
  wallThickness?: number;
  designPressure?: number;
  designTemperature?: number;
  medium?: string;
  installDate?: string;
  codeStatus: "linked" | "unlinked";
  status?: "running" | "standby" | "maintenance" | "stopped";
  startDevice?: string;
  endDevice?: string;
  remark?: string;
  components?: PipeComponent[];
  documents?: DocumentItem[];
}

export interface PipeComponent {
  id: number;
  pipelineId: number;
  code: string;
  name: string;
  type: string;
  spec?: string;
  material?: string;
  quantity?: number;
  designPressure?: number;
  designTemperature?: number;
  medium?: string;
  wallThickness?: number;
  antiCorrosion?: string;
  documents?: DocumentItem[];
  linkedEquipments?: Equipment[];
}

export interface Valve {
  id: number;
  code: string;
  name: string;
  type: string;
  dn?: number;
  pn?: number;
  material?: string;
  driveMode?: string;
  connectionType?: string;
  sealType?: string;
  location: string;
  system: string;
  commissionDate?: string;
  status?: "running" | "standby" | "maintenance" | "stopped";
  manufacturer?: string;
  remark?: string;
  pipelineCode?: string;
  documents?: DocumentItem[];
}

// 编码相关类型
export interface Code {
  id: number;
  code: string;
  name: string;
  type: "equipment" | "pipeline";
  system: string;
  isLinked: boolean;
  createTime: string;
  remark?: string;
}

// 图纸相关类型
export interface Drawing {
  id: number;
  code: string;
  name: string;
  version: string;
  major: string;
  category: string;
  position: string;
  fileFormat: string;
  fileSize: string;
  uploadUser: string;
  uploadTime: string;
  directoryId?: number;
  remark?: string;
  versions?: DrawingVersion[];
}

export interface DrawingVersion {
  id: number;
  drawingId: number;
  version: string;
  uploadTime: string;
  uploadUser: string;
  fileSize: string;
  fileFormat?: string;
  remark?: string;
}

// 资料相关类型
export interface DocumentItem {
  id: number;
  name: string;
  category: string;
  fileType: string;
  fileSize: string;
  linkedType?: "equipment" | "pipeline" | "valve" | "component";
  linkedId?: number;
  linkedName?: string;
  uploadUser: string;
  uploadTime: string;
  remark?: string;
  version?: string;
  versions?: DocumentVersion[];
  // 资料管理四件套
  archiveNo?: string;          // 档号/归档编号
  secretLevel?: "public" | "internal" | "secret" | "classified" | "topsecret"; // 密级
  retention?: "permanent" | "long" | "short10" | "short5" | "short30"; // 保管期限
  carrier?: "electronic" | "paper" | "both"; // 载体类型
  // 档号章补充字段
  archiveDate?: string;       // 归档日期
  archivist?: string;         // 归档人
  filingUnit?: string;        // 立卷单位
  filingUser?: string;        // 立卷人
  filingDate?: string;        // 立卷日期
  // 使用情况
  viewCount?: number;         // 浏览次数
  downloadCount?: number;     // 下载次数
  borrowCount?: number;       // 借阅次数（含电子查阅登记）
}

export interface DocumentVersion {
  id: number;
  documentId: number;
  version: string;
  uploadTime: string;
  uploadUser: string;
  fileSize: string;
  remark?: string;
}

// 日志相关类型
export interface OperationLog {
  id: number;
  logNo?: string;
  traceId?: string;
  user: string;
  type: string;
  description: string;
  module: string;
  ip: string;
  time: string;
  duration: number;
  status: "success" | "failed";
  requestMethod?: string;
  requestUrl?: string;
  client?: string;
  params?: string;
  result?: string;
  error?: string;
}

// 树节点类型
export interface TreeNode {
  key: string;
  title: string;
  code?: string;
  type?: string;
  icon?: string;
  children?: TreeNode[];
  data?: any;
}

// 告警相关类型
export interface Alarm {
  id: number;
  time: string;
  equipmentName: string;
  type: string;
  level: "serious" | "normal" | "info";
  description: string;
}

// 漫游路径相关类型
export interface RoamingPath {
  id: number;
  name: string;
  type: "default" | "custom";
  createTime: string;
  duration: number;
  description?: string;
}

// 字典相关类型
export interface DictCategory {
  id: number;
  name: string;
  code: string;
  description?: string;
  sort?: number;
}

export interface DictItem {
  id: number;
  categoryId: number;
  code: string;
  name: string;
  value?: string;
  sort: number;
  status: "enabled" | "disabled";
  createTime?: string;
  updateTime?: string;
  remark?: string;
}
