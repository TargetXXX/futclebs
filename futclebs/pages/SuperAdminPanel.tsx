import { UniversalNavbar } from "@/components/layout/UniversalNavbar";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/axios";
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Layout,
  Row,
  Space,
  Statistic,
  Switch,
  Tabs,
  Tag,
  Typography,
  message,
} from "antd";
import {
  LockOutlined,
  PlusCircleOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

const { Content } = Layout;
const { Title, Text } = Typography;

interface CreateOrgForm {
  name: string;
  description?: string;
  password: string;
  admin_player_id: number;
}

interface ResetPasswordForm {
  player_id: number;
  password: string;
}

interface PlayerLookupResult {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  is_admin?: boolean;
}

export default function SuperAdminPanel() {
  const navigate = useNavigate();
  const { player } = useAuth();
  const canAccess = useMemo(() => Boolean(player?.is_superadmin || player?.is_admin), [player?.is_superadmin, player?.is_admin]);

  const [messageApi, contextHolder] = message.useMessage();
  const [createOrgForm] = Form.useForm<CreateOrgForm>();
  const [resetPasswordForm] = Form.useForm<ResetPasswordForm>();

  const [creatingOrg, setCreatingOrg] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [lookingUpPlayer, setLookingUpPlayer] = useState(false);
  const [lookupPhone, setLookupPhone] = useState("");
  const [selectedAdmin, setSelectedAdmin] = useState<PlayerLookupResult | null>(null);
  const [permissionPhone, setPermissionPhone] = useState("");
  const [selectedPlayerPermission, setSelectedPlayerPermission] = useState<PlayerLookupResult | null>(null);
  const [updatingPermission, setUpdatingPermission] = useState(false);

  const onCreateOrganization = async (values: CreateOrgForm) => {
    setCreatingOrg(true);
    try {
      await api.post("/organizations", values);
      messageApi.success("Organização criada com sucesso e admin atribuído.");
      createOrgForm.resetFields(["name", "description", "password"]);
    } catch {
      messageApi.error("Não foi possível criar a organização.");
    } finally {
      setCreatingOrg(false);
    }
  };

  const onResetPlayerPassword = async (values: ResetPasswordForm) => {
    setUpdatingPassword(true);
    try {
      await api.put(`/players/${values.player_id}`, { password: values.password });
      messageApi.success("Senha do jogador atualizada com sucesso.");
      resetPasswordForm.resetFields();
    } catch {
      messageApi.error("Não foi possível atualizar a senha do jogador.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const searchPlayerByPhone = async () => {
    if (!lookupPhone.trim()) {
      messageApi.warning("Informe um telefone para buscar o jogador.");
      return;
    }

    setLookingUpPlayer(true);
    try {
      const { data } = await api.get(`/players/${lookupPhone.trim()}`);
      const payload = data?.data ?? data;
      if (!payload?.id) {
        messageApi.error("Jogador não encontrado.");
        return;
      }

      const result: PlayerLookupResult = {
        id: Number(payload.id),
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        is_admin: payload.is_admin,
      };

      setSelectedAdmin(result);
      createOrgForm.setFieldValue("admin_player_id", result.id);
      messageApi.success(`Admin selecionado: ${result.name} (#${result.id})`);
    } catch {
      messageApi.error("Falha ao buscar jogador por telefone.");
    } finally {
      setLookingUpPlayer(false);
    }
  };

  const searchPlayerPermissionByPhone = async () => {
    if (!permissionPhone.trim()) {
      messageApi.warning("Informe um telefone para buscar o jogador.");
      return;
    }

    setLookingUpPlayer(true);
    try {
      const { data } = await api.get(`/players/${permissionPhone.trim()}`);
      const payload = data?.data ?? data;

      if (!payload?.id) {
        messageApi.error("Jogador não encontrado.");
        return;
      }

      const result: PlayerLookupResult = {
        id: Number(payload.id),
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        is_admin: Boolean(payload.is_admin),
      };

      setSelectedPlayerPermission(result);
      messageApi.success(`Jogador carregado: ${result.name} (#${result.id})`);
    } catch {
      messageApi.error("Falha ao buscar jogador por telefone.");
    } finally {
      setLookingUpPlayer(false);
    }
  };

  const onUpdateGlobalPermission = async () => {
    if (!selectedPlayerPermission) {
      messageApi.warning("Busque um jogador antes de atualizar a permissão.");
      return;
    }

    setUpdatingPermission(true);
    try {
      await api.put(`/players/${selectedPlayerPermission.id}`, {
        is_admin: Boolean(selectedPlayerPermission.is_admin),
      });

      messageApi.success("Permissão global atualizada com sucesso.");
    } catch {
      messageApi.error("Não foi possível atualizar a permissão global do jogador.");
    } finally {
      setUpdatingPermission(false);
    }
  };

  if (!canAccess) return <Navigate to="/dashboard" replace />;

  return (
    <Layout style={{ minHeight: "100vh", background: "transparent" }}>
      {contextHolder}
      <UniversalNavbar />

      <Content style={{ maxWidth: 1100, width: "100%", margin: "0 auto", padding: "20px 14px 40px" }}>
        <Card
          style={{
            marginBottom: 16,
            borderRadius: 24,
            border: "1px solid rgba(250,204,21,0.3)",
            background: "linear-gradient(135deg, rgba(56,44,7,0.85), rgba(15,23,42,0.9))",
          }}
        >
          <Space direction="vertical" size={2} style={{ width: "100%" }}>
            <Space align="center" wrap>
              <Tag color="gold" icon={<SafetyCertificateOutlined />}>SUPERADMIN</Tag>
              <Text style={{ color: "#fef3c7" }}>Controle global do sistema</Text>
            </Space>
            <Title level={2} style={{ margin: 0, color: "#fefce8" }}>Painel Super Admin</Title>
            <Text style={{ color: "#fde68a" }}>
              Crie organizações com admin inicial e redefina senha de jogadores com segurança.
            </Text>
            <Space wrap style={{ marginTop: 8 }}>
              <Button onClick={() => navigate("/dashboard")}>Voltar ao dashboard</Button>
              <Button icon={<TeamOutlined />} onClick={() => navigate("/join")}>Ir para organizações</Button>
            </Space>
          </Space>
        </Card>

        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} md={8}>
            <Card>
              <Statistic title="Seu ID" value={player?.id ?? "-"} prefix={<UserOutlined />} />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card>
              <Statistic title="Controle" value="Global" prefix={<SafetyCertificateOutlined />} />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card>
              <Statistic title="Admin selecionado" value={selectedAdmin ? `#${selectedAdmin.id}` : "-"} prefix={<TeamOutlined />} />
            </Card>
          </Col>
        </Row>

        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16, borderRadius: 14 }}
          message="Dica de operação"
          description="Você pode buscar o admin por telefone para preencher automaticamente o ID no cadastro da organização."
        />

        <Tabs
          defaultActiveKey="org"
          items={[
            {
              key: "org",
              label: (
                <Space>
                  <PlusCircleOutlined />
                  Criar organização
                </Space>
              ),
              children: (
                <Card style={{ borderRadius: 16 }}>
                  <Title level={4}>Criar organização e atribuir admin</Title>
                  <Text type="secondary">Defina o jogador responsável pela administração inicial da organização.</Text>

                  <Divider />

                  <Space direction="vertical" style={{ width: "100%" }} size={8}>
                    <Text strong>Buscar jogador por telefone</Text>
                    <Space.Compact style={{ width: "100%" }}>
                      <Input
                        value={lookupPhone}
                        onChange={(event) => setLookupPhone(event.target.value)}
                        placeholder="Ex: 11999998888"
                      />
                      <Button icon={<SearchOutlined />} loading={lookingUpPlayer} onClick={searchPlayerByPhone}>
                        Buscar
                      </Button>
                    </Space.Compact>

                    {selectedAdmin && (
                      <Card size="small" style={{ borderRadius: 12, background: "#f8fafc" }}>
                        <Space direction="vertical" size={0}>
                          <Text strong>{selectedAdmin.name}</Text>
                          <Text type="secondary">ID: {selectedAdmin.id}</Text>
                          <Text type="secondary">Telefone: {selectedAdmin.phone || "-"}</Text>
                          <Text type="secondary">Email: {selectedAdmin.email || "-"}</Text>
                        </Space>
                      </Card>
                    )}
                  </Space>

                  <Divider />

                  <Form form={createOrgForm} layout="vertical" onFinish={onCreateOrganization} requiredMark={false}>
                    <Form.Item name="name" label="Nome da organização" rules={[{ required: true, message: "Informe o nome" }]}>
                      <Input placeholder="Ex: Futclebs Elite" />
                    </Form.Item>

                    <Form.Item name="description" label="Descrição">
                      <Input.TextArea rows={3} placeholder="Opcional" />
                    </Form.Item>

                    <Form.Item name="password" label="Senha da organização" rules={[{ required: true, min: 4, message: "Mínimo de 4 caracteres" }]}>
                      <Input.Password placeholder="Senha interna da organização" />
                    </Form.Item>

                    <Form.Item
                      name="admin_player_id"
                      label="ID do jogador admin"
                      rules={[{ required: true, message: "Informe o ID do admin" }]}
                    >
                      <InputNumber min={1} style={{ width: "100%" }} placeholder="Ex: 23" />
                    </Form.Item>

                    <Button htmlType="submit" type="primary" loading={creatingOrg} icon={<PlusCircleOutlined />}>
                      Criar organização
                    </Button>
                  </Form>
                </Card>
              ),
            },
            {
              key: "permissions",
              label: (
                <Space>
                  <SafetyCertificateOutlined />
                  Permissões globais
                </Space>
              ),
              children: (
                <Card style={{ borderRadius: 16 }}>
                  <Title level={4}>Transformar usuário em superadmin global</Title>
                  <Text type="secondary">Ative ou desative o perfil de administrador global do sistema por telefone.</Text>

                  <Divider />

                  <Space direction="vertical" style={{ width: "100%" }} size={8}>
                    <Text strong>Buscar jogador por telefone</Text>
                    <Space.Compact style={{ width: "100%" }}>
                      <Input
                        value={permissionPhone}
                        onChange={(event) => setPermissionPhone(event.target.value)}
                        placeholder="Ex: 11999998888"
                      />
                      <Button icon={<SearchOutlined />} loading={lookingUpPlayer} onClick={searchPlayerPermissionByPhone}>
                        Buscar
                      </Button>
                    </Space.Compact>

                    {selectedPlayerPermission && (
                      <Card size="small" style={{ borderRadius: 12, background: "#f8fafc" }}>
                        <Space direction="vertical" size={12} style={{ width: "100%" }}>
                          <div>
                            <Text strong>{selectedPlayerPermission.name}</Text>
                            <br />
                            <Text type="secondary">ID: {selectedPlayerPermission.id}</Text>
                            <br />
                            <Text type="secondary">Telefone: {selectedPlayerPermission.phone || "-"}</Text>
                          </div>

                          <Space align="center">
                            <Text>Superadmin global</Text>
                            <Switch
                              checked={Boolean(selectedPlayerPermission.is_admin)}
                              onChange={(checked) =>
                                setSelectedPlayerPermission((prev) => (prev ? { ...prev, is_admin: checked } : prev))
                              }
                            />
                          </Space>

                          <Button
                            type="primary"
                            icon={<SafetyCertificateOutlined />}
                            loading={updatingPermission}
                            onClick={onUpdateGlobalPermission}
                          >
                            Salvar permissão
                          </Button>
                        </Space>
                      </Card>
                    )}
                  </Space>
                </Card>
              ),
            },
            {
              key: "password",
              label: (
                <Space>
                  <LockOutlined />
                  Alterar senha
                </Space>
              ),
              children: (
                <Card style={{ borderRadius: 16 }}>
                  <Title level={4}>Alterar senha de jogador específico</Title>
                  <Text type="secondary">Use com cuidado. A senha será alterada imediatamente.</Text>

                  <Divider />

                  <Form form={resetPasswordForm} layout="vertical" onFinish={onResetPlayerPassword} requiredMark={false}>
                    <Form.Item name="player_id" label="ID do jogador" rules={[{ required: true, message: "Informe o ID do jogador" }]}>
                      <InputNumber min={1} style={{ width: "100%" }} placeholder="Ex: 101" />
                    </Form.Item>

                    <Form.Item name="password" label="Nova senha" rules={[{ required: true, min: 6, message: "Mínimo de 6 caracteres" }]}>
                      <Input.Password placeholder="Nova senha do jogador" />
                    </Form.Item>

                    <Button htmlType="submit" type="primary" loading={updatingPassword} icon={<LockOutlined />}>
                      Atualizar senha
                    </Button>
                  </Form>
                </Card>
              ),
            },
          ]}
        />
      </Content>
    </Layout>
  );
}
