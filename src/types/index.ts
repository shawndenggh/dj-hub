import { User, Subscription, Preference, Channel } from "@prisma/client";
import { PlanType } from "@/lib/stripe";

export type { PlanType };

export interface UserWithSubscription extends User {
  subscription: Subscription | null;
}

export interface UserWithDetails extends User {
  subscription: Subscription | null;
  preferences: Preference | null;
  channels: Channel[];
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface DashboardStats {
  totalChannels: number;
  totalRecommendations: number;
  recentTracks: number;
  planLimits: {
    channels: number;
    recommendations: number;
  };
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: string;
  }
}
