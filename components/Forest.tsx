
import React from 'react';
import Tree from './Tree';
import Rock from './Rock';
import Plant from './Plant';
import Pond from './Pond';
import { ForestAsset, PondData, TreeState, RockState, PlantState, MAP_LIMIT } from '../App';

interface ForestProps {
  assets: ForestAsset[];
  ponds: PondData[];
  mountains: ForestAsset[];
  treeStates: Record<number, TreeState>;
  rockStates: Record<number, RockState>;
  plantStates: Record<number, PlantState>;
}

const Forest: React.FC<ForestProps> = ({ assets, ponds, mountains, treeStates, rockStates, plantStates }) => {
  return (
    <group>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[MAP_LIMIT + 20, 64]} />
        <meshStandardMaterial color="#1a2e14" roughness={1} />
      </mesh>

      {/* Ponds */}
      {ponds.map((pond) => (
        <Pond key={pond.id} data={pond} />
      ))}

      {/* Forest Assets */}
      {assets.map((asset) => {
        if (asset.type === 'tree') {
          const state = treeStates[asset.id];
          if (state?.isRemoved) return null;
          return <Tree key={asset.id} data={asset} state={state} />;
        }
        if (asset.type === 'rock') {
          const state = rockStates[asset.id];
          if (state?.isRemoved && state?.shakeTime <= 0) return null;
          return <Rock key={asset.id} data={asset} state={state} />;
        }
        if (asset.type === 'plant') {
          const state = plantStates[asset.id];
          if (state?.isRemoved) return null;
          return <Plant key={asset.id} data={asset} state={state} />;
        }
        return null;
      })}

      {/* Border Mountains */}
      {mountains.map((m) => (
        <mesh 
          key={m.id} 
          position={[m.position[0], m.height / 2 - 1, m.position[2]]} 
          rotation-y={m.rotation}
          castShadow 
          receiveShadow
        >
          <coneGeometry args={[m.scale, m.height, 8, 1, true]} />
          <meshStandardMaterial color="#141f10" roughness={1} />
        </mesh>
      ))}
    </group>
  );
};

export default Forest;
