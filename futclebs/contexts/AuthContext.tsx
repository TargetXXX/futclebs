import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "@/services/axios";

interface Player {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  primary_position?: string;
  secondary_position?: string;
}

interface AuthContextData {
  player: Player | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  updatePlayer: (data: Partial<Player>) => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  // Sincroniza o estado do player com o LocalStorage sempre que ele mudar
  useEffect(() => {
    if (player) {
      localStorage.setItem("@app:player", JSON.stringify(player));
    } else {
      localStorage.removeItem("@app:player");
    }
  }, [player]);

  const setToken = (token: string | null) => {
    if (token) {
      localStorage.setItem("token", token);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("@app:player"); // Limpa o player se o token cair
      delete api.defaults.headers.common["Authorization"];
    }
  };

  const loadUser = async () => {
    try {
      const { data } = await api.get("/auth/me");
      setPlayer(data);
    } catch (error) {
      logout(); // Se falhar na API, desloga por segurança
    } finally {
      setLoading(false);
    }
  };

  const login = async (token: string) => {
    setToken(token);
    await loadUser();
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // erro ignorado
    }
    setPlayer(null);
    setToken(null);
  };

  const updatePlayer = (data: Partial<Player>) => {
    setPlayer((prev) => (prev ? { ...prev, ...data } : prev));
  };

  /* 
     Fluxo de inicialização:
     1. Lê o Player do Cache (rápido)
     2. Valida com a API (atualiza os dados)
  */
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedPlayer = localStorage.getItem("@app:player");

    if (token) {
      setToken(token);
      
      // Carregamento otimista: define o que está no cache primeiro
      if (storedPlayer) {
        setPlayer(JSON.parse(storedPlayer));
      }
      
      // Atualiza em background
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ player, loading, login, logout, updatePlayer }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
