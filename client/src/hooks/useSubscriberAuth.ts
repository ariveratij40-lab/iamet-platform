import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";

export interface SubscriberUser {
  id: number;
  email: string;
  name: string;
  company?: string | null;
  phone?: string | null;
  plan: "free" | "pro" | "enterprise";
  status: "active" | "inactive" | "suspended";
  createdAt: Date;
}

const SUBSCRIBER_TOKEN_KEY = "iamet_sub_token";

export function useSubscriberAuth() {
  const [token, setToken] = useState<string | null>(() =>
    typeof window !== "undefined"
      ? localStorage.getItem(SUBSCRIBER_TOKEN_KEY)
      : null
  );

  const meQuery = trpc.subscribers.me.useQuery(undefined, {
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const loginMutation = trpc.subscribers.login.useMutation();
  const logoutMutation = trpc.subscribers.logout.useMutation();
  const utils = trpc.useUtils();

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await loginMutation.mutateAsync({ email, password });
      if (result.token) {
        localStorage.setItem(SUBSCRIBER_TOKEN_KEY, result.token);
        setToken(result.token);
      }
      await utils.subscribers.me.invalidate();
      return result;
    },
    [loginMutation, utils]
  );

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
    localStorage.removeItem(SUBSCRIBER_TOKEN_KEY);
    setToken(null);
    await utils.subscribers.me.invalidate();
  }, [logoutMutation, utils]);

  const subscriber = meQuery.data as SubscriberUser | null | undefined;
  const isLoading = meQuery.isLoading;
  const isAuthenticated = !!subscriber;

  return {
    subscriber,
    isAuthenticated,
    isLoading,
    token,
    login,
    logout,
    loginLoading: loginMutation.isPending,
    loginError: loginMutation.error?.message,
  };
}
