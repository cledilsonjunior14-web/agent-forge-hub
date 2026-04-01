import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useMetaContext() {
  const { user } = useAuth();

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['meta-user-settings', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_settings')
        .select('meta_access_token, meta_account_id')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // cache por 5 minutos
  });

  return {
    token: settings?.meta_access_token || '',
    accountId: settings?.meta_account_id || '',
    isLoading,
    error,
    hasMetaSetup: !!settings?.meta_access_token && !!settings?.meta_account_id
  };
}
