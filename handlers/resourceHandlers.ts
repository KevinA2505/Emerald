import type { Item, PlantState, Resources, RockState, TreeState } from '../types';

export type ResourceChanges = Partial<Resources>;

const addResourceChange = (changes: ResourceChanges, type: keyof Resources, amount: number) => {
  changes[type] = (changes[type] || 0) + amount;
};

export const resolveTreeHit = ({
  treeState,
  weapon,
  rng = Math.random
}: {
  treeState?: TreeState;
  weapon?: Item | null;
  rng?: () => number;
}) => {
  const isAxe = weapon?.id === 'axe_01';
  const isKnife = weapon?.id === 'knife_01';
  if (!treeState || treeState.health <= 0 || treeState.isFalling || (!isAxe && !isKnife)) return null;

  const changes: ResourceChanges = {};
  const damage = (weapon?.damage || 20) * (isAxe ? 1 : 0.2);
  const newHealth = treeState.health - damage;

  if (isAxe) {
    if (rng() > 0.4) addResourceChange(changes, 'wood', 1);
    if (rng() > 0.7) addResourceChange(changes, 'sticks', 1);
  } else if (isKnife) {
    addResourceChange(changes, 'fiber', Math.floor(rng() * 3) + 1);
  }

  if (newHealth <= 0) {
    addResourceChange(changes, 'wood', 5);
    addResourceChange(changes, 'sticks', 3);
    return {
      nextState: { ...treeState, health: 0, isFalling: true },
      resourceChanges: changes,
      activateTree: true
    };
  }

  return {
    nextState: { ...treeState, health: newHealth },
    resourceChanges: changes,
    activateTree: false
  };
};

export const resolveRockHit = ({
  rockState,
  weapon,
  rng = Math.random
}: {
  rockState?: RockState;
  weapon?: Item | null;
  rng?: () => number;
}) => {
  if (!rockState || rockState.isRemoved || weapon?.id !== 'pickaxe_01') return null;

  const changes: ResourceChanges = {};
  const newHealth = rockState.health - (weapon?.damage || 20);
  addResourceChange(changes, 'stones', Math.floor(rng() * 3) + 2);

  if (newHealth <= 0) {
    addResourceChange(changes, 'stones', 10);
    return {
      nextState: { ...rockState, health: 0, isRemoved: true, shakeTime: 0.8, cracks: 1 },
      resourceChanges: changes,
      activateRock: true
    };
  }

  return {
    nextState: { ...rockState, health: newHealth, shakeTime: 0.3, cracks: Math.max(0, 1 - newHealth / rockState.maxHealth) },
    resourceChanges: changes,
    activateRock: true
  };
};

export const resolvePlantHit = ({
  plantState,
  weapon,
  rng = Math.random
}: {
  plantState?: PlantState;
  weapon?: Item | null;
  rng?: () => number;
}) => {
  if (!plantState || plantState.isRemoved || weapon?.id !== 'knife_01') return null;

  const changes: ResourceChanges = {};
  addResourceChange(changes, 'fiber', 5);
  const newHealth = plantState.health - 1;

  if (newHealth <= 0) {
    const droppedSeeds = Math.floor(rng() * 3);
    if (droppedSeeds > 0) addResourceChange(changes, 'seeds', droppedSeeds);
    return {
      nextState: { ...plantState, health: 0, isRemoved: true },
      resourceChanges: changes
    };
  }

  return {
    nextState: { ...plantState, health: newHealth },
    resourceChanges: changes
  };
};

export const resolveHarvestPlant = ({
  plantState
}: {
  plantState?: PlantState;
}) => {
  if (!plantState || !plantState.hasFruit || plantState.isRemoved) return null;

  const fruitId = `fruit_${plantState.fruitType}`;
  const fruitName = `${plantState.fruitType?.charAt(0).toUpperCase()}${plantState.fruitType?.slice(1)} Berry`;

  return {
    nextState: { ...plantState, hasFruit: false, fruitCount: 0 },
    item: {
      id: fruitId,
      name: fruitName,
      type: 'gadget',
      isConsumable: true,
      fruitType: plantState.fruitType,
      count: plantState.fruitCount
    } as Item
  };
};
