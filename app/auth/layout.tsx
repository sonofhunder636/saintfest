'use client';

import { SimpleAuthProvider } from "@/contexts/SimpleAuthContext";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SimpleAuthProvider>
      {children}
    </SimpleAuthProvider>
  );
}