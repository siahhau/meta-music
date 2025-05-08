'use client';
import { ProfileCover } from 'src/sections/user/profile-cover';

// ----------------------------------------------------------------------

export function ProfileCoverClient({ role, name, coverUrl, avatarUrl }) {
  return <ProfileCover role={role} name={name} coverUrl={coverUrl} avatarUrl={avatarUrl} />;
}
