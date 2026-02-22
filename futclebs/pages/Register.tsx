import { AuthCard } from "@/components/auth/AuthCard";
import { api } from "@/services/axios";
import { Alert, Button, Form, Input, Layout, Select, Space, Switch, Typography } from "antd";
import { MailOutlined, PhoneOutlined, UserOutlined } from "@ant-design/icons";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type PositionValue = "GOLEIRO" | "DEFENSOR" | "MEIO CAMPO" | "ATACANTE";

const positionOptions: { label: string; value: PositionValue }[] = [
  { label: "Goleiro", value: "GOLEIRO" },
  { label: "Defensor", value: "DEFENSOR" },
  { label: "Meio campo", value: "MEIO CAMPO" },
  { label: "Atacante", value: "ATACANTE" },
];

const formatPhone = (raw: string) => raw.replace(/\D/g, "").slice(0, 11);

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
const { Text } = Typography;

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
        phone: formatPhone(values.phone),
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
      <Content style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
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
            <Form.Item name="name" label="Nome" rules={[{ required: true, message: "Informe seu nome" }]}>
              <Input size="large" prefix={<UserOutlined />} />
            </Form.Item>

            <Form.Item name="username" label="Username" rules={[{ required: true, message: "Informe seu username" }]}>
              <Input size="large" />
            </Form.Item>

            <Form.Item name="email" label="E-mail">
              <Input size="large" prefix={<MailOutlined />} />
            </Form.Item>

            <Form.Item name="phone" label="Telefone" rules={[{ required: true, message: "Informe o telefone" }]}>
              <Input size="large" prefix={<PhoneOutlined />} />
            </Form.Item>

            <Form.Item name="birthdate" label="Data de nascimento">
              <Input size="large" type="date" />
            </Form.Item>

            <Form.Item name="primaryPosition" label="Posição principal" rules={[{ required: true }]}>
              <Select options={positionOptions} size="large" />
            </Form.Item>

            <Form.Item name="secondaryPosition" label="Posição secundária" rules={[{ required: true }]}>
              <Select options={positionOptions} size="large" />
            </Form.Item>

            <Form.Item name="isGoalkeeper" valuePropName="checked" label="Goleiro de origem">
              <Switch checkedChildren="Sim" unCheckedChildren="Não" />
            </Form.Item>

            <Form.Item name="password" label="Senha" rules={[{ required: true, message: "Informe uma senha" }]}>
              <Input.Password size="large" onChange={(event) => setPasswordValue(event.target.value)} />
            </Form.Item>

            <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
              Força da senha: {passwordStrength}
            </Text>

            <Form.Item name="confirmPassword" label="Confirme a senha" rules={[{ required: true, message: "Confirme a senha" }]}>
              <Input.Password size="large" />
            </Form.Item>

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
      </Content>
    </Layout>
  );
}
