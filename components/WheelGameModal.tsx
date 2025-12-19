
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Trophy, Volume2, VolumeX, History, Coins } from 'lucide-react';
import { WHEEL_ITEMS as DEFAULT_WHEEL_ITEMS } from '../constants';
import { WheelItem, GameSettings } from '../types';
import WinStrip from './WinStrip';

interface WheelGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCoins: number;
  onUpdateCoins: (newCoins: number) => void;
  winRate: number;
  gameSettings: GameSettings;
}

const CHIPS = [10000, 1000000, 5000000, 20000000];

enum GameStatus {
  BETTING = 'betting', 
  SPINNING = 'spinning',
  RESULT = 'result',
}

const WheelGameModal: React.FC<WheelGameModalProps> = ({ isOpen, onClose, userCoins, onUpdateCoins, winRate, gameSettings }) => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.BETTING);
  const [timeLeft, setTimeLeft] = useState(15);
  const [selectedChip, setSelectedChip] = useState(10000);
  const [bets, setBets] = useState<Record<string, number>>({});
  const [rotation, setRotation] = useState(0);
  const [history, setHistory] = useState<WheelItem[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [winner, setWinner] = useState<WheelItem | null>(null);
  const [totalWinAmount, setTotalWinAmount] = useState(0);

  // Dynamic Wheel Items with Admin-configured Multipliers
  const dynamicWheelItems = useMemo(() => {
     return DEFAULT_WHEEL_ITEMS.map(item => ({
        ...item,
        multiplier: item.id === '777' ? gameSettings.wheelJackpotX : gameSettings.wheelNormalX
     }));
  }, [gameSettings.wheelJackpotX, gameSettings.wheelNormalX]);

  useEffect(() => {
     if (history.length === 0) {
         setHistory(Array(8).fill(null).map(() => dynamicWheelItems[Math.floor(Math.random() * dynamicWheelItems.length)]));
     }
  }, [dynamicWheelItems]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (status === GameStatus.BETTING) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setStatus(GameStatus.SPINNING);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } 
    else if (status === GameStatus.SPINNING) {
      spinWheel();
      const spinTimeout = setTimeout(() => {
         setStatus(GameStatus.RESULT);
      }, 7000);
      return () => clearTimeout(spinTimeout);
    }
    else if (status === GameStatus.RESULT) {
       const resetTimeout = setTimeout(() => {
          setWinner(null);
          setTotalWinAmount(0);
          setBets({});
          setTimeLeft(15);
          setStatus(GameStatus.BETTING);
       }, 5000); 
       return () => clearTimeout(resetTimeout);
    }
    return () => clearInterval(interval);
  }, [status]);

  // Added missing placeBet function to resolve name error
  const placeBet = (itemId: string) => {
    if (status !== GameStatus.BETTING) return;
    if (userCoins < selectedChip) return;

    onUpdateCoins(userCoins - selectedChip);
    setBets(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + selectedChip
    }));
  };

  const spinWheel = () => {
    // Decision logic using winRate
    const isWinOutcome = Math.random() * 100 < winRate;
    let randomIndex;

    if (isWinOutcome) {
       // High multiplier indexes are preferred
       randomIndex = dynamicWheelItems.findIndex(i => i.id === '777');
       if (randomIndex === -1) randomIndex = Math.floor(Math.random() * dynamicWheelItems.length);
    } else {
       randomIndex = Math.floor(Math.random() * dynamicWheelItems.length);
    }

    const winningItem = dynamicWheelItems[randomIndex];
    setWinner(winningItem);

    const segmentAngle = 360 / dynamicWheelItems.length;
    const targetRotation = rotation + 1800 + (360 - (randomIndex * segmentAngle));
    
    setRotation(targetRotation);

    setTimeout(() => {
       setHistory(prev => [winningItem, ...prev.slice(0, 7)]);
       
       if (bets[winningItem.id]) {
          const winAmount = bets[winningItem.id] * winningItem.multiplier;
          setTotalWinAmount(winAmount); 
          onUpdateCoins(userCoins + winAmount + bets[winningItem.id]); 
       } else {
          setTotalWinAmount(0);
       }
    }, 7000);
  };

  const formatChipValue = (val: number) => {
      if (val >= 1000000) return (val / 1000000) + 'M';
      if (val >= 1000) return (val / 1000) + 'K';
      return val;
  };

  if (!isOpen) return null;

  const uniqueBetItems = Array.from(new Set(dynamicWheelItems.map(i => i.id)))
    .map(id => dynamicWheelItems.find(i => i.id === id)!);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="relative w-full max-w-[400px] bg-[#1a0b2e] rounded-[30px] border-[3px] border-amber-500 shadow-[0_0_60px_rgba(124,58,237,0.5)] overflow-hidden flex flex-col"
        style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")' }}
      >
         {status === GameStatus.RESULT && totalWinAmount > 0 && (
            <WinStrip amount={totalWinAmount} />
         )}

         <div className="flex justify-between items-center p-3 bg-black/30 border-b border-white/5">
            <div className="flex gap-1 overflow-hidden h-8 items-center bg-black/40 rounded-full px-2 border border-white/10">
               <History size={14} className="text-slate-400 mr-1" />
               {history.map((item, i) => (
                  <div key={i} className="w-6 h-6 rounded-full flex items-center justify-center text-xs border border-white/10 shadow-sm" style={{ backgroundColor: item.color }}>
                     {item.icon}
                  </div>
               ))}
            </div>
            <div className="flex gap-2">
               <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2 bg-white/10 rounded-full text-white">
                  {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
               </button>
               <button onClick={onClose} className="p-2 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/40">
                  <X size={16} />
               </button>
            </div>
         </div>

         <div className="flex justify-center mt-2 relative z-20">
            <div className="bg-gradient-to-r from-transparent via-black/60 to-transparent w-full text-center py-1">
               {status === GameStatus.BETTING ? (
                  <div className="text-yellow-400 font-black text-xl tracking-widest animate-pulse">
                     ضع رهانك {timeLeft}s
                  </div>
               ) : status === GameStatus.SPINNING ? (
                  <div className="text-green-400 font-black text-xl tracking-widest">
                     جاري الدوران...
                  </div>
               ) : (
                  <div className="text-white font-black text-xl tracking-widest flex items-center justify-center gap-2">
                     <Trophy className="text-yellow-500" /> {winner?.label} فاز!
                  </div>
               )}
            </div>
         </div>

         <div className="relative w-72 h-72 mx-auto mt-2 mb-6">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-30 w-8 h-10 filter drop-shadow-lg">
               <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[20px] border-t-yellow-400"></div>
            </div>
            <div className="absolute inset-[-10px] rounded-full border-[8px] border-amber-600 shadow-2xl bg-[#2e1065]"></div>
            <motion.div 
               className="w-full h-full rounded-full relative overflow-hidden border-[4px] border-yellow-500 shadow-inner"
               style={{ 
                  background: `conic-gradient(
                    ${dynamicWheelItems.map((item, i) => {
                       const start = (i / dynamicWheelItems.length) * 100;
                       const end = ((i + 1) / dynamicWheelItems.length) * 100;
                       return `${item.color} ${start}% ${end}%`;
                    }).join(', ')}
                  )`
               }}
               animate={{ rotate: rotation }}
               transition={{ duration: 7, ease: [0.25, 1, 0.5, 1] }} 
            >
               {dynamicWheelItems.map((item, i) => {
                  const angle = (360 / dynamicWheelItems.length) * i + (360 / dynamicWheelItems.length) / 2;
                  return (
                     <div key={i} className="absolute w-full h-full flex justify-center pt-4 top-0 left-0" style={{ transform: `rotate(${angle}deg)` }}>
                        <span className="text-2xl transform -rotate-90" style={{ transform: `rotate(${-angle}deg)` }}>{item.icon}</span>
                        <span className="absolute top-12 text-[10px] font-black text-white drop-shadow-md" style={{ transform: `rotate(${-angle}deg)` }}>x{item.multiplier}</span>
                     </div>
                  );
               })}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full border-4 border-yellow-400 shadow-xl flex items-center justify-center z-10">
                  <div className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm"></div>
               </div>
            </motion.div>
         </div>

         <div className="flex-1 bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col justify-end">
             <div className="flex justify-center gap-3 mb-4">
                 {uniqueBetItems.map((item) => (
                    <button key={item.id} onClick={() => placeBet(item.id)} disabled={status !== GameStatus.BETTING} className={`relative flex-1 h-24 rounded-xl border-b-4 transition-all active:scale-95 flex flex-col items-center justify-center gap-1 group overflow-hidden ${status === GameStatus.BETTING ? 'hover:brightness-110 cursor-pointer' : 'opacity-80 cursor-not-allowed'}`} style={{ backgroundColor: `${item.color}30`, borderColor: item.color, boxShadow: `0 4px 0 ${item.color}80` }}>
                       {status === GameStatus.RESULT && winner?.id === item.id && <div className="absolute inset-0 bg-white/20 animate-ping"></div>}
                       <div className="text-3xl filter drop-shadow-lg group-hover:scale-110 transition-transform">{item.icon}</div>
                       <div className="bg-black/40 px-2 rounded text-xs text-white font-bold">x{item.multiplier}</div>
                       {bets[item.id] > 0 && <div className="absolute top-1 right-1 bg-yellow-400 text-black text-[10px] font-bold px-1.5 rounded-full shadow-md animate-bounce">{formatChipValue(bets[item.id])}</div>}
                    </button>
                 ))}
             </div>
             <div className="flex items-center justify-between gap-4">
                 <div className="flex flex-col"><span className="text-[10px] text-slate-400">الرصيد</span><div className="flex items-center gap-1 bg-black/40 px-3 py-1 rounded-full border border-yellow-500/30"><span className="text-yellow-400 font-bold">{userCoins.toLocaleString()}</span><Coins size={12} className="text-yellow-500" /></div></div>
                 <div className="flex gap-2">
                    {CHIPS.map(chip => (
                       <button key={chip} onClick={() => setSelectedChip(chip)} className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-[9px] font-bold shadow-lg transition-transform ${selectedChip === chip ? 'border-yellow-400 scale-110 z-10' : 'border-slate-600 opacity-60 hover:opacity-100 hover:scale-105'}`} style={{ background: selectedChip === chip ? 'conic-gradient(#fbbf24, #d97706, #fbbf24)' : 'linear-gradient(to bottom, #334155, #0f172a)' }}><div className="w-[85%] h-[85%] rounded-full bg-slate-900 flex items-center justify-center border border-white/10 text-white">{formatChipValue(chip)}</div></button>
                    ))}
                 </div>
             </div>
         </div>
      </motion.div>
    </div>
  );
};

export default WheelGameModal;