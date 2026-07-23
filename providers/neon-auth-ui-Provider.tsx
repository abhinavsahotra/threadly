'use client'

import { createAuthClient } from '@neondatabase/auth/next';
import { NeonAuthUIProvider } from '@neondatabase/auth-ui';

const authClient = createAuthClient();

export function NeonAuthProviders({ children }: { children: React.ReactNode }) {
  return (
    <NeonAuthUIProvider
      authClient={authClient}
      defaultTheme="dark"
      social={{
        providers: ['google', 'github', 'vercel'],
      }}
    >
      {children}
    </NeonAuthUIProvider>
  );
}