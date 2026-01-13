import React, { useState, useEffect } from 'react';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import IncomePage from './components/IncomePage';
import OutgoingPage from './components/OutgoingPage';
import PaymentProviderPage from './components/PaymentProviderPage';
import HistoryPage from './components/HistoryPage';
import PredictionsPage from './components/PredictionsPage';
import LoginScreen from './components/LoginScreen';
import SetupWizard from './components/SetupWizard';

function App() {
  // Auth state
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstRun, setIsFirstRun] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // App state
  const [activePage, setActivePage] = useState('dashboard');
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalOutgoing: 0,
    balance: 0,
    recentIncome: [],
    recentOutgoing: [],
    monthlyIncome: [],
    monthlyOutgoing: []
  });
  const [providers, setProviders] = useState([]);
  const [currency, setCurrency] = useState('EUR');

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    setIsLoading(true);
    try {
      const result = await window.electronAPI.auth.isFirstRun();
      if (result.success) {
        setIsFirstRun(result.isFirstRun);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    }
    setIsLoading(false);
  };

  const handleSetupComplete = () => {
    setIsFirstRun(false);
    setIsAuthenticated(true);
    loadAppData();
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
    loadAppData();
  };

  const loadAppData = () => {
    loadDashboardStats();
    loadProviders();
    loadSettings();
  };

  const loadDashboardStats = async () => {
    const result = await window.electronAPI.db.getDashboardStats();
    if (result.success) {
      setStats(result.data);
    }
  };

  const loadProviders = async () => {
    const result = await window.electronAPI.db.getAll('payment_providers');
    if (result.success) {
      setProviders(result.data);
    }
  };

  const loadSettings = async () => {
    const result = await window.electronAPI.db.getSettings();
    if (result.success && result.data.currency) {
      setCurrency(result.data.currency);
    }
  };

  const handleCurrencyChange = async (newCurrency) => {
    setCurrency(newCurrency);
    await window.electronAPI.db.updateSettings({ currency: newCurrency });
  };

  const handleDataChange = () => {
    loadDashboardStats();
    loadProviders();
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard stats={stats} currency={currency} />;
      case 'history':
        return <HistoryPage currency={currency} />;
      case 'income':
        return <IncomePage onDataChange={handleDataChange} providers={providers} currency={currency} />;
      case 'outgoing':
        return <OutgoingPage onDataChange={handleDataChange} providers={providers} currency={currency} />;
      case 'predictions':
        return <PredictionsPage currency={currency} stats={stats} />;
      case 'providers':
        return <PaymentProviderPage onDataChange={handleDataChange} />;
      default:
        return <Dashboard stats={stats} currency={currency} />;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="d-flex align-items-center justify-content-center"
           style={{
             minHeight: '100vh',
             background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
           }}>
        <div className="text-center text-white">
          <i className="fas fa-spinner fa-spin fa-3x mb-3"></i>
          <h5>Loading...</h5>
        </div>
      </div>
    );
  }

  // First run - show setup wizard
  if (isFirstRun) {
    return <SetupWizard onComplete={handleSetupComplete} />;
  }

  // Not authenticated - show login
  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Main app
  return (
    <div className="app-container">
      <TitleBar />
      <div className="app-body">
        <Sidebar
          activePage={activePage}
          onNavigate={setActivePage}
          stats={stats}
          currency={currency}
          onCurrencyChange={handleCurrencyChange}
        />
        <main className="main-content">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default App;
