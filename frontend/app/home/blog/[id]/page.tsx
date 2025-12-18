'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Share2,
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
  Loader2,
  Check
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

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
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const getFullName = (name?: string | null, surname?: string | null) => {
  if (!name && !surname) return "Kapry Team";
  return `${name || ""} ${surname || ""}`.trim();
};

// --- Components ---

const AuroraBackground = () => (
  <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-white">
    <style jsx>{`
      @keyframes sine-flow-1 {
        0%   { transform: translate(-20%, 10%) scale(1); opacity: 0.8; }
        25%  { transform: translate(10%, -10%) scale(1.1); opacity: 1; }
        50%  { transform: translate(40%, 10%) scale(0.8); opacity: 0.6; }
        75%  { transform: translate(10%, 30%) scale(0.9); opacity: 0.9; }
        100% { transform: translate(-20%, 10%) scale(1); opacity: 0.8; }
      }
      @keyframes sine-flow-2 {
        0%   { transform: translate(20%, -20%) scale(0.9); opacity: 0.7; }
        33%  { transform: translate(-10%, 0%) scale(1.1); opacity: 0.9; }
        66%  { transform: translate(30%, 20%) scale(1); opacity: 0.8; }
        100% { transform: translate(20%, -20%) scale(0.9); opacity: 0.7; }
      }
    `}</style>
    <div className="absolute top-[-20%] left-[-20%] w-[80vw] h-[80vh] bg-gradient-to-r from-blue-100/80 to-indigo-100/80 rounded-[100%] blur-[180px] mix-blend-multiply" style={{ animation: 'sine-flow-1 25s infinite ease-in-out' }} />
    <div className="absolute bottom-[-30%] right-[-10%] w-[70vw] h-[70vh] bg-gradient-to-l from-cyan-50/50 to-purple-200/50 rounded-[100%] blur-[150px] mix-blend-multiply" style={{ animation: 'sine-flow-2 30s infinite ease-in-out reverse' }} />
    <div className="absolute inset-0 opacity-[0.12] pointer-events-none" style={{ backgroundImage: "url('/grainy.png')", backgroundRepeat: 'repeat', backgroundSize: '120px 120px' }} />
    <div className="absolute bottom-0 left-0 w-full h-[50vh] bg-gradient-to-t from-white via-white/90 to-transparent" />
  </div>
);

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
  
    useEffect(() => {
      const checkUser = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          setUser(user);

          if (user) {
            const { data: profile } = await supabase
              .from('users')
              .select('metadata')
              .eq('id', user.id)
              .single();
            
            if (profile && profile.metadata?.avatar_url) {
              setAvatarUrl(profile.metadata.avatar_url);
            } else {
              setAvatarUrl(user.user_metadata?.avatar_url);
            }
          }
        } catch (error) {
          console.error('Error fetching user:', error);
        } finally {
          setLoading(false);
        }
      };
      checkUser();
    }, [supabase]);
  
    const productLinks = [
      { icon: Bot, name: 'AI Assistant', desc: 'Context-aware coding help' },
      { icon: GitBranch, name: 'Repo Review', desc: 'Automated PR analysis' },
      { icon: Database, name: 'SQL Helper', desc: 'Natural language to SQL' },
      { icon: LayoutList, name: 'Roadmap', desc: 'AI-generated milestones' },
      { icon: KanbanSquare, name: 'Kanban Board', desc: 'Drag-and-drop tasks' },
      { icon: UserCog, name: 'Team', desc: 'Management made easier' },
    ];
  
    return (
      <nav 
        className="fixed top-0 left-0 right-0 z-50 h-[72px] px-6 bg-white/50 backdrop-blur-xl border-b border-white/10 transition-all duration-300 shadow-sm"
        onMouseLeave={() => setActiveDropdown(null)}
      >
        <div className="max-w-[1400px] mx-auto h-full flex items-center justify-between">
          <div className="flex items-center gap-1 cursor-pointer z-50">
            <a href="/" className="flex items-center gap-1">
              <span className="text-2xl font-normal tracking-tight">KAPR<span className="text-purple-600 font-normal">Y</span></span>
              <span className="text-2xl font-black tracking-tight text-[#202124]">.DEV</span>
            </a>
          </div>
          <div className="hidden md:flex items-center gap-8 h-full">
            <div 
              className="relative h-full flex items-center"
              onMouseEnter={() => setActiveDropdown('product')}
            >
              <button className="flex items-center gap-1 text-[15px] font-medium text-[#5f6368] hover:text-[#202124] transition-colors group">
                Product <ChevronDown size={14} className={`transition-transform duration-300 ${activeDropdown === 'product' ? 'rotate-180' : ''}`}/>
              </button>
              {activeDropdown === 'product' && (
                <div className="absolute top-[60px] -left-10 w-[600px] p-6 bg-white rounded-2xl shadow-2xl shadow-purple-900/5 border border-gray-100 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 z-40">
                  {productLinks.map((item) => (
                    <a key={item.name} href="#" className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group/item">
                      <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover/item:bg-purple-100 transition-colors">
                        <item.icon size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[#202124]">{item.name}</div>
                        <div className="text-xs text-[#5f6368] mt-0.5">{item.desc}</div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
            <a href="/home/blog" className="text-[15px] font-medium text-[#5f6368] hover:text-[#202124] transition-colors">Blog</a>
            <a href="#" className="text-[15px] font-medium text-[#5f6368] hover:text-[#202124] transition-colors">Enterprise</a>
            <a href="/#pricing" className="text-[15px] font-medium text-[#5f6368] hover:text-[#202124] transition-colors">Pricing</a>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center gap-4">
                    <a href='/dashboard' className="bg-[#202124] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-black transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2 cursor-pointer" >
                      Dashboard <ArrowRight size={14} />
                    </a>
                    <div className="relative h-9 w-9 rounded-full overflow-hidden border border-gray-200">
                      <img
                        src={avatarUrl || '/default-avatar.png'}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <a href="/auth/login" className="text-sm font-medium text-[#5f6368] hover:text-[#202124]">Sign In</a>
                    <a href='/auth/register' className="bg-[#202124] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-black transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2 cursor-pointer" >
                      Get Started <ArrowRight size={14} />
                    </a>
                  </>
                )}
              </>
            )}
          </div>
  
          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-[#5f6368]">
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>

        {isOpen && (
            <div className="absolute top-[72px] left-0 w-full h-[calc(100vh-72px)] bg-white overflow-y-auto p-6 flex flex-col gap-6 md:hidden animate-in slide-in-from-top-2 shadow-xl border-t border-gray-100">
            <div className="space-y-4">
                <div className="text-xs font-bold text-[#5f6368] uppercase tracking-wider mb-2">Platform</div>
                {productLinks.map((item) => (
                <a key={item.name} href="#" className="flex items-center gap-3 py-2 text-[#202124]">
                    <item.icon size={20} className="text-purple-600" />
                    <span className="text-lg font-medium">{item.name}</span>
                </a>
                ))}
            </div>
            <div className="pt-6 border-t border-gray-100 flex flex-col gap-4">
                 {!loading && (
                    <>
                    {user ? (
                        <div className="flex flex-col gap-4">
                             <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200">
                                    <img src={avatarUrl || '/default-avatar.png'} alt="Profile" className="w-full h-full object-cover" />
                                </div>
                                <span className="font-medium text-[#202124]">{user.email}</span>
                             </div>
                             <a href='/dashboard' className="bg-[#202124] text-white px-5 py-3 rounded-xl text-center font-medium" >
                                Go to Dashboard
                            </a>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                             <a href="/auth/login" className="px-5 py-3 rounded-xl border border-gray-200 text-center font-medium text-[#202124]">Sign In</a>
                             <a href="/auth/register" className="bg-[#202124] text-white px-5 py-3 rounded-xl text-center font-medium">Get Started</a>
                        </div>
                    )}
                    </>
                 )}
            </div>
            </div>
        )}
      </nav>
    );
};

// --- Main Page Component ---

export default function BlogPostPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [post, setPost] = useState<UpdatePost | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from('updates')
          .select(`
            *,
            users (
              name,
              surname,
              metadata
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        setPost(data as unknown as UpdatePost);
      } catch (err) {
        console.error("Error fetching post:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, supabase]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  if (loading) {
    return (
      <main className="bg-white min-h-screen font-sans">
        <Navbar />
        <div className="relative flex items-center justify-center h-screen">
            <AuroraBackground />
            <Loader2 className="w-10 h-10 animate-spin text-purple-600 relative z-10" />
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="bg-white min-h-screen font-sans">
        <Navbar />
        <div className="relative flex flex-col items-center justify-center h-screen space-y-4">
            <AuroraBackground />
            <h1 className="text-2xl font-bold text-[#202124] relative z-10">Post not found</h1>
            <button 
                onClick={() => router.back()}
                className="relative z-10 px-6 py-2 bg-black text-white rounded-full hover:bg-neutral-800 transition-colors"
            >
                Go Back
            </button>
        </div>
      </main>
    );
  }

  const author = post.users;
  const authorName = getFullName(author?.name, author?.surname);
  const avatarUrl = author?.metadata?.avatar_url;
  const bannerUrl = post.metadata?.banner || 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&q=80&w=1000';

  return (
    <main className="bg-white min-h-screen font-sans selection:bg-purple-100 selection:text-purple-900 scroll-smooth">
      <Navbar />
      <AuroraBackground />

      <div className="relative z-20 pt-32 pb-24 px-6">
        <article className="max-w-3xl mx-auto animate-fade-in-up">
            
            <div className="flex items-center justify-between mb-8">
                <Link href="/home/blog" className="inline-flex items-center gap-2 text-sm font-medium text-[#5f6368] hover:text-[#202124] transition-colors p-2 -ml-2 rounded-lg hover:bg-white/50">
                    <ArrowLeft size={16} />
                    Back to Blog
                </Link>
                <div className="flex gap-2 relative">
                    <button 
                      onClick={handleShare}
                      className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300 ${
                        copied 
                        ? "bg-green-50 text-green-600 border border-green-200" 
                        : "hover:bg-white/50 text-[#5f6368] hover:text-purple-600 border border-transparent"
                      }`} 
                      title="Copy Link"
                    >
                        {copied ? (
                          <>
                            <span className="text-xs font-bold">Copied!</span>
                            <Check size={18} />
                          </>
                        ) : (
                          <Share2 size={18} />
                        )}
                    </button>
                </div>
            </div>

            <header className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                    {post.tag && post.tag.tag && (
                        <span 
                            className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border"
                            style={{ 
                                backgroundColor: `${post.tag.tag_color}15` || '#f3f4f6', 
                                color: post.tag.tag_color || '#4b5563',
                                borderColor: `${post.tag.tag_color}30` || 'transparent'
                            }}
                        >
                            {post.tag.tag}
                        </span>
                    )}
                    <span className="text-sm font-medium text-[#5f6368] flex items-center gap-1.5">
                        <Calendar size={14} />
                        {formatDate(post.created_at)}
                    </span>
                    {post.version && (
                        <span className="text-sm font-medium text-[#5f6368] px-2 py-0.5 bg-gray-100 rounded-md">
                            v{post.version}
                        </span>
                    )}
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#202124] leading-[1.1] mb-8 tracking-tight">
                    {post.title}
                </h1>

                <div className="flex items-center gap-4 py-6 border-y border-gray-100/80 bg-white/30 backdrop-blur-sm rounded-xl px-4">
                    <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={authorName} className="w-full h-full object-cover" />
                        ) : (
                            <img src="/logo-light.png" alt="Kapry" className="w-full h-full object-contain opacity-50" />
                        )}
                    </div>
                    <div>
                        <div className="font-semibold text-[#202124]">{authorName}</div>
                        <div className="text-sm text-[#5f6368]">Author &bull; Kapry.Dev Team</div>
                    </div>
                </div>
            </header>

            <div className="relative w-full aspect-video rounded-[2rem] overflow-hidden shadow-2xl shadow-purple-900/10 mb-12 border border-gray-100">
                <img 
                    src={bannerUrl} 
                    alt={post.title || "Blog post banner"} 
                    className="w-full h-full object-cover"
                />
            </div>

            <div className="prose prose-lg prose-gray max-w-none">
                <div className="text-xl leading-relaxed text-[#3c4043] font-normal whitespace-pre-wrap">
                    {post.description}
                </div>
            </div>

            <div className="mt-16 p-8 rounded-[2rem] bg-gray-50 border border-gray-100 text-center">
                <h3 className="text-xl font-bold text-[#202124] mb-2">Enjoyed this update?</h3>
                <p className="text-[#5f6368] mb-6">Join us on the dashboard to see these features in action.</p>
                <Link href="/dashboard" className="inline-flex items-center gap-2 bg-[#202124] text-white px-6 py-3 rounded-full font-medium hover:bg-black transition-all hover:scale-105 shadow-lg shadow-gray-200">
                    Go to Dashboard <ArrowRight size={16} />
                </Link>
            </div>

        </article>
      </div>
    </main>
  );
}