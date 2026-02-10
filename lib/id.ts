import { customAlphabet } from "nanoid";

const prefixes: Record<string, unknown> = {};

interface GenerateIdOptions {
  length?: number;
  separator?: string;
}

/**
 * Generates a unique ID with a custom alphabet.
 * This is now used for consistency with previous IDs,
 * but Prisma will handle ID generation via the @default(cuid()) directive.
 */
export function generateId(size = 21) {
  return customAlphabet(
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    size
  )();
}
