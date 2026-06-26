/**
 * UUID-shape check (8-4-4-4-12 hex). Used for route-param guards where we only
 * need to reject malformed ids before hitting the database. API payloads should
 * prefer `z.string().uuid()` for RFC-4122 validation.
 */
export const UUID_SHAPE_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export function isUuidShape(value: string): boolean {
  return UUID_SHAPE_RE.test(value);
}
