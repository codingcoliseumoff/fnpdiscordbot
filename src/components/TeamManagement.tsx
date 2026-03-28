import React, { useState } from 'react';
import { useGame } from '../hooks/GameContext';
import { TeamLogo } from './TeamLogo';

export const TeamManagement: React.FC = () => {
  const { state, updateTeam, updateDriver } = useGame();

  const currentTeams = state.isNationalMode ? state.nationalTeams : state.teams;
  const [selectedTeamId, setSelectedTeamId] = useState<string>(currentTeams[0]?.id || '');
  const [search, setSearch] = useState('');

  const filteredTeams = currentTeams.filter((t: any) =>
    (t.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (t.category?.toLowerCase() || '').includes(search.toLowerCase())
  );

  const selectedTeam = currentTeams.find((t: any) => t.id === selectedTeamId) || filteredTeams[0] || currentTeams[0];
  const teamDrivers = state.drivers.filter((d: any) => d.teamId === (selectedTeam?.id || ''));

  const handleStatChange = (statName: string, value: string) => {
    if (!selectedTeam) return;
    const numValue = Math.max(0, Math.min(100, parseInt(value) || 0));
    updateTeam(selectedTeam.id, {
      stats: {
        ...selectedTeam.stats,
        [statName]: numValue
      }
    });
  };

  const handleDriverSwap = (oldDriverId: string, newDriverId: string) => {
    if (!selectedTeam || oldDriverId === newDriverId) return;
    if (oldDriverId) updateDriver(oldDriverId, { teamId: null, role: 'FreeAgent' });
    updateDriver(newDriverId, { teamId: selectedTeam.id, role: 'Main' });
  };

  const getTeamName = (teamId: string | null) => {
    if (!teamId) return 'Free Agent';
    const allTeamsCount = [...state.teams, ...state.nationalTeams];
    return allTeamsCount.find((t: any) => t.id === teamId)?.name || 'Other Team';
  };

  if (!selectedTeam) return null;

  return (
    <div className="grid-layout animate-fade">
      <div className="glass-panel" style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '100vh', padding: '1.5rem 2rem' }}>
        <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>
          {state.isNationalMode ? 'NATIONAL ENTRIES' : 'CONSTRUCTORS'}
        </h4>
        <input
          type="text"
          placeholder="FILTER TEAMS..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          style={{
            background: '#1c1c25',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '0.8rem 1.2rem',
            color: 'white',
            fontFamily: 'var(--font-header)',
            fontWeight: 700,
            fontSize: '0.8rem'
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto', marginTop: '1rem' }}>
          {filteredTeams.map((team: any) => (
            <div
              key={team.id}
              onClick={() => setSelectedTeamId(team.id)}
              style={{
                padding: '1rem',
                cursor: 'pointer',
                background: selectedTeamId === team.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                borderLeft: `4px solid ${selectedTeamId === team.id ? 'var(--primary)' : 'transparent'}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.1s'
              }}
            >
              <span style={{ fontWeight: 800, fontSize: '0.9rem', color: selectedTeamId === team.id ? 'white' : 'var(--text-dim)' }}>{team.name.toUpperCase()}</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-dim)' }}>DIV {team.tier}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel" style={{ gridColumn: 'span 8', padding: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flex: 1 }}>
            <div style={{
              width: '100px',
              height: '100px',
              borderRadius: '16px',
              background: 'rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              border: `2px solid ${selectedTeam.color}`,
              boxShadow: `0 0 20px ${selectedTeam.color}33`,
              flexShrink: 0
            }}>
              <TeamLogo team={selectedTeam} size={120} style={{ width: '80%', height: '80%' }} />
            </div>

            <div style={{ flex: 1, marginRight: '2rem' }}>
              <input
                type="text"
                value={selectedTeam.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateTeam(selectedTeam.id, { name: e.target.value })}
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '2px dashed rgba(255,255,255,0.2)',
                  color: 'white',
                  padding: '0 0 5px 0',
                  textTransform: 'uppercase',
                  width: '100%',
                  outline: 'none'
                }}
                title="Click to rename team"
              />
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.8rem' }}>
                <p style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.8rem', margin: 0 }}>{selectedTeam.category.toUpperCase()} | DIV {selectedTeam.tier}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, background: 'rgba(0,0,0,0.3)', padding: '0.3rem 0.8rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>WEBSITE:</span>
                  <input 
                    type="text"
                    value={selectedTeam.domain || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateTeam(selectedTeam.id, { domain: e.target.value })}
                    placeholder="e.g. apple.com"
                    style={{ 
                      background: 'transparent', 
                      border: 'none', 
                      color: 'var(--primary)', 
                      fontSize: '0.75rem', 
                      fontWeight: 700,
                      width: '100%',
                      outline: 'none',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
            <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-dim)', margin: 0 }}>TEAM COLOR</p>
            <input
              type="color"
              value={selectedTeam.color?.length === 7 ? selectedTeam.color : '#ffffff'}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateTeam(selectedTeam.id, { color: e.target.value })}
              style={{
                width: '60px',
                height: '40px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: 0
              }}
              title="Click to change team color"
            />
          </div>
        </div>

        {!state.isNationalMode && (
          <div style={{ marginBottom: '3rem' }}>
            <h4 style={{ color: 'var(--primary)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>ACTIVE LINEUP</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {[0, 1].map((idx: number) => {
                const driver = teamDrivers[idx];
                return (
                  <div key={idx} style={{ padding: '1.5rem', background: '#1c1c25', borderTop: '4px solid var(--primary)' }}>
                    <label style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-dim)', display: 'block', marginBottom: '0.8rem', letterSpacing: '0.05em' }}>SEAT {idx + 1}</label>
                    <select
                      value={driver?.id || ''}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleDriverSwap(driver?.id || '', e.target.value)}
                      style={{ width: '100%', background: '#111', color: '#fff', border: '1px solid #333', padding: '0.8rem', fontSize: '0.85rem', fontWeight: 700 }}
                    >
                      <option value="">SELECT DRIVER...</option>
                      {state.drivers
                        .sort((a: any, b: any) => a.name.localeCompare(b.name))
                        .map((d: any) => (
                          <option key={d.id} value={d.id}>
                            {d.name.toUpperCase()} ({getTeamName(d.teamId).toUpperCase()})
                          </option>
                        ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
          <div>
            <h4 style={{ color: 'var(--primary)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>TECHNICAL STATS</h4>
            {selectedTeam.stats && Object.entries(selectedTeam.stats).slice(0, 6).map(([key, val]: [string, any]) => (
              <div key={key} style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.75rem', fontWeight: 800 }}>
                  <label>{key.replace(/([A-Z])/g, ' $1').toUpperCase()}</label>
                  <span style={{ color: 'white' }}>{val}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={val}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleStatChange(key, e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>
            ))}
          </div>

          <div>
            <h4 style={{ color: 'var(--primary)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>AERO & POWER</h4>
            {selectedTeam.stats && Object.entries(selectedTeam.stats).slice(6).map(([key, val]: [string, any]) => (
              <div key={key} style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.75rem', fontWeight: 800 }}>
                  <label>{key.replace(/([A-Z])/g, ' $1').toUpperCase()}</label>
                  <span style={{ color: 'white' }}>{val}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={val}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleStatChange(key, e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>
            ))}

            <div style={{ marginTop: '2.5rem', padding: '1.5rem', background: '#1c1c25', borderLeft: '4px solid #ffd300' }}>
              <h5 style={{ color: '#ffd300', marginBottom: '1rem', fontSize: '0.75rem', fontWeight: 900 }}>PU PARTNERSHIP</h5>
              <select
                value={selectedTeam.engineSupplierId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateTeam(selectedTeam.id, { engineSupplierId: e.target.value })}
                style={{ width: '100%', background: '#000', color: 'white', padding: '0.8rem', border: '1px solid #333', fontSize: '0.85rem', fontWeight: 700 }}
              >
                {state.engines.map((eng: any) => (
                  <option key={eng.id} value={eng.id}>{eng.name.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
