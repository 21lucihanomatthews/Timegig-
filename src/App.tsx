import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { Briefcase, MessageSquare, ShoppingBag, Globe, Clock, User, Heart, MoreVertical } from 'lucide-react';
import { Gig, MarketItem, ChatConversation, Message } from './types';
import GigsTab from './components/GigsTab';
import ChatTab from './components/ChatTab';
import MarketTab from './components/MarketTab';
import { 
  supabase, 
  SUPABASE_SQL_SCHEMA, 
  isTableMissingError,
  dbFetchGigs, 
  dbInsertGig, 
  dbUpdateGigStatus, 
  dbFetchMarketItems, 
  dbInsertMarketItem, 
  dbFetchChats, 
  dbInsertChat, 
  dbUpdateChatMessages, 
  dbFetchRequests, 
  dbInsertRequest, 
  dbUpdateRequestStatus,
  dbResetAllData,
  dbUpdatePresence,
  dbFetchLivePresence
} from './lib/supabase';

export default function App() {
  const [activeTab, setActiveTab] = useState<'gigs' | 'chat' | 'market'>('gigs');
  const [showSplashScreen, setShowSplashScreen] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [certificates, setCertificates] = useState<File[]>([]);
  const [capturedId, setCapturedId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<{sender: 'user' | 'bot', text: string}[]>([{sender: 'bot', text: 'How can I help you today with your applications?'}]);
  const [chatInput, setChatInput] = useState('');
  const [capturedSelfie, setCapturedSelfie] = useState<string | null>(() => {
    return localStorage.getItem('hub_captured_selfie');
  });
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'rejected'>(() => {
    return (localStorage.getItem('hub_verification_status') as 'idle' | 'verifying' | 'success' | 'rejected') || 'idle';
  });
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [captureType, setCaptureType] = useState<'id' | 'selfie' | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // --- WALLET & ADMIN STATE EXTENSION ---
  const [coinsBalance, setCoinsBalance] = useState<number>(() => {
    const saved = localStorage.getItem('hub_coins');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [liveProfit, setLiveProfit] = useState<number>(() => {
    const saved = localStorage.getItem('hub_live_profit');
    return saved ? parseFloat(saved) : 0.00;
  });

  const [activeUsersCount, setActiveUsersCount] = useState<number>(1);
  const [onlineUsersCount, setOnlineUsersCount] = useState<number>(1);

  const [pendingRequests, setPendingRequests] = useState<any[]>(() => {
    const saved = localStorage.getItem('hub_pending_requests');
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [myUncreditedTopups, setMyUncreditedTopups] = useState<any[]>(() => {
    const saved = localStorage.getItem('hub_uncredited_topups');
    return saved ? JSON.parse(saved) : [];
  });

  const [fullScreenImageUrl, setFullScreenImageUrl] = useState<string | null>(null);

  // Cwallet step/form states
  const [walletStep, setWalletStep] = useState<'balance' | 'topup' | 'transfer'>('balance');
  const [topupAmount, setTopupAmount] = useState<string>('50');
  const [topupReceipt, setTopupReceipt] = useState<string | null>(null);
  const [topupFeedback, setTopupFeedback] = useState<string>('');

  // Transfer states
  const [transferUser, setTransferUser] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [transferFeedback, setTransferFeedback] = useState<string>('');

  // Local storage synchronization
  useEffect(() => {
    localStorage.setItem('hub_coins', coinsBalance.toString());
  }, [coinsBalance]);

  useEffect(() => {
    localStorage.setItem('hub_live_profit', liveProfit.toString());
  }, [liveProfit]);

  useEffect(() => {
    localStorage.setItem('hub_pending_requests', JSON.stringify(pendingRequests));
  }, [pendingRequests]);

  useEffect(() => {
    localStorage.setItem('hub_uncredited_topups', JSON.stringify(myUncreditedTopups));
  }, [myUncreditedTopups]);

  useEffect(() => {
    if (capturedSelfie) {
      localStorage.setItem('hub_captured_selfie', capturedSelfie);
    } else {
      localStorage.removeItem('hub_captured_selfie');
    }
  }, [capturedSelfie]);

  useEffect(() => {
    localStorage.setItem('hub_verification_status', verificationStatus);
  }, [verificationStatus]);

  const handleSupportBotMessage = async () => {
      if (!chatInput.trim()) return;
      
      const userMessage = chatInput;
      const newMessages = [...chatMessages, {sender: 'user', text: userMessage}];
      setChatMessages(newMessages);
      setChatInput('');
      
      try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: newMessages })
        });
        const data = await response.json();
        setChatMessages(prev => [...prev, {sender: 'bot', text: data.reply}]);
      } catch (err) {
          console.error("Chat error", err);
          setChatMessages(prev => [...prev, {sender: 'bot', text: 'I am having trouble connecting to the support server.'}]);
      }
  }

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.error("Video play failed", e));
    }
  }, [stream]);

  const startCamera = async (type: 'id' | 'selfie') => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: type === 'selfie' ? 'user' : 'environment' } 
      });
      setStream(s);
      setCaptureType(type);
    } catch (err) {
      console.error("Camera access failed", err);
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setCaptureType(null);
    }
  }, [stream]);

  const handleVerification = async () => {
    if (!capturedId || !capturedSelfie) {
      alert("Please capture both ID and selfie.");
      return;
    }
    setVerificationStatus('verifying');
    
    // Add a live Verification action item into the Admin Dashboard feed
    const newVerificationReq = {
      id: `req-verification-${Date.now()}`,
      user: `${profileName} (You)`,
      type: 'Verification',
      documentUrl: capturedId,
      documentUrlSelfie: capturedSelfie,
      status: 'Pending',
      timestamp: 'Just now'
    };
    setPendingRequests(prev => [newVerificationReq, ...prev]);

    try {
      await dbInsertRequest(newVerificationReq);
    } catch (err: any) {
      console.error("Failed to insert verification request:", err);
      if (isTableMissingError(err)) {
        setDbError("Database tables are not created yet in your Supabase project.");
      }
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      const data = canvas.toDataURL('image/png');
      if (captureType === 'id') setCapturedId(data);
      else setCapturedSelfie(data);
      stopCamera();
    }
  };

  const handleCertificateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setCertificates([...certificates, ...Array.from(e.target.files)]);
    }
  };

  // Splash Screen timer (5 seconds)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplashScreen(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);
  
  const handleLogout = () => {
    setShowSplashScreen(true);
    setIsMenuOpen(false);
    setActiveFeature(null);
  };

  // User Profile States
  const [profileName, setProfileName] = useState<string>(() => {
    return localStorage.getItem('hub_profile_name') || 'Your Name';
  });
  const [profileTitle, setProfileTitle] = useState<string>(() => {
    return localStorage.getItem('hub_profile_title') || 'Independent Specialist';
  });
  const [profileBio, setProfileBio] = useState<string>(() => {
    return localStorage.getItem('hub_profile_bio') || 'Experienced independent specialist, premium gig-delivery verified and time-tracked.';
  });

  // Temporaries for editing
  const [tempName, setTempName] = useState(profileName);
  const [tempTitle, setTempTitle] = useState(profileTitle);
  const [tempBio, setTempBio] = useState(profileBio);

  const [profileSuccessMsg, setProfileSuccessMsg] = useState(false);

  // Real-time Database Presence Heartbeat & Sync for Real Users
  useEffect(() => {
    if (!profileName || profileName === 'Your Name') return;

    const sendHeartbeat = async () => {
      try {
        await dbUpdatePresence(profileName);
      } catch (err) {
        // silently handled
      }
    };
    
    const fetchPresence = async () => {
      try {
        const counts = await dbFetchLivePresence();
        if (counts) {
          setActiveUsersCount(counts.active);
          setOnlineUsersCount(counts.online);
        }
      } catch (err) {
        // silently handled
      }
    };

    sendHeartbeat();
    fetchPresence();

    const intervalId = setInterval(() => {
      sendHeartbeat();
      fetchPresence();
    }, 4500);

    return () => clearInterval(intervalId);
  }, [profileName]);

  useEffect(() => {
    localStorage.setItem('hub_profile_name', profileName);
    setTempName(profileName);
  }, [profileName]);

  useEffect(() => {
    localStorage.setItem('hub_profile_title', profileTitle);
    setTempTitle(profileTitle);
  }, [profileTitle]);

  useEffect(() => {
    localStorage.setItem('hub_profile_bio', profileBio);
    setTempBio(profileBio);
  }, [profileBio]);

  // States, initialized from LocalStorage or default
  const [gigs, setGigs] = useState<Gig[]>(() => {
    const saved = localStorage.getItem('hub_gigs');
    return saved ? JSON.parse(saved) : [];
  });

  const [marketItems, setMarketItems] = useState<MarketItem[]>(() => {
    const saved = localStorage.getItem('hub_market');
    return saved ? JSON.parse(saved) : [];
  });

  const [conversations, setConversations] = useState<ChatConversation[]>(() => {
    const saved = localStorage.getItem('hub_chats');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const [dbError, setDbError] = useState<string | null>(null);

  // Sync to LocalStorage on changes
  useEffect(() => {
    localStorage.setItem('hub_gigs', JSON.stringify(gigs));
  }, [gigs]);

  useEffect(() => {
    localStorage.setItem('hub_market', JSON.stringify(marketItems));
  }, [marketItems]);

  useEffect(() => {
    localStorage.setItem('hub_chats', JSON.stringify(conversations));
  }, [conversations]);

  // Load live data from Supabase on mount
  useEffect(() => {
    const loadSupabaseData = async () => {
      // One-time initialization to flush outdated demo/mock cached data
      const isLiveV3 = localStorage.getItem('hub_live_v3_active');
      if (isLiveV3 !== 'true') {
        localStorage.removeItem('hub_coins');
        localStorage.removeItem('hub_live_profit');
        localStorage.removeItem('hub_pending_requests');
        localStorage.removeItem('hub_uncredited_topups');
        localStorage.removeItem('hub_gigs');
        localStorage.removeItem('hub_market');
        localStorage.removeItem('hub_chats');
        localStorage.removeItem('hub_captured_selfie');
        localStorage.removeItem('hub_verification_status');
        
        setCoinsBalance(0);
        setLiveProfit(0.00);
        setPendingRequests([]);
        setMyUncreditedTopups([]);
        setGigs([]);
        setMarketItems([]);
        setConversations([]);
        setCapturedSelfie(null);
        setVerificationStatus('idle');
        
        localStorage.setItem('hub_live_v3_active', 'true');
        console.log("🛡️ Live production mode active: Mock and demo states successfully purged.");
      }

      try {
        const fetchedGigs = await dbFetchGigs();
        if (fetchedGigs) {
          setGigs(fetchedGigs);
        }
      } catch (err: any) {
        console.error("Supabase gigs fetch error:", err);
        if (isTableMissingError(err)) {
          setDbError("Database tables are not created yet in your Supabase project.");
        }
      }

      try {
        const fetchedMarket = await dbFetchMarketItems();
        if (fetchedMarket) {
          setMarketItems(fetchedMarket);
        }
      } catch (err: any) {
        console.error("Supabase market fetch error:", err);
        if (isTableMissingError(err)) {
          setDbError("Database tables are not created yet in your Supabase project.");
        }
      }

      try {
        const fetchedChats = await dbFetchChats();
        if (fetchedChats) {
          setConversations(fetchedChats);
        }
      } catch (err: any) {
        console.error("Supabase chats fetch error:", err);
        if (isTableMissingError(err)) {
          setDbError("Database tables are not created yet in your Supabase project.");
        }
      }

      try {
        const fetchedRequests = await dbFetchRequests();
        if (fetchedRequests) {
          setPendingRequests(fetchedRequests);
        }
      } catch (err: any) {
        console.error("Supabase requests fetch error:", err);
        if (isTableMissingError(err)) {
          setDbError("Database tables are not created yet in your Supabase project.");
        }
      }
    };

    loadSupabaseData();
  }, []);

  // Poll live data from Supabase periodically to allow real-time approvals and content updates
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const fetchedRequests = await dbFetchRequests();
        if (fetchedRequests) {
          setPendingRequests(fetchedRequests);
        }
      } catch (err) {
        console.error("Supabase polling requests error:", err);
      }

      try {
        const fetchedGigs = await dbFetchGigs();
        if (fetchedGigs) {
          setGigs(fetchedGigs);
        }
      } catch (err) {
        console.error("Supabase polling gigs error:", err);
      }

      try {
        const fetchedMarket = await dbFetchMarketItems();
        if (fetchedMarket) {
          setMarketItems(fetchedMarket);
        }
      } catch (err) {
        console.error("Supabase polling market items error:", err);
      }
    }, 4000);

    return () => clearInterval(pollInterval);
  }, []);

  // Detect if any of the user's own topup requests have been approved, and automatically credit coins
  useEffect(() => {
    if (myUncreditedTopups.length === 0) return;

    let coinsToCredit = 0;
    const remainingUncredited: any[] = [];
    let stateChanged = false;

    for (const myTopup of myUncreditedTopups) {
      // Find the corresponding database/live request
      const matchedReq = pendingRequests.find(r => r.id === myTopup.id);
      
      if (matchedReq && matchedReq.status === 'Approved') {
        coinsToCredit += myTopup.amount;
        stateChanged = true;
        alert(`🎉 Payment Approved! Matthews automatically credited ${myTopup.amount} COINS to your wallet.`);
      } else if (matchedReq && matchedReq.status === 'Rejected') {
        stateChanged = true;
        alert(`❌ Payment Proof Rejected. Please check your transaction reference/bank proof and try again.`);
      } else {
        // Still pending or not found, keep tracking
        remainingUncredited.push(myTopup);
      }
    }

    if (stateChanged) {
      if (coinsToCredit > 0) {
        setCoinsBalance(prev => prev + coinsToCredit);
      }
      setMyUncreditedTopups(remainingUncredited);
    }
  }, [pendingRequests, myUncreditedTopups]);

  // Modifiers
  const handleAddGig = async (newGigData: Omit<Gig, 'id' | 'status' | 'createdAt'>) => {
    const newGig: Gig = {
      ...newGigData,
      id: `gig-${Date.now()}`,
      status: 'Open',
      createdAt: new Date().toISOString()
    };
    setGigs(prev => [newGig, ...prev]);
    try {
      await dbInsertGig(newGig);
    } catch (err: any) {
      console.error("Failed to insert gig into Supabase:", err);
      if (isTableMissingError(err)) {
        setDbError("Database tables are not created yet in your Supabase project.");
      }
    }
  };

  const handleAddItem = async (newItemData: Omit<MarketItem, 'id' | 'createdAt'>) => {
    const newItem: MarketItem = {
      ...newItemData,
      id: `item-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setMarketItems(prev => [newItem, ...prev]);
    try {
      await dbInsertMarketItem(newItem);
    } catch (err: any) {
      console.error("Failed to insert market item into Supabase:", err);
      if (isTableMissingError(err)) {
        setDbError("Database tables are not created yet in your Supabase project.");
      }
    }
  };

  // Switch to Chat thread when someone applies to a gig
  const handleApplyGig = async (gigId: string, posterName: string) => {
    // 1. Update gig's status to Applied
    setGigs(prevGigs => 
      prevGigs.map(g => g.id === gigId ? { ...g, status: 'Applied' } : g)
    );
    try {
      await dbUpdateGigStatus(gigId, 'Applied');
    } catch (err) {
      console.error("Failed to update gig status in Supabase", err);
    }

    // 2. See if conversation with this poster already exists
    const existingChat = conversations.find(
      c => c.title.toLowerCase() === posterName.toLowerCase()
    );

    if (existingChat) {
      setActiveConversationId(existingChat.id);
    } else {
      // Create new chat room
      const matchedGig = gigs.find(g => g.id === gigId);
      const newChatId = `chat-gig-${Date.now()}`;
      const newChat: ChatConversation = {
        id: newChatId,
        title: posterName,
        subtitle: `Re: ${matchedGig?.title || 'Contract Gig'}`,
        lastMessageText: 'You applied for this gig. State is active.',
        lastMessageTime: 'Just now',
        messages: [
          {
            id: 'init-msg-1',
            senderId: 'user',
            text: `Hi ${posterName}, I am highly interested in your gig: "${matchedGig?.title}". I have matching qualifications and details ready. Let me know if we can discuss details!`,
            type: 'text',
            timestamp: 'Just now'
          }
        ]
      };
      setConversations(prev => [newChat, ...prev]);
      setActiveConversationId(newChatId);

      try {
        await dbInsertChat(newChat);
      } catch (err: any) {
        console.error("Failed to insert chat into Supabase", err);
        if (isTableMissingError(err)) {
          setDbError("Database tables are not created yet in your Supabase project.");
        }
      }
    }

    // 3. Navigate to chat tab
    setActiveTab('chat');
  };

  // Switch to Chat thread when inquiring about a Market Item
  const handleInquireItem = async (itemId: string, sellerName: string, itemTitle: string) => {
    // See if conversation with seller already exists
    const existingChat = conversations.find(
      c => c.title.toLowerCase() === sellerName.toLowerCase() && c.subtitle.includes(itemTitle)
    );

    if (existingChat) {
      setActiveConversationId(existingChat.id);
    } else {
      // Create new chat room
      const newChatId = `chat-item-${Date.now()}`;
      const newChat: ChatConversation = {
        id: newChatId,
        title: sellerName,
        subtitle: `Re: ${itemTitle}`,
        lastMessageText: 'Initial inquiry sent.',
        lastMessageTime: 'Just now',
        messages: [
          {
            id: 'init-item-1',
            senderId: 'user',
            text: `Hello ${sellerName}, is your listed item "${itemTitle}" still available? I would love to ask about logistics and acquire further details. Thanks!`,
            type: 'text',
            timestamp: 'Just now'
          }
        ]
      };
      setConversations(prev => [newChat, ...prev]);
      setActiveConversationId(newChatId);

      try {
        await dbInsertChat(newChat);
      } catch (err: any) {
        console.error("Failed to insert chat into Supabase", err);
        if (isTableMissingError(err)) {
          setDbError("Database tables are not created yet in your Supabase project.");
        }
      }
    }

    // Navigate to chat tab
    setActiveTab('chat');
  };

  const handleSendMessage = async (conversationId: string, text: string, senderId: 'user' | 'other', type: 'text' | 'image' | 'video' = 'text', content?: string) => {
    const lastText = type === 'text' ? text : `[${type}]`;
    const lastTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let updatedConversation: ChatConversation | null = null;

    setConversations(prevChats => 
      prevChats.map(chat => {
        if (chat.id === conversationId) {
          const newMsg: Message = {
            id: `msg-${Date.now()}-${Math.random()}`,
            senderId,
            text,
            type,
            content,
            timestamp: lastTime
          };
          updatedConversation = {
            ...chat,
            lastMessageText: lastText,
            lastMessageTime: lastTime,
            messages: [...chat.messages, newMsg]
          };
          return updatedConversation;
        }
        return chat;
      })
    );

    setTimeout(async () => {
      if (updatedConversation) {
        try {
          await dbUpdateChatMessages(conversationId, (updatedConversation as ChatConversation).messages, lastText, lastTime);
        } catch (err: any) {
          console.error("Failed to update messages in Supabase:", err);
          if (isTableMissingError(err)) {
            setDbError("Database tables are not created yet in your Supabase project.");
          }
        }
      }
    }, 50);
  };

  // Helper count of open gigs or custom notification states
  const openGigsCount = gigs.filter(g => g.status === 'Open').length;

  return (
    <div id="app-root-shell" className="min-h-screen bg-slate-100 flex items-center justify-center py-0 sm:py-6 px-0 sm:px-4">
      {showSplashScreen && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-white"
        >
          <h1 className="text-4xl font-bold text-slate-950 font-sans tracking-tight">
            Time
            <div className="relative inline-block">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-slate-400" />
              <motion.div
                initial={{ x: -250, y: 50, opacity: 0 }}
                animate={{
                  x: [-250, 0, 100],
                  y: [50, 0, -50],
                  opacity: [0, 1, 1, 0],
                }}
                transition={{
                  duration: 2,
                  times: [0, 0.65, 0.8, 1],
                  ease: "easeInOut",
                }}
                className="absolute -left-16 top-2 text-2xl"
              >
                ⚽
              </motion.div>
              <motion.span
                initial={{ rotate: -45, opacity: 0 }}
                animate={{ rotate: [0, 20, -10, 5, 0], opacity: 1 }}
                transition={{
                  rotate: { delay: 1.3, duration: 0.8, type: "tween", ease: "easeInOut" },
                  opacity: { delay: 0.2, duration: 0.5 },
                }}
                className="inline-block origin-top bg-slate-900 text-white px-3 py-1 rounded-lg font-mono text-3xl"
              >
                GiG
              </motion.span>
            </div>
          </h1>
        </motion.div>
      )}

      {/* Immersive Frame Container mimics a premium browser view or direct mobile client */}
      <div 
        id="app-main-viewport" 
        className="w-full max-w-4xl h-screen sm:h-[880px] bg-white sm:rounded-3xl sm:shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col relative"
      >
        
        {/* Menu Overlay */}
        {isMenuOpen && (
          <div className="absolute inset-0 z-50 bg-gradient-to-br from-indigo-950 via-red-900 to-red-950 text-white flex flex-col p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black tracking-tighter">Menu</h2>
              <button 
                onClick={() => { setIsMenuOpen(false); setActiveFeature(null); }} 
                className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>
            
            {activeFeature === null ? (
              <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
                {['UserPro', 'Identity Verification', 'Cwallet', 'Help and Support', 'Supabase Database', 'Admin Dashboard', 'Logout'].map(feature => (
                  <button 
                    key={feature}
                    onClick={() => feature === 'Logout' ? handleLogout() : setActiveFeature(feature)}
                    className="p-5 bg-white/5 rounded-2xl text-left font-bold text-lg hover:bg-white/10 transition-all border border-white/5 flex justify-between items-center"
                  >
                    <span>{feature}</span>
                    {feature === 'Admin Dashboard' && pendingRequests.filter(r => r.status === 'Pending').length > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                        {pendingRequests.filter(r => r.status === 'Pending').length} Pending
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto pr-1">
                <button 
                  onClick={() => {
                    setActiveFeature(null);
                    setWalletStep('balance');
                    setTopupFeedback('');
                    setTransferFeedback('');
                  }} 
                  className="mb-6 text-rose-300 font-medium flex items-center gap-2 hover:text-white"
                >
                  ← Back to Menu
                </button>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-3xl font-black tracking-tight">{activeFeature}</h3>
                  {activeFeature === 'Admin Dashboard' && (
                    <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-mono border border-emerald-500/20">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Live Terminal
                    </span>
                  )}
                </div>
                
                {activeFeature === 'UserPro' && (
                  <div className="space-y-4">
                    {/* Compact Profile Picture Card */}
                    <div className="flex flex-col items-center justify-center p-6 bg-white/5 rounded-2xl border border-white/10 relative overflow-hidden mb-4">
                      <div className="absolute top-2 right-2">
                        {verificationStatus === 'success' ? (
                          <span className="bg-red-500/20 text-red-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-red-500/30 tracking-wider">
                            Active
                          </span>
                        ) : (
                          <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30 tracking-wider">
                            Pending Id
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <img 
                          src={capturedSelfie || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"} 
                          alt="Selfie profile preview" 
                          className={`w-24 h-24 rounded-full object-cover border-4 ${
                            verificationStatus === 'success' ? 'border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'border-slate-700'
                          }`}
                        />
                        {/* Custom Red Mark Indicator */}
                        {verificationStatus === 'success' ? (
                          <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-600 rounded-full border-2 border-slate-950 flex items-center justify-center animate-pulse" title="Account fully activated">
                            <span className="w-1.5 h-1.5 bg-white rounded-full" />
                          </span>
                        ) : (
                          <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-400 rounded-full border-2 border-slate-950" title="Awaiting action" />
                        )}
                      </div>
                      <h4 className="text-white font-bold text-lg mt-3">{profileName}</h4>
                      <p className="text-rose-300 text-xs font-mono">
                        {verificationStatus === 'success' ? '✓ Premium Activated Gig-worker' : '⚠️ Verification Pending'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-rose-300 uppercase tracking-wider mb-1.5 font-sans">Full Name</label>
                      <input 
                        className="w-full p-4 bg-white/10 rounded-xl border-0 text-white placeholder-rose-300" 
                        value={tempName} 
                        onChange={(e) => setTempName(e.target.value)} 
                        placeholder="Full Name" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-rose-300 uppercase tracking-wider mb-1.5 font-sans">Job Title</label>
                      <input 
                        className="w-full p-4 bg-white/10 rounded-xl border-0 text-white placeholder-rose-300" 
                        value={tempTitle} 
                        onChange={(e) => setTempTitle(e.target.value)} 
                        placeholder="Job Title" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-rose-300 uppercase tracking-wider mb-1.5 font-sans">Bio / Statement</label>
                      <textarea 
                        className="w-full p-4 bg-white/10 rounded-xl border-0 text-white placeholder-rose-300" 
                        placeholder="Motivational Letter" 
                        value={tempBio} 
                        onChange={(e) => setTempBio(e.target.value)} 
                        rows={4} 
                      />
                    </div>
                    
                    <div className="mt-6">
                      <label className="block text-sm font-semibold text-rose-300 mb-2">Upload Certificates</label>
                      <input type="file" multiple onChange={handleCertificateUpload} className="w-full p-3 bg-white/5 rounded-xl border border-white/10" />
                      
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        {certificates.map((file, idx) => (
                          <div key={idx} className="bg-white/10 p-3 rounded-xl flex items-center gap-2">
                             📄 {file.name.slice(0, 10)}...
                          </div>
                        ))}
                      </div>
                    </div>

                    {profileSuccessMsg && (
                      <p className="text-emerald-400 font-sans font-semibold text-xs text-center animate-pulse">
                        ✓ Profile updated and saved with success!
                      </p>
                    )}

                    <button 
                      onClick={() => {
                        setProfileName(tempName);
                        setProfileTitle(tempTitle);
                        setProfileBio(tempBio);
                        setProfileSuccessMsg(true);
                        setTimeout(() => setProfileSuccessMsg(false), 3000);
                      }}
                      className="bg-red-650 text-white p-4 rounded-xl font-bold w-full hover:bg-red-500 cursor-pointer"
                    >
                      Save Profile
                    </button>

                    <button 
                      onClick={() => {
                        if (confirm("Are you sure you want to completely clear local cache storage and start 100% fresh with zero cached posts or history? This will reset all local listings and reload the page.")) {
                          localStorage.clear();
                          window.location.reload();
                        }
                      }}
                      className="mt-2 text-xs text-rose-300 hover:text-rose-200 bg-white/5 hover:bg-white/10 py-2.5 px-4 rounded-xl w-full border border-dashed border-white/10 transition-colors cursor-pointer text-center font-semibold"
                    >
                      Reset Local Storage Cache
                    </button>
                  </div>
                )}
                {activeFeature === 'Identity Verification' && (
                  <div className="space-y-4">
                    {captureType ? (
                      <div className="space-y-4">
                        <video ref={videoRef} autoPlay playsInline className="w-full rounded-2xl bg-black" />
                        <button onClick={capturePhoto} className="bg-red-600 text-white p-4 rounded-xl font-bold w-full">Capture</button>
                      </div>
                    ) : (
                      <div className="bg-white/5 p-6 rounded-2xl border border-white/10 text-center space-y-4">
                        <p className="text-sm text-rose-200">Submit ID and Selfie to complete Verification.</p>
                        <button onClick={() => startCamera('id')} className="bg-white/20 p-4 rounded-xl w-full hover:bg-white/30 text-white font-semibold flex items-center justify-center gap-2">
                          📸 Capture Live ID
                        </button>
                        <input type="file" onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                              const reader = new FileReader();
                              reader.onload = (e) => setCapturedId(e.target?.result as string);
                              reader.readAsDataURL(e.target.files[0]);
                          }
                        }} className="w-full text-sm text-rose-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-white/10 file:text-white cursor-pointer" />
                        
                        <button onClick={() => startCamera('selfie')} className="bg-white/20 p-4 rounded-xl w-full hover:bg-white/30 text-white font-semibold flex items-center justify-center gap-2">
                          👤 Capture Live Selfie
                        </button>
                        
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          {capturedId && (
                            <div className="space-y-2">
                              <p className="text-xs text-rose-300">ID Preview</p>
                              <img src={capturedId} alt="Captured ID" className="w-full h-32 object-cover rounded-xl border border-white/20" />
                            </div>
                          )}
                          {capturedSelfie && (
                            <div className="space-y-2">
                              <p className="text-xs text-rose-300">Selfie Preview</p>
                              <img src={capturedSelfie} alt="Captured Selfie" className="w-full h-32 object-cover rounded-xl border border-white/20" />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {!captureType && (
                      <div className="space-y-4">
                        {verificationStatus === 'verifying' && (
                          <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10 space-y-2">
                            <span className="inline-block animate-spin text-red-400 text-2xl">⏳</span>
                            <p className="text-white font-medium">Pending Admin Verification...</p>
                            <p className="text-rose-300 text-xs">Verify this request in the "Admin Dashboard" of the 3-dot menu!</p>
                          </div>
                        )}
                        {verificationStatus === 'success' && <p className="text-center text-green-400 font-bold bg-green-500/10 py-3 rounded-xl border border-green-500/25">Verification Successful!</p>}
                        {verificationStatus === 'rejected' && <p className="text-center text-red-400 font-bold bg-red-500/10 py-3 rounded-xl border border-red-500/25">Verification Rejected!</p>}
                        {verificationStatus !== 'verifying' && (
                          <button 
                            onClick={handleVerification} 
                            disabled={!capturedId || !capturedSelfie}
                            className={`p-4 rounded-xl font-bold w-full transition-all ${
                              capturedId && capturedSelfie 
                                ? 'bg-red-600 text-white hover:bg-red-500' 
                                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            Start Verification
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {activeFeature === 'Cwallet' && (
                  <div className="space-y-4 text-slate-900">
                    {walletStep === 'balance' && (
                      <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                        <div className="text-sm font-bold text-red-500 uppercase tracking-widest mb-1">Balance</div>
                        <div className="text-4xl font-black text-slate-900 mb-6">{coinsBalance.toLocaleString()} COINS</div>
                        
                        {topupFeedback && (
                          <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs border border-emerald-100 animate-fade-in font-medium">
                            {topupFeedback}
                          </div>
                        )}
                        {transferFeedback && (
                          <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-xl text-xs border border-red-100 animate-fade-in font-medium">
                            {transferFeedback}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          <button 
                            onClick={() => setWalletStep('topup')} 
                            className="bg-red-600 text-white p-4 rounded-xl font-bold hover:bg-red-500 transition-all flex items-center justify-center gap-2"
                          >
                            💳 Topup
                          </button>
                          <button 
                            onClick={() => setWalletStep('transfer')} 
                            className="bg-red-100 text-red-955 p-4 rounded-xl font-bold hover:bg-red-200 transition-all flex items-center justify-center gap-2"
                          >
                            💸 Transfer
                          </button>
                        </div>
                      </div>
                    )}

                    {walletStep === 'topup' && (() => {
                      const topupOptions = [
                        { coins: '50', price: 'R5,00', ref: '50c' },
                        { coins: '100', price: 'R10,00', ref: '100c' },
                        { coins: '200', price: 'R20,00', ref: '200c' },
                        { coins: '400', price: 'R30,00', ref: '400c' },
                        { coins: '1000', price: 'R49,99', ref: '1000c' },
                      ];
                      const selectedOpt = topupOptions.find(opt => opt.coins === topupAmount) || topupOptions[0];

                      return (
                        <div className="bg-white p-6 rounded-2xl shadow-lg space-y-4">
                          <h4 className="text-lg font-bold text-slate-900">Request Coin Topup</h4>
                          
                          <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Select Coin Package</label>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                              {topupOptions.map(opt => (
                                <button
                                  key={opt.coins}
                                  type="button"
                                  onClick={() => setTopupAmount(opt.coins)}
                                  className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                                    topupAmount === opt.coins 
                                      ? 'border-red-600 bg-red-50 text-red-950 ring-2 ring-red-300' 
                                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  <span className="text-base font-black font-mono">{opt.coins}c</span>
                                  <span className="text-[11px] font-bold text-slate-500 mt-0.5">{opt.price}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Beautiful bank transfer details panel */}
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                              🏦 Capitec Bank Transfer Instructions
                            </h5>
                            <p className="text-xs text-slate-600">
                              Please login to your banking application and make a transfer of <strong className="text-slate-950">{selectedOpt.price}</strong> using the exact payment details below:
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                              <div className="bg-white p-2.5 rounded-lg border border-slate-100 flex justify-between items-center">
                                <div>
                                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Bank Name</span>
                                  <strong className="text-slate-800">Capitec</strong>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText("Capitec");
                                    alert("Bank name copied to clipboard!");
                                  }}
                                  className="text-[10px] text-red-600 font-bold hover:underline cursor-pointer"
                                >
                                  Copy
                                </button>
                              </div>
                              <div className="bg-white p-2.5 rounded-lg border border-slate-100 flex justify-between items-center">
                                <div>
                                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Account Holder</span>
                                  <strong className="text-slate-800">Matthews</strong>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText("Matthews");
                                    alert("Account holder name copied to clipboard!");
                                  }}
                                  className="text-[10px] text-red-600 font-bold hover:underline cursor-pointer"
                                >
                                  Copy
                                </button>
                              </div>
                              <div className="bg-white p-2.5 rounded-lg border border-slate-100 flex justify-between items-center">
                                <div>
                                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Account Number</span>
                                  <strong className="font-mono text-slate-900 tracking-wider">1334067366</strong>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText("1334067366");
                                    alert("Account number copied to clipboard!");
                                  }}
                                  className="text-[10px] text-red-600 font-bold hover:underline cursor-pointer"
                                >
                                  Copy
                                </button>
                              </div>
                              <div className="bg-white p-2.5 rounded-lg border border-slate-100 flex justify-between items-center ring-2 ring-amber-400 ring-offset-1">
                                <div>
                                  <span className="text-[10px] uppercase font-black text-amber-700 block text-left">Payment Reference</span>
                                  <strong className="font-mono text-slate-900 tracking-wider text-sm">{selectedOpt.ref}</strong>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(selectedOpt.ref);
                                    alert(`Payment reference "${selectedOpt.ref}" copied!`);
                                  }}
                                  className="text-[10px] text-red-600 font-bold hover:underline cursor-pointer"
                                >
                                  Copy
                                </button>
                              </div>
                            </div>
                            
                            <p className="text-[10px] text-amber-800 font-medium bg-amber-50/60 p-2 rounded-lg border border-amber-100">
                              ⚠️ <strong>Crucial:</strong> You MUST use <code>{selectedOpt.ref}</code> as the reference, otherwise the system won't be able to verify your transaction!
                            </p>
                          </div>

                          <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Provide Proof of Payment</label>
                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50 relative">
                              <input 
                                type="file" 
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    const reader = new FileReader();
                                    reader.onload = (e) => setTopupReceipt(e.target?.result as string);
                                    reader.readAsDataURL(e.target.files[0]);
                                  }
                                }} 
                                className="absolute inset-0 opacity-0 cursor-pointer"
                              />
                              {topupReceipt ? (
                                <div className="space-y-2">
                                  <p className="text-xs text-emerald-600 font-semibold">✓ Receipt loaded</p>
                                  <img src={topupReceipt} alt="Receipt Preview" className="mx-auto h-24 object-contain rounded-lg shadow-sm border border-slate-200" />
                                </div>
                              ) : (
                                <p className="text-xs text-slate-500">Click or Drag screenshot of your transaction invoice details.</p>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-3 pt-2">
                            <button 
                              type="button" 
                              onClick={() => setWalletStep('balance')} 
                              className="flex-1 bg-slate-100 text-slate-700 p-3.5 rounded-xl text-sm font-bold hover:bg-slate-200 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button 
                              type="button" 
                              onClick={async () => {
                                const amountNum = parseInt(topupAmount, 10);
                                if (isNaN(amountNum) || amountNum <= 0) {
                                  alert("Please enter a valid amount.");
                                  return;
                                }
                                if (!topupReceipt) {
                                  alert("Please upload your bank transfer payment receipt / proof of payment screenshot to proceed.");
                                  return;
                                }
                                const reqId = `req-topup-${Date.now()}`;
                                const newReq = {
                                  id: reqId,
                                  user: `${profileName} (You)`,
                                  type: 'Topup',
                                  amount: amountNum,
                                  documentUrl: topupReceipt,
                                  status: 'Pending',
                                  timestamp: 'Just now'
                                };
                                setPendingRequests(prev => [newReq, ...prev]);
                                setMyUncreditedTopups(prev => [...prev, { id: reqId, amount: amountNum }]);
                                setTopupFeedback(`Proof of payment for ${amountNum} COINS submitted (Ref: ${selectedOpt.ref}, Price: ${selectedOpt.price}). Go to Admin Dashboard to approve it!`);
                                setWalletStep('balance');
                                setTopupReceipt(null);

                                try {
                                  await dbInsertRequest(newReq);
                                } catch (err: any) {
                                  console.error("Failed to insert topup proof request into Supabase:", err);
                                  if (isTableMissingError(err)) {
                                    setDbError("Database tables are not created yet in your Supabase project.");
                                  }
                                }
                              }} 
                              className="flex-1 bg-red-600 text-white p-3.5 rounded-xl text-sm font-bold hover:bg-red-500 shadow-md cursor-pointer"
                            >
                              Submit Proof
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {walletStep === 'transfer' && (
                      <div className="bg-white p-6 rounded-2xl shadow-lg space-y-4">
                        <h4 className="text-lg font-bold text-slate-900">Transfer Coins</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Recipient Name</label>
                            <input 
                              type="text" 
                              placeholder="e.g. Sarah Jenkins" 
                              value={transferUser}
                              onChange={(e) => setTransferUser(e.target.value)}
                              className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-red-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Coins Amount</label>
                            <input 
                              type="number" 
                              placeholder="e.g. 150" 
                              value={transferAmount}
                              onChange={(e) => setTransferAmount(e.target.value)}
                              className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-red-500"
                            />
                            <p className="text-[11px] text-slate-400 mt-1">Available balance: {coinsBalance} COINS</p>
                          </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                          <button 
                            type="button" 
                            onClick={() => setWalletStep('balance')} 
                            className="flex-1 bg-slate-100 text-slate-700 p-3.5 rounded-xl text-sm font-bold hover:bg-slate-200"
                          >
                            Cancel
                          </button>
                          <button 
                            type="button" 
                            onClick={async () => {
                              const amt = parseInt(transferAmount, 10);
                              if (!transferUser.trim()) {
                                alert("Please state the recipient's name.");
                                return;
                              }
                              if (isNaN(amt) || amt <= 0 || amt > coinsBalance) {
                                alert("Insufficient balance or invalid coins quantity.");
                                return;
                              }
                              setCoinsBalance(prev => prev - amt);
                              setTransferFeedback(`Successfully transferred ${amt} COINS to ${transferUser}!`);
                              setWalletStep('balance');
                              setTransferUser('');
                              setTransferAmount('');
                            }} 
                            className="flex-1 bg-red-600 text-white p-3.5 rounded-xl text-sm font-bold hover:bg-red-500 shadow-md"
                          >
                            Send Coins
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {activeFeature === 'Admin Dashboard' && (
                  <div className="space-y-6">
                    {/* Production Setup & System Reset */}
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3.5">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-sm font-bold text-white uppercase tracking-wider">⚙️ Global Live Mode Setup</h4>
                          <p className="text-[11px] text-rose-200 mt-1 max-w-sm">Clear testing artifacts, reset the general ledger to R0,00, and flush live collections to establish a clean environment for production clients.</p>
                        </div>
                        <div className="px-2.5 py-1 rounded bg-green-500/10 border border-green-500/30 text-[10px] text-green-400 uppercase font-black animate-pulse">
                          Live Active
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm("⚠️ WARNING: This will immediately delete ALL pending requests, active gigs, marketplace items, and chat records on both Supabase AND client cache. Proceed?")) {
                              return;
                            }
                            
                            try {
                              // 1. Reset remote Supabase tables 
                              await dbResetAllData();

                              // 2. Clear local React state
                              setCoinsBalance(0);
                              setLiveProfit(0);
                              setPendingRequests([]);
                              setMyUncreditedTopups([]);
                              setVerificationStatus('idle');
                              setCapturedSelfie(null);

                              // 3. Purge cached values in localStorage
                              localStorage.removeItem('hub_coins');
                              localStorage.removeItem('hub_live_profit');
                              localStorage.removeItem('hub_pending_requests');
                              localStorage.removeItem('hub_uncredited_topups');
                              localStorage.removeItem('hub_verification_status');
                              localStorage.removeItem('hub_captured_selfie');

                              alert("🎉 Success! The entire platform state has been reset. Supabase database tables have been cleared, balances set to 0, and initialized in full Live Production mode!");
                            } catch (err: any) {
                              console.error("Failed to reset system databases:", err);
                              alert(`Error during reset: ${err.message || err}. Please ensure Supabase connection is active.`);
                            }
                          }}
                          className="bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                        >
                          🔥 Reset All State (Supabase + Local)
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setCoinsBalance(0);
                            localStorage.setItem('hub_coins', '0');
                            alert("Cwallet Balance cleared back to 0 COINS!");
                          }}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
                        >
                          🪙 Reset Cwallet to 0 COINS
                        </button>
                      </div>
                    </div>

                    {/* Glowing Analytics Grid */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-red-950/80 p-4 rounded-2xl border border-white/5 relative overflow-hidden flex flex-col justify-between">
                        <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        <span className="text-[10px] text-rose-300 font-mono tracking-wider uppercase font-bold">Live Profit</span>
                        <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-1">R{liveProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      </div>
                      <div className="bg-red-950/60 p-4 rounded-2xl border border-white/5 flex flex-col justify-between">
                        <span className="text-[10px] text-rose-300 font-mono tracking-wider uppercase font-bold">Active Users</span>
                        <div className="text-xl sm:text-2xl font-black text-rose-50 font-mono mt-1">{activeUsersCount}</div>
                      </div>
                      <div className="bg-red-950/60 p-4 rounded-2xl border border-white/5 flex flex-col justify-between">
                        <span className="text-[10px] text-rose-300 font-mono tracking-wider uppercase font-bold">Online Users</span>
                        <div className="text-xl sm:text-2xl font-black text-sky-400 font-mono mt-1 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse inline-block" />
                          {onlineUsersCount}
                        </div>
                      </div>
                    </div>

                    {/* Pending Verification Feed */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold tracking-wider uppercase text-rose-200">Customer Requests Queue</h4>
                      
                      {pendingRequests.length === 0 ? (
                        <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/5 text-rose-300">
                          🎉 All approval queues are clear!
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                          {pendingRequests.map((req) => (
                            <div key={req.id} className="p-4 bg-white/5 hover:bg-white/10 transition-all rounded-2xl border border-white/5 space-y-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="text-white font-bold text-sm">{req.user}</div>
                                  <div className="text-rose-300 text-xs mt-0.5">{req.timestamp}</div>
                                </div>
                                <div className="space-x-1 flex items-center">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                    req.type === 'Topup' 
                                      ? 'bg-emerald-500/10 text-emerald-400' 
                                      : 'bg-red-500/10 text-rose-400'
                                  }`}>
                                    {req.type === 'Topup' ? 'Topup Proof' : 'Identity ID'}
                                  </span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                    req.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 animate-pulse' :
                                    req.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                  }`}>
                                    {req.status}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-4">
                                <div className="text-xs text-rose-100 flex-1">
                                  {req.type === 'Topup' ? (
                                    <span>Requests <strong className="text-emerald-400">+{req.amount} COINS</strong> (Verify payment screenshot)</span>
                                  ) : (
                                    <span>Requests KYC account verification approval</span>
                                  )}
                                </div>
                                {req.documentUrl && (
                                  <button
                                    onClick={() => setFullScreenImageUrl(req.documentUrl)}
                                    className="relative group cursor-pointer focus:outline-none"
                                    title="View Full Screen document proof"
                                  >
                                    <img 
                                      src={req.documentUrl} 
                                      alt="Doc Thumbnail" 
                                      className="w-12 h-12 object-cover rounded-lg border border-white/10 group-hover:opacity-70 transition-all" 
                                    />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-lg transition-all">
                                      <span className="text-[10px] font-bold text-white">🔎</span>
                                    </div>
                                  </button>
                                )}
                              </div>

                              {req.status === 'Pending' && (
                                <div className="grid grid-cols-2 gap-2 pt-1">
                                  <button 
                                    onClick={async () => {
                                      setPendingRequests(prev => prev.map(item => {
                                        if (item.id === req.id) {
                                          if (item.type === 'Topup') {
                                            const isPersonal = myUncreditedTopups.some(t => t.id === req.id);
                                            if (!isPersonal) {
                                              setCoinsBalance(bal => bal + item.amount);
                                            }
                                            setLiveProfit(prof => prof + (item.amount * 0.1));
                                          } else if (item.type === 'Verification') {
                                            setVerificationStatus('success');
                                          }
                                          return { ...item, status: 'Approved' };
                                        }
                                        return item;
                                      }));

                                      try {
                                        await dbUpdateRequestStatus(req.id, 'Approved');
                                      } catch (err) {
                                        console.error("Failed to approve request in Supabase:", err);
                                      }
                                    }}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-2 px-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                                  >
                                    ✓ Approve & Credit
                                  </button>
                                  <button 
                                    onClick={async () => {
                                      setPendingRequests(prev => prev.map(item => {
                                        if (item.id === req.id) {
                                          if (item.type === 'Verification') {
                                            setVerificationStatus('rejected');
                                          }
                                          return { ...item, status: 'Rejected' };
                                        }
                                        return item;
                                      }));

                                      try {
                                        await dbUpdateRequestStatus(req.id, 'Rejected');
                                      } catch (err) {
                                        console.error("Failed to reject request in Supabase:", err);
                                      }
                                    }}
                                    className="bg-red-500/20 hover:bg-red-500/40 text-red-200 font-bold py-2 px-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 border border-red-500/30"
                                  >
                                    ✕ Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeFeature === 'Help and Support' && (
                  <div className="space-y-4">
                    <div className="h-64 border border-white/10 rounded-2xl p-4 bg-white/5 overflow-y-auto space-y-3">
                        {chatMessages.map((m, i) => (
                            <div key={i} className={`p-3 rounded-xl max-w-[80%] ${m.sender === 'user' ? 'bg-red-650 ml-auto' : 'bg-white/10'}`}>
                                <p className="text-sm text-rose-50 font-bold">{m.sender === 'bot' ? 'AI Bot' : 'You'}</p>
                                <p className="text-rose-100">{m.text}</p>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input 
                            className="flex-1 p-4 bg-white/10 rounded-xl border border-white/10 text-white placeholder-rose-300" 
                            placeholder="Ask something..." 
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSupportBotMessage()}
                        />
                        <button onClick={handleSupportBotMessage} className="bg-red-600 p-4 rounded-xl font-bold hover:bg-red-500">Send</button>
                    </div>
                  </div>
                )}

                {activeFeature === 'Supabase Database' && (
                  <div className="space-y-4 text-xs font-mono text-slate-100">
                    <p className="text-slate-200">
                      Your app is connected to your personal Supabase Project backend! Both reads and writes are direct and fully persistent.
                    </p>
                    <div className="space-y-1 bg-white/5 p-3 rounded-xl border border-white/10">
                      <div><strong className="text-rose-300 font-bold font-sans text-[11px]">PROJECT URL:</strong> https://pyfzjqpbukavtvlpgyse.supabase.co</div>
                      <div><strong className="text-rose-300 font-bold font-sans text-[11px]">ANON KEY:</strong> Connected (Ends with {`...H3JjUw`})</div>
                      <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-sans">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Status: Live Client Active
                      </div>
                    </div>

                    <div className="space-y-2">
                       <div className="flex justify-between items-center">
                          <span className="font-sans font-extrabold text-[#fda4af] text-sm tracking-wide">Database SQL Schema</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
                              alert("Copied SQL Schema to Clipboard! Run it in your Supabase SQL Editor to set up your tables.");
                            }}
                            className="bg-red-600 font-sans hover:bg-red-500 text-white font-bold px-3 py-1 rounded-lg text-[11px] transition-colors cursor-pointer"
                          >
                            Copy SQL Snippet
                          </button>
                       </div>
                       <textarea 
                         readOnly
                         value={SUPABASE_SQL_SCHEMA} 
                         className="w-full text-[10px] leading-relaxed p-3 bg-slate-950 text-emerald-400 h-64 border border-white/10 rounded-xl outline-none overflow-y-auto"
                       />
                       <p className="text-slate-300 text-[10px] italic font-sans">
                         💡 Paste this inside your Supabase dashboard "SQL Editor" and press "Run". This creates columns, assigns the primary keys, and turns on Row Level Security permissions for clean multi-user access.
                       </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Premium Header Bar */}
        <div id="app-top-header" className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-30 select-none">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-black bg-gradient-to-r from-red-650 to-red-800 text-white px-2 py-1 rounded-lg font-mono leading-none tracking-tight">TG</span>
            <div>
              <span className="font-extrabold tracking-tight text-slate-900 text-sm block">TimeGiG Hub</span>
              {verificationStatus === 'success' ? (
                <span className="text-[9px] text-red-600 font-bold uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse inline-block" />
                  Fully Activated
                </span>
              ) : (
                <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-widest block">
                  Pending Activation
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Selfie Profile Picture Display */}
            <div 
              onClick={() => {
                setActiveFeature('UserPro');
                setIsMenuOpen(true);
              }}
              className="relative cursor-pointer group"
              title="Click to view UserPro Profile"
            >
              <img 
                src={capturedSelfie || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"} 
                alt="User Selfie" 
                className={`w-9 h-9 rounded-full object-cover border-2 shadow-sm transition-all group-hover:scale-105 ${
                  verificationStatus === 'success' ? 'border-red-600 ring-2 ring-red-100' : 'border-slate-300'
                }`}
              />
              {/* Activated Indicator Red Mark */}
              {verificationStatus === 'success' ? (
                <span className="absolute -bottom-0.5 -right-0.5 w-[11px] h-[11px] bg-red-600 rounded-full border-2 border-white shadow-sm ring-1 ring-red-400 animate-pulse" />
              ) : (
                <span className="absolute -bottom-0.5 -right-0.5 w-[11px] h-[11px] bg-amber-400 rounded-full border-2 border-white shadow-sm" />
              )}
            </div>

            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-800"
              aria-label="Toggle Navigation Menu"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Supabase uninitialized alert banner */}
        {dbError && (
          <div className="bg-amber-50 border-b border-amber-200 py-3 px-5 flex items-center justify-between gap-3 text-amber-950 text-xs shadow-sm">
            <span className="flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span><strong>Database Setup Required:</strong> It looks like your Supabase tables are not created yet. Tap <strong>Setup Database</strong> to copy the quick SQL schema.</span>
            </span>
            <button
              onClick={() => {
                setActiveFeature('Supabase Database');
                setIsMenuOpen(true);
              }}
              className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-1.5 px-3 rounded-lg text-[10px] uppercase font-sans tracking-wide cursor-pointer transition-colors"
            >
              Setup Database
            </button>
          </div>
        )}
        <div id="tab-content-container" className="flex-1 overflow-hidden">
          {activeTab === 'gigs' && (
            <GigsTab 
              gigs={gigs} 
              onAddGig={handleAddGig} 
              onApplyGig={handleApplyGig} 
              setIsCreating={setIsCreating}
              profileName={profileName}
            />
          )}
          {activeTab === 'chat' && (
            <ChatTab 
              conversations={conversations} 
              activeConversationId={activeConversationId}
              onSetActiveConversationId={setActiveConversationId}
              onSendMessage={handleSendMessage}
              onExitChat={() => setActiveTab('gigs')}
            />
          )}
          {activeTab === 'market' && (
            <MarketTab 
              items={marketItems} 
              onAddItem={handleAddItem} 
              onInquireItem={handleInquireItem} 
              setIsCreating={setIsCreating}
              profileName={profileName}
            />
          )}
        </div>

        {/* 3 FEATUES Tab Navigation bar at the bottom, clearly separated */}
        {activeTab !== 'chat' && !isCreating && (
          <div 
            id="app-bottom-navbar" 
            className="bg-white border-t border-slate-200/90 px-6 py-3 pb-4 sm:pb-3 flex justify-around items-center select-none"
          >
            {/* Tab 1: Gigs */}
            <button
              id="nav-tab-gigs"
              onClick={() => setActiveTab('gigs')}
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-1.5 rounded-xl transition-all relative cursor-pointer focus:outline-none ${
                activeTab === 'gigs' 
                  ? 'text-slate-950 font-bold scale-[1.02]' 
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <div className="relative">
                <Briefcase className={`w-5.5 h-5.5 transition-transform ${activeTab === 'gigs' ? 'scale-110 text-slate-950' : 'text-slate-400'}`} />
                {openGigsCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-slate-950 text-white text-[9px] font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center border border-white">
                    {openGigsCount}
                  </span>
                )}
              </div>
              <span className="text-[11px] tracking-tight">Gigs</span>
              {activeTab === 'gigs' && (
                <span className="absolute bottom-0 w-8 h-0.75 bg-slate-950 rounded-full" />
              )}
            </button>

            {/* Separation Rule */}
            <div className="h-6 w-px bg-slate-250 self-center" />

            {/* Tab 2: Chat */}
            <button
              id="nav-tab-chat"
              onClick={() => {
                setActiveTab('chat');
                // By default focus first convo if clicking on chat from bottom bar and none is active
                if (conversations.length > 0 && !activeConversationId) {
                  setActiveConversationId(null);
                }
              }}
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-1.5 rounded-xl transition-all relative cursor-pointer focus:outline-none ${
                activeTab === 'chat' 
                  ? 'text-slate-950 font-bold scale-[1.02]' 
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <div className="relative">
                <MessageSquare className={`w-5.5 h-5.5 transition-transform ${activeTab === 'chat' ? 'scale-110 text-slate-950' : 'text-slate-400'}`} />
                <span className="absolute -top-1.5 -right-1.5 bg-sky-500 text-white text-[9px] font-bold h-3 w-3 rounded-full flex items-center justify-center animate-pulse border border-white" />
              </div>
              <span className="text-[11px] tracking-tight">Chat</span>
              {activeTab === 'chat' && (
                <span className="absolute bottom-0 w-8 h-0.75 bg-slate-950 rounded-full" />
              )}
            </button>

            {/* Separation Rule */}
            <div className="h-6 w-px bg-slate-250 self-center" />

            {/* Tab 3: Market */}
            <button
              id="nav-tab-market"
              onClick={() => setActiveTab('market')}
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-1.5 rounded-xl transition-all relative cursor-pointer focus:outline-none ${
                activeTab === 'market' 
                  ? 'text-slate-950 font-bold scale-[1.02]' 
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <div>
                <ShoppingBag className={`w-5.5 h-5.5 transition-transform ${activeTab === 'market' ? 'scale-110 text-slate-950' : 'text-slate-400'}`} />
              </div>
              <span className="text-[11px] tracking-tight">Market</span>
              {activeTab === 'market' && (
                <span className="absolute bottom-0 w-8 h-0.75 bg-slate-950 rounded-full" />
              )}
            </button>
          </div>
        )}
        {/* Full-screen proof preview overlay modal */}
        {fullScreenImageUrl && (
          <div 
            id="fullscreen-preview-overlay"
            className="fixed inset-0 bg-black/90 z-[100] flex flex-col items-center justify-center p-4 backdrop-blur-md animate-fade-in"
            onClick={() => setFullScreenImageUrl(null)}
          >
            <div className="absolute top-4 right-4 flex gap-2">
              <button 
                onClick={() => setFullScreenImageUrl(null)} 
                className="bg-white/10 hover:bg-white/20 text-white font-mono p-3 rounded-full transition-transform hover:scale-105"
                title="Close receipt preview"
              >
                ✕ Close Preview
              </button>
            </div>
            <div className="max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 p-2 flex flex-col items-center relative shadow-2xl" onClick={e => e.stopPropagation()}>
              <img 
                src={fullScreenImageUrl} 
                alt="Document proof details full size" 
                className="max-w-full max-h-[75vh] object-contain rounded-xl"
              />
              <div className="mt-4 text-center px-4">
                <p className="text-sm font-bold text-white tracking-wide">KYC / Receipt Document Proof details</p>
                <p className="text-xs text-indigo-400 mt-1 mb-2">Review the transaction layout carefully before decisioning</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
