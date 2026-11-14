import { z } from 'zod';

export const CAMPUSES = [
  { code: 'SGW', name: 'Sir George Williams' },
  { code: 'LOY', name: 'Loyola' },
] as const;

export type CampusCode = (typeof CAMPUSES)[number]['code'];

export const campusName = (code: string | null | undefined) =>
  CAMPUSES.find((c) => c.code === code)?.name ?? null;

/** Mirrors the DB check constraints in supabase/migrations/*_profiles.sql. */
export const profileInputSchema = z.object({
  display_name: z.string().trim().min(1, 'Enter a display name.').max(60, 'Keep it under 60 characters.'),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,24}$/, '3–24 characters: lowercase letters, numbers or _.'),
  preferred_campus: z.enum(['SGW', 'LOY'], { message: 'Pick your main campus.' }),
  bio: z.string().trim().max(280, 'Keep your bio under 280 characters.').optional(),
});

export type ProfileInput = z.infer<typeof profileInputSchema>;

export type Profile = {
  id: string;
  username: string | null;
  display_name: string;
  bio: string | null;
  preferred_campus: CampusCode | null;
};

/** First error message per field, for showing under inputs. */
export function fieldErrors(error: z.ZodError) {
  const out: Partial<Record<keyof ProfileInput, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as keyof ProfileInput;
    out[key] ??= issue.message;
  }
  return out;
}
