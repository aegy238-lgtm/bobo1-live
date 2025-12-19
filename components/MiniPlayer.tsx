import React from 'react';
import { motion } from 'framer-motion';
import { X, Maximize2, Mic, MicOff } from 'lucide-react';
import { Room } from '../types';

interface MiniPlayerProps {
  room: Room;
  onExpand: () => void;
  onLeave: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

const MiniPlayer: React.FC<MiniPlayerProps> = ({ room, onExpand, onLeave, isMuted, onToggleMute }) => {
  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="absolute bottom-[84px] left-4 right-4 bg-[#10141f]/95 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex items-center justify-between shadow-2xl z-40"
    >
      <div className="flex items-center gap-3 flex-1 overflow-hidden" onClick={onExpand}>
        <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer">
           <img src={room.thumbnail} className="w-full h-full object-cover" alt="Room" />
           {/* Equalizer animation overlay */}
           <div className="absolute inset-0 bg-black/30 flex items-end justify-center gap-0.5 pb-1">
              <div className="w-0.5 bg-green-500 animate-[bounce_1s_infinite] h-3"></div>
              <div className="w-0.5 bg-green-500 animate-[bounce_1.2s_infinite] h-5"></div>
              <div className="w-0.5 bg-green-500 animate-[bounce_0.8s_infinite] h-2"></div>
           </div>
        </div>
        <div className="flex flex-col cursor-pointer">
           <h4 className="font-bold text-sm text-white truncate max-w-[150px]">{room.title}</h4>
           <p className="text-[10px] text-green-400">الغرفة تعمل في الخلفية...</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
         <button 
            onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
            className={`p-2 rounded-full transition-colors ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}
         >
            {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
         </button>
         
         <button 
            onClick={onExpand}
            className="p-2 bg-blue-600/20 text-blue-400 rounded-full hover:bg-blue-600/30 transition-colors"
         >
            <Maximize2 size={18} />
         </button>

         <button 
            onClick={onLeave}
            className="p-2 bg-white/5 text-slate-400 rounded-full hover:bg-red-500/20 hover:text-red-400 transition-colors"
         >
            <X size={18} />
         </button>
      </div>
    </motion.div>
  );
};

export default MiniPlayer;