import React, { useEffect, useMemo, useState } from "react";
import { Modal, Input, List, Button, Spin, message } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { api, Organization } from "@/services/axios";

export type OrgItem = {
  id: number;
  name: string;
  description?: string;
  is_admin?: boolean;
  stats?: {
    overall?: number;
  };
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onJoined: () => Promise<void>; // callback para atualizar orgs do usuário
};

export const JoinOrganizationModal: React.FC<Props> = ({
  visible,
  onClose,
  onJoined,
}) => {
  const [allOrgs, setAllOrgs] = useState<OrgItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<OrgItem | null>(null);
  const [password, setPassword] = useState("");
  const [joining, setJoining] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      fetchAllOrgs();
      // reset selection on open
      setSelectedOrg(null);
      setPassword("");
      setSearch("");
    }
  }, [visible]);

  const fetchAllOrgs = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const { data } = await api.get("/organizations");
      setAllOrgs(data || []);
    } catch (err: any) {
      console.error("Erro ao buscar orgs:", err);
      setFetchError("Erro ao carregar organizações");
      setAllOrgs([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search) return allOrgs;
    return allOrgs.filter((o) =>
      o.name.toLowerCase().includes(search.trim().toLowerCase())
    );
  }, [allOrgs, search]);

  const handleSelectOrg = (org: OrgItem) => {
    setSelectedOrg(org);
    setPassword("");
  };

  const handleJoin = async () => {
    if (!selectedOrg) return;
    if (!password.trim()) {
      message.error("Informe a senha da organização");
      return;
    }

    setJoining(true);
    try {
      await api.post(`/me/organizations/${selectedOrg.id}/join`, {
        password,
      });

      message.success(`Você entrou na organização ${selectedOrg.name}`);
      // atualiza orgs do usuário (callback do parent)
      await onJoined();
      onClose();
    } catch (err: any) {
      console.error("Erro ao entrar na org:", err);
      const msg =
        err.response?.data?.message ||
        "Erro ao entrar — verifique a senha e tente novamente";
      message.error(msg);
    } finally {
      setJoining(false);
    }
  };

  return (
    <Modal
      title="Entrar em Organização"
      open={visible}
      onCancel={() => onClose()}
      footer={null}
      width={820}
      className="ant-modal-overflow-visible"
    >
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: Search + List */}
        <div>
          <div className="mb-3">
            <Input
              prefix={<SearchOutlined />}
              placeholder="Pesquisar organizações por nome"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
          </div>

          {loading ? (
            <div className="py-10 flex items-center justify-center">
              <Spin />
            </div>
          ) : fetchError ? (
            <div className="text-red-400 py-6">{fetchError}</div>
          ) : (
            <List
              itemLayout="vertical"
              size="small"
              dataSource={filtered}
              style={{ maxHeight: 420, overflowY: "auto" }}
              renderItem={(org: Organization) => (
                <List.Item
                  key={org.id}
                  onClick={() => handleSelectOrg(org)}
                  className={`p-4 rounded-xl cursor-pointer transition border ${
                    selectedOrg?.id === org.id
                      ? "border-emerald-500/40 bg-emerald-500/6"
                      : "border-slate-800/30 hover:border-slate-700"
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="text-white font-semibold text-lg">
                        {org.name}
                      </div>
                      <div className="text-slate-400 text-sm mt-1">
                        {org.description || "Sem descrição"}
                      </div>
                    </div>

                    
                  </div>
                </List.Item>
              )}
            />
          )}
        </div>

        {/* Right: Selected & Password */}
        <div className="flex flex-col">
          {selectedOrg ? (
            <>
              <div className="mb-4">
                <h3 className="text-xl font-semibold">{selectedOrg.name}</h3>
                <p className="text-slate-400 mt-2">{selectedOrg.description}</p>
                {selectedOrg.stats && (
                  <div className="mt-4 text-sm text-emerald-400 font-medium">
                    Overall: {selectedOrg.stats.overall ?? "-"}
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="text-sm text-slate-400 block mb-2">
                  Senha da organização
                </label>
                <Input.Password
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="mt-auto flex gap-3">
                <Button onClick={() => { setSelectedOrg(null); setPassword(""); }}>
                  Voltar
                </Button>

                <Button
                  type="primary"
                  loading={joining}
                  onClick={handleJoin}
                  className="bg-emerald-500 border-emerald-500"
                >
                  Entrar na organização
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
              <p className="mb-3">Selecione uma organização à esquerda</p>
              <div className="text-xs">Ou use a busca para filtrar</div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default JoinOrganizationModal;
