"use client";

import { useEffect, useState } from "react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/me`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if ("emailAddress" in data) {
            setIsAuthenticated(true);
            return;
          }
        }
      } catch {
        // network error
      }
      setIsAuthenticated(false);
    };
    check();
  }, []);

  return isAuthenticated;
}