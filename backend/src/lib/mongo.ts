import mongoose from "mongoose";
import { logger } from "./logger.js";

export async function connectMongo(uri: string) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000
  });
  logger.info({ msg: "mongo_connected" });
}

