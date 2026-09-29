"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, UserView, UserAccountView } from "./api";

interface AuthContextType {
  token: string | null;
  user: UserView | null;
  account: UserAccountView | null;
  accounts: UserAccountView[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name?: string,
    organizationName?: string
  ) => Promise<string | undefined>;
  connectWithKey: (key: string) => Promise<void>;
  switchAccount: (accountId: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserView | null>(null);
  const [account, setAccount] = useState<UserAccountView | null>(null);
  const [accounts, setAccounts] = useState<UserAccountView[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage or default credentials
  useEffect(() => {
    const savedToken = localStorage.getItem("mailhost_token");
    if (savedToken) {
      setToken(savedToken);
      api.setToken(savedToken);
      fetchCurrentUser(savedToken);
    } else {
      // Auto-connect with default admin account if available, or try to login
      const defaultKey = "re_usr_298dae053010c4ef32c57b6c885dbe1a5951842426daeac0345d6b36bb77e211";
      localStorage.setItem("mailhost_token", defaultKey);
      setToken(defaultKey);
      api.setToken(defaultKey);
      fetchCurrentUser(defaultKey);
    }
  }, []);

  const fetchCurrentUser = async (tok: string) => {
    try {
      if (tok.startsWith("re_usr_")) {
        const res = await api.getMe();
        setUser(res.user);
        setAccount(res.current_account);
        setAccounts(res.accounts || []);
      } else {
        // Plain API key
        setUser({
          id: "api-key-user",
          email: "api-key@resend.local",
          name: "API Key User",
          email_verified: true,
          created_at: new Date().toISOString(),
        });
        setAccount({
          id: "primary-account",
          name: "Primary Team",
          role: "administrator",
          created_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn("Could not fetch current user session, falling back to minimal state", err);
      // Fallback account info
      setAccount({
        id: "default-account",
        name: "Acme Corp",
        role: "administrator",
        created_at: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password });
      setToken(res.token);
      localStorage.setItem("mailhost_token", res.token);
      api.setToken(res.token);
      setUser(res.user);
      setAccount(res.current_account);
      setAccounts(res.accounts || []);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    name?: string,
    organizationName?: string
  ): Promise<string | undefined> => {
    setIsLoading(true);
    try {
      const res = await api.register({
        email,
        password,
        name,
        organization_name: organizationName,
      });
      setToken(res.token);
      localStorage.setItem("mailhost_token", res.token);
      api.setToken(res.token);
      setUser(res.user);
      setAccount(res.account);
      setAccounts([res.account]);
      return res.api_key;
    } finally {
      setIsLoading(false);
    }
  };

  const connectWithKey = async (key: string) => {
    setIsLoading(true);
    try {
      const trimmed = key.trim();
      setToken(trimmed);
      localStorage.setItem("mailhost_token", trimmed);
      api.setToken(trimmed);
      await fetchCurrentUser(trimmed);
    } finally {
      setIsLoading(false);
    }
  };

  const switchAccount = async (accountId: string) => {
    try {
      const res = await api.switchAccount(accountId);
      setToken(res.token);
      localStorage.setItem("mailhost_token", res.token);
      api.setToken(res.token);
      setAccount(res.account);
    } catch (err) {
      console.error("Failed to switch account", err);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setAccount(null);
    setAccounts([]);
    localStorage.removeItem("mailhost_token");
    api.setToken(null);
  };

  const refresh = async () => {
    if (token) {
      await fetchCurrentUser(token);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        account,
        accounts,
        isLoading,
        login,
        register,
        connectWithKey,
        switchAccount,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
