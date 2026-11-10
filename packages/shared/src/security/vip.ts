/**
 * Checks whether an email belongs to a VIP user with unlimited free access across the platform.
 */
export function isVipUser(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const vipList = [
    "mkiplanagt15@gmail.com",
    "mkiplangat15@gmail.com",
    ...(typeof process !== "undefined" && process.env?.VIP_EMAILS
      ? process.env.VIP_EMAILS.split(",").map((e) => e.trim().toLowerCase())
      : []),
  ].filter(Boolean);

  return vipList.includes(normalized);
}
