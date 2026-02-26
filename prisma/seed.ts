import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create demo admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@djhub.com" },
    update: {},
    create: {
      email: "admin@djhub.com",
      name: "DJ Hub Admin",
      password: adminPassword,
      role: "ADMIN",
      subscription: {
        create: {
          plan: "ENTERPRISE",
          status: "active",
        },
      },
      preferences: {
        create: {
          genres: JSON.stringify(["house", "techno", "trance"]),
          bpm: JSON.stringify({ min: 120, max: 140 }),
          energy: JSON.stringify({ min: 0.7, max: 1.0 }),
          danceability: JSON.stringify({ min: 0.7, max: 1.0 }),
        },
      },
    },
  });

  // Create demo pro user
  const proPassword = await bcrypt.hash("pro123", 12);
  const proUser = await prisma.user.upsert({
    where: { email: "pro@djhub.com" },
    update: {},
    create: {
      email: "pro@djhub.com",
      name: "Pro DJ",
      password: proPassword,
      subscription: {
        create: {
          plan: "PRO",
          status: "active",
        },
      },
      preferences: {
        create: {
          genres: JSON.stringify(["house", "techno"]),
          bpm: JSON.stringify({ min: 125, max: 135 }),
          energy: JSON.stringify({ min: 0.8, max: 1.0 }),
          danceability: JSON.stringify({ min: 0.8, max: 1.0 }),
        },
      },
    },
  });

  // Create demo free user
  const freePassword = await bcrypt.hash("free123", 12);
  const freeUser = await prisma.user.upsert({
    where: { email: "free@djhub.com" },
    update: {},
    create: {
      email: "free@djhub.com",
      name: "Free DJ",
      password: freePassword,
      subscription: {
        create: {
          plan: "FREE",
          status: "active",
        },
      },
      preferences: {
        create: {
          genres: JSON.stringify(["pop", "dance"]),
        },
      },
    },
  });

  // Create sample channels for pro user (check first to avoid duplicates)
  const existingChannels = await prisma.channel.count({ where: { userId: proUser.id } });
  if (existingChannels === 0) {
    await prisma.channel.createMany({
      data: [
        {
          userId: proUser.id,
          name: "Late Night House",
          description: "Deep house vibes for late night sessions",
          genre: "house",
          isPublic: true,
        },
        {
          userId: proUser.id,
          name: "Morning Techno",
          description: "Energetic techno to start the day",
          genre: "techno",
          isPublic: false,
        },
      ],
    });
  }

  console.log("✅ Seeding complete!");
  console.log(`   Admin: admin@djhub.com / admin123`);
  console.log(`   Pro:   pro@djhub.com / pro123`);
  console.log(`   Free:  free@djhub.com / free123`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
