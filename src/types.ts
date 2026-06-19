export interface Gig {
  id: string;
  title: string;
  description: string;
  budget: number;
  location: string;
  category: 'Design' | 'Development' | 'Writing' | 'Marketing' | 'Short Task' | 'Delivery' | 'Pet Sitting' | 'Cleaning' | 'Handyman' | 'Other';
  tags: string[];
  posterName: string;
  posterAvatar?: string;
  imageUrl: string;
  images?: string[];
  status: 'Open' | 'Closed' | 'Applied';
  createdAt: string;
}

export interface MarketItem {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  category: 'Electronics' | 'Apparel' | 'Books' | 'Fringe & Vintage' | 'Assets & Software' | 'Other';
  imageUrl: string;
  images?: string[];
  sellerName: string;
  sellerAvatar?: string;
  condition: 'New' | 'Like New' | 'Good' | 'Fair';
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: 'user' | 'other';
  text?: string;
  type: 'text' | 'image' | 'video';
  content?: string; // Base64 or URL
  timestamp: string;
}

export interface ChatConversation {
  id: string;
  title: string;
  subtitle: string;
  avatarUrl?: string;
  lastMessageText: string;
  lastMessageTime: string;
  messages: Message[];
  status?: string;
}
