import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, 
  Search, 
  Plus, 
  DollarSign, 
  Tag, 
  User, 
  X, 
  CheckCircle, 
  MessageSquare,
  ArrowRight,
  ClipboardList,
  Upload,
  ChevronLeft,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { Gig } from '../types';

interface GigsTabProps {
  gigs: Gig[];
  onAddGig: (gig: Omit<Gig, 'id' | 'status' | 'createdAt'>) => void;
  onApplyGig: (gigId: string, posterName: string) => void;
  setIsCreating: (isCreating: boolean) => void;
  profileName: string;
}

export default function GigsTab({ gigs, onAddGig, onApplyGig, setIsCreating, profileName }: GigsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  useEffect(() => {
    setIsCreating(isCreateModalOpen);
    if (isCreateModalOpen) {
      setNewPoster(profileName);
    }
  }, [isCreateModalOpen, setIsCreating, profileName]);

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newBudget, setNewBudget] = useState('');
  const [newLocation, setNewLocation] = useState('Johannesburg');
  const [newCategory, setNewCategory] = useState<'Design' | 'Development' | 'Writing' | 'Marketing' | 'Short Task' | 'Delivery' | 'Pet Sitting' | 'Cleaning' | 'Handyman' | 'Other'>('Development');
  const [newTagsStr, setNewTagsStr] = useState('');
  const [newPoster, setNewPoster] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const categories = ['All', 'Development', 'Design', 'Writing', 'Marketing', 'Short Task', 'Delivery', 'Pet Sitting', 'Cleaning', 'Handyman', 'Other'];

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

  const filteredGigs = gigs.filter(gig => {
    const matchesSearch = 
      gig.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      gig.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gig.posterName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || gig.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDesc || !newBudget || !newPoster) {
      alert('Please fill out all required fields.');
      return;
    }

    const budgetNum = parseFloat(newBudget);
    if (isNaN(budgetNum) || budgetNum <= 0) {
      alert('Please provide a valid budget amount.');
      return;
    }

    const tags = newTagsStr
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    onAddGig({
      title: newTitle,
      description: newDesc,
      budget: budgetNum,
      location: newLocation,
      category: newCategory,
      tags: tags.length > 0 ? tags : [newCategory],
      posterName: newPoster,
      imageUrl: uploadedImages.length > 0 ? uploadedImages[0] : 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600&auto=format&fit=crop',
      images: uploadedImages.length > 0 ? uploadedImages : ['https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600&auto=format&fit=crop'],
    });

    // Reset Form
    setNewTitle('');
    setNewDesc('');
    setNewBudget('');
    setNewLocation('Johannesburg');
    setNewCategory('Development');
    setNewTagsStr('');
    setNewPoster('');
    setUploadedImages([]);
    setDragActive(false);
    setIsCreateModalOpen(false);
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Development': return 'bg-blue-50 text-blue-700 border-blue-150';
      case 'Design': return 'bg-purple-50 text-purple-700 border-purple-150';
      case 'Writing': return 'bg-amber-50 text-amber-700 border-amber-150';
      case 'Marketing': return 'bg-emerald-50 text-emerald-700 border-emerald-150';
      case 'Short Task': return 'bg-pink-50 text-pink-700 border-pink-150';
      case 'Delivery': return 'bg-cyan-50 text-cyan-700 border-cyan-150';
      case 'Pet Sitting': return 'bg-teal-50 text-teal-700 border-teal-150';
      case 'Cleaning': return 'bg-red-50 text-red-700 border-red-150';
      case 'Handyman': return 'bg-orange-50 text-orange-700 border-orange-150';
      default: return 'bg-slate-55 text-slate-700 border-slate-200';
    }
  };

  return (
    <div id="gigs-tab-container" className="flex flex-col h-full bg-slate-50">
      {/* Header Banner */}
      <div id="gigs-header" className="p-6 bg-white border-b border-slate-100 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-slate-700" />
              Quick Gigs
            </h2>
            <p className="text-xs text-slate-500 mt-1">Make extra money by helping with quick tasks.</p>
          </div>
          <button 
            id="post-gig-btn"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-950 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Post a Gig</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </span>
            <input 
              id="gigs-search"
              type="text" 
              placeholder="Search gigs by keyword, scope, poster..." 
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

        {/* Categories Pills */}
        <div id="gigs-cat-filters" className="flex items-center gap-2 overflow-x-auto pb-1 -mx-2 px-2 scrollbar-none">
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

      {/* Main List Area (Styled EXACTLY like the Marketplace Catalog) */}
      <div id="gigs-scroll-area" className="flex-1 overflow-y-auto p-4">
        {filteredGigs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4 bg-white rounded-2xl border border-slate-100">
            <div className="p-4 bg-slate-50 rounded-full mb-3 text-slate-400">
              <ClipboardList className="w-8 h-8" />
            </div>
            <p className="text-sm font-medium text-slate-800">No active work opportunities match</p>
            <p className="text-xs text-slate-400 mt-1">Try resetting search parameters or post a new request</p>
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
            {filteredGigs.map((gig) => (
              <motion.div
                key={gig.id}
                layoutId={`gig-card-${gig.id}`}
                onClick={() => { setSelectedGig(gig); setActiveImageIndex(0); }}
                className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col group"
              >
                <div>
                  {/* Full Bleed Image Panel with Absolute Budget Overlay */}
                  <div className="relative aspect-video w-full bg-slate-100 overflow-hidden">
                    <img 
                      src={gig.imageUrl || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600&auto=format&fit=crop'} 
                      alt={gig.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                    
                    {/* Quick Fullscreen Button */}
                    <button
                      type="button"
                      title="View full image"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFullscreenImage(gig.imageUrl || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600&auto=format&fit=crop');
                      }}
                      className="absolute top-2.5 left-2.5 p-1.5 bg-slate-950/65 hover:bg-slate-950/85 backdrop-blur-xs text-white rounded-lg transition-all hover:scale-105 cursor-pointer opacity-0 group-hover:opacity-100 flex items-center justify-center shadow-xs"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Budget Absolute Tag (Exactly matching Market price overlay) */}
                    <div className="absolute top-2.5 right-2.5 bg-slate-950/90 text-white px-2.5 py-1 rounded-lg text-xs font-bold font-mono tracking-tight shadow-sm flex items-center">
                      R{gig.budget.toLocaleString()}
                    </div>
                  </div>

                  {/* Card Content body (Exactly matching Market layout) */}
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                        {gig.category} • {gig.location}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getCategoryColor(gig.category)}`}>
                        {gig.status === 'Applied' ? 'Applied' : 'Active'}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-slate-800 transition-colors line-clamp-1 leading-tight mb-1">
                      {gig.title}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-2.5">
                      {gig.description}
                    </p>

                    {/* Skill Tags list on Card */}
                    {gig.tags && gig.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {gig.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-[9px] font-semibold bg-slate-50 border border-slate-150 px-1.5 py-0.5 rounded-md text-slate-500 truncate max-w-[80px]">
                            #{tag}
                          </span>
                        ))}
                        {gig.tags.length > 3 && (
                          <span className="text-[9px] text-slate-400 font-semibold self-center ml-0.5">
                            +{gig.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-4 pb-4">
                  <div className="pt-2.5 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {gig.posterAvatar ? (
                        <img src={gig.posterAvatar} alt={gig.posterName} className="w-5 h-5 rounded-full object-cover border border-slate-200" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[9px] font-semibold text-slate-600">
                          {gig.posterName.charAt(0)}
                        </div>
                      )}
                      <span className="text-[10px] text-slate-500 font-medium truncate max-w-[80px]">
                        {gig.posterName}
                      </span>
                    </div>

                    <span className="text-[10px] font-semibold text-slate-900 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {gig.status === 'Applied' ? 'Contact details' : 'View Job'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Gig Details Modal View (Exactly styled as Market details modal) */}
      <AnimatePresence>
        {selectedGig && (
          <div id="gig-detail-backdrop" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              id="gig-detail-card"
              className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
            >
              {/* Cover Photo Slideshow with Indicators */}
              {(() => {
                const gigImages = selectedGig.images && selectedGig.images.length > 0 
                  ? selectedGig.images 
                  : [selectedGig.imageUrl || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600&auto=format&fit=crop'];
                return (
                  <div 
                    onClick={() => setFullscreenImage(gigImages[activeImageIndex] || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600&auto=format&fit=crop')}
                    className="relative h-60 w-full bg-slate-100 overflow-hidden group/modal cursor-zoom-in"
                  >
                    <img 
                      src={gigImages[activeImageIndex] || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600&auto=format&fit=crop'} 
                      alt={selectedGig.title} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-all duration-300 group-hover/modal:scale-102"
                    />

                    {/* Maximize Icon Indicator */}
                    <div className="absolute top-4 left-4 p-2 bg-slate-950/50 hover:bg-slate-950/80 backdrop-blur-xs rounded-full text-white transition-opacity opacity-0 group-hover/modal:opacity-100 flex items-center justify-center pointer-events-none">
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                    
                    {gigImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveImageIndex((prev) => (prev === 0 ? gigImages.length - 1 : prev - 1));
                          }}
                          className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 bg-slate-950/60 hover:bg-slate-950/80 text-white rounded-full transition-all cursor-pointer opacity-80 group-hover/modal:opacity-100"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveImageIndex((prev) => (prev === gigImages.length - 1 ? 0 : prev + 1));
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-slate-950/60 hover:bg-slate-950/80 text-white rounded-full transition-all cursor-pointer opacity-80 group-hover/modal:opacity-100"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        
                        {/* Page dots status overlay */}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/40 px-2 py-1 rounded-full">
                          {gigImages.map((_, idx) => (
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
                      onClick={() => setSelectedGig(null)}
                      className="absolute top-4 right-4 p-2 bg-slate-950/50 backdrop-blur-xs rounded-full text-white hover:bg-slate-950/80 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-4 left-4 bg-slate-950 text-white px-3.5 py-1.5 rounded-xl font-mono text-base font-bold shadow-md">
                      Offer Budget: R{selectedGig.budget.toLocaleString()}
                    </div>
                  </div>
                );
              })()}

              {/* Mini Slideshow thumbnail strip */}
              {(() => {
                const gigImages = selectedGig.images && selectedGig.images.length > 0 ? selectedGig.images : [];
                if (gigImages.length <= 1) return null;
                return (
                  <div className="flex gap-2 overflow-x-auto px-6 py-2 bg-slate-50 border-b border-slate-100 scrollbar-none">
                    {gigImages.map((img, idx) => (
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
                    {selectedGig.category}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${getCategoryColor(selectedGig.category)}`}>
                    Status: {selectedGig.status}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-snug">
                  {selectedGig.title}
                </h3>

                <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 pb-4 border-b border-slate-100">
                  <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-[9px] text-slate-600">
                    {selectedGig.posterName.charAt(0)}
                  </div>
                  <span>Posted by <strong className="font-semibold text-slate-700">{selectedGig.posterName}</strong></span>
                </div>

                <div className="mt-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Scope description</h4>
                  <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                    {selectedGig.description}
                  </p>
                </div>

                {/* Skills/Tags as additional parameters */}
                <div className="mt-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Required Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedGig.tags.map((tag) => (
                      <span key={tag} className="flex items-center gap-1 text-[11px] font-semibold bg-slate-105 border border-slate-200 px-2.5 py-0.75 rounded-lg text-slate-600">
                        <Tag className="w-3 h-3 text-slate-400" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-8 pt-4 border-t border-slate-100 flex gap-3">
                  <button
                    onClick={() => setSelectedGig(null)}
                    className="flex-1 py-3 text-slate-600 bg-slate-50 hover:bg-slate-100 font-semibold rounded-xl text-sm transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  {selectedGig.status === 'Applied' ? (
                    <button
                      disabled
                      className="flex-[1.5] py-3 bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold rounded-xl text-sm flex items-center justify-center gap-1.5 cursor-not-allowed"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      Applied
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        onApplyGig(selectedGig.id, selectedGig.posterName);
                        setSelectedGig(null);
                      }}
                      className="flex-[1.5] py-3 bg-slate-900 hover:bg-slate-850 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Apply via Chat
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Post a Gig Modal Form (Matching Market listing modal exactly) */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div id="post-gig-backdrop" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              id="post-gig-modal"
              className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">Post work opportunity</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Describe project scopes. Hire candidates immediately.</p>
                </div>
                <button 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Gig Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Build modular contact form"
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
                      <option value="Development">Development</option>
                      <option value="Design">Design</option>
                      <option value="Writing">Writing</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Short Task">Short Task</option>
                      <option value="Delivery">Delivery</option>
                      <option value="Pet Sitting">Pet Sitting</option>
                      <option value="Cleaning">Cleaning</option>
                      <option value="Handyman">Handyman</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Budget (ZAR R) *</label>
                    <input
                      type="number"
                      required
                      placeholder="Budget in Rands"
                      value={newBudget}
                      onChange={(e) => setNewBudget(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Liam Sterling"
                    value={newPoster}
                    onChange={(e) => setNewPoster(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Tags (Comma-separated skills)</label>
                  <input
                    type="text"
                    placeholder="e.g. React, CSS, API Integration"
                    value={newTagsStr}
                    onChange={(e) => setNewTagsStr(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-400"
                  />
                </div>

                {/* Multiple Custom Image Drag & Drop Block */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Upload Custom Project Images</label>
                  
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
                      id="gig-file-uploader"
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="gig-file-uploader" className="cursor-pointer">
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
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Detailed description *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide details about the specific tasks, tools, timeframe expectation, and required knowledge."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-400 resize-none"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 font-semibold rounded-xl text-sm transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-850 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer shadow-sm"
                  >
                    Post Gig
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Fullscreen view overlay modal for GigsTab */}
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

