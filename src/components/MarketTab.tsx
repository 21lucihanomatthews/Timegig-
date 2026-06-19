import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  Search, 
  Plus, 
  Tag, 
  DollarSign, 
  Layers, 
  User, 
  X, 
  MessageSquare,
  Sparkles,
  Bookmark,
  Upload,
  ChevronLeft,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { MarketItem } from '../types';

interface MarketTabProps {
  items: MarketItem[];
  onAddItem: (item: Omit<MarketItem, 'id' | 'createdAt'>) => void;
  onInquireItem: (itemId: string, sellerName: string, itemTitle: string) => void;
  setIsCreating: (isCreating: boolean) => void;
  profileName: string;
}

export default function MarketTab({ items, onAddItem, onInquireItem, setIsCreating, profileName }: MarketTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  useEffect(() => {
    setIsCreating(isListModalOpen);
    if (isListModalOpen) {
      setNewSeller(profileName);
    }
  }, [isListModalOpen, setIsCreating, profileName]);

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newLocation, setNewLocation] = useState('Johannesburg');
  const [customLocation, setCustomLocation] = useState('');
  const [newCategory, setNewCategory] = useState<'Electronics' | 'Apparel' | 'Books' | 'Fringe & Vintage' | 'Assets & Software' | 'Other'>('Electronics');
  const [newCondition, setNewCondition] = useState<'New' | 'Like New' | 'Good' | 'Fair'>('Like New');
  const [newDesc, setNewDesc] = useState('');
  const [newSeller, setNewSeller] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const categories = ['All', 'Electronics', 'Apparel', 'Books', 'Fringe & Vintage', 'Assets & Software', 'Other'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files) as File[];
      filesArray.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setUploadedImages((prev) => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const filesArray = Array.from(e.dataTransfer.files) as File[];
      filesArray.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setUploadedImages((prev) => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeUploadedImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sellerName.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Normalize category match
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newPrice || !newSeller || !newDesc) {
      alert('Please fill out all required fields.');
      return;
    }

    const priceNum = parseFloat(newPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      alert('Please provide a valid price amount.');
      return;
    }

    const finalLocation = newLocation === 'Other' ? (customLocation.trim() || 'Other') : newLocation;

    onAddItem({
      title: newTitle,
      description: newDesc,
      price: priceNum,
      location: finalLocation,
      category: newCategory,
      imageUrl: uploadedImages.length > 0 ? uploadedImages[0] : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop',
      images: uploadedImages.length > 0 ? uploadedImages : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop'],
      sellerName: newSeller,
      condition: newCondition,
    });

    // Reset Form
    setNewTitle('');
    setNewPrice('');
    setNewLocation('Johannesburg');
    setCustomLocation('');
    setNewCategory('Electronics');
    setNewCondition('Like New');
    setNewDesc('');
    setNewSeller('');
    setUploadedImages([]);
    setDragActive(false);
    setIsListModalOpen(false);
  };

  const getConditionColor = (cond: string) => {
    switch (cond) {
      case 'New': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Like New': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Good': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-amber-50 text-amber-700 border-amber-100';
    }
  };

  return (
    <div id="market-tab-container" className="flex flex-col h-full bg-slate-50">
      {/* Header Banner */}
      <div id="market-header" className="p-6 bg-white border-b border-slate-100 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-slate-700" />
              Marketplace
            </h2>
            <p className="text-xs text-slate-500 mt-1">Buy and sell second-hand items</p>
          </div>
          <button 
            id="list-item-btn"
            onClick={() => setIsListModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-950 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Sell Item</span>
          </button>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </span>
            <input 
              id="market-search"
              type="text" 
              placeholder="Search items by name, seller, specifications..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-55 border border-slate-200 rounded-xl text-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all text-slate-800"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Categories Carousel */}
        <div id="market-cat-filters" className="flex items-center gap-2 overflow-x-auto pb-1 -mx-2 px-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                selectedCategory === cat 
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Catalog Area */}
      <div id="market-scroll-area" className="flex-1 overflow-y-auto p-4">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4 bg-white rounded-2xl border border-slate-100">
            <div className="p-4 bg-slate-50 rounded-full mb-3 text-slate-400">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <p className="text-sm font-medium text-slate-800">No items on sale match your query</p>
            <p className="text-xs text-slate-400 mt-1">Try selecting a different filter or search for generic products</p>
            {(searchQuery || selectedCategory !== 'All') && (
              <button 
                onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                className="mt-4 text-xs font-semibold text-slate-900 underline hover:text-slate-700"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layoutId={`market-card-${item.id}`}
                onClick={() => { setSelectedItem(item); setActiveImageIndex(0); }}
                className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col group"
              >
                {/* Product Image Panel */}
                <div className="relative aspect-video w-full bg-slate-100 overflow-hidden">
                  <img 
                    src={item.imageUrl} 
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  />
                  
                  {/* Quick Fullscreen Button */}
                  <button
                    type="button"
                    title="View full image"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFullscreenImage(item.imageUrl);
                    }}
                    className="absolute top-2.5 left-2.5 p-1.5 bg-slate-950/65 hover:bg-slate-950/85 backdrop-blur-xs text-white rounded-lg transition-all hover:scale-105 cursor-pointer opacity-0 group-hover:opacity-100 flex items-center justify-center shadow-xs"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Price Tag Overlay */}
                  <div className="absolute top-2.5 right-2.5 bg-slate-950/90 text-white px-2.5 py-1 rounded-lg text-xs font-bold font-mono tracking-tight shadow-sm">
                    R{item.price.toLocaleString()}
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                        {item.category} • {item.location}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getConditionColor(item.condition)}`}>
                        {item.condition}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-slate-800 transition-colors line-clamp-1 leading-tight mb-1">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-3.5 pt-2.5 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {item.sellerAvatar ? (
                        <img src={item.sellerAvatar} alt={item.sellerName} className="w-5 h-5 rounded-full object-cover border border-slate-200" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[9px] font-semibold text-slate-600">
                          {item.sellerName.charAt(0)}
                        </div>
                      )}
                      <span className="text-[10px] text-slate-500 font-medium truncate max-w-[80px]">
                        {item.sellerName}
                      </span>
                    </div>

                    <span className="text-[10px] font-semibold text-slate-900 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Inquire now
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Item Details Overlay */}
      <AnimatePresence>
        {selectedItem && (
          <div id="market-detail-backdrop" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              id="market-detail-card"
              className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
            >
              {/* Cover Photo Slideshow with Indicators */}
              {(() => {
                const itemImages = selectedItem.images && selectedItem.images.length > 0 
                  ? selectedItem.images 
                  : [selectedItem.imageUrl];
                return (
                  <div 
                    onClick={() => setFullscreenImage(itemImages[activeImageIndex] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop')}
                    className="relative h-60 w-full bg-slate-100 overflow-hidden group/modal cursor-zoom-in"
                  >
                    <img 
                      src={itemImages[activeImageIndex] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop'} 
                      alt={selectedItem.title} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-all duration-300 group-hover/modal:scale-102"
                    />

                    {/* Maximize Icon Indicator */}
                    <div className="absolute top-4 left-4 p-2 bg-slate-950/50 hover:bg-slate-950/80 backdrop-blur-xs rounded-full text-white transition-opacity opacity-0 group-hover/modal:opacity-100 flex items-center justify-center pointer-events-none">
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                    
                    {itemImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveImageIndex((prev) => (prev === 0 ? itemImages.length - 1 : prev - 1));
                          }}
                          className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 bg-slate-950/60 hover:bg-slate-950/80 text-white rounded-full transition-all cursor-pointer opacity-80 group-hover/modal:opacity-100"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveImageIndex((prev) => (prev === itemImages.length - 1 ? 0 : prev + 1));
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-slate-950/60 hover:bg-slate-950/80 text-white rounded-full transition-all cursor-pointer opacity-80 group-hover/modal:opacity-100"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        
                        {/* Page dots status overlay */}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/40 px-2 py-1 rounded-full">
                          {itemImages.map((_, idx) => (
                            <span
                              key={idx}
                              className={`h-1.5 rounded-full transition-all ${
                                idx === activeImageIndex ? 'w-3.5 bg-white' : 'w-1.5 bg-white/50'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}

                    <button 
                      onClick={() => setSelectedItem(null)}
                      className="absolute top-4 right-4 p-2 bg-slate-950/50 backdrop-blur-xs rounded-full text-white hover:bg-slate-950/80 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-4 left-4 bg-slate-950 text-white px-3.5 py-1.5 rounded-xl font-mono text-base font-bold shadow-md">
                      Price: R{selectedItem.price.toLocaleString()}
                    </div>
                  </div>
                );
              })()}

              {/* Mini Slideshow thumbnail strip */}
              {(() => {
                const itemImages = selectedItem.images && selectedItem.images.length > 0 ? selectedItem.images : [];
                if (itemImages.length <= 1) return null;
                return (
                  <div className="flex gap-2 overflow-x-auto px-6 py-2 bg-slate-50 border-b border-slate-100 scrollbar-none">
                    {itemImages.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImageIndex(idx)}
                        className={`relative w-12 h-8 rounded-lg border overflow-hidden flex-shrink-0 cursor-pointer transition-all ${
                          idx === activeImageIndex ? 'ring-2 ring-slate-950 border-transparent scale-102' : 'border-slate-200 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>
                );
              })()}

              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {selectedItem.category}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${getConditionColor(selectedItem.condition)}`}>
                    Condition: {selectedItem.condition}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-snug">
                  {selectedItem.title}
                </h3>

                <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 pb-4 border-b border-slate-100">
                  <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-[9px] text-slate-600">
                    {selectedItem.sellerName.charAt(0)}
                  </div>
                  <span>Offered for sale by <strong className="font-semibold text-slate-700">{selectedItem.sellerName}</strong></span>
                </div>

                <div className="mt-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Product Description</h4>
                  <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                    {selectedItem.description}
                  </p>
                </div>

                {/* Actions */}
                <div className="mt-8 pt-4 border-t border-slate-100 flex gap-3">
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="flex-1 py-3 text-slate-600 bg-slate-50 hover:bg-slate-100 font-semibold rounded-xl text-sm transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onInquireItem(selectedItem.id, selectedItem.sellerName, selectedItem.title);
                      setSelectedItem(null);
                    }}
                    className="flex-[1.5] py-3 bg-slate-900 hover:bg-slate-850 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Inquire via Chat
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sell an Item Overlay Form */}
      <AnimatePresence>
        {isListModalOpen && (
          <div id="sell-item-backdrop" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              id="sell-item-modal"
              className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">List item for sale</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Post second-hand gear or digital software assets</p>
                </div>
                <button 
                  onClick={() => setIsListModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Item Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vintage Leather Jacket"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Category *</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:border-slate-400"
                    >
                      <option value="Electronics">Electronics</option>
                      <option value="Apparel">Apparel</option>
                      <option value="Books">Books</option>
                      <option value="Fringe & Vintage">Fringe & Vintage</option>
                      <option value="Assets & Software">Assets & Software</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Location *</label>
                    <select
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:border-slate-400"
                    >
                      <option value="Johannesburg">Johannesburg</option>
                      <option value="Pretoria">Pretoria</option>
                      <option value="Midrand">Midrand</option>
                      <option value="Sandton">Sandton</option>
                      <option value="Centurion">Centurion</option>
                      <option value="Soweto">Soweto</option>
                      <option value="Cape Town">Cape Town</option>
                      <option value="Stellenbosch">Stellenbosch</option>
                      <option value="Bellville">Bellville</option>
                      <option value="Durban">Durban</option>
                      <option value="Umhlanga">Umhlanga</option>
                      <option value="Port Elizabeth">Port Elizabeth (Gqeberha)</option>
                      <option value="East London">East London</option>
                      <option value="Bloemfontein">Bloemfontein</option>
                      <option value="Polokwane">Polokwane</option>
                      <option value="Nelspruit">Mbombela (Nelspruit)</option>
                      <option value="Rustenburg">Rustenburg</option>
                      <option value="Pietermaritzburg">Pietermaritzburg</option>
                      <option value="George">George</option>
                      <option value="Knysna">Knysna</option>
                      <option value="Kimberley">Kimberley</option>
                      <option value="Other">Other (Specify below...)</option>
                    </select>
                  </div>
                </div>

                {newLocation === 'Other' && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1"
                  >
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Specify Custom Location *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Somerset West, Hatfield, Welkom"
                      value={customLocation}
                      onChange={(e) => setCustomLocation(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:border-slate-400"
                    />
                  </motion.div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Condition *</label>
                    <select
                      value={newCondition}
                      onChange={(e) => setNewCondition(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:border-slate-400"
                    >
                      <option value="New">New</option>
                      <option value="Like New">Like New</option>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Price (Rand R) *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 150"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Seller Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Charlotte Rose"
                      value={newSeller}
                      onChange={(e) => setNewSeller(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-400"
                    />
                  </div>
                </div>

                {/* Multiple Custom Image Drag & Drop Block */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Upload Custom Product Photos</label>
                  
                  {/* Drag 'n Drop Zone */}
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                      dragActive ? 'border-slate-950 bg-slate-50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="file"
                      id="market-file-uploader"
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="market-file-uploader" className="cursor-pointer">
                      <Upload className="w-5 h-5 mx-auto text-slate-400 mb-1.5" />
                      <span className="text-xs font-bold text-slate-800">Drag & drop your files</span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">or click to browse local files</span>
                    </label>
                  </div>

                  {/* Uploaded Thumbnail row */}
                  {uploadedImages.length > 0 && (
                    <div className="mt-2.5 space-y-1">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Selected files ({uploadedImages.length})</span>
                      <div className="flex flex-wrap gap-2">
                        {uploadedImages.map((img, idx) => (
                          <div key={idx} className="relative w-14 h-11 rounded-lg border border-slate-200 overflow-hidden group/thumb">
                            <img src={img} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeUploadedImage(idx)}
                              className="absolute top-0.5 right-0.5 p-0.5 bg-black/55 text-white hover:bg-black/85 transition-colors rounded-full"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Detailed Description *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide clear state assessment, specs, serial codes, age, and accessories included."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-400 resize-none"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsListModalOpen(false)}
                    className="flex-1 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 font-semibold rounded-xl text-sm transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-850 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer shadow-sm"
                  >
                    Publish Listing
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Fullscreen view overlay modal for MarketTab */}
      <AnimatePresence>
        {fullscreenImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFullscreenImage(null)}
            className="fixed inset-0 bg-black/95 z-[100] flex flex-col items-center justify-center p-4 backdrop-blur-sm"
          >
            {/* Top Bar controls */}
            <div className="absolute top-4 right-4 flex gap-3 z-10" onClick={e => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setFullscreenImage(null)}
                className="bg-white/10 hover:bg-white/20 text-white font-sans text-xs font-bold py-2.5 px-4 rounded-xl transition-all flex items-center gap-2 cursor-pointer border border-white/5 active:scale-95 shadow-lg"
              >
                <X className="w-4 h-4" />
                Close Fullscreen
              </button>
            </div>
            
            {/* Image Wrapper */}
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl bg-zinc-950 p-1.5 flex flex-col items-center relative shadow-2xl border border-white/10"
              onClick={e => e.stopPropagation()}
            >
              <img
                src={fullscreenImage}
                alt="Fullscreen View"
                referrerPolicy="no-referrer"
                className="max-w-full max-h-[75vh] object-contain rounded-xl select-none"
              />
              <div className="mt-3.5 mb-1.5 text-center px-4">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">High-Resolution Listing Image</span>
                <p className="text-xs text-white/60 mt-0.5">Click anywhere outside the image to exit helper viewer</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
