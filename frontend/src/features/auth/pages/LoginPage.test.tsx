import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginPage } from './LoginPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

describe('LoginPage', () => {
  it('renders login form', () => {
    render(
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <LoginPage />
        </QueryClientProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/login/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });
});
