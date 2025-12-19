
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Volume2, VolumeX, RefreshCw, Coins } from 'lucide-react';
import { SLOT_ITEMS as DEFAULT_SLOT_ITEMS } from '../constants';
import { SlotItem, GameSettings } from '../types';
import WinStrip from './WinStrip';

interface SlotsGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCoins: number;
  onUpdateCoins: (newCoins: number) => void;
  winRate: number;
  gameSettings: GameSettings;
}

const CHIPS = [10000, 1000000, 5000000, 20000000];

const SlotsGameModal: React.FC<SlotsGameModalProps> = ({ isOpen, onClose, userCoins, onUpdateCoins, winRate, gameSettings }) => {
  const [spinning, setSpinning] = useState(false);
  const [bet, setBet] = useState(10000);
  const [winAmount, setWinAmount] = useState(0);

  // Dynamic Slot Items with Admin Multipliers
  const dynamicSlotItems = useMemo(() => {
     return DEFAULT_SLOT_ITEMS.map(item => ({
        ...item,
        multiplier: item.id === 'seven' || item.id === 'diamond' ? gameSettings.slotsSevenX : gameSettings.slotsFruitX
     }));
  }, [gameSettings.slotsSevenX, gameSettings.slotsFruitX]);

  const [reels, setReels] = useState<SlotItem[]>([dynamicSlotItems[0], dynamicSlotItems[0], dynamicSlotItems[0]]);

  const formatValue = (val: number) => {
      if (val >= 1000000) return (val / 1000000) + 'M';
      if (val >= 1000) return (val / 1000) + 'K';
      return val;
  };

  const spin = () => {
    if (userCoins < bet || spinning) return;
    
    setSpinning(true);
    setWinAmount(0);
    onUpdateCoins(userCoins - bet); 

    setTimeout(() => {
        const isWin = Math.random() * 100 < winRate;
        let finalReels: SlotItem[] = [];

        if (isWin) {
            const item = dynamicSlotItems[Math.floor(Math.random() * dynamicSlotItems.length)];
            finalReels = [item, item, item];
            const payout = bet * item.multiplier;
            setWinAmount(payout);
            onUpdateCoins((userCoins - bet) + payout);
        } else {
            const r1 = dynamicSlotItems[Math.floor(Math.random() * dynamicSlotItems.length)];
            const r2 = dynamicSlotItems[Math.floor(Math.random() * dynamicSlotItems.length)];
            let r3 = dynamicSlotItems[Math.floor(Math.random() * dynamicSlotItems.length)];
            
            while(r1.id === r2.id && r2.id === r3.id) {
                 r3 = dynamicSlotItems[Math.floor(Math.random() * dynamicSlotItems.length)];
            }
            finalReels = [r1, r2, r3];
        }

        setReels(finalReels);
        setSpinning(false);
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="relative w-full max-w-[400px] bg-gradient-to-b from-purple-900 to-[#1a0b2e] rounded-[30px] border-[4px] border-pink-500 shadow-[0_0_60px_rgba(236,72,153,0.5)] overflow-hidden flex flex-col p-6"
      >
        <AnimatePresence>
            {winAmount > 0 && <WinStrip amount={winAmount} />}
        </AnimatePresence>

        <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white"><X size={24} /></button>

        <div className="text-center mb-6">
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 drop-shadow-sm">SLOTS MACHINE</h2>
            <p className="text-xs text-pink-200/70">طابق 3 رموز للفوز بآلاف الكوينز!</p>
        </div>

        <div className="bg-black/40 p-4 rounded-2xl border-2 border-pink-500/30 flex justify-between gap-2 mb-6 shadow-inner relative overflow-hidden">
             <div className="absolute top-1/2 left-0 right-0 h-1 bg-red-500/50 z-10 pointer-events-none"></div>
             {[0, 1, 2].map((i) => (
                 <div key={i} className="flex-1 h-32 bg-slate-100 rounded-lg flex items-center justify-center text-5xl overflow-hidden relative">
                     {spinning ? <div className="animate-[spin_0.2s_linear_infinite] blur-sm opacity-50">{reels[i].icon}</div> : <motion.div key={reels[i].id} initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="drop-shadow-md">{reels[i].icon}</motion.div>}
                 </div>
             ))}
        </div>

        <div className="h-12 mb-4 flex items-center justify-center">
            {winAmount > 0 ? <motion.div initial={{ scale: 0 }} animate={{ scale: 1.2 }} className="text-yellow-400 font-black text-2xl flex items-center gap-2 drop-shadow-[0_2px_2px_rgba(0,0,0,1)]"><Trophy className="text-yellow-500" /> فوز ضخم!</motion.div> : <div className="text-slate-500 text-sm">حظاً أوفر في السحبة القادمة</div>}
        </div>

        <div className="space-y-4">
             <div className="flex justify-between items-center bg-black/30 p-3 rounded-xl">
                 <span className="text-slate-300 text-sm font-bold">الرهان:</span>
                 <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                     {CHIPS.map(c => (
                         <button key={c} onClick={() => setBet(c)} disabled={spinning} className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${bet === c ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/40' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>{formatValue(c)}</button>
                     ))}
                 </div>
             </div>
             <div className="flex justify-between items-center px-2">
                 <div className="flex flex-col"><span className="text-[10px] text-slate-400">رصيدك</span><div className="flex items-center gap-1 text-yellow-400 font-bold">{userCoins.toLocaleString()} <Coins size={14} /></div></div>
                 <button onClick={spin} disabled={spinning || userCoins < bet} className={`px-8 py-3 rounded-2xl font-black text-lg flex items-center gap-2 transition-all ${spinning || userCoins < bet ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-b from-green-400 to-green-600 text-white shadow-lg shadow-green-900/50 hover:scale-105 active:scale-95'}`}>{spinning ? <RefreshCw className="animate-spin" /> : 'SPIN'}</button>
             </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SlotsGameModal;
