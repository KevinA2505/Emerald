export type AttackMode = 'slash' | 'throw';
export type FruitType = 'red' | 'blue' | 'yellow';

export interface ThrownKnifeData {
  id: string;
  position: [number, number, number];
  direction: [number, number, number];
  rotation: [number, number, number];
  power: number;
}

export interface Item {
  id: string;
  name: string;
  type: 'weapon' | 'gadget' | 'resource';
  damage?: number;
  count?: number;
  isConsumable?: boolean;
  fruitType?: FruitType;
}

export interface Resources {
  wood: number;
  fiber: number;
  sticks: number;
  stones: number;
  seeds: number;
}

export interface ForestAsset {
  id: number;
  type: 'tree' | 'rock' | 'plant' | 'mountain';
  subType?: 'pine' | 'oak' | 'birch' | 'small' | 'large';
  position: [number, number, number];
  scale: number;
  rotation: number;
  radius: number;
  height: number;
}

export interface TreeState {
  health: number;
  maxHealth: number;
  isFalling: boolean;
  fallProgress: number;
  fallDirection: [number, number];
  opacity: number;
  isRemoved: boolean;
}

export interface RockState {
  health: number;
  maxHealth: number;
  isRemoved: boolean;
  shakeTime: number;
  cracks: number;
}

export interface PlantState {
  hasFruit: boolean;
  fruitType?: FruitType;
  fruitCount: number;
  health: number;
  isRemoved: boolean;
}

export interface PondData {
  id: number;
  position: [number, number, number];
  vertices: [number, number][];
}
