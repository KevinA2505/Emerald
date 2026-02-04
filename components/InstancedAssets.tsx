
import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { ForestAsset } from '../types';

interface InstancedProps {
  assets: ForestAsset[];
  geometry: React.ReactNode;
  color: string;
  type: string;
  isMountain?: boolean;
  positionOffset?: [number, number, number];
}

const InstancedAssets: React.FC<InstancedProps> = ({ assets, geometry, color, isMountain, positionOffset }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempObject = useMemo(() => new THREE.Object3D(), []);
  const [offsetX, offsetY, offsetZ] = positionOffset ?? [0, 0, 0];

  useEffect(() => {
    if (!meshRef.current) return;

    const geometry = meshRef.current.geometry;
    if (!geometry.boundingBox) {
      geometry.computeBoundingBox();
    }
    const baseBoundingBox = geometry.boundingBox ? geometry.boundingBox.clone() : null;
    const overallBoundingBox = baseBoundingBox ? new THREE.Box3() : null;
    const instanceBoundingBox = baseBoundingBox ? new THREE.Box3() : null;

    assets.forEach((asset, i) => {
      const [x, y, z] = asset.position;
      
      if (isMountain) {
        // Las montañas tienen un ajuste especial de altura para que el cono nazca del suelo
        tempObject.position.set(
          x + offsetX * asset.scale,
          asset.height / 2 - 1 + offsetY * asset.scale,
          z + offsetZ * asset.scale
        );
        tempObject.scale.set(asset.scale, asset.height, asset.scale);
      } else {
        tempObject.position.set(
          x + offsetX * asset.scale,
          y + offsetY * asset.scale,
          z + offsetZ * asset.scale
        );
        tempObject.scale.set(asset.scale, asset.scale, asset.scale);
      }
      
      tempObject.rotation.y = asset.rotation;
      tempObject.updateMatrix();
      meshRef.current?.setMatrixAt(i, tempObject.matrix);

      if (baseBoundingBox && overallBoundingBox && instanceBoundingBox) {
        instanceBoundingBox.copy(baseBoundingBox).applyMatrix4(tempObject.matrix);
        overallBoundingBox.union(instanceBoundingBox);
      }
    });

    meshRef.current.instanceMatrix.needsUpdate = true;

    if (overallBoundingBox) {
      geometry.boundingBox = overallBoundingBox;
      geometry.boundingSphere = new THREE.Sphere();
      overallBoundingBox.getBoundingSphere(geometry.boundingSphere);
    }
  }, [assets, isMountain, offsetX, offsetY, offsetZ, tempObject]);

  return (
    <instancedMesh ref={meshRef} args={[null as any, null as any, assets.length]} castShadow receiveShadow>
      {geometry}
      <meshStandardMaterial color={color} roughness={isMountain ? 1 : 0.9} />
    </instancedMesh>
  );
};

export default InstancedAssets;
