import jwt from "jsonwebtoken";

export interface SessionPayload {
  userId: number;
  role: string;
  mustChangePassword: boolean;
}

const JWT_SECRET = process.env.JWT_SECRET || "toktickit_super_secret_jwt_key_2026";
const JWT_EXPIRES_IN = "7d";

export function signSessionToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SessionPayload;
    return decoded;
  } catch {
    return null;
  }
}
