import tracksData from './tracks.json';

export interface Track {
  id: string;
  name: string;
  location: string;
  lengthKm: number;
  sectors: number;
  corners: number;
  drsZones: number;
  tyreWearFactor: number; // 0 to 1
  overtakeDifficulty: number; // 0 to 1
  avgLapTimeSeconds: number;
  layoutCoords?: [number, number][]; // For 2D viewer
}

export const TRACKS: Track[] = [...tracksData];
