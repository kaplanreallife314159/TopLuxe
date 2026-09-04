'use client';

import { createContext, useContext, ReactNode } from 'react';

interface PiAuthContextType {
  isAuthenticated: boolean;
  user: any | null;
}

const PiAuthContext = createContext<PiAuthContextType | undefined>(undefined);

export function PiAuthProvider({ children }: { children: ReactNode }) {
  return (
    <PiAuthContext.Provider value={{ isAuthenticated: false, user: null }}>
      {children}
    </PiAuthContext.Provider>
  );
}

export function usePiAuth() {
  const context = useContext(PiAuthContext);
  if (!context) {
    throw new Error('usePiAuth must be used within PiAuthProvider');
  }
  return context;
}