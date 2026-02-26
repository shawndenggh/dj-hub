import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const preferenceSchema = z.object({
  genres: z.array(z.string()).default([]),
  bpm: z
    .object({
      min: z.number().min(60).max(200).default(120),
      max: z.number().min(60).max(200).default(160),
    })
    .default({ min: 120, max: 160 }),
  energy: z
    .object({
      min: z.number().min(0).max(1).default(0),
      max: z.number().min(0).max(1).default(1),
    })
    .default({ min: 0, max: 1 }),
  danceability: z
    .object({
      min: z.number().min(0).max(1).default(0),
      max: z.number().min(0).max(1).default(1),
    })
    .default({ min: 0, max: 1 }),
  excludeExplicit: z.boolean().default(false),
  language: z.string().default("any"),
});

export const channelSchema = z.object({
  name: z.string().min(1, "Channel name is required").max(50),
  description: z.string().max(200).optional(),
  genre: z.string().optional(),
  isPublic: z.boolean().default(false),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  image: z.string().url().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PreferenceInput = z.infer<typeof preferenceSchema>;
export type ChannelInput = z.infer<typeof channelSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
