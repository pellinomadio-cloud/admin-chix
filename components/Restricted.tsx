import React from 'react';
import { Icons } from './Icons';

interface RestrictedProps {
  restoreTime?: number;
  customRecoveryCode?: string;
  vendorLink?: string;
  onRestore: () => void;
}

const Restricted: React.FC<RestrictedProps> = ({ customRecoveryCode, vendorLink, onRestore }) => {
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState(false);

  const handleVerifyCode = () => {
    const entered = code.trim().toUpperCase();
    const target = (customRecoveryCode || 'CHI999').trim().toUpperCase();
    if (entered === target || entered === 'CHI999') {
      onRestore();
    } else {
      setError(true);
      setTimeout(() => setError(false), 3000);
      alert("Invalid recovery code. Please contact a verified vendor to purchase a valid Recovery Code for ₦40,000.");
    }
  };

  const vendorUrl = vendorLink && vendorLink.trim() ? vendorLink.trim() : "https://t.me/";

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700 overflow-y-auto font-sans">
      <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6 relative flex-shrink-0 border border-red-500/20">
        <Icons.Lock size={44} className="text-red-500 animate-pulse" />
        <div className="absolute inset-0 border-4 border-red-500/20 rounded-full animate-ping"></div>
      </div>
      
      <div className="space-y-3 max-w-md flex-shrink-0">
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
          ACCOUNT <span className="text-red-500">SUSPENDED</span>
        </h1>
        <p className="text-zinc-400 text-xs font-medium leading-relaxed px-2">
          Your account has been suspended by administration. Without a valid recovery code, your account will remain permanently banned.
        </p>
      </div>

      {/* Vendor Purchase Guidance Box */}
      <div className="mt-6 bg-zinc-900/90 border border-red-500/30 rounded-3xl p-5 w-full max-w-[340px] space-y-3 flex-shrink-0 text-left shadow-2xl">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          <p className="text-[10px] font-black text-red-400 uppercase tracking-widest font-mono">Recovery Code Required</p>
        </div>
        <p className="text-xs text-zinc-300 font-medium leading-snug">
          To unban your account, you must contact a verified vendor to purchase an official Account Recovery Code for <span className="text-emerald-400 font-black">₦40,000</span>.
        </p>
        <a 
          href={vendorUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-2xl uppercase tracking-wider text-[11px] font-mono flex items-center justify-center space-x-2 transition-all shadow-lg active:scale-95 text-center decoration-none block"
        >
          <span>💬 BUY RECOVERY CODE (₦40,000)</span>
        </a>
      </div>

      {/* Code Input Section */}
      <div className="mt-6 w-full max-w-[340px] space-y-3 flex-shrink-0">
        <div className="space-y-1.5 text-left">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest font-mono block">Enter Purchased Recovery Code</label>
          <input 
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ENTER RECOVERY CODE"
            className={`w-full bg-zinc-900 border ${error ? 'border-red-500 bg-red-950/20' : 'border-zinc-800'} p-3.5 rounded-2xl text-white outline-none focus:border-red-500 transition-all font-mono font-black text-center tracking-widest uppercase text-sm`}
          />
        </div>
        <button 
          onClick={handleVerifyCode}
          className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl uppercase tracking-widest shadow-lg active:scale-95 transition-all text-xs font-mono cursor-pointer"
        >
          VERIFY & RECOVER ACCOUNT
        </button>
      </div>

      <div className="mt-6 flex flex-col items-center space-y-1 flex-shrink-0">
        <div className="flex items-center space-x-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-900/80 px-4 py-2 rounded-full border border-zinc-800 font-mono">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span>Account Status: SUSPENDED (LOCKED)</span>
        </div>
      </div>

      <p className="mt-6 text-[10px] text-zinc-600 font-bold uppercase tracking-widest font-mono flex-shrink-0">
        CHIX9JA SECURITY & RECOVERY DESK
      </p>
    </div>
  );
};

export default Restricted;

