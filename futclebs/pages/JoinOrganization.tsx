import { api } from "@/services/axios";
import { ArrowLeftOutlined, LockOutlined, SearchOutlined, TeamOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Empty, Flex, Input, Layout, List, Space, Tag, Typography, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

interface OrganizationOption {
  id: number;
  name: string;
  description?: string | null;
  active?: boolean;
}

const { Title, Text } = Typography;
const { Content } = Layout;

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
      await api.post(`/me/organizations/${selectedOrg.id}/join`, { password });
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
    <Layout style={{ minHeight: "100vh", background: "transparent" }}>
      {contextHolder}
      <Content style={{ maxWidth: 920, margin: "0 auto", width: "100%", padding: "28px 16px 40px" }}>
        <Space style={{ marginBottom: 14 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/dashboard")}>Voltar</Button>
          <Tag color="blue">Acesso por convite</Tag>
        </Space>

        <Card style={{ borderRadius: 20, marginBottom: 14 }}>
          <Space direction="vertical" size={2}>
            <Title level={2} style={{ marginBottom: 0 }}>Entrar em organização</Title>
            <Text type="secondary">Pesquise o grupo e informe a senha para liberar seu acesso.</Text>
          </Space>
          <Input
            size="large"
            style={{ marginTop: 16 }}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquisar por nome ou descrição"
            prefix={<SearchOutlined />}
          />
        </Card>

        <Card title="Organizações disponíveis" style={{ borderRadius: 20 }} loading={loading}>
          {filtered.length === 0 ? (
            <Empty description="Nenhuma organização encontrada" />
          ) : (
            <List
              dataSource={filtered}
              renderItem={(org) => {
                const isSelected = selectedOrg?.id === org.id;
                return (
                  <List.Item>
                    <Card
                      size="small"
                      onClick={() => (org.active === false ? null : setSelectedOrg(org))}
                      style={{
                        width: "100%",
                        cursor: org.active === false ? "not-allowed" : "pointer",
                        borderRadius: 14,
                        borderColor: isSelected ? "#34d399" : undefined,
                      }}
                    >
                      <Flex justify="space-between" align="center">
                        <Space>
                          <TeamOutlined />
                          <div>
                            <div style={{ fontWeight: 600 }}>{org.name}</div>
                            <Text type="secondary">{org.description || "Sem descrição"}</Text>
                          </div>
                        </Space>
                        {org.active === false ? <Tag color="red">Inativa</Tag> : <Tag color="green">Ativa</Tag>}
                      </Flex>
                    </Card>
                  </List.Item>
                );
              }}
            />
          )}
        </Card>

        {selectedOrg && (
          <Card style={{ borderRadius: 20, marginTop: 14 }}>
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              <Alert
                type="info"
                showIcon
                message={`Você selecionou: ${selectedOrg.name}`}
                description="Digite a senha da organização para solicitar entrada."
              />

              <Input.Password
                size="large"
                prefix={<LockOutlined />}
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
      </Content>
    </Layout>
  );
}
