import { Injectable } from '@nestjs/common';
import { Prisma, Role, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  createUser(data: {
    name: string;
    email: string;
    passwordHash: string;
    role?: Role;
  }): Promise<User> {
    const userData: Prisma.UserCreateInput = {
      name: data.name,
      email: data.email,
      passwordHash: data.passwordHash,
      role: data.role ?? Role.USER,
    };

    return this.prisma.user.create({ data: userData });
  }
}
