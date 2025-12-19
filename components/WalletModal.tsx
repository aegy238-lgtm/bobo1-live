
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, Coins, Gem, ArrowUpRight, History, Zap, Info, ChevronLeft } from 'lucide-react';
import { User } from '../types';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose, user }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        className="relative w-full max-w-md bg-slate-950 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/30">
              <Wallet size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">المحفظة الإلكترونية</h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Digital Asset Management</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          
          {/* Coins Card (Spending Balance) */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-[2rem] blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
            <div className="relative bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/20 rounded-[2rem] p-6 overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/10 blur-[50px] rounded-full -translate-x-10 -translate-y-10" />
              
              <div className="flex justify-between items-start mb-6">
                <div className="flex flex-col">
                  <span className="text-amber-500 text-[10px] font-black uppercase tracking-widest mb-1">رصيد الكوينز</span>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-black text-white">{(user.coins || 0).toLocaleString()}</span>
                    <Coins size={24} className="text-amber-500" />
                  </div>
                </div>
                <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <Zap size={16} className="text-amber-500" />
                </div>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 bg-amber-500 hover:bg-amber-400 text-black py-3 rounded-xl font-black text-xs transition-all active:scale-95 shadow-lg shadow-amber-900/40">
                  إعادة شحن
                </button>
                <button className="px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-all active:scale-95">
                  <History size={18} />
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-[9px] text-slate-500">
                <Info size={10} />
                <span>تستخدم الكوينزات للشراء، إرسال الهدايا، والمشاركة في الألعاب.</span>
              </div>
            </div>
          </div>

          {/* Diamonds Card (Earnings Balance) */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 rounded-[2rem] blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
            <div className="relative bg-gradient-to-br from-slate-900 to-slate-950 border border-cyan-500/20 rounded-[2rem] p-6 overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-cyan-500/10 blur-[50px] rounded-full -translate-x-10 -translate-y-10" />
              
              <div className="flex justify-between items-start mb-6">
                <div className="flex flex-col">
                  <span className="text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-1">رصيد الألماس</span>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-black text-white">{(user.diamonds || 0).toLocaleString()}</span>
                    <Gem size={24} className="text-cyan-400" />
                  </div>
                </div>
                <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                  <ArrowUpRight size={16} className="text-cyan-400" />
                </div>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white py-3 rounded-xl font-black text-xs transition-all active:scale-95 shadow-lg shadow-cyan-900/40">
                  تحويل إلى كوينز
                </button>
                <button className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl border border-white/10 font-black text-xs transition-all active:scale-95">
                  سحب الأرباح
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-[9px] text-slate-500">
                <Info size={10} />
                <span>تكتسب الألماس حصرياً عند استقبال الهدايا والدعم من الآخرين.</span>
              </div>
            </div>
          </div>

          {/* Help/Services Section */}
          <div className="bg-white/5 rounded-3xl p-4 border border-white/5 space-y-3">
             <h4 className="text-[10px] font-black text-slate-400 px-2 uppercase tracking-widest">خدمات مالية</h4>
             <div className="space-y-1">
                {[
                  { label: 'سجل العمليات', icon: History, color: 'text-blue-400' },
                  { label: 'مركز الوكلاء للشحن', icon: Zap, color: 'text-amber-400' },
                  { label: 'الأسئلة الشائعة', icon: Info, color: 'text-indigo-400' }
                ].map((item, idx) => (
                  <button key={idx} className="w-full flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-all group">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-white/5 ${item.color}`}><item.icon size={16} /></div>
                      <span className="text-sm font-bold text-slate-300">{item.label}</span>
                    </div>
                    <ChevronLeft size={16} className="text-slate-600 group-hover:text-white transition-colors" />
                  </button>
                ))}
             </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 bg-black/40 border-t border-white/5">
           <p className="text-[9px] text-center text-slate-600 font-bold">كل المعاملات تخضع لسياسة الخصوصية وشروط الاستخدام في Bobo-Live</p>
        </div>
      </motion.div>
    </div>
  );
};

export default WalletModal;
