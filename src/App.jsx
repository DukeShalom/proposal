import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Clients from './pages/Clients.jsx';
import Services from './pages/Services.jsx';
import Documents from './pages/Documents.jsx';
import DocumentBuilder from './pages/DocumentBuilder.jsx';
import DocumentPreview from './pages/DocumentPreview.jsx';
import SignPage from './pages/SignPage.jsx';

function Layout() {
  const location = useLocation();
  const isSignPage = location.pathname.startsWith('/sign/');

  if (isSignPage) {
    return (
      <div style={{ minHeight: '100vh', width: '100%', background: 'var(--bg-deep)' }}>
        <Routes>
          <Route path="/sign/:token" element={<SignPage />} />
        </Routes>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <Sidebar />
      <main style={{
        flex: 1,
        minWidth: 0,
        background: 'var(--bg-deep)',
        minHeight: '100vh',
        overflow: 'auto',
      }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/services" element={<Services />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/documents/new" element={<DocumentBuilder />} />
          <Route path="/documents/:id" element={<DocumentPreview />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}
