'use client';

import { useAdminAutoLogout } from '@/hooks/useAdminAutoLogout';

export default function AdminAutoLogoutHandler() {
  useAdminAutoLogout();
  return null; // This component doesn't render anything
}