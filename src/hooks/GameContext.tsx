import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Team } from '../data/teams';
import { TEAMS, NATIONAL_TEAMS } from '../data/teams';
import type { Driver } from '../data/drivers';
import { DRIVERS, DRIVERS_NATIONAL } from '../data/drivers';
import type { Track } from '../data/tracks';
import { TRACKS } from '../data/tracks';
import type { EngineSupplier } from '../data/engines';
import { ENGINES } from '../data/engines';

interface GameState {
  teams: Team[];
  nationalTeams: Team[];
  drivers: Driver[];
  driversNational: Driver[];
  tracks: Track[];
  engines: EngineSupplier[];
  currentSeason: number;
  currentTier: number;
  currentRound: number; // Index of TRACKS
  currentSession: 'Practice' | 'Q1' | 'Q2' | 'Q3' | 'Race' | 'Results';
  userTeamId: string | null;
  standings: Record<number, Record<string, number>>; // Tier -> TeamId -> Points
  standingsNational: Record<number, Record<string, number>>; // Tier -> TeamId -> Points
  standingsDrivers: Record<number, Record<string, number>>; // Tier -> DriverId -> Points
  standingsDriversNational: Record<number, Record<string, number>>; // Tier -> DriverId -> Points
  wdcHistory: Record<number, Record<number, { driverId: string, teamId: string, points: number }[]>>; 
  wccHistory: Record<number, Record<number, { teamId: string, points: number }[]>>;
  raceResults: Record<number, Record<number, any[]>>; 
  isRealisticSim: boolean;
  isNationalMode: boolean;
}

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<React.SetStateAction<GameState>>;
  advanceSeason: () => void;
  toggleRealisticSim: () => void;
  toggleNationalMode: () => void;
  updateTeam: (teamId: string, updates: Partial<Team>) => void;
  updateDriver: (driverId: string, updates: Partial<Driver>) => void;
  applyRacePoints: (tier: number, results: { teamId: string, position: number, fastestLap: boolean }[]) => void;
  setSession: (session: GameState['currentSession']) => void;
  nextRound: () => void;
  resetStats: () => void;
  createDriver: (driverData: Omit<Driver, 'id'>, replaceId: string) => void;
  saveRaceResults: (season: number, round: number, results: any[]) => void;
  selectUserTeam: (teamId: string | null) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from localStorage on initial boot
  const [state, setState] = useState<GameState>(() => {
    const defaultState: GameState = {
      teams: TEAMS,
      nationalTeams: NATIONAL_TEAMS,
      drivers: DRIVERS,
      driversNational: DRIVERS_NATIONAL,
      tracks: TRACKS,
      engines: ENGINES,
      currentSeason: 2025,
      currentTier: 1,
      currentRound: 0, // Melbourne
      currentSession: 'Practice',
      userTeamId: null,
      standings: {},
      standingsNational: {},
      standingsDrivers: {},
      standingsDriversNational: {},
      wdcHistory: {},
      wccHistory: {},
      raceResults: {},
      isRealisticSim: true,
      isNationalMode: false,
    };

    const saved = localStorage.getItem('f1_sim_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaultState, ...parsed };
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }
    return defaultState;
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('f1_sim_state', JSON.stringify(state));
  }, [state]);

  // Helper to initialize all tiers if they are empty
  useEffect(() => {
    if (Object.keys(state.standings).length > 0) return;

    const initialStandings: Record<number, Record<string, number>> = {};
    for (let i = 1; i <= 10; i++) {
      initialStandings[i] = TEAMS.filter(t => t.tier === i).reduce((acc, t) => ({ ...acc, [t.id]: 0 }), {});
    }
    
    const initialStandingsNational: Record<number, Record<string, number>> = {};
    for (let i = 1; i <= 5; i++) {
        initialStandingsNational[i] = NATIONAL_TEAMS.filter(t => t.tier === i).reduce((acc, t) => ({ ...acc, [t.id]: 0 }), {});
    }

    const initDriverStandings: Record<number, Record<string, number>> = {};
    for (let i = 1; i <= 10; i++) {
        initDriverStandings[i] = {};
    }
    const initDriverStandingsNat: Record<number, Record<string, number>> = {};
    for (let i = 1; i <= 5; i++) {
        initDriverStandingsNat[i] = {};
    }

    setState(prev => ({ 
        ...prev, 
        standings: initialStandings,
        standingsNational: initialStandingsNational,
        standingsDrivers: initDriverStandings,
        standingsDriversNational: initDriverStandingsNat
    }));
  }, []);

  const advanceSeason = () => {
    setState(prev => {
      const isNational = prev.isNationalMode;
      const currentTeams = isNational ? [...prev.nationalTeams] : [...prev.teams];
      const currentStandings = isNational ? prev.standingsNational : prev.standings;
      const currentDriverStandings = isNational ? prev.standingsDriversNational : prev.standingsDrivers;
      const maxTiers = isNational ? 5 : 10;
      const allDrivers = isNational ? [...prev.driversNational] : [...prev.drivers];

      // 1. Helper: Calculate Ratings
      const getTeamRating = (team: Team) => {
        const s = team.stats;
        return (s.aero + s.chassis + s.powerUnit + s.cornering + s.topSpeed) / 5;
      };
      const getDriverRating = (driver: Driver) => {
        const s = driver.stats;
        return (s.pace + s.racecraft + s.consistency) / 3;
      };

      // 2. Evaluation Phase (Per Tier)
      const evaluationResults: Record<string, { pd: number, des: number, teammateDelta: number }> = {};
      
      for (let tier = 1; tier <= maxTiers; tier++) {
        const tierTeams = currentTeams.filter(t => t.tier === tier);
        const tierDrivers = allDrivers.filter(d => d.teamId && tierTeams.some(t => t.id === d.teamId));
        
        // Expected rankings based on EPS
        const expectedOrder = tierDrivers.sort((a, b) => {
          const teamA = tierTeams.find(t => t.id === a.teamId)!;
          const teamB = tierTeams.find(t => t.id === b.teamId)!;
          const epsA = (getTeamRating(teamA) * 0.65) + (getDriverRating(a) * 0.35);
          const epsB = (getTeamRating(teamB) * 0.65) + (getDriverRating(b) * 0.35);
          return epsB - epsA;
        }).map(d => d.id);

        // Actual rankings based on points
        const points = currentDriverStandings[tier] || {};
        const actualOrder = tierDrivers.sort((a, b) => (points[b.id] || 0) - (points[a.id] || 0)).map(d => d.id);

        tierDrivers.forEach(d => {
          const expectedPos = expectedOrder.indexOf(d.id) + 1;
          const actualPos = actualOrder.indexOf(d.id) + 1;
          const pd = expectedPos - actualPos;
          
          // Teammate comparison
          const team = tierTeams.find(t => t.id === d.teamId)!;
          const teammate = tierDrivers.find(td => td.teamId === team.id && td.id !== d.id);
          let teammateDelta = 0;
          if (teammate) {
            const myPts = points[d.id] || 0;
            const theirPts = points[teammate.id] || 0;
            teammateDelta = (myPts - theirPts) / Math.max(1, (myPts + theirPts) / 2);
          }

          const expectedPts = 200 / expectedPos; // Simple model
          const actualPts = points[d.id] || 0;
          const des = (actualPts / Math.max(1, expectedPts)) * 100;

          evaluationResults[d.id] = { pd, des, teammateDelta };
        });
      }

      // 3. Evolution Phase
      const updatedDrivers = allDrivers.map(d => {
        const evalData = evaluationResults[d.id];
        if (!evalData) return { ...d, age: d.age + 1 }; // Free agents just age

        let ratingChange = 0;
        if (prev.isRealisticSim) {
          ratingChange += evalData.pd * 0.25;
          ratingChange += evalData.teammateDelta * 1.5;
          
          // Age Modifier
          let ageMod = 1.0;
          if (d.age < 24) ageMod = 1.2;
          else if (d.age < 30) ageMod = 1.0;
          else if (d.age < 35) ageMod = 0.7;
          else ageMod = -0.5;
          
          const growthBase = (d.potential - getDriverRating(d)) / 10;
          ratingChange += growthBase * ageMod;
          ratingChange += (Math.random() - 0.5);
        }

        const clamp = Math.max(-3, Math.min(3, ratingChange));
        const newStats = { ...d.stats };
        Object.keys(newStats).forEach(key => {
          (newStats as any)[key] = Math.max(10, Math.min(99, (newStats as any)[key] + clamp));
        });

        return { ...d, stats: newStats, age: d.age + 1 };
      });

      // 4. Team Promotion/Relegation
      const teamUpdates: Record<string, number> = {};
      for (let tier = 1; tier <= maxTiers; tier++) {
        const tierResults = Object.entries(currentStandings[tier] || {}).sort((a, b) => b[1] - a[1]);
        if (tier > 1) tierResults.slice(0, 2).map(r => r[0]).forEach(id => teamUpdates[id] = tier - 1);
        if (tier < maxTiers) tierResults.slice(-2).map(r => r[0]).forEach(id => teamUpdates[id] = tier + 1);
      }

      const updatedTeamsList = currentTeams.map(team => {
        const newTier = teamUpdates[team.id] || team.tier;
        const newStats = { ...team.stats };
        if (prev.isRealisticSim) {
          Object.keys(newStats).forEach(stat => {
            const currentStat = (newStats as any)[stat];
            const delta = (Math.random() - 0.45) * 6; // Team development
            (newStats as any)[stat] = Math.max(10, Math.min(100, currentStat + delta));
          });
        }
        return { ...team, tier: newTier, stats: newStats };
      });

      // 5. Transfer Market (Seat Shuffle)
      const seatAssignments: Record<string, string[]> = {}; 
      const driverJobStatus: Record<string, string | null> = {}; // driverId -> teamId
      
      // Initialize Job Status
      updatedDrivers.forEach(d => driverJobStatus[d.id] = d.teamId);

      // Process tiers from top to bottom (Tier 1 gets first pick)
      updatedTeamsList.sort((a, b) => a.tier - b.tier).forEach(team => {
        const currentTeamDrivers = updatedDrivers.filter(d => driverJobStatus[d.id] === team.id);
        const signed: string[] = [];

        // Decision: Who to keep?
        currentTeamDrivers.forEach(d => {
          const evalData = evaluationResults[d.id];
          if (!evalData || team.id === prev.userTeamId) { signed.push(d.id); return; }
          
          let retentionScore = (evalData.des * 0.5) + (d.loyalty * 0.2);
          // If a driver is really good (DES > 115), they might want to leave for a better team, 
          // but here we check if the TEAM wants to keep them.
          if (retentionScore > 65) {
            signed.push(d.id);
          } else {
            driverJobStatus[d.id] = null; // Released
          }
        });

        // Fill remaining seats
        while (signed.length < 2) {
          const candidates = updatedDrivers
            .filter(d => !signed.includes(d.id) && !Object.values(seatAssignments).flat().includes(d.id))
            .sort((a, b) => {
              const ratingA = getDriverRating(a);
              const ratingB = getDriverRating(b);
              const evalA = evaluationResults[a.id]?.des || 80;
              const evalB = evaluationResults[b.id]?.des || 80;
              
              const scoreA = (ratingA * 0.5) + (a.potential * 0.3) + (evalA * 0.2);
              const scoreB = (ratingB * 0.5) + (b.potential * 0.3) + (evalB * 0.2);
              return scoreB - scoreA;
            });

          // Top teams pick the best available
          // (Available means not yet signed to a team in this shuffle)
          const pick = candidates[Math.floor(Math.random() * Math.min(3, candidates.length))];
          if (pick) {
              signed.push(pick.id);
              driverJobStatus[pick.id] = team.id;
          } else break;
        }
        seatAssignments[team.id] = signed;
      });

      // Apply assignments
      const finalDrivers = updatedDrivers.map(d => {
        const teamId = Object.keys(seatAssignments).find(tId => seatAssignments[tId].includes(d.id));
        return { 
          ...d, 
          teamId: teamId || null, 
          role: teamId ? 'Main' : 'FreeAgent' as any 
        };
      });

      // 6. Record Season history
      const currentWDC: Record<number, any> = {};
      const currentWCC: Record<number, any> = {};
      
      for (let i = 1; i <= maxTiers; i++) {
          const tierDrivers = allDrivers.filter(d => driverJobStatus[d.id] && updatedTeamsList.find(t => t.id === driverJobStatus[d.id])?.tier === i);
          currentWDC[i] = tierDrivers.map(d => ({
              driverId: d.id,
              teamId: driverJobStatus[d.id],
              points: currentDriverStandings[i]?.[d.id] || 0
          })).sort((a,b) => b.points - a.points).slice(0, 3);

          currentWCC[i] = updatedTeamsList.filter(t => t.tier === i).map(t => ({
              teamId: t.id,
              points: currentStandings[i]?.[t.id] || 0
          })).sort((a,b) => b.points - a.points).slice(0, 3);
      }

      // 7. Reset Standings
      const newStandings: Record<number, Record<string, number>> = {};
      const newDriverStandings: Record<number, Record<string, number>> = {};
      for (let i = 1; i <= maxTiers; i++) {
        newStandings[i] = updatedTeamsList.filter(t => t.tier === i).reduce((acc, t) => ({ ...acc, [t.id]: 0 }), {});
        newDriverStandings[i] = {};
      }

      return { 
        ...prev, 
        currentSeason: prev.currentSeason + 1,
        currentRound: 0, // Force start at Melbourne (index 0)
        currentSession: 'Practice' as const,
        teams: isNational ? prev.teams : updatedTeamsList,
        nationalTeams: isNational ? updatedTeamsList : prev.nationalTeams,
        drivers: isNational ? prev.drivers : finalDrivers,
        driversNational: isNational ? finalDrivers : prev.driversNational,
        standings: isNational ? prev.standings : newStandings,
        standingsNational: isNational ? newStandings : prev.standingsNational,
        standingsDrivers: isNational ? prev.standingsDrivers : newDriverStandings,
        standingsDriversNational: isNational ? newDriverStandings : prev.standingsDriversNational,
        wdcHistory: { ...prev.wdcHistory, [prev.currentSeason]: currentWDC },
        wccHistory: { ...prev.wccHistory, [prev.currentSeason]: currentWCC }
      };
    });
  };

  const toggleRealisticSim = () => {
    setState(prev => ({ ...prev, isRealisticSim: !prev.isRealisticSim }));
  };

  const toggleNationalMode = () => {
    setState(prev => ({ ...prev, isNationalMode: !prev.isNationalMode, currentRound: 0, currentSession: 'Practice' }));
  };

  const updateTeam = (teamId: string, updates: Partial<Team>) => {
    setState(prev => ({
      ...prev,
      teams: prev.teams.map(t => t.id === teamId ? { ...t, ...updates } : t),
      nationalTeams: prev.nationalTeams.map(t => t.id === teamId ? { ...t, ...updates } : t)
    }));
  };

  const updateDriver = (driverId: string, updates: Partial<Driver>) => {
    setState(prev => ({
      ...prev,
      drivers: prev.isNationalMode ? prev.drivers : prev.drivers.map(d => d.id === driverId ? { ...d, ...updates } : d),
      driversNational: prev.isNationalMode ? prev.driversNational.map(d => d.id === driverId ? { ...d, ...updates } : d) : prev.driversNational
    }));
  };

  const saveRaceResults = (season: number, round: number, results: any[]) => {
    setState(prev => {
      const newResults = { ...prev.raceResults };
      if (!newResults[season]) newResults[season] = {};
      newResults[season][round] = results;
      return { ...prev, raceResults: newResults };
    });
  };

  const applyRacePoints = (tier: number, results: { teamId: string, driverId?: string, position: number, fastestLap: boolean }[]) => {
    const pointsMap = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
    setState(prev => {
      // Save results automatically
      const newRaceResults = { ...prev.raceResults };
      if (!newRaceResults[prev.currentSeason]) newRaceResults[prev.currentSeason] = {};
      newRaceResults[prev.currentSeason][prev.currentRound] = results;

      if (prev.isNationalMode) {
        const newStandings = { ...prev.standingsNational };
        const tierPoints = { ...(newStandings[tier] || {}) };
        const newDriverStandings = { ...prev.standingsDriversNational };
        const tierDriverPoints = { ...(newDriverStandings[tier] || {}) };
        
        results.forEach(res => {
          let pts = pointsMap[res.position - 1] || 0;
          if (res.fastestLap && res.position <= 10) pts += 1;
          tierPoints[res.teamId] = (tierPoints[res.teamId] || 0) + pts;
          if (res.driverId) {
            tierDriverPoints[res.driverId] = (tierDriverPoints[res.driverId] || 0) + pts;
          }
        });
        newStandings[tier] = tierPoints;
        newDriverStandings[tier] = tierDriverPoints;
        return { ...prev, standingsNational: newStandings, standingsDriversNational: newDriverStandings, raceResults: newRaceResults };
      } else {
        const newStandings = { ...prev.standings };
        const tierPoints = { ...(newStandings[tier] || {}) };
        const newDriverStandings = { ...prev.standingsDrivers };
        const tierDriverPoints = { ...(newDriverStandings[tier] || {}) };

        results.forEach(res => {
          let pts = pointsMap[res.position - 1] || 0;
          if (res.fastestLap && res.position <= 10) pts += 1;
          tierPoints[res.teamId] = (tierPoints[res.teamId] || 0) + pts;
          if (res.driverId) {
            tierDriverPoints[res.driverId] = (tierDriverPoints[res.driverId] || 0) + pts;
          }
        });
        newStandings[tier] = tierPoints;
        newDriverStandings[tier] = tierDriverPoints;
        return { ...prev, standings: newStandings, standingsDrivers: newDriverStandings, raceResults: newRaceResults };
      }
    });
  };

  const setSession = (session: GameState['currentSession']) => {
    setState(prev => ({ ...prev, currentSession: session }));
  };

  const nextRound = () => {
    const isGameOver = state.currentRound + 1 >= state.tracks.length;
    if (isGameOver) {
        advanceSeason();
    } else {
        setState(prev => ({ 
          ...prev, 
          currentRound: prev.currentRound + 1,
          currentSession: 'Practice'
        }));
    }
  };
  const resetStats = () => {
    if (!window.confirm("ARE YOU SURE? THIS WILL RESET ALL STANDINGS, SEASONS, AND PERFORMANCE MODIFICATIONS.")) return;

    const initialStandings: Record<number, Record<string, number>> = {};
    for (let i = 1; i <= 10; i++) {
      initialStandings[i] = TEAMS.filter(t => t.tier === i).reduce((acc, t) => ({ ...acc, [t.id]: 0 }), {});
    }
    
    const initialStandingsNational: Record<number, Record<string, number>> = {};
    for (let i = 1; i <= 5; i++) {
        initialStandingsNational[i] = NATIONAL_TEAMS.filter(t => t.tier === i).reduce((acc, t) => ({ ...acc, [t.id]: 0 }), {});
    }

    const initDriverStandings: Record<number, Record<string, number>> = {};
    for (let i = 1; i <= 10; i++) initDriverStandings[i] = {};
    const initDriverStandingsNat: Record<number, Record<string, number>> = {};
    for (let i = 1; i <= 5; i++) initDriverStandingsNat[i] = {};

    setState({
      teams: TEAMS,
      nationalTeams: NATIONAL_TEAMS,
      drivers: DRIVERS,
      driversNational: DRIVERS_NATIONAL,
      tracks: TRACKS,
      engines: ENGINES,
      currentSeason: 2025,
      currentTier: 1,
      currentRound: 0, // Melbourne
      currentSession: 'Practice',
      userTeamId: null,
      standings: initialStandings,
      standingsNational: initialStandingsNational,
      standingsDrivers: initDriverStandings,
      standingsDriversNational: initDriverStandingsNat,
      wdcHistory: {},
      wccHistory: {},
      raceResults: {},
      isRealisticSim: true,
      isNationalMode: false,
    });
  };

  const createDriver = (driverData: Omit<Driver, 'id'>, replaceId: string) => {
    setState(prev => {
      const newId = `custom-${Date.now()}`;
      const newDriver: Driver = { ...driverData, id: newId };
      
      const updateList = (list: Driver[]) => {
        const replacement = list.find(d => d.id === replaceId);
        if (!replacement) return list;
        
        // Take over the team and role of the driver we are replacing
        newDriver.teamId = replacement.teamId;
        newDriver.role = replacement.role;
        
        // Add new driver and remove old one
        return [...list.filter(d => d.id !== replaceId), newDriver];
      };

      const isNational = prev.isNationalMode;
      return {
        ...prev,
        drivers: isNational ? prev.drivers : updateList(prev.drivers),
        driversNational: isNational ? updateList(prev.driversNational) : prev.driversNational
      };
    });
  };

  const [activeTab, setActiveTabTab] = useState('dashboard');

  const selectUserTeam = (teamId: string | null) => {
    setState(prev => ({ ...prev, userTeamId: teamId }));
  };

  return (
    <GameContext.Provider value={{ 
      state, 
      dispatch: setState, 
      advanceSeason, 
      toggleRealisticSim, 
      toggleNationalMode,
      updateTeam, 
      updateDriver,
      applyRacePoints,
      setSession,
      nextRound,
      resetStats,
      createDriver,
      saveRaceResults,
      selectUserTeam,
      activeTab,
      setActiveTab: setActiveTabTab
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within GameProvider');
  return context;
};
