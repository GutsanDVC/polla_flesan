// Augment types of nuxt-auth-utils session
import type { UserRole, UserStatus } from './domain';

declare module '#auth-utils' {
  interface User {
    id: string
    email: string
    fullName: string
    avatarUrl: string | null
    role: UserRole
    status: UserStatus
  }

  interface UserSession {
    user: User
  }
}

export {}
