export type Channel = "gmail" | "line";
export type Category = "賃貸" | "売買" | "内見" | "クレーム";
export type Status = "pending" | "classified" | "notified" | "failed";

export interface InquiryRow {
  id: string;
  channel: Channel;
  external_id: string | null;
  sender: string | null;
  raw_content: string;
  category: Category | null;
  confidence: number | null;
  classification_reason: string | null;
  is_urgent: boolean;
  status: Status;
  retry_count: number;
  last_error: string | null;
  next_retry_at: string | null;
  created_at: string;
  classified_at: string | null;
  notified_at: string | null;
}

export interface DashboardStats {
  total_count: number;
  urgent_count: number;
  failed_count: number;
  notified_count: number;
  success_rate_pct: number | null;
}

export interface ClassificationResult {
  category: Category;
  confidence: number;
  urgent: boolean;
  reason: string;
}
