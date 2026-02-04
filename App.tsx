
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { PointerLockControls, Sky, Stars } from '@react-three/drei';
import Forest from './components/Forest';
import Player from './components/Player';
import UIOverlay from './components/UIOverlay';
import Inventory from './components/Inventory';
import WeaponPOV from './components/WeaponPOV';
import ThrownKnivesManager from './components/ThrownKnivesManager';
import { MAP_LIMIT } from './constants';
import { useWorldData } from './hooks/useWorldData';
import { useInventoryResources } from './hooks/useInventoryResources';
import {
  resolveHarvestPlant,
  resolvePlantHit,
  resolveRockHit,
  resolveTreeHit
} from './handlers/resourceHandlers';
import type {
  AttackMode,
  Item,
  PlantState,
  Resources,
  RockState,
  ThrownKnifeData,
  TreeState
} from './types';

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

  const { resources, inventory, setInventory, addResource, addItemToInventory } = useInventoryResources();
  
  const [treeStates, setTreeStates] = useState<Record<number, TreeState>>({});
  const [rockStates, setRockStates] = useState<Record<number, RockState>>({});
  const [plantStates, setPlantStates] = useState<Record<number, PlantState>>({});
  
  const controlsRef = useRef<any>(null);
  const treeStatesRef = useRef<Record<number, TreeState>>({});
  const rockStatesRef = useRef<Record<number, RockState>>({});
  const activeTreeIdsRef = useRef<Set<number>>(new Set());
  const activeRockIdsRef = useRef<Set<number>>(new Set());

  const worldData = useWorldData(MAP_LIMIT);

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

  const obstacles = useMemo(
    () =>
      worldData.assets.filter(a => {
        if (a.type === 'tree') return !treeStates[a.id]?.isRemoved;
        if (a.type === 'rock') return !rockStates[a.id]?.isRemoved;
        if (a.type === 'plant') return !plantStates[a.id]?.isRemoved;
        return true;
      }),
    [worldData.assets, treeStates, rockStates, plantStates]
  );

  const collidableAssets = useMemo(
    () =>
      worldData.assets.filter(a => {
        if (a.type === 'tree') return !treeStates[a.id]?.isRemoved;
        if (a.type === 'rock') return !rockStates[a.id]?.isRemoved;
        if (a.type === 'plant') return !plantStates[a.id]?.isRemoved;
        return true;
      }),
    [worldData.assets, treeStates, rockStates, plantStates]
  );

  const handleTreeHit = useCallback((treeId: number) => {
    setTreeStates(prev => {
      const current = prev[treeId];
      const result = resolveTreeHit({ treeState: current, weapon: equippedWeapon });
      if (!result) return prev;
      Object.entries(result.resourceChanges).forEach(([type, amount]) => {
        addResource(type as keyof Resources, amount as number);
      });
      if (result.activateTree) activeTreeIdsRef.current.add(treeId);
      return { ...prev, [treeId]: result.nextState };
    });
  }, [equippedWeapon, addResource]);

  const handleRockHit = useCallback((rockId: number) => {
    setRockStates(prev => {
      const current = prev[rockId];
      const result = resolveRockHit({ rockState: current, weapon: equippedWeapon });
      if (!result) return prev;
      Object.entries(result.resourceChanges).forEach(([type, amount]) => {
        addResource(type as keyof Resources, amount as number);
      });
      if (result.activateRock) activeRockIdsRef.current.add(rockId);
      return { ...prev, [rockId]: result.nextState };
    });
  }, [equippedWeapon, addResource]);

  const handlePlantHit = useCallback((plantId: number) => {
    setPlantStates(prev => {
      const current = prev[plantId];
      const result = resolvePlantHit({ plantState: current, weapon: equippedWeapon });
      if (!result) return prev;
      Object.entries(result.resourceChanges).forEach(([type, amount]) => {
        addResource(type as keyof Resources, amount as number);
      });
      return { ...prev, [plantId]: result.nextState };
    });
  }, [equippedWeapon, addResource]);

  const handleHarvestPlant = useCallback((plantId: number) => {
    setPlantStates(prev => {
      const current = prev[plantId];
      const result = resolveHarvestPlant({ plantState: current });
      if (!result) return prev;
      addItemToInventory(result.item);
      return { ...prev, [plantId]: result.nextState };
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
          obstacles={obstacles} 
          ponds={worldData.ponds} 
          mountains={worldData.mountains} 
          blockInput={isInventoryOpen || !hasStarted}
          plantStates={plantStates}
          onHarvestPlant={handleHarvestPlant}
          onLookInteractable={setIsLookingAtInteractable}
        />
        
        <ThrownKnivesManager knives={thrownKnives} assets={collidableAssets} />

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
