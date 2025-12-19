
import React, { useState, useEffect, useMemo } from 'react';
import { Home, User as UserIcon, Plus, Bell, Crown, Gem, Settings, ChevronRight, Edit3, Share2, LogOut, Shield, Database, ShoppingBag, Camera, Trophy, Flame, Sparkles, UserX, Star, ShieldCheck, MapPin, Wallet } from 'lucide-react';
import RoomCard from './components/RoomCard';
import VoiceRoom from './components/VoiceRoom';
import AuthScreen from './components/AuthScreen';
import Toast, { ToastMessage } from './components/Toast';
import VIPModal from './components/VIPModal';
import EditProfileModal from './components/EditProfileModal';
import BagModal from './components/BagModal';
import CreateRoomModal from './components/CreateRoomModal';
import MiniPlayer from './components/MiniPlayer';
import GlobalBanner from './components/GlobalBanner';
import AdminPanel from './components/AdminPanel';
import WalletModal from './components/WalletModal';
import { DEFAULT_VIP_LEVELS, DEFAULT_GIFTS, DEFAULT_STORE_ITEMS } from './constants';
import { Room, User, VIPPackage, UserLevel, Gift, StoreItem, GameSettings, GlobalAnnouncement } from './types';
import { AnimatePresence, motion } from 'framer-motion';
import { db } from './services/firebase';
import { collection, onSnapshot, doc, setDoc, query, orderBy, limit, addDoc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'profile' | 'rank'>('home');
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [isRoomMinimized, setIsRoomMinimized] = useState(false);
  const [isUserMuted, setIsUserMuted] = useState(true);
  
  // Real Database State
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]); 
  const [gifts, setGifts] = useState<Gift[]>(DEFAULT_GIFTS);
  const [storeItems, setStoreItems] = useState<StoreItem[]>(DEFAULT_STORE_ITEMS);
  const [vipLevels, setVipLevels] = useState<VIPPackage[]>(DEFAULT_VIP_LEVELS);
  const [announcement, setAnnouncement] = useState<GlobalAnnouncement | null>(null);
  
  const [appBanner, setAppBanner] = useState('https://img.freepik.com/free-vector/gradient-music-festival-twitch-banner_23-2149051838.jpg');

  const [gameSettings, setGameSettings] = useState<GameSettings>({
     slotsWinRate: 35,
     wheelWinRate: 45,
     luckyGiftWinRate: 30,
     luckyGiftRefundPercent: 200,
     luckyXEnabled: true,
     luckyMultipliers: [
        { label: 'X10', value: 10, chance: 70 },
        { label: 'X50', value: 50, chance: 20 },
        { label: 'X100', value: 100, chance: 8 },
        { label: 'X500', value: 500, chance: 2 },
     ],
     wheelJackpotX: 8,
     wheelNormalX: 2,
     slotsSevenX: 20,
     slotsFruitX: 5
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [showVIPModal, setShowVIPModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showBagModal, setShowBagModal] = useState(false);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);

  // حساب كبار الداعمين من قاعدة البيانات مباشرة (المستخدمين الحقيقيين فقط)
  const topContributors = useMemo(() => {
    return [...users]
      .filter(u => (u.wealth || 0) > 0)
      .sort((a, b) => (b.wealth || 0) - (a.wealth || 0))
      .slice(0, 10);
  }, [users]);

  useEffect(() => {
    // 1. استماع لإعدادات التطبيق العامة
    const unsubSettings = onSnapshot(doc(db, 'appSettings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.appBanner) setAppBanner(data.appBanner);
        if (data.gameSettings) setGameSettings(data.gameSettings);
      }
    });

    // 2. استماع لجميع المستخدمين الحقيقيين من Firestore
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setUsers(usersData);
    });

    // 3. استماع للغرف الحقيقية
    const qRooms = query(collection(db, 'rooms'), orderBy('listeners', 'desc'));
    const unsubRooms = onSnapshot(qRooms, (snapshot) => {
      const roomsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
      setRooms(roomsData);
    });

    // 4. استماع لمستويات الـ VIP من قاعدة البيانات
    const unsubVip = onSnapshot(doc(db, 'appSettings', 'vip'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.levels) setVipLevels(data.levels);
      }
    });

    // 5. استماع للهدايا من قاعدة البيانات
    const unsubGifts = onSnapshot(doc(db, 'appSettings', 'gifts'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.gifts) setGifts(data.gifts);
      }
    });

    // 6. استماع للمتجر من قاعدة البيانات
    const unsubStore = onSnapshot(doc(db, 'appSettings', 'store'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.items) setStoreItems(data.items);
      }
    });

    // التحقق من الجلسة ومزامنة بيانات المستخدم الحالي
    const savedUser = localStorage.getItem('voice_chat_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      getDoc(doc(db, 'users', parsedUser.id)).then((docSnap) => {
        if (docSnap.exists()) {
          const freshUser = docSnap.data() as User;
          setUser(freshUser);
        }
      });
    }
    
    setInitializing(false);
    return () => {
      unsubSettings();
      unsubRooms();
      unsubUsers();
      unsubVip();
      unsubGifts();
      unsubStore();
    };
  }, []);

  const handleAdminUpdateUser = async (userId: string, data: Partial<User>) => {
    try {
        await setDoc(doc(db, 'users', userId), data, { merge: true });
    } catch (err) {
        addToast("فشل تحديث البيانات", "error");
    }
  };

  const handleAuth = async (userData: User) => {
    setUser(userData);
    localStorage.setItem('voice_chat_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    if (confirm("هل أنت متأكد من تسجيل الخروج؟")) {
      setUser(null);
      setCurrentRoom(null);
      localStorage.removeItem('voice_chat_user');
      addToast("تم تسجيل الخروج بنجاح", "info");
      setActiveTab('home');
    }
  };

  const handleCreateRoom = async (roomData: any) => {
    if (!user) return;
    const newRoom = { 
        ...roomData, 
        hostId: user.id, 
        listeners: 1, 
        speakers: [{ ...user, seatIndex: 0 }],
        createdAt: serverTimestamp()
    };
    try {
      await addDoc(collection(db, 'rooms'), newRoom);
      addToast("تم إنشاء الغرفة بنجاح! 🎙️", "success");
      setShowCreateRoomModal(false);
    } catch (error) {
      addToast("فشل في إنشاء الغرفة", "error");
    }
  };

  const handleUpdateRoom = async (roomId: string, data: Partial<Room>) => {
    try {
      await setDoc(doc(db, 'rooms', roomId), data, { merge: true });
    } catch (error) {
      console.error("Error updating room:", error);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    try {
      await deleteDoc(doc(db, 'rooms', roomId));
      addToast("تم حذف الغرفة بنجاح", "success");
    } catch (error) {
      addToast("فشل حذف الغرفة", "error");
    }
  };

  const handleRoomJoin = async (room: Room) => {
    if (!user) return;
    if (user.isBanned) {
      addToast("عذراً، حسابك محظور!", "error");
      return;
    }
    setCurrentRoom(room);
    setIsRoomMinimized(false);
    setIsUserMuted(true);
    await handleUpdateRoom(room.id, { listeners: (room.listeners || 0) + 1 });
  };

  const handleRoomLeave = () => {
    if (currentRoom) {
      handleUpdateRoom(currentRoom.id, { listeners: Math.max(0, (currentRoom.listeners || 1) - 1) });
    }
    setCurrentRoom(null);
    setIsRoomMinimized(false);
  };

  const handleUpdateUser = async (updatedData: Partial<User>) => {
    if (!user) return;
    const newUser = { ...user, ...updatedData };
    setUser(newUser);
    localStorage.setItem('voice_chat_user', JSON.stringify(newUser));
    try {
      await setDoc(doc(db, 'users', user.id), updatedData, { merge: true });
    } catch (err) {
      console.error("Failed to sync user data", err);
    }
  };

  const addToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const triggerAnnouncement = (ann: GlobalAnnouncement) => {
    setAnnouncement(ann);
    setTimeout(() => setAnnouncement(null), 8000);
  };

  const handleUpdateBanner = async (newUrl: string) => {
    setAppBanner(newUrl);
    try {
      await setDoc(doc(db, 'appSettings', 'global'), { appBanner: newUrl }, { merge: true });
      addToast("تم تحديث البنر", "success");
    } catch (error) {
      addToast("فشل التحديث", "error");
    }
  };

  if (initializing) {
    return (
      <div className="h-[100dvh] w-full bg-[#0f172a] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return <AuthScreen onAuth={handleAuth} />;

  return (
    <div className="h-[100dvh] w-full bg-[#0f172a] text-white relative md:max-w-md mx-auto shadow-2xl overflow-hidden flex flex-col font-cairo">
      <Toast toasts={toasts} onRemove={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
      
      <AnimatePresence>
        {announcement && <GlobalBanner announcement={announcement} />}
      </AnimatePresence>

      <AnimatePresence>
        {showAdminPanel && (
          <AdminPanel 
            isOpen={showAdminPanel} onClose={() => setShowAdminPanel(false)}
            currentUser={user} users={users} onUpdateUser={handleAdminUpdateUser}
            rooms={rooms} setRooms={setRooms} onUpdateRoom={handleUpdateRoom} onDeleteRoom={handleDeleteRoom}
            gifts={gifts} setGifts={setGifts} storeItems={storeItems} setStoreItems={setStoreItems}
            vipLevels={vipLevels} setVipLevels={setVipLevels}
            gameSettings={gameSettings} setGameSettings={setGameSettings}
            appBanner={appBanner} onUpdateAppBanner={handleUpdateBanner}
          />
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto pb-20 scrollbar-hide">
        {activeTab === 'home' && (
           <div className="mt-2 space-y-3">
              <div className="px-4">
                 <div className="relative w-full h-28 rounded-2xl overflow-hidden shadow-lg border border-white/10">
                   <img src={appBanner} className="w-full h-full object-cover" alt="Banner" />
                 </div>
              </div>

              {/* قسم كبار الداعمين الحقيقيين من قاعدة البيانات */}
              <div className="px-4">
                 <div className="flex justify-between items-center mb-2">
                   <h2 className="text-xs font-bold text-white flex items-center gap-1.5"><Trophy size={14} className="text-yellow-500" /> كبار الداعمين</h2>
                   <ChevronRight size={12} className="text-slate-500" />
                 </div>
                 <div className="bg-slate-900/50 p-2 rounded-xl border border-white/5 backdrop-blur-sm overflow-x-auto">
                   <div className="flex gap-3 min-w-max">
                     {topContributors.length > 0 ? topContributors.map((contributor, idx) => (
                       <div key={contributor.id} className="flex flex-col items-center gap-1 min-w-[60px]">
                         <div className="relative">
                           <div className={`w-12 h-12 rounded-full p-[2px] ${idx === 0 ? 'bg-gradient-to-tr from-yellow-300 to-yellow-600 shadow-lg shadow-amber-500/20' : 'bg-slate-700'}`}>
                             <img src={contributor.avatar} className="w-full h-full rounded-full object-cover border-2 border-slate-900" alt={contributor.name} />
                           </div>
                           <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold border-2 border-slate-900 text-white ${idx === 0 ? 'bg-yellow-500' : 'bg-slate-500'}`}>{idx + 1}</div>
                         </div>
                         <span className="text-[9px] font-bold text-white max-w-[60px] truncate">{contributor.name}</span>
                       </div>
                     )) : (
                       <div className="text-[10px] text-slate-500 py-4 px-2">لا يوجد مساهمين بعد</div>
                     )}
                   </div>
                 </div>
              </div>

              <div className="px-4">
                 <div className="flex justify-between items-center mb-2">
                   <h2 className="text-xs font-bold text-white flex items-center gap-1.5"><Flame size={14} className="text-orange-500" /> الغرف النشطة</h2>
                 </div>
                 <div className="grid gap-2.5">
                   {rooms.length > 0 ? rooms.map(room => (
                     <RoomCard key={room.id} room={room} onClick={handleRoomJoin} />
                   )) : (
                     <div className="text-center text-slate-500 py-10 text-xs">لا توجد غرف متاحة حالياً</div>
                   )}
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'profile' && user && (
           <div className="relative">
              <div className="h-40 bg-slate-900 relative overflow-hidden">
                {user.cover ? <img src={user.cover} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-r from-indigo-900 to-slate-900"></div>}
                <button onClick={() => setShowEditProfileModal(true)} className="absolute top-4 left-4 p-2 bg-black/40 rounded-full text-white"><Camera size={18} /></button>
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
                    <p className="text-slate-300 text-sm mt-3">{user.bio}</p>
                 </div>
                 <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 rounded-2xl border border-white/5 mb-6 flex justify-between items-center">
                    <div>
                       <div className="text-xs text-slate-400">رصيد العملات</div>
                       <div className="font-bold text-lg text-yellow-400">{(user.coins ?? 0).toLocaleString()} 🪙</div>
                    </div>
                    <button onClick={() => setShowWalletModal(true)} className="px-4 py-2 bg-amber-500 text-black text-xs font-black rounded-xl active:scale-95 shadow-lg shadow-amber-900/20">شحن</button>
                 </div>
                 <div className="bg-slate-900 rounded-2xl border border-white/5 overflow-hidden">
                    {user.isAdmin && (
                      <div onClick={() => setShowAdminPanel(true)} className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-red-500/5 cursor-pointer">
                        <div className="flex items-center gap-3"><ShieldCheck size={18} className="text-red-500" /><span className="text-sm font-black text-red-500">لوحة الإدارة</span></div>
                      </div>
                    )}
                    <div onClick={() => setShowWalletModal(true)} className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer">
                      <div className="flex items-center gap-3"><Wallet size={18} className="text-indigo-500" /><span className="text-sm font-medium">المحفظة الإلكترونية</span></div>
                      <div className="flex items-center gap-1.5"><span className="text-[10px] text-slate-500">أرصدتي</span><ChevronRight size={14} className="text-slate-700" /></div>
                    </div>
                    <div onClick={() => setShowEditProfileModal(true)} className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer">
                      <div className="flex items-center gap-3"><Edit3 size={18} className="text-emerald-500" /><span className="text-sm font-medium">تعديل الحساب</span></div>
                    </div>
                    <div onClick={() => setShowBagModal(true)} className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer">
                      <div className="flex items-center gap-3"><ShoppingBag size={18} className="text-blue-500" /><span className="text-sm font-medium">المتجر والحقيبة</span></div>
                    </div>
                    <div onClick={() => setShowVIPModal(true)} className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer">
                      <div className="flex items-center gap-3"><Crown size={18} className="text-amber-500" /><span className="text-sm font-medium">عضوية VIP</span></div>
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
      <AnimatePresence>
        {showWalletModal && user && <WalletModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} user={user} />}
      </AnimatePresence>

      {currentRoom && (
        <div className={isRoomMinimized ? 'invisible absolute' : 'visible pointer-events-auto'}>
           <VoiceRoom 
              room={currentRoom} currentUser={user!} onUpdateUser={handleUpdateUser} 
              onLeave={handleRoomLeave} onMinimize={() => setIsRoomMinimized(true)} 
              gifts={gifts} onEditProfile={() => setShowEditProfileModal(true)} 
              gameSettings={gameSettings} onUpdateRoom={handleUpdateRoom} 
              isMuted={isUserMuted} onToggleMute={() => setIsUserMuted(!isUserMuted)}
              onAnnouncement={triggerAnnouncement} users={users} setUsers={setUsers}
           />
        </div>
      )}

      {isRoomMinimized && currentRoom && <MiniPlayer room={currentRoom} onExpand={() => setIsRoomMinimized(false)} onLeave={handleRoomLeave} isMuted={isUserMuted} onToggleMute={() => setIsUserMuted(!isUserMuted)} />}
    </div>
  );
}
