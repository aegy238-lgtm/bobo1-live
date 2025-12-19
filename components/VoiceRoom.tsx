
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Room, User, ChatMessage, Gift, UserLevel, GameSettings, GlobalAnnouncement, LuckyMultiplier } from '../types';
import { Mic, MicOff, Gift as GiftIcon, X, Send, LayoutGrid, Gamepad2, Settings, ChevronDown, Clover, Sparkles, RotateCcw, LogOut, ShieldCheck, Gem, Timer, Zap, Eraser, Users as UsersIcon, UserMinus, Menu, Plus, Star, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UserProfileSheet from './UserProfileSheet';
import Toast, { ToastMessage } from './Toast';
import WheelGameModal from './WheelGameModal';
import SlotsGameModal from './SlotsGameModal';
import GameCenterModal from './GameCenterModal';
import RoomSettingsModal from './RoomSettingsModal';
import WinStrip from './WinStrip';

interface VoiceRoomProps {
  room: Room;
  onLeave: () => void;
  onMinimize: () => void;
  currentUser: User;
  onUpdateUser: (user: Partial<User>) => void;
  gifts: Gift[];
  onEditProfile: () => void;
  gameSettings: GameSettings;
  onUpdateRoom: (roomId: string, data: Partial<Room>) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onAnnouncement: (ann: GlobalAnnouncement) => void;
  users: User[];
  setUsers: (users: User[]) => void;
}

interface ComboState {
  gift: Gift | null;
  recipientId: string | null;
  timer: number;
  count: number;
  active: boolean;
}

const GIFT_MULTIPLIERS = [1, 10, 20, 50, 99, 100, 520, 999, 1314];

const VoiceRoom: React.FC<VoiceRoomProps> = ({ 
  room, onLeave, onMinimize, currentUser, gifts = [], gameSettings, onUpdateRoom, isMuted, onToggleMute, onUpdateUser, onAnnouncement, users = [], setUsers, onEditProfile
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [localSeats, setLocalSeats] = useState<(User | null)[]>(new Array(8).fill(null));
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [giftTab, setGiftTab] = useState<'popular' | 'exclusive' | 'lucky'>('popular');
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showGameCenter, setShowGameCenter] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeGame, setActiveGame] = useState<'wheel' | 'slots' | null>(null);
  const [activeGiftEffect, setActiveGiftEffect] = useState<Gift | null>(null);
  const [giftRecipientId, setGiftRecipientId] = useState<string | null>(null);
  const [selectedGiftQuantity, setSelectedGiftQuantity] = useState(1);
  const [lastSelectedGift, setLastSelectedGift] = useState<Gift | null>(gifts?.[0] || null);
  const [luckyWinAmount, setLuckyWinAmount] = useState<number>(0);
  
  const [comboState, setComboState] = useState<ComboState>({ gift: null, recipientId: null, timer: 0, count: 0, active: false });
  const [isComboPulsing, setIsComboPulsing] = useState(false);
  const comboTimerRef = useRef<any>(null);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filteredGifts = useMemo(() => {
    return gifts?.filter(gift => {
      if (giftTab === 'lucky') return gift.isLucky || gift.category === 'lucky';
      if (giftTab === 'exclusive') return gift.category === 'exclusive';
      return gift.category === 'popular' || (!gift.category && !gift.isLucky);
    }) || [];
  }, [gifts, giftTab]);

  useEffect(() => {
     const newSeats = new Array(8).fill(null);
     room.speakers?.forEach((speaker) => {
        const pos = speaker.seatIndex ?? -1;
        if (pos >= 0 && pos < 8) newSeats[pos] = speaker;
     });
     setLocalSeats(newSeats);
  }, [room.speakers]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (comboState.active && comboState.timer > 0) {
        if (comboTimerRef.current) clearInterval(comboTimerRef.current);
        comboTimerRef.current = setInterval(() => {
            setComboState(prev => {
                if (prev.timer <= 0.05) {
                    clearInterval(comboTimerRef.current);
                    return { ...prev, active: false, timer: 0, count: 0 };
                }
                return { ...prev, timer: Number((prev.timer - 0.05).toFixed(2)) };
            });
        }, 50);
    }
    return () => { if (comboTimerRef.current) clearInterval(comboTimerRef.current); };
  }, [comboState.active]);

  const addToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'info') => {
     const id = Date.now().toString();
     setToasts(prev => [...prev, { id, message, type }]);
     setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2000);
  }, []);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userLevel: currentUser.level,
      userNameStyle: currentUser.nameStyle || '',
      content: inputValue,
      type: 'text',
      bubbleUrl: currentUser.activeBubble || ''
    };
    setMessages(prev => [...prev, newMsg]);
    setInputValue('');
  };

  const handleSendGift = (gift: Gift, quantity: number = 1, recipientId: string | null = null, isCombo: boolean = false) => {
    const totalCost = gift.cost * quantity;
    
    if (currentUser.coins < totalCost) {
      addToast('عذراً، رصيدك لا يكفي! 🪙', 'error');
      setComboState(prev => ({ ...prev, active: false, timer: 0, count: 0 }));
      return;
    }

    if (!isCombo) setShowGiftModal(false);
    
    const finalRecipientId = recipientId || giftRecipientId;
    let recipientName = 'الجميع';
    
    if (finalRecipientId === currentUser.id) {
      recipientName = 'نفسه';
    } else if (finalRecipientId) {
       const targetUser = room.speakers?.find(s => s.id === finalRecipientId) || users.find(u => u.id === finalRecipientId);
       if (targetUser) recipientName = targetUser.name;
    }

    setComboState(prev => ({ gift, recipientId: finalRecipientId, timer: 5, count: isCombo ? prev.count + 1 : 1, active: true }));
    setActiveGiftEffect(gift); 
    setTimeout(() => setActiveGiftEffect(null), 2500);
    
    let refundAmount = 0;
    let isLuckyWin = false;
    let winMultiplierLabel = "";

    if (gift.isLucky && Math.random() * 100 < (gameSettings.luckyGiftWinRate || 30)) {
        isLuckyWin = true;
        if (gameSettings.luckyXEnabled && gameSettings.luckyMultipliers?.length > 0) {
           const roll = Math.random() * 100;
           let accumulated = 0;
           let selectedMul = gameSettings.luckyMultipliers[0];
           for (const m of gameSettings.luckyMultipliers) {
              accumulated += m.chance;
              if (roll <= accumulated) {
                 selectedMul = m;
                 break;
              }
           }
           refundAmount = totalCost * selectedMul.value;
           winMultiplierLabel = selectedMul.label;
        } else {
           refundAmount = Math.floor(totalCost * ((gameSettings.luckyGiftRefundPercent || 200) / 100));
        }
        setLuckyWinAmount(refundAmount);
        setTimeout(() => setLuckyWinAmount(0), 4000);
    }

    // خصم الكوينز وزيادة الثروة للمرسل
    const updatedSenderData: Partial<User> = { 
      coins: (currentUser.coins || 0) - totalCost + refundAmount, 
      wealth: (currentUser.wealth || 0) + totalCost 
    };
    onUpdateUser(updatedSenderData);

    // تحديث الكاريزما للمستلم في الغرفة
    if (finalRecipientId) {
       const updatedSpeakers = (room.speakers || []).map(s => {
          if (s.id === finalRecipientId) {
             // الكاريزما تزداد بمقدار قيمة الهدية
             return { ...s, charm: (s.charm || 0) + totalCost };
          }
          return s;
       });
       onUpdateRoom(room.id, { speakers: updatedSpeakers });
    }

    const winText = winMultiplierLabel ? `ربح مضاعف ${winMultiplierLabel} (${refundAmount.toLocaleString()} كوينز)!` : `ربح ${refundAmount.toLocaleString()} كوينز!`;

    const giftMsg: ChatMessage = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userLevel: currentUser.level,
      userNameStyle: currentUser.nameStyle || '',
      content: isLuckyWin ? `${winText} من ${gift.name} 🍀` : `أرسل ${gift.name} x${quantity} إلى ${recipientName}`,
      type: 'gift', giftData: gift, isLuckyWin, winAmount: refundAmount
    };
    setMessages(prev => [...prev, giftMsg]);

    if (totalCost >= 2000 || isLuckyWin) {
      onAnnouncement({ 
        id: Date.now().toString(), 
        senderName: currentUser.name, 
        recipientName, 
        giftName: gift.name, 
        giftIcon: gift.icon, 
        roomTitle: room.title, 
        roomId: room.id, 
        type: isLuckyWin ? 'lucky_win' : 'gift', 
        amount: isLuckyWin ? refundAmount : totalCost, 
        timestamp: new Date() 
      });
    }
  };

  const handleSeatClick = (index: number) => {
    const userAtSeat = localSeats[index];
    if (userAtSeat) {
      setSelectedUser(userAtSeat);
      return;
    }
    const newLocalSeats = [...localSeats];
    const oldSeatIndex = localSeats.findIndex(s => s?.id === currentUser.id);
    if (oldSeatIndex !== -1) newLocalSeats[oldSeatIndex] = null;
    // عند الصعود للمايك، الكاريزما تكون كما هي في بيانات المتحدث (تبدأ من الصفر عادة)
    newLocalSeats[index] = { ...currentUser, seatIndex: index, isMuted: isMuted };
    setLocalSeats(newLocalSeats);
    const updatedSpeakersList = (room.speakers || []).filter(s => s.id !== currentUser.id);
    updatedSpeakersList.push({ ...currentUser, seatIndex: index, isMuted: isMuted });
    onUpdateRoom(room.id, { speakers: updatedSpeakersList });
  };

  const handleLeaveMic = () => {
    const newLocalSeats = [...localSeats];
    const oldSeatIndex = localSeats.findIndex(s => s?.id === currentUser.id);
    if (oldSeatIndex !== -1) newLocalSeats[oldSeatIndex] = null;
    setLocalSeats(newLocalSeats);
    const updatedSpeakersList = (room.speakers || []).filter(s => s.id !== currentUser.id);
    onUpdateRoom(room.id, { speakers: updatedSpeakersList });
    setShowMenuModal(false);
    addToast('لقد غادرت الميكروفون', 'info');
  };

  const renderGiftIcon = (icon: string, className: string = "w-full h-full object-contain") => {
    if (!icon) return null;
    const isImage = icon.startsWith('http') || icon.startsWith('data:');
    return isImage ? <img src={icon} className={className} alt="" /> : <span className="text-3xl leading-none">{icon}</span>;
  };

  const handleComboClick = () => {
    if (!comboState.active || !comboState.gift) return;
    setIsComboPulsing(true);
    setTimeout(() => setIsComboPulsing(false), 200);
    handleSendGift(comboState.gift, 1, comboState.recipientId, true);
  };

  const bgStyle = useMemo(() => {
    const isImageUrl = room.background?.startsWith('http') || room.background?.startsWith('data:image');
    if (isImageUrl) return { backgroundImage: `url(${room.background})`, backgroundSize: 'cover', backgroundPosition: 'center' };
    return { background: room.background || '#0f172a' };
  }, [room.background]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col transition-all duration-700" style={bgStyle}>
      <Toast toasts={toasts} onRemove={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
      <AnimatePresence>{luckyWinAmount > 0 && <WinStrip amount={luckyWinAmount} />}</AnimatePresence>

      <AnimatePresence>
         {activeGiftEffect && (
            <motion.div initial={{ scale: 0, opacity: 0, y: 100 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 1.5, opacity: 0 }} className="fixed inset-0 z-[55] flex items-center justify-center pointer-events-none">
               <div className="flex flex-col items-center relative">
                  <div className="w-44 h-44 relative z-10 drop-shadow-[0_20px_40px_rgba(251,191,36,0.6)]">{renderGiftIcon(activeGiftEffect.icon)}</div>
                  <h3 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-600 drop-shadow-lg">{activeGiftEffect.name}</h3>
               </div>
            </motion.div>
         )}
      </AnimatePresence>

      <div className="flex justify-between items-center p-4 pt-12 bg-gradient-to-b from-black/80 to-transparent shrink-0">
         <div className="flex items-center gap-3">
            <button onClick={onLeave} className="w-9 h-9 flex items-center justify-center bg-black/40 rounded-xl hover:bg-red-500/20 border border-white/10 active:scale-95 transition-all"><X size={20} className="text-white" /></button>
            <button onClick={onMinimize} className="w-9 h-9 flex items-center justify-center bg-black/40 rounded-xl border border-white/10 active:scale-95 transition-all"><ChevronDown size={22} className="text-white" /></button>
            <div className="text-white"><h2 className="font-black text-sm truncate max-w-[140px] leading-tight">{room.title}</h2><p className="text-[10px] opacity-60 font-mono tracking-tighter">ID: {room.id}</p></div>
         </div>
         <div className="bg-black/40 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-2 shadow-lg">
            <UsersIcon size={12} className="text-emerald-400" />
            <span className="text-xs font-black text-white">{room.listeners || 0}</span>
         </div>
      </div>

      <div className="flex-1 px-4 overflow-y-auto mt-4 scrollbar-hide">
         <div className="grid grid-cols-4 gap-x-3 gap-y-24 pt-6">
            {localSeats.map((speaker, index) => (
               <div key={index} className="flex flex-col items-center relative">
                  <button onClick={() => handleSeatClick(index)} className="relative w-full aspect-square flex flex-col items-center justify-center transition-all duration-300">
                     {speaker ? (
                        <div className="relative w-full flex flex-col items-center">
                           {!speaker.isMuted && (
                              <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20">
                                 <motion.div 
                                    animate={{ scale: [1, 1.45, 1], opacity: [0.6, 0.2, 0.6] }} 
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="absolute inset-0 rounded-full border-2 border-amber-400/40 shadow-[0_0_20px_rgba(251,191,36,0.5)]"
                                 />
                                 <motion.div 
                                    animate={{ scale: [1, 1.7], opacity: [0.4, 0] }} 
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                    className="absolute inset-0 rounded-full border border-white/20"
                                 />
                              </div>
                           )}
                           
                           <div className="relative z-10 w-14 h-14">
                              <div className={`w-full h-full rounded-full overflow-hidden p-0.5 bg-gradient-to-b from-slate-600 to-slate-900 border border-white/20 shadow-[0_8px_16px_rgba(0,0,0,0.6)] ${!speaker.isMuted ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900' : ''}`}>
                                <img src={speaker.avatar} className="w-full h-full rounded-full object-cover" />
                              </div>
                              {speaker.frame && <img src={speaker.frame} className="absolute inset-0 w-full h-full object-contain z-20 scale-[1.4] pointer-events-none drop-shadow-2xl" />}
                           </div>

                           <div className="absolute top-[85%] w-1.5 h-7 bg-gradient-to-b from-slate-300 via-slate-500 to-slate-800 rounded-b-full shadow-lg z-0"></div>

                           <div className="absolute -bottom-16 flex flex-col items-center w-full">
                              <div className="flex items-center justify-center w-full mb-1">
                                 <span className={`text-[10px] font-black truncate max-w-[70px] drop-shadow-md ${speaker.nameStyle || 'text-white'}`}>
                                    {speaker.name}
                                 </span>
                              </div>

                              <div className="flex items-center gap-1 bg-gradient-to-r from-pink-600/60 to-purple-600/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 shadow-[0_2px_5px_rgba(0,0,0,0.3)]">
                                 <Sparkles size={8} className="text-white animate-pulse" />
                                 <span className="text-[9px] text-white font-black tracking-tighter">
                                    {(speaker.charm || 0).toLocaleString()}
                                 </span>
                              </div>
                           </div>
                        </div>
                     ) : (
                        <div className="group relative flex flex-col items-center">
                           <div className="w-12 h-12 rounded-full bg-slate-900/60 border border-white/5 flex items-center justify-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] group-hover:bg-slate-800/80 transition-all">
                              <div className="w-4 h-4 bg-slate-700/50 rounded-full flex items-center justify-center">
                                <Plus size={10} className="text-slate-500 group-hover:text-amber-500 group-hover:scale-125 transition-all" />
                              </div>
                           </div>
                           <div className="mt-1 w-4 h-1 bg-black/40 rounded-full"></div>
                        </div>
                     )}
                  </button>
               </div>
            ))}
         </div>
      </div>

      <div className="h-[40%] bg-gradient-to-t from-black via-black/95 to-transparent px-4 pb-4 pt-10 flex flex-col justify-end relative shrink-0">
         <div className="overflow-y-auto mb-4 space-y-2.5 pr-1 scrollbar-hide flex-1">
            {messages.map((msg) => (
               <div key={msg.id} className="flex flex-col items-start">
                  {msg.type === 'gift' ? (
                     <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="rounded-2xl p-2 pr-5 pl-2.5 flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl">
                        <div className="w-10 h-10 rounded-xl bg-black/40 p-1.5 flex items-center justify-center shrink-0 border border-white/5 shadow-inner">{renderGiftIcon(msg.giftData?.icon || '')}</div>
                        <div className="flex flex-col"><div className="flex items-center gap-2"><span className={`text-xs font-black ${msg.userNameStyle || 'text-amber-400'}`}>{msg.userName}</span><span className="text-[10px] text-white/40">أرسل {msg.giftData?.name}</span></div><span className="text-[10px] text-white/80 font-bold">{msg.isLuckyWin && <span className="text-green-400 italic">🍀 {msg.content}</span>}</span></div>
                     </motion.div>
                   ) : msg.type === 'system' ? (
                     <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl px-5 py-2 text-[11px] text-blue-300 italic font-black w-max max-w-full text-center mx-auto my-1.5 shadow-lg shadow-blue-900/10">{msg.content}</div>
                   ) : (
                     <div className="flex items-start gap-2.5 max-w-[92%]">
                        <div className="mt-1.5 px-2 rounded-lg bg-slate-800 text-slate-300 text-[9px] font-black h-4.5 flex items-center border border-white/5 shadow-sm">Lv.{msg.userLevel}</div>
                        <div className="flex flex-col">
                          <span onClick={() => { const target = room.speakers?.find(s => s.id === msg.userId) || users.find(u => u.id === msg.userId); if (target) setSelectedUser(target); }} className={`text-[10px] mb-0.5 cursor-pointer hover:underline font-bold ${msg.userNameStyle || 'text-slate-400'}`}>{msg.userName}</span>
                          <div className="rounded-[1.25rem] rounded-tr-none px-4 py-2 text-xs text-white bg-white/10 backdrop-blur-md border border-white/10 shadow-lg leading-relaxed" style={msg.bubbleUrl ? { backgroundImage: `url(${msg.bubbleUrl})`, backgroundSize: 'cover' } : {}}>{msg.content}</div>
                        </div>
                     </div>
                  )}
               </div>
            ))}
            <div ref={messagesEndRef} />
         </div>

         <div className="flex items-center gap-2.5 mt-2">
            <div className="flex-1 bg-white/5 backdrop-blur-2xl rounded-2xl h-14 flex items-center px-5 border border-white/10 shadow-2xl group transition-all focus-within:bg-white/10">
                <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="قل شيئاً جميلاً..." className="bg-transparent text-white w-full outline-none text-sm text-right placeholder-white/20 font-medium" />
                <button onClick={handleSendMessage} className="ml-3 text-blue-400 hover:text-blue-300 active:scale-90 transition-all"><Send size={20} fill="currentColor" /></button>
            </div>
            
            <div className="flex items-center gap-2 shrink-0 relative">
                <AnimatePresence>
                    {comboState.active && (
                       <motion.div initial={{ scale: 0, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="absolute -top-16 left-8 flex flex-col items-center justify-center z-[70]">
                           <button onClick={handleComboClick} className={`relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all border-2 active:scale-95 shadow-2xl overflow-hidden ${isComboPulsing ? 'scale-110 brightness-125' : ''}`} style={{ background: 'rgba(139, 92, 246, 0.45)', backdropFilter: 'blur(15px)', borderColor: 'rgba(167, 139, 250, 0.8)' }}>
                              <div className="w-10 h-10 flex items-center justify-center z-10 drop-shadow-lg">{comboState.gift && renderGiftIcon(comboState.gift.icon)}</div>
                              <div className="absolute bottom-1 inset-x-0 flex justify-center"><span className="text-[10px] font-black text-white bg-black/40 px-2 rounded-full">{Math.ceil(comboState.timer)}s</span></div>
                           </button>
                           <motion.div key={comboState.count} initial={{ scale: 1.8, y: -5 }} animate={{ scale: 1, y: 0 }} className="absolute -top-3 -right-3 bg-gradient-to-b from-yellow-300 via-amber-500 to-orange-600 text-black text-[12px] font-black w-8 h-8 rounded-full flex items-center justify-center border-4 border-[#020617] z-20 shadow-xl">x{comboState.count}</motion.div>
                       </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid grid-cols-4 gap-2">
                   <button onClick={onToggleMute} className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all active:scale-90 shadow-xl ${isMuted ? 'bg-slate-800 text-slate-500 border-slate-700' : 'bg-blue-600 text-white border-blue-400 shadow-blue-900/50'}`}>
                      {isMuted ? <MicOff size={22} strokeWidth={2.5} /> : <Mic size={22} strokeWidth={2.5} />}
                   </button>
                   <button onClick={() => setShowGiftModal(true)} className="w-12 h-12 bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-700 rounded-2xl text-white shadow-xl shadow-purple-900/40 flex items-center justify-center border border-white/20 active:scale-90 transition-all">
                      <GiftIcon size={22} strokeWidth={2.5} />
                   </button>
                   <button onClick={() => setShowGameCenter(true)} className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-2xl text-white shadow-xl shadow-emerald-900/40 flex items-center justify-center border border-white/20 active:scale-90 transition-all">
                      <Gamepad2 size={22} strokeWidth={2.5} />
                   </button>
                   <button onClick={() => setShowMenuModal(true)} className="w-12 h-12 bg-slate-800/80 backdrop-blur-xl rounded-2xl text-white border border-white/10 flex items-center justify-center shadow-xl active:scale-90 transition-all hover:bg-slate-700">
                      <Menu size={22} strokeWidth={2.5} />
                   </button>
                </div>
            </div>
         </div>
      </div>

      {showGiftModal && (
         <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/60 backdrop-blur-[2px]" onClick={() => setShowGiftModal(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="w-full max-w-sm bg-slate-950/80 backdrop-blur-[50px] rounded-t-[3rem] border-t border-white/20 flex flex-col max-h-[85vh] overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.5)]" onClick={e => e.stopPropagation()}>
               <div className="p-5 bg-white/5 border-b border-white/10">
                  <div className="text-[10px] font-black text-slate-500 mb-4 px-2 uppercase tracking-widest text-right">إرسال الهدية إلى:</div>
                  <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide px-2" dir="rtl">
                     <button onClick={() => setGiftRecipientId(null)} className={`flex flex-col items-center gap-2 shrink-0 transition-all ${giftRecipientId === null ? 'scale-110' : 'opacity-40 grayscale'}`}>
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center bg-slate-900 border-2 transition-all ${giftRecipientId === null ? 'border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.4)]' : 'border-white/10'}`}>
                           <UsersIcon size={22} className="text-white" />
                        </div>
                        <span className="text-[10px] font-black text-white">الجميع</span>
                     </button>
                     <button onClick={() => setGiftRecipientId(currentUser.id)} className={`flex flex-col items-center gap-2 shrink-0 transition-all ${giftRecipientId === currentUser.id ? 'scale-110' : 'opacity-40 grayscale'}`}>
                        <div className={`w-14 h-14 rounded-full relative p-0.5 border-2 transition-all ${giftRecipientId === currentUser.id ? 'border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.4)]' : 'border-white/10'}`}>
                           <img src={currentUser.avatar} className="w-full h-full rounded-full object-cover" alt="" />
                           <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-0.5 border border-slate-900"><Star size={8} fill="black" /></div>
                        </div>
                        <span className="text-[10px] font-black text-amber-400">أنا</span>
                     </button>
                     {room.speakers?.filter(s => s.id !== currentUser.id).map((speaker) => (
                        <button key={speaker.id} onClick={() => setGiftRecipientId(speaker.id)} className={`flex flex-col items-center gap-2 shrink-0 transition-all ${giftRecipientId === speaker.id ? 'scale-110' : 'opacity-40 grayscale'}`}>
                           <div className={`w-14 h-14 rounded-full relative p-0.5 border-2 transition-all ${giftRecipientId === speaker.id ? 'border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.4)]' : 'border-white/10'}`}>
                              <img src={speaker.avatar} className="w-full h-full rounded-full object-cover" alt="" />
                           </div>
                           <span className="text-[10px] font-black text-white truncate w-14 text-center">{speaker.name}</span>
                        </button>
                     ))}
                  </div>
               </div>
               <div className="p-4 flex items-center justify-between bg-white/5 border-b border-white/10" dir="rtl">
                 <div className="flex gap-6">
                   {[{ id: 'popular', label: 'شائع' }, { id: 'exclusive', label: 'مميز' }, { id: 'lucky', label: 'الحظ' }].map(tab => (
                     <button key={tab.id} onClick={() => setGiftTab(tab.id as any)} className={`text-sm font-black transition-all relative ${giftTab === tab.id ? 'text-amber-400' : 'text-white/40 hover:text-white/60'}`}>{tab.label}</button>
                   ))}
                 </div>
                 <div className="bg-slate-900/60 px-4 py-2 rounded-full text-yellow-400 text-xs font-black border border-white/10 flex items-center gap-2">🪙 {(currentUser.coins ?? 0).toLocaleString()}</div>
               </div>
               <div className="grid grid-cols-4 gap-3 p-6 overflow-y-auto min-h-[35vh] scrollbar-hide" dir="rtl">
                 {filteredGifts.map(gift => (
                   <button key={gift.id} onClick={() => { setLastSelectedGift(gift); handleSendGift(gift, selectedGiftQuantity); }} className={`group flex flex-col items-center p-3 rounded-[1.75rem] transition-all border shadow-lg ${lastSelectedGift?.id === gift.id ? 'border-amber-400 bg-amber-400/20' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}>
                     <div className="w-14 h-14 mb-2 flex items-center justify-center text-4xl group-active:scale-125 transition-transform">{renderGiftIcon(gift.icon)}</div>
                     <span className="text-white text-[10px] font-black truncate w-full text-center">{gift.name}</span>
                     <div className="flex items-center gap-0.5 mt-1"><span className="text-yellow-400 text-[10px] font-black">{gift.cost}</span></div>
                   </button>
                 ))}
               </div>
               <div className="p-6 bg-black/40 border-t border-white/10 flex items-center justify-between gap-5" dir="rtl">
                 <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1">
                   {GIFT_MULTIPLIERS.map(qty => (
                     <button key={qty} onClick={() => setSelectedGiftQuantity(qty)} className={`px-4 py-2.5 rounded-xl text-[10px] font-black transition-all ${selectedGiftQuantity === qty ? 'bg-amber-400 text-black shadow-lg shadow-amber-900/40 scale-110' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>x{qty}</button>
                   ))}
                 </div>
                 <button onClick={() => lastSelectedGift && handleSendGift(lastSelectedGift, selectedGiftQuantity)} className="px-10 py-4 bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 rounded-2xl text-black font-black text-sm active:scale-95 flex items-center gap-2 shadow-xl shadow-amber-900/40">إرسال <Zap size={18} fill="black" /></button>
               </div>
            </motion.div>
         </div>
      )}

      <GameCenterModal isOpen={showGameCenter} onClose={() => setShowGameCenter(false)} onSelectGame={(game) => { setActiveGame(game); setShowGameCenter(false); }} />
      <RoomSettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} room={room} onUpdate={onUpdateRoom} />
      <WheelGameModal isOpen={activeGame === 'wheel'} onClose={() => setActiveGame(null)} userCoins={currentUser.coins} onUpdateCoins={(c) => onUpdateUser({ coins: c })} winRate={gameSettings.wheelWinRate} gameSettings={gameSettings} />
      <SlotsGameModal isOpen={activeGame === 'slots'} onClose={() => setActiveGame(null)} userCoins={currentUser.coins} onUpdateCoins={(c) => onUpdateUser({ coins: c })} winRate={gameSettings.slotsWinRate} gameSettings={gameSettings} />

      <AnimatePresence>
        {selectedUser && (
           <UserProfileSheet 
              user={selectedUser} onClose={() => setSelectedUser(null)} isCurrentUser={selectedUser.id === currentUser.id} currentUser={currentUser} 
              onAction={(act, data) => {
                 if (act === 'agencyTransfer') {
                    onUpdateUser({ agencyBalance: (currentUser.agencyBalance || 0) - data.amount });
                    const targetUser = users.find(u => u.id === data.targetId);
                    if (targetUser) onUpdateUser({ id: targetUser.id, coins: targetUser.coins + data.amount } as any);
                 }
                 if (act === 'gift') { setSelectedUser(null); setShowGiftModal(true); setGiftRecipientId(selectedUser.id); }
                 if (act === 'editProfile') onEditProfile();
              }}
           />
        )}
      </AnimatePresence>

      <AnimatePresence>
         {showMenuModal && (
            <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 bg-black/60 backdrop-blur-[2px]" onClick={() => setShowMenuModal(false)}>
               <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="w-full max-w-sm bg-slate-900/90 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 p-6 space-y-4" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-2">
                     <h3 className="text-lg font-black text-white">إدارة الغرفة</h3>
                     <button onClick={() => setShowMenuModal(false)} className="p-2 bg-white/5 rounded-full"><X size={20}/></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <button onClick={() => { setShowSettingsModal(true); setShowMenuModal(false); }} className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
                        <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg"><Settings size={20}/></div>
                        <span className="text-[10px] font-black text-white">الإعدادات</span>
                     </button>
                     <button onClick={handleLeaveMic} className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
                        <div className="p-2 bg-red-600/20 text-red-400 rounded-lg"><UserMinus size={20}/></div>
                        <span className="text-[10px] font-black text-white">ترك المايك</span>
                     </button>
                     <button onClick={() => {
                         // تصفير الكاريزما لجميع المتحدثين في الغرفة
                         const resetSpeakers = (room.speakers || []).map(s => ({ ...s, charm: 0 }));
                         onUpdateRoom(room.id, { speakers: resetSpeakers });
                         addToast('تم تصفير الكاريزما لجميع المقاعد ✅', 'success');
                         setShowMenuModal(false);
                     }} className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
                        <div className="p-2 bg-amber-600/20 text-amber-500 rounded-lg"><RotateCcw size={20}/></div>
                        <span className="text-[10px] font-black text-white">تصفير السمعة</span>
                     </button>
                     <button onClick={onLeave} className="flex flex-col items-center gap-2 p-4 bg-red-600/10 rounded-2xl border border-red-500/20 hover:bg-red-600 hover:text-white transition-all">
                        <div className="p-2 bg-red-600/20 text-red-400 rounded-lg"><LogOut size={20}/></div>
                        <span className="text-[10px] font-black text-white">خروج نهائي</span>
                     </button>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceRoom;
