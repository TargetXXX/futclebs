import { api } from "@/services/axios";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Spin } from "antd";
import JoinOrganizationModal from "@/components/modals/organization/JoinOrganizationModal";
import { UniversalNavbar } from "@/components/layout/UniversalNavbar";

interface Organization {
  id: number;
  name: string;
  description?: string;
  stats?: { overall?: number };
  is_admin?: boolean;
}

export default function DashboardHome() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinOpen, setJoinOpen] = useState(false);
  const navigate = useNavigate();

  const fetchMyOrgs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/me/organizations");
      setOrganizations(data || []);
    } catch (err) {
      console.error(err);
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyOrgs();
  }, [fetchMyOrgs]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <UniversalNavbar />

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Seu Dashboard</h1>
            <p className="text-slate-400 mt-2">Gerencie suas organizações e acompanhe seu desempenho.</p>
          </div>

          <div className="flex gap-3">
            <Button onClick={() => setJoinOpen(true)} className="rounded-2xl bg-emerald-500 text-white" type="primary">
              ➕ Entrar em Organização
            </Button>

            <Button onClick={() => navigate("/organizations")} className="rounded-2xl" >
              Explorar organizações
            </Button>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="text-center py-20 text-slate-400">
            <Spin />
          </div>
        ) : (
          <>
            {/* Empty State */}
            {organizations.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/60 border border-slate-800 rounded-3xl">
                <h2 className="text-xl font-semibold mb-3">Você ainda não participa de nenhuma organização</h2>
                <p className="text-slate-400 mb-6">Entre em uma organização para começar a jogar e subir no ranking.</p>

                <div className="flex items-center justify-center gap-3">
                  <Button onClick={() => setJoinOpen(true)} className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 transition font-semibold shadow-lg shadow-emerald-500/20">
                    Buscar Organizações
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {organizations.map((org) => (
                  <div key={org.id}
                    onClick={() => navigate(`/dashboard/org/${org.id}`)}
                    className="cursor-pointer bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 group">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-semibold group-hover:text-emerald-400 transition">{org.name}</h3>
                      {org.stats?.overall !== undefined && (
                        <div className="px-3 py-1 text-sm rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
                          {org.stats.overall}
                        </div>
                      )}
                    </div>

                    <p className="text-slate-400 text-sm leading-relaxed">{org.description || "Sem descrição disponível."}</p>

                    <div className="mt-6 text-sm text-emerald-400 opacity-0 group-hover:opacity-100 transition">
                      Entrar →
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <JoinOrganizationModal
          visible={joinOpen}
          onClose={() => setJoinOpen(false)}
          onJoined={async () => {
            await fetchMyOrgs();
          }}
        />
      </div>
    </div>
  );
}
