
import React from 'react';
import { Item, Resources } from '../types';

interface InventoryProps {
  onClose: () => void;
  inventory: Item[];
  equippedWeapon: Item | null;
  equippedGadget: Item | null;
  onEquip: (item: Item) => void;
  resources: Resources;
}

const Inventory: React.FC<InventoryProps> = ({ onClose, inventory, equippedWeapon, equippedGadget, onEquip, resources }) => {
  const slots = Array(16).fill(null);

  const getFruitColor = (type?: string) => {
    if (type === 'red') return 'text-red-500';
    if (type === 'blue') return 'text-blue-500';
    if (type === 'yellow') return 'text-yellow-400';
    return 'text-emerald-400';
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-50 animate-in fade-in duration-300">
      <div className="bg-zinc-900/90 p-8 rounded-3xl border border-emerald-500/30 shadow-2xl max-w-5xl w-full mx-4 flex flex-col md:flex-row gap-8">
        
        {/* Left Section: Equipment & Materials */}
        <div className="flex flex-col gap-6 w-full md:w-48">
          <div>
            <h2 className="text-emerald-400 text-[10px] font-black tracking-widest uppercase mb-3">Weapon</h2>
            <div className={`w-full aspect-square rounded-xl border flex flex-col items-center justify-center transition-all ${equippedWeapon ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
              <div className={`${equippedWeapon ? 'text-emerald-400' : 'opacity-20'} mb-1`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4l3 3L7 17.5 4 14.5z"/><path d="M16.5 6l2.5 2.5"/></svg>
              </div>
              <span className="text-[8px] font-bold text-emerald-400/60 uppercase text-center px-1">{equippedWeapon ? equippedWeapon.name : 'EMPTY'}</span>
            </div>
          </div>

          <div>
            <h2 className="text-emerald-400 text-[10px] font-black tracking-widest uppercase mb-3">Gadget</h2>
            <div className={`w-full aspect-square rounded-xl border flex flex-col items-center justify-center transition-all ${equippedGadget ? 'bg-zinc-500/20 border-zinc-500/50' : 'bg-zinc-500/5 border-zinc-500/20'}`}>
              <div className={`${equippedGadget ? getFruitColor(equippedGadget.fruitType) : 'opacity-20'} mb-1`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
              </div>
              <span className="text-[8px] font-bold text-white/40 uppercase text-center px-1">
                {equippedGadget ? `${equippedGadget.name} (x${equippedGadget.count})` : 'EMPTY'}
              </span>
            </div>
          </div>

          <div>
            <h2 className="text-emerald-400 text-[10px] font-black tracking-widest uppercase mb-3">Materials</h2>
            <div className="bg-black/40 rounded-xl border border-white/5 p-4 flex flex-col gap-3">
              {[
                { label: 'Wood', val: resources.wood, color: 'bg-orange-800' }, 
                { label: 'Fiber', val: resources.fiber, color: 'bg-emerald-200' }, 
                { label: 'Sticks', val: resources.sticks, color: 'bg-yellow-600' }, 
                { label: 'Stones', val: resources.stones, color: 'bg-zinc-500' },
                { label: 'Seeds', val: resources.seeds, color: 'bg-lime-400' }
              ].map((m) => (
                <div key={m.label} className="flex items-center justify-between"><div className="flex items-center gap-2"><div className={`w-1.5 h-1.5 rounded-full ${m.color}`} /><span className="text-[9px] font-bold text-white/50 uppercase">{m.label}</span></div><span className="text-xs font-black text-white">{m.val}</span></div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Section: Main Inventory Grid */}
        <div className="flex-1">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h1 className="text-white text-2xl font-black tracking-tighter uppercase">Inventory</h1>
              <p className="text-emerald-400/50 text-[10px] uppercase tracking-widest font-bold">Manage items and consumables</p>
            </div>
            <button onClick={onClose} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/50 text-[10px] font-bold uppercase transition-colors border border-white/10">Close [ESC]</button>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {slots.map((_, i) => {
              const item = inventory[i];
              const isEquipped = equippedWeapon?.id === item?.id || equippedGadget?.id === item?.id;

              return (
                <div 
                  key={i} 
                  onClick={() => item && onEquip(item)}
                  className={`aspect-square rounded-xl border transition-all flex flex-col items-center justify-center group relative overflow-hidden ${
                    item 
                      ? isEquipped 
                        ? 'bg-emerald-500/30 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                        : 'bg-black/60 border-white/10 hover:border-emerald-500/60 hover:bg-emerald-500/10 cursor-pointer'
                      : 'bg-black/40 border-white/5 opacity-50'
                  }`}
                >
                  {item ? (
                    <>
                      <div className={`mb-1 scale-125 group-hover:scale-150 transition-transform ${getFruitColor(item.fruitType)}`}>
                        {item.type === 'weapon' ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4l3 3L7 17.5 4 14.5z"/></svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8"/></svg>
                        )}
                      </div>
                      <span className="text-[7px] text-white/70 font-bold uppercase text-center px-1 leading-tight">{item.name}</span>
                      <div className="absolute bottom-1 right-2 text-[9px] font-black text-white/40">x{item.count || 1}</div>
                      {isEquipped && <div className="absolute top-1 right-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /></div>}
                    </>
                  ) : <div className="w-1 h-1 rounded-full bg-white/5" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
