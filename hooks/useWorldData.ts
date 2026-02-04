import { useMemo } from 'react';
import { isPointInPolygon } from '../utils/geometry';
import type { ForestAsset, PondData, TreeState, RockState, PlantState, FruitType } from '../types';

interface WorldData {
  assets: ForestAsset[];
  ponds: PondData[];
  mountains: ForestAsset[];
  initialTreeStates: Record<number, TreeState>;
  initialRockStates: Record<number, RockState>;
  initialPlantStates: Record<number, PlantState>;
}

export const useWorldData = (mapLimit: number): WorldData => {
  return useMemo(() => {
    const assets: ForestAsset[] = [];
    const ponds: PondData[] = [];
    const mountains: ForestAsset[] = [];
    const initialTreeStates: Record<number, TreeState> = {};
    const initialRockStates: Record<number, RockState> = {};
    const initialPlantStates: Record<number, PlantState> = {};

    const mountainCount = 64;
    const mRadius = mapLimit + 5;
    for (let i = 0; i < mountainCount; i++) {
      const angle = (i / mountainCount) * Math.PI * 2;
      const x = Math.cos(angle) * mRadius;
      const z = Math.sin(angle) * mRadius;
      mountains.push({
        id: 10000 + i,
        type: 'mountain',
        position: [x, 0, z],
        scale: 18 + Math.random() * 12,
        rotation: Math.random() * Math.PI * 2,
        radius: (18 + Math.random() * 12) * 0.7,
        height: 25 + Math.random() * 15
      });
    }

    const pondCount = 6;
    for (let i = 0; i < pondCount; i++) {
      const px = (Math.random() - 0.5) * 85;
      const pz = (Math.random() - 0.5) * 85;
      const vertices: [number, number][] = [];
      const segmentCount = 12 + Math.floor(Math.random() * 8);
      const baseRadius = 5 + Math.random() * 5;
      for (let s = 0; s < segmentCount; s++) {
        const angle = (s / segmentCount) * Math.PI * 2;
        const radius = baseRadius * (0.6 + Math.random() * 0.8);
        vertices.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
      }
      ponds.push({ id: i, position: [px, 0.06, pz], vertices });
    }

    const assetCount = 550;
    const spread = 135;
    for (let i = 0; i < assetCount; i++) {
      const x = (Math.random() - 0.5) * spread;
      const z = (Math.random() - 0.5) * spread;
      if (Math.abs(x) < 5 && Math.abs(z) < 5) continue;

      let inWater = false;
      for (const pond of ponds) {
        const lx = x - pond.position[0];
        const lz = z - pond.position[2];
        if (isPointInPolygon(lx, lz, pond.vertices)) { inWater = true; break; }
      }
      if (inWater) continue;

      const rand = Math.random();
      const scale = 0.6 + Math.random() * 1.6;
      const rotation = Math.random() * Math.PI * 2;

      if (rand < 0.45) {
        const treeTypeRand = Math.random();
        let subType: 'pine' | 'oak' | 'birch' = 'pine';
        let radius = 0.4 * scale;
        let height = 4 * scale;
        let health = 120;
        if (treeTypeRand < 0.4) subType = 'pine';
        else if (treeTypeRand < 0.75) { subType = 'oak'; radius = 0.6 * scale; height = 3 * scale; health = 220; }
        else { subType = 'birch'; radius = 0.3 * scale; height = 5 * scale; health = 100; }

        assets.push({ id: i, type: 'tree', subType, position: [x, 0, z], scale, rotation, radius, height });
        initialTreeStates[i] = { health, maxHealth: health, isFalling: false, fallProgress: 0, fallDirection: [Math.random() - 0.5, Math.random() - 0.5], opacity: 1, isRemoved: false };
      } else if (rand < 0.7) {
        const hitsNeeded = 6 + Math.floor(Math.random() * 5);
        const health = hitsNeeded * 55;
        assets.push({ id: i, type: 'rock', position: [x, 0, z], scale, rotation, radius: 1 * scale, height: 0.8 * scale });
        initialRockStates[i] = { health, maxHealth: health, isRemoved: false, shakeTime: 0, cracks: 0 };
      } else {
        assets.push({ id: i, type: 'plant', position: [x, 0, z], scale, rotation, radius: 0.5 * scale, height: 0.2 * scale });
        const hasFruit = Math.random() < 0.45;
        const fruitTypes: FruitType[] = ['red', 'blue', 'yellow'];
        initialPlantStates[i] = {
          hasFruit,
          fruitType: hasFruit ? fruitTypes[Math.floor(Math.random() * 3)] : undefined,
          fruitCount: hasFruit ? 1 + Math.floor(Math.random() * 3) : 0,
          health: 3,
          isRemoved: false
        };
      }
    }

    return { assets, ponds, mountains, initialTreeStates, initialRockStates, initialPlantStates };
  }, [mapLimit]);
};
