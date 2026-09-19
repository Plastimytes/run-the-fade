import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { adminApi, setAdminToken } from './api.js';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!localStorage.getItem('rtf_admin_token')) {
      setAdmin(null);
      setLoading(false);
      return;
    }
    try {
      const data = await adminApi.getMe();
      setAdmin(data.admin);
    } catch {
      setAdminToken(null);
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = async (email, password) => {
    const data = await adminApi.login({ email, password });
    setAdminToken(data.token);
    setAdmin(data.admin);
  };

  const logout = () => {
    setAdminToken(null);
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}