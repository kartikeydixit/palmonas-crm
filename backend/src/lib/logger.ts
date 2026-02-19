import pino from "pino";

const level = process.env.LOG_LEVEL ?? "info";

export const logger = pino({
  level,
  base: {
    service: "palmonas-api"
  },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.body.password",
      "password",
      "token",
      "accessToken",
      "refreshToken"
    ],
    remove: true
  }
});

