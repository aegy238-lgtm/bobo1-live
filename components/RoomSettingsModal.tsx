import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Image as ImageIcon, Upload, Layout, Save, Edit3 } from 'lucide-react';
import { Room } from '../types';

interface RoomSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
  onUpdate: (roomId: string, data: Partial<Room>) => void;
}

const RoomSettingsModal: React.FC<RoomSettingsModalProps> = ({ isOpen, onClose, room, onUpdate }) => {
  const [title, setTitle] = useState(room.title);
  const [thumbnail, setThumbnail] = useState(room.thumbnail);
  const [background, setBackground] = useState(room.background);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'thumbnail' | 'background') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
           const result = event.target.result as string;
           if (type === 'thumbnail') setThumbnail(result);
           else setBackground(result.startsWith('data:') ? `url(${result}) center/cover no-repeat` : result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
     onUpdate(room.id, {
        title,
        thumbnail,
        background: background.startsWith('url') ? background : `url(${background}) center/cover no-repeat` // Ensure correct css format if raw url
     });
     onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center pointer-events-none">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
      />
      
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="relative w-full max-w-md bg-[#10141f] rounded-t-[30px] p-6 pb-8 border-t border-white/10 pointer-events-auto shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Edit3 className="text-blue-500" /> إعدادات الغرفة
           </h2>
           <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition">
              <X size={20} className="text-slate-400" />
           </button>
        </div>

        <div className="space-y-5">
           {/* Room Title */}
           <div>
              <label className="text-xs text-slate-400 mb-2 block font-bold">اسم الغرفة</label>
              <input 
                 type="text" 
                 value={title}
                 onChange={(e) => setTitle(e.target.value)}
                 className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
              />
           </div>

           {/* Images Upload */}
           <div className="grid grid-cols-2 gap-4">
              {/* Thumbnail */}
              <div>
                 <label className="text-xs text-slate-400 mb-2 block font-bold">صورة الغرفة (خارجي)</label>
                 <label className="block w-full aspect-square rounded-2xl border-2 border-dashed border-white/10 hover:border-blue-500/50 transition-colors cursor-pointer relative overflow-hidden bg-slate-900 group">
                    <img src={thumbnail} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" alt="Thumbnail" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload size={20} className="text-white" />
                    </div>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'thumbnail')} className="hidden" />
                 </label>
              </div>

              {/* Background */}
              <div>
                 <label className="text-xs text-slate-400 mb-2 block font-bold">خلفية الغرفة (داخلي)</label>
                 <label className="block w-full aspect-square rounded-2xl border-2 border-dashed border-white/10 hover:border-blue-500/50 transition-colors cursor-pointer relative overflow-hidden bg-slate-900 group">
                    <div className="w-full h-full" style={{ background: background, backgroundSize: 'cover' }}></div>
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Layout size={20} className="text-white" />
                    </div>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'background')} className="hidden" />
                 </label>
              </div>
           </div>

           <button 
              onClick={handleSave}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 mt-4 active:scale-95 transition-transform"
           >
              <Save size={20} /> حفظ التغييرات
           </button>
        </div>
      </motion.div>
    </div>
  );
};

export default RoomSettingsModal;