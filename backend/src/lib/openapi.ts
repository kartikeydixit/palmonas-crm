import swaggerJSDoc from "swagger-jsdoc";
import type { AppConfig } from "../types.js";

import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function buildOpenApiSpec({ config }: { config: AppConfig }) {
  // swagger-jsdoc needs source files with JSDoc comments, not compiled JS
  // __dirname in compiled code: /app/dist/lib -> /app
  const baseDir = join(__dirname, "../.."); 
  const apiPaths = [
    // Prefer TypeScript source files when available (local dev)
    join(baseDir, "src/modules/**/*.ts"),
    join(baseDir, "src/lib/**/*.ts"),
    // Also include compiled JS files (when running from dist in containers)
    join(baseDir, "dist/modules/**/*.js"),
    join(baseDir, "dist/lib/**/*.js")
  ];
  
  return swaggerJSDoc({
    definition: {
      openapi: "3.0.3",
      info: {
        title: "Palmonas Admin CRM API",
        version: "1.0.0",
        description: "Admin CRM API for managing orders from multiple sales channels"
      },
      servers: [
        {
          url: "http://localhost:4000",
          description: "Local development server"
        }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT"
          }
        }
      }
    },
    apis: apiPaths
  });
}

