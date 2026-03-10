"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, updateDoc, doc, deleteDoc, orderBy } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { getImageUrl } from "@/lib/api/tmdb";

interface MovieLog {
  id: string;
  title: string;
  posterPath: string | null;
  status: string;
  rating: number;
}

export default function MovieList() {
  const [movies, setMovies] = useState<MovieLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("COMPLETED");

  useEffect(() => {
    if (auth.currentUser) {
      fetchMovies(auth.currentUser.uid);
    }
  }, [filter]);

  const fetchMovies = async (uid: string) => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "movie_logs"), 
        where("userId", "==", uid),
        where("status", "==", filter),
        orderBy("addedAt", "desc")
      );
      const snapshot = await getDocs(q);
      const fetched: MovieLog[] = [];
      snapshot.forEach(d => {
        const data = d.data();
        fetched.push({
          id: d.id,
          title: data.title,
          posterPath: data.posterPath,
          status: data.status,
          rating: data.rating || 0,
        });
      });
      setMovies(fetched);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "movie_logs", id), { status: newStatus });
      setMovies(movies.filter(m => m.id !== id));
    } catch (e) { console.error(e); }
  };

  const updateRating = async (id: string, newRating: number) => {
    try {
      await updateDoc(doc(db, "movie_logs", id), { rating: newRating });
      setMovies(movies.map(m => m.id === id ? { ...m, rating: newRating } : m));
    } catch (e) { console.error(e); }
  };

  const removeMovie = async (id: string) => {
    if (!confirm("Remove this memory?")) return;
    try {
      await deleteDoc(doc(db, "movie_logs", id));
      setMovies(movies.filter(m => m.id !== id));
    } catch (e) { console.error(e); }
  };

  return (
    <div className="mt-4">
      <div className="flex gap-4 mb-8">
        <button 
          onClick={() => setFilter("COMPLETED")} 
          className={`editorial-label pb-2 border-b-2 transition-all ${filter === "COMPLETED" ? "border-[var(--purple-mid)] text-[var(--purple-deep)]" : "border-transparent text-[var(--text-light)]"}`}
        >
          Finished ({filter === "COMPLETED" ? movies.length : "..."})
        </button>
        <button 
          onClick={() => setFilter("PLAN_TO_WATCH")} 
          className={`editorial-label pb-2 border-b-2 transition-all ${filter === "PLAN_TO_WATCH" ? "border-[var(--purple-mid)] text-[var(--purple-deep)]" : "border-transparent text-[var(--text-light)]"}`}
        >
          Watchlist ({filter === "PLAN_TO_WATCH" ? movies.length : "..."})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-[var(--purple-soft)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : movies.length === 0 ? (
        <div className="py-20 text-center glass-card" style={{borderStyle: 'dashed'}}>
          <p className="text-[var(--text-muted)] italic">No movies found in this collection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
          {movies.map((movie) => (
            <div key={movie.id} className="anim-fade-up">
              <div className="glass-card group overflow-hidden bg-white/40">
                <div className="aspect-[2/3] relative overflow-hidden bg-[var(--cream-dark)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={getImageUrl(movie.posterPath, "w500")} 
                    alt={movie.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-[var(--purple-deep)]/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-3 text-center">
                    <button 
                      onClick={() => removeMovie(movie.id)}
                      className="absolute top-2 right-2 w-7 h-7 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white backdrop-blur-sm transition-colors"
                    >
                      ✕
                    </button>
                    
                    {movie.status === "COMPLETED" ? (
                      <div className="flex flex-col gap-2">
                         <p className="text-white text-[0.65rem] mb-1 font-medium">Rate this memory</p>
                         <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(s => (
                              <button 
                                key={s} 
                                onClick={(e) => { e.stopPropagation(); updateRating(movie.id, s); }}
                                className={`text-lg transition-transform hover:scale-125 ${s <= movie.rating ? 'text-[#e8a530]' : 'text-white/40'}`}
                              >
                                ★
                              </button>
                            ))}
                         </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => updateStatus(movie.id, "COMPLETED")}
                        className="btn-primary text-xs py-2 px-4 whitespace-nowrap"
                      >
                        ✓ Mark Watched
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-3">
                   <h3 className="text-sm font-semibold truncate text-[var(--text-primary)] mb-1" style={{fontFamily: 'var(--font-display)'}}>
                    {movie.title}
                  </h3>
                  {movie.status === "COMPLETED" && movie.rating > 0 && (
                    <div className="flex text-[#e8a530] text-xs">
                      {"★".repeat(movie.rating)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
