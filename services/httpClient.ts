const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const DEFAULT_TIMEOUT_MS = 12000;

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface HttpRequestOptions {
  method?: HttpMethod;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  timeoutMs?: number;
}

export class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}

const toQueryString = (query?: HttpRequestOptions['query']) => {
  if (!query) return '';

  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    params.set(key, String(value));
  });

  const result = params.toString();
  return result ? `?${result}` : '';
};

const parseJsonSafely = async (response: Response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const defaultMessageByStatus = (status: number) => {
  if (status === 400) return 'Dados inválidos. Revise as informações e tente novamente.';
  if (status === 408) return 'A requisição expirou. Verifique sua conexão e tente novamente.';
  if (status === 422) return 'Não foi possível processar os dados enviados.';
  if (status >= 500) return 'Servidor indisponível. Tente novamente em instantes.';
  if (status === 401) return 'Sessão inválida. Faça login novamente.';
  if (status === 403) return 'Você não tem permissão para esta ação.';
  if (status === 404) return 'Recurso não encontrado.';
  return 'Erro de comunicação com a API.';
};


const extractErrorMessage = (payload: unknown, status: number) => {
  if (payload && typeof payload === 'object') {
    if ('message' in payload && typeof payload.message === 'string') {
      return payload.message;
    }

    if ('error' in payload && typeof payload.error === 'string') {
      return payload.error;
    }
  }

  return defaultMessageByStatus(status);
};

export const httpClient = {
  async request<T>(path: string, options: HttpRequestOptions = {}): Promise<T> {
    const { method = 'GET', query, body, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      const response = await fetch(`${API_BASE_URL}${path}${toQueryString(query)}`, {
        method,
        credentials: 'include',
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });

      const payload = await parseJsonSafely(response);

      if (!response.ok) {
        throw new HttpError(extractErrorMessage(payload, response.status), response.status, payload);
      }

      return payload as T;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new HttpError('A requisição demorou demais. Verifique sua conexão e tente novamente.', 408);
      }

      if (error instanceof HttpError) {
        throw error;
      }

      throw new HttpError('Falha ao se comunicar com o servidor.', 0);
    } finally {
      clearTimeout(timeout);
    }
  },
};
