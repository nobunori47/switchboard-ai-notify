import crypto from "node:crypto";

/**
 * 秘密情報(署名・共有シークレット)の比較には、単純な `===` ではなく
 * タイミングセーフな比較を使う。文字列比較にかかる時間差から
 * 情報が漏れる攻撃(タイミング攻撃)を防ぐため。
 */
export function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
