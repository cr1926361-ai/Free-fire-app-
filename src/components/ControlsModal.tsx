import React from 'react';
import { X, Keyboard, Mouse, Smartphone, Crosshair, Shield, Zap } from 'lucide-react';

interface ControlsModalProps {
  onClose: () => void;
}

export const ControlsModal: React.FC<ControlsModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl text-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <Keyboard className="w-6 h-6 text-amber-400" />
          <h2 className="text-xl font-bold font-gaming text-white uppercase tracking-wider">
            Game Controls & Hotkeys
          </h2>
        </div>

        <div className="space-y-4 font-gaming text-sm">
          {/* Desktop Controls */}
          <div>
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Mouse className="w-4 h-4" /> PC & Keyboard Controls
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-800/80 p-2 rounded-lg flex justify-between items-center border border-slate-700/50">
                <span className="text-slate-400">Move Forward/Back</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-700 font-mono text-amber-300">W / S</kbd>
              </div>
              <div className="bg-slate-800/80 p-2 rounded-lg flex justify-between items-center border border-slate-700/50">
                <span className="text-slate-400">Strafe Left/Right</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-700 font-mono text-amber-300">A / D</kbd>
              </div>
              <div className="bg-slate-800/80 p-2 rounded-lg flex justify-between items-center border border-slate-700/50">
                <span className="text-slate-400">Fire Weapon</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-700 font-mono text-amber-300">Left Click</kbd>
              </div>
              <div className="bg-slate-800/80 p-2 rounded-lg flex justify-between items-center border border-slate-700/50">
                <span className="text-slate-400">Aim Down Sights (ADS)</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-700 font-mono text-amber-300">Right Click</kbd>
              </div>
              <div className="bg-slate-800/80 p-2 rounded-lg flex justify-between items-center border border-slate-700/50">
                <span className="text-slate-400">Deploy Gloo Wall</span>
                <kbd className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono font-bold border border-cyan-800">G</kbd>
              </div>
              <div className="bg-slate-800/80 p-2 rounded-lg flex justify-between items-center border border-slate-700/50">
                <span className="text-slate-400">Active Skill</span>
                <kbd className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-mono font-bold border border-amber-800">F</kbd>
              </div>
              <div className="bg-slate-800/80 p-2 rounded-lg flex justify-between items-center border border-slate-700/50">
                <span className="text-slate-400">Jump</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-700 font-mono text-amber-300">Space</kbd>
              </div>
              <div className="bg-slate-800/80 p-2 rounded-lg flex justify-between items-center border border-slate-700/50">
                <span className="text-slate-400">Crouch</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-700 font-mono text-amber-300">C</kbd>
              </div>
              <div className="bg-slate-800/80 p-2 rounded-lg flex justify-between items-center border border-slate-700/50">
                <span className="text-slate-400">Reload</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-700 font-mono text-amber-300">R</kbd>
              </div>
              <div className="bg-slate-800/80 p-2 rounded-lg flex justify-between items-center border border-slate-700/50">
                <span className="text-slate-400">Switch Weapon</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-700 font-mono text-amber-300">1 / 2 / 3 / 4</kbd>
              </div>
            </div>
          </div>

          {/* Mobile Touch Controls */}
          <div>
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4" /> Mobile & Touch Screen
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Use the virtual joystick on the lower-left for movement. Swipe anywhere on the right half of the screen to aim your camera. Tap the large circular Crosshair button to shoot, Eye button for Scope, and Shield button for quick Gloo Wall defense!
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold font-gaming transition-colors"
        >
          Got It, Let's Fight!
        </button>
      </div>
    </div>
  );
};
