import 'dotenv/config';
import { PrismaClient, PropertyStatus, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';

const connectionString = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required for seeding');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

async function upsertUser(input: {
  email: string;
  name: string;
  role: Role;
  password: string;
}) {
  const passwordHash = await bcrypt.hash(input.password, 12);

  return prisma.user.upsert({
    where: { email: input.email },
    update: {
      name: input.name,
      role: input.role,
      passwordHash,
    },
    create: {
      email: input.email,
      name: input.name,
      role: input.role,
      passwordHash,
    },
  });
}

async function seed() {
  const admin = await upsertUser({
    email: 'admin@propertyplatform.com',
    name: 'Platform Admin',
    role: Role.ADMIN,
    password: 'Password123!',
  });

  const owner = await upsertUser({
    email: 'owner@propertyplatform.com',
    name: 'Property Owner',
    role: Role.OWNER,
    password: 'Password123!',
  });

  const user = await upsertUser({
    email: 'user@propertyplatform.com',
    name: 'Regular User',
    role: Role.USER,
    password: 'Password123!',
  });

  const existingProperty = await prisma.property.findFirst({
    where: {
      ownerId: owner.id,
      title: 'Seeded Downtown Apartment',
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!existingProperty) {
    const property = await prisma.property.create({
      data: {
        ownerId: owner.id,
        title: 'Seeded Downtown Apartment',
        description:
          'A furnished 2-bedroom apartment close to transit and local markets.',
        location: 'Addis Ababa',
        price: 2500,
        status: PropertyStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      select: { id: true },
    });

    await prisma.propertyImage.createMany({
      data: [
        {
          propertyId: property.id,
          url: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511',
          mimeType: 'image/jpeg',
          size: 180000,
        },
        {
          propertyId: property.id,
          url: 'https://images.unsplash.com/photo-1493666438817-866a91353ca9',
          mimeType: 'image/jpeg',
          size: 210000,
        },
      ],
    });
  }

  console.log('Seed complete');
  console.log('Admin:', admin.email);
  console.log('Owner:', owner.email);
  console.log('User:', user.email);
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
