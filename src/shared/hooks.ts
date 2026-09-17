import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api/services';
export const useDebounce = (value: string, wait = 300) => {
  const [result, setResult] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setResult(value), wait);
    return () => clearTimeout(timer);
  }, [value, wait]);
  return result;
};
export const useLeadDirectory = () =>
  useQuery({ queryKey: ['leads', 'directory'], queryFn: () => api.leads({ pageSize: 100 }) });
export function useRefresh() {
  const client = useQueryClient();
  return () =>
    Promise.all(
      [
        'leads',
        'appointments',
        'dashboard',
        'conversations',
        'reports',
        'availability',
        'public-session',
      ].map((key) => client.invalidateQueries({ queryKey: [key] })),
    );
}
