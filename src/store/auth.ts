import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Role } from "@/types";
import { users, roles } from "@/mock";

interface AuthState {
  currentUser: User | null;
  currentRole: Role | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  hasPermission: (module: string, action?: string) => boolean;
  canAccessAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      currentRole: null,
      isAuthenticated: false,

      login: (username: string, password: string) => {
        const user = users.find(
          (u) => u.username === username && u.password === password
        );
        if (user) {
          const role = roles.find((r) => user.roleIds.includes(r.id));
          set({
            currentUser: user,
            currentRole: role || null,
            isAuthenticated: true,
          });
          return true;
        }
        return false;
      },

      logout: () => {
        set({
          currentUser: null,
          currentRole: null,
          isAuthenticated: false,
        });
      },

      hasPermission: (module: string, action?: string) => {
        const role = get().currentRole;
        if (!role) return false;
        // 管理员拥有全部权限
        if (role.code === "ROLE_ADMIN") return true;
        // 操作人员权限范围
        if (role.code === "ROLE_OPERATOR") {
          const allowedModules = [
            "drawing",
            "digital",
            "equipment",
            "pipeline",
            "attribute",
            "document",
            "dashboard",
            "screen",
          ];
          if (!allowedModules.includes(module)) return false;
          if (action === "delete" || action === "config") return false;
          return true;
        }
        // 浏览人员仅可查看
        if (role.code === "ROLE_VIEWER") {
          return module === "screen" && (!action || action === "view");
        }
        return false;
      },

      canAccessAdmin: () => {
        const role = get().currentRole;
        if (!role) return false;
        return role.code === "ROLE_ADMIN" || role.code === "ROLE_OPERATOR";
      },
    }),
    {
      name: "auth-storage",
    }
  )
);
