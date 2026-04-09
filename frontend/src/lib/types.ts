export type Role = 'ADMIN' | 'OWNER' | 'USER';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};

export type PropertyImage = {
  id: string;
  propertyId: string;
  url: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

export type PropertyRecord = {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  location: string;
  price: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publishedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  images: PropertyImage[];
};

export type PropertyListResponse = {
  data: PropertyRecord[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type FavoriteRecord = {
  id: string;
  userId: string;
  propertyId: string;
  createdAt: string;
};

export type FavoriteWithPropertyRecord = FavoriteRecord & {
  property: PropertyRecord;
};

export type AdminMetrics = {
  users: {
    total: number;
    owners: number;
  };
  properties: {
    total: number;
    published: number;
    draft: number;
    archived: number;
  };
};
