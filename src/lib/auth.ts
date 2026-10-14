import "server-only";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  createSessionToken,
  verifySessionToken,
  type SessionPayload,
  type Role,
} from "./session-token";

export {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  createSessionToken as createSession,
  verifySessionToken as verifySession,
  type SessionPayload,
  type Role,
};

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
