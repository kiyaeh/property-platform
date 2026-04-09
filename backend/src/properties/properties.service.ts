import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  Property,
  PropertyImage,
  PropertyStatus,
} from '@prisma/client';
import { Role } from '../common/enums/role.enum';
import { PrismaService } from '../prisma/prisma.service';
import { RequestUser } from '../common/types/request-user.type';
import { CreatePropertyDto } from './dto/create-property.dto';
import { ListPropertiesQueryDto } from './dto/list-properties-query.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';

type PropertyWithImages = Property & { images: PropertyImage[] };

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublic(query: ListPropertiesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.PropertyWhereInput = {
      deletedAt: null,
      status: PropertyStatus.PUBLISHED,
      ...(query.location
        ? {
            location: {
              contains: query.location,
              mode: 'insensitive',
            },
          }
        : {}),
      ...(query.minPrice !== undefined || query.maxPrice !== undefined
        ? {
            price: {
              ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
              ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
            },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { images: true },
      }),
      this.prisma.property.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async listForOwner(ownerId: string, query: ListPropertiesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.PropertyWhereInput = {
      ownerId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { images: true },
      }),
      this.prisma.property.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async listForAdmin(query: ListPropertiesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.PropertyWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.location
        ? {
            location: {
              contains: query.location,
              mode: 'insensitive',
            },
          }
        : {}),
      ...(query.minPrice !== undefined || query.maxPrice !== undefined
        ? {
            price: {
              ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
              ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
            },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          images: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      }),
      this.prisma.property.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPublicById(propertyId: string): Promise<PropertyWithImages> {
    const property = await this.prisma.property.findFirst({
      where: {
        id: propertyId,
        deletedAt: null,
        status: PropertyStatus.PUBLISHED,
      },
      include: { images: true },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return property;
  }

  async getByIdForAuthorizedUser(propertyId: string, user: RequestUser) {
    const property = await this.prisma.property.findFirst({
      where: {
        id: propertyId,
        deletedAt: null,
      },
      include: { images: true },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (user.role === Role.Admin || property.ownerId === user.sub) {
      return property;
    }

    if (property.status !== PropertyStatus.PUBLISHED) {
      throw new NotFoundException('Property not found');
    }

    return property;
  }

  create(ownerId: string, dto: CreatePropertyDto): Promise<PropertyWithImages> {
    return this.prisma.property.create({
      data: {
        ownerId,
        title: dto.title,
        description: dto.description,
        location: dto.location,
        price: dto.price,
        ...(dto.images && dto.images.length > 0
          ? {
              images: {
                create: dto.images,
              },
            }
          : {}),
      },
      include: { images: true },
    });
  }

  async updateDraft(
    ownerId: string,
    propertyId: string,
    dto: UpdatePropertyDto,
  ): Promise<PropertyWithImages> {
    const existing = await this.prisma.property.findFirst({
      where: {
        id: propertyId,
        ownerId,
        deletedAt: null,
      },
      include: { images: true },
    });

    if (!existing) {
      throw new NotFoundException('Property not found');
    }

    if (existing.status !== PropertyStatus.DRAFT) {
      throw new ConflictException('Only draft properties can be edited');
    }

    const data: Prisma.PropertyUpdateInput = {
      ...(dto.title ? { title: dto.title } : {}),
      ...(dto.description ? { description: dto.description } : {}),
      ...(dto.location ? { location: dto.location } : {}),
      ...(dto.price !== undefined ? { price: dto.price } : {}),
    };

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (dto.images) {
        await tx.propertyImage.deleteMany({
          where: { propertyId: existing.id },
        });
      }

      return tx.property.update({
        where: { id: existing.id },
        data: {
          ...data,
          ...(dto.images
            ? {
                images: {
                  create: dto.images,
                },
              }
            : {}),
        },
        include: { images: true },
      });
    });
  }

  async publish(
    ownerId: string,
    propertyId: string,
  ): Promise<PropertyWithImages> {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const property = await tx.property.findFirst({
        where: {
          id: propertyId,
          ownerId,
          deletedAt: null,
        },
        include: { images: true },
      });

      if (!property) {
        throw new NotFoundException('Property not found');
      }

      if (property.status !== PropertyStatus.DRAFT) {
        throw new ConflictException('Only draft properties can be published');
      }

      if (
        !property.title.trim() ||
        !property.description.trim() ||
        !property.location.trim() ||
        property.price <= 0 ||
        property.images.length < 2
      ) {
        throw new BadRequestException(
          'Property must have complete data and at least two images before publishing',
        );
      }

      return tx.property.update({
        where: { id: property.id },
        data: {
          status: PropertyStatus.PUBLISHED,
          publishedAt: new Date(),
        },
        include: { images: true },
      });
    });
  }

  async softDelete(ownerId: string, propertyId: string): Promise<void> {
    const existing = await this.prisma.property.findFirst({
      where: {
        id: propertyId,
        ownerId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Property not found');
    }

    await this.prisma.property.update({
      where: { id: existing.id },
      data: { deletedAt: new Date() },
    });
  }

  async disableAsAdmin(propertyId: string): Promise<PropertyWithImages> {
    const existing = await this.prisma.property.findFirst({
      where: { id: propertyId, deletedAt: null },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Property not found');
    }

    return this.prisma.property.update({
      where: { id: existing.id },
      data: {
        status: PropertyStatus.ARCHIVED,
      },
      include: { images: true },
    });
  }

  async addFavorite(userId: string, propertyId: string) {
    const property = await this.prisma.property.findFirst({
      where: {
        id: propertyId,
        deletedAt: null,
        status: PropertyStatus.PUBLISHED,
      },
      select: { id: true },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return this.prisma.favorite.upsert({
      where: {
        userId_propertyId: {
          userId,
          propertyId: property.id,
        },
      },
      update: {},
      create: {
        userId,
        propertyId: property.id,
      },
    });
  }

  async removeFavorite(userId: string, propertyId: string): Promise<void> {
    await this.prisma.favorite.deleteMany({
      where: {
        userId,
        propertyId,
      },
    });
  }

  async listFavorites(userId: string) {
    const favorites = await this.prisma.favorite.findMany({
      where: {
        userId,
        property: {
          deletedAt: null,
          status: PropertyStatus.PUBLISHED,
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        property: {
          include: {
            images: true,
          },
        },
      },
    });

    return favorites;
  }

  async contactOwner(userId: string, propertyId: string, message: string) {
    const property = await this.prisma.property.findFirst({
      where: {
        id: propertyId,
        deletedAt: null,
        status: PropertyStatus.PUBLISHED,
      },
      select: {
        id: true,
        ownerId: true,
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.ownerId === userId) {
      throw new BadRequestException(
        'You cannot contact yourself for your own property',
      );
    }

    return this.prisma.contactMessage.create({
      data: {
        propertyId: property.id,
        senderId: userId,
        message,
      },
    });
  }

  async getAdminMetrics() {
    const [
      totalUsers,
      totalOwners,
      totalProperties,
      publishedProperties,
      draftProperties,
      archivedProperties,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'OWNER' } }),
      this.prisma.property.count({ where: { deletedAt: null } }),
      this.prisma.property.count({
        where: { deletedAt: null, status: PropertyStatus.PUBLISHED },
      }),
      this.prisma.property.count({
        where: { deletedAt: null, status: PropertyStatus.DRAFT },
      }),
      this.prisma.property.count({
        where: { deletedAt: null, status: PropertyStatus.ARCHIVED },
      }),
    ]);

    return {
      users: {
        total: totalUsers,
        owners: totalOwners,
      },
      properties: {
        total: totalProperties,
        published: publishedProperties,
        draft: draftProperties,
        archived: archivedProperties,
      },
    };
  }
}
