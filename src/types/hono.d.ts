import "hono";

declare module "hono" {
  interface ContextVariableMap {
    HTTP_REQUEST_ID: string;
    X_SESSION_ID: string;
  }
}
