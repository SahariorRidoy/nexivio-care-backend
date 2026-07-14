"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("../src/app"));
const database_1 = require("../src/config/database");
const redis_1 = require("../src/config/redis");
const mongodb_1 = require("../src/config/mongodb");
const env_1 = require("../src/config/env");
// Initialize connections once (Vercel may reuse the function instance)
let initialized = false;
const init = async () => {
    if (initialized)
        return;
    await database_1.prisma.$connect();
    await redis_1.redis.ping();
    if (env_1.env.MONGODB_URI)
        await (0, mongodb_1.connectMongoDB)(env_1.env.MONGODB_URI);
    initialized = true;
};
init().catch(console.error);
exports.default = app_1.default;
//# sourceMappingURL=index.js.map