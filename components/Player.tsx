
import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Raycaster } from 'three';
import { ForestAsset, PondData, isPointInPolygon, MAP_LIMIT, PlantState } from '../App';

const BASE_WALK_SPEED = 0.11;
const BASE_SPRINT_SPEED = 0.22;
const JUMP_FORCE = 0.18;
const GRAVITY = 0.007;
const PLAYER_RADIUS = 0.4;
const EYE_HEIGHT = 1.7;
const STEP_HEIGHT_LIMIT = 0.6;
const WATER_SPEED_PENALTY = 0.45;
const SUBMERSION_DEPTH = EYE_HEIGHT * 0.15;
const INTERACTION_RANGE = 3.0;

interface PlayerProps {
  obstacles: ForestAsset[];
  ponds: PondData[];
  mountains: ForestAsset[];
  blockInput: boolean;
  plantStates: Record<number, PlantState>;
  onHarvestPlant: (id: number) => void;
  onLookInteractable: (isLooking: boolean) => void;
}

const Player: React.FC<PlayerProps> = ({ 
  obstacles, 
  ponds, 
  mountains, 
  blockInput, 
  plantStates, 
  onHarvestPlant,
  onLookInteractable
}) => {
  const { camera, scene } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const velocityY = useRef(0);
  const isGrounded = useRef(true);
  const currentGroundHeight = useRef(0);
  const isInWater = useRef(false);
  const raycaster = useRef(new Raycaster());
  const [lookingAtPlantId, setLookingAtPlantId] = useState<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { 
      keys.current[e.code] = true; 
      // Manejar 'E' solo al presionar (keydown)
      if (e.code === 'KeyE' && !blockInput && document.pointerLockElement) {
        checkInteraction(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [blockInput, plantStates]);

  const checkInteraction = (performAction: boolean) => {
    raycaster.current.setFromCamera({ x: 0, y: 0 }, camera);
    const intersects = raycaster.current.intersectObjects(scene.children, true);
    
    // Filtrar objetos dentro de rango que sean arbustos con frutos
    const hit = intersects.find(i => {
      if (i.distance > INTERACTION_RANGE) return false;
      return i.object.name.startsWith('plant-');
    });

    if (hit) {
      const idMatch = hit.object.name.match(/\d+/);
      if (idMatch) {
        const plantId = parseInt(idMatch[0]);
        const state = plantStates[plantId];
        if (state && state.hasFruit) {
          if (performAction) onHarvestPlant(plantId);
          setLookingAtPlantId(plantId);
          onLookInteractable(true);
          return;
        }
      }
    }
    
    setLookingAtPlantId(null);
    onLookInteractable(false);
  };

  const checkWaterAt = (x: number, z: number): boolean => {
    for (const pond of ponds) {
      const lx = x - pond.position[0];
      const lz = z - pond.position[2];
      if (isPointInPolygon(lx, lz, pond.vertices)) return true;
    }
    return false;
  };

  const getGroundAt = (x: number, z: number): { height: number, speedMod: number, inWater: boolean } => {
    let maxHeight = 0;
    let speedMod = 1.0;
    const inWater = checkWaterAt(x, z);
    if (inWater) speedMod *= WATER_SPEED_PENALTY;

    for (const obs of obstacles) {
      const dx = x - obs.position[0];
      const dz = z - obs.position[2];
      const dist = Math.sqrt(dx * dx + dz * dz);
      const standRadius = obs.radius * 1.1; 

      if (dist < standRadius) {
        if (obs.type === 'rock') {
          const ratio = Math.max(0, 1 - Math.pow(dist / standRadius, 4));
          maxHeight = Math.max(maxHeight, obs.height * ratio);
        } else if (obs.type === 'plant') {
          speedMod *= 0.85;
        }
      }
    }
    return { height: maxHeight, speedMod, inWater };
  };

  useFrame(() => {
    // Raycasting por frame para feedback visual (retícula)
    if (!blockInput && document.pointerLockElement) {
      checkInteraction(false);
    }

    const { height: groundAtCurrent, speedMod, inWater } = getGroundAt(camera.position.x, camera.position.z);
    currentGroundHeight.current = groundAtCurrent;
    isInWater.current = inWater;

    const currentSubmersion = isInWater.current ? SUBMERSION_DEPTH : 0;
    const targetY = currentGroundHeight.current + EYE_HEIGHT - currentSubmersion;
    
    if (camera.position.y > targetY + 0.02) {
      velocityY.current -= GRAVITY;
      isGrounded.current = false;
    } else {
      camera.position.y = Math.max(camera.position.y, targetY);
      if (velocityY.current <= 0) {
        velocityY.current = 0;
        isGrounded.current = true;
      }
    }
    camera.position.y += velocityY.current;

    if (blockInput || !document.pointerLockElement) return;

    if (keys.current['Space'] && isGrounded.current) {
      velocityY.current = isInWater.current ? JUMP_FORCE * 0.8 : JUMP_FORCE;
      isGrounded.current = false;
    }

    const isSprinting = keys.current['ShiftLeft'] || keys.current['ShiftRight'];
    const currentBaseSpeed = isSprinting ? BASE_SPRINT_SPEED : BASE_WALK_SPEED;
    const currentSpeed = currentBaseSpeed * speedMod;
    
    const direction = new Vector3();
    const frontVector = new Vector3();
    const sideVector = new Vector3();

    frontVector.set(0, 0, Number(keys.current['KeyS'] || false) - Number(keys.current['KeyW'] || false));
    sideVector.set(Number(keys.current['KeyA'] || false) - Number(keys.current['KeyD'] || false), 0, 0);

    direction
      .subVectors(frontVector, sideVector)
      .normalize()
      .multiplyScalar(currentSpeed)
      .applyEuler(camera.rotation);

    const nextX = camera.position.x + direction.x;
    const nextZ = camera.position.z + direction.z;

    const checkMovement = (testX: number, testZ: number) => {
      if (Math.abs(testX) > MAP_LIMIT || Math.abs(testZ) > MAP_LIMIT) return false;

      for (const mountain of mountains) {
        const dx = testX - mountain.position[0];
        const dz = testZ - mountain.position[2];
        const combinedRadius = PLAYER_RADIUS + mountain.radius;
        if ((dx * dx + dz * dz) < combinedRadius * combinedRadius) return false;
      }

      const currentFeetY = camera.position.y - EYE_HEIGHT + currentSubmersion;
      const { height: heightAtNext } = getGroundAt(testX, testZ);

      for (const obs of obstacles) {
        if (obs.type === 'tree') {
          const dx = testX - obs.position[0];
          const dz = testZ - obs.position[2];
          const combinedRadius = PLAYER_RADIUS + obs.radius;
          if ((dx * dx + dz * dz) < combinedRadius * combinedRadius) return false;
        }
      }

      if (heightAtNext > currentFeetY + STEP_HEIGHT_LIMIT) return false;
      return true;
    };

    if (checkMovement(nextX, camera.position.z)) camera.position.x = nextX;
    if (checkMovement(camera.position.x, nextZ)) camera.position.z = nextZ;
  });

  return null;
};

export default Player;
