
import React, { useMemo } from 'react';
import { ForestAsset, RockState } from '../App';
import * as THREE from 'three';

interface RockProps {
  data: ForestAsset;
  state?: RockState;
}

const Rock: React.FC<RockProps> = ({ data, state }) => {
  const { position, scale, rotation, id } = data;

  // 1. Vibración sutil al impacto
  const shakeOffset = useMemo(() => {
    if (!state || state.shakeTime <= 0) return [0, 0, 0];
    const intensity = state.isRemoved ? 0.04 : 0.07;
    return [
      (Math.random() - 0.5) * intensity,
      (Math.random() - 0.5) * intensity,
      (Math.random() - 0.5) * intensity
    ];
  }, [state?.shakeTime, state?.isRemoved]);

  const cracks = state?.cracks ?? 0;

  // 2. Opacidad para desvanecido final
  const currentOpacity = useMemo(() => {
    if (!state) return 1;
    if (state.isRemoved) return Math.max(0, state.shakeTime / 0.8);
    return 1;
  }, [state?.isRemoved, state?.shakeTime]);

  // 3. Generación de Geometría de Fractura Adaptada
  // Creamos líneas que NO existen en el modelo original pero que usan sus mismos planos
  const { baseGeo, structuralEdges, internalFractures } = useMemo(() => {
    const geo = new THREE.DodecahedronGeometry(1, 0);
    const posAttr = geo.getAttribute('position');
    const vertices: THREE.Vector3[] = [];
    
    for (let i = 0; i < posAttr.count; i++) {
      vertices.push(new THREE.Vector3().fromBufferAttribute(posAttr, i));
    }

    // Estructurales: Los bordes reales del modelo
    const edgesGeo = new THREE.EdgesGeometry(geo);

    // Internas: Generamos líneas nuevas que cruzan las caras
    // Esto crea el efecto de "quiebre inventado" sin salirse de la superficie
    const internalPoints: THREE.Vector3[] = [];
    // Recorremos los triángulos de la geometría para trazar diagonales "sucias"
    for (let i = 0; i < vertices.length; i += 3) {
      if (vertices[i+2]) {
        // Línea del vértice A al punto medio de BC (Cruza la cara)
        internalPoints.push(vertices[i]);
        const midPoint = new THREE.Vector3().addVectors(vertices[i+1], vertices[i+2]).multiplyScalar(0.5);
        internalPoints.push(midPoint);
        
        // Línea aleatoria interna para romper la silueta visual plana
        if ((i + id) % 2 === 0) {
          internalPoints.push(vertices[i+1]);
          internalPoints.push(vertices[i].clone().multiplyScalar(0.2).add(vertices[i+2].clone().multiplyScalar(0.8)));
        }
      }
    }
    const internalGeo = new THREE.BufferGeometry().setFromPoints(internalPoints);

    return {
      baseGeo: geo,
      structuralEdges: edgesGeo,
      internalFractures: internalGeo
    };
  }, [id]);

  if (state?.isRemoved && state?.shakeTime <= 0) return null;

  return (
    <group 
      position={[position[0] + shakeOffset[0], position[1] + shakeOffset[1], position[2] + shakeOffset[2]]} 
      scale={scale} 
      rotation-y={rotation}
    >
      {/* CUERPO DE LA ROCA */}
      <mesh 
        castShadow 
        receiveShadow
        name={`rock-${id}`}
        geometry={baseGeo}
      >
        <meshStandardMaterial 
          color="#6b6b6b" 
          roughness={1} 
          transparent
          opacity={currentOpacity}
        />
      </mesh>

      {/* GRIETAS ESTRUCTURALES (Bordes naturales) */}
      {cracks > 0.1 && (
        <lineSegments geometry={structuralEdges}>
          <lineBasicMaterial 
            color="#1a1a1a" 
            transparent
            opacity={Math.min(currentOpacity, cracks * 1.2)}
            linewidth={2}
            polygonOffset={true}
            polygonOffsetFactor={-1} // Empuja la línea hacia afuera de la cara
            polygonOffsetUnits={-1}
          />
        </lineSegments>
      )}

      {/* FRACTURAS INTERNAS (Líneas inventadas adaptadas a la superficie) */}
      {cracks > 0.4 && (
        <lineSegments geometry={internalFractures}>
          <lineBasicMaterial 
            color="#000000" 
            transparent
            // Aparecen después de los primeros golpes
            opacity={Math.min(currentOpacity, (cracks - 0.4) * 2)}
            linewidth={1.5}
            polygonOffset={true}
            polygonOffsetFactor={-1.1} // Un poco más que las estructurales para evitar solapamiento
            polygonOffsetUnits={-1.1}
          />
        </lineSegments>
      )}

      {/* HIT FLASH (Efecto de brillo al golpear) */}
      {state && state.shakeTime > 0.18 && !state.isRemoved && (
        <mesh geometry={baseGeo} scale={1.01}>
          <meshBasicMaterial 
            color="#06b6d4" 
            transparent 
            opacity={0.2}
          />
        </mesh>
      )}
    </group>
  );
};

export default Rock;
