const { RaceEngine } = require('./engine/RaceEngine');
const fs = require('fs');
const path = require('path');

async function testRace() {
    console.log("🚀 Starting Meticulous Race Simulation Test...");
    const engine = new RaceEngine();
    
    // Mock Session
    const tracks = JSON.parse(fs.readFileSync(path.join(__dirname, 'src/data/tracks.json'), 'utf8'));
    const track = tracks[0];
    
    let session = {
        sessionType: 'Race',
        weather: 'Dry',
        lap: 0,
        totalLaps: 5,
        track: track,
        competitors: [
            {
                team: { id: 'test_team', name: 'Test Team', stats: { aero: 90, chassis: 90 }, development_path: 'HighSpeed' },
                engine: { power: 95, reliability: 85 },
                drivers: {
                    d1: { driver: { id: 'd1', name: 'Test Driver 1', stats: { pace: 90, consistency: 90 }, trait: 'Legendary' }, progress: 0, lap: 0, tyreType: 'Soft', tyreCondition: 100, fuelLoad: 50, status: 'Racing' },
                    d2: { driver: { id: 'd2', name: 'Test Driver 2', stats: { pace: 80, consistency: 80 }, trait: 'Standard' }, progress: 0, lap: 0, tyreType: 'Medium', tyreCondition: 100, fuelLoad: 50, status: 'Racing' }
                }
            }
        ],
        finishedDriverIds: [],
        events: []
    };

    console.log("🟢 Running 500 ticks...");
    for(let i=0; i<500; i++) {
        session = engine.processTick(session, 10); // 10s per tick
        if (session.events.length > 0) {
            console.log(`Event at lap ${session.lap}: ${session.events.shift()}`);
        }
        if (session.competitors_sorted && session.competitors_sorted.every(d => d.status === 'Finished' || d.status === 'Retired')) {
            console.log("🏁 Race finished early.");
            break;
        }
    }

    console.log("📊 Final Standings:");
    session.competitors_sorted.forEach(d => {
        console.log(`${d.position}. ${d.driver.name} - Status: ${d.status} (${d.retirementReason || 'OK'})`);
    });
    console.log("✅ Test Complete.");
}

testRace();
