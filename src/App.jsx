import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layout';
import Dashboard from './pages/Dashboard';
import TradeLog from './pages/TradeLog';
import Analytics from './pages/Analytics';
import AIInsights from './pages/AIInsights';
import Watchlist from './pages/TradePlanner';

function App() {
  return (
    <Routes>
      {/* The Layout component now handles Auth protection.
        - If logged out: it shows LandingPage
        - If logged in: it shows the Sidebar and the requested page (Outlet)
      */}
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/watchlist" element={<Watchlist />} />
        <Route path="/tradelog" element={<TradeLog />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/ai-insights" element={<AIInsights />} />
      </Route>

      {/* Catch all - Redirect to Root (which will show LandingPage or Dashboard) */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;