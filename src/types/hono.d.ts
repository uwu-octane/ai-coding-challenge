import "hono";

declare module "hono" {
  interface ContextVariableMap {
    HTTP_REQUEST_ID: string;
  }
}
