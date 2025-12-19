'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  Menu,
  X,
  Bot,
  GitBranch,
  Database,
  LayoutList,
  KanbanSquare,
  UserCog,
  ArrowRight,
  Calendar,
  Clock,
  User as UserIcon,
  Tag,
  Loader2,
  Search,
  Filter,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
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
const getInitials = (name?: string | null, surname?: string | null) => {
  return `${name?.[0] || ""}${surname?.[0] || ""}`.toUpperCase() || "";
};

const getFullName = (name?: string | null, surname?: string | null) => {
  if (!name && !surname) return "Kapry Team";
  return `${name || ""} ${surname || ""}`.trim();
};


// --- Blog Components ---

const FeaturedPost = ({ post }: { post: UpdatePost }) => {
  const date = new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const category = post.tag?.tag || 'Update';
  const tagColor = post.tag?.tag_color || '#202124'; // Fallback color

  const author = post.users;
  const authorName = getFullName(author?.name, author?.surname);
  const avatarUrl = author?.metadata?.avatar_url;
  const imageUrl = post.metadata?.banner || 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&q=80&w=1000';

  return (
    <Link href={`/home/blog/${post.id}`}>
      <div className="relative group rounded-[2rem] overflow-hidden bg-white border border-gray-100 shadow-xl shadow-gray-200/40 hover:shadow-2xl hover:shadow-purple-900/5 transition-all duration-500 cursor-pointer mb-16">
        <div className="grid md:grid-cols-2 gap-0">
          <div className="relative h-[300px] md:h-auto overflow-hidden">
            <div className="absolute inset-0 bg-purple-900/10 z-10 group-hover:bg-transparent transition-colors duration-500" />
            <img src={imageUrl} alt={post.title || 'Featured Post'} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out" />
          </div>
          <div className="p-8 md:p-12 flex flex-col justify-center relative z-20 bg-white/50 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-6">
              {/* Dynamic Tag Color */}
              <span
                className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border"
                style={{
                  backgroundColor: `${tagColor}15`,
                  color: tagColor,
                  borderColor: `${tagColor}30`
                }}
              >
                {category}
              </span>
              <span className="text-gray-400 text-xs font-medium flex items-center gap-1">• <Calendar size={12} /> {date}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#202124] mb-4 leading-tight group-hover:text-purple-700 transition-colors">{post.title}</h2>
            <p className="text-[#5f6368] text-lg mb-8 line-clamp-3">{post.description}</p>
            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 overflow-hidden relative border border-gray-200">
                  {/* Fixed: Show Logo if Avatar is missing */}
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={authorName} className="w-full h-full object-cover" />
                  ) : (
                    <img src="/logo-light.png" alt="Kapry" className="w-full h-full object-contain opacity-50" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#202124]">{authorName}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">{post.version ? `v${post.version}` : '5 min read'}</div>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-[#202124] group-hover:bg-[#202124] group-hover:text-white transition-all duration-300"><ArrowRight size={20} /></div>
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
  const tagColor = post.tag?.tag_color || '#202124'; // Fallback color

  const author = post.users;
  const authorName = getFullName(author?.name, author?.surname);
  const avatarUrl = author?.metadata?.avatar_url;
  const imageUrl = post.metadata?.banner || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800';

  return (
    <Link href={`/home/blog/${post.id}`}>
      <div className="group flex flex-col h-full bg-white rounded-[1.5rem] border border-gray-100 overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300 cursor-pointer">
        <div className="h-48 overflow-hidden relative">
          <div className="absolute top-4 left-4 z-10">
            {/* Dynamic Tag Color on Image */}
            <span
              className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-xs font-bold shadow-sm border"
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
        <div className="p-6 flex flex-col flex-grow">
          <div className="flex items-center gap-2 mb-3 text-xs text-gray-400">
            <Calendar size={12} /> {date}
            <span>•</span>
            {post.version && <span>v{post.version}</span>}
          </div>
          <h3 className="text-xl font-bold text-[#202124] mb-3 leading-snug group-hover:text-purple-600 transition-colors">{post.title}</h3>
          <p className="text-[#5f6368] text-sm leading-relaxed mb-6 line-clamp-3">{post.description}</p>
          <div className="mt-auto flex items-center gap-2 pt-4 border-t border-gray-50">
            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 overflow-hidden relative border border-gray-200">
              {/* Fixed: Show Logo if Avatar is missing */}
              {avatarUrl ? (
                <img src={avatarUrl} alt={authorName} className="w-full h-full object-cover" />
              ) : (
                <img src="/logo-light.png" alt="Kapry" className="w-full h-full object-contain opacity-50 p-1" />
              )}
            </div>
            <span className="text-xs font-medium text-[#202124]">{authorName}</span>
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
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="relative z-10 px-6 py-24 text-center">
        <div className="max-w-md mx-auto">
          <h3 className="text-2xl font-bold text-[#202124] mb-2">No updates yet</h3>
          <p className="text-[#5f6368]">Check back later for the latest news and engineering updates.</p>
        </div>
      </div>
    );
  }

  // Feature the first post (always static)
  const featured = posts[0];
  const othersRaw = posts.slice(1);

  // Filter and Sort only the rest
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

        {/* Featured Post (Static) */}
        <FeaturedPost post={featured} />

        <div className="flex flex-col md:flex-row items-center justify-between mb-8 mt-12 gap-4">
          <h3 className="text-2xl font-bold text-[#202124] self-start md:self-center">Latest Articles</h3>

          <div className="flex w-full md:w-auto gap-3">
            <div className="relative flex-grow md:w-64 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-600 transition-colors" size={16} />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm placeholder:text-gray-400"
              />
            </div>

            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all shadow-sm text-sm font-medium ${isFilterOpen
                    ? 'bg-purple-50 border-purple-200 text-purple-700'
                    : 'bg-white border-gray-200 text-[#5f6368] hover:bg-gray-50'
                  }`}
              >
                <Filter size={16} />
                <span className="hidden sm:inline">Sort</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
              </button>

              {isFilterOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-3 py-2 border-b border-gray-50 bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Sort by
                  </div>
                  <button
                    onClick={() => handleSort('date')}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-purple-50 hover:text-purple-700 transition-colors flex items-center justify-between group"
                  >
                    <span className="flex items-center gap-2"><Calendar size={14} className="text-gray-400 group-hover:text-purple-500" /> Date</span>
                    {sortKey === 'date' && (sortOrder === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />)}
                  </button>
                  <button
                    onClick={() => handleSort('version')}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-purple-50 hover:text-purple-700 transition-colors flex items-center justify-between group"
                  >
                    <span className="flex items-center gap-2"><Tag size={14} className="text-gray-400 group-hover:text-purple-500" /> Version</span>
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
          <div className="text-center py-20 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
            <p className="text-gray-500">No articles found matching "{searchQuery}"</p>
          </div>
        )}

        {/* {processedOthers.length > 0 && (
            <div className="mt-16 text-center">
                <button className="px-8 py-3 rounded-full bg-[#202124] text-white font-medium hover:bg-black transition-all hover:scale-105 shadow-lg shadow-gray-200">
                    Load More Articles
                </button>
            </div>
        )} */}
      </div>
    </section>
  );
};

// --- Hero Section ---
const BlogHero = () => (
  <section className="relative min-h-[60vh] flex flex-col items-center justify-center text-center px-4 pt-20 overflow-hidden">
    <AuroraBackground />
    <div className="relative z-20 max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex justify-center mb-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/60 backdrop-blur-md border border-white/40 rounded-full shadow-sm cursor-default">
          <Tag size={14} className="text-purple-600" />
          <span className="text-xs font-bold text-[#5f6368] tracking-widest uppercase">The Blog</span>
        </div>
      </div>
      <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[#202124] leading-[1.05]">
        Insights, Updates & <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 font-normal pb-2">Future Plans.</span>
      </h1>
      <p className="text-xl text-[#5f6368] max-w-2xl mx-auto leading-relaxed font-normal">
        Deep dives into how we build Kapry.dev, tutorials on modern web development, and thoughts on the future of AI.
      </p>
      <p className='text-sm font-light mt-[-20px]'>To see the Creator's information please Register or Login.</p>
    </div>
  </section>
);


// --- Main Page Component ---
export default function BlogPage() {
  return (
    <main className="bg-white min-h-screen font-sans selection:bg-purple-100 selection:text-purple-900 scroll-smooth">
      <Navbar />
      <BlogHero />
      <div className="relative z-20 -mt-10">
        <BlogSection />
      </div>
      <Footer minimal />
    </main>
  );
}