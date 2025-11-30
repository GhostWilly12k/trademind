import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layout';
import LoginPage from './pages/LoginPage'; // We'll make a dummy one below if missing
import  Dashboard  from './pages/Dashboard'
import TradeLog from './pages/TradeLog';
import Analytics from './pages/Analytics';
import AIInsights from './pages/AIInsights';

function App() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<div className="text-white p-10">Login Page Placeholder</div>} />

      {/* Protected Routes (Wrapped in your Layout) */}
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard/>} />
        <Route path="/tradelog" element={<TradeLog/>} />
        <Route path="/analytics" element={<Analytics/>} />
        <Route path="/ai-insights" element={<AIInsights/>} />
      </Route>

      {/* Catch all - Redirect to Home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;