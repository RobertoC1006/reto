import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import './styles/globals.css';
import App from './app/App';
import { ToastProvider } from './shared/components/ui';
import { ApiError } from './shared/api/client';
const client = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15000,
      retry: (count, err) => !(err instanceof ApiError && err.status < 500) && count < 1,
      refetchOnWindowFocus: true,
    },
    mutations: { retry: false },
  },
});
window.addEventListener('praxia:session-expired', () => {
  client.setQueryData(['auth'], null);
});
async function bootstrap() {
  if (import.meta.env.VITE_USE_MOCKS !== 'false') {
    const { worker } = await import('./mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass', quiet: true });
  }
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={client}>
        <ToastProvider>
          <App />
        </ToastProvider>
      </QueryClientProvider>
    </React.StrictMode>,
  );
}
bootstrap().catch((error) => {
  console.error(error);
  const root = document.getElementById('root')!;
  root.textContent = 'No se pudo iniciar Praxia. Recarga la página e inténtalo nuevamente.';
});
