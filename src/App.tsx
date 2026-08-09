import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import { MessageContainer } from "@/components/common/Message";
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
import UserManage from "@/pages/system/User";
import DictManage from "@/pages/system/Dict";
import LogQuery from "@/pages/system/Log";
import WorkflowManage from "@/pages/system/Workflow";
import StructureTreeManage from "@/pages/system/StructureTree";

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
          <Route path="system/org" element={<OrgManage />} />
          <Route path="system/user" element={<UserManage />} />
          <Route path="system/role" element={<Navigate to="/admin/system/user" replace />} />
          <Route path="system/dict" element={<DictManage />} />
          <Route path="system/structure-tree" element={<StructureTreeManage />} />
          <Route path="system/log" element={<LogQuery />} />
          <Route path="system/workflow" element={<WorkflowManage />} />
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
