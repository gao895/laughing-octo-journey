export interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

/** Minimal signed-in user info shared by Supabase Auth and demo mode. */
export interface AppUser {
  id: string;
  email: string;
  displayName: string;
}
