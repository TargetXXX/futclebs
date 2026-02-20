import { api } from "@/services/axios";
import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

interface PrivateRouteProps {
  children: ReactNode;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setAuthenticated(false);
        setLoading(false);
        return;
      }

      try {
        await api.get("/auth/me");
        setAuthenticated(true);
      } catch {
        localStorage.removeItem("token");
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) return <p>Carregando...</p>;

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
