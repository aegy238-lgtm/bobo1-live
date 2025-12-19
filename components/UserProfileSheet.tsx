
import React, { useState, useMemo } from 'react';
import { User, UserLevel } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Heart, UserPlus, UserCheck, Gift, MessageCircle, MoreHorizontal, Shield, Gem, Copy, MicOff, Mic, Sparkles, Truck, Coins, Zap, Flame, Star } from 'lucide-react';

interface UserProfileSheetProps {
  user: User;
  onClose: () => void;
  isCurrentUser: boolean;
  onAction: (action: string, payload?: any) => void;
  currentUser: User;
}

const UserProfileSheet: React.FC<UserProfileSheetProps> = ({ user, onClose, isCurrentUser, onAction, currentUser }) => {
  const [showAgencyCharge, setShowAgencyCharge] = useState(false);
  const [chargeAmount, setChargeAmount] = useState<number>(1000);

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.customId ? user.customId.toString() : user.id); 
    onAction('copyId');
  };

  const calculateLevelInfo = (xp: number) => {
      const xpPerLevel = 2500;
      const level = 1 + Math.floor(xp / xpPerLevel);
      const currentLevelStart = (level - 1) * xpPerLevel;
      const progress = ((xp - currentLevelStart) / xpPerLevel) * 100;
      return { level, progress, nextLevelStart: level * xpPerLevel, current: xp };
  };

  const wealthInfo = calculateLevelInfo(user.wealth || 0);
  const charmInfo = calculateLevelInfo(user.charm || 0);

  // نظام الأنماط المتقدم للـ ID المميز - 15 نمط فريد
  const specialIdDisplay = useMemo(() => {
     if (!user.isSpecialId) return <span className="text-slate-400 font-mono">ID: {user.customId || user.id}</span>;
     
     const id = user.customId || 0;
     const styles = [
        { container: "bg-gradient-to-r from-amber-400 to-yellow-600 text-black px-2 py-0.5 rounded-lg shadow-[0_0_10px_rgba(251,191,36,0.5)] font-black", icon: <Crown size={10} className="inline ml-1" /> },
        { container: "bg-gradient-to-r from-cyan-400 to-blue-600 text-white px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)] font-black italic", icon: <Zap size={10} className="inline ml-1" fill="currentColor" /> },
        { container: "border-2 border-pink-500 text-pink-500 px-2 py-0.5 rounded-md font-black animate-pulse", icon: <Heart size={10} className="inline ml-1" fill="currentColor" /> },
        { container: "bg-slate-900 border border-emerald-400 text-emerald-400 px-2 py-0.5 rounded-tr-xl rounded-bl-xl font-black", icon: <Sparkles size={10} className="inline ml-1" /> },
        { container: "bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-700 text-white px-2 py-0.5 rounded-lg shadow-lg font-black tracking-widest", icon: <Gem size={10} className="inline ml-1" /> },
        { container: "bg-white text-black px-2 py-0.5 rounded-sm font-black transform skew-x-12", icon: null },
        { container: "bg-red-600 text-white px-2 py-0.5 rounded-full border-2 border-white/20 font-black", icon: <Shield size={10} className="inline ml-1" /> },
        { container: "text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-600 font-black drop-shadow-md", icon: <Flame size={12} className="inline ml-1 text-orange-500" /> },
        { container: "bg-amber-100 border-2 border-amber-600 text-amber-800 px-2 py-0.5 rounded-full font-black", icon: null },
        { container: "bg-blue-900/80 backdrop-blur-md text-cyan-300 px-2 py-0.5 rounded-lg border-b-4 border-cyan-500 font-black", icon: null },
        { container: "bg-gradient-to-r from-gray-700 to-gray-900 text-slate-100 px-2 py-0.5 rounded-md border border-white/10 font-black italic", icon: <Star size={10} className="inline ml-1" fill="currentColor" /> },
        { container: "bg-pink-500/20 border border-pink-500 text-pink-300 px-2 py-0.5 rounded-full font-black animate-bounce", icon: null },
        { container: "bg-indigo-600 text-white px-2 py-0.5 rounded-xl border-l-4 border-white font-black", icon: null },
        { container: "bg-gradient-to-t from-slate-800 to-slate-600 text-white px-2 py-0.5 rounded-lg font-black underline decoration-amber-500", icon: null },
        { container: "bg-black border border-white/50 text-white px-2 py-0.5 rounded-full font-black scale-110", icon: <Sparkles size={10} className="inline ml-1 text-yellow-300" /> }
     ];

     const selectedStyle = styles[id % styles.length];
     
     return (
        <span className={`${selectedStyle.container} flex items-center gap-1 transition-all hover:scale-110`}>
           {selectedStyle.icon}
           {id}
        </span>
     );
  }, [user.customId, user.isSpecialId]);

  const handleAgencyTransfer = () => {
     if (!currentUser.agencyBalance || currentUser.agencyBalance < chargeAmount) {
        alert('عذراً، رصيد وكالتك لا يكفي لهذا المبلغ!');
        return;
     }
     if (confirm(`هل أنت متأكد من شحن ${chargeAmount} كوينز لحساب ${user.name}؟`)) {
        onAction('agencyTransfer', { amount: chargeAmount, targetId: user.id });
        setShowAgencyCharge(false);
        alert(`تم شحن ${chargeAmount} كوينز بنجاح!`);
     }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center pointer-events-none">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" />

      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="relative w-full max-w-md bg-[#10141f] rounded-t-[30px] overflow-hidden pointer-events-auto border-t border-white/10 shadow-2xl">
        <div className="h-32 bg-slate-900 relative overflow-hidden">
          {user.cover ? <img src={user.cover} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-amber-600"></div>}
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/30 backdrop-blur rounded-full text-white"><X size={20} /></button>
        </div>

        <div className="px-6 pb-8 relative">
          <div className="flex justify-between items-end -mt-10 mb-4">
             <div className="relative">
                <div className={`w-16 h-16 rounded-full bg-[#10141f] relative flex items-center justify-center ${!user.frame ? 'p-1 border-[4px] border-[#10141f] bg-gradient-to-br from-amber-300 to-yellow-600' : ''}`}>
                   <img src={user.avatar} className="w-full h-full rounded-full object-cover" alt="" />
                   {user.frame && <img src={user.frame} className="absolute inset-0 w-full h-full object-contain z-20 scale-[1.3]" alt="" />}
                </div>
                {user.isVip && !user.frame && <div className="absolute bottom-0 right-0 bg-amber-500 text-black p-1 rounded-full border-2 border-[#10141f]"><Crown size={14} fill="black" /></div>}
             </div>
             <div className="flex gap-2 mb-2">
                {!isCurrentUser ? (
                  <>
                    <button onClick={() => onAction('message')} className="p-2.5 bg-slate-800 rounded-full text-slate-300 border border-slate-700"><MessageCircle size={20} /></button>
                    <button onClick={() => onAction('toggleFollow')} className={`px-6 py-2 rounded-full font-bold text-sm flex items-center gap-2 ${user.isFollowing ? 'bg-slate-700 text-slate-300' : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white'}`}>
                       {user.isFollowing ? <UserCheck size={18} /> : <UserPlus size={18} />}
                       {user.isFollowing ? 'تتابع' : 'متابعة'}
                    </button>
                  </>
                ) : (
                   <button onClick={() => onAction('editProfile')} className="px-6 py-2 bg-slate-800 border border-slate-600 rounded-full text-white font-bold text-sm">تعديل</button>
                )}
             </div>
          </div>

          <div className="mb-6">
             <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h2 className={`text-2xl ${user.nameStyle ? user.nameStyle : 'font-bold text-white'}`}>{user.name}</h2>
                <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${user.isVip ? 'bg-amber-500 text-black' : 'bg-slate-700 text-slate-300'}`}>Lv.{user.level}</div>
                {user.isAdmin && <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">ADMIN</span>}
                {user.status === 'agency' && <span className="bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-1"><Truck size={8}/> وكيل</span>}
             </div>
             <div className="flex items-center gap-4 text-slate-400 text-sm mb-3">
                <button onClick={handleCopyId} className="flex items-center gap-2 hover:text-white transition group">
                   {specialIdDisplay}
                   <Copy size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
             </div>
             <p className="text-slate-300 text-sm">{user.bio || 'لا يوجد وصف..'}</p>
          </div>

          {!isCurrentUser && currentUser.status === 'agency' && (
             <div className="mb-6">
                <button 
                  onClick={() => setShowAgencyCharge(!showAgencyCharge)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl flex items-center justify-center gap-3 font-black shadow-lg shadow-blue-900/30 transition-all active:scale-95"
                >
                  <Zap size={20} fill="currentColor" /> شحن للمستخدم (رصيد وكالتك)
                </button>
                <AnimatePresence>
                   {showAgencyCharge && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-3 bg-slate-900 border border-blue-500/30 rounded-2xl p-4 overflow-hidden">
                         <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] text-slate-500 font-bold">رصيدك المتاح:</span>
                            <span className="text-xs text-blue-400 font-black">{(currentUser.agencyBalance || 0).toLocaleString()} 🪙</span>
                         </div>
                         <div className="flex gap-2">
                            <input type="number" value={chargeAmount} onChange={e => setChargeAmount(parseInt(e.target.value) || 0)} className="flex-1 bg-black/40 border border-white/5 rounded-xl px-3 text-white text-sm font-bold outline-none" placeholder="المبلغ..." />
                            <button onClick={handleAgencyTransfer} className="px-5 py-2 bg-emerald-600 text-white text-xs font-black rounded-xl">شحن</button>
                         </div>
                      </motion.div>
                   )}
                </AnimatePresence>
             </div>
          )}

          <div className="grid grid-cols-4 gap-2 mb-6 border-b border-slate-800 pb-6">
             {[{ label: 'متابعين', val: user.stats?.followers || 0 }, { label: 'يتابع', val: user.stats?.following || 0 }, { label: 'زوار', val: user.stats?.visitors || 0 }, { label: 'إعجابات', val: user.stats?.likes || 0 }].map((stat, i) => (
               <div key={i} className="text-center">
                  <div className="text-lg font-bold text-white">{stat.val}</div>
                  <div className="text-[10px] text-slate-500">{stat.label}</div>
               </div>
             ))}
          </div>

          <div className="space-y-4 mb-6">
             <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-400 to-orange-600 flex items-center justify-center text-white text-xs font-black">Lv.{wealthInfo.level}</div>
                <div className="flex-1">
                   <div className="flex justify-between text-[10px] mb-1"><span className="text-amber-400 font-bold flex items-center gap-1"><Gem size={10}/> ثراء</span><span>{wealthInfo.current.toLocaleString()} / {wealthInfo.nextLevelStart.toLocaleString()}</span></div>
                   <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5"><div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500" style={{ width: `${wealthInfo.progress}%` }}></div></div>
                </div>
             </div>
          </div>

          {!isCurrentUser && (
             <div className="grid grid-cols-4 gap-3">
                <button onClick={() => onAction('gift')} className="flex flex-col items-center gap-2"><div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center border border-slate-700"><Gift className="text-pink-500" size={24} /></div><span className="text-[10px] text-slate-400">إهداء</span></button>
                <button onClick={() => onAction('toggleMute')} className="flex flex-col items-center gap-2"><div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition border border-slate-700 ${user.isMuted ? 'bg-red-500/20 border-red-500/50' : 'bg-slate-800'}`}>{user.isMuted ? <MicOff className="text-red-500" size={24} /> : <Shield className="text-blue-500" size={24} />}</div><span className={`text-[10px] ${user.isMuted ? 'text-red-400' : 'text-slate-400'}`}>{user.isMuted ? 'إلغاء كتم' : 'إشراف'}</span></button>
             </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default UserProfileSheet;
