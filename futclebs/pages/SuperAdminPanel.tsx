import { UniversalNavbar } from "@/components/layout/UniversalNavbar";
import { useAuth } from "@/contexts/AuthContext";
import { api, getApiErrorMessage } from "@/services/axios";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Form,
  Input,
  InputNumber,
  Layout,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from "antd";
import {
  DeleteOutlined,
  LockOutlined,
  PlusCircleOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

const { Content } = Layout;
const { Title, Text } = Typography;

interface Organization {
  id: number;
  name: string;
}

interface CreateOrgForm {
  name: string;
  description?: string;
  password: string;
  admin_player_id: number;
}

interface PlayerLookupResult {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  is_admin?: boolean;
  is_active?: boolean;
  organizations?: Organization[];
  pivot?: { is_admin?: boolean };
}

interface UserForm {
  password?: string;
}

export default function SuperAdminPanel() {
  const navigate = useNavigate();
  const { player } = useAuth();
  const canAccess = useMemo(() => Boolean(player?.is_superadmin), [player?.is_superadmin]);

  const [messageApi, contextHolder] = message.useMessage();
  const [createOrgForm] = Form.useForm<CreateOrgForm>();
  const [userPasswordForm] = Form.useForm<UserForm>();

  const [creatingOrg, setCreatingOrg] = useState(false);
  const [lookupPhone, setLookupPhone] = useState("");
  const [selectedAdmin, setSelectedAdmin] = useState<PlayerLookupResult | null>(null);
  const [lookingUpPlayer, setLookingUpPlayer] = useState(false);

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<number | null>(null);
  const [orgPlayers, setOrgPlayers] = useState<PlayerLookupResult[]>([]);
  const [orgPlayersSearch, setOrgPlayersSearch] = useState("");
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [loadingOrgPlayers, setLoadingOrgPlayers] = useState(false);
  const [addingToOrg, setAddingToOrg] = useState(false);
  const [managingOrgPlayerId, setManagingOrgPlayerId] = useState<number | null>(null);
  const [addMemberPhone, setAddMemberPhone] = useState("");

  const [users, setUsers] = useState<PlayerLookupResult[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userFilterName, setUserFilterName] = useState("");
  const [userFilterPhone, setUserFilterPhone] = useState("");
  const [selectedUser, setSelectedUser] = useState<PlayerLookupResult | null>(null);
  const [savingUserPermission, setSavingUserPermission] = useState(false);
  const [savingUserPassword, setSavingUserPassword] = useState(false);
  const [savingUserStatus, setSavingUserStatus] = useState(false);

  const fetchOrganizations = async () => {
    setLoadingOrgs(true);
    try {
      const { data } = await api.get("/organizations");
      const payload = data?.data ?? data;
      const parsed = Array.isArray(payload) ? payload : [];
      setOrganizations(parsed);

      if (!selectedOrganizationId && parsed.length > 0) {
        setSelectedOrganizationId(parsed[0].id);
      }
    } catch (error) {
      messageApi.error(getApiErrorMessage(error, "Erro ao carregar organizações."));
    } finally {
      setLoadingOrgs(false);
    }
  };

  const fetchOrganizationPlayers = async (organizationId: number) => {
    setLoadingOrgPlayers(true);
    try {
      const { data } = await api.get(`/organizations/${organizationId}/players`);
      const payload = data?.data ?? data;
      setOrgPlayers(Array.isArray(payload) ? payload : []);
    } catch (error) {
      messageApi.error(getApiErrorMessage(error, "Erro ao carregar membros da organização."));
      setOrgPlayers([]);
    } finally {
      setLoadingOrgPlayers(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data } = await api.get("/players", {
        params: {
          name: userFilterName || undefined,
          phone: userFilterPhone || undefined,
          limit: 80,
        },
      });

      const payload = data?.data ?? data;
      const parsedUsers = Array.isArray(payload) ? payload : [];
      setUsers(parsedUsers);

      if (selectedUser) {
        const refreshedSelectedUser = parsedUsers.find((item) => item.id === selectedUser.id);
        if (refreshedSelectedUser) {
          setSelectedUser(refreshedSelectedUser);
        }
      }
    } catch (error) {
      messageApi.error(getApiErrorMessage(error, "Erro ao carregar usuários."));
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (!canAccess) return;
    fetchOrganizations();
    fetchUsers();
  }, [canAccess]);

  useEffect(() => {
    if (!selectedOrganizationId) return;
    fetchOrganizationPlayers(selectedOrganizationId);
  }, [selectedOrganizationId]);

  const searchPlayerByPhone = async () => {
    if (!lookupPhone.trim()) {
      messageApi.warning("Informe um telefone para buscar o jogador.");
      return;
    }

    setLookingUpPlayer(true);
    try {
      const { data } = await api.get(`/players/${lookupPhone.trim()}`);
      const payload = data?.data ?? data;
      const result: PlayerLookupResult = {
        id: Number(payload.id),
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        is_admin: Boolean(payload.is_admin),
        is_active: Boolean(payload.is_active),
      };
      setSelectedAdmin(result);
      createOrgForm.setFieldValue("admin_player_id", result.id);
      messageApi.success(`Admin selecionado: ${result.name} (#${result.id})`);
    } catch (error) {
      messageApi.error(getApiErrorMessage(error, "Falha ao buscar jogador por telefone."));
    } finally {
      setLookingUpPlayer(false);
    }
  };

  const onCreateOrganization = async (values: CreateOrgForm) => {
    setCreatingOrg(true);
    try {
      await api.post("/organizations", values);
      messageApi.success("Organização criada com sucesso e admin atribuído.");
      createOrgForm.resetFields();
      setSelectedAdmin(null);
      setLookupPhone("");
      await fetchOrganizations();
    } catch (error) {
      messageApi.error(getApiErrorMessage(error, "Não foi possível criar a organização."));
    } finally {
      setCreatingOrg(false);
    }
  };

  const addPlayerToOrganization = async () => {
    if (!selectedOrganizationId) {
      messageApi.warning("Selecione uma organização.");
      return;
    }

    if (!addMemberPhone.trim()) {
      messageApi.warning("Informe um telefone para adicionar o usuário.");
      return;
    }

    setAddingToOrg(true);
    try {
      const playerResponse = await api.get(`/players/${addMemberPhone.trim()}`);
      const targetPlayer = playerResponse.data?.data ?? playerResponse.data;

      await api.post(`/organizations/${selectedOrganizationId}/players`, {
        player_id: targetPlayer.id,
      });

      messageApi.success("Usuário adicionado na organização com sucesso.");
      setAddMemberPhone("");
      await fetchOrganizationPlayers(selectedOrganizationId);
    } catch (error) {
      messageApi.error(getApiErrorMessage(error, "Não foi possível adicionar o usuário na organização."));
    } finally {
      setAddingToOrg(false);
    }
  };

  const updatePlayerRoleInOrganization = async (target: PlayerLookupResult, isAdmin: boolean) => {
    if (!selectedOrganizationId) return;

    setManagingOrgPlayerId(target.id);
    try {
      await api.put(`/organizations/${selectedOrganizationId}/players/${target.id}/role`, {
        is_admin: isAdmin,
      });
      messageApi.success("Permissão na organização atualizada.");
      await fetchOrganizationPlayers(selectedOrganizationId);
    } catch (error) {
      messageApi.error(getApiErrorMessage(error, "Falha ao atualizar permissão na organização."));
    } finally {
      setManagingOrgPlayerId(null);
    }
  };

  const removePlayerFromOrganization = async (target: PlayerLookupResult) => {
    if (!selectedOrganizationId) return;

    setManagingOrgPlayerId(target.id);
    try {
      await api.delete(`/organizations/${selectedOrganizationId}/players/${target.id}`);
      messageApi.success("Usuário removido da organização.");
      await fetchOrganizationPlayers(selectedOrganizationId);
    } catch (error) {
      messageApi.error(getApiErrorMessage(error, "Não foi possível remover o usuário da organização."));
    } finally {
      setManagingOrgPlayerId(null);
    }
  };

  const updateGlobalPermission = async (target: PlayerLookupResult, checked: boolean) => {
    setSavingUserPermission(true);
    try {
      await api.put(`/players/${target.id}`, { is_admin: checked });
      messageApi.success("Permissão global atualizada com sucesso.");
      setSelectedUser((previous) => (previous ? { ...previous, is_admin: checked } : previous));
      await fetchUsers();
    } catch (error) {
      messageApi.error(getApiErrorMessage(error, "Falha ao atualizar permissão global."));
    } finally {
      setSavingUserPermission(false);
    }
  };

  const updateGlobalActiveStatus = async (target: PlayerLookupResult, checked: boolean) => {
    setSavingUserStatus(true);
    try {
      await api.put(`/players/${target.id}`, { is_active: checked });
      messageApi.success("Status do usuário atualizado com sucesso.");
      setSelectedUser((previous) => (previous ? { ...previous, is_active: checked } : previous));
      await fetchUsers();
    } catch (error) {
      messageApi.error(getApiErrorMessage(error, "Falha ao atualizar status do usuário."));
    } finally {
      setSavingUserStatus(false);
    }
  };

  const updateUserPassword = async () => {
    if (!selectedUser?.id) {
      messageApi.warning("Selecione um usuário primeiro.");
      return;
    }

    const values = await userPasswordForm.validateFields();
    setSavingUserPassword(true);

    try {
      await api.put(`/players/${selectedUser.id}`, {
        password: values.password,
      });
      messageApi.success("Senha atualizada com sucesso.");
      userPasswordForm.resetFields();
    } catch (error) {
      messageApi.error(getApiErrorMessage(error, "Não foi possível alterar a senha."));
    } finally {
      setSavingUserPassword(false);
    }
  };

  const organizationStats = useMemo(() => {
    const total = orgPlayers.length;
    const admins = orgPlayers.filter((member) => member.pivot?.is_admin).length;
    return { total, admins, members: Math.max(total - admins, 0) };
  }, [orgPlayers]);

  const filteredOrgPlayers = useMemo(() => {
    const term = orgPlayersSearch.trim().toLowerCase();
    if (!term) return orgPlayers;

    return orgPlayers.filter((member) =>
      [member.name, member.phone, member.email]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [orgPlayers, orgPlayersSearch]);

  if (!canAccess) return <Navigate to="/dashboard" replace />;

  return (
    <Layout style={{ minHeight: "100vh", background: "transparent" }}>
      {contextHolder}
      <UniversalNavbar />

      <Content style={{ maxWidth: 1180, width: "100%", margin: "0 auto", padding: "20px 14px 40px" }}>
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
              Acesso completo para gerir organizações, membros e usuários do sistema com mais rapidez e segurança.
            </Text>
            <Space wrap style={{ marginTop: 8 }}>
              <Button onClick={() => navigate("/dashboard")}>Voltar ao dashboard</Button>
              <Button icon={<ReloadOutlined />} onClick={() => { fetchOrganizations(); fetchUsers(); }}>
                Recarregar dados
              </Button>
            </Space>
          </Space>
        </Card>

        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} md={6}><Card><Statistic title="Seu ID" value={player?.id ?? "-"} prefix={<UserOutlined />} /></Card></Col>
          <Col xs={24} md={6}><Card><Statistic title="Organizações" value={organizations.length} prefix={<TeamOutlined />} loading={loadingOrgs} /></Card></Col>
          <Col xs={24} md={6}><Card><Statistic title="Membros (org atual)" value={organizationStats.total} prefix={<TeamOutlined />} loading={loadingOrgPlayers} /></Card></Col>
          <Col xs={24} md={6}><Card><Statistic title="Usuários listados" value={users.length} prefix={<SafetyCertificateOutlined />} loading={loadingUsers} /></Card></Col>
        </Row>

        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16, borderRadius: 14 }}
          message="Funcionalidades disponíveis"
          description="Criação de organização com admin, gestão de membros por organização (incluindo promoção/rebaixamento), administração global de usuários (permissões, status e senha)."
        />

        <Tabs
          defaultActiveKey="org"
          items={[
            {
              key: "org",
              label: <Space><PlusCircleOutlined />Criar organização</Space>,
              children: (
                <Card style={{ borderRadius: 16 }}>
                  <Title level={4}>Criar organização e atribuir admin</Title>
                  <Text type="secondary">Busque o admin por telefone para preencher automaticamente o campo de ID.</Text>
                  <Divider />

                  <Space direction="vertical" style={{ width: "100%" }} size={8}>
                    <Text strong>Buscar admin por telefone</Text>
                    <Space.Compact style={{ width: "100%" }}>
                      <Input value={lookupPhone} onChange={(event) => setLookupPhone(event.target.value)} placeholder="Ex: 11999998888" />
                      <Button icon={<SearchOutlined />} loading={lookingUpPlayer} onClick={searchPlayerByPhone}>Buscar</Button>
                    </Space.Compact>

                    {selectedAdmin && (
                      <Card size="small" style={{ borderRadius: 12, background: "#f8fafc" }}>
                        <Text strong>{selectedAdmin.name}</Text>
                        <br />
                        <Text type="secondary">ID: {selectedAdmin.id} • Tel: {selectedAdmin.phone || "-"}</Text>
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

                    <Form.Item name="admin_player_id" label="ID do admin" rules={[{ required: true, message: "Informe o ID do admin" }]}>
                      <InputNumber min={1} style={{ width: "100%" }} />
                    </Form.Item>

                    <Button htmlType="submit" type="primary" loading={creatingOrg} icon={<PlusCircleOutlined />}>Criar organização</Button>
                  </Form>
                </Card>
              ),
            },
            {
              key: "organization-members",
              label: <Space><TeamOutlined />Administrar organizações</Space>,
              children: (
                <Card style={{ borderRadius: 16 }}>
                  <Title level={4}>Gerenciar membros e admins por organização</Title>
                  <Text type="secondary">Você é admin de todas as organizações automaticamente (perfil superadmin).</Text>
                  <Divider />

                  <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
                    <Col xs={24} lg={8}>
                      <Select
                        showSearch
                        placeholder="Selecione a organização"
                        value={selectedOrganizationId ?? undefined}
                        onChange={(value) => setSelectedOrganizationId(value)}
                        loading={loadingOrgs}
                        options={organizations.map((organization) => ({ value: organization.id, label: `#${organization.id} - ${organization.name}` }))}
                      />
                    </Col>
                    <Col xs={24} lg={8}>
                      <Input value={orgPlayersSearch} onChange={(event) => setOrgPlayersSearch(event.target.value)} placeholder="Buscar membro por nome, telefone ou e-mail" />
                    </Col>
                    <Col xs={24} lg={8}>
                      <Space.Compact style={{ width: "100%" }}>
                        <Input value={addMemberPhone} onChange={(event) => setAddMemberPhone(event.target.value)} placeholder="Telefone para adicionar" />
                        <Button type="primary" icon={<PlusCircleOutlined />} loading={addingToOrg} onClick={addPlayerToOrganization}>Adicionar</Button>
                      </Space.Compact>
                    </Col>
                  </Row>

                  <Space size={10} style={{ marginBottom: 10 }} wrap>
                    <Badge count={organizationStats.admins} style={{ backgroundColor: "#f59e0b" }} />
                    <Text>Admins</Text>
                    <Badge count={organizationStats.members} style={{ backgroundColor: "#3b82f6" }} />
                    <Text>Membros</Text>
                    <Badge count={filteredOrgPlayers.length} style={{ backgroundColor: "#10b981" }} />
                    <Text>Exibidos</Text>
                  </Space>

                  <Table
                    size="small"
                    rowKey="id"
                    loading={loadingOrgPlayers}
                    dataSource={filteredOrgPlayers}
                    locale={{ emptyText: <Empty description="Nenhum membro encontrado" /> }}
                    pagination={{ pageSize: 8 }}
                    columns={[
                      { title: "ID", dataIndex: "id", width: 90 },
                      { title: "Nome", dataIndex: "name" },
                      { title: "Telefone", dataIndex: "phone", render: (value: string | undefined) => value || "-" },
                      {
                        title: "Admin org",
                        render: (_, record) => (
                          <Switch
                            checked={Boolean(record.pivot?.is_admin)}
                            loading={managingOrgPlayerId === record.id}
                            onChange={(checked) => updatePlayerRoleInOrganization(record, checked)}
                          />
                        ),
                      },
                      {
                        title: "Ações",
                        width: 120,
                        render: (_, record) => (
                          <Popconfirm
                            title="Remover usuário da organização?"
                            description="Essa ação remove o vínculo deste usuário com a organização selecionada."
                            okText="Remover"
                            cancelText="Cancelar"
                            onConfirm={() => removePlayerFromOrganization(record)}
                          >
                            <Button danger icon={<DeleteOutlined />} loading={managingOrgPlayerId === record.id}>
                              Remover
                            </Button>
                          </Popconfirm>
                        ),
                      },
                    ]}
                  />
                </Card>
              ),
            },
            {
              key: "users",
              label: <Space><SafetyCertificateOutlined />Administrar usuários</Space>,
              children: (
                <Card style={{ borderRadius: 16 }}>
                  <Title level={4}>Gerenciamento global de usuários</Title>
                  <Text type="secondary">Pesquise usuários para ajustar permissão global, status de acesso e redefinir senha.</Text>
                  <Divider />

                  <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
                    <Col xs={24} md={10}>
                      <Input value={userFilterName} onChange={(event) => setUserFilterName(event.target.value)} placeholder="Filtrar por nome" />
                    </Col>
                    <Col xs={24} md={10}>
                      <Input value={userFilterPhone} onChange={(event) => setUserFilterPhone(event.target.value)} placeholder="Filtrar por telefone" />
                    </Col>
                    <Col xs={24} md={4}>
                      <Button block type="primary" icon={<SearchOutlined />} loading={loadingUsers} onClick={fetchUsers}>Buscar</Button>
                    </Col>
                  </Row>

                  <Table
                    size="small"
                    rowKey="id"
                    dataSource={users}
                    loading={loadingUsers}
                    pagination={{ pageSize: 8 }}
                    rowClassName={(record) => (selectedUser?.id === record.id ? "ant-table-row-selected" : "")}
                    onRow={(record) => ({
                      onClick: () => setSelectedUser(record),
                    })}
                    columns={[
                      { title: "ID", dataIndex: "id", width: 80 },
                      { title: "Nome", dataIndex: "name" },
                      { title: "Telefone", dataIndex: "phone", render: (value: string | undefined) => value || "-" },
                      {
                        title: "Status",
                        render: (_, record) => (
                          <Tag color={record.is_active ? "green" : "red"}>{record.is_active ? "ATIVO" : "INATIVO"}</Tag>
                        ),
                      },
                      {
                        title: "Permissão global",
                        render: (_, record) => (
                          <Tag color={record.is_admin ? "gold" : "default"}>{record.is_admin ? "SUPERADMIN" : "USUÁRIO"}</Tag>
                        ),
                      },
                    ]}
                  />

                  <Divider />

                  {selectedUser ? (
                    <Space direction="vertical" size={10} style={{ width: "100%" }}>
                      <Text strong>Usuário selecionado: {selectedUser.name} (#{selectedUser.id})</Text>
                      <Text type="secondary">Organizações vinculadas: {selectedUser.organizations?.length ?? 0}</Text>

                      <Space align="center" wrap>
                        <Text>Superadmin global</Text>
                        <Switch
                          checked={Boolean(selectedUser.is_admin)}
                          loading={savingUserPermission}
                          onChange={(checked) => updateGlobalPermission(selectedUser, checked)}
                        />
                      </Space>

                      <Space align="center" wrap>
                        <Text>Usuário ativo</Text>
                        <Switch
                          checked={Boolean(selectedUser.is_active)}
                          loading={savingUserStatus}
                          onChange={(checked) => updateGlobalActiveStatus(selectedUser, checked)}
                        />
                      </Space>

                      <Form layout="vertical" form={userPasswordForm} requiredMark={false}>
                        <Form.Item name="password" label="Nova senha" rules={[{ required: true, min: 6, message: "Mínimo de 6 caracteres" }]}>
                          <Input.Password placeholder="Informe nova senha" />
                        </Form.Item>
                        <Button type="primary" icon={<LockOutlined />} loading={savingUserPassword} onClick={updateUserPassword}>
                          Redefinir senha
                        </Button>
                      </Form>
                    </Space>
                  ) : (
                    <Text type="secondary">Clique em um usuário da tabela para administrar permissões, status e senha.</Text>
                  )}
                </Card>
              ),
            },
          ]}
        />
      </Content>
    </Layout>
  );
}
