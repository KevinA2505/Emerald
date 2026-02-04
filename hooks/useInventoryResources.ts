import { useCallback, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Item, Resources } from '../types';

interface InventoryResources {
  resources: Resources;
  inventory: Item[];
  setInventory: Dispatch<SetStateAction<Item[]>>;
  addResource: (type: keyof Resources, amount: number) => void;
  addItemToInventory: (item: Item) => void;
}

export const useInventoryResources = (): InventoryResources => {
  const [resources, setResources] = useState<Resources>({
    wood: 0,
    fiber: 0,
    sticks: 0,
    stones: 0,
    seeds: 0
  });

  const [inventory, setInventory] = useState<Item[]>([
    { id: 'knife_01', name: 'Survival Knife', type: 'weapon', damage: 25 },
    { id: 'axe_01', name: 'Iron Axe', type: 'weapon', damage: 45 },
    { id: 'pickaxe_01', name: 'Steel Pickaxe', type: 'weapon', damage: 55 }
  ]);

  const addResource = useCallback((type: keyof Resources, amount: number) => {
    setResources(prev => ({ ...prev, [type]: prev[type] + amount }));
  }, []);

  const addItemToInventory = useCallback((item: Item) => {
    setInventory(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, count: (i.count || 1) + (item.count || 1) } : i);
      }
      if (prev.length < 16) return [...prev, { ...item, count: item.count || 1 }];
      return prev;
    });
  }, []);

  return { resources, inventory, setInventory, addResource, addItemToInventory };
};
