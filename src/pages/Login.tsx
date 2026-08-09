import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, Eye, EyeOff, ShieldCheck, RefreshCw } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { message } from "@/components/common/Message";
import { users } from "@/mock";

const CAPTCHA_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const CAPTCHA_COLORS = [
  "#e74c3c",
  "#e67e22",
  "#f1c40f",
  "#2ecc71",
  "#3498db",
  "#9b59b6",
  "#1abc9c",
  "#e91e63",
];

function generateCaptchaCode(length = 4): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CAPTCHA_CHARS.charAt(
      Math.floor(Math.random() * CAPTCHA_CHARS.length)
    );
  }
  return code;
}

function drawCaptcha(canvas: HTMLCanvasElement, code: string) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = "#f0f4f8";
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 5; i++) {
    ctx.strokeStyle = CAPTCHA_COLORS[Math.floor(Math.random() * CAPTCHA_COLORS.length)];
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(Math.random() * width, Math.random() * height);
    ctx.lineTo(Math.random() * width, Math.random() * height);
    ctx.stroke();
  }

  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = CAPTCHA_COLORS[Math.floor(Math.random() * CAPTCHA_COLORS.length)];
    ctx.beginPath();
    ctx.arc(Math.random() * width, Math.random() * height, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  const charWidth = width / (code.length + 1);
  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const x = charWidth * (i + 0.5) + Math.random() * 10 - 5;
    const y = height / 2 + Math.random() * 10 - 5;
    const angle = (Math.random() - 0.5) * 0.6;
    const fontSize = 22 + Math.random() * 4;
    const color = CAPTCHA_COLORS[Math.floor(Math.random() * CAPTCHA_COLORS.length)];

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.font = `bold ${fontSize}px "Microsoft YaHei", Arial, sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(char, 0, 0);
    ctx.restore();
  }
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("123456");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  const [captchaCode, setCaptchaCode] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaError, setCaptchaError] = useState("");

  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const refreshCaptcha = useCallback(() => {
    const newCode = generateCaptchaCode(4);
    setCaptchaCode(newCode);
    setCaptchaInput("");
    setCaptchaError("");
    if (canvasRef.current) {
      drawCaptcha(canvasRef.current, newCode);
    }
  }, []);

  useEffect(() => {
    refreshCaptcha();
  }, [refreshCaptcha]);

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
    setCaptchaError("");

    if (!username.trim()) {
      setUsernameError("用户名不能为空");
      return;
    }
    if (!password.trim()) {
      setPasswordError("密码不能为空");
      return;
    }

    if (!captchaInput.trim()) {
      setCaptchaError("请输入验证码");
      return;
    }

    if (captchaInput.trim().toUpperCase() !== captchaCode.toUpperCase()) {
      setCaptchaError("验证码错误");
      setCaptchaInput("");
      refreshCaptcha();
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
      refreshCaptcha();
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

      {/* 登录卡片 - 400x380px */}
      <div className="relative z-10 flex items-center justify-center w-full h-full">
        <div
          className="bg-white bg-opacity-95 backdrop-blur-md rounded-lg shadow-2xl animate-slide-down flex flex-col items-center"
          style={{ width: "400px", height: "380px", padding: "24px 50px" }}
        >
          {/* Logo + 名称 */}
          <div className="flex flex-col items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center mb-2">
              <ShieldCheck size={24} className="text-white" />
            </div>
            <h1 className="text-[16px] font-bold text-admin-text text-center">
              乌江渡水电站数字孪生管理平台
            </h1>
          </div>

          {/* 用户名 - 300px宽 */}
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

          {/* 密码 - 300px宽 */}
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

          {/* 验证码 - 300px宽 */}
          <div className="relative mb-3" style={{ width: "300px" }}>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                placeholder="请输入验证码"
                maxLength={4}
                className="pl-3 pr-3 py-2 text-sm border border-admin-border rounded bg-white text-admin-text placeholder:text-admin-muted focus:outline-none focus:border-admin-primary focus:ring-1 focus:ring-admin-primary"
                style={{ width: "180px" }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
              <canvas
                ref={canvasRef}
                width={110}
                height={36}
                onClick={refreshCaptcha}
                className="rounded border border-admin-border cursor-pointer flex-shrink-0"
                title="点击刷新验证码"
              />
              <button
                type="button"
                onClick={refreshCaptcha}
                className="flex-shrink-0 p-1 text-admin-muted hover:text-admin-primary"
                title="刷新验证码"
              >
                <RefreshCw size={16} />
              </button>
            </div>
            {captchaError && (
              <p className="text-red-500 text-xs mt-1">{captchaError}</p>
            )}
          </div>

          {/* 记住密码 - 300px宽 */}
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

          {/* 登录按钮 - 300px宽 */}
          <button
            onClick={handleLogin}
            disabled={!isFormValid}
            className="py-2 bg-admin-primary text-white text-sm rounded transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ width: "300px" }}
          >
            登 录
          </button>

          {/* 版权 */}
          <p className="text-center text-xs text-admin-muted mt-auto pt-2">
            © 2026 乌江渡水电站
          </p>
        </div>
      </div>
    </div>
  );
}