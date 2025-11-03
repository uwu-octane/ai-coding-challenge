import { Hono } from "hono";
import health from "../routes/health";
import chat from "./ai/chat";
import testRetrieval from "./ai/testRetrieval";
const api = new Hono();

api.route("/api", health);
api.route("/api/ai", chat);
api.route("/api/ai/test", testRetrieval);

export default api;
