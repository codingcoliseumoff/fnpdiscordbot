import React, { useState, useEffect } from 'react';
import { useGame } from '../hooks/GameContext';
import { TeamLogo } from './TeamLogo';

export const Standings: React.FC = () => {
  const { state } = useGame();
  const [selectedTier, setSelectedTier] = useState(1);
  const [viewMode, setViewMode] = useState<'WCC' | 'WDC'>('WCC');

  const currentTeams = state.isNationalMode ? state.nationalTeams : state.teams;
  const currentTeamStandings = state.isNationalMode ? state.standingsNational : state.standings;
  const currentDriverStandings = state.isNationalMode ? state.standingsDriversNational : state.standingsDrivers;
  const maxTiers = state.isNationalMode ? 5 : 10;

  useEffect(() => {
    if (selectedTier > maxTiers) {
      setSelectedTier(1);
    }
  }, [state.isNationalMode, maxTiers, selectedTier]);

  const sortedTeams = currentTeams
    .filter(t => t.tier === selectedTier)
    .sort((a, b) => (currentTeamStandings[selectedTier]?.[b.id] || 0) - (currentTeamStandings[selectedTier]?.[a.id] || 0));

  const tierTeamsIds = currentTeams.filter(t => t.tier === selectedTier).map(t => t.id);
  const currentDrivers = state.isNationalMode ? state.driversNational : state.drivers;

  const sortedDrivers = currentDrivers
    .filter(d => {
        if (state.isNationalMode) {
            const team = state.nationalTeams.find(nt => nt.id === d.teamId);
            return team?.tier === selectedTier;
        }
        return tierTeamsIds.includes(d.teamId || '');
    })
    .sort((a, b) => (currentDriverStandings[selectedTier]?.[b.id] || 0) - (currentDriverStandings[selectedTier]?.[a.id] || 0));

  const tierButtons = [];
  for (let i = 1; i <= maxTiers; i++) {
    tierButtons.push(i);
  }

  const getTeamColor = (teamId: string | null) => {
      const team = currentTeams.find(t => t.id === teamId);
      return team?.color || 'transparent';
  };

  const getTeamName = (teamId: string | null) => {
      const team = currentTeams.find(t => t.id === teamId);
      return team?.name || '---';
  };

  return (
    <div className="grid-layout animate-fade">
      <div className="glass-panel" style={{ gridColumn: 'span 12', padding: '1.5rem 2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem' }}>{state.isNationalMode ? 'National Cup' : 'World Championship'}</h1>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button 
                onClick={() => setViewMode('WCC')}
                className={viewMode === 'WCC' ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '0.5rem 1.5rem', fontSize: '0.7rem' }}
              >
                CONSTRUCTORS
              </button>
              <button 
                onClick={() => setViewMode('WDC')}
                className={viewMode === 'WDC' ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '0.5rem 1.5rem', fontSize: '0.7rem' }}
              >
                DRIVERS
              </button>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.2rem', flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '400px' }}>
            {tierButtons.map(t => (
              <button 
                key={t}
                onClick={() => setSelectedTier(t)}
                style={{
                  padding: '0.5rem 0.8rem',
                  fontSize: '0.7rem',
                  fontFamily: 'var(--font-header)',
                  fontWeight: 900,
                  background: selectedTier === t ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  minWidth: '60px'
                }}
              >
                DIV {t}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
          <div className="glass-panel" style={{ padding: '0', background: 'transparent', border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>POS</th>
                  <th>{viewMode === 'WCC' ? 'CONSTRUCTOR' : 'DRIVER'}</th>
                  {viewMode === 'WDC' && <th>TEAM</th>}
                  <th style={{ textAlign: 'right' }}>PTS</th>
                </tr>
              </thead>
              <tbody>
                {viewMode === 'WCC' ? (
                  sortedTeams.map((team, idx) => (
                    <tr key={team.id}>
                      <td>
                        <span className="pos-pill">{idx + 1}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <div style={{ width: '4px', height: '20px', background: team.color }}></div>
                          <TeamLogo team={team} size={22} />

                          <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{team.name}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 900, fontSize: '1.2rem' }}>
                        {currentTeamStandings[selectedTier]?.[team.id] || 0}
                      </td>
                    </tr>
                  ))
                ) : (
                  sortedDrivers.map((driver, idx) => {
                    const dTeam = currentTeams.find(t => t.id === driver.teamId);
                    return (
                    <tr key={driver.id}>
                      <td>
                         <span className="pos-pill">{idx + 1}</span>
                      </td>
                      <td style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                        {driver.name.toUpperCase()}
                      </td>
                      <td style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dim)' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '3px', height: '12px', background: getTeamColor(driver.teamId) }}></div>
                             <TeamLogo team={dTeam} size={16} />

                            {getTeamName(driver.teamId)}
                         </div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 900, fontSize: '1.2rem' }}>
                        {currentDriverStandings[selectedTier]?.[driver.id] || 0}
                      </td>
                    </tr>
                  )})
                )}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="glass-panel" style={{ background: '#1c1c25' }}>
                <h4 style={{ color: 'var(--primary)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>LEADERBOARD STATS</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 700 }}>PROMOTION LINE (TOP 2)</p>
                        <div style={{ padding: '0.8rem', background: 'rgba(0,210,190,0.05)', borderLeft: '3px solid #00d2be', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {sortedTeams.slice(0, 2).map(t => (
                                <p key={t.id} style={{ fontSize: '0.9rem', fontWeight: 800 }}>{t.name}</p>
                            ))}
                        </div>
                    </div>
                    <div>
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 700 }}>RELEGATION RISK (BOTTOM 2)</p>
                        <div style={{ padding: '0.8rem', background: 'rgba(157, 0, 255, 0.05)', borderLeft: '3px solid var(--primary)', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {sortedTeams.slice(-2).reverse().map(t => (
                                <p key={t.id} style={{ fontSize: '0.9rem', fontWeight: 800 }}>{t.name}</p>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-panel" style={{ background: '#1c1c25' }}>
                <h4 style={{ color: 'var(--primary)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>DIVISION PYRAMID</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {tierButtons.map(t => (
                        <div 
                          key={t} 
                          onClick={() => setSelectedTier(t)}
                          style={{ 
                            padding: '0.8rem 1rem', 
                            background: selectedTier === t ? 'rgba(255,255,255,0.05)' : 'transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            borderBottom: '1px solid rgba(255,255,255,0.02)'
                          }}
                        >
                            <span style={{ color: selectedTier === t ? 'white' : 'var(--text-dim)' }}>DIV {t}</span>
                            <span style={{ opacity: 0.5, fontSize: '0.65rem' }}>{Object.keys(currentTeamStandings[t] || {}).length} ENTRIES</span>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
