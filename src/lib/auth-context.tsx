"use client";

import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { api, APIError, CurrentUserResponse, UserView, UserAccountView } from "./api";

type CredentialType = "user" | "api_key" | null;
const TOKEN_STORAGE_KEY = "mailhost_token";

interface AuthContextType {
  token: string | null;
  user: UserView | null;
  account: UserAccountView | null;
  accounts: UserAccountView[];
  credentialType: CredentialType;
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
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserView | null>(null);
  const [account, setAccount] = useState<UserAccountView | null>(null);
  const [accounts, setAccounts] = useState<UserAccountView[]>([]);
  const [credentialType, setCredentialType] = useState<CredentialType>(null);
  const [isLoading, setIsLoading] = useState(true);
  const activeToken = useRef<string | null>(null);
  const authRevision = useRef(0);

  const clearAuthState = (redirect: boolean) => {
    authRevision.current += 1;
    activeToken.current = null;
    api.setToken(null);
    setToken(null);
    setUser(null);
    setAccount(null);
    setAccounts([]);
    setCredentialType(null);
    setIsLoading(false);
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // Storage can be unavailable in restricted browser contexts.
    }
    if (redirect && typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.assign("/login?session_expired=1");
    }
  };

  const applyIdentity = (identity: CurrentUserResponse) => {
    if (identity.object === "user" && identity.id && identity.email) {
      const currentUser: UserView = {
        id: identity.id,
        email: identity.email,
        name: identity.name || "",
        avatar_url: identity.avatar_url,
        email_verified: identity.email_verified ?? false,
        created_at: identity.created_at || new Date().toISOString(),
      };
      setUser(currentUser);
      setAccount(identity.current_account || null);
      setAccounts(identity.accounts || []);
      setCredentialType("user");
      return;
    }

    if (identity.object === "account_info" && identity.account) {
      const currentAccount: UserAccountView = {
        ...identity.account,
        role: "API key",
      };
      setUser({
        id: `api-key-${currentAccount.id}`,
        email: "",
        name: "API key access",
        email_verified: true,
        created_at: currentAccount.created_at,
      });
      setAccount(currentAccount);
      setAccounts([]);
      setCredentialType("api_key");
      return;
    }

    throw new Error("The server returned an unsupported authentication identity.");
  };

  const verifyAndStoreToken = async (
    candidate: string,
    options: { persist?: boolean; showLoading?: boolean } = {}
  ) => {
    const revision = ++authRevision.current;
    const previousToken = activeToken.current;
    api.setToken(candidate);
    if (options.showLoading !== false) setIsLoading(true);

    try {
      const identity = await api.getMe();
      if (revision !== authRevision.current) return;
      applyIdentity(identity);
      activeToken.current = candidate;
      setToken(candidate);
      if (options.persist !== false) {
        try {
          localStorage.setItem(TOKEN_STORAGE_KEY, candidate);
        } catch {
          console.warn("Could not persist the authentication token in this browser.");
        }
      }
    } catch (err) {
      if (revision === authRevision.current) {
        activeToken.current = previousToken;
        api.setToken(previousToken);
      }
      throw err;
    } finally {
      if (revision === authRevision.current && options.showLoading !== false) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    const handleUnauthorized = (failedToken: string) => {
      if (!activeToken.current || failedToken !== activeToken.current) return;
      console.warn("The active credential was revoked or expired.");
      clearAuthState(true);
    };

    api.setOnUnauthorized(handleUnauthorized);

    let savedToken: string | null = null;
    try {
      savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      console.warn("Could not read the authentication token from browser storage.");
    }
    if (savedToken) {
      activeToken.current = savedToken;
      void verifyAndStoreToken(savedToken).catch((err) => {
        if (!(err instanceof APIError && err.status === 401)) {
          console.error("Could not restore the saved authentication session", err);
        }
      });
    } else {
      setIsLoading(false);
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== TOKEN_STORAGE_KEY) return;
      if (!event.newValue) {
        clearAuthState(false);
        return;
      }
      activeToken.current = event.newValue;
      void verifyAndStoreToken(event.newValue).catch((err) => {
        if (!(err instanceof APIError && err.status === 401)) {
          console.error("Could not synchronize the authentication session", err);
        }
      });
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      api.setOnUnauthorized(undefined);
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password });
      activeToken.current = res.token;
      setToken(res.token);
      api.setToken(res.token);
      setUser(res.user);
      setAccount(res.current_account);
      setAccounts(res.accounts || []);
      setCredentialType("user");
      try {
        localStorage.setItem(TOKEN_STORAGE_KEY, res.token);
      } catch {
        console.warn("Could not persist the authentication token in this browser.");
      }
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
      activeToken.current = res.token;
      setToken(res.token);
      api.setToken(res.token);
      setUser(res.user);
      setAccount(res.account);
      setAccounts([res.account]);
      setCredentialType("user");
      try {
        localStorage.setItem(TOKEN_STORAGE_KEY, res.token);
      } catch {
        console.warn("Could not persist the authentication token in this browser.");
      }
      return res.api_key;
    } finally {
      setIsLoading(false);
    }
  };

  const connectWithKey = async (key: string) => {
    const trimmed = key.trim();
    if (!trimmed) throw new Error("Enter an API key to continue.");
    await verifyAndStoreToken(trimmed);
  };

  const switchAccount = async (accountId: string) => {
    const res = await api.switchAccount(accountId);
    setAccount(res.current_account);
    setAccounts((current) =>
      current.map((item) => item.id === res.current_account.id ? res.current_account : item)
    );
  };

  const logout = async () => {
    try {
      if (credentialType === "user" && activeToken.current) {
        await api.logout();
      }
    } catch (err) {
      console.warn("Backend logout notification warning:", err);
    } finally {
      clearAuthState(false);
      if (typeof window !== "undefined") {
        window.location.assign("/login?logout=1");
      }
    }
  };

  const refresh = async () => {
    if (activeToken.current) {
      try {
        await verifyAndStoreToken(activeToken.current, { persist: false, showLoading: false });
      } catch (err) {
        console.error("Failed to refresh the current authentication identity", err);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        account,
        accounts,
        credentialType,
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
