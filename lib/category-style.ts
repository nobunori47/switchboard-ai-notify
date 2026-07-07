import type { Category } from "./types";

export const CATEGORY_COLOR: Record<Category, string> = {
  賃貸: "#4F8A7B",
  売買: "#5B7FA6",
  内見: "#C9A24B",
  クレーム: "#C1443C",
};

export const STATUS_LABEL: Record<string, string> = {
  pending: "受付待ち",
  classified: "分類済み",
  notified: "通知済み",
  failed: "失敗",
};

export const STATUS_COLOR: Record<string, string> = {
  pending: "#5B6474",
  classified: "#C9A24B",
  notified: "#4F8A7B",
  failed: "#C1443C",
};

export const CHANNEL_LABEL: Record<string, string> = {
  gmail: "メール",
  line: "LINE",
};
