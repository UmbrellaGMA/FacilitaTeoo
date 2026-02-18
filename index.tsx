
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import ContractSign from './pages/ContractSign';
import LandingPage from './pages/LandingPage';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Detectar se estamos no subdomínio do app ou no domínio principal (landing page)
const hostname = window.location.hostname;
const isAppDomain = hostname.startsWith('app.') || hostname === 'localhost' || hostname === '127.0.0.1';

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/assinar/:token" element={<ContractSign />} />
        {isAppDomain ? (
          <Route path="/*" element={<App />} />
        ) : (
          <>
            <Route path="/privacidade" element={<App />} />
            <Route path="/termos" element={<App />} />
            <Route path="/*" element={<LandingPage />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
