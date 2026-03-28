import type { Team } from '../data/teams';
import type { EngineSupplier } from '../data/engines';
import type { Track } from '../data/tracks';

export interface RaceState {
  track: Track;
  lap: number; // Global leader lap
  totalLaps: number;
  weather: 'Dry' | 'Drizzle' | 'Rain' | 'HeavyRain';
  safetyCar: boolean;
  vsc: boolean;
  scLapsRemaining: number;
  fastestLapTime: number;
  fastestLapDriverId: string | null;
  competitors: CompetitorState[];
  isRealisticSim: boolean;
  sessionType: 'Practice' | 'Q1' | 'Q2' | 'Q3' | 'Race';
  bestS1?: number;
  bestS2?: number;
  bestS3?: number;
  events?: string[];
  trackGrip?: number;
  finishedDriverIds?: string[]; // Order of finishing
}

export interface CompetitorState {
  team: Team;
  drivers: {
    d1: DriverState;
    d2: DriverState;
  };
  engine: EngineSupplier;
}

export interface DriverState {
  driver: any; 
  position: number;
  gapToLeader: number;
  gapToAhead: number;
  lastLapTime: number;
  bestLapTime: number;
  lap: number; // Driver specific lap
  tyreAge: number; 
  tyreType: 'Soft' | 'Medium' | 'Hard' | 'Inter' | 'Wet';
  tyreCondition: number; // 100 to 0
  fuelLoad: number; // kg
  pitStops: number;
  hasPittedMandatory: boolean;
  isPitting: boolean;
  pitStopsPlanned: number;
  status: 'Racing' | 'Pitting' | 'Retired' | 'Finished';
  retirementReason?: string;
  s1Status?: 'purple' | 'green' | 'yellow' | 'red';
  s2Status?: 'purple' | 'green' | 'yellow' | 'red';
  s3Status?: 'purple' | 'green' | 'yellow' | 'red';
  personalBestSectors?: { s1: number; s2: number; s3: number };
  targetPitLap: number;
  strategy: '1-stop' | '2-stop';
  tyreHistory: string[];
  userPushMode?: 'Push' | 'Defend' | 'Balance';
  userEngineMode?: 'Push' | 'Balanced' | 'LiftAndCoast';
  userTeamOrders?: 'Swap' | 'Hold' | 'None';
  userTargetPitLap?: number;
  userNextTyre?: 'Soft' | 'Medium' | 'Hard' | 'Inter' | 'Wet';
  userPlannedStops?: { lap: number; tyre: 'Soft' | 'Medium' | 'Hard' | 'Inter' | 'Wet' }[];
  progress: number;
  totalProgress: number;
  incidentTimePenalty?: number;
  form?: number; // Session variation
}

export class RaceEngine {
  calculateTyreWear(driver: any, track: Track, tyreType: string): number {
    const baseWear = track.tyreWearFactor * 0.05; 
    const compoundMultipliers = { 'Soft': 1.8, 'Medium': 1.0, 'Hard': 0.6, 'Inter': 1.2, 'Wet': 0.8 };
    const driverMod = 1.1 - (driver.stats.tyreManagement / 100);
    return (baseWear * (compoundMultipliers as any)[tyreType]) * driverMod;
  }

  getWeatherModifier(weather: string, tyreType: string, skill: number): number {
    const isDryTyre = ['Soft', 'Medium', 'Hard'].includes(tyreType);
    const skillMod = (100 - skill) / 1000;

    if (weather === 'Dry') {
      if (tyreType === 'Inter') return 1.2 + skillMod;
      if (tyreType === 'Wet') return 1.5 + skillMod;
      return 1.0;
    }
    if (weather === 'Drizzle') {
      if (isDryTyre) return 1.15 + skillMod;
      if (tyreType === 'Inter') return 1.0;
      if (tyreType === 'Wet') return 1.1 + skillMod;
    }
    if (weather === 'Rain') {
      if (isDryTyre) return 1.6 + skillMod * 2;
      if (tyreType === 'Inter') return 1.05 + skillMod;
      if (tyreType === 'Wet') return 1.0;
    }
    if (weather === 'HeavyRain') {
      if (isDryTyre) return 2.5 + skillMod * 5;
      if (tyreType === 'Inter') return 1.3 + skillMod * 2;
      if (tyreType === 'Wet') return 1.0;
    }
    return 1.0;
  }

  processTick(session: RaceState, deltaTime: number): RaceState {
    const newState = { ...session };
    const drivers = newState.competitors.flatMap(c => [c.drivers.d1, c.drivers.d2]);
    
    // Dynamic Weather Change
    if (newState.sessionType === 'Race' && Math.random() < 0.0001 * deltaTime) { // Rare event
        const states: RaceState['weather'][] = ['Dry', 'Drizzle', 'Rain', 'HeavyRain'];
        const currentIdx = states.indexOf(newState.weather);
        
        // Random move within +/- 1
        const delta = Math.random() < 0.5 ? -1 : 1;
        const nextIdx = Math.max(0, Math.min(3, currentIdx + delta));
        
        if (states[nextIdx] !== newState.weather) {
          newState.weather = states[nextIdx];
          newState.events = [...(newState.events || []), `WEATHER: Changed to ${newState.weather}`].slice(-5);
        }
    }

    // Process weather changes (simple simulation)
    if (!newState.trackGrip) newState.trackGrip = 1.0;
    if (newState.weather === 'Dry') newState.trackGrip = Math.min(1.05, (newState.trackGrip || 1.0) + 0.001 * deltaTime);
    else newState.trackGrip = Math.max(0.4, (newState.trackGrip || 1.0) - 0.005 * deltaTime);

    drivers.sort((a,b) => (b.totalProgress || 0) - (a.totalProgress || 0));

    drivers.forEach(d => {
      if (d.status === 'Retired' || d.status === 'Finished') return;

      const teamEntry = newState.competitors.find(c => c.drivers.d1.driver.id === d.driver.id || c.drivers.d2.driver.id === d.driver.id)!;
      
      // 1. Random Mechanical Failures
      if (newState.sessionType === 'Race' && Math.random() < (0.00005 * (200 - (teamEntry.engine.reliability + (teamEntry.team.stats?.durability || 80))) / 100) * deltaTime) {
         d.status = 'Retired';
         const reasons = ['Engine Failure', 'Gearbox Issue', 'Suspension Failure', 'Hydraulics', 'Electrical Issue'];
         d.retirementReason = reasons[Math.floor(Math.random() * reasons.length)];
         newState.events = [...(newState.events || []), `${d.driver.name} retired (${d.retirementReason})`].slice(-5);
         return;
      }

      // 2. Driver Errors / Incidents
      if (d.status === 'Racing' && Math.random() < (0.0001 * (120 - d.driver.stats.consistency) / 100) * deltaTime) {
          const rand = Math.random();
          if (rand < 0.05 && d.driver.stats.aggression > 85) { // Crash
              d.status = 'Retired';
              d.retirementReason = 'Incident';
              newState.events = [...(newState.events || []), `${d.driver.name} crashed out!`].slice(-5);
              return;
          } else if (rand < 0.3) { // Spin
              d.incidentTimePenalty = (d.incidentTimePenalty || 0) + 8 + Math.random() * 7;
              newState.events = [...(newState.events || []), `${d.driver.name} spun!`].slice(-5);
          } else { // Wide
              d.incidentTimePenalty = (d.incidentTimePenalty || 0) + 1 + Math.random() * 2;
          }
      }

      const trackBase = newState.track.avgLapTimeSeconds || 90;
      // Weighted Performance: 65% Team, 35% Driver
      const teamPerf = ((teamEntry.team.stats?.aero || 80) * 0.3 + (teamEntry.team.stats?.chassis || 80) * 0.3 + teamEntry.engine.power * 0.4);
      const driverSkill = (d.driver.stats.pace * 0.7 + d.driver.stats.racecraft * 0.3);
      
      const combinedRating = (teamPerf * 0.65 + driverSkill * 0.35);
      
      // Wider gap: A 100 rating vs 50 rating creates a ~15% time difference
      let lapTime = trackBase * (1.25 - (combinedRating / 400));
      
      // Apply Form (subtle variation per session)
      lapTime *= (d.form || 1.0);
      
      // Tyre Factors
      const compoundMultipliers = { 'Soft': -0.8, 'Medium': 0, 'Hard': 0.8, 'Inter': 2, 'Wet': 4 };
      lapTime += (compoundMultipliers as any)[d.tyreType] || 0;
      
      // Tyre Degradation & Cliff
      const degPenalty = (100 - d.tyreCondition) * 0.04;
      const cliffPenalty = d.tyreCondition < 20 ? (20 - d.tyreCondition) * 0.3 : 0;
      lapTime += degPenalty + cliffPenalty;

      // Fuel Weight (roughly 0.03s per kg)
      lapTime += d.fuelLoad * 0.035;

      // Weather Modifier
      lapTime *= this.getWeatherModifier(newState.weather, d.tyreType, d.driver.stats.wetWeatherSkill);

      // Grip Modifier
      lapTime *= (1.1 - ((newState.trackGrip || 1.0) - 1.0) * 0.5);
      
      if (newState.safetyCar) lapTime *= 1.6;
      else if (newState.vsc) lapTime *= 1.4;

      // Apply Incident Penalties
      if (d.incidentTimePenalty && d.incidentTimePenalty > 0) {
          const penaltyToApply = Math.min(d.incidentTimePenalty, deltaTime * 2); 
          lapTime += penaltyToApply * (lapTime / deltaTime); // Skews progress
          d.incidentTimePenalty -= penaltyToApply;
      }

      // Final Randomness based on Consistency
      const rngFactor = (105 - d.driver.stats.consistency) / 100;
      const actualTickLapTime = lapTime + (Math.random() - 0.5) * rngFactor;

      const progressDelta = deltaTime / actualTickLapTime;
      const oldProgress = d.progress;
      
      let pDelta = progressDelta;
      if (d.status === 'Pitting') {
          const pitstopBase = 23 + (100 - (teamEntry.team.stats?.pitCrew || 80)) * 0.08;
          const pitstopActual = pitstopBase + (Math.random() - 0.5) * 1.5;
          pDelta = deltaTime / (actualTickLapTime + pitstopActual);
      }

      d.progress += pDelta;
      
      // Sector tracking
      if (oldProgress < 0.33 && d.progress >= 0.33) d.personalBestSectors = { ...d.personalBestSectors, s1: actualTickLapTime/3 + (Math.random()-0.5)*rngFactor } as any;
      if (oldProgress < 0.66 && d.progress >= 0.66) d.personalBestSectors = { ...d.personalBestSectors, s2: actualTickLapTime/3 + (Math.random()-0.5)*rngFactor } as any;

      if (d.progress >= 1.0) {
        d.lap += 1;
        d.progress -= 1.0;
        d.lastLapTime = actualTickLapTime;
        if (d.bestLapTime === 0 || actualTickLapTime < d.bestLapTime) d.bestLapTime = actualTickLapTime;
         if (d.lap >= newState.totalLaps) {
           d.status = 'Finished';
           if (!newState.finishedDriverIds) newState.finishedDriverIds = [];
           if (!newState.finishedDriverIds.includes(d.driver.id)) {
             newState.finishedDriverIds.push(d.driver.id);
           }
         }
         d.tyreAge += 1;
         const plan = d.userPlannedStops?.find(p => p.lap === d.lap);
         if (plan) d.status = 'Pitting';
       }

      if (d.status === 'Pitting' && d.progress > 0.02) { 
          const plan = d.userPlannedStops?.find(p => p.lap === d.lap);
          if (plan) {
              d.tyreType = plan.tyre;
              d.tyreCondition = 100;
              d.tyreAge = 0;
              if (!d.tyreHistory.includes(plan.tyre[0])) d.tyreHistory.push(plan.tyre[0]);
              d.pitStops += 1;
          }
          d.status = 'Racing';
      }
      d.totalProgress = d.lap + d.progress;

      const wear = this.calculateTyreWear(d.driver, newState.track, d.tyreType);
      d.tyreCondition = Math.max(0, d.tyreCondition - (wear * deltaTime));
      
      // Fuel Consumption mod by engine efficiency
      const fuelCons = (1.5 * (110 - (teamEntry.engine.efficiency || 90)) / 100);
      d.fuelLoad = Math.max(0, d.fuelLoad - (fuelCons * deltaTime / trackBase));

      if (d.fuelLoad <= 0 && d.status === 'Racing' && newState.sessionType === 'Race') {
          d.status = 'Retired';
          d.retirementReason = 'Out of Fuel';
          newState.events = [...(newState.events || []), `${d.driver.name} ran out of fuel!`].slice(-5);
      }
    });

    // Sorting and Position logic
    const activeDrivers = drivers.filter(d => d.status !== 'Retired');
    let sorted;
    if (newState.sessionType === 'Race') {
        sorted = [...activeDrivers].sort((a, b) => {
            if (a.status === 'Finished' && b.status === 'Finished') {
                const aIdx = (newState.finishedDriverIds || []).indexOf(a.driver.id);
                const bIdx = (newState.finishedDriverIds || []).indexOf(b.driver.id);
                return aIdx - bIdx;
            }
            if (a.status === 'Finished') return -1;
            if (b.status === 'Finished') return 1;
            return b.totalProgress - a.totalProgress;
        });
    } else {
        sorted = [...activeDrivers].sort((a, b) => {
            if (a.bestLapTime === 0 && b.bestLapTime === 0) return 0;
            if (a.bestLapTime === 0) return 1;
            if (b.bestLapTime === 0) return -1;
            return a.bestLapTime - b.bestLapTime;
        });
    }
    const retired = drivers.filter(d => d.status === 'Retired');
    const allSorted = [...sorted, ...retired];

    const leader = allSorted[0];
    if (leader) {
        allSorted.forEach((d, idx) => {
          d.position = idx + 1;
          const ahead = allSorted[idx - 1];
          const avgLap = newState.track.avgLapTimeSeconds || 90;
          d.gapToLeader = (leader.totalProgress - d.totalProgress) * avgLap;
          d.gapToAhead = ahead ? (ahead.totalProgress - d.totalProgress) * avgLap : 0;
        });
        newState.lap = Math.max(0, Math.floor(leader.totalProgress));
    }
    
    return newState;
  }

  processLap(session: RaceState): RaceState {
      return this.processTick(session, 90);
  }
}

