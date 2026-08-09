/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        // 大屏工业数字孪生风
        screen: {
          bg: "#070b14",
          panel: "rgba(10, 18, 32, 0.85)",
          border: "rgba(64, 169, 255, 0.35)",
          hover: "rgba(64, 169, 255, 0.08)",
          text: "#ffffff",
          muted: "#5a7090",
          accent: "#40A9FF",
          alarm: "#ff4d4f",
        },
        // 后台浅色商务风
        admin: {
          primary: "#1890ff",
          success: "#52c41a",
          warning: "#faad14",
          danger: "#ff4d4f",
          info: "#1890ff",
          bg: "#f0f2f5",
          card: "#ffffff",
          border: "#e8e8e8",
          text: "#262626",
          muted: "#8c8c8c",
          sidebar: "#304156",
          sidebarHover: "#263445",
          sidebarActive: "#1f2d3d",
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', "sans-serif"],
        mono: ['"Roboto Mono"', '"Courier New"', "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s infinite",
        "spin-slow": "spin 8s linear infinite",
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-down": "slideDown 0.3s ease-out",
        "slide-right": "slideRight 0.3s ease-out",
        glow: "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideRight: {
          "0%": { transform: "translateX(-10px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(64, 158, 255, 0.5)" },
          "100%": { boxShadow: "0 0 20px rgba(64, 158, 255, 0.8)" },
        },
      },
    },
  },
  plugins: [],
};
