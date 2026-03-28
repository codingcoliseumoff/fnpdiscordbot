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
        if (newState.sessionType === 'Race' && Math.random() < 0.0001 * deltaTime) {
            const states = ['Dry', 'Drizzle', 'Rain', 'HeavyRain'];
            const currentIdx = states.indexOf(newState.weather);
            const delta = Math.random() < 0.5 ? -1 : 1;
            const nextIdx = Math.max(0, Math.min(3, currentIdx + delta));
            if (states[nextIdx] !== newState.weather) {
                newState.weather = states[nextIdx];
                if (!newState.events) newState.events = [];
                newState.events.push(`WEATHER: Changed to ${newState.weather}`);
            }
        }

        if (!newState.trackGrip) newState.trackGrip = 1.0;
        if (newState.weather === 'Dry') newState.trackGrip = Math.min(1.05, newState.trackGrip + 0.001 * deltaTime);
        else newState.trackGrip = Math.max(0.4, newState.trackGrip - 0.005 * deltaTime);

        drivers.sort((a, b) => (b.totalProgress || 0) - (a.totalProgress || 0));

        drivers.forEach(d => {
            if (d.status === 'Retired' || d.status === 'Finished') return;

            const competitor = newState.competitors.find(c => c.drivers.d1.driver.id === d.driver.id || c.drivers.d2.driver.id === d.driver.id);
            const team = competitor.team;
            const engine = competitor.engine;

            // Reliability
            if (newState.sessionType === 'Race' && Math.random() < (0.00005 * (200 - ((engine.reliability || 80) + (team.stats?.durability || 80))) / 100) * deltaTime) {
                d.status = 'Retired';
                const reasons = ['Engine Failure', 'Gearbox Issue', 'Suspension Failure', 'Hydraulics', 'Electrical Issue'];
                d.retirementReason = reasons[Math.floor(Math.random() * reasons.length)];
                if (!newState.events) newState.events = [];
                newState.events.push(`${d.driver.name} retired (${d.retirementReason})`);
                return;
            }

            // Incidents
            if (d.status === 'Racing' && Math.random() < (0.0001 * (120 - (d.driver.stats?.consistency || 50)) / 100) * deltaTime) {
                const rand = Math.random();
                if (rand < 0.05 && (d.driver.stats?.aggression || 50) > 85) {
                    d.status = 'Retired';
                    d.retirementReason = 'Incident';
                    if (!newState.events) newState.events = [];
                    newState.events.push(`${d.driver.name} crashed out!`);
                    return;
                } else if (rand < 0.3) {
                    d.incidentTimePenalty = (d.incidentTimePenalty || 0) + 8 + Math.random() * 7;
                    if (!newState.events) newState.events = [];
                    newState.events.push(`${d.driver.name} spun!`);
                } else {
                    d.incidentTimePenalty = (d.incidentTimePenalty || 0) + 1 + Math.random() * 2;
                }
            }

            const trackBase = newState.track?.avgLapTimeSeconds || 90;
            const teamPerf = ((team.stats?.aero || 80) * 0.3 + (team.stats?.chassis || 80) * 0.3 + (engine.power || 80) * 0.4);
            const driverSkill = ((d.driver.stats?.pace || 50) * 0.7 + (d.driver.stats?.racecraft || 50) * 0.3);
            const combinedRating = (teamPerf * 0.65 + driverSkill * 0.35);

            let lapTime = trackBase * (1.25 - (combinedRating / 400));
            lapTime *= (d.form || 1.0);

            const compoundMults = { 'Soft': -0.8, 'Medium': 0, 'Hard': 0.8, 'Inter': 2, 'Wet': 4 };
            lapTime += compoundMults[d.tyreType] || 0;

            const degPenalty = (100 - d.tyreCondition) * 0.04;
            const cliffPenalty = d.tyreCondition < 20 ? (20 - d.tyreCondition) * 0.3 : 0;
            lapTime += degPenalty + cliffPenalty;
            lapTime += (d.fuelLoad || 0) * 0.035;

            lapTime *= this.getWeatherModifier(newState.weather, d.tyreType, d.driver.stats?.wetWeatherSkill || 50);
            lapTime *= (1.1 - ((newState.trackGrip || 1.0) - 1.0) * 0.5);

            if (newState.safetyCar) lapTime *= 1.6;
            else if (newState.vsc) lapTime *= 1.4;

            if (d.incidentTimePenalty && d.incidentTimePenalty > 0) {
                const penaltyToApply = Math.min(d.incidentTimePenalty, deltaTime * 2);
                lapTime += penaltyToApply * (lapTime / deltaTime);
                d.incidentTimePenalty -= penaltyToApply;
            }

            const rngFactor = (105 - (d.driver.stats?.consistency || 50)) / 100;
            const actualTickLapTime = lapTime + (Math.random() - 0.5) * rngFactor;

            const progressDelta = deltaTime / actualTickLapTime;
            const oldProgress = d.progress;

            let pDelta = progressDelta;
            if (d.status === 'Pitting') {
                const pitstopBase = 23 + (100 - (team.stats?.pitCrew || 80)) * 0.08;
                const pitstopActual = pitstopBase + (Math.random() - 0.5) * 1.5;
                pDelta = deltaTime / (actualTickLapTime + pitstopActual);
            }

            d.progress += pDelta;

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
                    if (!d.tyreHistory) d.tyreHistory = [];
                    if (!d.tyreHistory.includes(plan.tyre[0])) d.tyreHistory.push(plan.tyre[0]);
                    d.pitStops = (d.pitStops || 0) + 1;
                }
                d.status = 'Racing';
            }
            d.totalProgress = d.lap + d.progress;

            const wear = this.calculateTyreWear(d.driver, newState.track, d.tyreType);
            d.tyreCondition = Math.max(0, d.tyreCondition - (wear * deltaTime));
            
            const fuelCons = (1.5 * (110 - (engine.efficiency || 90)) / 100);
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
