import React, { useState } from 'react';
import { useGame } from '../hooks/GameContext';
import type { Driver } from '../data/drivers';

export const TransferMarket: React.FC = () => {
  const { state, updateDriver, createDriver, selectUserTeam } = useGame();
  const [search, setSearch] = useState('');
  const [selectedTeamForTransfer, setSelectedTeamForTransfer] = useState<string | null>(null);
  const [driverIdToReplace, setDriverIdToReplace] = useState<string>('');

  const [customName, setCustomName] = useState('');
  const [customPace, setCustomPace] = useState(85);
  const [customConsistency, setCustomConsistency] = useState(85);
  const [customRacecraft, setCustomRacecraft] = useState(85);
  const [showCustomPortal, setShowCustomPortal] = useState(false);

  const getDriverRating = (driver: Driver) => {
    const s = driver.stats;
    return (s.pace + s.racecraft + s.consistency) / 3;
  };

  const getMarketValue = (driver: Driver) => {
    const rating = getDriverRating(driver);
    const potential = driver.potential;
    const value = (rating * 0.5) + (rating * 0.3) + (potential * 0.2); // Simplified recent performance as rating for now
    return (value * 1.5).toFixed(1); // Scale it nicely
  };

  const currentDrivers = state.isNationalMode ? state.driversNational : state.drivers;

  const filteredDrivers = currentDrivers.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.nationality.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => getDriverRating(b) - getDriverRating(a));

  const getTeamName = (teamId: string | null) => {
    if (!teamId) return 'Free Agent';
    return state.teams.find(t => t.id === teamId)?.name || state.nationalTeams.find(t => t.id === teamId)?.name || 'Unknown';
  };

  const targetTeamDrivers = selectedTeamForTransfer
    ? currentDrivers.filter(d => d.teamId === selectedTeamForTransfer)
    : [];

  const handleSign = (newDriver: Driver) => {
    if (!selectedTeamForTransfer) {
      alert("Please select a target team first.");
      return;
    }

    if (!driverIdToReplace && targetTeamDrivers.length >= 2) {
      alert("Please select which driver to replace in the target team.");
      return;
    }

    if (driverIdToReplace) {
      updateDriver(driverIdToReplace, { teamId: null, role: 'FreeAgent' });
    }

    updateDriver(newDriver.id, { teamId: selectedTeamForTransfer, role: 'Main' });
    alert(`${newDriver.name.toUpperCase()} HAS SIGNED A CONTRACT WITH ${getTeamName(selectedTeamForTransfer).toUpperCase()}.`);
    setDriverIdToReplace('');
  };

  const handleCreateCustom = () => {
    if (!selectedTeamForTransfer || !driverIdToReplace) {
      alert("Select team and driver to replace first.");
      return;
    }
    if (!customName) {
      alert("Enter a name for the custom driver.");
      return;
    }

    const driverData: Omit<Driver, 'id'> = {
      name: customName,
      nationality: 'INT',
      age: 22,
      teamId: null, // Will be set by Context's createDriver
      role: 'Main',
      stats: {
        pace: customPace,
        consistency: customConsistency,
        racecraft: customRacecraft,
        aggression: 80,
        tyreManagement: customPace,
        wetWeatherSkill: customPace,
        qualifyingSkill: customPace,
        mentality: customPace
      },
      potential: Math.min(99, customPace + 5),
      loyalty: 90,
      adaptability: 90
    };

    createDriver(driverData, driverIdToReplace);

    alert(`CUSTOM DRIVER ${customName.toUpperCase()} REPLACED THE PREVIOUS SEAT.`);
    setCustomName('');
    setShowCustomPortal(false);
  };

  return (
    <div className="grid-layout animate-fade">
      <div className="glass-panel" style={{ gridColumn: 'span 12', padding: '1.5rem 2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 900 }}>DRIVER MARKET</h1>
            <p style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', marginTop: '0.5rem' }}>GRID TRANSFER PORTAL | SEASON {state.currentSeason}</p>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <select
                      value={selectedTeamForTransfer || ''}
                      onChange={(e) => {
                        setSelectedTeamForTransfer(e.target.value);
                        setDriverIdToReplace('');
                      }}
                      style={{ background: '#1c1c25', color: 'white', border: '1px solid #333', padding: '0.6rem 1rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}
                    >
                      <option value="">CHOOSE CONSTRUCTOR...</option>
                      {[...state.teams, ...state.nationalTeams].sort((a, b) => a.name.localeCompare(b.name)).map(t => (
                        <option key={t.id} value={t.id}>{t.name.toUpperCase()}</option>
                      ))}
                    </select>
                    {selectedTeamForTransfer && (
                        <button 
                            className="btn-primary" 
                            style={{ 
                                fontSize: '0.65rem', 
                                padding: '0.6rem 1rem', 
                                background: state.userTeamId === selectedTeamForTransfer ? '#00d2be' : '',
                                borderColor: state.userTeamId === selectedTeamForTransfer ? '#00d2be' : ''
                            }}
                            onClick={() => {
                                selectUserTeam(selectedTeamForTransfer);
                                const tName = [...state.teams, ...state.nationalTeams].find(t => t.id === selectedTeamForTransfer)?.name;
                                alert(`TEAM ${tName?.toUpperCase() || 'SELECTED'} HAS BEEN CLAIMED AS YOUR PLAYER TEAM.`);
                            }}
                        >
                            {state.userTeamId === selectedTeamForTransfer ? 'MY TEAM ✅' : 'PICK AS PLAYER TEAM'}
                        </button>
                    )}
                </div>
              </div>

              {selectedTeamForTransfer && (
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 800, marginBottom: '0.4rem' }}>REPLACE SEAT</p>
                  <select
                    value={driverIdToReplace}
                    onChange={(e) => setDriverIdToReplace(e.target.value)}
                    style={{ background: '#1c1c25', color: 'white', border: '1px solid #333', padding: '0.6rem 1rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}
                  >
                    <option value="">CHOOSE DRIVER...</option>
                    {targetTeamDrivers.map(d => (
                      <option key={d.id} value={d.id}>{d.name.toUpperCase()}</option>
                    ))}
                    {targetTeamDrivers.length < 2 && <option value="empty">EMPTY SEAT</option>}
                  </select>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setShowCustomPortal(!showCustomPortal)}
                className="btn-secondary"
                style={{ fontSize: '0.7rem', border: '1px solid var(--primary)', color: 'var(--primary)' }}
              >
                {showCustomPortal ? 'CLOSE CREATOR' : 'CUSTOM DRIVER'}
              </button>
              <input
                type="text"
                placeholder="SEARCH DRIVER NAME..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  background: '#1c1c25',
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '0.8rem 1.2rem',
                  color: 'white',
                  width: '240px',
                  fontFamily: 'var(--font-header)',
                  fontWeight: 700,
                  fontSize: '0.8rem'
                }}
              />
            </div>
          </div>
        </div>

        {showCustomPortal && (
          <div className="glass-panel" style={{ gridColumn: 'span 12', marginBottom: '2rem', background: 'rgba(157, 0, 255, 0.05)', border: '2px dashed var(--primary)' }}>
            <h4 style={{ color: 'var(--primary)', marginBottom: '1.5rem', fontWeight: 900 }}>IDENTITY ARCHITECT | CREATE CUSTOM PILOT</h4>
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-dim)', marginBottom: '0.5rem' }}>FULL NAME</p>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="NAME YOUR CHAMPION..."
                  style={{ background: '#1c1c25', color: 'white', border: '1px solid #444', padding: '0.8rem', width: '100%', fontWeight: 700 }}
                />
              </div>
              <div style={{ width: '160px' }}>
                <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-dim)', marginBottom: '0.5rem' }}>PACE ({customPace})</p>
                <input
                  type="range"
                  min="60" max="98"
                  value={customPace}
                  onChange={(e) => setCustomPace(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>
              <div style={{ width: '160px' }}>
                <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-dim)', marginBottom: '0.5rem' }}>CONSISTENCY ({customConsistency})</p>
                <input
                  type="range"
                  min="60" max="98"
                  value={customConsistency}
                  onChange={(e) => setCustomConsistency(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>
              <div style={{ width: '160px' }}>
                <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-dim)', marginBottom: '0.5rem' }}>RACECRAFT ({customRacecraft})</p>
                <input
                  type="range"
                  min="60" max="98"
                  value={customRacecraft}
                  onChange={(e) => setCustomRacecraft(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>
              <button
                onClick={handleCreateCustom}
                className="btn-primary"
                style={{ height: '45px', padding: '0 2rem' }}
              >
                INITIALIZE REPLACEMENT
              </button>
              <p style={{ flex: '100%', fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
                * This will permanently replace the driver selected in the "TARGET TEAM" and "REPLACE SEAT" dropdowns above.
              </p>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredDrivers.slice(0, 48).map(driver => (
            <div key={driver.id} className="glass-panel" style={{
              background: '#15151e',
              borderTop: `4px solid ${driver.role === 'FreeAgent' ? 'var(--primary)' : '#444'}`,
              padding: '1.8rem',
              borderLeft: 'none',
              borderRight: 'none',
              borderBottom: 'none'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ color: 'var(--text-bright)', margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>{driver.name.toUpperCase()}</h4>
                  <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-dim)', marginTop: '0.4rem', letterSpacing: '0.05em' }}>{driver.nationality} | AGE {driver.age}</p>
                </div>
                <div style={{ textAlign: 'center', background: '#25252d', padding: '0.4rem 0.8rem', borderLeft: '3px solid var(--primary)' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: '900', color: 'white' }}>{Math.round(getDriverRating(driver))}</div>
                  <div style={{ fontSize: '0.55rem', fontWeight: 900, color: 'var(--text-dim)' }}>RATING</div>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.6rem', textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.6rem', fontWeight: 800 }}>POTENTIAL</div>
                  <div style={{ fontWeight: 900, fontSize: '0.9rem', color: '#00d2be' }}>{Math.round(driver.potential)}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.6rem', textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.6rem', fontWeight: 800 }}>VALUE</div>
                  <div style={{ fontWeight: 900, fontSize: '0.9rem', color: 'var(--primary)' }}>${getMarketValue(driver)}M</div>
                </div>
              </div>

              <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-dim)', margin: 0, letterSpacing: '0.05em' }}>CURRENT SEAT</p>
                  <span style={{ fontSize: '0.8rem', fontWeight: 900, color: 'white' }}>
                    {getTeamName(driver.teamId).toUpperCase()}
                  </span>
                </div>

                <button
                  onClick={() => handleSign(driver)}
                  className="btn-primary"
                  style={{
                    padding: '0.6rem 1.5rem',
                    fontSize: '0.7rem',
                    opacity: selectedTeamForTransfer ? 1 : 0.3,
                    cursor: selectedTeamForTransfer ? 'pointer' : 'not-allowed'
                  }}
                >
                  OFFER CONTRACT
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
