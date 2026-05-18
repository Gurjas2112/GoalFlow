import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '../lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
  departmentId?: string;
  managerId?: string;
  department?: { id: string; name: string };
  mustChangePassword?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isRole: (role: string) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  logout: () => {},
  isRole: () => false,
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // Lazy initializer reads the saved token once during the first render
  // (avoids calling setState() synchronously inside an effect).
  const [token, setToken] = useState<string | null>(
    () => (typeof window !== 'undefined' ? localStorage.getItem('goalflow_token') : null),
  );
  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('goalflow_token');
  });

  useEffect(() => {
    if (!token) return;
    api
      .get('/auth/me')
      .then((res) => {
        setUser(res.data);
      })
      .catch(() => {
        localStorage.removeItem('goalflow_token');
        localStorage.removeItem('goalflow_user');
        setToken(null);
      })
      .finally(() => setLoading(false));
    // We intentionally only react to token changes from login/logout below;
    // initial token comes from the lazy initializer above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('goalflow_token', newToken);
    localStorage.setItem('goalflow_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('goalflow_token');
    localStorage.removeItem('goalflow_user');
    setToken(null);
    setUser(null);
  };

  const isRole = (role: string) => user?.role === role;

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch {
      // ignore; token check will run on next mount
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isRole, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
