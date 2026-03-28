import React from 'react';
import { useGame } from '../hooks/GameContext';

export const Calendar: React.FC = () => {
  const { state } = useGame();

  const schedule = state.tracks.map((track, idx) => ({
    round: idx + 1,
    name: track.name,
    location: track.location,
    date: `MARCH ${14 + (idx * 7)}, ${state.currentSeason}`,
    status: idx === state.currentRound ? 'UPCOMING' : (idx < state.currentRound ? 'COMPLETED' : 'SCHEDULED')
  }));

  return (
    <div className="grid-layout animate-fade">
      <div className="glass-panel" style={{ gridColumn: 'span 12', padding: '1.5rem 2.5rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 900 }}>SEASON {state.currentSeason} CALENDAR</h1>
        <p style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', marginTop: '0.5rem' }}>UNOFFICIAL SCHEDULE | 30 ROUNDS | TIER {state.currentTier}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '2.5rem' }}>
          {schedule.map((event, idx) => {
            const results = state.raceResults[state.currentSeason]?.[idx];
            const winner = results?.find((r: any) => r.position === 1);
            const winnerDriver = winner ? state.drivers.find(d => d.id === winner.driverId) : null;

            return (
              <div 
                key={event.round}
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '100px 1.5fr 1fr 1fr 150px', 
                  alignItems: 'center',
                  padding: '1.5rem 2rem',
                  background: event.status === 'UPCOMING' ? 'rgba(157, 0, 255, 0.05)' : '#15151e',
                  borderLeft: event.status === 'UPCOMING' ? '6px solid var(--primary)' : '6px solid transparent',
                  borderBottom: '1px solid rgba(255,255,255,0.02)'
                }}
              >
                <div style={{ fontSize: '1.8rem', fontWeight: '900', color: event.status === 'UPCOMING' ? 'white' : 'var(--text-dim)' }}>
                  RD{event.round.toString().padStart(2, '0')}
                </div>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '1.3rem', letterSpacing: '0.02em' }}>{event.name.toUpperCase()}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', marginTop: '0.2rem' }}>{event.location.toUpperCase()}</div>
                </div>
                <div style={{ fontFamily: 'var(--font-header)', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                  {event.date}
                </div>
                <div>
                   {winnerDriver && (
                       <div style={{ background: 'rgba(0, 210, 190, 0.1)', padding: '4px 12px', border: '1px solid #00d2be', borderRadius: '4px' }}>
                           <span style={{ fontSize: '0.65rem', color: '#00d2be', fontWeight: 900, display: 'block' }}>WINNER</span>
                           <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>{winnerDriver.name.toUpperCase()}</span>
                       </div>
                   )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ 
                    padding: '4px 15px', 
                    fontSize: '0.65rem', 
                    background: event.status === 'UPCOMING' ? 'var(--primary)' : (event.status === 'COMPLETED' ? '#25252d' : 'transparent'),
                    border: event.status === 'SCHEDULED' ? '1px solid rgba(255,255,255,0.1)' : 'none',
                    fontWeight: '900',
                    color: event.status === 'SCHEDULED' ? 'var(--text-dim)' : 'white',
                    fontFamily: 'var(--font-header)',
                    letterSpacing: '0.05em'
                  }}>
                    {event.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
