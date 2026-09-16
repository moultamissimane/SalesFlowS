import { UserRole } from '../types';

/**
 * Static list mirroring the accounts the backend's DemoDataSeeder creates on first boot.
 * Used only for the "quick demo login" picker in AuthModal - real auth still goes through
 * POST /api/v1/auth/login against the real database, this just pre-fills known demo credentials
 * (all seeded accounts share the same demo password).
 */
export interface DemoPersona {
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
}

export const DEMO_PASSWORD = 'Passw0rd!';

export const DEMO_PERSONAS: DemoPersona[] = [
  {
    name: 'Karim Bennani',
    email: 'k.bennani@salesflow.ma',
    role: 'ADMIN',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: 'Youssef El Alami',
    email: 'y.elalami@salesflow.ma',
    role: 'SALES_MANAGER',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: 'Sofia Chraibi',
    email: 's.chraibi@salesflow.ma',
    role: 'SALES_AGENT',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: 'Amine Tazi',
    email: 'a.tazi@salesflow.ma',
    role: 'SALES_AGENT',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
];
