"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserSession } from "../types";

interface AuthContextType {
  user: UserSession | null;
  login: (employeeId: string, pass: string) => boolean;
  logout: () => void;
  isLoading: boolean;
}

const AUTH_KEY = "medsim_auth_v1";

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => false,
  logout: () => {},
  isLoading: true
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to parse stored auth", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (employeeId: string, pass: string): boolean => {
    if (employeeId.trim() === "demo" && pass.trim() === "demo123") {
      const session: UserSession = {
        employeeId: "demo",
        name: "Medical Student / Trainee",
        role: "Educational Simulator User",
        isLoggedIn: true
      };
      setUser(session);
      localStorage.setItem(AUTH_KEY, JSON.stringify(session));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
