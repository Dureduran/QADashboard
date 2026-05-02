
import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { StrategicDashboard } from './components/dashboard/StrategicDashboard';
import { Assistant } from './components/dashboard/Assistant';
import { DynamicPricingPanel } from './components/dashboard/DynamicPricingPanel';
import { NoShowPanel } from './components/dashboard/NoShowPanel';
import { UnconstrainingPanel } from './components/dashboard/UnconstrainingPanel';
import { ToastProvider } from './components/ui/Toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000,
      retry: 1,
    },
  },
});

const RMAssistantView = () => (
  <div className="max-w-7xl mx-auto pt-6">
    <h2 className="text-2xl font-bold text-slate-100 mb-6">Revenue Management Assistant</h2>
    <Assistant />
  </div>
);

const ForecastingView = () => (
  <div className="h-full">
    <div className="max-w-5xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-slate-100">Interactive Demand Forecasting</h2>
      <div className="h-[600px]">
        <DynamicPricingPanel />
      </div>
    </div>
  </div>
);

const NoShowView = () => (
  <div className="h-full">
    <div className="max-w-5xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-slate-100">Overbooking & No-Show Optimizer</h2>
      <div className="h-[600px]">
        <NoShowPanel />
      </div>
    </div>
  </div>
);

interface LayoutProps {
  children?: React.ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
}

const Layout = ({ children, currentView, onNavigate }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex overflow-hidden relative">
      <div 
        className="fixed inset-0 z-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'url(/qa-a350.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      <Sidebar 
        currentView={currentView} 
        onNavigate={onNavigate} 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 md:ml-56 flex flex-col h-screen overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto overflow-x-hidden -webkit-overflow-scrolling-touch">
          <div className="transition-opacity duration-150 ease-in-out">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  const [currentView, setCurrentView] = useState('Dashboard');

  const renderContent = () => {
    switch (currentView) {
      case 'Dashboard':
        return <StrategicDashboard />;
      case 'RM Assistant':
        return <RMAssistantView />;
      case 'Forecasting':
        return <ForecastingView />;
      case 'No-Show Predictor':
        return <NoShowView />;
      case 'Pricing Optimizer':
        return <UnconstrainingPanel />;
      default:
        return <StrategicDashboard />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <Layout currentView={currentView} onNavigate={setCurrentView}>
          {renderContent()}
        </Layout>
      </ToastProvider>
    </QueryClientProvider>
  );
}
