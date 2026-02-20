import { AuthCard } from "@/components/auth/AuthCard";
import { api } from "@/services/axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: FormDataEvent) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      const response = await api.post("/auth/login", {
        phone,
        password,
      });

      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      navigate("/dashboard");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Erro ao fazer login"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      <AuthCard
        title="Bem-vindo de volta"
        subtitle="Entre na sua conta para acessar suas organizações e partidas"
      >
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Telefone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              placeholder="44999999999"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              placeholder="••••••••"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-slate-400">
          Não tem conta?{" "}
          <button
            onClick={() => navigate("/register")}
            className="text-emerald-400 hover:text-emerald-300 font-medium transition"
          >
            Criar conta
          </button>
        </div>
      </AuthCard>
    </div>
  );
}
