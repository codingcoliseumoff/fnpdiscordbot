class RaceEngine {
    constructor() {
        this.compoundMultipliers = { 'Soft': 1.8, 'Medium': 1.0, 'Hard': 0.6, 'Inter': 1.2, 'Wet': 0.8 };
        this.weatherMultipliers = { 'Dry': 1, 'Drizzle': 1.15, 'Rain': 1.6, 'HeavyRain': 2.5 };
    }

    calculateTyreWear(driver, track, tyreType) {
        const baseWear = (track?.tyreWearFactor || 1.0) * 0.05;
        const compoundMult = this.compoundMultipliers[tyreType] || 1.0;
        const driverMod = 1.1 - ((driver.stats?.tyreManagement || 50) / 100);
        return (baseWear * compoundMult) * driverMod;
    }

    getWeatherModifier(weather, tyreType, skill) {
        const isDryTyre = ['Soft', 'Medium', 'Hard'].includes(tyreType);
        const skillMod = (100 - (skill || 50)) / 1000;

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

    processTick(session, deltaTime) {
        const newState = JSON.parse(JSON.stringify(session));
        const drivers = newState.competitors.flatMap(c => [c.drivers.d1, c.drivers.d2]);

        // Weather dynamics
        if (newState.sessionType === 'Race' && Math.random() < 0.0005 * deltaTime) {
            const states = ['Dry', 'Drizzle', 'Rain', 'HeavyRain'];
            const currentIdx = states.indexOf(newState.weather);
            const delta = Math.random() < 0.4 ? -1 : 1;
            const nextIdx = Math.max(0, Math.min(3, currentIdx + delta));
            if (states[nextIdx] !== newState.weather) {
                newState.weather = states[nextIdx];
                if (!newState.events) newState.events = [];
                newState.events.push(`⚠️ WEATHER: Changing to ${newState.weather}`);
            }
        }

        // Track evolution & Grip
        if (!newState.trackGrip) newState.trackGrip = 1.0;
        const rubberingSpeed = 0.0002 * (1 + (drivers.length / 20));
        if (newState.weather === 'Dry') newState.trackGrip = Math.min(1.15, newState.trackGrip + rubberingSpeed * deltaTime);
        else newState.trackGrip = Math.max(0.45, newState.trackGrip - 0.015 * deltaTime);

        // Safety Car Dynamics
        if (newState.safetyCar) {
            newState.safetyCarLaps = (newState.safetyCarLaps || 0) - (deltaTime / 100);
            if (newState.safetyCarLaps <= 0) {
                newState.safetyCar = false;
                if (!newState.events) newState.events = [];
                newState.events.push("🟢 SAFETY CAR IN THIS LAP - RACE RESUMES!");
            }
        }

        drivers.sort((a, b) => (b.totalProgress || 0) - (a.totalProgress || 0));

        drivers.forEach(d => {
            if (d.status === 'Retired' || d.status === 'Finished') return;

            const competitor = newState.competitors.find(c => c.drivers.d1.driver.id === d.driver.id || c.drivers.d2.driver.id === d.driver.id);
            const team = competitor.team;
            const engine = competitor.engine;

            // Reliability
            const relBase = (engine.reliability || 80) + (team.reliability || 20);
            if (newState.sessionType === 'Race' && Math.random() < (0.00008 * (200 - relBase) / 100) * deltaTime) {
                d.status = 'Retired';
                d.retirementReason = ['MGU-H Failure', 'Turbulence Damage', 'Oil Leak', 'Hydraulic Drift', 'Electrical Snap'][Math.floor(Math.random() * 5)];
                if (!newState.events) newState.events = [];
                newState.events.push(`❌ ${d.driver.name} retired (${d.retirementReason})`);
                
                // Safety Car Chance
                if (Math.random() < 0.4) {
                    newState.safetyCar = true;
                    newState.safetyCarLaps = 3 + Math.random() * 4;
                    newState.events.push("🟡 SAFETY CAR DEPLOYED!");
                }
                return;
            }

            // Incidents & Driver Traits
            const consistency = (d.driver.stats?.consistency || 50);
            const trait = d.driver.trait || 'Standard';
            let incidentChance = 0.00015 * (120 - consistency) / 100;
            if (trait === 'Wet Specialist' && newState.weather !== 'Dry') incidentChance *= 0.5;
            if (trait === 'Choker' && (d.position || 20) <= 3) incidentChance *= 2.5;

            if (d.status === 'Racing' && Math.random() < incidentChance * deltaTime) {
                const rand = Math.random();
                if (rand < 0.08) {
                    d.status = 'Retired';
                    d.retirementReason = 'Accident';
                    if (!newState.events) newState.events = [];
                    newState.events.push(`💥 ${d.driver.name} crashed out!`);
                    
                    newState.safetyCar = true;
                    newState.safetyCarLaps = 4 + Math.random() * 5;
                    newState.events.push("🟡 SAFETY CAR DEPLOYED!");
                    return;
                } else if (rand < 0.3) {
                    d.incidentTimePenalty = (d.incidentTimePenalty || 0) + 12;
                    if (!newState.events) newState.events = [];
                    newState.events.push(`🔄 ${d.driver.name} spun!`);
                }
            }

            const trackBase = newState.track?.avgLapTimeSeconds || 90;
            // Car Branching Logic
            let powerMult = (engine.power || 80) * 0.4;
            let aeroMult = (team.aero || 80) * 0.3;
            let chassisMult = (team.chassis || 80) * 0.3;

            if (team.development_path === 'HighSpeed') { powerMult *= 1.1; aeroMult *= 0.9; }
            if (team.development_path === 'Cornering') { chassisMult *= 1.15; powerMult *= 0.95; }

            const teamPerf = powerMult + aeroMult + chassisMult;
            const driverSkill = ((d.driver.stats?.pace || 50) * 0.7 + (d.driver.stats?.racecraft || 50) * 0.3);
            const combinedRating = (teamPerf * 0.65 + driverSkill * 0.35);

            let lapTime = trackBase * (1.25 - (combinedRating / 400));
            
            // Meta strategy bonus (Hidden)
            if (d.tyreType === 'Medium' && d.tyreCondition > 60) lapTime *= 0.985; // Medium is slightly "meta" in current build

            const compoundMults = { 'Soft': -1.2, 'Medium': 0, 'Hard': 1.1, 'Inter': 2.5, 'Wet': 5.5 };
            lapTime += compoundMults[d.tyreType] || 0;

            const degPenalty = (100 - d.tyreCondition) * 0.05;
            lapTime += degPenalty;
            lapTime += (d.fuelLoad || 0) * 0.038;

            lapTime *= this.getWeatherModifier(newState.weather, d.tyreType, d.driver.stats?.wetWeatherSkill || 50);
            lapTime *= (1.15 - ((newState.trackGrip || 1.0) - 1.0) * 0.8);

            if (newState.safetyCar) lapTime *= 1.95; 

            // Actual progress
            const actualTickLapTime = lapTime + (Math.random() - 0.5) * 0.5;
            const progressDelta = deltaTime / actualTickLapTime;
            
            let pDelta = progressDelta;
            if (d.status === 'Pitting') {
                const pitstopBase = 22 + (100 - (team.stats?.pitCrew || 80)) * 0.1;
                // Reaction bonus check would happen at interface level
                pDelta = deltaTime / (actualTickLapTime + pitstopBase);
            }

            d.progress += pDelta;

            if (d.progress >= 1.0) {
                d.lap += 1;
                d.progress -= 1.0;
                if (d.lap >= newState.totalLaps) d.status = 'Finished';
                d.tyreAge += 1;
                if (d.userPlannedStops?.find(p => p.lap === d.lap)) d.status = 'Pitting';
            }

            if (d.status === 'Pitting' && d.progress > 0.02) {
                const plan = d.userPlannedStops?.find(p => p.lap === d.lap);
                if (plan) {
                    d.tyreType = plan.tyre;
                    d.tyreCondition = 100;
                    d.tyreAge = 0;
                    d.pitStops = (d.pitStops || 0) + 1;
                }
                d.status = 'Racing';
            }
            d.totalProgress = d.lap + d.progress;

            const wear = this.calculateTyreWear(d.driver, newState.track, d.tyreType);
            d.tyreCondition = Math.max(0, d.tyreCondition - (wear * deltaTime));
            
            const fuelCons = (1.5 * (110 - (engine?.efficiency || 90)) / 100);
            d.fuelLoad = Math.max(0, (d.fuelLoad || 0) - (fuelCons * deltaTime / trackBase));

            if (d.fuelLoad <= 0 && d.status === 'Racing' && newState.sessionType === 'Race') {
                d.status = 'Retired';
                d.retirementReason = 'Out of Fuel';
                if (!newState.events) newState.events = [];
                newState.events.push(`${d.driver.name} ran out of fuel!`);
            }
        });

        // Sorting
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
        newState.competitors_sorted = [...sorted, ...retired]; // Simplified array

        const leader = newState.competitors_sorted[0];
        if (leader) {
            newState.competitors_sorted.forEach((d, idx) => {
                d.position = idx + 1;
                const ahead = newState.competitors_sorted[idx - 1];
                const avgLap = newState.track?.avgLapTimeSeconds || 90;
                d.gapToLeader = (leader.totalProgress - d.totalProgress) * avgLap;
                d.gapToAhead = ahead ? (ahead.totalProgress - d.totalProgress) * avgLap : 0;
            });
            newState.lap = Math.max(0, Math.floor(leader.totalProgress));
        }

        return newState;
    }
}

module.exports = { RaceEngine };
