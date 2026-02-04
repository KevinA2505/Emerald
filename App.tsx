
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { PointerLockControls, Sky, Stars } from '@react-three/drei';
import Forest from './components/Forest';
import Player from './components/Player';
import UIOverlay from './components/UIOverlay';
import Inventory from './components/Inventory';
import WeaponPOV from './components/WeaponPOV';
import ThrownKnivesManager from './components/ThrownKnivesManager';

export const MAP_LIMIT = 145; 

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

export const isPointInPolygon = (px: number, py: number, polygon: [number, number][]) => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > py) !== (yj > py)) &&
      (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

const App: React.FC = () => {
  const [isLocked, setIsLocked] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [equippedWeapon, setEquippedWeapon] = useState<Item | null>(null);
  const [equippedGadget, setEquippedGadget] = useState<Item | null>(null);
  const [attackMode, setAttackMode] = useState<AttackMode>('slash');
  const [thrownKnives, setThrownKnives] = useState<ThrownKnifeData[]>([]);
  const [chargeProgress, setChargeProgress] = useState(0);
  const [consumptionProgress, setConsumptionProgress] = useState(0);
  const [isConsuming, setIsConsuming] = useState(false);
  const [isLookingAtInteractable, setIsLookingAtInteractable] = useState(false);

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
  
  const [treeStates, setTreeStates] = useState<Record<number, TreeState>>({});
  const [rockStates, setRockStates] = useState<Record<number, RockState>>({});
  const [plantStates, setPlantStates] = useState<Record<number, PlantState>>({});
  
  const controlsRef = useRef<any>(null);
  const treeStatesRef = useRef<Record<number, TreeState>>({});
  const rockStatesRef = useRef<Record<number, RockState>>({});
  const activeTreeIdsRef = useRef<Set<number>>(new Set());
  const activeRockIdsRef = useRef<Set<number>>(new Set());

  const worldData = useMemo(() => {
    const assets: ForestAsset[] = [];
    const ponds: PondData[] = [];
    const mountains: ForestAsset[] = [];
    const initialTreeStates: Record<number, TreeState> = {};
    const initialRockStates: Record<number, RockState> = {};
    const initialPlantStates: Record<number, PlantState> = {};
    
    // Mountains...
    const mountainCount = 64;
    const mRadius = MAP_LIMIT + 5;
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

    // Ponds...
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
  }, []);

  useEffect(() => {
    setTreeStates(worldData.initialTreeStates);
    setRockStates(worldData.initialRockStates);
    setPlantStates(worldData.initialPlantStates);
  }, [worldData.initialTreeStates, worldData.initialRockStates, worldData.initialPlantStates]);

  useEffect(() => {
    treeStatesRef.current = treeStates;
  }, [treeStates]);

  useEffect(() => {
    rockStatesRef.current = rockStates;
  }, [rockStates]);

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

  const handleTreeHit = useCallback((treeId: number) => {
    const isAxe = equippedWeapon?.id === 'axe_01';
    const isKnife = equippedWeapon?.id === 'knife_01';
    if (isAxe || isKnife) {
      setTreeStates(prev => {
        const current = prev[treeId];
        if (!current || current.health <= 0 || current.isFalling) return prev;
        const damage = (equippedWeapon?.damage || 20) * (isAxe ? 1 : 0.2);
        const newHealth = current.health - damage;
        if (isAxe) { addResource('wood', Math.random() > 0.4 ? 1 : 0); addResource('sticks', Math.random() > 0.7 ? 1 : 0); }
        else if (isKnife) { addResource('fiber', Math.floor(Math.random() * 3) + 1); }
        if (newHealth <= 0) { 
          addResource('wood', 5); 
          addResource('sticks', 3); 
          activeTreeIdsRef.current.add(treeId);
          return { ...prev, [treeId]: { ...current, health: 0, isFalling: true } }; 
        }
        return { ...prev, [treeId]: { ...current, health: newHealth } };
      });
    }
  }, [equippedWeapon, addResource]);

  const handleRockHit = useCallback((rockId: number) => {
    if (equippedWeapon?.id === 'pickaxe_01') {
      setRockStates(prev => {
        const current = prev[rockId];
        if (!current || current.isRemoved) return prev;
        const newHealth = current.health - (equippedWeapon?.damage || 20);
        addResource('stones', Math.floor(Math.random() * 3) + 2);
        if (newHealth <= 0) { 
          addResource('stones', 10); 
          activeRockIdsRef.current.add(rockId);
          return { ...prev, [rockId]: { ...current, health: 0, isRemoved: true, shakeTime: 0.8, cracks: 1 } }; 
        }
        activeRockIdsRef.current.add(rockId);
        return { ...prev, [rockId]: { ...current, health: newHealth, shakeTime: 0.3, cracks: Math.max(0, 1 - newHealth / current.maxHealth) } };
      });
    }
  }, [equippedWeapon, addResource]);

  const handlePlantHit = useCallback((plantId: number) => {
    if (equippedWeapon?.id === 'knife_01') {
      setPlantStates(prev => {
        const current = prev[plantId];
        if (!current || current.isRemoved) return prev;
        
        const newHealth = current.health - 1;
        addResource('fiber', 5);

        if (newHealth <= 0) {
          const droppedSeeds = Math.floor(Math.random() * 3);
          if (droppedSeeds > 0) addResource('seeds', droppedSeeds);
          return { ...prev, [plantId]: { ...current, health: 0, isRemoved: true } };
        }

        return { ...prev, [plantId]: { ...current, health: newHealth } };
      });
    }
  }, [equippedWeapon, addResource]);

  const handleHarvestPlant = useCallback((plantId: number) => {
    setPlantStates(prev => {
      const current = prev[plantId];
      if (!current || !current.hasFruit || current.isRemoved) return prev;
      
      const fruitId = `fruit_${current.fruitType}`;
      const fruitName = `${current.fruitType?.charAt(0).toUpperCase()}${current.fruitType?.slice(1)} Berry`;
      
      addItemToInventory({
        id: fruitId,
        name: fruitName,
        type: 'gadget',
        isConsumable: true,
        fruitType: current.fruitType,
        count: current.fruitCount
      });

      return { ...prev, [plantId]: { ...current, hasFruit: false, fruitCount: 0 } };
    });
  }, [addItemToInventory]);

  useEffect(() => {
    if (isConsuming) {
      const timer = setInterval(() => {
        setConsumptionProgress(prev => {
          if (prev >= 1) {
            setIsConsuming(false);
            setInventory(prevInv => {
              const updated = prevInv.map(item => {
                if (equippedGadget && item.id === equippedGadget.id) {
                  const newCount = (item.count || 1) - 1;
                  return newCount > 0 ? { ...item, count: newCount } : null;
                }
                return item;
              }).filter(Boolean) as Item[];
              const matchingInNew = updated.find(i => i.id === equippedGadget?.id);
              setEquippedGadget(matchingInNew || null);
              return updated;
            });
            return 0;
          }
          return prev + 0.015;
        });
      }, 16);
      return () => clearInterval(timer);
    }
  }, [isConsuming, equippedGadget]);

  useEffect(() => {
    let frameId: number;
    let lastTime = 0;
    const tick = (time: number) => {
      const delta = lastTime ? (time - lastTime) / 16 : 1;
      lastTime = time;
      const treeUpdates: Record<number, TreeState> = {};
      const rockUpdates: Record<number, RockState> = {};
      let treeChanged = false;
      let rockChanged = false;

      activeTreeIdsRef.current.forEach(id => {
        const current = treeStatesRef.current[id];
        if (!current || current.isRemoved) {
          activeTreeIdsRef.current.delete(id);
          return;
        }
        if (!current.isFalling) {
          activeTreeIdsRef.current.delete(id);
          return;
        }
        let updated = current;
        if (current.fallProgress < 1) {
          updated = { ...updated, fallProgress: Math.min(1, current.fallProgress + 0.02 * delta) };
        } else if (current.opacity > 0) {
          updated = { ...updated, opacity: Math.max(0, current.opacity - 0.01 * delta) };
        } else {
          if (!current.isRemoved) {
            const droppedSeeds = Math.floor(Math.random() * 3);
            if (droppedSeeds > 0) addResource('seeds', droppedSeeds);
          }
          updated = { ...updated, isRemoved: true };
        }
        if (updated.isRemoved) activeTreeIdsRef.current.delete(id);
        treeUpdates[id] = updated;
        treeChanged = true;
      });

      activeRockIdsRef.current.forEach(id => {
        const current = rockStatesRef.current[id];
        if (!current) {
          activeRockIdsRef.current.delete(id);
          return;
        }
        if (current.shakeTime <= 0) {
          activeRockIdsRef.current.delete(id);
          return;
        }
        const updated = { ...current, shakeTime: Math.max(0, current.shakeTime - 0.02 * delta) };
        if (updated.shakeTime <= 0) activeRockIdsRef.current.delete(id);
        rockUpdates[id] = updated;
        rockChanged = true;
      });

      if (treeChanged) {
        setTreeStates(prev => {
          if (!treeChanged) return prev;
          return { ...prev, ...treeUpdates };
        });
      }
      if (rockChanged) {
        setRockStates(prev => {
          if (!rockChanged) return prev;
          return { ...prev, ...rockUpdates };
        });
      }

      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [addResource]);

  const handleStart = useCallback(() => {
    setHasStarted(true);
    // Añadimos un catch para evitar errores si el usuario cancela el bloqueo
    if (controlsRef.current && !document.pointerLockElement) {
      try { 
        const lockPromise = controlsRef.current.lock();
        if (lockPromise && lockPromise.catch) {
          lockPromise.catch(() => { /* Silenciar error de cancelación de lock */ });
        }
      } catch (e) {
        // Silenciamos errores síncronos también
      }
    }
  }, []);

  const closeInventory = useCallback(() => {
    setIsInventoryOpen(false);
    setTimeout(handleStart, 10);
  }, [handleStart]);

  const openInventory = useCallback(() => { 
    setIsInventoryOpen(true); 
    if (document.pointerLockElement) document.exitPointerLock();
  }, []);

  const equipItem = useCallback((item: Item) => {
    if (item.type === 'weapon') setEquippedWeapon(item);
    else if (item.type === 'gadget') setEquippedGadget(item);
    closeInventory();
  }, [closeInventory]);

  const addThrownKnife = useCallback((knife: ThrownKnifeData) => {
    setThrownKnives(prev => [...prev, knife]);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Tab') { e.preventDefault(); if (!hasStarted) return; if (isInventoryOpen) closeInventory(); else openInventory(); }
      if (e.code === 'KeyH' && !isInventoryOpen && hasStarted) setAttackMode(prev => prev === 'slash' ? 'throw' : 'slash');
      if (e.code === 'Escape' && isInventoryOpen) closeInventory();
      if (e.code === 'KeyQ' && !isInventoryOpen && hasStarted && equippedGadget && !isConsuming) {
        setIsConsuming(true);
        setConsumptionProgress(0.05);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInventoryOpen, hasStarted, openInventory, closeInventory, equippedGadget, isConsuming]);

  return (
    <div className="relative w-full h-full bg-black">
      <Canvas shadows camera={{ fov: 75, position: [0, 1.7, 5] }}>
        <Sky sunPosition={[100, 20, 100]} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={0.5} />
        <fog attach="fog" args={['#1a2e14', 20, MAP_LIMIT + 10]} />
        <ambientLight intensity={0.4} />
        <directionalLight castShadow position={[50, 50, 50]} intensity={1.2} />

        <Forest 
          assets={worldData.assets} 
          ponds={worldData.ponds} 
          mountains={worldData.mountains} 
          treeStates={treeStates}
          rockStates={rockStates}
          plantStates={plantStates}
        />
        
        <Player 
          obstacles={worldData.assets.filter(a => {
            if (a.type === 'tree') return !treeStates[a.id]?.isRemoved;
            if (a.type === 'rock') return !rockStates[a.id]?.isRemoved;
            if (a.type === 'plant') return !plantStates[a.id]?.isRemoved;
            return true;
          })} 
          ponds={worldData.ponds} 
          mountains={worldData.mountains} 
          blockInput={isInventoryOpen || !hasStarted}
          plantStates={plantStates}
          onHarvestPlant={handleHarvestPlant}
          onLookInteractable={setIsLookingAtInteractable}
        />
        
        <ThrownKnivesManager knives={thrownKnives} assets={worldData.assets.filter(a => {
            if (a.type === 'tree') return !treeStates[a.id]?.isRemoved;
            if (a.type === 'rock') return !rockStates[a.id]?.isRemoved;
            if (a.type === 'plant') return !plantStates[a.id]?.isRemoved;
            return true;
          })} />

        {equippedWeapon && (
          <WeaponPOV 
            weapon={equippedWeapon} 
            isLocked={isLocked && !isInventoryOpen} 
            mode={attackMode}
            assets={worldData.assets}
            onThrow={addThrownKnife}
            onCharge={setChargeProgress}
            onTreeHit={handleTreeHit}
            onRockHit={handleRockHit}
            onPlantHit={handlePlantHit}
          />
        )}

        <PointerLockControls 
          ref={controlsRef} 
          onLock={() => { setIsLocked(true); setIsInventoryOpen(false); }} 
          onUnlock={() => { setIsLocked(false); }} 
        />
      </Canvas>

      <UIOverlay 
        isLocked={isLocked} 
        hasStarted={hasStarted} 
        isInventoryOpen={isInventoryOpen} 
        equippedWeapon={equippedWeapon} 
        equippedGadget={equippedGadget}
        attackMode={attackMode} 
        chargeProgress={chargeProgress}
        consumptionProgress={consumptionProgress}
        isConsuming={isConsuming}
        isLookingAtInteractable={isLookingAtInteractable}
        resources={resources}
        onStart={handleStart} 
      />
      
      {isInventoryOpen && (
        <Inventory 
          onClose={closeInventory} 
          inventory={inventory} 
          equippedWeapon={equippedWeapon} 
          equippedGadget={equippedGadget}
          onEquip={equipItem} 
          resources={resources}
        />
      )}
    </div>
  );
};

export default App;
