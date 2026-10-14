import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE_NAME = "centa-session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days
const JWT_ALGORITHM = "HS256";
const JWT_ISSUER = "centa-web";
const JWT_AUDIENCE = "centa-web:session";

export const ROLES = ["admin", "asesor", "revisor"] as const;
export type Role = (typeof ROLES)[number];

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: Role;
  mustChangePassword: boolean;
}

export const SESSION_COOKIE_OPTIONS = {
  name: SESSION_COOKIE_NAME,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_DURATION_SECONDS,
};

let cachedSecret: Uint8Array | null = null;

function getSecret(): Uint8Array {
  if (cachedSecret) return cachedSecret;
  const raw = process.env.AUTH_SECRET;
  if (raw && raw.length < 32) {
    throw new Error(
      "AUTH_SECRET is set but is shorter than 32 characters. Either unset it (dev only) or provide a value of at least 32 characters.",
    );
  }
  if (!raw) {
    const dbUrl =
      process.env.DATABASE_URL ||
      process.env.CENTA_DATABASE_DATABASE_URL ||
      process.env.POSTGRES_URL ||
      "";
    if (dbUrl && process.env.NODE_ENV === "production") {
      const derived =
        "centa-derived-" +
        dbUrl.length.toString(36) +
        "-" +
        Buffer.from(dbUrl).toString("base64url").substring(0, 48);
      if (derived.length >= 32) {
        console.warn(
          "[session-token] AUTH_SECRET not set — deriving from DATABASE_URL. Set AUTH_SECRET explicitly for better security.",
        );
        cachedSecret = new TextEncoder().encode(derived);
        return cachedSecret;
      }
    }
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "AUTH_SECRET must be set to a value of at least 32 characters in production",
      );
    }
    console.warn(
      "[session-token] AUTH_SECRET is not set — falling back to a hardcoded dev secret. Do NOT use this in production.",
    );
    cachedSecret = new TextEncoder().encode("centa-dev-secret-change-in-prod-0000000000");
    return cachedSecret;
  }
  cachedSecret = new TextEncoder().encode(raw);
  return cachedSecret;
}

function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

function isSessionPayload(value: unknown): value is SessionPayload {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.userId === "string" &&
    typeof v.email === "string" &&
    typeof v.name === "string" &&
    isRole(v.role) &&
    typeof v.mustChangePassword === "boolean"
  );
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: [JWT_ALGORITHM],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    if (!isSessionPayload(payload)) return null;
    return {
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      mustChangePassword: payload.mustChangePassword,
    };
  } catch {
    return null;
  }
}
