
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Item, AttackMode, ThrownKnifeData, ForestAsset } from '../App';

const CHARGE_SPEED = 2.2; 
const HEAVY_TOOL_CYCLE = 0.55; 
const HIT_STOP_DURATION = 0.04; 
const ACTION_RANGE = 3.5; 
const FUZZY_TOLERANCE = 0.45; 

interface WeaponPOVProps {
  weapon: Item;
  isLocked: boolean;
  mode: AttackMode;
  assets: ForestAsset[];
  onThrow: (knife: ThrownKnifeData) => void;
  onCharge: (progress: number) => void;
  onTreeHit?: (id: number) => void;
  onRockHit?: (id: number) => void;
  onPlantHit?: (id: number) => void;
}

const AxeModel: React.FC<{ isAttacking: boolean }> = ({ isAttacking }) => {
  return (
    <group rotation={[0, 0, 0]}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.03, 1.0, 10]} />
        <meshStandardMaterial color="#3d2b1f" roughness={1} />
      </mesh>
      <group position={[0, 1.0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.06, 0.2, 0.12]} />
          <meshStandardMaterial color="#2d3748" metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[-0.04, 0, 0.06]} rotation={[0, -0.15, 0]} castShadow>
          <boxGeometry args={[0.015, 0.35, 0.1]} />
          <meshStandardMaterial color="#94a3b8" metalness={1} roughness={0.1} emissive={isAttacking ? "#06b6d4" : "#000000"} emissiveIntensity={0.6} />
        </mesh>
      </group>
    </group>
  );
};

const PickaxeModel: React.FC<{ isAttacking: boolean }> = ({ isAttacking }) => {
  return (
    <group rotation={[0, 0, 0]}>
      <mesh position={[0, 0.5, 0]} castShadow><cylinderGeometry args={[0.028, 0.034, 1.1, 12]} /><meshStandardMaterial color="#8b5a2b" roughness={0.9} /></mesh>
      <group position={[0, 1.05, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh castShadow><boxGeometry args={[0.09, 0.16, 0.1]} /><meshStandardMaterial color="#222" metalness={0.9} roughness={0.4} /></mesh>
        <group>
          <group position={[0.04, 0, 0]} rotation={[0, 0, 0.2]}><mesh position={[0.18, 0, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow><cylinderGeometry args={[0.03, 0.045, 0.4, 8]} /><meshStandardMaterial color="#1a1a1a" metalness={1} roughness={0.2} /></mesh><mesh position={[0.42, 0, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow><coneGeometry args={[0.03, 0.12, 8]} /><meshStandardMaterial color="#1a1a1a" metalness={1} roughness={0.1} /></mesh></group>
          <group position={[-0.04, 0, 0]} rotation={[0, 0, -0.2]}><mesh position={[-0.18, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.03, 0.045, 0.4, 8]} /><meshStandardMaterial color="#1a1a1a" metalness={1} roughness={0.2} /></mesh><mesh position={[-0.42, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><coneGeometry args={[0.03, 0.12, 8]} /><meshStandardMaterial color="#1a1a1a" metalness={1} roughness={0.1} /></mesh></group>
        </group>
        {isAttacking && <mesh position={[0, 0, 0.08]}><boxGeometry args={[1.0, 0.05, 0.05]} /><meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={4} transparent opacity={0.4} /></mesh>}
      </group>
    </group>
  );
};

const KnifeModel: React.FC<{ isAttacking: boolean; isCharging: boolean }> = ({ isAttacking, isCharging }) => {
  return (
    <group rotation={[-Math.PI / 2.2, 0.2, 0]}>
      <mesh position={[0, -0.1, 0]}><boxGeometry args={[0.045, 0.26, 0.035]} /><meshStandardMaterial color="#050505" /></mesh>
      <mesh position={[0, 0.04, 0]}><boxGeometry args={[0.08, 0.025, 0.045]} /><meshStandardMaterial color="#1a1a1a" metalness={0.9} /></mesh>
      <mesh position={[0, 0.3, 0]}><boxGeometry args={[0.04, 0.5, 0.012]} /><meshStandardMaterial color="#cbd5e1" metalness={1} roughness={0.1} emissive={(isAttacking || isCharging) ? "#06b6d4" : "#000000"} emissiveIntensity={isAttacking ? 1.0 : isCharging ? 0.3 : 0} /></mesh>
      <mesh position={[0.022, 0.3, 0]} rotation={[0, 0, 0.02]}><boxGeometry args={[0.008, 0.52, 0.014]} /><meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={isAttacking ? 3.0 : 0.5} metalness={1} /></mesh>
    </group>
  );
};

const WeaponPOV: React.FC<WeaponPOVProps> = ({ weapon, isLocked, mode, assets, onThrow, onCharge, onTreeHit, onRockHit, onPlantHit }) => {
  const { camera, scene } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const animGroupRef = useRef<THREE.Group>(null);
  const trailRef = useRef<THREE.Mesh>(null);
  const raycaster = useRef(new THREE.Raycaster());
  
  const [isAttacking, setIsAttacking] = useState(false);
  const [isCharging, setIsCharging] = useState(false);
  const attackTime = useRef(0);
  const hitStopTimer = useRef(0);
  const hasHit = useRef(false);
  const chargeLevel = useRef(0);
  const cameraRecoilOffset = useRef(new THREE.Vector3(0, 0, 0));
  const mouseSway = useRef({ x: 0, y: 0 });
  const lastCameraRot = useRef(new THREE.Euler().copy(camera.rotation));

  const isAxe = weapon.id === 'axe_01';
  const isPickaxe = weapon.id === 'pickaxe_01';
  const isHeavyTool = isAxe || isPickaxe;

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (!isLocked || e.button !== 0) return;
      if (mode === 'slash' && !isAttacking) { setIsAttacking(true); attackTime.current = 0; hasHit.current = false; hitStopTimer.current = 0; }
      else if (mode === 'throw') { setIsCharging(true); chargeLevel.current = 0.05; onCharge(0.05); }
    };
    const handleMouseUp = (e: MouseEvent) => {
      if (mode === 'throw' && isCharging) {
        setIsCharging(false);
        const directionVec = new THREE.Vector3();
        camera.getWorldDirection(directionVec);
        onThrow({ id: 'thrown_' + Date.now(), position: [camera.position.x, camera.position.y, camera.position.z], direction: [directionVec.x, directionVec.y, directionVec.z], rotation: [camera.rotation.x, camera.rotation.y, camera.rotation.z], power: Math.max(0.1, chargeLevel.current) });
        onCharge(0);
      }
    };
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    return () => { window.removeEventListener('mousedown', handleMouseDown); window.removeEventListener('mouseup', handleMouseUp); };
  }, [isLocked, isAttacking, mode, isCharging, onThrow, onCharge, camera]);

  const performHitDetection = () => {
    if (hasHit.current) return;
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    raycaster.current.set(camera.position, dir);
    const intersects = raycaster.current.intersectObjects(scene.children, true);
    let hitObject = intersects.find(i => i.distance < ACTION_RANGE && !i.object.name.includes('weapon'));
    
    let hitAssetId: number | null = null;
    let hitType: 'tree' | 'rock' | 'plant' | null = null;

    if (hitObject) {
      const name = hitObject.object.name;
      if (name.startsWith('tree-')) { const idMatch = name.match(/\d+/); if (idMatch) { hitAssetId = parseInt(idMatch[0]); hitType = 'tree'; } }
      else if (name.startsWith('rock-')) { const idMatch = name.match(/\d+/); if (idMatch) { hitAssetId = parseInt(idMatch[0]); hitType = 'rock'; } }
      else if (name.startsWith('plant-')) { const idMatch = name.match(/\d+/); if (idMatch) { hitAssetId = parseInt(idMatch[0]); hitType = 'plant'; } }
    }

    if (!hitAssetId) {
      let closestDistToRay = Infinity;
      assets.forEach(asset => {
        if (asset.type === 'mountain') return;
        const playerToAsset = new THREE.Vector3(...asset.position).sub(camera.position);
        if (playerToAsset.length() < ACTION_RANGE) {
          const projection = playerToAsset.dot(dir);
          if (projection > 0) {
            const distToRay = playerToAsset.distanceTo(dir.clone().multiplyScalar(projection));
            if (distToRay < (asset.radius + FUZZY_TOLERANCE) && distToRay < closestDistToRay) { closestDistToRay = distToRay; hitAssetId = asset.id; hitType = asset.type as any; }
          }
        }
      });
    }

    if (hitAssetId !== null) {
      hasHit.current = true;
      hitStopTimer.current = HIT_STOP_DURATION;
      cameraRecoilOffset.current.set(0, -0.015, 0.05); 
      if (hitType === 'tree' && onTreeHit) onTreeHit(hitAssetId);
      if (hitType === 'rock' && onRockHit) onRockHit(hitAssetId);
      if (hitType === 'plant' && onPlantHit) onPlantHit(hitAssetId);
      if (hitType === 'rock') attackTime.current = Math.max(attackTime.current, 0.35);
    }
  };

  useFrame((state, delta) => {
    if (!groupRef.current || !animGroupRef.current || !trailRef.current) return;
    if (hitStopTimer.current > 0) { hitStopTimer.current -= delta; return; }
    cameraRecoilOffset.current.lerp(new THREE.Vector3(0, 0, 0), 0.15);
    groupRef.current.position.copy(camera.position).add(cameraRecoilOffset.current);
    groupRef.current.quaternion.copy(camera.quaternion);
    const rotDiffX = camera.rotation.x - lastCameraRot.current.x;
    const rotDiffY = camera.rotation.y - lastCameraRot.current.y;
    mouseSway.current.x = THREE.MathUtils.lerp(mouseSway.current.x, rotDiffY * 0.4, 0.1);
    mouseSway.current.y = THREE.MathUtils.lerp(mouseSway.current.y, rotDiffX * 0.4, 0.1);
    lastCameraRot.current.copy(camera.rotation);
    const time = state.clock.getElapsedTime();
    let localTargetPos = isHeavyTool ? new THREE.Vector3(0.4, -0.85, -0.5) : new THREE.Vector3(0.5, -0.45, -0.6); 
    let localTargetRot = isHeavyTool ? new THREE.Euler(-0.4, -0.2, 0.45) : new THREE.Euler(-0.4, -0.6, 0.1);
    let trailOpacity = 0;
    localTargetPos.x += Math.sin(time * 1.5) * 0.003 + mouseSway.current.x;
    localTargetPos.y += Math.cos(time * 2) * 0.003 - mouseSway.current.y;

    if (mode === 'slash' && isAttacking) {
      if (isHeavyTool) {
        attackTime.current += delta;
        const t = attackTime.current;
        if (t >= HEAVY_TOOL_CYCLE) { setIsAttacking(false); attackTime.current = 0; }
        else {
          if (t < 0.15) { const alpha = t / 0.15; const ease = 1 - Math.pow(1 - alpha, 3); localTargetPos.set(0.4 + ease * 0.05, -0.85 + ease * 0.1, -0.5 + ease * 0.15); localTargetRot.set(-0.4 + ease * 1.2, -0.2 + ease * 0.4, 0.45 + ease * 0.2); }
          else if (t < 0.30) { const alpha = (t - 0.15) / 0.15; const ease = Math.pow(alpha, 2); localTargetPos.set(0.45 - ease * 0.5, -0.75 - ease * 0.1, -0.35 - ease * 0.4); localTargetRot.set(0.8 - ease * 2.5, 0.2 - ease * 0.8, 0.65 - ease * 1.4); trailOpacity = Math.sin(alpha * Math.PI) * 0.6; if (t > 0.23) performHitDetection(); }
          else { const alpha = (t - 0.30) / 0.25; const ease = 1 - Math.pow(1 - alpha, 3); localTargetPos.set(THREE.MathUtils.lerp(hasHit.current ? -0.05 : -0.15, 0.4, ease), -0.85, THREE.MathUtils.lerp(hasHit.current ? -0.55 : -0.75, -0.5, ease)); localTargetRot.set(THREE.MathUtils.lerp(-1.7, -0.4, ease), THREE.MathUtils.lerp(-0.6, -0.2, ease), THREE.MathUtils.lerp(-0.75, 0.45, ease)); }
        }
      } else {
        attackTime.current += delta * 14; 
        if (attackTime.current > Math.PI) { setIsAttacking(false); attackTime.current = 0; }
        else { const t = attackTime.current / Math.PI; const sweepFactor = Math.pow(Math.sin(t * Math.PI), 0.5); localTargetPos.x -= sweepFactor * 1.1; localTargetPos.z -= sweepFactor * 0.25; localTargetRot.y += sweepFactor * 4.5; trailOpacity = Math.pow(Math.sin(t * Math.PI), 3.0); if (t > 0.4 && t < 0.6) performHitDetection(); }
      }
    } else if (mode === 'throw' && isCharging) {
      chargeLevel.current = Math.min(1.0, chargeLevel.current + delta * CHARGE_SPEED);
      onCharge(chargeLevel.current);
      localTargetPos.set(0.3, 0.1, -0.4); localTargetRot.set(1.4, -0.2, 0); localTargetPos.x += (Math.random() - 0.5) * 0.02 * chargeLevel.current;
    }
    const lerpSpeed = (isAttacking || isCharging) ? 0.48 : 0.12;
    animGroupRef.current.position.lerp(localTargetPos, lerpSpeed);
    animGroupRef.current.rotation.x = THREE.MathUtils.lerp(animGroupRef.current.rotation.x, localTargetRot.x, lerpSpeed);
    animGroupRef.current.rotation.y = THREE.MathUtils.lerp(animGroupRef.current.rotation.y, localTargetRot.y, lerpSpeed);
    animGroupRef.current.rotation.z = THREE.MathUtils.lerp(animGroupRef.current.rotation.z, localTargetRot.z, lerpSpeed);
    if (trailRef.current.material) { (trailRef.current.material as any).opacity = trailOpacity; }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={trailRef} position={[0.15, -0.3, -0.5]} rotation={[-Math.PI / 2.8, 0, 0]} geometry={new THREE.RingGeometry(0.5, 0.8, 64, 1, 0, Math.PI)}>
        <meshBasicMaterial color="#06b6d4" transparent opacity={0} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>
      <group ref={animGroupRef}>
        {isAxe ? <AxeModel isAttacking={isAttacking} /> : isPickaxe ? <PickaxeModel isAttacking={isAttacking} /> : <KnifeModel isAttacking={isAttacking} isCharging={isCharging} />}
      </group>
    </group>
  );
};

export default WeaponPOV;
