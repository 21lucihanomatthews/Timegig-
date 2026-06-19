import { createClient } from '@supabase/supabase-js';
import { Gig, MarketItem, ChatConversation, Message } from '../types';

const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL || 'https://pyfzjqpbukavtvlpgyse.supabase.co';
const SUPABASE_ANON_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5ZnpqcXBidWthdnR2bHBneXNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MzA5NTEsImV4cCI6MjA5NzQwNjk1MX0.kYPiX-nkiP23YXl0nm3tWB6LMi7FShUWlo7OlH3JjUw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const SUPABASE_SQL_SCHEMA = `-- Copy and paste this script directly into your Supabase SQL Editor:

-- ---------------- GIGS TABLE ----------------
CREATE TABLE IF NOT EXISTS gigs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  budget NUMERIC NOT NULL,
  location TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] NOT NULL,
  "posterName" TEXT NOT NULL,
  "posterAvatar" TEXT,
  "imageUrl" TEXT NOT NULL,
  images TEXT[] NOT NULL,
  status TEXT NOT NULL,
  "createdAt" TEXT NOT NULL
);

-- Turn on public RLS for gigs
ALTER TABLE gigs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all access on gigs" ON gigs FOR ALL USING (true) WITH CHECK (true);


-- ------------- MARKET ITEMS TABLE -------------
CREATE TABLE IF NOT EXISTS market_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC NOT NULL,
  location TEXT NOT NULL,
  category TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  images TEXT[] NOT NULL,
  "sellerName" TEXT NOT NULL,
  "sellerAvatar" TEXT,
  condition TEXT NOT NULL,
  "createdAt" TEXT NOT NULL
);

-- Turn on public RLS for market_items
ALTER TABLE market_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all access on market_items" ON market_items FOR ALL USING (true) WITH CHECK (true);


-- ---------------- CHATS TABLE ----------------
CREATE TABLE IF NOT EXISTS chats (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  "avatarUrl" TEXT,
  "lastMessageText" TEXT NOT NULL,
  "lastMessageTime" TEXT NOT NULL,
  messages JSONB NOT NULL,
  status TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Turn on public RLS for chats
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all access on chats" ON chats FOR ALL USING (true) WITH CHECK (true);


-- ------------- PENDING REQUESTS TABLE -------------
CREATE TABLE IF NOT EXISTS pending_requests (
  id TEXT PRIMARY KEY,
  "user" TEXT NOT NULL,
  type TEXT NOT NULL,
  amount NUMERIC,
  "documentUrl" TEXT NOT NULL,
  "documentUrlSelfie" TEXT,
  status TEXT NOT NULL,
  timestamp TEXT NOT NULL
);

-- Turn on public RLS for pending_requests
ALTER TABLE pending_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all access on pending_requests" ON pending_requests FOR ALL USING (true) WITH CHECK (true);


-- ------------- USER PRESENCE TABLE -------------
CREATE TABLE IF NOT EXISTS user_presence (
  id TEXT PRIMARY KEY,
  user_name TEXT NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Turn on public RLS for user_presence
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all access on user_presence" ON user_presence FOR ALL USING (true) WITH CHECK (true);
`;

// Helper detection of missing table errors
export function isTableMissingError(error: any): boolean {
  if (!error) return false;
  const message = error.message?.toLowerCase() || '';
  return message.includes('does not exist') || message.includes('relation') || error.code === '42P01';
}

// Gigs CRUD
export async function dbFetchGigs(): Promise<Gig[]> {
  const { data, error } = await supabase
    .from('gigs')
    .select('*')
    .order('createdAt', { ascending: false });
  if (error) throw error;
  return data as Gig[];
}

export async function dbInsertGig(gig: Gig): Promise<void> {
  const { error } = await supabase.from('gigs').insert(gig);
  if (error) throw error;
}

export async function dbUpdateGigStatus(gigId: string, status: 'Open' | 'Closed' | 'Applied'): Promise<void> {
  const { error } = await supabase.from('gigs').update({ status }).eq('id', gigId);
  if (error) throw error;
}

// Market Items CRUD
export async function dbFetchMarketItems(): Promise<MarketItem[]> {
  const { data, error } = await supabase
    .from('market_items')
    .select('*')
    .order('createdAt', { ascending: false });
  if (error) throw error;
  return data as MarketItem[];
}

export async function dbInsertMarketItem(item: MarketItem): Promise<void> {
  const { error } = await supabase.from('market_items').insert(item);
  if (error) throw error;
}

// Chats CRUD
export async function dbFetchChats(): Promise<ChatConversation[]> {
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .order('createdAt', { ascending: false });
  if (error) throw error;
  // Make sure messages are handled as array
  return (data || []).map(chat => ({
    ...chat,
    messages: typeof chat.messages === 'string' ? JSON.parse(chat.messages) : chat.messages
  })) as ChatConversation[];
}

export async function dbInsertChat(chat: ChatConversation): Promise<void> {
  const { error } = await supabase.from('chats').insert({
    id: chat.id,
    title: chat.title,
    subtitle: chat.subtitle,
    avatarUrl: chat.avatarUrl,
    lastMessageText: chat.lastMessageText,
    lastMessageTime: chat.lastMessageTime,
    messages: chat.messages, // JSONB structure supports passing arrays/objects straight
    status: chat.status || null
  });
  if (error) throw error;
}

export async function dbUpdateChatMessages(chatId: string, messages: Message[], lastText: string, lastTime: string): Promise<void> {
  const { error } = await supabase
    .from('chats')
    .update({
      messages: messages,
      lastMessageText: lastText,
      lastMessageTime: lastTime
    })
    .eq('id', chatId);
  if (error) throw error;
}

// Pending Requests (Admin verification / Topup)
export async function dbFetchRequests(): Promise<any[]> {
  const { data, error } = await supabase
    .from('pending_requests')
    .select('*');
  if (error) throw error;
  return data || [];
}

export async function dbInsertRequest(request: any): Promise<void> {
  const { error } = await supabase.from('pending_requests').insert({
    id: request.id,
    user: request.user,
    type: request.type,
    amount: request.amount || null,
    documentUrl: request.documentUrl,
    documentUrlSelfie: request.documentUrlSelfie || null,
    status: request.status,
    timestamp: request.timestamp
  });
  if (error) throw error;
}

export async function dbUpdateRequestStatus(reqId: string, status: string): Promise<void> {
  const { error } = await supabase
    .from('pending_requests')
    .update({ status })
    .eq('id', reqId);
  if (error) throw error;
}

export async function dbResetAllData(): Promise<void> {
  // Clear tables
  try {
    const r1 = await supabase.from('pending_requests').delete().neq('id', '_not_matching_sentinel_');
    if (r1.error) console.error("Error clearing pending_requests:", r1.error);
    
    const r2 = await supabase.from('gigs').delete().neq('id', '_not_matching_sentinel_');
    if (r2.error) console.error("Error clearing gigs:", r2.error);
    
    const r3 = await supabase.from('market_items').delete().neq('id', '_not_matching_sentinel_');
    if (r3.error) console.error("Error clearing market_items:", r3.error);
    
    const r4 = await supabase.from('chats').delete().neq('id', '_not_matching_sentinel_');
    if (r4.error) console.error("Error clearing chats:", r4.error);

    const r5 = await supabase.from('user_presence').delete().neq('id', '_not_matching_sentinel_');
    if (r5.error) console.error("Error clearing user_presence:", r5.error);
  } catch (err) {
    console.error("Failed to reset database tables:", err);
    throw err;
  }
}

// Session identifier for presence
const sessionId = (() => {
  if (typeof window === 'undefined') return 'server';
  let sid = sessionStorage.getItem('hub_presence_session_id');
  if (!sid) {
    sid = 'sess_' + Math.random().toString(36).substring(2, 10);
    sessionStorage.setItem('hub_presence_session_id', sid);
  }
  return sid;
})();

export async function dbUpdatePresence(username: string): Promise<void> {
  try {
    const { error } = await supabase.from('user_presence').upsert({
      id: sessionId,
      user_name: username,
      last_seen: new Date().toISOString()
    });
    if (error) {
      console.warn("Could not upsert presence:", error.message);
    }
  } catch (err) {
    console.warn("Presence upsert failed:", err);
  }
}

export async function dbFetchLivePresence(): Promise<{ active: number; online: number } | null> {
  try {
    const { data, error } = await supabase.from('user_presence').select('*');
    if (error) {
      console.warn("Could not fetch presence rows:", error.message);
      return null;
    }
    if (!data || data.length === 0) {
      return { active: 1, online: 1 };
    }

    const now = Date.now();
    const activeThresholdMs = 24 * 60 * 60 * 1000; // 24 hours to count as an active member
    const onlineThresholdMs = 45 * 1000; // 45 seconds to count as currently online

    const onlineRows = data.filter(row => {
      const lastSeenTime = new Date(row.last_seen).getTime();
      return now - lastSeenTime < onlineThresholdMs;
    });

    const activeRows = data.filter(row => {
      const lastSeenTime = new Date(row.last_seen).getTime();
      return now - lastSeenTime < activeThresholdMs;
    });

    const uniqueActiveNames = new Set(activeRows.map(row => row.user_name));
    const uniqueOnlineNames = new Set(onlineRows.map(row => row.user_name));

    return {
      active: Math.max(1, uniqueActiveNames.size),
      online: Math.max(1, uniqueOnlineNames.size)
    };
  } catch (err) {
    console.warn("Presence select query failed:", err);
    return null;
  }
}

