"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { getImageUrl } from "@/lib/api/tmdb";
import NavBar from "@/components/layout/NavBar";

interface MovieLog {
  id: string;
  title: string;
  posterPath: string | null;
  releaseDate: string;
  status: string;
  rating: number;
  watchDate: string | null;
  city: string | null;
  companion: string | null;
  mood: string | null;
  lifeStage: string | null;
  genres: string[];
  addedAt: any;
}

interface YearGroup {
  year: number;
  movies: MovieLog[];
  count: number;
  favoriteMovie: MovieLog | null;
  topGenre: string;
}

const STAGE_COLORS: Record<string, string> = {
  "高中": "bg-[#fde6e8] text-[#c0392b] border-[#f5c6cb]",
  "大学": "bg-[var(--purple-light)] text-[var(--purple-deep)] border-[var(--purple-soft)]",
  "工作": "bg-[var(--blue-light)] text-[var(--blue-deep)] border-[var(--blue-soft)]",
  "旅行": "bg-[#e8f5e9] text-[#2e7d32] border-[#a5d6a7]",
  "Gap Year": "bg-[#fff3e0] text-[#e65100] border-[#ffcc80]",
  "Other": "bg-[var(--cream-dark)] text-[var(--text-secondary)] border-[var(--cream-dark)]",
};

export default function TimelinePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [yearGroups, setYearGroups] = useState<YearGroup[]>([]);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchTimelineData(currentUser.uid);
      } else {
        router.push("/login");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const fetchTimelineData = async (uid: string) => {
    try {
      const q = query(collection(db, "movie_logs"), where("userId", "==", uid));
      const snapshot = await getDocs(q);
      const movies: MovieLog[] = [];

      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        movies.push({
          id: docSnap.id,
          title: data.title,
          posterPath: data.posterPath,
          releaseDate: data.releaseDate || "",
          status: data.status,
          rating: data.rating || 0,
          watchDate: data.watchDate || null,
          city: data.city || null,
          companion: data.companion || null,
          mood: data.mood || null,
          lifeStage: data.lifeStage || null,
          genres: data.genres || [],
          addedAt: data.addedAt,
        });
      });

      // Group by year
      const grouped: Record<number, MovieLog[]> = {};
      movies.forEach(m => {
        let year: number;
        if (m.watchDate) {
          year = parseInt(m.watchDate.substring(0, 4));
        } else if (m.addedAt?.toDate) {
          year = m.addedAt.toDate().getFullYear();
        } else {
          year = new Date().getFullYear();
        }
        if (!isNaN(year)) {
          if (!grouped[year]) grouped[year] = [];
          grouped[year].push(m);
        }
      });

      // Build year groups with stats
      const groups: YearGroup[] = Object.entries(grouped)
        .map(([yearStr, movies]) => {
          const year = parseInt(yearStr);
          // Sort by watchDate or addedAt
          movies.sort((a, b) => {
            const aDate = a.watchDate || "";
            const bDate = b.watchDate || "";
            return aDate.localeCompare(bDate);
          });

          // Find favorite (highest rated)
          const favoriteMovie = movies.reduce((best, m) => 
            m.rating > (best?.rating || 0) ? m : best, null as MovieLog | null);

          // Find top genre
          const genreCounts: Record<string, number> = {};
          movies.forEach(m => (m.genres || []).forEach(g => {
            genreCounts[g] = (genreCounts[g] || 0) + 1;
          }));
          const topGenre = Object.entries(genreCounts)
            .sort(([,a], [,b]) => b - a)[0]?.[0] || "—";

          return { year, movies, count: movies.length, favoriteMovie, topGenre };
        })
        .sort((a, b) => b.year - a.year);

      setYearGroups(groups);
    } catch (e) {
      console.error("Error fetching timeline:", e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[var(--purple-soft)] border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--text-muted)] text-sm">Loading your timeline...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen relative z-10">
      <div className="organic-shape organic-shape-1" />
      <div className="organic-shape organic-shape-2" />

      <div className="max-w-5xl mx-auto px-6 md:px-10 py-8 md:py-12">
        {/* Header */}
        <header className="flex items-end justify-between mb-6 anim-fade-up">
          <div>
            <p className="editorial-label mb-2">Personal Journey</p>
            <h1 className="display-heading text-4xl md:text-5xl text-[var(--text-primary)]">
              Movie <span className="text-[var(--purple-mid)]">Timeline</span>
            </h1>
            <p className="text-[var(--text-muted)] text-sm mt-2 font-light">
              Your life, told through cinema
            </p>
          </div>
        </header>

        <NavBar />

        {/* Timeline */}
        {yearGroups.length === 0 ? (
          <div className="text-center py-20 glass-card anim-fade-up" style={{borderStyle: 'dashed'}}>
            <p className="display-heading text-xl text-[var(--text-muted)] mb-2">No memories yet</p>
            <p className="text-sm text-[var(--text-light)]">Add movies from the dashboard to start building your timeline</p>
          </div>
        ) : (
          <div className="relative anim-fade-up anim-delay-2">
            {/* Central vertical line */}
            <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px"
                 style={{background: 'linear-gradient(to bottom, var(--purple-soft), var(--blue-soft), transparent)'}} />

            {yearGroups.map((group, gi) => (
              <div key={group.year} className="mb-16">
                {/* ─── Year Marker ─── */}
                <div className="relative flex items-center mb-8 anim-fade-up" style={{animationDelay: `${gi * 0.1}s`}}>
                  {/* Dot on the line */}
                  <div className="absolute left-6 md:left-1/2 w-4 h-4 rounded-full -translate-x-1/2 z-10"
                       style={{background: 'linear-gradient(135deg, var(--purple-mid), var(--blue-accent))', boxShadow: '0 0 0 4px var(--cream), 0 0 12px rgba(155,127,212,0.3)'}} />
                  
                  {/* Year card */}
                  <div className="ml-14 md:ml-0 md:absolute md:left-1/2 md:translate-x-6 glass-card px-6 py-4"
                       style={{background: 'rgba(255,255,255,0.7)'}}>
                    <p className="display-heading text-3xl text-[var(--purple-deep)]">{group.year}</p>
                    <div className="flex gap-4 mt-1.5">
                      <span className="text-xs text-[var(--text-muted)]">
                        <strong className="text-[var(--text-secondary)]">{group.count}</strong> films
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">
                        Top: <strong className="text-[var(--text-secondary)]">{group.topGenre}</strong>
                      </span>
                    </div>
                    {group.favoriteMovie && (
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        ⭐ Favorite: <strong className="text-[var(--text-secondary)]">{group.favoriteMovie.title}</strong>
                      </p>
                    )}
                  </div>
                </div>

                {/* ─── Movie Entries ─── */}
                {group.movies.map((movie, mi) => {
                  const isLeft = mi % 2 === 0;
                  return (
                    <div key={movie.id}
                         className={`relative flex mb-6 anim-fade-up ${isLeft ? 'md:justify-start' : 'md:justify-end'}`}
                         style={{animationDelay: `${(gi * 0.1) + (mi * 0.06)}s`}}>
                      
                      {/* Connector dot */}
                      <div className="absolute left-6 md:left-1/2 w-2.5 h-2.5 rounded-full bg-[var(--cream-dark)] border-2 border-[var(--purple-soft)] -translate-x-1/2 top-6 z-10" />

                      {/* Card */}
                      <div className={`ml-14 md:ml-0 ${isLeft ? 'md:mr-[52%]' : 'md:ml-[52%]'} w-full md:w-[45%] glass-card overflow-hidden flex gap-3 p-4`}>
                        {/* Mini poster */}
                        <div className="w-14 h-20 rounded-lg overflow-hidden shrink-0 bg-[var(--cream-dark)]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={getImageUrl(movie.posterPath, "w200")} alt={movie.title} className="w-full h-full object-cover" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate" style={{fontFamily: 'var(--font-display)'}}>
                            {movie.title}
                          </h3>
                          
                          {/* Date */}
                          {movie.watchDate && (
                            <p className="text-[0.65rem] text-[var(--text-muted)] mt-0.5">{movie.watchDate}</p>
                          )}

                          {/* Rating stars */}
                          {movie.rating > 0 && (
                            <div className="flex gap-0.5 mt-1">
                              {[1,2,3,4,5].map(s => (
                                <span key={s} className={`text-xs ${s <= movie.rating ? 'text-[#e8a530]' : 'text-[var(--cream-dark)]'}`}>★</span>
                              ))}
                            </div>
                          )}

                          {/* Memory tags */}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {movie.lifeStage && (
                              <span className={`text-[0.6rem] px-2 py-0.5 rounded-full border font-medium ${STAGE_COLORS[movie.lifeStage] || STAGE_COLORS.Other}`}>
                                {movie.lifeStage}
                              </span>
                            )}
                            {movie.city && (
                              <span className="text-[0.6rem] px-2 py-0.5 rounded-full bg-white/60 border border-[var(--cream-dark)] text-[var(--text-muted)]">
                                📍 {movie.city}
                              </span>
                            )}
                            {movie.companion && (
                              <span className="text-[0.6rem] px-2 py-0.5 rounded-full bg-white/60 border border-[var(--cream-dark)] text-[var(--text-muted)]">
                                👥 {movie.companion}
                              </span>
                            )}
                            {movie.mood && (
                              <span className="text-[0.6rem] px-2 py-0.5 rounded-full bg-white/60 border border-[var(--cream-dark)] text-[var(--text-muted)]">
                                {movie.mood}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
