import React from 'react';

// Mock AuthContext for frontend-only mode
// Provides stable values and no-op methods so pages render without a backend
export type Role = 'admin' | 'tenant' | null;

interface AuthContextType {
  user: { id: string; email: string } | null;
  session: any;
  userRole: Role;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>
}

const defaultValue: AuthContextType = {
  user: { id: 'mock-user', email: 'mock@yorent.com' },
  session: null,
  userRole: 'admin',
  loading: false,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  signUp: async () => ({ error: null }),
};

const AuthContext = React.createContext<AuthContextType>(defaultValue);

export const useAuth = () => React.useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // In frontend-only mode, just provide mock values
  return (
    <AuthContext.Provider value={defaultValue}>
      {children}
    </AuthContext.Provider>
  );
};
