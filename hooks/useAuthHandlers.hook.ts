import { useCallback } from 'react';
import { Step } from '../types/app.types';
import { cleanPhone } from '../utils/phone.utils';
import { authApi } from '../services/authApi';

export const useAuthHandlers = (
  loadUserData: (userId: string) => Promise<void>,
  setStep: (step: Step) => void,
  setError: (error: string | null) => void,
  setLoading: (loading: boolean) => void
) => {
  const handleCheckPhone = useCallback(async (phone: string) => {
    const clean = cleanPhone(phone);
    if (clean.length < 10) {
      setError('Telefone inválido');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const exists = await authApi.checkPhoneExists(clean);
      setStep(exists ? Step.LOGIN : Step.REGISTER);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao verificar telefone');
    } finally {
      setLoading(false);
    }
  }, [setStep, setError, setLoading]);

  const handleLogin = useCallback(async (phone: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const userId = await authApi.login(cleanPhone(phone), password);

      if (userId) {
        await loadUserData(userId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar');
    } finally {
      setLoading(false);
    }
  }, [loadUserData, setError, setLoading]);

  const handleRegister = useCallback(async (
    phone: string,
    password: string,
    name: string,
    isGoalkeeper: boolean
  ) => {
    if (!name.trim()) {
      setError('Informe seu nome');
      return;
    }

    if (password.length < 6) {
      setError('Senha muito curta');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userId = await authApi.register({
        phone: cleanPhone(phone),
        password,
        name,
        isGoalkeeper,
      });

      if (userId) {
        await loadUserData(userId);
      }

      setStep(Step.PHONE_CHECK);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  }, [loadUserData, setStep, setError, setLoading]);

  return {
    handleCheckPhone,
    handleLogin,
    handleRegister
  };
};
