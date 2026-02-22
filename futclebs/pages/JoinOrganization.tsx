import { api } from "@/services/axios";
import { ArrowLeftOutlined, LockOutlined, SearchOutlined, TeamOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Empty, Input, List, Space, Tag, Typography, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

interface OrganizationOption {
  id: number;
  name: string;
  description?: string | null;
  active?: boolean;
}

const { Title, Text } = Typography;

export default function JoinOrganization() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [search, setSearch] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<OrganizationOption | null>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/organizations");
        const payload = data?.data ?? data ?? [];
        setOrganizations(payload as OrganizationOption[]);
      } catch {
        messageApi.error("Não foi possível carregar as organizações.");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [messageApi]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return organizations;

    return organizations
      .filter((org) => [org.name, org.description ?? ""].join(" ").toLowerCase().includes(term))
      .sort((a, b) => {
        const aScore = a.active === false ? 1 : 0;
        const bScore = b.active === false ? 1 : 0;
        if (aScore !== bScore) return aScore - bScore;
        return a.name.localeCompare(b.name);
      });
  }, [organizations, search]);

  const handleJoin = async () => {
    if (!selectedOrg || !password.trim()) return;

    setJoining(true);
    try {
      await api.post(`/me/organizations/${selectedOrg.id}/join`, {
        password,
      });

      messageApi.success(`Agora você faz parte da organização ${selectedOrg.name}!`);
      setSelectedOrg(null);
      setPassword("");
    } catch {
      messageApi.error("Senha incorreta ou acesso indisponível.");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {contextHolder}
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/dashboard")}>Voltar</Button>
          <Tag color="blue">Acesso por convite</Tag>
        </Space>

        <Card className="!rounded-3xl !border-slate-700 !bg-slate-900/80">
          <Space direction="vertical" size={2}>
            <Title level={2} className="!mb-0 !text-white">Entrar em organização</Title>
            <Text className="!text-slate-300">
              Procure o grupo, selecione e informe a senha para desbloquear o acesso ao painel da organização.
            </Text>
          </Space>

          <Input
            size="large"
            className="mt-5"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquisar por nome ou descrição"
            prefix={<SearchOutlined className="text-slate-400" />}
          />
        <Text className="!text-slate-400">Mostrando primeiro organizações ativas para facilitar sua escolha.</Text>
        </Card>

        <Card
          title={<span className="text-white">Organizações disponíveis</span>}
          className="!rounded-3xl !border-slate-700 !bg-slate-900/70"
          loading={loading}
        >
          {filtered.length === 0 ? (
            <Empty description="Nenhuma organização encontrada" />
          ) : (
            <List
              dataSource={filtered}
              renderItem={(org) => {
                const isSelected = selectedOrg?.id === org.id;
                return (
                  <List.Item>
                    <div
                      onClick={() => org.active === false ? null : setSelectedOrg(org)}
                      className={`w-full cursor-pointer rounded-2xl border p-4 transition-all ${
                        isSelected
                          ? "border-emerald-500/50 bg-emerald-500/10"
                          : "border-slate-700 bg-slate-800/60 hover:border-sky-500/50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <Space>
                          <TeamOutlined className="text-cyan-300" />
                          <div>
                            <div className="font-semibold text-white">{org.name}</div>
                            <div className="text-slate-300 text-xs">{org.description || "Sem descrição"}</div>
                          </div>
                        </Space>
                        {org.active === false ? <Tag color="red">Inativa</Tag> : <Tag color="green">Ativa</Tag>}
                      </div>
                    </div>
                  </List.Item>
                );
              }}
            />
          )}
        </Card>

        {selectedOrg && (
          <Card className="!rounded-3xl !border-emerald-500/30 !bg-emerald-500/10">
            <Space direction="vertical" className="w-full" size="middle">
              <Alert
                type="info"
                showIcon
                message={`Você selecionou: ${selectedOrg.name}`}
                description="Digite a senha da organização para solicitar entrada."
              />

              <Input.Password
                size="large"
                prefix={<LockOutlined className="text-slate-400" />}
                placeholder="Senha da organização"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />

              <Button type="primary" size="large" loading={joining} disabled={!password.trim() || selectedOrg.active === false} onClick={handleJoin}>
                Entrar na organização
              </Button>
            </Space>
          </Card>
        )}
      </div>
    </div>
  );
}
