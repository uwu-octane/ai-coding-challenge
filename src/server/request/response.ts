import { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export type Meta = {
  requestId: string;
  event?: string;
  intention?: string;
  [key: string]: any;
};

export type Response<T = any> = { code: number; data?: T; message?: string };

export function ok<T>(c: Context, data?: T, message = "ok") {
  return c.json<Response<T>>({ code: 0, data, message });
}

export function err(
  c: Context,
  code = 1,
  message = "error",
  data?: any,
  httpStatus: ContentfulStatusCode = 200
) {
  return c.json<Response>({ code, message, data }, httpStatus);
}
