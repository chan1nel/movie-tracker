"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import MovieSearch from "@/components/movies/MovieSearch";
import MovieList from "@/components/movies/MovieList";
import NavBar from "@/components/layout/NavBar";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    yearWatched: 0,
    planToWatch: 0,
    monthWatched: 0
  });

  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchStats(currentUser.uid);
      } else {
        router.push("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);
  
  const fetchStats = async (uid: string) => {
    try {
      const q = query(collection(db, "movie_logs"), where("userId", "==", uid));
      const snapshot = await getDocs(q);
      
      let yearWatched = 0;
      let monthWatched = 0;
      let planToWatch = 0;
      
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      
      snapshot.forEach(doc => {
        const data = doc.data();

        if (data.status === "PLAN_TO_WATCH") {
          planToWatch++;
        }

        if (data.status === "COMPLETED") {
          let date;
          if (data.addedAt?.toDate) {
            date = data.addedAt.toDate();
          } else {
            date = new Date();
          }
          
          if (date.getFullYear() === currentYear) {
            yearWatched++;
            if (date.getMonth() === currentMonth) {
              monthWatched++;
            }
          }
        }
      });
      
      setStats({ yearWatched, monthWatched, planToWatch });
    } catch (e) {
      console.error("Error fetching stats:", e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[var(--purple-soft)] border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--text-muted)] text-sm anim-shimmer">Loading your collection...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen relative z-10">
      {/* Organic background shapes */}
      <div className="organic-shape organic-shape-1" />
      <div className="organic-shape organic-shape-2" />
      <div className="organic-shape organic-shape-3" />

      <div className="max-w-6xl mx-auto px-6 md:px-10 py-8 md:py-12">
        {/* ─── Header ─── */}
        <header className="flex items-end justify-between mb-14 anim-fade-up">
          <div>
            <p className="editorial-label mb-2">Welcome back</p>
            <h1 className="display-heading text-4xl md:text-5xl text-[var(--text-primary)]">
              Cine<span className="text-[var(--purple-mid)]">Tracker</span>
            </h1>
            <p className="text-[var(--text-muted)] text-sm mt-2 font-light">
              {user.displayName || 'Movie Fan'}&apos;s personal cinema journal
            </p>
          </div>
          <button onClick={() => signOut(auth)} className="btn-ghost">
            Sign Out
          </button>
        </header>

        <NavBar />
        
        {/* ─── Stats — Asymmetric Grid ─── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 mb-16">
          {/* Large card spanning 2 cols */}
          <div className="col-span-2 stat-card anim-fade-up anim-delay-1 flex items-center gap-6 text-left" style={{padding: '2rem 2.5rem'}}>
            <div className="text-5xl">🎬</div>
            <div>
              <p className="editorial-label mb-1">This Year</p>
              <p className="display-heading text-5xl text-[var(--purple-deep)]">{stats.yearWatched}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">movies completed</p>
            </div>
          </div>
          
          {/* Smaller stat cards */}
          <div className="stat-card anim-fade-up anim-delay-2">
            <div className="text-2xl mb-2 opacity-70">📅</div>
            <p className="editorial-label mb-1">This Month</p>
            <p className="display-heading text-3xl text-[var(--blue-accent)]">{stats.monthWatched}</p>
            <p className="text-[0.65rem] text-[var(--text-muted)] mt-1">watched</p>
          </div>

          <div className="stat-card anim-fade-up anim-delay-3">
            <div className="text-2xl mb-2 opacity-70">✨</div>
            <p className="editorial-label mb-1">Watchlist</p>
            <p className="display-heading text-3xl text-[var(--purple-mid)]">{stats.planToWatch}</p>
            <p className="text-[0.65rem] text-[var(--text-muted)] mt-1">to explore</p>
          </div>
        </div>
        
        {/* ─── Search ─── */}
        <div className="anim-fade-up anim-delay-3">
          <MovieSearch />
        </div>
        
        {/* ─── Collection ─── */}
        <div className="anim-fade-up anim-delay-4">
          <MovieList />
        </div>
      </div>
    </div>
  );
}
