
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { PondData } from '../App';

interface PondProps {
  data: PondData;
}

const Pond: React.FC<PondProps> = ({ data }) => {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    
    // Three.js does not have a CatmullRomCurve2. 
    // We use CatmullRomCurve3 by treating our 2D coordinates as X and Y, with Z as 0.
    const curvePoints = data.vertices.map(v => new THREE.Vector3(v[0], v[1], 0));
    
    // Create a closed curve. 'centripetal' helps prevent self-intersection in organic shapes.
    const curve = new THREE.CatmullRomCurve3(curvePoints, true, 'centripetal');
    
    // Sample the curve to get a high-resolution smooth path
    const smoothPoints = curve.getPoints(128);
    
    // Construct the Shape from the sampled points
    s.moveTo(smoothPoints[0].x, smoothPoints[0].y);
    for (let i = 1; i < smoothPoints.length; i++) {
      s.lineTo(smoothPoints[i].x, smoothPoints[i].y);
    }
    
    return s;
  }, [data.vertices]);

  return (
    <mesh 
      position={data.position} 
      // We rotate the mesh -90 degrees on X so the XY Shape lies on the XZ floor plane
      rotation={[-Math.PI / 2, 0, 0]} 
      receiveShadow
    >
      <shapeGeometry args={[shape]} />
      <meshStandardMaterial 
        color="#2a82d0" 
        roughness={0.01} 
        metalness={0.9} 
        transparent 
        opacity={0.85}
        envMapIntensity={1.5}
      />
    </mesh>
  );
};

export default Pond;
