// Owner session: unlocking with OWNER_PASSPHRASE sets an httpOnly cookie holding
// an HMAC derived from LAWN_WRITE_SECRET. Server-only.
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

export const OWNER_COOKIE = "lawn_owner";

export const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export function ownerToken() {
  const secret = process.env.LAWN_WRITE_SECRET;
  return secret ? createHmac("sha256", secret).update("lawn-owner").digest("hex") : null;
}

export async function isOwner() {
  const token = ownerToken();
  const cookie = (await cookies()).get(OWNER_COOKIE)?.value;
  return Boolean(token && cookie && safeEqual(cookie, token));
}

export const canUnlock = () => Boolean(process.env.OWNER_PASSPHRASE && process.env.LAWN_WRITE_SECRET);
