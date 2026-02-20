import { useAuth } from '../context/AuthContext';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

export const useApi = () => {
  const { token } = useAuth();

  const makeRequest = async (url: string, options: ApiOptions = {}) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `API error: ${response.statusText}`);
    }

    return response.json();
  };

  const get = (url: string) => makeRequest(url, { method: 'GET' });

  const post = (url: string, body: any) =>
    makeRequest(url, { method: 'POST', body });

  const put = (url: string, body: any) =>
    makeRequest(url, { method: 'PUT', body });

  return { get, post, put };
};
