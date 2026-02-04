
import React from 'react';

interface ChargeBarProps {
  progress: number; // 0 to 1
  color?: string;
  width?: string;
  height?: string;
  label?: string;
  className?: string;
}

const ChargeBar: React.FC<ChargeBarProps> = ({ 
  progress, 
  color = '#06b6d4', 
  width = '120px', 
  height = '6px', 
  label,
  className = "" 
}) => {
  // Aseguramos que el progreso esté entre 0 y 1
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  
  if (clampedProgress <= 0) return null;

  return (
    <div 
      className={`flex flex-col items-center gap-1 animate-in fade-in zoom-in duration-200 ${className}`}
      style={{ width }}
    >
      {label && (
        <span className="text-[8px] font-black text-white/70 uppercase tracking-widest mb-1">
          {label}
        </span>
      )}
      <div 
        className="relative bg-black/40 backdrop-blur-md rounded-full overflow-hidden border border-white/10"
        style={{ width: '100%', height }}
      >
        <div 
          className="h-full transition-all duration-75 ease-out shadow-[0_0_10px_var(--charge-color)]"
          style={{ 
            width: `${clampedProgress * 100}%`, 
            backgroundColor: color,
            // @ts-ignore - custom property for shadow
            '--charge-color': color 
          } as React.CSSProperties}
        />
        
        {/* Efecto de pulso al estar lleno */}
        {clampedProgress >= 1 && (
          <div className="absolute inset-0 bg-white/30 animate-pulse" />
        )}
      </div>
      
      <div className="flex justify-between w-full px-1">
        <span className="text-[6px] text-white/40 font-bold">{Math.round(clampedProgress * 100)}%</span>
        <span className="text-[6px] text-white/40 font-bold">PWR_READY</span>
      </div>
    </div>
  );
};

export default ChargeBar;
