import driversData from './drivers.json';
import teamsData from './teams.json';

export interface DriverAttributes {
  pace: number;
  consistency: number;
  racecraft: number;
  aggression: number;
  tyreManagement: number;
  wetWeatherSkill: number;
  qualifyingSkill: number;
  mentality: number;

}

export interface Driver {
  id: string;
  name: string;
  nationality: string;
  secondaryNationality?: string;
  age: number;
  teamId: string | null;
  nationalTeamId?: string | null;
  role: 'Main' | 'Reserve' | 'FreeAgent';
  stats: DriverAttributes;
  potential: number;
  loyalty: number;
  adaptability: number;
}

export const generateDriverStats = (tier: number, baseOverride?: number): DriverAttributes => {
  const baseValue = baseOverride || (Math.max(60, 85 - (tier * 3.5)));
  const variance = () => (Math.random() * 8) - 4;
  const getVal = () => Math.max(5, Math.min(94, baseValue + variance()));

  return {
    pace: getVal(),
    consistency: getVal(),
    racecraft: getVal(),
    aggression: getVal(),
    tyreManagement: getVal(),
    wetWeatherSkill: getVal(),
    qualifyingSkill: getVal(),
    mentality: getVal(),
  };
};

export const DRIVERS: Driver[] = driversData.map((d: any) => {
    const { image, ...rest } = d;
    return {
        ...rest,
        role: d.role as 'Main' | 'Reserve' | 'FreeAgent',
        potential: d.potential || (d.stats?.pace + 10) || 85,
        loyalty: d.loyalty || 50 + Math.random() * 40,
        adaptability: d.adaptability || 40 + Math.random() * 50
    } as Driver;
});

const teamDriverCount: Record<string, number> = {};
DRIVERS.forEach(d => {
    if (d.teamId) {
        teamDriverCount[d.teamId] = (teamDriverCount[d.teamId] || 0) + 1;
    }
});

const firstNames = [
    'James', 'Robert', 'Michael', 'David', 'Sebastian', 'Pierre', 'Antonio', 'Yuki', 'Carlos', 'Logan', 'Nico', 'Kevin', 'Oliver', 'Liam', 'Theo', 'Jack', 'Arthur', 'Enzo', 'Arvid', 'Jehan', 'Guanyu', 'Felipe', 'Nyck', 'Alex', 'Oscar', 'Lando',
    'Max', 'Lewis', 'Charles', 'George', 'Esteban', 'Valtteri', 'Sergio', 'Fernando', 'Lance', 'Alexander', 'Franco', 'Gabriel', 'Isack', 'Paul', 'Marcus', 'Zane', 'Victor', 'Christian', 'Jakob', 'Dennis', 'Ayumu', 'Ritomo', 'Kush', 'Pepe', 'Nikola',
    'Arjun', 'Roman', 'Patricio', 'Colton', 'Kyle', 'Kurt', 'Dale', 'Jeff', 'Jimmie', 'Mario', 'Emerson', 'Nelson', 'Niki', 'Alain', 'Ayrton', 'Graham', 'Jackie', 'Jim', 'Jack', 'Bruce', 'Denny', 'Phil', 'Dan', 'Sterling', 'Innes', 'Jo', 'Gerhard'
];
const lastNames = [
    'Smith', 'Müller', 'Schmidt', 'Lefebvre', 'Rossi', 'Sato', 'Garcia', 'Johnson', 'Silva', 'Wilson', 'Weber', 'Petit', 'Ricci', 'Tanaka', 'Vega', 'Patel', 'Zhou', 'Albon', 'Piastri', 'Bearman', 'Doohan', 'Lindblad', 'Daruvala', 'Schumacher', 'de Vries', 'Latifi', 'Mazepin',
    'Verstappen', 'Hamilton', 'Leclerc', 'Russell', 'Ocon', 'Bottas', 'Perez', 'Alonso', 'Stroll', 'Sainz', 'Colapinto', 'Bortoleto', 'Hadjar', 'Aron', 'Armstrong', 'Maloney', 'Martins', 'Mansell', 'Crawford', 'Hauger', 'Iwasa', 'Miyata', 'Maini', 'Marti', 'Tsolov',
    'Pace', 'Grosjean', 'O\'Ward', 'Herta', 'Larson', 'Busch', 'Earnhardt', 'Gordon', 'Johnson', 'Andretti', 'Fittipaldi', 'Piquet', 'Lauda', 'Prost', 'Senna', 'Hill', 'Stewart', 'Clark', 'Brabham', 'McLaren', 'Hulme', 'Hill', 'Gurney', 'Moss', 'Ireland', 'Siffert', 'Berger'
];
const nationalities = ['GBR', 'GER', 'FRA', 'ITA', 'JPN', 'USA', 'BRA', 'ESP', 'NED', 'AUS', 'CAN', 'MEX', 'FIN', 'SWE', 'DEN', 'IND', 'CHN', 'THA', 'MON', 'BEL', 'AUT', 'CHE', 'NZL', 'ITA', 'BRA', 'ARG', 'BAR', 'RSA', 'JAM', 'NOR', 'EST'];

// Ensure 2 drivers per team for all 100 teams in teams.json
teamsData.forEach(team => {
    const count = teamDriverCount[team.id] || 0;
    for (let i = count; i < 2; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const nat = nationalities[Math.floor(Math.random() * nationalities.length)];
        
        DRIVERS.push({
            id: `gen-${team.id}-${i}`,
            name: `${firstName} ${lastName}`,
            nationality: nat,
            age: 18 + Math.floor(Math.random() * 18),
            teamId: team.id,
            role: 'Main',
            stats: generateDriverStats(team.tier),
            potential: 70 + Math.random() * 25,
            loyalty: 50 + Math.random() * 40,
            adaptability: 40 + Math.random() * 50
        });
    }
});

// Add extra free agents
for (let i = 0; i < 80; i++) {
   const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
   const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
   const nat = nationalities[Math.floor(Math.random() * nationalities.length)];
   
   DRIVERS.push({
      id: `driver-ffa-${i}`,
      name: `${firstName} ${lastName}`,
      nationality: nat,
      age: 18 + Math.floor(Math.random() * 22),
      teamId: null,
      role: 'FreeAgent',
      stats: generateDriverStats(Math.floor(Math.random() * 9) + 2),
      potential: 65 + Math.random() * 30,
      loyalty: 50 + Math.random() * 40,
      adaptability: 40 + Math.random() * 50
   });
}

import nationalTeamsData from './nationalTeams.json';

// Auto-generate DRIVERS_NATIONAL dynamically using the top 2 rated drivers per nation
export const DRIVERS_NATIONAL: Driver[] = [];

nationalTeamsData.forEach((natTeam: any) => {
    const nationDrivers = DRIVERS.filter(d => d.nationality === natTeam.countryCode);
    
    // Sort by a composite stat rating
    nationDrivers.sort((a, b) => {
        const ratingA = (a.stats.pace * 0.4) + (a.stats.consistency * 0.3) + (a.stats.racecraft * 0.3);
        const ratingB = (b.stats.pace * 0.4) + (b.stats.consistency * 0.3) + (b.stats.racecraft * 0.3);
        return ratingB - ratingA; // Descending
    });
    
    // Pick Top 2
    const top2 = nationDrivers.slice(0, 2);
    
    top2.forEach((originalDriver) => {
        const nationalDriver: Driver = JSON.parse(JSON.stringify(originalDriver));
        nationalDriver.id = `${originalDriver.id}-nat`;
        nationalDriver.nationalTeamId = natTeam.id;
        nationalDriver.teamId = natTeam.id; // Override standard team for national mode mechanics
        nationalDriver.role = 'Main';
        DRIVERS_NATIONAL.push(nationalDriver);
    });
});
