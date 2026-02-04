
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
    if (!geometry.boundingSphere) {
      geometry.computeBoundingSphere();
    }
    const baseBoundingSphere = geometry.boundingSphere ? geometry.boundingSphere.clone() : null;
    const centersBox = baseBoundingSphere ? new THREE.Box3() : null;
    const instanceCenters: THREE.Vector3[] = [];
    const instanceRadii: number[] = [];

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

      if (baseBoundingSphere && centersBox) {
        const instanceCenter = baseBoundingSphere.center.clone().applyMatrix4(tempObject.matrix);
        const instanceRadius = baseBoundingSphere.radius * Math.max(
          tempObject.scale.x,
          tempObject.scale.y,
          tempObject.scale.z
        );
        instanceCenters.push(instanceCenter);
        instanceRadii.push(instanceRadius);
        centersBox.expandByPoint(instanceCenter);
      }
    });

    meshRef.current.instanceMatrix.needsUpdate = true;

    if (baseBoundingSphere && centersBox) {
      if (instanceCenters.length === 0) {
        geometry.boundingSphere = baseBoundingSphere.clone();
        geometry.boundingBox = new THREE.Box3().setFromCenterAndSize(
          baseBoundingSphere.center.clone(),
          new THREE.Vector3(
            baseBoundingSphere.radius * 2,
            baseBoundingSphere.radius * 2,
            baseBoundingSphere.radius * 2
          )
        );
        return;
      }

      const boundingSphere = new THREE.Sphere();
      centersBox.getBoundingSphere(boundingSphere);

      let maxRadius = 0;
      instanceCenters.forEach((center, index) => {
        const distance = center.distanceTo(boundingSphere.center) + instanceRadii[index];
        maxRadius = Math.max(maxRadius, distance);
      });

      boundingSphere.radius = maxRadius;
      geometry.boundingSphere = boundingSphere;

      const boundingBox = new THREE.Box3();
      instanceCenters.forEach((center, index) => {
        const radius = instanceRadii[index];
        boundingBox.expandByPoint(new THREE.Vector3(center.x - radius, center.y - radius, center.z - radius));
        boundingBox.expandByPoint(new THREE.Vector3(center.x + radius, center.y + radius, center.z + radius));
      });
      geometry.boundingBox = boundingBox;
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
