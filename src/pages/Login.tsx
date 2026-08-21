import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { message } from "@/components/common/Message";
import { users } from "@/mock";
import { APP_TITLE } from "@/lib/appConfig";
import { DevNote } from "@/components/devNotes/DevNote";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("123456");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("remembered-login");
    if (saved) {
      const { username: savedUser, password: savedPass } = JSON.parse(saved);
      setUsername(savedUser);
      setPassword(savedPass);
      setRemember(true);
    }
  }, []);

  const isFormValid = username.trim() !== "" && password.trim() !== "";

  const handleLogin = () => {
    setUsernameError("");
    setPasswordError("");

    if (!username.trim()) {
      setUsernameError("用户名不能为空");
      return;
    }
    if (!password.trim()) {
      setPasswordError("密码不能为空");
      return;
    }

    const matchedUser = users.find(
      (u) =>
        u.username === username.trim() &&
        u.password === password.trim() &&
        u.status === "enabled"
    );

    if (!matchedUser) {
      setPasswordError("用户名或密码错误");
      return;
    }

    login(matchedUser.username, matchedUser.password);

    if (remember) {
      localStorage.setItem(
        "remembered-login",
        JSON.stringify({ username: matchedUser.username, password: matchedUser.password })
      );
    } else {
      localStorage.removeItem("remembered-login");
    }

    message.success("登录成功");
    navigate("/screen");
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* 背景图 - 水电站实景 */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(
            "Aerial view of a large hydroelectric power station dam at dusk, concrete dam structure, penstocks, powerhouse building, water reservoir, dramatic sky, industrial photography, cinematic lighting, blue hour"
          )}&image_size=landscape_16_9)`,
        }}
      />
      {/* 深色遮罩 */}
      <div className="absolute inset-0 bg-black bg-opacity-60" />

      {/* 登录卡片 - 400x330px */}
      <div className="relative z-10 flex items-center justify-center w-full h-full">
        <div
          className="bg-white bg-opacity-95 backdrop-blur-md rounded-lg shadow-2xl animate-slide-down flex flex-col items-center"
          style={{ width: "400px", height: "330px", padding: "24px 50px" }}
        >
          {/* Logo + 名称 */}
          <div className="flex flex-col items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center mb-2">
              <ShieldCheck size={24} className="text-white" />
            </div>
            <h1 className="text-[16px] font-bold text-admin-text text-center">
              {APP_TITLE}
            </h1>
          </div>

          {/* 用户名 - 300px宽 */}
          <DevNote
            id="login-username"
            title="用户名输入框"
            summary="用户登录账号输入，支持记住密码自动回填"
            items={[
              { label: "数据来源", value: "前端本地存储 remembered-login（localStorage）；默认值 admin（原型 mock）" },
              { label: "校验规则", value: "非空校验，为空时字段下方提示「用户名不能为空」" },
              { label: "交互逻辑", value: "输入框左侧显示用户图标；按回车键直接触发登录" },
              { label: "后续步骤", value: "输入合法后与密码一起提交 handleLogin()，经 login() 写入 auth-storage 登录态，跳转 /screen" },
              { label: "权限", value: "所有用户可见可输入" },
            ]}
          >
            <div className="relative mb-3" style={{ width: "300px" }}>
              <User
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted"
              />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                className="w-full pl-9 pr-3 py-2 text-sm border border-admin-border rounded bg-white text-admin-text placeholder:text-admin-muted focus:outline-none focus:border-admin-primary focus:ring-1 focus:ring-admin-primary"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
              {usernameError && (
                <p className="text-red-500 text-xs mt-1">{usernameError}</p>
              )}
            </div>
          </DevNote>

          {/* 密码 - 300px宽 */}
          <DevNote
            id="login-password"
            title="密码输入框"
            summary="用户登录密码，支持明文/密文切换"
            items={[
              { label: "数据来源", value: "前端本地存储 remembered-login 回填；默认值 123456（原型 mock）" },
              { label: "校验规则", value: "非空校验，为空时提示「密码不能为空」；与用户名匹配失败提示「用户名或密码错误」" },
              { label: "交互逻辑", value: "左侧锁图标；右侧眼睛按钮切换 showPassword 状态（明文/密文）；按回车触发登录" },
              { label: "后续步骤", value: "提交 handleLogin() 时在 users（mock）中按 username+password+status=enabled 匹配，成功后 login() 并跳转 /screen" },
              { label: "权限", value: "所有用户可见可输入；正式系统需加密传输和存储" },
            ]}
          >
            <div className="relative mb-3" style={{ width: "300px" }}>
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted"
              />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="w-full pl-9 pr-9 py-2 text-sm border border-admin-border rounded bg-white text-admin-text placeholder:text-admin-muted focus:outline-none focus:border-admin-primary focus:ring-1 focus:ring-admin-primary"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-admin-muted hover:text-admin-text"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              {passwordError && (
                <p className="text-red-500 text-xs mt-1">{passwordError}</p>
              )}
            </div>
          </DevNote>

          {/* 记住密码 - 300px宽 */}
          <DevNote
            id="login-remember"
            title="记住密码复选框"
            summary="勾选后将账号密码保存到本地，下次自动回填"
            items={[
              { label: "数据来源", value: "localStorage key: remembered-login（JSON：{username, password}）" },
              { label: "校验规则", value: "默认勾选；登录成功且勾选时写入，取消勾选时移除" },
              { label: "交互逻辑", value: "登录成功后按 remember 状态写入或移除 remembered-login；页面初始化时读取并回填" },
              { label: "后续步骤", value: "回填用户名和密码；登录态由 auth-storage 独立维护，与记住密码互不影响" },
              { label: "权限", value: "所有用户可见；正式系统不建议明文存储密码" },
            ]}
          >
            <div className="flex items-center mb-3" style={{ width: "300px" }}>
              <input
                type="checkbox"
                id="remember"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="cursor-pointer"
              />
              <label
                htmlFor="remember"
                className="ml-2 text-sm text-admin-muted cursor-pointer"
              >
                记住密码
              </label>
            </div>
          </DevNote>

          {/* 登录按钮 - 300px宽 */}
          <DevNote
            id="login-submit"
            title="登录按钮"
            summary="提交登录校验，成功后进入孪生全景"
            items={[
              { label: "数据来源", value: "mock 用户表 users：按 username + password + status=enabled 匹配" },
              { label: "校验规则", value: "依次校验：用户名非空→密码非空→账号密码匹配→账号启用；用户名或密码为空时按钮 disabled" },
              { label: "交互逻辑", value: "点击或按回车触发 handleLogin()；任一校验失败在对应字段下提示" },
              { label: "后续步骤", value: "成功后 message.success「登录成功」，调用 login() 写入登录态，navigate('/screen')；记住密码按勾选写入本地" },
              { label: "权限", value: "所有用户；浏览人员登录后不显示后台管理入口" },
            ]}
          >
            <button
              onClick={handleLogin}
              disabled={!isFormValid}
              className="py-2 bg-admin-primary text-white text-sm rounded transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ width: "300px" }}
            >
              登 录
            </button>
          </DevNote>

        </div>
      </div>
    </div>
  );
}
