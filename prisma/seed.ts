import bcrypt from "bcrypt";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminUsername = "markus";
  const adminPassword = "jebemta";

  const existingAdmin = await prisma.user.findUnique({
    where: {
      username: adminUsername,
    },
  });

  if (existingAdmin) {
    console.log("Admin už existuje.");
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.create({
    data: {
      username: adminUsername,
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  console.log("Admin bol vytvorený.");
  console.log({
    id: admin.id,
    username: admin.username,
    role: admin.role,
  });
  console.log("Prihlasovacie údaje:");
  console.log(`username: ${adminUsername}`);
  console.log(`password: ${adminPassword}`);
}

main()
  .catch((error) => {
    console.error("Seed zlyhal:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });