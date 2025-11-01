import { Hono } from "hono";
import health from "../routes/health";
import chat from "./ai/chat";

const api = new Hono();

api.route("/api", health);
api.route("/api/ai", chat);

export default api;
