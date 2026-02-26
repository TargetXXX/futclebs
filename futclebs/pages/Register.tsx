import { AuthCard } from "@/components/auth/AuthCard";
import { api } from "@/services/axios";
import { cleanPhone, formatPhone } from "@/utils/phone.utils";
import { MailOutlined, PhoneOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, Button, Col, Form, Input, Layout, Row, Select, Space, Switch, Tag, Typography } from "antd";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type PositionValue = "GOLEIRO" | "DEFENSOR" | "MEIO CAMPO" | "ATACANTE";

const positionOptions: { label: string; value: PositionValue }[] = [
  { label: "Goleiro", value: "GOLEIRO" },
  { label: "Defensor", value: "DEFENSOR" },
  { label: "Meio campo", value: "MEIO CAMPO" },
  { label: "Atacante", value: "ATACANTE" },
];

interface RegisterValues {
  name: string;
  username: string;
  email?: string;
  phone: string;
  birthdate?: string;
  password: string;
  confirmPassword: string;
  primaryPosition: PositionValue;
  secondaryPosition: PositionValue;
  isGoalkeeper: boolean;
}

const { Content } = Layout;
const { Text, Title } = Typography;

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordValue, setPasswordValue] = useState("");

  const passwordStrength = useMemo(() => {
    if (passwordValue.length >= 10) return "forte";
    if (passwordValue.length >= 6) return "média";
    return "fraca";
  }, [passwordValue]);

  const passwordStrengthColor = useMemo(() => {
    if (passwordStrength === "forte") return "success";
    if (passwordStrength === "média") return "warning";
    return "error";
  }, [passwordStrength]);

  const submitRegister = async (values: RegisterValues) => {
    if (values.password !== values.confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data } = await api.post("/auth/register", {
        name: values.name.trim(),
        username: values.username.trim(),
        email: values.email?.trim() || null,
        phone: cleanPhone(values.phone),
        password: values.password,
        primary_position: values.primaryPosition,
        secondary_position: values.secondaryPosition,
        birthdate: values.birthdate || null,
        is_goalkeeper: values.isGoalkeeper,
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
    <Layout style={{ minHeight: "100vh", background: "linear-gradient(135deg, #020617 0%, #0f172a 45%, #082f49 100%)" }}>
      <Content style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
        <div style={{ width: "100%", maxWidth: 720 }}>
          <Space direction="vertical" size={20} style={{ width: "100%" }}>
            <Space direction="vertical" size={4} style={{ textAlign: "center", width: "100%" }}>
              <Text style={{ color: "#34d399", fontWeight: 600 }}>BOLANOPE • Novo cadastro</Text>
              <Title level={4} style={{ color: "#f8fafc", margin: 0 }}>
                Crie seu perfil e comece a competir
              </Title>
            </Space>

            <AuthCard title="Crie sua conta" subtitle="Monte seu perfil de atleta e comece a competir nas organizações.">
              <Form<RegisterValues>
                layout="vertical"
                requiredMark={false}
                initialValues={{
                  primaryPosition: "ATACANTE",
                  secondaryPosition: "MEIO CAMPO",
                  isGoalkeeper: false,
                }}
                onFinish={submitRegister}
              >
                <Row gutter={[12, 0]}>
                  <Col xs={24} md={12}>
                    <Form.Item name="name" label="Nome" rules={[{ required: true, message: "Informe seu nome" }]}>
                      <Input size="large" prefix={<UserOutlined />} placeholder="Seu nome completo" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="username" label="Username" rules={[{ required: true, message: "Informe seu username" }]}>
                      <Input size="large" placeholder="Como será identificado" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={[12, 0]}>
                  <Col xs={24} md={12}>
                    <Form.Item name="email" label="E-mail">
                      <Input size="large" prefix={<MailOutlined />} placeholder="Opcional" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="phone"
                      label="Telefone"
                      normalize={(value) => formatPhone(cleanPhone(value ?? ""))}
                      rules={[
                        { required: true, message: "Informe o telefone" },
                        {
                          validator: (_, value) =>
                            !value || cleanPhone(value).length === 11
                              ? Promise.resolve()
                              : Promise.reject(new Error("Informe um número com DDD (11 dígitos).")),
                        },
                      ]}
                    >
                      <Input size="large" prefix={<PhoneOutlined />} placeholder="(44) 99999-9999" maxLength={15} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={[12, 0]}>
                  <Col xs={24} md={12}>
                    <Form.Item name="birthdate" label="Data de nascimento">
                      <Input size="large" type="date" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="isGoalkeeper" valuePropName="checked" label="Goleiro de origem">
                      <Switch checkedChildren="Sim" unCheckedChildren="Não" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={[12, 0]}>
                  <Col xs={24} md={12}>
                    <Form.Item name="primaryPosition" label="Posição principal" rules={[{ required: true }]}>
                      <Select options={positionOptions} size="large" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="secondaryPosition" label="Posição secundária" rules={[{ required: true }]}>
                      <Select options={positionOptions} size="large" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={[12, 0]}>
                  <Col xs={24} md={12}>
                    <Form.Item name="password" label="Senha" rules={[{ required: true, message: "Informe uma senha" }]}>
                      <Input.Password size="large" onChange={(event) => setPasswordValue(event.target.value)} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="confirmPassword" label="Confirme a senha" rules={[{ required: true, message: "Confirme a senha" }]}>
                      <Input.Password size="large" />
                    </Form.Item>
                  </Col>
                </Row>

                <Space size={8} style={{ marginBottom: 12 }}>
                  <Text type="secondary">Força da senha:</Text>
                  <Tag color={passwordStrengthColor}>{passwordStrength.toUpperCase()}</Tag>
                </Space>

                <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
                  Use pelo menos 8 caracteres com letras e números para mais segurança.
                </Text>

                {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}

                <Button type="primary" htmlType="submit" size="large" loading={loading} block>
                  Criar conta
                </Button>
              </Form>

              <Space direction="vertical" style={{ marginTop: 20, width: "100%", textAlign: "center" }}>
                <Text type="secondary">
                  Já possui conta?{" "}
                  <Button type="link" onClick={() => navigate("/login")} style={{ paddingInline: 0 }}>
                    Fazer login
                  </Button>
                </Text>
              </Space>
            </AuthCard>
          </Space>
        </div>
      </Content>
    </Layout>
  );
}
