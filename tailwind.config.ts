import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        panel: {
          DEFAULT: "#1B1E26", // 配電盤の筐体色(深いチャコールネイビー)
          raised: "#232733",
          line: "#343A48",
        },
        brass: {
          DEFAULT: "#C9A24B", // 真鍮ジャック(操作可能要素のアクセント)
          dim: "#8C7638",
        },
        signal: {
          urgent: "#C1443C", // 緊急コード(クレーム)
          notice: "#4F8A7B", // 通常成功
          idle: "#5B6474", // 待機
          error: "#D97757",
        },
        paper: "#EDEAE2",
        mute: "#9CA3B0",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        mono: ["var(--font-mono)"],
        body: ["var(--font-body)"],
      },
    },
  },
  plugins: [],
};
export default config;
