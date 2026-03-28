import React from 'react';
import { useGame } from '../hooks/GameContext';
import { TeamLogo } from './TeamLogo';

export const Dashboard: React.FC = () => {
  const { state, toggleNationalMode, toggleRealisticSim, advanceSeason, resetStats, setActiveTab } = useGame();
  const nextTrack = state.tracks[state.currentRound] || state.tracks[0];

  const currentTeams = state.isNationalMode ? state.nationalTeams : state.teams;
  const currentStandings = state.isNationalMode ? state.standingsNational : state.standings;
  const currentModeName = state.isNationalMode ? 'National Cup' : 'World Championship';
  
  return (
    <div className="grid-layout animate-fade">
      <div className="glass-panel" style={{ gridColumn: 'span 12', padding: '1.5rem 2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <h1 style={{ fontSize: '2.2rem', marginBottom: '0.2rem', fontWeight: 900 }}>Global Racing Federation</h1>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em' }}>
                    SEASON {state.currentSeason} | {currentModeName.toUpperCase()} | ROUND {state.currentRound + 1}
                </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                    onClick={resetStats}
                    className="btn-secondary"
                    style={{ fontSize: '0.65rem', padding: '0.6rem 1.2rem', color: 'var(--primary)', borderColor: 'rgba(157, 0, 255, 0.2)' }}
                >
                    RESET STATS
                </button>
                <button 
                    onClick={toggleRealisticSim}
                    className="btn-secondary"
                    style={{ fontSize: '0.65rem', padding: '0.6rem 1.2rem' }}
                >
                    {state.isRealisticSim ? 'REALISM ON' : 'REALISM OFF'}
                </button>
                <button 
                    onClick={toggleNationalMode}
                    className="btn-primary"
                    style={{ fontSize: '0.65rem', padding: '0.6rem 1.2rem'}}
                >
                    {state.isNationalMode ? <span style={{color: 'gold'}}>🏆 NATIONAL MODE</span> : 'SWITCH NATIONAL'}
                </button>
                {state.currentRound === state.tracks.length - 1 && (
                    <button 
                        onClick={advanceSeason}
                        className="btn-primary"
                        style={{ fontSize: '0.65rem', padding: '0.6rem 1.2rem', background: '#00d2be', borderColor: '#00d2be', color: 'black' }}
                    >
                        OFF-SEASON
                    </button>
                )}
            </div>
        </div>
      </div>

      {!state.userTeamId && (
        <div className="glass-panel" style={{ gridColumn: 'span 12', padding: '1.5rem 2.5rem', background: 'rgba(157, 0, 255, 0.05)', border: '1px dashed var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '0.05em' }}>ACTION REQUIRED: SELECT YOUR TEAM</h3>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', fontWeight: 600, marginTop: '0.2rem' }}>
                    To manage pit stops and driver aggression, you must first claim a team in the <strong>Driver Market</strong>.
                </p>
            </div>
            <button 
                onClick={() => setActiveTab('market')} 
                className="btn-primary" 
                style={{ padding: '0.8rem 2rem', fontSize: '0.75rem' }}
            >
                SELECT TEAM NOW
            </button>
        </div>
      )}

      <div className="glass-panel" style={{ gridColumn: 'span 8', padding: '2.5rem' }}>
        <h4 style={{ color: 'var(--primary)', marginBottom: '1.5rem', fontSize: '1rem' }}>Next Event</h4>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '3rem' }}>
          <div style={{ 
              padding: '1.5rem', 
              background: '#25252d',
              borderLeft: '6px solid var(--primary)',
              textAlign: 'center' 
          }}>
             <span style={{ fontSize: '2.2rem', fontWeight: '900', display: 'block' }}>RD{String(state.currentRound + 1).padStart(2, '0')}</span>
          </div>
          <div>
            <h2 style={{ fontSize: '3rem', lineHeight: 1, marginBottom: '0.5rem', fontWeight: 900 }}>{nextTrack.name.toUpperCase()}</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '1.2rem', fontWeight: 600 }}>{nextTrack.location}</p>
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '2rem', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700 }}>
                <span>Length: <strong style={{color:'white'}}>{nextTrack.lengthKm}KM</strong></span>
                <span>Corners: <strong style={{color:'white'}}>{nextTrack.corners}</strong></span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ gridColumn: 'span 4', padding: '2.5rem' }}>
        <h4 style={{ color: 'var(--primary)', marginBottom: '1.5rem', fontSize: '1rem' }}>Session Control</h4>
        <div style={{ marginTop: '0.5rem' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginBottom: '2rem', fontWeight: 500 }}>
              {state.isNationalMode 
                ? '32 Nations. The unofficial results and standings are updated after each race weekend.' 
                : '10 Divisions, 100 Teams. The unofficial results and standings are updated after each race weekend.'}
          </p>
          <button className="btn-primary" style={{ width: '100%', fontSize: '0.8rem' }}>Race Control</button>
        </div>
      </div>

      <div className="glass-panel" style={{ gridColumn: 'span 12', padding: '0' }}>
        <div style={{ padding: '2rem 2.5rem 0 2.5rem' }}>
            <h4 style={{ color: 'var(--primary)', marginBottom: '1rem', fontSize: '1rem' }}>{currentModeName} Overview (Division 1)</h4>
        </div>
        <table>
          <thead>
            <tr>
              <th style={{ width: '80px', paddingLeft: '2.5rem' }}>POS</th>
              <th>CONSTRUCTOR</th>
              <th>CATEGORY</th>
              <th style={{ textAlign: 'right', paddingRight: '2.5rem' }}>PTS</th>
            </tr>
          </thead>
          <tbody>
            {currentTeams.filter(t => t.tier === 1).slice(0, 5).map((team, idx) => (
              <tr key={team.id}>
                <td style={{ paddingLeft: '2.5rem' }}>
                    <span className="pos-pill">{idx + 1}</span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '5px', height: '22px', background: team.color, borderRadius: '2px' }}></div>
                    <TeamLogo team={team} size={24} />

                    <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{team.name}</span>
                  </div>
                </td>
                <td style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)' }}>{team.category.toUpperCase()}</td>
                <td style={{ textAlign: 'right', paddingRight: '2.5rem', fontWeight: '900', color: 'var(--text-bright)', fontSize: '1.1rem' }}>
                    {currentStandings[1]?.[team.id] || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: '1.5rem 2.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'right' }}>
            <button className="btn-secondary" style={{ fontSize: '0.65rem', padding: '0.5rem 1rem' }}>View Full Standings</button>
        </div>
      </div>

      <div className="glass-panel" style={{ gridColumn: 'span 12', padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '2rem 2.5rem 0.5rem 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
                <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem', fontSize: '1rem' }}>Team Engineering Power Rankings</h4>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.65rem', fontWeight: 600 }}>BASED ON AERO, CHASSIS, AND POWER UNIT EFFICIENCY</p>
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--primary)' }}>DIV {state.isNationalMode ? '1' : state.currentTier}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1px', background: 'rgba(255,255,255,0.05)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            {currentTeams
                .filter(t => t.tier === (state.isNationalMode ? 1 : state.currentTier))
                .map(t => {
                    const quality = (t.stats.aero + t.stats.chassis + t.stats.powerUnit + t.stats.cornering + t.stats.topSpeed) / 5;
                    return { ...t, quality };
                })
                .sort((a,b) => b.quality - a.quality)
                .map((team, idx) => (
                    <div key={team.id} style={{ background: '#111119', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: idx < 3 ? `2px solid ${idx === 0 ? 'gold' : idx === 1 ? '#C0C0C0' : '#CD7F32'}` : 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--text-dim)' }}>RANK #{idx + 1}</span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 900, color: team.quality > 90 ? 'var(--primary)' : 'white' }}>{team.quality.toFixed(1)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <TeamLogo team={team} size={18} />
                            <span style={{ fontWeight: 800, fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{team.name.toUpperCase()}</span>
                        </div>
                        <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginTop: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${team.quality}%`, background: team.quality > 90 ? 'var(--primary)' : 'var(--text-dim)' }}></div>
                        </div>
                    </div>
                ))
            }
        </div>
      </div>

      <div className="glass-panel" style={{ gridColumn: 'span 12', padding: '2.5rem' }}>
        <h4 style={{ color: 'var(--primary)', marginBottom: '1.5rem', fontSize: '1rem' }}>Championship History (Hall of Fame)</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {(!state.wdcHistory || Object.entries(state.wdcHistory).length === 0) ? (
                <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>No historical record yet. Complete the first season to etch your name in history.</p>
            ) : (
                Object.entries(state.wdcHistory).sort((a,b) => Number(b[0]) - Number(a[0])).map(([season, tiers]) => {
                    const d1WdcArr = tiers[1];
                    const d1Wdc = d1WdcArr ? d1WdcArr[0] : null;
                    const d1WccArr = state.wccHistory[Number(season)]?.[1];
                    const d1Wcc = d1WccArr ? d1WccArr[0] : null;

                    if (!d1Wdc && !d1Wcc) return null;

                    const allTeams = [...state.teams, ...state.nationalTeams];
                    const allDrivers = [...state.drivers, ...state.driversNational];

                    const wdcDriver = allDrivers.find(d => d.id === d1Wdc?.driverId);
                    const wccTeam = allTeams.find(t => t.id === d1Wcc?.teamId);

                    return (
                        <div key={season} style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid gold' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 900, color: 'gold', letterSpacing: '0.1em' }}>{season} CHAMPIONS</div>
                                {wccTeam && (
                                    <TeamLogo team={wccTeam} size={22} />
                                )}
                            </div>
                            {d1Wdc && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '2px', fontWeight: 700 }}>WDC (DRIVERS)</div>
                                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-bright)' }}>{wdcDriver?.name.toUpperCase() || 'UNKNOWN'}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{allTeams.find(t => t.id === d1Wdc.teamId)?.name}</div>
                                </div>
                            )}
                            {d1Wcc && (
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '2px', fontWeight: 700 }}>WCC (CONSTRUCTORS)</div>
                                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-bright)' }}>{wccTeam?.name.toUpperCase() || 'UNKNOWN'}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{d1Wcc.points} PTS</div>
                                </div>
                            )}
                        </div>
                    );
                })
            )}
        </div>
      </div>
    </div>
  );
};
