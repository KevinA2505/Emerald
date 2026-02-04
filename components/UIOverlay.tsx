
import React from 'react';
import { Item, AttackMode, Resources } from '../types';
import ChargeBar from './ChargeBar';

interface UIProps {
  isLocked: boolean;
  hasStarted: boolean;
  isInventoryOpen: boolean;
  equippedWeapon: Item | null;
  equippedGadget: Item | null;
  attackMode?: AttackMode;
  chargeProgress?: number;
  consumptionProgress?: number;
  isConsuming?: boolean;
  isLookingAtInteractable?: boolean;
  resources: Resources;
  onStart: () => void;
}

const UIOverlay: React.FC<UIProps> = ({ 
  isLocked, 
  hasStarted, 
  isInventoryOpen, 
  equippedWeapon, 
  equippedGadget,
  attackMode, 
  chargeProgress = 0,
  consumptionProgress = 0,
  isConsuming = false,
  isLookingAtInteractable = false,
  resources,
  onStart 
}) => {
  if (!hasStarted) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-40">
        <div className="bg-black/70 backdrop-blur-xl p-8 rounded-2xl border border-white/20 text-white text-center max-w-md pointer-events-auto shadow-2xl">
          <h1 className="text-4xl font-black mb-2 text-emerald-400 tracking-tighter">EMERALD FOREST</h1>
          <p className="mb-8 opacity-70 text-sm">Survival POV Exploration v1.4</p>
          
          <div className="grid grid-cols-2 gap-3 mb-8 text-xs font-bold uppercase tracking-widest">
            <div className="flex flex-col items-center p-3 bg-white/5 rounded-lg border border-white/10">
              <span className="text-emerald-400 mb-1">WASD</span>
              <span className="opacity-50">Move</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-white/5 rounded-lg border border-white/10">
              <span className="text-emerald-400 mb-1">Left Click</span>
              <span className="opacity-50">Attack/Throw</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-white/5 rounded-lg border border-white/10">
              <span className="text-emerald-400 mb-1">E</span>
              <span className="opacity-50">Interact/Pick</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-white/5 rounded-lg border border-white/10">
              <span className="text-emerald-400 mb-1">Q</span>
              <span className="opacity-50">Consume Gadget</span>
            </div>
          </div>
          
          <button 
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 transition-all active:scale-95 rounded-xl font-black shadow-xl shadow-emerald-900/20"
            onClick={onStart}
          >
            START EXPLORATION
          </button>
        </div>
      </div>
    );
  }

  if (isInventoryOpen) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
      {/* Top Left: System Status */}
      <div className="absolute top-8 left-8 text-white/50 text-[10px] font-mono tracking-[0.2em]">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
          <span>SYSTEM_ONLINE</span>
        </div>
        <div className="bg-black/20 p-2 rounded backdrop-blur-sm">
          SIMULATION: ACTIVE<br/>
          MODE: {attackMode?.toUpperCase() || 'NORMAL'}
        </div>
      </div>

      {/* Top Right: Resources Panel */}
      <div className="absolute top-8 right-8 flex flex-col gap-2">
        <div className="bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-xl flex flex-col gap-3 min-w-[140px]">
          <div className="text-[9px] font-black text-emerald-400/60 tracking-widest uppercase mb-1">Gathered_Mats</div>
          <div className="flex items-center justify-between text-xs"><div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-orange-800" /><span className="text-white/70 font-bold uppercase text-[9px]">Wood</span></div><span className="text-white font-black font-mono">{resources.wood}</span></div>
          <div className="flex items-center justify-between text-xs"><div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-200" /><span className="text-white/70 font-bold uppercase text-[9px]">Fiber</span></div><span className="text-white font-black font-mono">{resources.fiber}</span></div>
          <div className="flex items-center justify-between text-xs"><div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-yellow-600" /><span className="text-white/70 font-bold uppercase text-[9px]">Sticks</span></div><span className="text-white font-black font-mono">{resources.sticks}</span></div>
          <div className="flex items-center justify-between text-xs"><div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-zinc-500" /><span className="text-white/70 font-bold uppercase text-[9px]">Stones</span></div><span className="text-white font-black font-mono">{resources.stones}</span></div>
          <div className="flex items-center justify-between text-xs"><div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-lime-400 shadow-[0_0_5px_#a3e635]" /><span className="text-white/70 font-bold uppercase text-[9px]">Seeds</span></div><span className="text-white font-black font-mono">{resources.seeds}</span></div>
        </div>
      </div>

      {/* Slots Info (Bottom Left) */}
      <div className="absolute bottom-8 left-8 flex items-end gap-3">
        {/* Weapon Slot */}
        {equippedWeapon && (
          <div className="bg-emerald-500/10 backdrop-blur-md border border-emerald-500/30 p-4 rounded-xl min-w-[160px]">
            <div className="flex justify-between items-center mb-1">
              <div className="text-[8px] font-black text-emerald-400/60 tracking-widest uppercase">Weapon</div>
              <div className="px-1.5 py-0.5 bg-emerald-500/20 text-[7px] rounded border border-emerald-500/40 text-emerald-400 font-bold uppercase">{attackMode}</div>
            </div>
            <div className="text-lg font-black text-white tracking-tighter uppercase truncate">{equippedWeapon.name}</div>
          </div>
        )}

        {/* Gadget Slot */}
        <div className={`bg-zinc-500/10 backdrop-blur-md border border-zinc-500/30 p-4 rounded-xl min-w-[140px] transition-all ${equippedGadget ? 'opacity-100' : 'opacity-30'}`}>
          <div className="flex justify-between items-center mb-1">
            <div className="text-[8px] font-black text-zinc-400/60 tracking-widest uppercase">Gadget [Q]</div>
            {equippedGadget && (
              <div className="px-1.5 py-0.5 bg-zinc-500/20 text-[7px] rounded border border-zinc-500/40 text-white font-bold uppercase">
                x{equippedGadget.count}
              </div>
            )}
          </div>
          <div className="text-lg font-black text-white tracking-tighter uppercase truncate">
            {equippedGadget ? equippedGadget.name : 'EMPTY'}
          </div>
        </div>
      </div>

      {/* Crosshair & Charge Bars */}
      <div className="relative flex flex-col items-center gap-4">
        {/* Main Crosshair */}
        <div className={`relative w-4 h-4 flex items-center justify-center transition-all ${isLookingAtInteractable ? 'scale-150 opacity-100' : 'opacity-50'}`}>
          <div className={`w-full h-[1.5px] absolute rounded-full ${isLookingAtInteractable ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-white'}`} />
          <div className={`h-full w-[1.5px] absolute rounded-full ${isLookingAtInteractable ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-white'}`} />
          
          {/* Interaction Text */}
          {isLookingAtInteractable && (
            <div className="absolute top-6 whitespace-nowrap text-[10px] font-black text-emerald-400 tracking-widest uppercase animate-bounce">
              [E] INTERACT
            </div>
          )}
        </div>
        
        {/* Attack Charge Bar */}
        <ChargeBar 
          progress={chargeProgress} 
          color={chargeProgress >= 1 ? "#fff" : "#06b6d4"} 
          width="160px"
          height="4px"
          label="Powering Throw"
        />

        {/* Consumption Progress Bar */}
        {isConsuming && (
          <ChargeBar 
            progress={consumptionProgress} 
            color="#ff3333" 
            width="200px"
            height="6px"
            label="Consuming Item"
            className="mt-4"
          />
        )}
      </div>

      {!isLocked && (
        <div className="absolute bottom-24 bg-emerald-500/20 backdrop-blur-md px-8 py-4 rounded-xl border border-emerald-500/40 text-emerald-400 text-[11px] font-black uppercase tracking-[0.2em] animate-pulse pointer-events-auto cursor-pointer shadow-[0_0_30px_rgba(16,185,129,0.1)]" onClick={onStart}>
          CLICK TO RESUME CONTROL
        </div>
      )}
      
      <div className="absolute bottom-8 right-8 text-white/30 text-[9px] uppercase font-bold tracking-[0.3em]">
        POV // {isLocked ? "LOCK_ACTIVE" : "FREE_CURSOR"}
      </div>
    </div>
  );
};

export default UIOverlay;
