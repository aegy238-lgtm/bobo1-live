
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, ShieldCheck, Search, Ban, Coins, 
  Settings2, X, Crown, Layout, Save,
  Edit3, Trash2, Gift as GiftIcon, ShoppingBag, Gamepad2, Plus,
  TrendingUp, Key, Truck, Eraser, Unlock, UserPlus, UserMinus,
  Image as ImageIcon, Camera, Star, Zap, RefreshCcw, Database, Upload, Trash, Clover, Settings
} from 'lucide-react';
import { User, Room, Gift, StoreItem, GameSettings, VIPPackage, LuckyMultiplier } from '../types';
import { db } from '../services/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  users: User[];
  onUpdateUser: (userId: string, data: Partial<User>) => Promise<void>;
  rooms: Room[];
  setRooms: (rooms: Room[]) => void;
  onUpdateRoom: (roomId: string, data: Partial<Room>) => Promise<void>;
  onDeleteRoom?: (roomId: string) => Promise<void>;
  gifts: Gift[];
  setGifts: (gifts: Gift[]) => void;
  storeItems: StoreItem[];
  setStoreItems: (items: StoreItem[]) => void;
  vipLevels: VIPPackage[];
  setVipLevels: (levels: VIPPackage[]) => void;
  gameSettings: GameSettings;
  setGameSettings: (settings: GameSettings) => void;
  appBanner: string;
  onUpdateAppBanner: (url: string) => void;
}

type AdminTab = 'users' | 'rooms' | 'gifts' | 'store' | 'vip' | 'games' | 'general';

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  isOpen, onClose, currentUser, users = [], onUpdateUser, rooms = [], setRooms, onUpdateRoom, onDeleteRoom, gifts = [], setGifts, storeItems = [], setStoreItems, vipLevels = [], setVipLevels, gameSettings, setGameSettings, appBanner, onUpdateAppBanner
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newCustomId, setNewCustomId] = useState<string>('');
  const [coinAmount, setCoinAmount] = useState<number>(0);
  
  const [modalType, setModalType] = useState<'gift' | 'store' | 'vip' | 'edit_room' | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [isRefreshingServer, setIsRefreshingServer] = useState(false);

  if (!isOpen || !currentUser.isAdmin) return null;

  // --- تفعيل السيرفر ---
  const handleActivateServer = async () => {
    setIsRefreshingServer(true);
    try {
      await setDoc(doc(db, 'appSettings', 'global'), { 
        lastServerActivation: serverTimestamp(),
        serverStatus: 'active',
        refreshSignal: Math.random() 
      }, { merge: true });
      
      setTimeout(() => {
        setIsRefreshingServer(false);
        alert('تم تنشيط السيرفر ومزامنة كافة البيانات بنجاح ✅');
      }, 1500);
    } catch (err) {
      setIsRefreshingServer(false);
      alert('فشل تنشيط السيرفر');
    }
  };

  // --- حفظ إعدادات الألعاب والمضاعفات ---
  const handleSaveGameSettings = async () => {
    try {
      await setDoc(doc(db, 'appSettings', 'global'), { gameSettings }, { merge: true });
      alert('تم حفظ إعدادات الألعاب والمضاعفات بنجاح ✅');
    } catch (err) {
      alert('فشل حفظ الإعدادات');
    }
  };

  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) setPreviewImage(event.target.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onUpdateAppBanner(event.target.result as string);
          alert('تم رفع البنر بنجاح ✅');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveItem = async () => {
    const nameInput = document.getElementById('m-name') as HTMLInputElement;
    const costInput = document.getElementById('m-cost') as HTMLInputElement;

    if (modalType === 'store') {
      const type = (document.getElementById('m-type') as HTMLSelectElement).value;
      const url = previewImage || editingItem?.url;

      let updatedStore;
      if (editingItem) {
        updatedStore = storeItems.map(s => s.id === editingItem.id ? { ...s, name: nameInput.value, price: parseInt(costInput.value), url, type: type as any } : s);
      } else {
        updatedStore = [...storeItems, { id: 'st_' + Date.now(), name: nameInput.value, price: parseInt(costInput.value), url, type: type as any }];
      }
      setStoreItems(updatedStore);
      await setDoc(doc(db, 'appSettings', 'store'), { items: updatedStore }, { merge: true });
    } 
    else if (modalType === 'vip') {
        const frameUrl = previewImage || editingItem?.frameUrl;
        const nameStyle = (document.getElementById('m-style') as HTMLTextAreaElement).value;
        const updatedVIP = vipLevels.map(v => v.level === editingItem.level ? { ...v, name: nameInput.value, cost: parseInt(costInput.value), frameUrl, nameStyle } : v);
        setVipLevels(updatedVIP);
        await setDoc(doc(db, 'appSettings', 'vip'), { levels: updatedVIP }, { merge: true });
    } 
    else if (modalType === 'edit_room') {
      const thumbnail = previewImage || editingItem.thumbnail;
      await onUpdateRoom(editingItem.id, { title: nameInput.value, thumbnail });
    } 
    else if (modalType === 'gift') {
        const icon = previewImage || editingItem?.icon;
        const animationType = (document.getElementById('m-anim') as HTMLSelectElement).value;
        const category = (document.getElementById('m-cat') as HTMLSelectElement).value;
        
        let updatedGifts;
        if (editingItem) {
          updatedGifts = gifts.map(g => g.id === editingItem.id ? { ...g, name: nameInput.value, cost: parseInt(costInput.value), icon, animationType: animationType as any, category: category as any } : g);
        } else {
          updatedGifts = [...gifts, { id: Date.now().toString(), name: nameInput.value, cost: parseInt(costInput.value), icon, animationType: animationType as any, category: category as any, isLucky: category === 'lucky' }];
        }
        setGifts(updatedGifts);
        await setDoc(doc(db, 'appSettings', 'gifts'), { gifts: updatedGifts }, { merge: true });
    }

    setModalType(null);
    setEditingItem(null);
    setPreviewImage('');
    alert('تم الحفظ بنجاح ✅');
  };

  const handleDeleteGift = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الهدية؟')) {
      const updated = gifts.filter(g => g.id !== id);
      setGifts(updated);
      await setDoc(doc(db, 'appSettings', 'gifts'), { gifts: updated }, { merge: true });
      alert('تم الحذف ✅');
    }
  };

  const handleDeleteStoreItem = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا العنصر؟')) {
      const updated = storeItems.filter(s => s.id !== id);
      setStoreItems(updated);
      await setDoc(doc(db, 'appSettings', 'store'), { items: updated }, { merge: true });
      alert('تم الحذف ✅');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] bg-[#020617] flex flex-col md:flex-row font-cairo overflow-hidden text-right" dir="rtl">
      
      {/* Sidebar */}
      <div className="w-full md:w-72 bg-slate-950 border-l border-white/5 flex flex-col shrink-0">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg"><ShieldCheck size={22} className="text-white" /></div>
            <h1 className="font-black text-white text-lg">لوحة التحكم</h1>
          </div>
          <button onClick={onClose} className="md:hidden text-slate-400"><X size={24}/></button>
        </div>
        <nav className="flex md:flex-col p-2 md:p-4 space-x-2 md:space-x-0 md:space-y-1 overflow-x-auto md:overflow-y-auto">
          {[
            { id: 'users', label: 'مركز الأعضاء', icon: Users, color: 'text-blue-400' },
            { id: 'rooms', label: 'مركز الغرف', icon: Layout, color: 'text-emerald-400' },
            { id: 'vip', label: 'مركز الـ VIP', icon: Crown, color: 'text-amber-400' },
            { id: 'gifts', label: 'صندوق الهدايا', icon: GiftIcon, color: 'text-pink-400' },
            { id: 'store', label: 'مركز المتجر', icon: ShoppingBag, color: 'text-cyan-400' },
            { id: 'games', label: 'الألعاب & الحظ', icon: Gamepad2, color: 'text-orange-400' },
            { id: 'general', label: 'الإعدادات', icon: Settings2, color: 'text-purple-400' },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as AdminTab)} className={`flex items-center gap-3 px-4 py-4 rounded-2xl transition-all whitespace-nowrap md:w-full ${activeTab === item.id ? 'bg-white/10 text-white shadow-xl' : 'text-slate-500 hover:bg-white/5'}`}>
              <item.icon size={20} className={activeTab === item.id ? item.color : 'text-slate-600'} />
              <span className="text-sm font-black">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 bg-slate-900/40 overflow-y-auto p-4 md:p-10 custom-scrollbar pb-24">
        
        {/* USERS - مركز الأعضاء */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="relative max-w-md">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input type="text" placeholder="بحث باسم المستخدم أو الـ ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-3.5 pr-12 text-white text-sm outline-none shadow-xl" />
            </div>
            <div className="bg-slate-950/40 rounded-[2rem] border border-white/5 overflow-x-auto">
              <table className="w-full text-right min-w-[700px]">
                <thead className="bg-black/40 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                  <tr><th className="p-5">العضو</th><th className="p-5 text-center">ID</th><th className="p-5 text-center">الرصيد</th><th className="p-5 text-center">إدارة</th></tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users?.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.id.includes(searchQuery) || u.customId?.toString().includes(searchQuery)).map(u => (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors text-white">
                      <td className="p-5 flex items-center gap-3"><img src={u.avatar} className="w-10 h-10 rounded-full" alt=""/><span className="font-black text-sm">{u.name}</span></td>
                      <td className="p-5 text-center text-xs text-slate-400">{u.customId || u.id}</td>
                      <td className="p-5 text-center text-xs text-yellow-500 font-black">🪙 {u.coins?.toLocaleString()}</td>
                      <td className="p-5 text-center"><button onClick={() => setSelectedUser(u)} className="p-2.5 bg-blue-600/10 text-blue-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Settings2 size={18}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ROOMS - مركز الغرف */}
        {activeTab === 'rooms' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms?.map(room => (
              <div key={room.id} className="bg-slate-950/60 rounded-[2.5rem] border border-white/5 overflow-hidden group shadow-2xl">
                <div className="relative h-44"><img src={room.thumbnail} className="w-full h-full object-cover" alt=""/><div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent"></div><div className="absolute bottom-4 right-4"><h3 className="text-white font-black text-lg">{room.title}</h3></div></div>
                <div className="p-5 flex justify-between gap-3 bg-black/20">
                  <button onClick={() => { setEditingItem(room); setModalType('edit_room'); setPreviewImage(room.thumbnail); }} className="flex-1 py-3 bg-blue-600/10 text-blue-400 rounded-2xl text-xs font-black hover:bg-blue-600 hover:text-white transition-all">تعديل</button>
                  <button onClick={() => onDeleteRoom?.(room.id)} className="flex-1 py-3 bg-red-600/10 text-red-500 rounded-2xl text-xs font-black hover:bg-red-600 hover:text-white transition-all">حذف</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* GIFTS - صندوق الهدايا */}
        {activeTab === 'gifts' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center bg-slate-950/50 p-6 rounded-[2rem] border border-white/5 shadow-xl">
               <h3 className="text-2xl font-black text-white">إدارة صندوق الهدايا</h3>
               <button onClick={() => { setEditingItem(null); setModalType('gift'); setPreviewImage(''); }} className="bg-pink-600 text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl active:scale-95 transition-all"><Plus size={20}/> إضافة هدية</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
              {gifts?.map(gift => (
                <div key={gift.id} className="bg-slate-950/60 p-5 rounded-[2.5rem] border border-white/5 flex flex-col items-center gap-4 group relative shadow-xl">
                  <div className="absolute top-3 left-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingItem(gift); setModalType('gift'); setPreviewImage(gift.icon); }} className="p-2 bg-blue-600/20 text-blue-400 rounded-xl hover:bg-blue-600 hover:text-white"><Edit3 size={14}/></button>
                    <button onClick={() => handleDeleteGift(gift.id)} className="p-2 bg-red-600/20 text-red-500 rounded-xl hover:bg-red-600 hover:text-white"><Trash size={14}/></button>
                  </div>
                  <div className="w-16 h-16 flex items-center justify-center bg-black/40 rounded-2xl p-2">
                     {gift.icon.startsWith('http') || gift.icon.startsWith('data:') ? <img src={gift.icon} className="w-full h-full object-contain" alt=""/> : <span className="text-4xl">{gift.icon}</span>}
                  </div>
                  <div className="text-center"><h4 className="text-white font-black text-sm mb-1">{gift.name}</h4><span className="text-yellow-500 font-black text-xs">🪙 {gift.cost}</span></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STORE - مركز المتجر */}
        {activeTab === 'store' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center bg-slate-950/50 p-6 rounded-[2rem] border border-white/5 shadow-xl">
              <h3 className="text-2xl font-black text-white">إدارة المتجر</h3>
              <button onClick={() => { setEditingItem(null); setModalType('store'); setPreviewImage(''); }} className="bg-cyan-600 text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl active:scale-95 transition-all"><Plus size={20}/> إضافة عنصر</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {storeItems?.map(item => (
                <div key={item.id} className="bg-slate-950/60 p-6 rounded-[2.5rem] border border-white/5 flex flex-col items-center gap-4 group relative shadow-xl">
                  <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingItem(item); setModalType('store'); setPreviewImage(item.url); }} className="p-2 bg-blue-600/20 text-blue-400 rounded-xl"><Edit3 size={16}/></button>
                    <button onClick={() => handleDeleteStoreItem(item.id)} className="p-2 bg-red-600/20 text-red-500 rounded-xl"><Trash size={16}/></button>
                  </div>
                  <div className="w-20 h-20 bg-black/40 rounded-full border border-white/10 p-2"><img src={item.url} className="w-full h-full object-contain" alt=""/></div>
                  <div className="text-center"><h4 className="text-white font-black text-sm mb-1">{item.name}</h4><span className="text-yellow-500 font-black text-xs">🪙 {item.price.toLocaleString()}</span></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIP CENTER - مركز الـ VIP */}
        {activeTab === 'vip' && (
          <div className="space-y-8">
            <div className="bg-gradient-to-l from-amber-600/20 to-transparent p-8 rounded-[2.5rem] border border-amber-500/10 mb-8">
               <h3 className="text-2xl font-black text-white mb-2">إدارة مستويات الـ VIP</h3>
               <p className="text-xs text-slate-400">تحكم في جميع مستويات الـ VIP الـ 12 وتعديل إطاراتها.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vipLevels?.map(vip => (
                <div key={vip.level} className="bg-slate-950/60 p-6 rounded-[2.5rem] border border-white/5 relative group shadow-xl">
                  <div className="absolute top-6 left-6"><button onClick={() => { setEditingItem(vip); setModalType('vip'); setPreviewImage(vip.frameUrl); }} className="p-2.5 bg-amber-600/10 text-amber-500 rounded-xl hover:bg-amber-600 hover:text-white transition-all"><Edit3 size={18}/></button></div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 relative"><img src={vip.frameUrl} className="w-full h-full object-contain scale-125 z-10" /><div className="absolute inset-2 bg-slate-800 rounded-full -z-0"></div></div>
                    <div><h4 className={`text-lg font-black ${vip.color}`}>{vip.name}</h4><span className="text-[10px] text-slate-500 font-bold uppercase">LEVEL {vip.level}</span></div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center px-4 py-2 bg-black/30 rounded-xl"><span className="text-[10px] text-slate-400 font-black">سعر الشراء</span><span className="text-sm text-yellow-500 font-black">🪙 {vip.cost.toLocaleString()}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GAMES - الألعاب & الحظ */}
        {activeTab === 'games' && (
          <div className="max-w-4xl mx-auto space-y-10">
            <div className="bg-slate-950/80 p-8 md:p-10 rounded-[3rem] border border-emerald-500/20 shadow-2xl space-y-8">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3"><div className="p-3 bg-emerald-600/20 text-emerald-400 rounded-2xl"><Clover size={24}/></div><h3 className="text-2xl font-black text-white">مضاعفات هدايا الحظ (X)</h3></div>
                  <button onClick={() => setGameSettings({...gameSettings, luckyXEnabled: !gameSettings.luckyXEnabled})} className={`px-6 py-2 rounded-full font-black text-xs transition-all ${gameSettings.luckyXEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-500'}`}>{gameSettings.luckyXEnabled ? 'مفعّل ✅' : 'معطّل ❌'}</button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {gameSettings.luckyMultipliers?.map((mul, idx) => (
                    <div key={idx} className="bg-black/40 p-6 rounded-[2rem] border border-white/5 space-y-4">
                       <div className="flex justify-between text-xs font-black text-slate-400"><span>المضاعف: <span className="text-emerald-400">{mul.label}</span></span><span>الاحتمالية: {mul.chance}%</span></div>
                       <input type="range" min="0" max="100" value={mul.chance} onChange={(e) => {
                          const newMuls = [...gameSettings.luckyMultipliers];
                          newMuls[idx].chance = parseInt(e.target.value);
                          setGameSettings({...gameSettings, luckyMultipliers: newMuls});
                       }} className="w-full h-1.5 accent-emerald-500 rounded-full" />
                    </div>
                  ))}
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/5">
                  {[
                    { label: 'نسبة فوز العجلة (%)', key: 'wheelWinRate', color: 'accent-orange-500' },
                    { label: 'نسبة فوز السلوتس (%)', key: 'slotsWinRate', color: 'accent-pink-500' },
                    { label: 'نسبة فوز هدايا الحظ (%)', key: 'luckyGiftWinRate', color: 'accent-emerald-500' },
                  ].map(setting => (
                    <div key={setting.key} className="space-y-3">
                      <div className="flex justify-between text-[10px] font-black text-slate-400"><span>{setting.label}</span><span className="text-white">{(gameSettings as any)?.[setting.key]}%</span></div>
                      <input type="range" min="1" max="100" value={(gameSettings as any)?.[setting.key]} onChange={(e) => setGameSettings({ ...gameSettings, [setting.key]: parseInt(e.target.value) })} className={`w-full h-1.5 rounded-full ${setting.color}`} />
                    </div>
                  ))}
               </div>
               <button onClick={handleSaveGameSettings} className="w-full py-5 bg-orange-600 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all"><Save size={20}/> حفظ إعدادات الحظ والألعاب</button>
            </div>
          </div>
        )}

        {/* GENERAL - الإعدادات العامة */}
        {activeTab === 'general' && (
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="bg-gradient-to-br from-slate-950 to-blue-950 p-10 rounded-[3rem] border border-blue-500/20 shadow-2xl flex items-center gap-8">
                <div className="w-20 h-20 bg-blue-600/20 rounded-[2rem] flex items-center justify-center text-blue-400 border border-blue-500/30"><Database size={40} className={isRefreshingServer ? 'animate-spin' : ''} /></div>
                <div className="flex-1"><h3 className="text-2xl font-black text-white mb-2">تنشيط السيرفر</h3><p className="text-sm text-slate-400">تحديث كافة البيانات ومزامنة النظام.</p></div>
                <button onClick={handleActivateServer} disabled={isRefreshingServer} className={`px-10 py-5 rounded-2xl font-black text-sm transition-all ${isRefreshingServer ? 'bg-slate-800 text-slate-500' : 'bg-blue-600 text-white shadow-blue-900/40'}`}>{isRefreshingServer ? <RefreshCcw size={20} className="animate-spin" /> : <Zap size={20} />} تنشيط الآن</button>
            </div>
            <div className="bg-slate-950/60 p-10 rounded-[3rem] border border-white/5 space-y-8 shadow-2xl">
               <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-white">بنر التطبيق الرئيسي</h3>
                  <label className="bg-purple-600/20 text-purple-400 px-6 py-3 rounded-xl font-black text-xs border border-purple-500/30 cursor-pointer hover:bg-purple-600 hover:text-white transition-all flex items-center gap-2">
                    <Upload size={16}/> رفع بنر جديد من الجوال
                    <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                  </label>
               </div>
               <div className="relative aspect-[21/9] rounded-[2.5rem] overflow-hidden border border-white/10">
                  <img src={appBanner} className="w-full h-full object-cover" alt="Banner" />
               </div>
            </div>
          </div>
        )}

      </div>

      {/* SHARED MODAL */}
      <AnimatePresence>
        {modalType && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-950 border border-white/10 rounded-[3.5rem] w-full max-w-md p-10 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-white">{editingItem ? 'تعديل' : 'إضافة'} {modalType === 'gift' ? 'هدية' : modalType === 'store' ? 'عنصر متجر' : modalType === 'vip' ? 'باقة VIP' : 'غرفة'}</h3>
                <button onClick={() => { setModalType(null); setEditingItem(null); setPreviewImage(''); }} className="p-3 text-slate-400 hover:text-white bg-white/5 rounded-full"><X size={24}/></button>
              </div>
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-4 p-8 bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-white/10 relative cursor-pointer group hover:border-blue-500/50 transition-all">
                  {previewImage ? (
                    <div className="w-32 h-32 relative">
                      <img src={previewImage} className="w-full h-full object-contain drop-shadow-2xl" alt="Preview"/>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-500"><Camera size={40} /><span className="text-xs font-black">ارفع من جوالك</span></div>
                  )}
                  <input type="file" accept="image/*" onChange={handleLocalImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                <div className="space-y-4">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 px-2">الاسم</label>
                      <input type="text" id="m-name" defaultValue={editingItem?.name || editingItem?.title} className="w-full bg-slate-900 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm outline-none" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 px-2">التكلفة / السعر (🪙)</label>
                      <input type="number" id="m-cost" defaultValue={editingItem?.cost || editingItem?.price} className="w-full bg-slate-900 border border-white/10 rounded-2xl px-6 py-4 text-yellow-500 font-black text-sm outline-none" />
                   </div>
                   {modalType === 'gift' && (
                     <div className="grid grid-cols-2 gap-3">
                        <select id="m-anim" defaultValue={editingItem?.animationType || 'pop'} className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-4 text-white text-xs">
                           <option value="pop">Pop</option><option value="fly">Fly</option><option value="full-screen">Full Screen</option>
                        </select>
                        <select id="m-cat" defaultValue={editingItem?.category || 'popular'} className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-4 text-white text-xs">
                           <option value="popular">شائع</option><option value="exclusive">مميز</option><option value="lucky">الحظ 🍀</option>
                        </select>
                     </div>
                   )}
                   {modalType === 'store' && (
                      <select id="m-type" defaultValue={editingItem?.type || 'frame'} className="w-full bg-slate-900 border border-white/10 rounded-2xl px-6 py-4 text-white text-xs">
                         <option value="frame">إطار</option><option value="bubble">فقاعة</option>
                      </select>
                   )}
                   {modalType === 'vip' && (
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 px-2">تنسيق الاسم (CSS Classes)</label>
                        <textarea id="m-style" defaultValue={editingItem?.nameStyle} className="w-full bg-slate-900 border border-white/10 rounded-2xl px-6 py-4 text-amber-400 text-xs font-mono outline-none min-h-[80px]" placeholder="مثال: text-amber-500 font-black..." />
                     </div>
                   )}
                </div>
                <button onClick={handleSaveItem} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all">حفظ التغييرات</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* USER MANAGEMENT MODAL */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-950 border border-white/10 rounded-[3rem] w-full max-w-2xl p-8 space-y-8 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center border-b border-white/5 pb-6">
                <div className="flex items-center gap-4 text-right"><img src={selectedUser.avatar} className="w-16 h-16 rounded-2xl border border-white/10" alt=""/><h3 className="font-black text-white text-xl">{selectedUser.name}</h3></div>
                <button onClick={() => setSelectedUser(null)} className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-full"><X size={24}/></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right">
                <div className="space-y-5 bg-white/5 p-6 rounded-3xl border border-white/5">
                   <h4 className="text-[10px] font-black text-yellow-500 uppercase flex items-center gap-2 mb-4"><Coins size={14}/> الإدارة والـ ID</h4>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500">تحديث الـ ID الخاص</label>
                      <div className="flex gap-2">
                        <input type="number" defaultValue={selectedUser.customId} onChange={e => setNewCustomId(e.target.value)} className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white text-sm outline-none" />
                        <button onClick={async () => { await onUpdateUser(selectedUser.id, { customId: parseInt(newCustomId), isSpecialId: true }); alert('تم التحديث ✅'); }} className="bg-blue-600 text-white px-4 rounded-xl text-[10px] font-black">تحديث</button>
                      </div>
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500">شحن كوينز</label>
                     <div className="flex gap-2">
                        <input type="number" value={coinAmount} onChange={e => setCoinAmount(parseInt(e.target.value) || 0)} className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white text-sm outline-none" placeholder="0" />
                        <button onClick={async () => { await onUpdateUser(selectedUser.id, { coins: (selectedUser.coins || 0) + coinAmount }); alert('تم الشحن ✅'); setCoinAmount(0); }} className="bg-emerald-600 text-white px-4 rounded-xl font-black text-[10px]">شحن الآن</button>
                     </div>
                   </div>
                   <button onClick={async () => { if(confirm('تصفير الرصيد؟')) await onUpdateUser(selectedUser.id, { coins: 0 }); }} className="w-full py-3.5 bg-red-600/10 text-red-500 rounded-xl text-xs font-black border border-red-500/10 hover:bg-red-600 hover:text-white transition-all">تصفير المحفظة 🧹</button>
                </div>
                <div className="space-y-4 bg-white/5 p-6 rounded-3xl border border-white/5">
                   <h4 className="text-[10px] font-black text-blue-500 uppercase flex items-center gap-2 mb-4"><Crown size={14}/> ترقية VIP</h4>
                   <div className="grid grid-cols-2 gap-2">
                       {vipLevels?.map(v => (
                         <button key={v.level} onClick={async () => { await onUpdateUser(selectedUser.id, { isVip: true, vipLevel: v.level, frame: v.frameUrl, nameStyle: v.nameStyle }); alert('تمت الترقية ✅'); }} className={`py-2 px-3 rounded-xl border border-white/5 text-[9px] font-black transition-all hover:bg-white/10 ${selectedUser.vipLevel === v.level ? 'bg-amber-500 text-black' : 'bg-slate-900 text-slate-400'}`}>
                           {v.name}
                         </button>
                       ))}
                       <button onClick={async () => await onUpdateUser(selectedUser.id, { isVip: false, vipLevel: 0, frame: '', nameStyle: '' })} className="col-span-2 py-2 bg-red-600 text-white rounded-xl text-[9px] font-black">سحب VIP</button>
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default AdminPanel;
