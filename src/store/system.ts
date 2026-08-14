import { create } from "zustand";

export type EnableStatus = "enabled" | "disabled";

export interface Department {
  id: number;
  parentId: number | null;
  name: string;
  sort: number;
  leader: string;
  phone: string;
  email: string;
  status: EnableStatus;
  createdAt: string;
}

export interface Position {
  id: number;
  code: string;
  name: string;
  sort: number;
  status: EnableStatus;
  remark: string;
  createdAt: string;
}

export interface SystemUser {
  id: number;
  username: string;
  nickname: string;
  departmentId: number;
  phone: string;
  email: string;
  gender: "male" | "female";
  positionIds: number[];
  roleIds: number[];
  status: EnableStatus;
  remark: string;
  createdAt: string;
}

export type DataScope =
  | "all"
  | "custom"
  | "department"
  | "departmentBelow"
  | "self";

export interface SystemRole {
  id: number;
  name: string;
  code: string;
  roleType: "builtin" | "custom";
  sort: number;
  remark: string;
  status: EnableStatus;
  createdAt: string;
  menuIds: number[];
  dataScope: DataScope;
  departmentIds: number[];
}

export type MenuType = "directory" | "menu" | "button";

export interface SystemMenu {
  id: number;
  parentId: number | null;
  name: string;
  type: MenuType;
  icon: string;
  path: string;
  component: string;
  componentName?: string;
  permission: string;
  sort: number;
  visible: boolean;
  alwaysShow?: boolean;
  cache?: boolean;
  status: EnableStatus;
  createdAt: string;
}

export interface DictionaryType {
  id: number;
  name: string;
  type: string;
  status: EnableStatus;
  remark: string;
  createdAt: string;
}

export interface DictionaryItem {
  id: number;
  dictType: string;
  label: string;
  value: string;
  sort: number;
  status: EnableStatus;
  colorType: string;
  cssClass: string;
  remark: string;
  createdAt: string;
}

export interface OperationAuditLog {
  id: number;
  operatorId: number;
  operator: string;
  ip: string;
  userAgent: string;
  module: string;
  action: string;
  content: string;
  requestUrl: string;
  operatedAt: string;
  businessNo: string;
}

export interface LoginAuditLog {
  id: number;
  operationType: "登录" | "退出";
  username: string;
  address: string;
  browser: string;
  result: "success" | "failed";
  loginAt: string;
}

const initialDepartments: Department[] = [
  {
    id: 1,
    parentId: null,
    name: "乌江渡发电厂",
    sort: 1,
    leader: "陈主任",
    phone: "0851-87650001",
    email: "wjdfdc@wjd.com",
    status: "enabled",
    createdAt: "2026-01-02 09:00:00",
  },
  {
    id: 2,
    parentId: 1,
    name: "运行部",
    sort: 1,
    leader: "周值长",
    phone: "0851-87650101",
    email: "yunxing@wjd.com",
    status: "enabled",
    createdAt: "2026-01-02 09:10:00",
  },
  {
    id: 3,
    parentId: 2,
    name: "运行一值",
    sort: 1,
    leader: "张三",
    phone: "0851-87650111",
    email: "yx01@wjd.com",
    status: "enabled",
    createdAt: "2026-01-03 08:30:00",
  },
  {
    id: 4,
    parentId: 2,
    name: "运行二值",
    sort: 2,
    leader: "李四",
    phone: "0851-87650112",
    email: "yx02@wjd.com",
    status: "enabled",
    createdAt: "2026-01-03 08:35:00",
  },
  {
    id: 5,
    parentId: 1,
    name: "检修部",
    sort: 2,
    leader: "王工",
    phone: "0851-87650201",
    email: "jianxiu@wjd.com",
    status: "enabled",
    createdAt: "2026-01-02 09:20:00",
  },
  {
    id: 6,
    parentId: 5,
    name: "机械班",
    sort: 1,
    leader: "赵工",
    phone: "0851-87650211",
    email: "jixie@wjd.com",
    status: "enabled",
    createdAt: "2026-01-03 08:40:00",
  },
  {
    id: 7,
    parentId: 5,
    name: "电气班",
    sort: 2,
    leader: "刘工",
    phone: "0851-87650212",
    email: "dianqi@wjd.com",
    status: "enabled",
    createdAt: "2026-01-03 08:45:00",
  },
  {
    id: 8,
    parentId: 1,
    name: "安生部",
    sort: 3,
    leader: "何主任",
    phone: "0851-87650301",
    email: "ansheng@wjd.com",
    status: "enabled",
    createdAt: "2026-01-02 09:30:00",
  },
];

const initialPositions: Position[] = [
  { id: 1, code: "SYSTEM_ADMIN", name: "系统管理员", sort: 1, status: "enabled", remark: "负责平台系统配置与日常维护", createdAt: "2026-01-02 09:00:00" },
  { id: 2, code: "RUN_DUTY_LEADER", name: "运行值长", sort: 2, status: "enabled", remark: "负责运行值班管理", createdAt: "2026-01-02 09:10:00" },
  { id: 3, code: "RUN_OPERATOR", name: "运行人员", sort: 3, status: "enabled", remark: "负责设备运行操作与信息维护", createdAt: "2026-01-02 09:20:00" },
  { id: 4, code: "MAINTAINER", name: "检修人员", sort: 4, status: "enabled", remark: "负责设备和管路检修", createdAt: "2026-01-02 09:30:00" },
  { id: 5, code: "SAFETY_MANAGER", name: "安全管理人员", sort: 5, status: "enabled", remark: "负责安全生产信息管理", createdAt: "2026-01-02 09:40:00" },
  { id: 6, code: "VIEWER", name: "浏览人员", sort: 6, status: "enabled", remark: "仅查看工程总览", createdAt: "2026-01-02 09:50:00" },
];

const initialMenus: SystemMenu[] = [
  { id: 1, parentId: null, name: "工程总览", type: "menu", icon: "Monitor", path: "/screen", component: "screen/Screen", permission: "screen:view", sort: 1, visible: true, status: "enabled", createdAt: "2026-01-02 09:00:00" },
  { id: 2, parentId: null, name: "工作台", type: "menu", icon: "LayoutDashboard", path: "/admin/dashboard", component: "dashboard/index", permission: "dashboard:view", sort: 2, visible: true, status: "enabled", createdAt: "2026-01-02 09:00:00" },
  { id: 3, parentId: null, name: "机电数字化", type: "directory", icon: "Cpu", path: "/admin/equipment", component: "", permission: "digital:view", sort: 3, visible: true, status: "enabled", createdAt: "2026-01-02 09:00:00" },
  { id: 4, parentId: 3, name: "设备数字化", type: "menu", icon: "Box", path: "/admin/equipment", component: "equipment/List", permission: "equipment:view", sort: 1, visible: true, status: "enabled", createdAt: "2026-01-02 09:00:00" },
  { id: 5, parentId: 3, name: "管道数字化", type: "menu", icon: "GitBranch", path: "/admin/pipeline/category", component: "pipeline/Category", permission: "pipeline:view", sort: 2, visible: true, status: "enabled", createdAt: "2026-01-02 09:00:00" },
  { id: 6, parentId: 3, name: "结构树管理", type: "menu", icon: "Network", path: "/admin/system/structure-tree", component: "system/StructureTree", permission: "structure-tree:view", sort: 3, visible: true, status: "enabled", createdAt: "2026-01-02 09:00:00" },
  { id: 7, parentId: 3, name: "属性管理", type: "menu", icon: "Settings", path: "/admin/attribute", component: "AttributeManage", permission: "attribute:view", sort: 4, visible: true, status: "enabled", createdAt: "2026-01-02 09:00:00" },
  { id: 8, parentId: null, name: "图纸管理", type: "menu", icon: "FileText", path: "/admin/drawing", component: "drawing/List", permission: "drawing:view", sort: 4, visible: true, status: "enabled", createdAt: "2026-01-02 09:00:00" },
  { id: 9, parentId: null, name: "系统配置", type: "directory", icon: "Settings", path: "/admin/system/department", component: "", permission: "system:view", sort: 5, visible: true, status: "enabled", createdAt: "2026-01-02 09:00:00" },
  { id: 10, parentId: 9, name: "部门管理", type: "menu", icon: "Building2", path: "/admin/system/department", component: "system/Org", permission: "system:department:view", sort: 1, visible: true, status: "enabled", createdAt: "2026-01-02 09:00:00" },
  { id: 11, parentId: 9, name: "岗位管理", type: "menu", icon: "BriefcaseBusiness", path: "/admin/system/position", component: "system/Position", permission: "system:position:view", sort: 2, visible: true, status: "enabled", createdAt: "2026-01-02 09:00:00" },
  { id: 12, parentId: 9, name: "用户管理", type: "menu", icon: "User", path: "/admin/system/user", component: "system/User", permission: "system:user:view", sort: 3, visible: true, status: "enabled", createdAt: "2026-01-02 09:00:00" },
  { id: 13, parentId: 9, name: "角色管理", type: "menu", icon: "ShieldCheck", path: "/admin/system/role", component: "system/Role", permission: "system:role:view", sort: 4, visible: true, status: "enabled", createdAt: "2026-01-02 09:00:00" },
  { id: 14, parentId: 9, name: "数据字典", type: "menu", icon: "BookOpen", path: "/admin/system/dict", component: "system/Dict", permission: "system:dict:view", sort: 5, visible: true, status: "enabled", createdAt: "2026-01-02 09:00:00" },
  { id: 15, parentId: 9, name: "属性模板库", type: "menu", icon: "Layers3", path: "/admin/system/attribute-template", component: "system/AttributeTemplate", permission: "system:attribute-template:view", sort: 6, visible: true, status: "enabled", createdAt: "2026-01-02 09:00:00" },
  { id: 16, parentId: 9, name: "日志查询", type: "directory", icon: "FileSearch", path: "/admin/system/log/operation", component: "", permission: "system:log:view", sort: 7, visible: true, status: "enabled", createdAt: "2026-01-02 09:00:00" },
  { id: 17, parentId: 16, name: "操作日志", type: "menu", icon: "ClipboardList", path: "/admin/system/log/operation", component: "system/OperationLog", permission: "system:log:operation:view", sort: 1, visible: true, status: "enabled", createdAt: "2026-01-02 09:00:00" },
  { id: 18, parentId: 16, name: "登录日志", type: "menu", icon: "LogIn", path: "/admin/system/log/login", component: "system/LoginLog", permission: "system:log:login:view", sort: 2, visible: true, status: "enabled", createdAt: "2026-01-02 09:00:00" },
  { id: 19, parentId: 9, name: "菜单管理", type: "menu", icon: "Menu", path: "/admin/system/menu", component: "system/Menu", permission: "system:menu:view", sort: 8, visible: true, status: "enabled", createdAt: "2026-01-02 09:00:00" },
];

const adminMenuIds = initialMenus.map((menu) => menu.id);
const operatorMenuIds = [1, 2, 3, 4, 5, 6, 7, 8];

const initialRoles: SystemRole[] = [
  { id: 1, name: "管理员", code: "ROLE_ADMIN", roleType: "builtin", sort: 1, remark: "拥有平台全部管理权限", status: "enabled", createdAt: "2026-01-02 09:00:00", menuIds: adminMenuIds, dataScope: "all", departmentIds: [] },
  { id: 2, name: "操作人员", code: "ROLE_OPERATOR", roleType: "builtin", sort: 2, remark: "负责业务数据维护和日常操作", status: "enabled", createdAt: "2026-01-02 09:10:00", menuIds: operatorMenuIds, dataScope: "departmentBelow", departmentIds: [] },
  { id: 3, name: "浏览人员", code: "ROLE_VIEWER", roleType: "builtin", sort: 3, remark: "仅可查看工程总览，不进入后台管理系统", status: "enabled", createdAt: "2026-01-02 09:20:00", menuIds: [1], dataScope: "self", departmentIds: [] },
];

const initialUsers: SystemUser[] = [
  { id: 1, username: "admin", nickname: "系统管理员", departmentId: 1, phone: "13800000001", email: "admin@wjd.com", gender: "male", positionIds: [1], roleIds: [1], status: "enabled", remark: "平台系统管理员", createdAt: "2026-01-02 09:00:00" },
  { id: 2, username: "operator", nickname: "张操作", departmentId: 3, phone: "13800000002", email: "operator@wjd.com", gender: "male", positionIds: [3], roleIds: [2], status: "enabled", remark: "运行操作人员", createdAt: "2026-01-06 10:12:00" },
  { id: 3, username: "zhangsan", nickname: "张三", departmentId: 3, phone: "13800000003", email: "zhangsan@wjd.com", gender: "male", positionIds: [2], roleIds: [2], status: "enabled", remark: "运行一值值长", createdAt: "2026-01-08 14:20:00" },
  { id: 4, username: "lisi", nickname: "李四", departmentId: 4, phone: "13800000004", email: "lisi@wjd.com", gender: "male", positionIds: [3], roleIds: [2], status: "enabled", remark: "运行二值操作人员", createdAt: "2026-01-10 09:35:00" },
  { id: 5, username: "viewer", nickname: "李浏览", departmentId: 8, phone: "13800000005", email: "viewer@wjd.com", gender: "female", positionIds: [6], roleIds: [3], status: "enabled", remark: "工程总览浏览人员", createdAt: "2026-01-12 16:10:00" },
  { id: 6, username: "maintainer", nickname: "赵工", departmentId: 6, phone: "13800000006", email: "zhaogong@wjd.com", gender: "male", positionIds: [4], roleIds: [2], status: "enabled", remark: "机械检修人员", createdAt: "2026-01-15 11:25:00" },
];

const initialDictionaryTypes: DictionaryType[] = [
  { id: 1, name: "设备运行状态", type: "equipment_run_status", status: "enabled", remark: "设备运行状态分类", createdAt: "2026-01-02 09:00:00" },
  { id: 2, name: "管路运行状态", type: "pipeline_run_status", status: "enabled", remark: "管路运行状态分类", createdAt: "2026-01-02 09:05:00" },
  { id: 3, name: "资料分类", type: "document_category", status: "enabled", remark: "图纸及资料分类", createdAt: "2026-01-02 09:10:00" },
  { id: 4, name: "所属专业", type: "discipline_type", status: "enabled", remark: "资料所属专业", createdAt: "2026-01-02 09:15:00" },
  { id: 5, name: "模型挂接状态", type: "model_link_status", status: "enabled", remark: "资料与模型的挂接状态", createdAt: "2026-01-02 09:20:00" },
  { id: 6, name: "属性分类", type: "attribute_category", status: "enabled", remark: "设备及管路属性分类", createdAt: "2026-01-02 09:25:00" },
  { id: 7, name: "日志操作类型", type: "log_operation_type", status: "enabled", remark: "系统操作日志分类", createdAt: "2026-01-02 09:30:00" },
];

const dictionaryItem = (
  id: number,
  dictType: string,
  label: string,
  value: string,
  sort: number,
  colorType: string,
  remark = ""
): DictionaryItem => ({
  id,
  dictType,
  label,
  value,
  sort,
  status: "enabled",
  colorType,
  cssClass: "",
  remark,
  createdAt: "2026-01-02 10:00:00",
});

const initialDictionaryItems: DictionaryItem[] = [
  dictionaryItem(1, "equipment_run_status", "运行", "running", 1, "success"),
  dictionaryItem(2, "equipment_run_status", "停止", "stopped", 2, "info"),
  dictionaryItem(3, "equipment_run_status", "故障", "fault", 3, "danger"),
  dictionaryItem(4, "equipment_run_status", "检修", "maintenance", 4, "warning"),
  dictionaryItem(5, "pipeline_run_status", "运行", "running", 1, "success"),
  dictionaryItem(6, "pipeline_run_status", "备用", "standby", 2, "primary"),
  dictionaryItem(7, "pipeline_run_status", "停止", "stopped", 3, "info"),
  dictionaryItem(8, "pipeline_run_status", "检修", "maintenance", 4, "warning"),
  dictionaryItem(9, "document_category", "设备图纸", "equipment_drawing", 1, "primary"),
  dictionaryItem(10, "document_category", "管路图纸", "pipeline_drawing", 2, "success"),
  dictionaryItem(11, "document_category", "技术资料", "technical_document", 3, "warning"),
  dictionaryItem(12, "discipline_type", "机械", "mechanical", 1, "primary"),
  dictionaryItem(13, "discipline_type", "电气", "electrical", 2, "warning"),
  dictionaryItem(14, "discipline_type", "水工", "hydraulic", 3, "success"),
  dictionaryItem(15, "model_link_status", "已挂接", "linked", 1, "success"),
  dictionaryItem(16, "model_link_status", "未挂接", "unlinked", 2, "info"),
  dictionaryItem(17, "attribute_category", "基本参数", "basic", 1, "primary"),
  dictionaryItem(18, "attribute_category", "技术参数", "technical", 2, "success"),
  dictionaryItem(19, "attribute_category", "其他", "other", 3, "info"),
  dictionaryItem(20, "log_operation_type", "新增", "create", 1, "success"),
  dictionaryItem(21, "log_operation_type", "修改", "update", 2, "primary"),
  dictionaryItem(22, "log_operation_type", "删除", "delete", 3, "danger"),
  dictionaryItem(23, "log_operation_type", "导出", "export", 4, "warning"),
];

const initialOperationLogs: OperationAuditLog[] = [
  { id: 10001, operatorId: 1, operator: "系统管理员", ip: "192.168.10.21", userAgent: "Chrome 127 / Windows 11", module: "用户管理", action: "新增用户", content: "新增用户“赵工”并分配操作人员角色", requestUrl: "/api/system/users", operatedAt: "2026-08-10 16:42:18", businessNo: "USR-20260810-006" },
  { id: 10002, operatorId: 2, operator: "张操作", ip: "192.168.10.35", userAgent: "Edge 127 / Windows 11", module: "设备数字化", action: "查看设备", content: "查看1号水轮发电机组设备详情", requestUrl: "/api/equipment/WJD-01", operatedAt: "2026-08-10 15:38:42", businessNo: "WJD-01" },
  { id: 10003, operatorId: 1, operator: "系统管理员", ip: "192.168.10.21", userAgent: "Chrome 127 / Windows 11", module: "角色管理", action: "菜单权限", content: "更新操作人员角色菜单权限", requestUrl: "/api/system/roles/2/menus", operatedAt: "2026-08-10 14:20:16", businessNo: "ROLE_OPERATOR" },
  { id: 10004, operatorId: 3, operator: "张三", ip: "192.168.10.41", userAgent: "Chrome 126 / Windows 10", module: "图纸管理", action: "上传资料", content: "上传1号机组技术供水系统图纸", requestUrl: "/api/drawings/upload", operatedAt: "2026-08-10 11:06:53", businessNo: "DWG-20260810-012" },
  { id: 10005, operatorId: 1, operator: "系统管理员", ip: "192.168.10.21", userAgent: "Chrome 127 / Windows 11", module: "数据字典", action: "修改字典", content: "更新设备运行状态字典说明", requestUrl: "/api/system/dictionaries/1", operatedAt: "2026-08-09 17:32:09", businessNo: "equipment_run_status" },
  { id: 10006, operatorId: 6, operator: "赵工", ip: "192.168.10.52", userAgent: "Edge 126 / Windows 10", module: "属性管理", action: "保存属性", content: "保存主进水阀设备技术参数", requestUrl: "/api/attributes/equipment/save", operatedAt: "2026-08-09 15:11:24", businessNo: "WJD-VALVE-001" },
];

const initialLoginLogs: LoginAuditLog[] = [
  { id: 20001, operationType: "登录", username: "admin", address: "192.168.10.21 / 贵州省贵阳市", browser: "Chrome 127", result: "success", loginAt: "2026-08-10 08:02:18" },
  { id: 20002, operationType: "登录", username: "operator", address: "192.168.10.35 / 乌江渡发电厂", browser: "Edge 127", result: "success", loginAt: "2026-08-10 08:15:46" },
  { id: 20003, operationType: "退出", username: "zhangsan", address: "192.168.10.41 / 乌江渡发电厂", browser: "Chrome 126", result: "success", loginAt: "2026-08-09 18:03:22" },
  { id: 20004, operationType: "登录", username: "lisi", address: "192.168.10.44 / 乌江渡发电厂", browser: "Chrome 126", result: "success", loginAt: "2026-08-09 14:26:37" },
  { id: 20005, operationType: "登录", username: "viewer", address: "192.168.10.63 / 贵州省遵义市", browser: "Edge 126", result: "failed", loginAt: "2026-08-09 10:42:51" },
  { id: 20006, operationType: "登录", username: "maintainer", address: "192.168.10.52 / 乌江渡发电厂", browser: "Edge 126", result: "success", loginAt: "2026-08-09 07:58:13" },
];

interface SystemState {
  departments: Department[];
  positions: Position[];
  users: SystemUser[];
  roles: SystemRole[];
  menus: SystemMenu[];
  dictionaryTypes: DictionaryType[];
  dictionaryItems: DictionaryItem[];
  operationLogs: OperationAuditLog[];
  loginLogs: LoginAuditLog[];
  addDepartment: (record: Department) => void;
  updateDepartment: (id: number, patch: Partial<Department>) => void;
  deleteDepartments: (ids: number[]) => void;
  addPosition: (record: Position) => void;
  updatePosition: (id: number, patch: Partial<Position>) => void;
  deletePositions: (ids: number[]) => void;
  addUser: (record: SystemUser) => void;
  updateUser: (id: number, patch: Partial<SystemUser>) => void;
  deleteUsers: (ids: number[]) => void;
  addRole: (record: SystemRole) => void;
  updateRole: (id: number, patch: Partial<SystemRole>) => void;
  deleteRoles: (ids: number[]) => void;
  addMenu: (record: SystemMenu) => void;
  updateMenu: (id: number, patch: Partial<SystemMenu>) => void;
  deleteMenus: (ids: number[]) => void;
  addDictionaryType: (record: DictionaryType) => void;
  updateDictionaryType: (id: number, patch: Partial<DictionaryType>) => void;
  deleteDictionaryTypes: (ids: number[]) => void;
  addDictionaryItem: (record: DictionaryItem) => void;
  updateDictionaryItem: (id: number, patch: Partial<DictionaryItem>) => void;
  deleteDictionaryItems: (ids: number[]) => void;
}

export const useSystemStore = create<SystemState>((set) => ({
  departments: initialDepartments,
  positions: initialPositions,
  users: initialUsers,
  roles: initialRoles,
  menus: initialMenus,
  dictionaryTypes: initialDictionaryTypes,
  dictionaryItems: initialDictionaryItems,
  operationLogs: initialOperationLogs,
  loginLogs: initialLoginLogs,
  addDepartment: (record) => set((state) => ({ departments: [...state.departments, record] })),
  updateDepartment: (id, patch) => set((state) => ({ departments: state.departments.map((item) => item.id === id ? { ...item, ...patch } : item) })),
  deleteDepartments: (ids) => set((state) => ({ departments: state.departments.filter((item) => !ids.includes(item.id)) })),
  addPosition: (record) => set((state) => ({ positions: [...state.positions, record] })),
  updatePosition: (id, patch) => set((state) => ({ positions: state.positions.map((item) => item.id === id ? { ...item, ...patch } : item) })),
  deletePositions: (ids) => set((state) => ({ positions: state.positions.filter((item) => !ids.includes(item.id)) })),
  addUser: (record) => set((state) => ({ users: [...state.users, record] })),
  updateUser: (id, patch) => set((state) => ({ users: state.users.map((item) => item.id === id ? { ...item, ...patch } : item) })),
  deleteUsers: (ids) => set((state) => ({ users: state.users.filter((item) => !ids.includes(item.id)) })),
  addRole: (record) => set((state) => ({ roles: [...state.roles, record] })),
  updateRole: (id, patch) => set((state) => ({ roles: state.roles.map((item) => item.id === id ? { ...item, ...patch } : item) })),
  deleteRoles: (ids) => set((state) => ({ roles: state.roles.filter((item) => !ids.includes(item.id)) })),
  addMenu: (record) => set((state) => ({ menus: [...state.menus, record] })),
  updateMenu: (id, patch) => set((state) => ({ menus: state.menus.map((item) => item.id === id ? { ...item, ...patch } : item) })),
  deleteMenus: (ids) => set((state) => ({ menus: state.menus.filter((item) => !ids.includes(item.id)) })),
  addDictionaryType: (record) => set((state) => ({ dictionaryTypes: [...state.dictionaryTypes, record] })),
  updateDictionaryType: (id, patch) => set((state) => ({ dictionaryTypes: state.dictionaryTypes.map((item) => item.id === id ? { ...item, ...patch } : item) })),
  deleteDictionaryTypes: (ids) => set((state) => ({
    dictionaryTypes: state.dictionaryTypes.filter((item) => !ids.includes(item.id)),
    dictionaryItems: state.dictionaryItems.filter((item) => {
      const deletedTypes = state.dictionaryTypes.filter((type) => ids.includes(type.id)).map((type) => type.type);
      return !deletedTypes.includes(item.dictType);
    }),
  })),
  addDictionaryItem: (record) => set((state) => ({ dictionaryItems: [...state.dictionaryItems, record] })),
  updateDictionaryItem: (id, patch) => set((state) => ({ dictionaryItems: state.dictionaryItems.map((item) => item.id === id ? { ...item, ...patch } : item) })),
  deleteDictionaryItems: (ids) => set((state) => ({ dictionaryItems: state.dictionaryItems.filter((item) => !ids.includes(item.id)) })),
}));
