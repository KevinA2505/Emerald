import { describe, expect, it } from 'vitest';
import { resolveHarvestPlant, resolvePlantHit, resolveRockHit, resolveTreeHit } from './resourceHandlers';
import type { Item, PlantState, RockState, TreeState } from '../types';

const createRng = (values: number[]) => {
  let index = 0;
  return () => {
    const value = values[index] ?? values[values.length - 1] ?? 0;
    index += 1;
    return value;
  };
};

describe('resourceHandlers', () => {
  it('handles tree hits with an axe and triggers falling', () => {
    const treeState: TreeState = {
      health: 40,
      maxHealth: 40,
      isFalling: false,
      fallProgress: 0,
      fallDirection: [0, 0],
      opacity: 1,
      isRemoved: false
    };
    const weapon: Item = { id: 'axe_01', name: 'Iron Axe', type: 'weapon', damage: 50 };
    const result = resolveTreeHit({ treeState, weapon, rng: createRng([0.8, 0.9]) });

    expect(result?.nextState.isFalling).toBe(true);
    expect(result?.resourceChanges.wood).toBe(6);
    expect(result?.resourceChanges.sticks).toBe(4);
    expect(result?.activateTree).toBe(true);
  });

  it('handles tree hits with a knife and adds fiber', () => {
    const treeState: TreeState = {
      health: 120,
      maxHealth: 120,
      isFalling: false,
      fallProgress: 0,
      fallDirection: [0, 0],
      opacity: 1,
      isRemoved: false
    };
    const weapon: Item = { id: 'knife_01', name: 'Survival Knife', type: 'weapon', damage: 25 };
    const result = resolveTreeHit({ treeState, weapon, rng: createRng([0.2]) });

    expect(result?.nextState.health).toBe(115);
    expect(result?.resourceChanges.fiber).toBe(1);
  });

  it('handles rock hits with a pickaxe and removes the rock', () => {
    const rockState: RockState = {
      health: 50,
      maxHealth: 100,
      isRemoved: false,
      shakeTime: 0,
      cracks: 0
    };
    const weapon: Item = { id: 'pickaxe_01', name: 'Steel Pickaxe', type: 'weapon', damage: 55 };
    const result = resolveRockHit({ rockState, weapon, rng: createRng([0.4]) });

    expect(result?.nextState.isRemoved).toBe(true);
    expect(result?.nextState.shakeTime).toBe(0.8);
    expect(result?.resourceChanges.stones).toBe(13);
    expect(result?.activateRock).toBe(true);
  });

  it('handles plant hits with a knife and drops seeds on removal', () => {
    const plantState: PlantState = {
      hasFruit: false,
      fruitCount: 0,
      health: 1,
      isRemoved: false
    };
    const weapon: Item = { id: 'knife_01', name: 'Survival Knife', type: 'weapon', damage: 25 };
    const result = resolvePlantHit({ plantState, weapon, rng: createRng([0.7]) });

    expect(result?.nextState.isRemoved).toBe(true);
    expect(result?.resourceChanges.fiber).toBe(5);
    expect(result?.resourceChanges.seeds).toBe(2);
  });

  it('harvests fruit from plants', () => {
    const plantState: PlantState = {
      hasFruit: true,
      fruitType: 'red',
      fruitCount: 2,
      health: 3,
      isRemoved: false
    };
    const result = resolveHarvestPlant({ plantState });

    expect(result?.nextState.hasFruit).toBe(false);
    expect(result?.item.id).toBe('fruit_red');
    expect(result?.item.count).toBe(2);
  });
});
