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
  avatarUrl: string | null;
  bio: string;
}

/** What the プロフィール設定 screen can change. */
export interface ProfileUpdate {
  displayName: string;
  bio: string;
  avatarUrl: string | null;
}

/** Public part of a creator's profile, shown to visitors (作者について). */
export interface AuthorProfile {
  avatarUrl: string | null;
  bio: string;
}
