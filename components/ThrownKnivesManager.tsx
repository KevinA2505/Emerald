
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MAP_LIMIT } from '../constants';
import { ThrownKnifeData, ForestAsset } from '../types';

interface ThrownKnivesManagerProps {
  knives: ThrownKnifeData[];
  assets: ForestAsset[];
}

interface ActiveKnife {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  isStuck: boolean;
  stuckRotation?: THREE.Euler;
}

const MAX_SPEED = 45; // Velocidad al 100% de carga
const MIN_SPEED = 8;  // Velocidad mínima (click rápido)

const ThrownKnivesManager: React.FC<ThrownKnivesManagerProps> = ({ knives, assets }) => {
  const [renderKnifeIds, setRenderKnifeIds] = useState<string[]>([]);
  const activeKnivesRef = useRef<ActiveKnife[]>([]);
  const knifeMeshesRef = useRef(new Map<string, THREE.Group>());
  const tempRef = useRef({
    nextPos: new THREE.Vector3(),
    hitPos: new THREE.Vector3(),
    lookAtVel: new THREE.Vector3(),
    tempQuat: new THREE.Quaternion(),
    up: new THREE.Vector3(0, 1, 0)
  });
  const prevKnivesLen = useRef(knives.length);

  useEffect(() => {
    if (knives.length > prevKnivesLen.current) {
      const newKnife = knives[knives.length - 1];
      
      // La dirección base es el vector unitario
      const direction = new THREE.Vector3(...newKnife.direction).normalize();
      
      // La velocidad final depende linealmente del power (carga)
      const speed = MIN_SPEED + (MAX_SPEED - MIN_SPEED) * newKnife.power;
      const velocity = direction.multiplyScalar(speed);

      activeKnivesRef.current.push({
        id: newKnife.id,
        position: new THREE.Vector3(...newKnife.position),
        velocity,
        isStuck: false
      });
      setRenderKnifeIds(prev => (prev.includes(newKnife.id) ? prev : [...prev, newKnife.id]));
    }
    prevKnivesLen.current = knives.length;
  }, [knives]);

  useFrame((_, delta) => {
    const { nextPos, hitPos, lookAtVel, tempQuat, up } = tempRef.current;

    activeKnivesRef.current.forEach(knife => {
      if (!knife.isStuck) {
        // Gravedad aplicada al proyectil
        knife.velocity.y -= 12.5 * delta; // Un poco más de gravedad para que la caída sea notable en tiros cortos

        nextPos.copy(knife.position).addScaledVector(knife.velocity, delta);

        let hit = false;
        hitPos.copy(nextPos);

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
          lookAtVel.copy(knife.velocity).normalize();
          knife.stuckRotation = new THREE.Euler().setFromQuaternion(
            tempQuat.setFromUnitVectors(up, lookAtVel)
          );
          knife.position.copy(hitPos);
          knife.isStuck = true;
          knife.velocity.set(0, 0, 0);
        } else {
          knife.position.copy(nextPos);
        }
      }

      const mesh = knifeMeshesRef.current.get(knife.id);
      if (mesh) {
        mesh.position.copy(knife.position);

        if (knife.isStuck && knife.stuckRotation) {
          mesh.rotation.copy(knife.stuckRotation);
        } else if (knife.velocity.lengthSq() > 0.0001) {
          lookAtVel.copy(knife.velocity).normalize();
          tempQuat.setFromUnitVectors(up, lookAtVel);
          mesh.quaternion.slerp(tempQuat, 0.2);
        }
      }
    });
  });

  const registerKnifeMesh = useCallback((id: string, node: THREE.Group | null) => {
    if (node) {
      knifeMeshesRef.current.set(id, node);
      const knife = activeKnivesRef.current.find(item => item.id === id);
      if (knife) {
        node.position.copy(knife.position);
        if (knife.stuckRotation) {
          node.rotation.copy(knife.stuckRotation);
        }
      }
      return;
    }

    knifeMeshesRef.current.delete(id);
  }, []);

  return (
    <group>
      {renderKnifeIds.map(id => (
        <KnifeModel key={id} id={id} registerMesh={registerKnifeMesh} />
      ))}
    </group>
  );
};

const KnifeModel: React.FC<{ id: string; registerMesh: (id: string, node: THREE.Group | null) => void }> = ({
  id,
  registerMesh
}) => {
  return (
    <group ref={(node) => registerMesh(id, node)} scale={0.4}>
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
