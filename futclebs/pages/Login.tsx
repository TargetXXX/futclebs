import { AuthCard } from "@/components/auth/AuthCard";
import { api } from "@/services/axios";
import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.post("/auth/login", { phone, password });
      const { token, player } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(player));
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-[#071a3c] px-4 py-10 flex items-center justify-center">
      <AuthCard title="Bem-vindo de volta" subtitle="Acesse sua conta para continuar sua evolução nas organizações.">
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">Telefone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="44999999999"
              className="w-full rounded-xl border border-slate-600/70 bg-slate-950/60 px-4 py-3 text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-600/70 bg-slate-950/60 px-4 py-3 text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
            />
          </div>

          {error && <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-500 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-300">
          Não tem conta?{" "}
          <button onClick={() => navigate("/register")} className="font-semibold text-emerald-300 hover:text-emerald-200">
            Criar conta
          </button>
        </div>
      </AuthCard>
    </div>
  );
}
