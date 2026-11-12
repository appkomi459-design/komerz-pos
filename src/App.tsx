import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { BusinessProvider } from '@/contexts/BusinessContext';
import { AppRoutes } from '@/routes/AppRoutes';

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <BusinessProvider>
            <AppRoutes />
          </BusinessProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
