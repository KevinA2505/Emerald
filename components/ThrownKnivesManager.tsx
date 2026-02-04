
import React, { useState, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ThrownKnifeData, ForestAsset, MAP_LIMIT } from '../App';

interface ThrownKnivesManagerProps {
  knives: ThrownKnifeData[];
  assets: ForestAsset[];
}

interface ActiveKnife extends ThrownKnifeData {
  velocity: THREE.Vector3;
  isStuck: boolean;
  stuckAt?: THREE.Vector3;
  stuckRotation?: THREE.Euler;
}

const MAX_SPEED = 45; // Velocidad al 100% de carga
const MIN_SPEED = 8;  // Velocidad mínima (click rápido)

const ThrownKnivesManager: React.FC<ThrownKnivesManagerProps> = ({ knives, assets }) => {
  const [activeKnives, setActiveKnives] = useState<ActiveKnife[]>([]);
  const prevKnivesLen = useRef(knives.length);

  useEffect(() => {
    if (knives.length > prevKnivesLen.current) {
      const newKnife = knives[knives.length - 1];
      
      // La dirección base es el vector unitario
      const direction = new THREE.Vector3(...newKnife.direction).normalize();
      
      // La velocidad final depende linealmente del power (carga)
      const speed = MIN_SPEED + (MAX_SPEED - MIN_SPEED) * newKnife.power;
      const velocity = direction.multiplyScalar(speed);
      
      setActiveKnives(prev => [...prev, {
        ...newKnife,
        velocity,
        isStuck: false
      }]);
    }
    prevKnivesLen.current = knives.length;
  }, [knives]);

  useFrame((_, delta) => {
    setActiveKnives(prev => prev.map(knife => {
      if (knife.isStuck) return knife;

      const pos = new THREE.Vector3(...knife.position);
      const vel = knife.velocity.clone();
      
      // Gravedad aplicada al proyectil
      vel.y -= 12.5 * delta; // Un poco más de gravedad para que la caída sea notable en tiros cortos
      
      const nextPos = pos.clone().add(vel.clone().multiplyScalar(delta));
      
      let hit = false;
      let hitPos = nextPos.clone();

      if (nextPos.y <= 0) {
        hit = true;
        hitPos.set(nextPos.x, 0.02, nextPos.z);
      }

      if (!hit) {
        for (const asset of assets) {
          const dx = nextPos.x - asset.position[0];
          const dz = nextPos.z - asset.position[2];
          const distSq = dx * dx + dz * dz;
          const hitRadius = asset.radius * 1.1;
          
          if (distSq < hitRadius * hitRadius && nextPos.y < asset.height) {
            hit = true;
            const angle = Math.atan2(dz, dx);
            hitPos.set(
              asset.position[0] + Math.cos(angle) * asset.radius * 0.95,
              nextPos.y,
              asset.position[2] + Math.sin(angle) * asset.radius * 0.95
            );
            break;
          }
        }
      }

      if (Math.abs(nextPos.x) > MAP_LIMIT || Math.abs(nextPos.z) > MAP_LIMIT) {
        hit = true;
        hitPos.copy(nextPos);
      }

      if (hit) {
        const lookAtVel = vel.clone().normalize();
        const stuckRot = new THREE.Euler().setFromQuaternion(
          new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), lookAtVel)
        );

        return {
          ...knife,
          position: [hitPos.x, hitPos.y, hitPos.z],
          isStuck: true,
          stuckRotation: stuckRot,
          velocity: new THREE.Vector3(0, 0, 0)
        };
      }

      return {
        ...knife,
        position: [nextPos.x, nextPos.y, nextPos.z],
        velocity: vel
      };
    }));
  });

  return (
    <group>
      {activeKnives.map(knife => (
        <KnifeModel key={knife.id} knife={knife} />
      ))}
    </group>
  );
};

const KnifeModel: React.FC<{ knife: ActiveKnife }> = ({ knife }) => {
  const meshRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!meshRef.current || knife.isStuck) return;
    
    if (knife.velocity.length() > 0.1) {
      const vel = knife.velocity.clone().normalize();
      const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vel);
      meshRef.current.quaternion.slerp(quat, 0.2);
    }
  });

  return (
    <group 
      ref={meshRef} 
      position={knife.position} 
      rotation={knife.isStuck ? knife.stuckRotation : undefined}
      scale={0.4}
    >
      <group rotation={[0, 0, 0]}>
        <mesh position={[0, -0.1, 0]}><boxGeometry args={[0.045, 0.26, 0.035]} /><meshStandardMaterial color="#050505" /></mesh>
        <mesh position={[0, 0.04, 0]}><boxGeometry args={[0.08, 0.025, 0.045]} /><meshStandardMaterial color="#1a1a1a" metalness={0.9} /></mesh>
        <mesh position={[0, 0.3, 0]}><boxGeometry args={[0.04, 0.5, 0.012]} /><meshStandardMaterial color="#cbd5e1" metalness={1} roughness={0.1} /></mesh>
        <mesh position={[0.022, 0.3, 0]} rotation={[0, 0, 0.02]}><boxGeometry args={[0.008, 0.52, 0.014]} /><meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} metalness={1} /></mesh>
      </group>
    </group>
  );
};

export default ThrownKnivesManager;
