"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("http://localhost:5000/me", {
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
        // network error — treat as unauthenticated
      }
      setIsAuthenticated(false);
      router.replace("/login");
    };
    check();
  }, [router]);

  return isAuthenticated;
}