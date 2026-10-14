import { hash } from "bcryptjs";
import { db } from "./src/lib/db";
import { users } from "./src/db/schema";

async function seed() {
  const passwordHash = await hash("Centa123", 12);

  const [user] = await db.insert(users).values({
    email: "admin@admin.com",
    name: "Admin",
    role: "admin",
    passwordHash,
    active: true,
  }).returning();

  console.log("✅ Admin user created:", user.email, "| role:", user.role);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
