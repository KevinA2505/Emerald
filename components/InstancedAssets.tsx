
import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { ForestAsset } from '../App';

interface InstancedProps {
  assets: ForestAsset[];
  geometry: React.ReactNode;
  color: string;
  type: string;
  isMountain?: boolean;
}

const InstancedAssets: React.FC<InstancedProps> = ({ assets, geometry, color, isMountain }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempObject = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!meshRef.current) return;

    assets.forEach((asset, i) => {
      const [x, y, z] = asset.position;
      
      if (isMountain) {
        // Las montañas tienen un ajuste especial de altura para que el cono nazca del suelo
        tempObject.position.set(x, asset.height / 2 - 1, z);
        tempObject.scale.set(asset.scale, asset.height, asset.scale);
      } else {
        tempObject.position.set(x, y, z);
        tempObject.scale.set(asset.scale, asset.scale, asset.scale);
      }
      
      tempObject.rotation.y = asset.rotation;
      tempObject.updateMatrix();
      meshRef.current?.setMatrixAt(i, tempObject.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [assets, isMountain, tempObject]);

  return (
    <instancedMesh ref={meshRef} args={[null as any, null as any, assets.length]} castShadow receiveShadow>
      {geometry}
      <meshStandardMaterial color={color} roughness={isMountain ? 1 : 0.9} />
    </instancedMesh>
  );
};

export default InstancedAssets;
