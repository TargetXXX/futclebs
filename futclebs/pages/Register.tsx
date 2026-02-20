import { AuthCard } from "@/components/auth/AuthCard";
import { api } from "@/services/axios";
import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type PositionValue = "GOLEIRO" | "DEFENSOR" | "MEIO CAMPO" | "ATACANTE";

const positionOptions: { label: string; value: PositionValue }[] = [
  { label: "Goleiro", value: "GOLEIRO" },
  { label: "Defensor", value: "DEFENSOR" },
  { label: "Meio campo", value: "MEIO CAMPO" },
  { label: "Atacante", value: "ATACANTE" },
];

const formatPhone = (raw: string) => raw.replace(/\D/g, "").slice(0, 11);

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [primaryPosition, setPrimaryPosition] = useState<PositionValue>("ATACANTE");
  const [secondaryPosition, setSecondaryPosition] = useState<PositionValue>("MEIO CAMPO");
  const [isGoalkeeper, setIsGoalkeeper] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordStrength = useMemo(() => {
    if (password.length >= 10) return "forte";
    if (password.length >= 6) return "média";
    return "fraca";
  }, [password]);

  const submitRegister = async (event: FormEvent) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data } = await api.post("/auth/register", {
        name: name.trim(),
        username: username.trim(),
        email: email.trim() || null,
        phone: formatPhone(phone),
        password,
        primary_position: primaryPosition,
        secondary_position: secondaryPosition,
        birthdate: birthdate || null,
        is_goalkeeper: isGoalkeeper,
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.player));
      navigate("/dashboard");
    } catch (requestError: any) {
      setError(requestError.response?.data?.message ?? "Não foi possível concluir o cadastro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020b22] px-4 py-10">
      <AuthCard
        title="Crie sua conta"
        subtitle="Cadastro inteligente para entrar nas organizações e começar a jogar."
      >
        <form onSubmit={submitRegister} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nome completo"
              className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 text-white text-sm"
              required
            />
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Nome de usuário"
              className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 text-white text-sm"
              required
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email (opcional)"
              className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 text-white text-sm"
            />
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(formatPhone(event.target.value))}
              placeholder="Telefone (DDD + número)"
              className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 text-white text-sm"
              required
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <select
              value={primaryPosition}
              onChange={(event) => setPrimaryPosition(event.target.value as PositionValue)}
              className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 text-white text-sm"
              required
            >
              {positionOptions.map((position) => (
                <option key={`primary-${position.value}`} value={position.value}>
                  Posição principal: {position.label}
                </option>
              ))}
            </select>

            <select
              value={secondaryPosition}
              onChange={(event) => setSecondaryPosition(event.target.value as PositionValue)}
              className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 text-white text-sm"
              required
            >
              {positionOptions.map((position) => (
                <option key={`secondary-${position.value}`} value={position.value}>
                  Posição secundária: {position.label}
                </option>
              ))}
            </select>
          </div>

          <input
            type="date"
            value={birthdate}
            onChange={(event) => setBirthdate(event.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 text-white text-sm"
          />

          <label className="flex items-center gap-3 rounded-xl border border-slate-700 px-4 py-3 bg-slate-800/40 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={isGoalkeeper}
              onChange={() => setIsGoalkeeper((current) => !current)}
              className="accent-emerald-500"
            />
            Também jogo como goleiro
          </label>

          <div className="grid sm:grid-cols-2 gap-3">
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Senha"
              className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 text-white text-sm"
              required
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirmar senha"
              className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 text-white text-sm"
              required
            />
          </div>

          <p className="text-xs text-slate-400">Força da senha: <span className="font-bold text-emerald-400">{passwordStrength}</span></p>

          {error && <div className="text-red-300 text-sm bg-red-500/10 border border-red-400/20 p-3 rounded-xl">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#021125] font-black uppercase tracking-wider disabled:opacity-50"
          >
            {loading ? "Criando conta..." : "Criar conta"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          Já tem conta?{" "}
          <button onClick={() => navigate("/login")} className="text-emerald-400 font-semibold">
            Fazer login
          </button>
        </div>
      </AuthCard>
    </div>
  );
}
