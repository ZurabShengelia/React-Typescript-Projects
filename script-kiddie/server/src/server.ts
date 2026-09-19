import http from "http";
import mongoose from "mongoose";
import { createApp } from "./app";
import { initSocketServer } from "./realtime/socket";
import { connectDatabase } from "./config/db";
import { env } from "./config/env";
import { logger } from "./utils/logger";

async function main() {
  await connectDatabase();
  const app = createApp();

  const server = http.createServer(app);
  const io = initSocketServer(server);

  server.listen(env.port, () => {
    logger.info(`Script Kiddie API listening on port ${env.port} (${env.nodeEnv})`);
  });

  function shutdown(signal: string) {
    logger.info(`${signal} received, shutting down gracefully…`);
    io.close();
    server.close(async () => {
      await mongoose.disconnect();
      logger.info("Server and database connections closed. Exiting.");
      process.exit(0);
    });

    setTimeout(() => process.exit(1), 10_000).unref();
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
  logger.error(
    "Failed to start server. If this is a MongoDB connection error, verify MONGO_URI is reachable " +
      "(in Docker this must be the service name, e.g. mongodb://mongo:27017/script_kiddie, not localhost).",
    { error: err }
  );
  process.exit(1);
});
