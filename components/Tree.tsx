
import React, { useMemo } from 'react';
import { ForestAsset, TreeState } from '../types';
import * as THREE from 'three';

interface TreeProps {
  data: ForestAsset;
  state?: TreeState;
}

const Tree: React.FC<TreeProps> = ({ data, state }) => {
  const { position, scale, rotation, subType, id } = data;

  const seed = useMemo(() => {
    return Math.sin(position[0] * 12.9898 + position[2] * 78.233) * 43758.5453;
  }, [position]);

  // Handle felling rotation
  // We rotate around the base, so we pivot the whole group
  const fellingRotation = useMemo(() => {
    if (!state?.isFalling) return new THREE.Euler(0, 0, 0);
    
    const maxTilt = Math.PI / 2;
    const tilt = state.fallProgress * maxTilt;
    
    // Fall direction vector
    const [dx, dz] = state.fallDirection;
    const angle = Math.atan2(dz, dx);
    
    // Create an Euler based on the tilt towards that direction
    const rot = new THREE.Euler();
    rot.x = Math.sin(angle) * tilt;
    rot.z = -Math.cos(angle) * tilt;
    
    return rot;
  }, [state?.isFalling, state?.fallProgress, state?.fallDirection]);

  const opacity = state?.opacity ?? 1;

  const renderFoliage = () => {
    if (subType === 'pine') {
      return (
        <>
          <mesh position={[0, 1.8, 0]} castShadow name={`tree-foliage-${id}`}>
            <coneGeometry args={[1.1, 2.2, 8]} />
            <meshStandardMaterial color="#0b3d1c" transparent opacity={opacity} />
          </mesh>
          <mesh position={[0, 3, 0]} castShadow name={`tree-foliage-${id}`}>
            <coneGeometry args={[0.8, 1.8, 8]} />
            <meshStandardMaterial color="#1e4d2b" transparent opacity={opacity} />
          </mesh>
          <mesh position={[0, 3.9, 0]} castShadow name={`tree-foliage-${id}`}>
            <coneGeometry args={[0.5, 1.2, 8]} />
            <meshStandardMaterial color="#2d5a27" transparent opacity={opacity} />
          </mesh>
        </>
      );
    }
    if (subType === 'oak') {
      return (
        <group position={[0, 2.8, 0]}>
          <mesh castShadow name={`tree-foliage-${id}`}>
            <dodecahedronGeometry args={[1.3, 0]} />
            <meshStandardMaterial color="#1b4d3e" roughness={0.8} transparent opacity={opacity} />
          </mesh>
          <mesh position={[0.8, 0.4, 0.5]} castShadow name={`tree-foliage-${id}`}>
            <dodecahedronGeometry args={[0.9, 0]} />
            <meshStandardMaterial color="#143d31" roughness={0.8} transparent opacity={opacity} />
          </mesh>
          <mesh position={[-0.7, 0.6, -0.4]} castShadow name={`tree-foliage-${id}`}>
            <dodecahedronGeometry args={[1.1, 0]} />
            <meshStandardMaterial color="#215a49" roughness={0.8} transparent opacity={opacity} />
          </mesh>
        </group>
      );
    }
    return (
      <group position={[0, 5, 0]}>
        <mesh castShadow name={`tree-foliage-${id}`}>
          <sphereGeometry args={[1.1, 8, 8]} />
          <meshStandardMaterial color="#a8e063" transparent opacity={opacity * 0.9} />
        </mesh>
        <mesh position={[0.5, -0.5, 0.3]} castShadow name={`tree-foliage-${id}`}>
          <sphereGeometry args={[0.8, 8, 8]} />
          <meshStandardMaterial color="#89cc52" transparent opacity={opacity * 0.85} />
        </mesh>
      </group>
    );
  };

  const renderTrunk = () => {
    let trunkArgs: [number, number, number, number] = [0.15, 0.25, 1.5, 8];
    let trunkPos: [number, number, number] = [0, 0.75, 0];
    let trunkColor = "#4b3621";

    if (subType === 'oak') {
      trunkArgs = [0.25, 0.45, 2, 8];
      trunkPos = [0, 1, 0];
      trunkColor = "#3d2b1f";
    } else if (subType === 'birch') {
      trunkArgs = [0.12, 0.18, 5, 8];
      trunkPos = [0, 2.5, 0];
      trunkColor = "#f0f0f0";
    }

    return (
      <mesh position={trunkPos} castShadow name={`tree-trunk-${id}`}>
        <cylinderGeometry args={trunkArgs} />
        <meshStandardMaterial color={trunkColor} transparent opacity={opacity} />
      </mesh>
    );
  };

  return (
    <group 
      position={position} 
      scale={scale} 
      rotation={[fellingRotation.x, rotation + (subType === 'oak' ? seed : 0), fellingRotation.z]}
    >
      {renderTrunk()}
      {renderFoliage()}
    </group>
  );
};

export default Tree;
