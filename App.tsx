
import React, { useState, useEffect, useMemo } from 'react';
import { Home, User as UserIcon, Plus, Bell, Crown, Gem, Settings, ChevronRight, Edit3, Share2, LogOut, Shield, Database, ShoppingBag, Camera, Trophy, Flame, Sparkles, UserX, Star, ShieldCheck, MapPin, Download, Smartphone } from 'lucide-react';
import RoomCard from './components/RoomCard';
import VoiceRoom from './components/VoiceRoom';
import AuthScreen from './components/AuthScreen';
import Toast, { ToastMessage } from './components/Toast';
import VIPModal from './components/VIPModal';
import EditProfileModal from './components/EditProfileModal';
import BagModal from './components/BagModal';
import CreateRoomModal from './components/CreateRoomModal';
import GlobalBanner from './components/GlobalBanner';
import AdminPanel from './components/AdminPanel';
import { DEFAULT_VIP_LEVELS, DEFAULT_GIFTS, DEFAULT_STORE_ITEMS } from './constants';
import { Room, User, VIPPackage, UserLevel, Gift, StoreItem, GameSettings, GlobalAnnouncement } from './types';
import { AnimatePresence, motion } from 'framer-motion';
import { db } from './services/firebase';
import { collection, onSnapshot, doc, setDoc, query, orderBy, addDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'profile' | 'rank'>('home');
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [isRoomMinimized, setIsRoomMinimized] = useState(false);
  const [isUserMuted, setIsUserMuted] = useState(true);
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  // Database State
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]); 
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [vipLevels, setVipLevels] = useState<VIPPackage[]>(DEFAULT_VIP_LEVELS);
  const [announcement, setAnnouncement] = useState<GlobalAnnouncement | null>(null);
  const [appBanner, setAppBanner] = useState('');

  const [gameSettings, setGameSettings] = useState<GameSettings>({
     slotsWinRate: 35, wheelWinRate: 45, luckyGiftWinRate: 30, luckyGiftRefundPercent: 200, luckyXEnabled: true,
     luckyMultipliers: [{ label: 'X10', value: 10, chance: 70 }, { label: 'X50', value: 50, chance: 20 }, { label: 'X100', value: 100, chance: 8 }, { label: 'X500', value: 500, chance: 2 }],
     wheelJackpotX: 8, wheelNormalX: 2, slotsSevenX: 20, slotsFruitX: 5
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [showVIPModal, setShowVIPModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showBagModal, setShowBagModal] = useState(false);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    });

    const unsubSettings = onSnapshot(doc(db, 'appSettings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.appBanner) setAppBanner(data.appBanner);
        if (data.gameSettings) setGameSettings(data.gameSettings);
      }
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setUsers(usersData);
        // تحديث بيانات المستخدم الحالي إذا تغيرت في القاعدة
        if (user) {
          const currentInDb = usersData.find(u => u.id === user.id);
          if (currentInDb) setUser(currentInDb);
        }
    });

    const qRooms = query(collection(db, 'rooms'), orderBy('listeners', 'desc'));
    const unsubRooms = onSnapshot(qRooms, (snapshot) => {
      const roomsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
      setRooms(roomsData);
      // تحديث بيانات الغرفة الحالية لضمان تزامن المقاعد والكاريزما
      if (currentRoom) {
        const updatedCurrent = roomsData.find(r => r.id === currentRoom.id);
        if (updatedCurrent) setCurrentRoom(updatedCurrent);
      }
    });

    const unsubGifts = onSnapshot(doc(db, 'appSettings', 'gifts'), (docSnap) => {
      if (docSnap.exists()) setGifts(docSnap.data().gifts || DEFAULT_GIFTS);
      else setGifts(DEFAULT_GIFTS);
    });

    const unsubStore = onSnapshot(doc(db, 'appSettings', 'store'), (docSnap) => {
      if (docSnap.exists()) setStoreItems(docSnap.data().items || DEFAULT_STORE_ITEMS);
      else setStoreItems(DEFAULT_STORE_ITEMS);
    });

    const unsubVip = onSnapshot(doc(db, 'appSettings', 'vip'), (docSnap) => {
      if (docSnap.exists()) setVipLevels(docSnap.data().levels || DEFAULT_VIP_LEVELS);
    });

    const savedUser = localStorage.getItem('voice_chat_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      getDoc(doc(db, 'users', parsedUser.id)).then((docSnap) => {
        if (docSnap.exists()) setUser(docSnap.data() as User);
      });
    }
    
    setInitializing(false);
    return () => {
      unsubSettings(); unsubRooms(); unsubUsers(); unsubGifts(); unsubStore(); unsubVip();
    };
  }, [user?.id, currentRoom?.id]);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowInstallBtn(false);
    setDeferredPrompt(null);
  };

  const handleAuth = async (userData: User) => {
    setUser(userData);
    localStorage.setItem('voice_chat_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    if (confirm("هل أنت متأكد من تسجيل الخروج؟")) {
      setUser(null); setCurrentRoom(null);
      localStorage.removeItem('voice_chat_user');
      addToast("تم تسجيل الخروج بنجاح", "info");
      setActiveTab('home');
    }
  };

  const handleCreateRoom = async (roomData: any) => {
    if (!user) return;
    const newRoom = { ...roomData, hostId: user.id, listeners: 1, speakers: [{ ...user, seatIndex: 0, charm: 0 }], createdAt: serverTimestamp() };
    await addDoc(collection(db, 'rooms'), newRoom);
    addToast("تم إنشاء الغرفة بنجاح!", "success");
    setShowCreateRoomModal(false);
  };

  const handleUpdateUser = async (updatedData: Partial<User>) => {
    if (!user) return;
    await setDoc(doc(db, 'users', user.id), updatedData, { merge: true });
  };

  const handleRoomJoin = (room: Room) => {
    setCurrentRoom(room);
    setIsRoomMinimized(false);
    // تحديث عدد المستمعين في القاعدة
    handleUpdateRoom(room.id, { listeners: (room.listeners || 0) + 1 });
  };

  const handleRoomLeave = async () => {
    if (!currentRoom || !user) return;
    
    // إزالة المستخدم من المقاعد فوراً عند الخروج
    const updatedSpeakers = (currentRoom.speakers || []).filter(s => s.id !== user.id);
    await setDoc(doc(db, 'rooms', currentRoom.id), { 
      speakers: updatedSpeakers,
      listeners: Math.max(0, (currentRoom.listeners || 1) - 1)
    }, { merge: true });

    setCurrentRoom(null);
    setIsRoomMinimized(false);
  };

  const handleUpdateRoom = async (roomId: string, data: Partial<Room>) => {
    await setDoc(doc(db, 'rooms', roomId), data, { merge: true });
  };

  const triggerAnnouncement = (ann: GlobalAnnouncement) => {
    setAnnouncement(ann);
    setTimeout(() => setAnnouncement(null), 8000);
  };

  const addToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  if (initializing) return <div className="h-[100dvh] w-full bg-[#0f172a] flex items-center justify-center"><div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!user) return <AuthScreen onAuth={handleAuth} />;

  return (
    <div className="h-[100dvh] w-full bg-[#0f172a] text-white relative md:max-w-md mx-auto shadow-2xl overflow-hidden flex flex-col font-cairo">
      <Toast toasts={toasts} onRemove={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
      
      <AnimatePresence>
        {announcement && <GlobalBanner announcement={announcement} />}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto pb-20 scrollbar-hide">
        {activeTab === 'home' && (
           <div className="mt-2 space-y-3">
              <div className="px-4">
                 <div className="relative w-full h-28 rounded-2xl overflow-hidden shadow-lg border border-white/10 bg-slate-800">
                   {appBanner ? <img src={appBanner} className="w-full h-full object-cover" alt="Banner" /> : <div className="w-full h-full bg-slate-800 animate-pulse"></div>}
                 </div>
              </div>

              <div className="px-4">
                 <div className="flex justify-between items-center mb-2">
                   <h2 className="text-xs font-bold text-white flex items-center gap-1.5"><Trophy size={14} className="text-yellow-500" /> كبار الداعمين</h2>
                 </div>
                 <div className="bg-slate-900/50 p-2 rounded-xl border border-white/5 backdrop-blur-sm overflow-x-auto">
                   <div className="flex gap-3 min-w-max">
                     {[...users].filter(u => (u.wealth || 0) > 0).sort((a, b) => (b.wealth || 0) - (a.wealth || 0)).slice(0, 10).map((contributor, idx) => (
                       <div key={contributor.id} className="flex flex-col items-center gap-1 min-w-[60px]">
                         <div className="relative">
                           <div className={`w-12 h-12 rounded-full p-[2px] ${idx === 0 ? 'bg-gradient-to-tr from-yellow-300 to-yellow-600' : 'bg-slate-700'}`}>
                             <img src={contributor.avatar} className="w-full h-full rounded-full object-cover border-2 border-slate-900" alt={contributor.name} />
                           </div>
                         </div>
                         <span className="text-[9px] font-bold text-white max-w-[60px] truncate">{contributor.name}</span>
                       </div>
                     ))}
                   </div>
                 </div>
              </div>

              <div className="px-4">
                 <div className="flex justify-between items-center mb-2">
                   <h2 className="text-xs font-bold text-white flex items-center gap-1.5"><Flame size={14} className="text-orange-500" /> الغرف النشطة</h2>
                 </div>
                 <div className="grid gap-2.5">
                   {rooms.map(room => (
                     <RoomCard key={room.id} room={room} onClick={handleRoomJoin} />
                   ))}
                   {rooms.length === 0 && <div className="text-center text-slate-500 py-10 text-xs">لا توجد غرف نشطة حالياً</div>}
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'profile' && user && (
           <div className="relative">
              <div className="h-40 bg-slate-900 relative overflow-hidden">
                {user.cover ? <img src={user.cover} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-r from-indigo-900 to-slate-900"></div>}
              </div>
              <div className="px-5 pb-10">
                 <div className="relative -mt-10 mb-4 flex justify-between items-end">
                    <div className="relative">
                      <div className={`w-16 h-16 rounded-full bg-slate-950 flex items-center justify-center ${!user.frame ? 'p-1 border-4 border-slate-800' : ''}`}>
                        <img src={user.avatar} className="w-full h-full rounded-full object-cover" />
                        {user.frame && <img src={user.frame} className="absolute inset-0 w-full h-full object-contain scale-[1.3]" />}
                      </div>
                    </div>
                 </div>
                 <div className="mb-6">
                    <h2 className={`text-2xl flex items-center gap-2 ${user.nameStyle || 'font-bold text-white'}`}>{user.name} <span className="bg-amber-500 text-black text-[10px] px-2 py-0.5 rounded-full font-black">Lv.{user.level}</span></h2>
                    <span className="font-mono text-xs text-slate-400">ID: {user.customId || user.id}</span>
                 </div>

                 {showInstallBtn && (
                    <div className="mb-8 p-6 bg-gradient-to-br from-indigo-600 via-blue-700 to-indigo-900 rounded-[2.5rem] border border-white/20 shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10"><Smartphone size={80} /></div>
                      <h3 className="text-lg font-black text-white mb-1">نسخة الجوال متوفرة!</h3>
                      <button onClick={handleInstallApp} className="w-full bg-white text-indigo-700 p-4 rounded-2xl flex items-center justify-center gap-3 font-black text-sm shadow-xl active:scale-95">
                        <Download size={20} /> تثبيت التطبيق الآن
                      </button>
                    </div>
                 )}

                 <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 rounded-2xl border border-white/5 mb-6 flex justify-between items-center">
                    <div><div className="text-xs text-slate-400">رصيد العملات</div><div className="font-bold text-lg text-yellow-400">{(user.coins ?? 0).toLocaleString()} 🪙</div></div>
                 </div>

                 <div className="bg-slate-900 rounded-2xl border border-white/5 overflow-hidden">
                    {user.isAdmin && (
                      <div onClick={() => setShowAdminPanel(true)} className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-red-500/5 cursor-pointer">
                        <div className="flex items-center gap-3"><ShieldCheck size={18} className="text-red-500" /><span className="text-sm font-black text-red-500">لوحة الإدارة</span></div>
                      </div>
                    )}
                    <div onClick={() => setShowEditProfileModal(true)} className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer">
                      <div className="flex items-center gap-3"><Edit3 size={18} className="text-emerald-500" /><span className="text-sm font-medium text-white">تعديل الحساب</span></div>
                    </div>
                    <div onClick={() => setShowBagModal(true)} className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer">
                      <div className="flex items-center gap-3"><ShoppingBag size={18} className="text-blue-500" /><span className="text-sm font-medium text-white">المتجر والحقيبة</span></div>
                    </div>
                    <div onClick={() => setShowVIPModal(true)} className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer">
                      <div className="flex items-center gap-3"><Crown size={18} className="text-amber-500" /><span className="text-sm font-medium text-white">عضوية الـ VIP</span></div>
                    </div>
                    <div onClick={handleLogout} className="flex items-center justify-between p-4 hover:bg-red-900/10 cursor-pointer">
                      <div className="flex items-center gap-3"><LogOut size={18} className="text-red-500" /><span className="text-sm font-medium text-red-500">خروج</span></div>
                    </div>
                 </div>
              </div>
           </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-[#0f172a]/95 backdrop-blur-lg border-t border-white/5 flex justify-around items-center h-20 pb-2 z-20">
         <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 p-2 w-16 ${activeTab === 'home' ? 'text-amber-400' : 'text-slate-500'}`}><Home size={24} /><span className="text-[10px] font-medium">الرئيسية</span></button>
         <button onClick={() => setShowCreateRoomModal(true)} className="flex flex-col items-center gap-1 p-2 -mt-8 group"><div className="bg-gradient-to-br from-amber-400 to-orange-600 w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-4 border-slate-900"><Plus size={28} className="text-white" /></div></button>
         <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 p-2 w-16 ${activeTab === 'profile' ? 'text-amber-400' : 'text-slate-500'}`}><UserIcon size={24} /><span className="text-[10px] font-medium">حسابي</span></button>
      </div>

      {showVIPModal && user && <VIPModal user={user} vipLevels={vipLevels} onClose={() => setShowVIPModal(false)} onBuy={(v) => handleUpdateUser({ isVip: true, vipLevel: v.level, coins: user.coins - v.cost, frame: v.frameUrl, nameStyle: v.nameStyle })} />}
      {showEditProfileModal && user && <EditProfileModal isOpen={showEditProfileModal} onClose={() => setShowEditProfileModal(false)} currentUser={user} onSave={handleUpdateUser} />}
      {showBagModal && user && <BagModal isOpen={showBagModal} onClose={() => setShowBagModal(false)} items={storeItems} user={user} onBuy={(item) => handleUpdateUser({ coins: user.coins - item.price, ownedItems: [...(user.ownedItems || []), item.id] })} onEquip={(item) => handleUpdateUser(item.type === 'frame' ? { frame: item.url } : { activeBubble: item.url })} />}
      {showCreateRoomModal && <CreateRoomModal isOpen={showCreateRoomModal} onClose={() => setShowCreateRoomModal(false)} onCreate={handleCreateRoom} />}

      {currentRoom && (
        <VoiceRoom 
           room={currentRoom} currentUser={user!} onUpdateUser={handleUpdateUser} onLeave={handleRoomLeave} onMinimize={() => setIsRoomMinimized(true)} 
           gifts={gifts} onEditProfile={() => setShowEditProfileModal(true)} gameSettings={gameSettings} onUpdateRoom={handleUpdateRoom} 
           isMuted={isUserMuted} onToggleMute={() => setIsUserMuted(!isUserMuted)} onAnnouncement={triggerAnnouncement} users={users} setUsers={() => {}}
        />
      )}

      {showAdminPanel && user && <AdminPanel isOpen={showAdminPanel} onClose={() => setShowAdminPanel(false)} currentUser={user} users={users} onUpdateUser={handleUpdateUser} rooms={rooms} setRooms={() => {}} onUpdateRoom={handleUpdateRoom} gifts={gifts} setGifts={() => {}} storeItems={storeItems} setStoreItems={() => {}} vipLevels={vipLevels} setVipLevels={() => {}} gameSettings={gameSettings} setGameSettings={() => {}} appBanner={appBanner} onUpdateAppBanner={(url) => setAppBanner(url)} />}
    </div>
  );
}
