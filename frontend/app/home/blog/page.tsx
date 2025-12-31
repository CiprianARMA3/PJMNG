'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  Calendar,
  ArrowRight,
  Tag,
  Loader2,
  Search,
  Filter,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import AuroraBackground from '@/app/components/AuroraBackground';

// --- Types ---
interface UpdateTag {
  tag: string;
  tag_color: string;
}

interface UpdateMetadata {
  banner: string;
}

interface AuthorProfile {
  name: string | null;
  surname: string | null;
  metadata: {
    avatar_url?: string | null;
  } | null;
}

interface UpdatePost {
  id: number;
  created_at: string;
  title: string | null;
  description: string | null;
  version: string | null;
  tag: UpdateTag | null;
  by: string | null;
  metadata: UpdateMetadata | null;
  users: AuthorProfile | null;
}

// --- Helpers ---
const getFullName = (name?: string | null, surname?: string | null) => {
  if (!name && !surname) return "Kapry Team";
  return `${name || ""} ${surname || ""}`.trim();
};


// --- Blog Components ---

const FeaturedPost = ({ post }: { post: UpdatePost }) => {
  const date = new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const category = post.tag?.tag || 'Update';
  const tagColor = post.tag?.tag_color || '#202124';

  const author = post.users;
  const authorName = getFullName(author?.name, author?.surname);
  const avatarUrl = author?.metadata?.avatar_url;
  const imageUrl = post.metadata?.banner || 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&q=80&w=1000';

  return (
    <Link href={`/home/blog/${post.id}`}>
      {/* SUPERCHARGED: rounded-[40px], border-2, border-zinc-100 */}
      <div className="relative group rounded-[40px] overflow-hidden bg-white border-2 border-zinc-100 shadow-xl shadow-zinc-200/50 hover:shadow-2xl hover:border-purple-200 transition-all duration-500 cursor-pointer mb-16">
        {/* Grain Texture */}
        <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-[0.03] mix-blend-multiply pointer-events-none z-0" />
        
        <div className="relative z-10 grid md:grid-cols-2 gap-0">
          <div className="relative h-[350px] md:h-auto overflow-hidden border-b-2 md:border-b-0 md:border-r-2 border-zinc-100">
            <div className="absolute inset-0 bg-purple-900/10 z-10 group-hover:bg-transparent transition-colors duration-500" />
            <img src={imageUrl} alt={post.title || 'Featured Post'} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out" />
          </div>
          <div className="p-10 md:p-14 flex flex-col justify-center bg-white/50 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-8">
              <span
                className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border-2"
                style={{
                  backgroundColor: `${tagColor}10`,
                  color: tagColor,
                  borderColor: `${tagColor}30`
                }}
              >
                {category}
              </span>
              <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">• <Calendar size={12} /> {date}</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-[#202124] mb-6 leading-[0.95] group-hover:text-purple-600 transition-colors">{post.title}</h2>
            <p className="text-zinc-500 text-lg font-bold mb-10 line-clamp-3 leading-relaxed">{post.description}</p>
            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 overflow-hidden relative border-2 border-zinc-100">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={authorName} className="w-full h-full object-cover" />
                  ) : (
                    <img src="/logo-light.png" alt="Kapry" className="w-full h-full object-contain opacity-50 p-1" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-black text-[#202124]">{authorName}</div>
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide flex items-center gap-1">{post.version ? `v${post.version}` : '5 min read'}</div>
                </div>
              </div>
              <div className="w-14 h-14 rounded-full border-2 border-zinc-100 flex items-center justify-center text-[#202124] group-hover:bg-[#202124] group-hover:text-white group-hover:border-[#202124] transition-all duration-300 shadow-sm">
                  <ArrowRight size={20} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

const PostCard = ({ post }: { post: UpdatePost }) => {
  const date = new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const category = post.tag?.tag || 'Blog';
  const tagColor = post.tag?.tag_color || '#202124';

  const author = post.users;
  const authorName = getFullName(author?.name, author?.surname);
  const avatarUrl = author?.metadata?.avatar_url;
  const imageUrl = post.metadata?.banner || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800';

  return (
    <Link href={`/home/blog/${post.id}`}>
      {/* SUPERCHARGED: rounded-[40px], border-2, border-zinc-100 */}
      <div className="group flex flex-col h-full bg-white rounded-[40px] border-2 border-zinc-100 overflow-hidden hover:border-purple-200 hover:shadow-2xl hover:shadow-zinc-200/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer relative">
        <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-[0.03] mix-blend-multiply pointer-events-none z-0" />
        
        <div className="h-56 overflow-hidden relative border-b-2 border-zinc-100 z-10">
          <div className="absolute top-5 left-5 z-20">
            <span
              className="px-4 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-[10px] font-black uppercase tracking-widest shadow-lg border-2"
              style={{
                color: tagColor,
                borderColor: `${tagColor}20`
              }}
            >
              {category}
            </span>
          </div>
          <img src={imageUrl} alt={post.title || 'Post'} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
        </div>
        <div className="p-8 flex flex-col flex-grow relative z-10">
          <div className="flex items-center gap-2 mb-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            <Calendar size={12} strokeWidth={2.5} /> {date}
            <span>•</span>
            {post.version && <span>v{post.version}</span>}
          </div>
          <h3 className="text-2xl font-black tracking-tight text-[#202124] mb-4 leading-[1.1] group-hover:text-purple-600 transition-colors">{post.title}</h3>
          <p className="text-zinc-500 font-bold text-sm leading-relaxed mb-8 line-clamp-3">{post.description}</p>
          <div className="mt-auto flex items-center gap-3 pt-6 border-t-2 border-zinc-50">
            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 overflow-hidden relative border border-zinc-200">
              {avatarUrl ? (
                <img src={avatarUrl} alt={authorName} className="w-full h-full object-cover" />
              ) : (
                <img src="/logo-light.png" alt="Kapry" className="w-full h-full object-contain opacity-50 p-1" />
              )}
            </div>
            <span className="text-xs font-black text-[#202124]">{authorName}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

const BlogSection = () => {
  const [posts, setPosts] = useState<UpdatePost[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortKey, setSortKey] = useState<'date' | 'version'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase
          .from('updates')
          .select(`*, users (name, surname, metadata)`)
          .order('created_at', { ascending: false });

        if (error) console.error('Error fetching updates:', error);
        else setPosts((data as unknown) as UpdatePost[]);
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin text-purple-600" strokeWidth={3} />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="relative z-10 px-6 py-24 text-center">
        <div className="max-w-md mx-auto">
          <h3 className="text-2xl font-black text-[#202124] mb-2">No updates yet</h3>
          <p className="text-zinc-500 font-bold">Check back later for the latest news and engineering updates.</p>
        </div>
      </div>
    );
  }

  const featured = posts[0];
  const othersRaw = posts.slice(1);

  const processedOthers = othersRaw.filter(post => {
    const searchLower = searchQuery.toLowerCase();
    const titleMatch = post.title?.toLowerCase().includes(searchLower);
    const description = post.description || '';
    const descMatch = description.toLowerCase().includes(searchLower);
    return titleMatch || descMatch;
  }).sort((a, b) => {
    if (sortKey === 'date') {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    } else {
      const verA = a.version || '';
      const verB = b.version || '';
      return sortOrder === 'asc'
        ? verA.localeCompare(verB, undefined, { numeric: true })
        : verB.localeCompare(verA, undefined, { numeric: true });
    }
  });

  const handleSort = (key: 'date' | 'version') => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
    setIsFilterOpen(false);
  };

  return (
    <section className="relative z-10 px-6 pb-24">
      <div className="max-w-[1200px] mx-auto">

        <FeaturedPost post={featured} />

        <div className="flex flex-col md:flex-row items-center justify-between mb-10 mt-16 gap-6">
          <h3 className="text-3xl font-black tracking-tighter text-[#202124] self-start md:self-center">Latest Articles</h3>

          <div className="flex w-full md:w-auto gap-4">
            <div className="relative flex-grow md:w-72 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-purple-600 transition-colors" size={16} strokeWidth={3} />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-5 py-3 rounded-full bg-white border-2 border-zinc-100 text-sm font-bold text-zinc-700 focus:outline-none focus:border-purple-500 transition-all shadow-sm placeholder:text-zinc-400"
              />
            </div>

            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full border-2 transition-all shadow-sm text-xs font-black uppercase tracking-widest ${isFilterOpen
                    ? 'bg-purple-50 border-purple-200 text-purple-700'
                    : 'bg-white border-zinc-100 text-[#202124] hover:bg-zinc-50'
                  }`}
              >
                <Filter size={14} strokeWidth={3} />
                <span className="hidden sm:inline">Sort</span>
                <ChevronDown size={14} strokeWidth={3} className={`transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
              </button>

              {isFilterOpen && (
                <div className="absolute right-0 top-full mt-3 w-56 bg-white border-2 border-zinc-100 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-5 py-3 border-b-2 border-zinc-50 bg-zinc-50/50 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    Sort by
                  </div>
                  <button
                    onClick={() => handleSort('date')}
                    className="w-full text-left px-5 py-3 text-sm font-bold hover:bg-purple-50 hover:text-purple-700 transition-colors flex items-center justify-between group"
                  >
                    <span className="flex items-center gap-2"><Calendar size={14} className="text-zinc-400 group-hover:text-purple-500" /> Date</span>
                    {sortKey === 'date' && (sortOrder === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />)}
                  </button>
                  <button
                    onClick={() => handleSort('version')}
                    className="w-full text-left px-5 py-3 text-sm font-bold hover:bg-purple-50 hover:text-purple-700 transition-colors flex items-center justify-between group"
                  >
                    <span className="flex items-center gap-2"><Tag size={14} className="text-zinc-400 group-hover:text-purple-500" /> Version</span>
                    {sortKey === 'version' && (sortOrder === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />)}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {processedOthers.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {processedOthers.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-zinc-50 rounded-[40px] border-2 border-dashed border-zinc-200">
            <p className="text-zinc-500 font-bold">No articles found matching "{searchQuery}"</p>
          </div>
        )}
      </div>
    </section>
  );
};

// --- Hero Section ---
const BlogHero = () => (
  <section className="relative min-h-[60vh] flex flex-col items-center justify-center text-center px-4 pt-20 overflow-hidden">
    <AuroraBackground />
    <div className="relative z-20 max-w-4xl mx-auto space-y-8 animate-fade-in-up">
      <div className="flex justify-center mb-6">
        <div className="inline-flex items-center gap-2 px-5 py-2 bg-white/60 backdrop-blur-md border border-white/40 rounded-full shadow-sm cursor-default">
          <Tag size={14} className="text-purple-600" strokeWidth={3} />
          <span className="text-[10px] font-black text-zinc-500 tracking-[0.2em] uppercase">The Blog</span>
        </div>
      </div>
      <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-[#202124] leading-[0.95]">
        Insights, Updates & <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">Future Plans.</span>
      </h1>
      <p className="text-xl text-zinc-500 font-bold max-w-2xl mx-auto leading-relaxed mb-4">
        Deep dives into how we build KapryDEV and thoughts on the future of AI in our systems also considering suggestions offered by customers.
      </p>
    </div>
  </section>
);


// --- Main Page Component ---
export default function BlogPage() {
  return (
    <main className="bg-white min-h-screen font-sans selection:bg-purple-100 selection:text-purple-900 scroll-smooth text-zinc-900">
      <Navbar />
      <BlogHero />
      <div className="relative z-20 -mt-10">
        <BlogSection />
      </div>
      <Footer minimal />
    </main>
  );
}