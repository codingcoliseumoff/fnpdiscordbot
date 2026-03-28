import enginesData from './engines.json';

export interface EngineSupplier {
  id: string;
  name: string;
  philosophy: string;
  power: number;
  reliability: number;
  efficiency: number;
  upgradeCeiling: number;
  weight: number;
}

export const ENGINES: EngineSupplier[] = [...enginesData];

const genericSuppliers = ['Siemens', 'Panasonic', 'Samsung', 'Intel', 'Nvidia', 'General Motors', 'Polestar', 'NISMO', 'Gazoo Racing', 'Volvo', 'Jaguar', 'Aston Martin', 'McLaren Applied', 'Alpine', 'Bugatti', 'Koenigsegg', 'Pagani', 'Rimac', 'Bosch', 'Dallara', 'Cosworth', 'Tesla', 'SpaceX'];

genericSuppliers.forEach(name => {
  if (!ENGINES.find(e => e.name.toLowerCase().includes(name.toLowerCase()))) {
    ENGINES.push({
      id: name.toLowerCase().replace(' ', '_'),
      name: `${name} Power Unit`,
      philosophy: 'Mixed Utility',
      power: 70 + Math.random() * 25,
      reliability: 70 + Math.random() * 25,
      efficiency: 70 + Math.random() * 25,
      upgradeCeiling: 80 + Math.random() * 20,
      weight: 140 + Math.random() * 20,
    });
  }
});
