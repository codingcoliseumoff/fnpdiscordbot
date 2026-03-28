import React, { useState, useEffect, useRef } from 'react';
import { RaceEngine } from '../engine/RaceEngine';
import type { RaceState, CompetitorState, DriverState } from '../engine/RaceEngine';
import { useGame } from '../hooks/GameContext';
import { TeamLogo } from './TeamLogo';
import type { Driver } from '../data/drivers';
import type { Team } from '../data/teams';

export const RaceSession: React.FC = () => {
  const { state, setSession, nextRound, applyRacePoints } = useGame();
  const engine = new RaceEngine();

  const [currentSubSession, setCurrentSubSession] = useState<'Practice' | 'Q1' | 'Q2' | 'Q3' | 'Race' | 'Results'>('Practice');
  const [isRunning, setIsRunning] = useState(false);
  const [sessionEnd, setSessionEnd] = useState(false);
  const [allRaces, setAllRaces] = useState<Record<number, RaceState>>({});
  const [qualifyingResults, setQualifyingResults] = useState<Record<number, { driver: Driver, team: Team, bestTime: number }[]>>({});

  const userTeam = state.userTeamId ? [...state.teams, ...state.nationalTeams].find(t => t.id === state.userTeamId) : null;
  const [activeDivTab, setActiveDivTab] = useState(userTeam ? userTeam.tier : 1);

  const svgContainerRef = useRef<HTMLDivElement>(null);
  const [preloadedSvgs, setPreloadedSvgs] = useState<Record<string, string>>({});
  const [pathLength, setPathLength] = useState<number>(0);

  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const carPositionsRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const preload = async () => {
      // Latest/Modern layouts as of 2024-2026 based on the repo's circuits.json
      const directMap: Record<string, string> = {
        'silverstone': 'silverstone-8.svg',
        'monaco': 'monaco-6.svg',
        'spa': 'spa-francorchamps-4.svg',
        'monza': 'monza-7.svg',
        'suzuka': 'suzuka-2.svg',
        'interlagos': 'interlagos-2.svg',
        'jose carlos pace': 'interlagos-2.svg',
        'austin': 'austin-1.svg',
        'americas': 'austin-1.svg',
        'zandvoort': 'zandvoort-5.svg',
        'shanghai': 'shanghai-1.svg',
        'sepang': 'sepang-1.svg',
        'catalunya': 'catalunya-6.svg',
        'barcelona': 'catalunya-6.svg',
        'albert park': 'melbourne-2.svg',
        'melbourne': 'melbourne-2.svg',
        'bahrain': 'bahrain-1.svg',
        'sakhir': 'bahrain-1.svg',
        'jeddah': 'jeddah-1.svg',
        'saudi': 'jeddah-1.svg',
        'miami': 'miami-1.svg',
        'hungaroring': 'hungaroring-3.svg',
        'red bull': 'spielberg-3.svg',
        'spielberg': 'spielberg-3.svg',
        'marina bay': 'marina-bay-4.svg',
        'singapore': 'marina-bay-4.svg',
        'lusail': 'lusail-1.svg',
        'qatar': 'lusail-1.svg',
        'yas marina': 'yas-marina-2.svg',
        'abu dhabi': 'yas-marina-2.svg',
        'imola': 'imola-3.svg',
        'enzo e dino': 'imola-3.svg',
        'montreal': 'montreal-6.svg',
        'gilles villeneuve': 'montreal-6.svg',
        'mexico-city': 'mexico-city-3.svg',
        'mexico': 'mexico-city-3.svg',
        'hermanos': 'mexico-city-3.svg',
        'las vegas': 'las-vegas-1.svg',
        'nurburgring': 'nurburgring-4.svg',
        'algarve': 'portimao-1.svg',
        'portimao': 'portimao-1.svg',
        'istanbul': 'istanbul-1.svg',
        'baku': 'baku-1.svg',
        'korea': 'yeongam-1.svg',
        'yeongam': 'yeongam-1.svg'
      };

      
      const newCache: Record<string, string> = {};
      const fetchPromises = state.tracks.map(async (track) => {
        const trackName = track.name.toLowerCase();
        const trackId = track.id.toLowerCase();
        let slug = '';
        
        // Match by ID first as it's more stable
        for (const key in directMap) { 
           if (trackId === key || trackId.includes(key)) { slug = directMap[key]; break; } 
        }
        
        // Match by Name if no ID match
        if (!slug) {
           for (const key in directMap) { if (trackName.includes(key)) { slug = directMap[key]; break; } }
        }
        
        // Fallback guess
        if (!slug) {
           const firstWord = trackName.split(' ')[0].normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // strip accents
           slug = firstWord + '-1.svg';
        }
        
        try {
          const res = await fetch(`https://raw.githubusercontent.com/julesr0y/f1-circuits-svg/main/circuits/white/${slug}`);
          if (res.ok) newCache[track.id] = await res.text();
          else console.error("SVG 404", slug, track.id);
        } catch (e) { console.error("Preload fail", track.id, e); }
      });
      await Promise.all(fetchPromises);
      setPreloadedSvgs(newCache);
    };
    preload();
  }, [state.tracks]);

  const svgContent = preloadedSvgs[state.tracks[state.currentRound]?.id];

  useEffect(() => {
    if (svgContainerRef.current) {
      const path = svgContainerRef.current.querySelector('path');
      if (path) setPathLength(path.getTotalLength());
    }
  }, [svgContent]);

  useEffect(() => {
    let frameId: number;
    const animate = () => {
      if (allRaces[activeDivTab] && svgContainerRef.current && pathLength > 0) {
        const svg = svgContainerRef.current.querySelector('svg');
        const path = svg?.querySelector('path');
        if (svg && path) {
          svg.querySelectorAll('.driver-dot').forEach(d => d.remove());
          const race = allRaces[activeDivTab];
          const entries = race.competitors.flatMap(c => [{ d: c.drivers.d1, team: c.team }, { d: c.drivers.d2, team: c.team }]);
          
          // Layering: higher positions (smaller numbers) drawn last to stay on top
          entries.sort((a, b) => b.d.position - a.d.position);

          entries.forEach(entry => {
            const d = entry.d;
            if (d.status === 'Retired' || d.isPitting) return;
            const target = d.totalProgress;
            if (carPositionsRef.current[d.driver.id] === undefined) carPositionsRef.current[d.driver.id] = target;
            const current = carPositionsRef.current[d.driver.id];
            const smooth = current + (target - current) * 0.2;
            carPositionsRef.current[d.driver.id] = smooth;

            const distPercent = ((smooth % 1.0) + 1.0) % 1.0;
            const dist = distPercent * pathLength;
            const pt = path.getPointAtLength(Math.max(0, dist));
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.classList.add('driver-dot');
            g.setAttribute('transform', `translate(${pt.x}, ${pt.y})`);

            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('r', '14'); // Even bigger
            circle.setAttribute('fill', entry.team.color);
            circle.setAttribute('stroke', '#fff'); circle.setAttribute('stroke-width', '1.5');

            const getContrastColor = (hex: string) => {
              if (!hex || hex.length < 7) return '#fff';
              const r = parseInt(hex.slice(1, 3), 16);
              const g = parseInt(hex.slice(3, 5), 16);
              const b = parseInt(hex.slice(5, 7), 16);
              const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
              return yiq >= 128 ? '#000' : '#fff';
            };

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            const nameParts = (d.driver.name || '---').split(' ');
            const lastName = (nameParts.length > 1 ? nameParts.pop() : nameParts[0]) || '';
            text.textContent = lastName.substring(0, 3).toUpperCase();
            text.setAttribute('text-anchor', 'middle'); text.setAttribute('y', '4');
            text.setAttribute('fill', getContrastColor(entry.team.color)); text.setAttribute('font-size', '8px'); text.setAttribute('font-weight', '900');

            g.appendChild(circle); g.appendChild(text); svg.appendChild(g);
          });
        }
      }
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [allRaces, activeDivTab, pathLength]);

  const formatTime = (seconds: number) => {
    if (seconds === 0) return '---';
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(3);
    return mins > 0 ? `${mins}:${secs.padStart(6, '0')}` : secs;
  };

  const getCompetitorsForTier = (tier: number, sessionType: string, overrideResults?: { driver: Driver, team: Team, bestTime: number }[]): CompetitorState[] => {
    const teams = state.isNationalMode ? state.nationalTeams : state.teams;
    const tierTeams = teams.filter(t => t.tier === tier);
    const avgLap = state.tracks[state.currentRound]?.avgLapTimeSeconds || 90;
    
    // If we have previous session results, use them for filtering/sorting
    const previousResults = overrideResults || qualifyingResults[tier];
    
    if (previousResults && (sessionType.startsWith('Q') || sessionType === 'Race')) {
      // For Q2/Q3, only take the top 15/10. For Race, take all in order.
      let eligible = previousResults;
      if (sessionType === 'Q2') eligible = previousResults.slice(0, 15);
      if (sessionType === 'Q3') eligible = previousResults.slice(0, 10);
      
      const teamsMap: Record<string, { team: Team, d1?: DriverState, d2?: DriverState }> = {};
      eligible.forEach((res, index) => {
         if (!teamsMap[res.team.id]) teamsMap[res.team.id] = { team: res.team };
         const isRace = sessionType === 'Race';
         
         const isAI = res.team.id !== state.userTeamId;
         let startingTyre: DriverState['tyreType'] = 'Medium';
         let plannedStops: { lap: number; tyre: DriverState['tyreType'] }[] = [];
         
         if (isRace) {
           if (isAI) {
              const rand = Math.random();
              if (rand < 0.25) { // 2-stop Soft
                 startingTyre = 'Soft';
                 plannedStops = [{ lap: 12 + Math.floor(Math.random() * 4), tyre: 'Medium' }, { lap: 32 + Math.floor(Math.random() * 6), tyre: 'Soft' }];
              } else if (rand < 0.75) { // 1-stop Medium
                 startingTyre = 'Medium';
                 plannedStops = [{ lap: 22 + Math.floor(Math.random() * 8), tyre: 'Hard' }];
              } else { // 1-stop Hard
                 startingTyre = 'Hard';
                 plannedStops = [{ lap: 32 + Math.floor(Math.random() * 8), tyre: 'Medium' }];
              }
           } else {
              startingTyre = 'Medium';
              plannedStops = [{ lap: 22, tyre: 'Hard' }];
           }
         } else {
           startingTyre = 'Soft';
         }

         const dState: DriverState = {
           driver: res.driver, position: index + 1, gapToLeader: 0, gapToAhead: 0, lastLapTime: 0, bestLapTime: 0, lap: 0,
           tyreAge: 0, tyreType: startingTyre, tyreCondition: 100, fuelLoad: isRace ? 110 : 999, pitStops: 0,
           hasPittedMandatory: false, isPitting: false, pitStopsPlanned: plannedStops.length,
           status: 'Racing', targetPitLap: plannedStops[0]?.lap || 20, strategy: plannedStops.length > 1 ? '2-stop' : '1-stop', tyreHistory: [startingTyre[0]],
           progress: isRace ? -(index * 0.1 / avgLap) : (index * -0.01), 
           totalProgress: isRace ? -(index * 0.1 / avgLap) : (index * -0.01),
           userPlannedStops: plannedStops,
           form: 0.985 + Math.random() * 0.03
         };
         if (res.team.id === state.userTeamId) dState.userPushMode = 'Balance';
         if (!teamsMap[res.team.id].d1) teamsMap[res.team.id].d1 = dState;
         else teamsMap[res.team.id].d2 = dState;
      });

      return Object.values(teamsMap).map(tm => ({
         team: tm.team,
         engine: state.engines.find(e => e.id === tm.team.engineSupplierId) || state.engines[0],
         drivers: { d1: tm.d1!, d2: tm.d2 || { ...tm.d1!, status: 'Retired', driver: { ...tm.d1!.driver, id: `${tm.d1!.driver.id}_ghost` } } as any }
      }));
    }
    // Default Practice or fresh start
    const allDriversInTier: { driver: Driver; team: Team }[] = [];
    tierTeams.forEach(team => {
      let teamDrivers: Driver[] = [];
      if (state.isNationalMode) {
        teamDrivers = state.driversNational.filter(d => d.teamId === team.id).slice(0, 2);
        if (teamDrivers.length < 2) {
          const fillers = state.driversNational.filter(d => !teamDrivers.includes(d)).slice(0, 2 - teamDrivers.length);
          teamDrivers = [...teamDrivers, ...fillers];
        }
      } else {
        teamDrivers = state.drivers.filter(d => d.teamId === team.id).slice(0, 2);
        if (teamDrivers.length < 2) {
          const agents = state.drivers.filter(d => !d.teamId || d.teamId === 'free_agent');
          const teamIdx = tierTeams.indexOf(team);
          const fillers = agents.slice(teamIdx * 2, teamIdx * 2 + 2 - teamDrivers.length).map(d => ({ ...d, id: `${d.id}_${team.id}` }));
          teamDrivers = [...teamDrivers, ...fillers];
        }
        while (teamDrivers.length < 2) {
          teamDrivers.push({ ...state.drivers[0], id: `placeholder-${team.id}-${teamDrivers.length}`, name: `Bot ${teamDrivers.length + 1}` });
        }
      }
      teamDrivers.forEach(d => allDriversInTier.push({ driver: d, team }));
    });

    // Shuffle/Distribute drivers across the grid
    allDriversInTier.sort((a,b) => {
        const ratingA = (a.driver.stats.pace + a.driver.stats.racecraft + (a.team.stats.aero + a.team.stats.chassis)/2);
        const ratingB = (b.driver.stats.pace + b.driver.stats.racecraft + (b.team.stats.aero + b.team.stats.chassis)/2);
        return (ratingB + (Math.random() - 0.5) * 50) - (ratingA + (Math.random() - 0.5) * 50);
    });

    const teamsMap: Record<string, { team: Team, d1?: DriverState, d2?: DriverState }> = {};
    allDriversInTier.forEach((entry, gridPos) => {
      const isRace = sessionType === 'Race';
      
      // AI Strategy Generation
      const isAI = entry.team.id !== state.userTeamId;
      let startingTyre: DriverState['tyreType'] = 'Medium';
      let plannedStops: { lap: number; tyre: DriverState['tyreType'] }[] = [];
      
      if (isRace) {
        if (isAI) {
           const rand = Math.random();
           if (rand < 0.2) { // Ultra Aggressive 2-stop (Soft Start)
              startingTyre = 'Soft';
              plannedStops = [{ lap: 12 + Math.floor(Math.random() * 4), tyre: 'Medium' }, { lap: 34 + Math.floor(Math.random() * 4), tyre: 'Soft' }];
           } else if (rand < 0.7) { // Standard 1-stop (Medium Start)
              startingTyre = 'Medium';
              plannedStops = [{ lap: 22 + Math.floor(Math.random() * 8), tyre: 'Hard' }];
           } else { // Conservative 1-stop (Hard Start)
              startingTyre = 'Hard';
              plannedStops = [{ lap: 30 + Math.floor(Math.random() * 8), tyre: 'Medium' }];
           }
        } else {
           startingTyre = 'Medium';
           plannedStops = [{ lap: 22, tyre: 'Hard' }];
        }
      } else {
        startingTyre = 'Soft';
      }

      const dState: DriverState = {
        driver: entry.driver, position: gridPos + 1, gapToLeader: 0, gapToAhead: 0, lastLapTime: 0, bestLapTime: 0, lap: 0,
        tyreAge: 0, tyreType: startingTyre, tyreCondition: 100, fuelLoad: isRace ? 110 : 999, pitStops: 0,
        hasPittedMandatory: false, isPitting: false, pitStopsPlanned: plannedStops.length,
        status: 'Racing', targetPitLap: plannedStops[0]?.lap || 20, strategy: plannedStops.length > 1 ? '2-stop' : '1-stop', tyreHistory: [startingTyre[0]], 
        progress: -(gridPos * 0.02), totalProgress: -(gridPos * 0.02),
        userPlannedStops: plannedStops,
        form: 0.985 + Math.random() * 0.03
      };
      if (entry.team.id === state.userTeamId) dState.userPushMode = 'Balance';

      if (!teamsMap[entry.team.id]) teamsMap[entry.team.id] = { team: entry.team };
      if (!teamsMap[entry.team.id].d1) teamsMap[entry.team.id].d1 = dState;
      else teamsMap[entry.team.id].d2 = dState;
    });

    return Object.values(teamsMap).map(tm => ({
       team: tm.team,
       engine: state.engines.find(e => e.id === tm.team.engineSupplierId) || state.engines[0],
       drivers: { d1: tm.d1!, d2: tm.d2! }
    }));
  };

  const initAllRaces = (type: string) => {
    const newRaces: Record<number, RaceState> = {};
    let laps = type === 'Race' ? (state.tracks[state.currentRound]?.id === 'monaco' ? 78 : 50) : 10;
    const maxTier = state.isNationalMode ? 5 : 10;
    for (let t = 1; t <= maxTier; t++) {
      newRaces[t] = {
        track: state.tracks[state.currentRound] || state.tracks[0], lap: 0, totalLaps: laps, weather: 'Dry',
        safetyCar: false, vsc: false, scLapsRemaining: 0, fastestLapTime: 0, fastestLapDriverId: null,
        competitors: getCompetitorsForTier(t, type), isRealisticSim: state.isRealisticSim, sessionType: type as any,
        finishedDriverIds: []
      };

    }
    setAllRaces(newRaces);
  };

  useEffect(() => { initAllRaces(currentSubSession); }, [state.currentRound, state.isNationalMode]);

  useEffect(() => {
    if (sessionEnd && currentSubSession === 'Race') {
       // Award points for all tiers
       for (const tierStr in allRaces) {
          const tierNum = parseInt(tierStr);
          const competitors = allRaces[tierNum].competitors;
          const drivers = competitors.flatMap(c => [{ d: c.drivers.d1, team: c.team }, { d: c.drivers.d2, team: c.team }]);
          
          // Sort by finished position
          const sorted = [...drivers].sort((a,b) => (a.d.position || 99) - (b.d.position || 99));
          const fastestLapEntry = [...drivers].sort((a,b) => {
             if (a.d.status === 'Retired') return 1;
             if (b.d.status === 'Retired') return -1;
             return (a.d.bestLapTime || 999) - (b.d.bestLapTime || 999);
          })[0];

          const pointResults = sorted.map(entry => ({
             teamId: entry.team.id,
             driverId: entry.d.driver.id,
             position: entry.d.position,
             fastestLap: !!fastestLapEntry && entry.d.driver.id === fastestLapEntry.d.driver.id
          }));
          
          applyRacePoints(tierNum, pointResults);
       }
    }
  }, [sessionEnd]);

  useEffect(() => {
    let interval: any;
    if (isRunning) {
      interval = setInterval(() => {
        setAllRaces(prev => {
          const nextRaces = { ...prev };
          let finishedCount = 0;
          const tickDelta = 0.1 * playbackSpeed;
          const activeTierDone = Object.keys(nextRaces).some(t => {
            const tierNum = parseInt(t);
            if (tierNum !== activeDivTab) return false;
            const drivers = nextRaces[tierNum].competitors.flatMap(c => [c.drivers.d1, c.drivers.d2]);
            return drivers.every(d => d.status === 'Finished' || d.status === 'Retired');
          });

          for (const t in nextRaces) {
            const drivers = nextRaces[t].competitors.flatMap(c => [c.drivers.d1, c.drivers.d2]);
            const isTierDone = drivers.every(d => d.status === 'Finished' || d.status === 'Retired');
            if (!isTierDone) { nextRaces[t] = engine.processTick(nextRaces[t], tickDelta); }
            else { finishedCount++; }
          }
          
          if (activeTierDone || finishedCount === Object.keys(nextRaces).length) {
            setIsRunning(false); setSessionEnd(true);
          }
          return nextRaces;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isRunning, playbackSpeed]);

  const startSession = (type: typeof currentSubSession) => {
    const finalQualyResults = { ...qualifyingResults };
    for (const tierStr in allRaces) {
       const tier = parseInt(tierStr);
       const sessionDrivers = allRaces[tier].competitors.flatMap(c => [{ d: c.drivers.d1, team: c.team }, { d: c.drivers.d2, team: c.team }])
          .filter(e => e.d.status !== 'Retired' && !e.d.driver.id.endsWith('_ghost'));
       
       sessionDrivers.sort((a,b) => {
          if (a.d.bestLapTime === 0 && b.d.bestLapTime === 0) return 0;
          if (a.d.bestLapTime === 0) return 1;
          if (b.d.bestLapTime === 0) return -1;
          return a.d.bestLapTime - b.d.bestLapTime;
       });

       // Merging logic: Update the top part of the grid with the new session times
       const previousGrid = finalQualyResults[tier] || [];
       const newlyRanked = sessionDrivers.map(d => ({ driver: d.d.driver, team: d.team, bestTime: d.d.bestLapTime }));
       
       // Handle the case where qualifyingResults was empty (initial Practice/Q1 transition)
       if (previousGrid.length === 0 && newlyRanked.length > 0) {
          finalQualyResults[tier] = newlyRanked;
       } else if (newlyRanked.length > 0) {
          const updatedGrid = [...newlyRanked];
          previousGrid.forEach(p => {
             if (!updatedGrid.find(u => u.driver.id === p.driver.id)) updatedGrid.push(p);
          });
          finalQualyResults[tier] = updatedGrid;
       }
    }
    setQualifyingResults(finalQualyResults);

    setCurrentSubSession(type); setSession(type); setIsRunning(false); setSessionEnd(false); 
    
    const newRaces: Record<number, RaceState> = {};
    let laps = type === 'Race' ? (state.tracks[state.currentRound]?.id === 'monaco' ? 78 : 50) : 10;
    const maxTier = state.isNationalMode ? 5 : 10;
    for (let t = 1; t <= maxTier; t++) {
      newRaces[t] = {
        track: state.tracks[state.currentRound] || state.tracks[0], lap: 0, totalLaps: laps, weather: 'Dry',
        safetyCar: false, vsc: false, scLapsRemaining: 0, fastestLapTime: 0, fastestLapDriverId: null,
        competitors: getCompetitorsForTier(t, type, finalQualyResults[t]), isRealisticSim: state.isRealisticSim, sessionType: type as any,
        finishedDriverIds: []
      };

    }
    setAllRaces(newRaces);
  };

  const getTyreColor = (type: string) => {
    switch (type) {
      case 'Soft': return '#bf40bf'; case 'Medium': return '#ffd300'; case 'Hard': return '#ffffff';
      case 'Inter': return '#43b02a'; case 'Wet': return '#003087'; default: return '#ccc';
    }
  };

  const getTyreColorFromShort = (type: string) => {
    switch (type[0].toUpperCase()) {
      case 'S': return '#bf40bf'; case 'M': return '#ffd300'; case 'H': return '#ffffff';
      case 'I': return '#43b02a'; case 'W': return '#003087'; default: return '#777';
    }
  };

  return (
    <div className="race-session-container animate-fade" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', background: '#0a0a0f', color: 'white', overflow: 'hidden' }}>
      {/* HEADER: Compact but informative */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 1.5rem', background: '#1c1c25', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div>
          <h1 style={{ fontSize: '1rem', fontWeight: 900, margin: 0 }}>{currentSubSession.toUpperCase()} <span style={{ color: 'var(--primary)' }}>/</span> {state.tracks[state.currentRound]?.name.toUpperCase()}</h1>
          <p style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-dim)', margin: 0 }}>GP ROUND {state.currentRound + 1} • {allRaces[activeDivTab]?.lap} / {allRaces[activeDivTab]?.totalLaps} LAPS</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {isRunning && (
            <div style={{ display: 'flex', gap: '2px', background: 'rgba(0,0,0,0.4)', padding: '3px', borderRadius: '4px' }}>
              {[1, 5, 20, 100].map(speed => (
                <button key={speed} onClick={() => setPlaybackSpeed(speed)} style={{ padding: '2px 8px', fontSize: '0.6rem', background: playbackSpeed === speed ? 'var(--primary)' : 'transparent', color: playbackSpeed === speed ? 'black' : 'white', border: 'none', borderRadius: '2px', fontWeight: 900, cursor: 'pointer' }}>{speed}x</button>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {!isRunning && !sessionEnd && (
              <button className="btn-primary" onClick={() => { setIsRunning(true); carPositionsRef.current = {}; }} style={{ padding: '0.4rem 1rem', fontSize: '0.65rem' }}>START SESSION</button>
            )}
            {sessionEnd && (
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {currentSubSession === 'Practice' && <button className="btn-primary" onClick={() => startSession('Q1')}>Q1</button>}
                {currentSubSession === 'Q1' && <button className="btn-primary" onClick={() => startSession('Q2')}>Q2</button>}
                {currentSubSession === 'Q2' && <button className="btn-primary" onClick={() => startSession('Q3')}>Q3</button>}
                {currentSubSession === 'Q3' && <button className="btn-primary" onClick={() => startSession('Race')}>RACE</button>}
                 {currentSubSession === 'Race' && <button className="btn-primary" onClick={() => { setCurrentSubSession('Practice'); setSessionEnd(false); nextRound(); }} style={{ padding: '0.4rem 1.2rem', fontSize: '0.7rem' }}>NEXT ROUND</button>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TIER TABS: Slim selector */}
      <div style={{ display: 'flex', gap: '2px', padding: '4px', background: '#0a0a0f' }}>
        {Object.keys(allRaces).map((tierStr) => {
          const tierNum = parseInt(tierStr);
          return (
            <button key={tierNum} onClick={() => setActiveDivTab(tierNum)} style={{ flex: 1, padding: '4px', fontSize: '0.6rem', fontWeight: 900, background: activeDivTab === tierNum ? 'var(--primary)' : 'rgba(255,255,255,0.03)', border: 'none', color: activeDivTab === tierNum ? 'black' : 'var(--text-dim)', cursor: 'pointer', borderRadius: '2px', transition: 'all 0.2s' }}>DIV {tierNum}</button>
          );
        })}
      </div>      {/* MAIN VISUALIZATION: Leaderboard + Track + Sidebar Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr 260px', gap: '1px', flex: 1, minHeight: 0, background: 'rgba(255,255,255,0.05)' }}>
        {/* LEADERBOARD (LEFT) */}
        <div style={{ background: '#111119', overflowY: 'auto', padding: '0.5rem', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
          {allRaces[activeDivTab] && (
            <div style={{ position: 'relative', height: `${allRaces[activeDivTab].competitors.length * 2 * 28}px` }}>
              {allRaces[activeDivTab].competitors.flatMap(c => [{ d: c.drivers.d1, team: c.team }, { d: c.drivers.d2, team: c.team }])
                .filter(entry => !(currentSubSession.startsWith('Q') && entry.d.status === 'Retired'))
                .map((entry) => {

                  const pos = entry.d.position || 0;
                  const translateY = (pos - 1) * 28;
                  return (
                    <div key={entry.d.driver.id} style={{ display: 'grid', gridTemplateColumns: '18px 2px 1fr 60px', gap: '8px', alignItems: 'center', padding: '0 8px', height: '26px', position: 'absolute', top: 0, left: 0, right: 0, transform: `translateY(${translateY}px)`, transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)', background: entry.team.id === state.userTeamId ? 'rgba(var(--primary-rgb), 0.1)' : 'transparent', borderRadius: '2px' }}>
                      <span style={{ fontWeight: 900, fontSize: '0.65rem', color: pos <= 3 ? 'var(--primary)' : 'white' }}>{pos}</span>
                      <div style={{ height: '12px', background: entry.team.color, width: '2px' }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <TeamLogo team={entry.team} size={12} />

                        <span style={{ fontWeight: 700, fontSize: '0.65rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.d.driver.name.split(' ').pop().toUpperCase()}</span>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {(entry.d.tyreHistory || []).map((t, idx) => (
                             <div key={idx} style={{ width: '10px', height: '10px', borderRadius: '50%', background: getTyreColorFromShort(t), border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem', fontWeight: 900, color: t[0].toUpperCase() === 'H' ? 'black' : 'white' }}>
                               {t[0].toUpperCase()}
                             </div>
                          ))}
                        </div>
                      </div>
                      <span style={{ textAlign: 'right', fontWeight: 600, fontSize: '0.6rem', color: 'var(--text-dim)' }}>
                        {entry.d.status === 'Retired' ? `DNF (${entry.d.retirementReason || 'Incident'})` : (entry.d.isPitting ? 'PIT' : (currentSubSession.startsWith('Q') ? formatTime(entry.d.bestLapTime) : (entry.d.position === 1 ? 'LEAD' : `+${entry.d.gapToLeader.toFixed(1)}s`)))}
                      </span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* TRACK MAP (CENTER) */}
        <div style={{ background: '#0a0a0f', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ position: 'absolute', top: '20px', left: '25px', zIndex: 10, pointerEvents: 'none' }}>
            <h3 style={{ fontSize: '0.7rem', fontWeight: 900, color: '#ff0000', margin: 0, letterSpacing: '2px' }}>LIVE FEED</h3>
            <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
              <div style={{ fontSize: '0.6rem', background: 'rgba(0,0,0,0.8)', padding: '2px 6px', borderRadius: '2px', border: '1px solid rgba(255,255,255,0.1)' }}>GRIP: {(allRaces[activeDivTab]?.trackGrip || 1).toFixed(2)}</div>
              <div style={{ fontSize: '0.6rem', background: 'rgba(0,0,0,0.8)', padding: '2px 6px', borderRadius: '2px', border: '1px solid rgba(255,255,255,0.1)', color: allRaces[activeDivTab]?.weather === 'Dry' ? 'white' : '#00aaff' }}>{allRaces[activeDivTab]?.weather?.toUpperCase() || 'DRY'}</div>
            </div>

            <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
               {(allRaces[activeDivTab]?.events || []).map((ev, i) => (
                 <div key={i} className="animate-slide-in" style={{ fontSize: '0.6rem', background: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: '2px', borderLeft: '2px solid var(--primary)', maxWidth: '200px', fontWeight: 700 }}>
                   {ev}
                 </div>
               ))}
            </div>
          </div>
          {svgContent ? (
            <div ref={svgContainerRef} style={{ width: '75%', height: '75%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} dangerouslySetInnerHTML={{ __html: svgContent.replace('<svg ', '<svg viewBox="0 0 500 500" preserveAspectRatio="xMidYMid meet" style="width:100%; height:100%; overflow:visible" ') }} />
          ) : <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>CHARGING CIRCUIT SYSTEMS...</div>}
        </div>

        {/* CONTROLS & STRATEGY (RIGHT) */}
        <div style={{ background: '#1c1c25', overflowY: 'auto', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
          {state.userTeamId && allRaces[activeDivTab]?.competitors.find(c => c.team.id === state.userTeamId) ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ padding: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
                <TeamLogo team={userTeam} size={30} />

                <div>
                   <h3 style={{ fontSize: '0.65rem', fontWeight: 900, margin: 0 }}>{userTeam?.name.toUpperCase()}</h3>
                   <p style={{ fontSize: '0.5rem', color: 'var(--primary)', margin: 0 }}>PIT WALL DIRECTIVE</p>
                </div>
              </div>

              <div style={{ flex: 1 }}>
                {allRaces[activeDivTab].competitors.filter(c => c.team.id === state.userTeamId).flatMap(c => [c.drivers.d1, c.drivers.d2]).map((d) => (
                  <div key={d.driver.id} style={{ padding: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 900, fontSize: '0.7rem' }}>{d.driver.name.toUpperCase()}</span>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {(d.tyreHistory || []).map((t, idx) => (
                             <div key={idx} style={{ width: '10px', height: '10px', borderRadius: '50%', background: getTyreColorFromShort(t), border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem', fontWeight: 900, color: t[0].toUpperCase() === 'H' ? 'black' : 'white' }}>
                               {t[0].toUpperCase()}
                             </div>
                          ))}
                        </div>
                      </div>
                      <span style={{ fontWeight: 900, color: getTyreColor(d.tyreType), fontSize: '0.65rem' }}>{d.tyreType[0]} ({d.tyreCondition.toFixed(0)}%)</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', height: '4px', borderRadius: '2px', marginBottom: '8px', overflow: 'hidden' }}>
                      <div style={{ width: `${d.tyreCondition}%`, background: d.tyreCondition > 40 ? '#43b02a' : '#ff0000', height: '100%' }} />
                    </div>
                    
                    <div style={{ display: 'flex', gap: '2px', marginBottom: '10px' }}>
                      {['Push', 'Balance', 'Defend'].map(mode => (
                        <button key={mode} onClick={() => { d.userPushMode = mode as any; setAllRaces({ ...allRaces }); }} style={{ flex: 1, fontSize: '0.5rem', padding: '4px', background: d.userPushMode === mode ? 'var(--primary)' : 'rgba(255,255,255,0.03)', color: d.userPushMode === mode ? 'black' : 'white', border: 'none', cursor: 'pointer', borderRadius: '2px', fontWeight: 800 }}>{mode.substring(0,4).toUpperCase()}</button>
                      ))}
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.5rem', fontWeight: 800 }}>STRATEGY</span>
                        {!isRunning && (
                          <select value={d.tyreType} onChange={(e) => { d.tyreType = e.target.value as any; d.tyreHistory = [d.tyreType[0]]; setAllRaces({ ...allRaces }); }} style={{ background: 'none', color: 'var(--primary)', border: 'none', fontSize: '0.5rem', fontWeight: 900, cursor: 'pointer' }}>
                            {['Soft', 'Medium', 'Hard', 'Inter', 'Wet'].map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {(d.userPlannedStops || []).map((stop, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '4px', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '2px 4px', borderRadius: '2px' }}>
                            <span style={{ fontSize: '0.5rem', opacity: 0.6 }}>LAP</span>
                            <input type="number" min="1" max="100" value={stop.lap} onChange={(e) => { stop.lap = parseInt(e.target.value); setAllRaces({ ...allRaces }); }} style={{ width: '24px', background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', borderBottom: '1px solid var(--primary)', fontSize: '0.55rem', fontWeight: 900, textAlign: 'center' }} />
                            <select value={stop.tyre} onChange={(e) => { stop.tyre = e.target.value as any; setAllRaces({ ...allRaces }); }} style={{ flex: 1, background: 'none', color: 'white', border: 'none', fontSize: '0.5rem', fontWeight: 800 }}>
                              {['Soft', 'Medium', 'Hard', 'Inter', 'Wet'].map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <button onClick={() => { d.userPlannedStops = d.userPlannedStops?.filter((_, i) => i !== idx); setAllRaces({ ...allRaces }); }} style={{ background: 'none', color: '#ff4444', border: 'none', cursor: 'pointer', fontSize: '0.6rem' }}>×</button>
                          </div>
                        ))}
                        <button onClick={() => { d.userPlannedStops = [...(d.userPlannedStops || []), { lap: d.lap + 15, tyre: 'Medium' }]; setAllRaces({ ...allRaces }); }} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px dashed rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: '0.5rem', padding: '3px', borderRadius: '2px', fontWeight: 700 }}>+ ADD STOP</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-dim)', fontSize: '0.6rem', fontWeight: 800, textAlign: 'center', padding: '1rem' }}>SPECTATOR MODE:<br/>TEAM DATA UNAVAILABLE</div>
          )}
        </div>
      </div>
    </div>
  );
};
