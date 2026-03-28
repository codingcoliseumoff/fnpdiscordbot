import teamsData from './teams.json';

export interface TeamStats {
  powerUnit: number;
  aero: number;
  chassis: number;
  durability: number;
  fuelEfficiency: number;
  ersEfficiency: number;
  cornering: number;
  traction: number;
  topSpeed: number;
  drag: number;
  cooling: number;
  strategy: number;
  development: number;
  pitCrew: number;
}

export interface Team {
  id: string;
  name: string;
  category: 'Automotive' | 'Luxury' | 'Tech' | 'Motorsport' | 'Experimental' | 'National';
  stats: TeamStats;
  engineSupplierId: string;
  color: string;
  tier: number; // 1 to 10 for normal, 1 to 5 for national
  isNational?: boolean;
  countryCode?: string;
  insight?: string;
  domain?: string;
}

export const generateStats = (tier: number, isNational: boolean = false, providedStats?: any): TeamStats => {
  if (providedStats) {
    const cp = providedStats.carPerformance || 80;
    return {
      powerUnit: providedStats.powerUnit ?? cp,
      aero: providedStats.aero ?? cp,
      chassis: providedStats.chassis ?? cp,
      durability: providedStats.durability ?? providedStats.development ?? 80,
      fuelEfficiency: providedStats.fuelEfficiency ?? cp,
      ersEfficiency: providedStats.ersEfficiency ?? cp,
      cornering: providedStats.cornering ?? cp,
      traction: providedStats.traction ?? cp,
      topSpeed: providedStats.topSpeed ?? cp,
      drag: providedStats.drag ?? cp,
      cooling: providedStats.cooling ?? cp,
      strategy: providedStats.strategy ?? 80,
      development: providedStats.development ?? 80,
      pitCrew: providedStats.pitCrew ?? 80,
    };
  }

  const baseValue = isNational
    ? 80 - ((tier - 1) * 10)
    : 85 - (Math.log10(tier) * 55);

  const variance = () => (Math.random() * 10) - 5;
  const getVal = () => Math.max(5, Math.min(98, baseValue + variance()));

  return {
    powerUnit: getVal(),
    aero: getVal(),
    chassis: getVal(),
    durability: getVal(),
    fuelEfficiency: getVal(),
    ersEfficiency: getVal(),
    cornering: getVal(),
    traction: getVal(),
    topSpeed: getVal(),
    drag: getVal(),
    cooling: getVal(),
    strategy: getVal(),
    development: getVal(),
    pitCrew: getVal(),
  };
};

const expandedTeams = teamsData.map((m: any) => ({
  id: m.id,
  name: m.name,
  category: m.category as any,
  stats: generateStats(m.tier, false, m.stats),
  engineSupplierId: m.engine,
  color: m.color,
  tier: m.tier,
  isNational: false,
  insight: m.insight,
  domain: m.domain
}));

// Filler for Divisions 5, 6, 8, 10 if missing
for (let t = 1; t <= 10; t++) {
  const tierCount = expandedTeams.filter(team => team.tier === t).length;
  for (let i = tierCount; i < 10; i++) {
    expandedTeams.push({
      id: `filler-t${t}-${i}`,
      name: `Indie Racing T${t} #${i + 1}`,
      category: 'Motorsport',
      stats: generateStats(t),
      engineSupplierId: 'generic',
      color: `hsl(${(t * 40 + i * 20) % 360}, 60%, 50%)`,
      tier: t,
      isNational: false,
      insight: 'A grassroots team aiming for the big leagues.',
      domain: 'google.com'
    });
  }
}

export const TEAMS: Team[] = expandedTeams as Team[];

import nationalTeamsData from './nationalTeams.json';

export const NATIONAL_TEAMS: Team[] = nationalTeamsData.map((m: any) => ({
  id: m.id,
  name: m.name,
  category: 'National',
  stats: generateStats(m.tier, true, m.stats),
  engineSupplierId: 'generic',
  color: m.color,
  tier: m.tier,
  isNational: true,
  countryCode: m.countryCode,
  insight: 'Defending national pride on the global stage.',
  domain: m.domain || 'google.com'
}));
