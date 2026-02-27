import { httpClient } from './httpClient';

type AuthUserResponse = {
  id?: string;
  user?: { id?: string };
  data?: { id?: string; user?: { id?: string }; exists?: boolean };
  exists?: boolean;
};

const extractUserId = (payload: AuthUserResponse) => {
  return payload.id || payload.user?.id || payload.data?.id || payload.data?.user?.id || null;
};

const extractExists = (payload: AuthUserResponse) => {
  if (typeof payload.exists === 'boolean') return payload.exists;
  if (typeof payload.data?.exists === 'boolean') return payload.data.exists;
  return false;
};

export const authApi = {
  async checkPhoneExists(phone: string) {
    const payload = await httpClient.request<AuthUserResponse>('/auth/check-phone', {
      query: { phone },
    });

    return extractExists(payload);
  },

  async login(phone: string, password: string) {
    const payload = await httpClient.request<AuthUserResponse>('/auth/login', {
      method: 'POST',
      body: { phone, password },
    });

    return extractUserId(payload);
  },

  async register({
    phone,
    password,
    name,
    isGoalkeeper,
  }: {
    phone: string;
    password: string;
    name: string;
    isGoalkeeper: boolean;
  }) {
    const payload = await httpClient.request<AuthUserResponse>('/auth/register', {
      method: 'POST',
      body: {
        phone,
        password,
        name,
        is_goalkeeper: isGoalkeeper,
      },
    });

    return extractUserId(payload);
  },
};
