import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create test users
  const testUsers = [
    {
      name: 'Test User 1',
      email: 'test1@example.com',
      password: await hash('password123', 10),
    },
    {
      name: 'Test User 2',
      email: 'test2@example.com',
      password: await hash('password123', 10),
    },
    {
      name: 'Test User 3',
      email: 'test3@example.com',
      password: await hash('password123', 10),
    },
  ];

  console.log('Creating test users...');

  for (const userData of testUsers) {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (!existingUser) {
      await prisma.user.create({
        data: userData,
      });
      console.log(`Created user: ${userData.email}`);
    } else {
      console.log(`User already exists: ${userData.email}`);
    }
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 