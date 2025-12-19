
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Crown, ShieldAlert, ShieldCheck, Mic, Play, Radio } from 'lucide-react';
import { UserLevel, User as UserType } from '../types';
import { auth, db } from '../services/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp 
} from 'firebase/firestore';

interface AuthScreenProps {
  onAuth: (user: UserType) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuth }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ADMIN_EMAIL = 'admin@bobo.com';

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !name)) {
      setError('الرجاء ملء جميع الحقول');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        
        if (userDoc.exists()) {
          onAuth(userDoc.data() as UserType);
        } else {
          // Fixed: Added missing required diamonds property
          const fallbackUser: UserType = {
            id: firebaseUser.uid,
            customId: Math.floor(10000 + Math.random() * 90000),
            name: email.split('@')[0],
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
            level: UserLevel.SILVER,
            coins: 5000,
            diamonds: 0,
            wealth: 0, charm: 0, isVip: false, vipLevel: 0,
            bio: 'مرحباً بك في Bobo-Live 🌹',
            stats: { likes: 0, visitors: 0, following: 0, followers: 0 },
            ownedItems: [], isFollowing: false, isMuted: false, isAdmin: email === ADMIN_EMAIL
          };
          onAuth(fallbackUser);
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        const isAdmin = email.toLowerCase() === ADMIN_EMAIL;
        
        // Fixed: Added missing required diamonds property
        const newUser: UserType = {
          id: firebaseUser.uid,
          customId: isAdmin ? 1 : Math.floor(10000 + Math.random() * 90000),
          name: name,
          avatar: isAdmin 
            ? 'https://cdn-icons-png.flaticon.com/512/6024/6024190.png' 
            : `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
          level: isAdmin ? UserLevel.VIP : UserLevel.NEW,
          coins: isAdmin ? 100000000 : 1000,
          diamonds: 0,
          wealth: isAdmin ? 9999999 : 0,
          charm: isAdmin ? 9999999 : 0,
          isVip: isAdmin,
          vipLevel: isAdmin ? 12 : 0,
          frame: isAdmin ? 'https://cdn-icons-png.flaticon.com/512/2165/2165039.png' : '',
          nameStyle: isAdmin ? 'text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 font-black animate-pulse' : '',
          bio: isAdmin ? 'المدير العام والمؤسس 👑' : 'مستخدم جديد في Bobo-Live',
          location: isAdmin ? 'المنامة، البحرين' : '',
          stats: { likes: 0, visitors: 0, following: 0, followers: 0 },
          ownedItems: [],
          isFollowing: false,
          isMuted: false,
          isAdmin: isAdmin,
          status: isAdmin ? 'owner' : 'user'
        };

        await setDoc(doc(db, 'users', firebaseUser.uid), {
          ...newUser,
          createdAt: serverTimestamp()
        });

        onAuth(newUser);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found') setError('المستخدم غير موجود');
      else if (err.code === 'auth/wrong-password') setError('كلمة المرور خاطئة');
      else if (err.code === 'auth/email-already-in-use') setError('البريد الإلكتروني مستخدم بالفعل');
      else if (err.code === 'auth/weak-password') setError('كلمة المرور ضعيفة جداً');
      else setError('حدث خطأ أثناء الاتصال بالقاعدة');
    } finally {
      setLoading(false);
    }
  };

  const isAdminTyping = email.toLowerCase() === ADMIN_EMAIL;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-4 relative overflow-hidden font-cairo">
        {/* Animated Background Orbs */}
        <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] blur-[120px] rounded-full transition-colors duration-1000 ${isAdminTyping ? 'bg-red-500/20' : 'bg-blue-600/15'}`}></div>
        <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] blur-[120px] rounded-full transition-colors duration-1000 ${isAdminTyping ? 'bg-yellow-500/20' : 'bg-purple-600/15'}`}></div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`w-full max-w-md bg-slate-900/40 backdrop-blur-3xl border rounded-[3rem] p-8 md:p-10 shadow-2xl relative z-10 transition-all duration-500 ${isAdminTyping ? 'border-red-500/50 shadow-red-900/20' : 'border-white/10'}`}>
            
            {/* Professional Bobo-Live Logo Header */}
            <div className="text-center mb-10">
                <div className="relative inline-block mb-6">
                    {/* Outer Glow Ring */}
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                      className={`absolute -inset-4 rounded-full border-2 border-dashed opacity-20 ${isAdminTyping ? 'border-red-500' : 'border-blue-400'}`}
                    ></motion.div>
                    
                    {/* Main Logo Container */}
                    <div className={`relative z-10 w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-2xl transition-all duration-500 ${isAdminTyping ? 'bg-gradient-to-br from-red-600 to-amber-600 shadow-red-600/40' : 'bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 shadow-blue-900/50'}`}>
                        {isAdminTyping ? (
                          <ShieldCheck size={48} className="text-white" />
                        ) : (
                          <div className="relative">
                            <Mic size={40} className="text-white" />
                            <motion.div 
                              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                              className="absolute -top-1 -right-1"
                            >
                              <Radio size={18} className="text-red-400" />
                            </motion.div>
                          </div>
                        )}
                    </div>
                </div>

                <h1 className="text-4xl font-black tracking-tighter text-white mb-2 italic">
                   Bobo<span className="text-blue-500">-Live</span>
                </h1>
                <p className="text-slate-400 text-xs font-medium uppercase tracking-[0.2em]">Next Gen Voice Socializing</p>
                
                {isAdminTyping && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-4 flex items-center justify-center gap-2 text-red-500 font-black text-[10px] bg-red-500/10 py-2.5 rounded-2xl border border-red-500/20 uppercase tracking-widest">
                    <ShieldAlert size={14} /> Admin Access Detected
                  </motion.div>
                )}
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
                {!isLogin && (
                    <div className="relative group">
                        <User className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input type="text" placeholder="الاسم المستعار" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-950/40 border border-white/5 rounded-2xl py-4 pr-12 pl-4 text-white text-sm focus:border-blue-500/50 outline-none transition-all shadow-inner" />
                    </div>
                )}
                <div className="relative group">
                    <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input type="email" placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-950/40 border border-white/5 rounded-2xl py-4 pr-12 pl-4 text-white text-sm focus:border-blue-500/50 outline-none transition-all shadow-inner" />
                </div>
                <div className="relative group">
                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input type="password" placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-950/40 border border-white/5 rounded-2xl py-4 pr-12 pl-4 text-white text-sm focus:border-blue-500/50 outline-none transition-all shadow-inner" />
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-red-400 text-[10px] font-bold bg-red-500/10 p-4 rounded-2xl border border-red-500/20 flex items-center gap-2">
                    <ShieldAlert size={14} /> {error}
                  </motion.div>
                )}

                <button type="submit" disabled={loading} className={`w-full font-black py-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl mt-4 ${isAdminTyping ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-red-900/40' : 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-blue-900/30'}`}>
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (isLogin ? (isAdminTyping ? 'دخول المدير' : 'تسجيل الدخول') : 'إنشاء حساب جديد')}
                </button>
            </form>

            <div className="mt-8 text-center">
                <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-slate-500 font-bold hover:text-blue-400 transition-colors text-xs">
                    {isLogin ? 'ليس لديك حساب؟ انضم إلى Bobo-Live' : 'لديك حساب؟ سجل دخولك الآن'}
                </button>
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/5 text-center">
               <p className="text-[10px] text-slate-600 tracking-[0.3em] font-black uppercase">Bobo-Live © 2025</p>
            </div>
        </motion.div>
    </div>
  );
};

export default AuthScreen;
