import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import { MessageContainer } from "@/components/common/Message";
import { DevNotesToggle } from "@/components/devNotes/DevNotesToggle";
import Login from "@/pages/Login";
import Screen from "@/pages/screen";
import { AdminLayout } from "@/layouts/AdminLayout";
import Dashboard from "@/pages/dashboard";
import Placeholder from "@/pages/Placeholder";

// 设备数字化
import EquipmentList from "@/pages/equipment/List";

// 管道数字化
import PipelineCategory from "@/pages/pipeline/Category";

// 属性管理（统一）
import AttributeManage from "@/pages/AttributeManage";

// 图纸管理
import DrawingList from "@/pages/drawing/List";

// 系统配置
import OrgManage from "@/pages/system/Org";
import PositionManage from "@/pages/system/Position";
import UserManage from "@/pages/system/UserReplica";
import RoleManage from "@/pages/system/RoleReplica";
import DictManage from "@/pages/system/DictReplica";
import DictDataManage from "@/pages/system/DictDataReplica";
import OperationLogManage from "@/pages/system/OperationLogReplica";
import LoginLogManage from "@/pages/system/LoginLogReplica";
import MenuManage from "@/pages/system/Menu";
import StructureTreeManage from "@/pages/system/StructureTree";
import AttributeTemplateManage from "@/pages/system/AttributeTemplate";

// 路由守卫
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <MessageContainer />
      <DevNotesToggle />
      <Routes>
        {/* 默认跳转登录 */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* 登录页 */}
        <Route path="/login" element={<Login />} />

        {/* 大屏看板 */}
        <Route
          path="/screen"
          element={
            <ProtectedRoute>
              <Screen />
            </ProtectedRoute>
          }
        />

        {/* 后台管理 */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />

          {/* 机电数字化 */}
          <Route path="equipment" element={<EquipmentList />} />
          <Route path="pipeline/category" element={<PipelineCategory />} />
          <Route path="attribute" element={<AttributeManage />} />

          {/* 图纸管理 */}
          <Route path="drawing" element={<DrawingList />} />

          {/* 系统配置 */}
          <Route path="system/org" element={<Navigate to="/admin/system/department" replace />} />
          <Route path="system/department" element={<OrgManage />} />
          <Route path="system/position" element={<PositionManage />} />
          <Route path="system/user" element={<UserManage />} />
          <Route path="system/role" element={<RoleManage />} />
          <Route path="system/dict" element={<DictManage />} />
          <Route path="system/dict/data/:type" element={<DictDataManage />} />
          <Route path="system/structure-tree" element={<StructureTreeManage />} />
          <Route path="system/attribute-template" element={<AttributeTemplateManage />} />
          <Route path="system/log" element={<Navigate to="/admin/system/log/operation" replace />} />
          <Route path="system/log/operation" element={<OperationLogManage />} />
          <Route path="system/log/login" element={<LoginLogManage />} />
          <Route path="system/menu" element={<MenuManage />} />
        </Route>

        {/* 404 */}
        <Route
          path="*"
          element={<Placeholder title="页面不存在" description="请检查URL是否正确" />}
        />
      </Routes>
    </Router>
  );
}
