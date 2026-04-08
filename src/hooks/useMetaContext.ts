import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useMetaContext() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['meta-user-settings', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('user_settings')
        .select('meta_access_token, meta_account_id')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // cache por 5 minutos
  });

  const { mutateAsync: updateAccountId } = useMutation({
    mutationFn: async (newAccountId: string) => {
      if (!user) throw new Error('User not authenticated');
      // Necessário manter o token atual, se existir, na tabela.
      const currentToken = settings?.meta_access_token || '';
      const payload = {
        user_id: user.id,
        meta_account_id: newAccountId,
        meta_access_token: currentToken,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await (supabase as any).from('user_settings').upsert(payload, { onConflict: 'user_id' });
      if (error) throw error;
      return newAccountId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meta-user-settings'] });
      queryClient.invalidateQueries({
         predicate: (q) => typeof q.queryKey[0] === 'string' && q.queryKey[0].startsWith('meta-')
      });
    }
  });

  return {
    token: settings?.meta_access_token || '',
    accountId: settings?.meta_account_id || '',
    isLoading,
    error,
    hasMetaSetup: !!settings?.meta_access_token && !!settings?.meta_account_id,
    updateAccountId
  };
}
