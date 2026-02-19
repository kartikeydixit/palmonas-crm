import { User, hashPassword } from "./models.js";
import { logger } from "../../lib/logger.js";

const DEFAULT_ADMIN_EMAIL = "admin@palmonas.local";
const DEFAULT_ADMIN_PASSWORD = "Admin@12345";

export async function ensureDefaultAdmin() {
  const existing = await User.findOne({ email: DEFAULT_ADMIN_EMAIL });
  if (existing) {
    logger.info({ msg: "default_admin_exists", email: DEFAULT_ADMIN_EMAIL });
    return;
  }

  const passwordHash = await hashPassword(DEFAULT_ADMIN_PASSWORD);
  await User.create({
    email: DEFAULT_ADMIN_EMAIL,
    passwordHash,
    role: "admin"
  });

  logger.info({ msg: "default_admin_created", email: DEFAULT_ADMIN_EMAIL });
}
