const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

type AuthUserResponse = {
  id?: string;
  user?: { id?: string };
  data?: { id?: string; user?: { id?: string }; exists?: boolean };
  exists?: boolean;
  message?: string;
};

const parseErrorMessage = async (response: Response) => {
  try {
    const json = (await response.json()) as AuthUserResponse;
    return json.message || 'Erro de comunicação com a API';
  } catch {
    return 'Erro de comunicação com a API';
  }
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
    const query = new URLSearchParams({ phone });
    const response = await fetch(`${API_BASE_URL}/auth/check-phone?${query.toString()}`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response));
    }

    const payload = (await response.json()) as AuthUserResponse;
    return extractExists(payload);
  },

  async login(phone: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ phone, password }),
    });

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response));
    }

    const payload = (await response.json()) as AuthUserResponse;
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
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        phone,
        password,
        name,
        is_goalkeeper: isGoalkeeper,
      }),
    });

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response));
    }

    const payload = (await response.json()) as AuthUserResponse;
    return extractUserId(payload);
  },
};
