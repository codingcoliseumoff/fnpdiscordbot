import React, { useEffect, useRef, useState } from 'react';
import type { RaceState } from '../engine/RaceEngine';
import { TRACK_MAPS } from '../data/trackMaps';

interface RaceViewerProps {
  raceState: RaceState;
}

export const RaceViewer: React.FC<RaceViewerProps> = ({ raceState }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredCar, setHoveredCar] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Real Track Map
      const pathData = TRACK_MAPS[raceState.track.id] || TRACK_MAPS.silverstone;
      const path = new Path2D(pathData);
      
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 40;
      ctx.lineJoin = 'round';
      ctx.stroke(path);

      // Pit Lane (simplified line near start/finish)
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(380, 520);
      ctx.lineTo(420, 520);
      ctx.stroke();

      // Render Cars following the path
      const tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      tempPath.setAttribute('d', pathData);
      const pathLength = tempPath.getTotalLength();

      raceState.competitors.forEach((comp) => {
        [comp.drivers.d1, comp.drivers.d2].forEach((dState, dIdx) => {
          if (dState.status === 'Retired') return;

          // Progress calculation (0 to 1)
          const progress = (raceState.lap + (1 - (dState.gapToLeader / 200))) % 1;
          const point = tempPath.getPointAtLength(progress * pathLength);
          
          const x = point.x + (dIdx * 10 - 5);
          const y = point.y + (dIdx * 10 - 5);

          // Draw Car
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, 2 * Math.PI);
          ctx.fillStyle = comp.team.color;
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Render Label if speed is slow or zoomed
          if (hoveredCar === dState.driver.id) {
             ctx.fillStyle = '#fff';
             ctx.font = '12px Inter';
             ctx.fillText(dState.driver.name.split(' ').pop() || '', x + 10, y - 10);
          }
        });
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [raceState, hoveredCar]);

  return (
    <div className="glass-panel animate-fade" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1rem', padding: '0' }}>
      <div style={{ position: 'relative', background: '#000', borderRadius: '12px 0 0 12px', overflow: 'hidden' }}>
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={600} 
          style={{ width: '100%', height: 'auto' }}
        />
        
        {/* Session Info Overlay */}
        <div style={{ position: 'absolute', top: '20px', left: '20px', pointerEvents: 'none' }}>
          <h2 style={{ fontSize: '1.4rem' }} className="neon-text">{raceState.track.name}</h2>
          <p style={{ opacity: 0.7 }}>LAP {raceState.lap} / {raceState.totalLaps}</p>
        </div>

        {/* Dynamic Commentary */}
        <div style={{ 
          position: 'absolute', 
          bottom: '0', 
          width: '100%', 
          background: 'rgba(0,0,0,0.8)', 
          padding: '1rem',
          borderTop: '1px solid var(--primary-glow)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.9rem',
          maxHeight: '100px',
          overflowY: 'auto'
        }}>
          <div><span style={{ color: 'var(--primary)' }}>[LAP {raceState.lap}]</span> {
            raceState.safetyCar
              ? `SAFETY CAR: Speed limited for ${raceState.scLapsRemaining} more laps.`
              : raceState.competitors.some(c => c.drivers.d1.status === 'Retired' || c.drivers.d2.status === 'Retired')
              ? 'YELLOW FLAG: Vehicle stopped on track!'
              : raceState.competitors.some(c => c.drivers.d1.status === 'Pitting' || c.drivers.d2.status === 'Pitting')
              ? 'Box Box, Box Box. Strategy window is open.'
              : raceState.lap === 0 
              ? 'Ready to race. Check ERS and temperatures.'
              : raceState.lap === 1 ? 'LIGHTS OUT AND AWAY WE GO!' : 'Normal racing conditions. Conserving fuel.'
          }</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--secondary)', marginTop: '4px' }}>
            Current Weather: {raceState.weather.toUpperCase()} | Track Temp: 28°C
          </div>
        </div>
      </div>

      {/* Live Timing Tower */}
      <div style={{ 
        background: '#0c0c14', 
        padding: '1rem', 
        borderRadius: '0 12px 12px 0',
        overflowY: 'auto',
        maxHeight: '600px'
      }}>
        <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-dim)' }}>Live Timing</h3>
        {raceState.competitors.flatMap(c => [c.drivers.d1, c.drivers.d2])
          .sort((a, b) => a.position - b.position)
          .map((d, i) => (
            <div 
              key={d.driver.id} 
              onMouseEnter={() => setHoveredCar(d.driver.id)}
              onMouseLeave={() => setHoveredCar(null)}
              style={{ 
                display: 'grid', 
                gridTemplateColumns: '30px 4px 1fr 60px', 
                alignItems: 'center', 
                gap: '8px', 
                marginBottom: '4px',
                padding: '4px',
                background: hoveredCar === d.driver.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                borderRadius: '4px',
                cursor: 'pointer'
               }}
            >
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{i + 1}</span>
              <div style={{ height: '100%', background: raceState.competitors.find(c => c.team.id === d.driver.teamId)?.team.color }}></div>
              <span style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.driver.name.split(' ').pop()?.toUpperCase()}</span>
              <span style={{ fontSize: '0.7rem', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--secondary)' }}>
                {i === 0 ? 'INTERVAL' : `+${(d.gapToAhead).toFixed(3)}`}
              </span>
            </div>
          ))
        }
      </div>
    </div>
  );
};
