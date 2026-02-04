
import React, { useMemo } from 'react';
import type { InstancedMesh } from 'three';
import InstancedAssets from './InstancedAssets';
import Tree from './Tree';
import Rock from './Rock';
import Plant from './Plant';
import Pond from './Pond';
import { MAP_LIMIT } from '../constants';
import { ForestAsset, PondData, TreeState, RockState, PlantState } from '../types';

interface ForestProps {
  assets: ForestAsset[];
  ponds: PondData[];
  mountains: ForestAsset[];
  treeStates: Record<number, TreeState>;
  rockStates: Record<number, RockState>;
  plantStates: Record<number, PlantState>;
  onTreeInstancedMesh?: (key: string, mesh: InstancedMesh) => void;
}

const Forest: React.FC<ForestProps> = ({
  assets,
  ponds,
  mountains,
  treeStates,
  rockStates,
  plantStates,
  onTreeInstancedMesh
}) => {
  const { instancedTrees, animatedTrees, instancedRocks, animatedRocks, instancedPlants, animatedPlants } = useMemo(() => {
    const instancedTreeAssets: ForestAsset[] = [];
    const animatedTreeAssets: ForestAsset[] = [];
    const instancedRockAssets: ForestAsset[] = [];
    const animatedRockAssets: ForestAsset[] = [];
    const instancedPlantAssets: ForestAsset[] = [];
    const animatedPlantAssets: ForestAsset[] = [];

    assets.forEach((asset) => {
      if (asset.type === 'tree') {
        const state = treeStates[asset.id];
        const needsAnimation = state?.isFalling || state?.isRemoved || (state?.opacity ?? 1) < 1;
        if (needsAnimation) {
          animatedTreeAssets.push(asset);
        } else {
          const [x, , z] = asset.position;
          const seed = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
          const rotation = asset.subType === 'oak' ? asset.rotation + seed : asset.rotation;
          instancedTreeAssets.push({ ...asset, rotation });
        }
      } else if (asset.type === 'rock') {
        const state = rockStates[asset.id];
        const needsAnimation = state?.isRemoved || (state?.shakeTime ?? 0) > 0 || (state?.cracks ?? 0) > 0;
        if (needsAnimation) {
          animatedRockAssets.push(asset);
        } else if (!state?.isRemoved) {
          instancedRockAssets.push(asset);
        }
      } else if (asset.type === 'plant') {
        const state = plantStates[asset.id];
        if (state?.isRemoved) return;
        if (state?.hasFruit) {
          animatedPlantAssets.push(asset);
        } else {
          instancedPlantAssets.push(asset);
        }
      }
    });

    return {
      instancedTrees: instancedTreeAssets,
      animatedTrees: animatedTreeAssets,
      instancedRocks: instancedRockAssets,
      animatedRocks: animatedRockAssets,
      instancedPlants: instancedPlantAssets,
      animatedPlants: animatedPlantAssets
    };
  }, [assets, plantStates, rockStates, treeStates]);

  const pineTrees = instancedTrees.filter((asset) => asset.subType === 'pine');
  const oakTrees = instancedTrees.filter((asset) => asset.subType === 'oak');
  const birchTrees = instancedTrees.filter((asset) => asset.subType === 'birch');

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

      {/* Instanced Forest Assets */}
      {pineTrees.length > 0 && (
        <>
          <InstancedAssets
            assets={pineTrees}
            geometry={<cylinderGeometry args={[0.15, 0.25, 1.5, 8]} />}
            color="#4b3621"
            type="pine-trunk"
            positionOffset={[0, 0.75, 0]}
            enableViewCulling
            maxDistance={MAP_LIMIT + 20}
            fovPadding={15}
            onMeshReady={(mesh) => onTreeInstancedMesh?.('pine-trunk', mesh)}
          />
          <InstancedAssets
            assets={pineTrees}
            geometry={<coneGeometry args={[1.1, 2.2, 8]} />}
            color="#0b3d1c"
            type="pine-foliage"
            positionOffset={[0, 1.8, 0]}
            enableViewCulling
            maxDistance={MAP_LIMIT + 20}
            fovPadding={15}
            onMeshReady={(mesh) => onTreeInstancedMesh?.('pine-foliage', mesh)}
          />
        </>
      )}

      {oakTrees.length > 0 && (
        <>
          <InstancedAssets
            assets={oakTrees}
            geometry={<cylinderGeometry args={[0.25, 0.45, 2, 8]} />}
            color="#3d2b1f"
            type="oak-trunk"
            positionOffset={[0, 1, 0]}
            enableViewCulling
            maxDistance={MAP_LIMIT + 20}
            fovPadding={15}
            onMeshReady={(mesh) => onTreeInstancedMesh?.('oak-trunk', mesh)}
          />
          <InstancedAssets
            assets={oakTrees}
            geometry={<dodecahedronGeometry args={[1.3, 0]} />}
            color="#1b4d3e"
            type="oak-foliage"
            positionOffset={[0, 2.8, 0]}
            enableViewCulling
            maxDistance={MAP_LIMIT + 20}
            fovPadding={15}
            onMeshReady={(mesh) => onTreeInstancedMesh?.('oak-foliage', mesh)}
          />
        </>
      )}

      {birchTrees.length > 0 && (
        <>
          <InstancedAssets
            assets={birchTrees}
            geometry={<cylinderGeometry args={[0.12, 0.18, 5, 8]} />}
            color="#f0f0f0"
            type="birch-trunk"
            positionOffset={[0, 2.5, 0]}
            enableViewCulling
            maxDistance={MAP_LIMIT + 20}
            fovPadding={15}
            onMeshReady={(mesh) => onTreeInstancedMesh?.('birch-trunk', mesh)}
          />
          <InstancedAssets
            assets={birchTrees}
            geometry={<sphereGeometry args={[1.1, 8, 8]} />}
            color="#a8e063"
            type="birch-foliage"
            positionOffset={[0, 5, 0]}
            enableViewCulling
            maxDistance={MAP_LIMIT + 20}
            fovPadding={15}
            onMeshReady={(mesh) => onTreeInstancedMesh?.('birch-foliage', mesh)}
          />
        </>
      )}

      {instancedRocks.length > 0 && (
        <InstancedAssets
          assets={instancedRocks}
          geometry={<dodecahedronGeometry args={[1, 0]} />}
          color="#6b6b6b"
          type="rock"
          enableViewCulling
          maxDistance={MAP_LIMIT + 20}
          fovPadding={15}
        />
      )}

      {instancedPlants.length > 0 && (
        <InstancedAssets
          assets={instancedPlants}
          geometry={<sphereGeometry args={[0.6, 6, 5]} />}
          color="#2d5a27"
          type="plant"
          enableViewCulling
          maxDistance={MAP_LIMIT + 20}
          fovPadding={15}
        />
      )}

      {/* Animated / Stateful Forest Assets */}
      {animatedTrees.map((asset) => {
        const state = treeStates[asset.id];
        if (state?.isRemoved) return null;
        return <Tree key={asset.id} data={asset} state={state} />;
      })}
      {animatedRocks.map((asset) => {
        const state = rockStates[asset.id];
        if (state?.isRemoved && state?.shakeTime <= 0) return null;
        return <Rock key={asset.id} data={asset} state={state} />;
      })}
      {animatedPlants.map((asset) => {
        const state = plantStates[asset.id];
        if (state?.isRemoved) return null;
        return <Plant key={asset.id} data={asset} state={state} />;
      })}

      {/* Border Mountains */}
      {mountains.length > 0 && (
        <InstancedAssets
          assets={mountains}
          geometry={<coneGeometry args={[1, 1, 8, 1, true]} />}
          color="#141f10"
          type="mountain"
          isMountain
          enableViewCulling
          maxDistance={MAP_LIMIT + 40}
          fovPadding={15}
        />
      )}
    </group>
  );
};

export default Forest;
