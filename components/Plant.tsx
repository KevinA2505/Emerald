
import React, { useMemo } from 'react';
import { ForestAsset, PlantState } from '../types';

interface PlantProps {
  data: ForestAsset;
  state?: PlantState;
}

const Plant: React.FC<PlantProps> = ({ data, state }) => {
  const { position, scale, rotation, id } = data;

  const fruitColor = state?.fruitType === 'red' ? '#ff3333' 
                  : state?.fruitType === 'blue' ? '#3333ff' 
                  : '#ffff33';

  // Calculamos posiciones de frutos de forma determinista para que no cambien al renderizar
  const fruitPositions = useMemo(() => {
    if (!state?.hasFruit) return [];
    
    const positions: [number, number, number][] = [];
    for (let i = 0; i < state.fruitCount; i++) {
      // Usamos el ID de la planta y el índice del fruto como semilla
      const seed = id * 100 + i;
      const angle = (i / state.fruitCount) * Math.PI * 2 + (Math.sin(seed) * 0.5);
      const r = 0.45 + (Math.cos(seed * 0.5) * 0.1);
      
      const fx = Math.cos(angle) * r;
      const fz = Math.sin(angle) * r;
      // Altura fija basada en la semilla para que no sea aleatoria en cada render
      const fy = 0.2 + (Math.sin(seed * 1.23) * 0.15);
      
      positions.push([fx, fy, fz]);
    }
    return positions;
  }, [id, state?.hasFruit, state?.fruitCount]);

  return (
    <group position={position} scale={scale} rotation-y={rotation}>
      {/* Main Bush Body */}
      <mesh castShadow name={`plant-${id}`}>
        <sphereGeometry args={[0.6, 6, 5]} />
        <meshStandardMaterial color="#2d5a27" roughness={1} />
      </mesh>

      {/* Fruits */}
      {state?.hasFruit && (
        <group>
          {fruitPositions.map((pos, i) => (
            <mesh key={i} position={pos} castShadow>
              <sphereGeometry args={[0.08, 6, 6]} />
              <meshStandardMaterial 
                color={fruitColor} 
                emissive={fruitColor} 
                emissiveIntensity={0.5} 
              />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
};

export default Plant;
