import React from 'react';
import { GameProvider, useGame } from './hooks/GameContext';
import { Dashboard } from './components/Dashboard';
import { RaceSession } from './components/RaceSession';
import { TeamManagement } from './components/TeamManagement';
import { Standings } from './components/Standings';
import { Calendar } from './components/Calendar';
import { TransferMarket } from './components/TransferMarket';

const AppContent: React.FC = () => {
  const { activeTab, setActiveTab } = useGame();

  return (
      <div className="app-container">
        {/* Navigation Sidebar */}
        <nav className="mobile-nav">
          <div className="nav-header">
            <h2 style={{ fontSize: '1.2rem', color: 'var(--primary)', fontWeight: 900, letterSpacing: '0.15em', margin: 0 }}>
              GRID HUB
            </h2>
            <div className="nav-header-bar"></div>
          </div>
          
          <div className="nav-items-container">
            <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
              Dashboard
            </div>
            <div className={`nav-item ${activeTab === 'race' ? 'active' : ''}`} onClick={() => setActiveTab('race')}>
              Race Control
            </div>
            <div className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>
              Calendar
            </div>
            <div className={`nav-item ${activeTab === 'standings' ? 'active' : ''}`} onClick={() => setActiveTab('standings')}>
              Standings
            </div>
            <div className={`nav-item ${activeTab === 'manufacturer' ? 'active' : ''}`} onClick={() => setActiveTab('manufacturer')}>
              Manufacturers
            </div>
            <div className={`nav-item ${activeTab === 'market' ? 'active' : ''}`} onClick={() => setActiveTab('market')}>
              Driver Market
            </div>
          </div>

          <div className="nav-status">
            <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '8px', letterSpacing: '0.1em', fontWeight: 700 }}>Simulation Status</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
               <div style={{ width: '8px', height: '8px', background: '#00d2be', borderRadius: '50%' }}></div>
               <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'white', textTransform: 'uppercase' }}>Engine Online</span>
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="main-content">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'race' && <RaceSession />}
          {activeTab === 'standings' && <Standings />}
          {activeTab === 'manufacturer' && <TeamManagement />}
          {activeTab === 'calendar' && <Calendar />}
          {activeTab === 'market' && <TransferMarket />}
        </main>
      </div>
  );
};

const App: React.FC = () => {
    return (
        <GameProvider>
            <AppContent />
        </GameProvider>
    );
};

export default App;
