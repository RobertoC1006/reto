import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Navigate, Outlet, useLocation } from 'react-router';
import { api } from '../shared/api/services';
import { ApiError } from '../shared/api/client';
import { ErrorState, Skeleton } from '../shared/components/ui';
export function useAuth() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['auth'], queryFn: api.me, retry: false, staleTime: 60_000 });
  return {
    ...query,
    login: async (email: string, password: string, remember: boolean) => {
      const user = await api.login({ email, password, remember });
      client.setQueryData(['auth'], user);
    },
    logout: async () => {
      await api.logout();
      client.clear();
    },
  };
}
export function RequireAuth() {
  const auth = useAuth();
  const location = useLocation();
  if (auth.isPending)
    return (
      <div className="auth-loading">
        <Skeleton />
      </div>
    );
  if ((!auth.data && !auth.error) || (auth.error instanceof ApiError && auth.error.status === 401))
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (auth.error) return <ErrorState error={auth.error} retry={() => auth.refetch()} />;
  return <Outlet />;
}
