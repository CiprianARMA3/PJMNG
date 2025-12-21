'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Share2,
  ArrowRight,
  Loader2,
  Check
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import Navbar from '@/app/components/Navbar';
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
          .select(`*, users (name, surname, metadata)`)
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
            <Loader2 className="w-10 h-10 animate-spin text-purple-600 relative z-10" strokeWidth={3} />
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="bg-white min-h-screen font-sans">
        <Navbar />
        <div className="relative flex flex-col items-center justify-center h-screen space-y-6">
            <AuroraBackground />
            <h1 className="text-4xl font-black text-[#202124] relative z-10 tracking-tighter">Post not found</h1>
            <button 
                onClick={() => router.back()}
                className="relative z-10 px-8 py-3 bg-[#202124] text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-colors"
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
    <main className="bg-white min-h-screen font-sans selection:bg-purple-100 selection:text-purple-900 scroll-smooth text-zinc-900">
      <Navbar />
      <AuroraBackground />

      <div className="relative z-20 pt-32 pb-24 px-6">
        <article className="max-w-4xl mx-auto animate-fade-in-up">
            
            <div className="flex items-center justify-between mb-12">
                <Link href="/home/blog" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-[#202124] transition-colors p-3 -ml-3 rounded-xl hover:bg-white/50">
                    <ArrowLeft size={16} strokeWidth={3} />
                    Back to Blog
                </Link>
                <div className="flex gap-2 relative">
                    <button 
                      onClick={handleShare}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 font-bold text-xs ${
                        copied 
                        ? "bg-green-50 text-green-600 border border-green-200" 
                        : "hover:bg-white/50 text-zinc-500 hover:text-purple-600 border border-transparent"
                      }`} 
                      title="Copy Link"
                    >
                        {copied ? (
                          <>
                            <span>COPIED!</span>
                            <Check size={16} strokeWidth={3} />
                          </>
                        ) : (
                          <Share2 size={18} strokeWidth={2.5} />
                        )}
                    </button>
                </div>
            </div>

            <header className="mb-12 text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-8">
                    {post.tag && post.tag.tag && (
                        <span 
                            className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border-2"
                            style={{ 
                                backgroundColor: `${post.tag.tag_color}10` || '#f3f4f6', 
                                color: post.tag.tag_color || '#4b5563',
                                borderColor: `${post.tag.tag_color}30` || 'transparent'
                            }}
                        >
                            {post.tag.tag}
                        </span>
                    )}
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Calendar size={14} strokeWidth={2.5} />
                        {formatDate(post.created_at)}
                    </span>
                    {post.version && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-3 py-1 bg-zinc-100 rounded-lg">
                            v{post.version}
                        </span>
                    )}
                </div>

                <h1 className="text-5xl md:text-7xl font-black text-[#202124] leading-[0.95] mb-10 tracking-tighter">
                    {post.title}
                </h1>

                <div className="inline-flex items-center gap-4 py-4 pr-8 pl-2 border-2 border-zinc-100 bg-white/50 backdrop-blur-md rounded-full">
                    <div className="w-12 h-12 rounded-full bg-white border-2 border-zinc-100 flex items-center justify-center overflow-hidden shadow-sm">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={authorName} className="w-full h-full object-cover" />
                        ) : (
                            <img src="/logo-light.png" alt="Kapry" className="w-full h-full object-contain opacity-50 p-1" />
                        )}
                    </div>
                    <div className="text-left">
                        <div className="font-black text-[#202124] text-sm uppercase tracking-wide">{authorName}</div>
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Author &bull; Kapry Team</div>
                    </div>
                </div>
            </header>

            {/* SUPERCHARGED: rounded-[40px], border-2 */}
            <div className="relative w-full aspect-video rounded-[40px] overflow-hidden shadow-2xl shadow-purple-900/10 mb-16 border-2 border-zinc-100 group">
                <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-[0.03] mix-blend-multiply pointer-events-none z-10" />
                <img 
                    src={bannerUrl} 
                    alt={post.title || "Blog post banner"} 
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-[1.5s]"
                />
            </div>

            <div className="prose prose-lg prose-gray max-w-none mb-20">
                <div className="text-xl leading-relaxed text-[#3c4043] font-medium whitespace-pre-wrap">
                    {post.description}
                </div>
            </div>

            {/* SUPERCHARGED CTA CARD */}
            <div className="mt-16 p-12 rounded-[40px] bg-zinc-50 border-2 border-zinc-100 text-center relative overflow-hidden group">
                 <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-[0.05] mix-blend-multiply pointer-events-none" />
                <h3 className="text-3xl font-black tracking-tight text-[#202124] mb-4 relative z-10">Enjoyed this update?</h3>
                <p className="text-zinc-500 font-bold mb-10 relative z-10 max-w-lg mx-auto">Join us on the dashboard to see these features in action and speed up your workflow.</p>
                <Link href="/dashboard" className="inline-flex items-center gap-3 bg-[#202124] text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all hover:scale-105 shadow-xl shadow-zinc-900/10 relative z-10">
                    Go to Dashboard <ArrowRight size={14} strokeWidth={3} />
                </Link>
            </div>

        </article>
      </div>
    </main>
  );
}