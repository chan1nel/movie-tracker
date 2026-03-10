"use client";

import { useState } from "react";
import { searchMovies, getImageUrl, getMovieDetails } from "@/lib/api/tmdb";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function MovieSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  
  // Modal for memory input
  const [selectedMovie, setSelectedMovie] = useState<any>(null);
  const [memoryForm, setMemoryForm] = useState({
    status: "COMPLETED",
    rating: 5,
    watchDate: new Date().toISOString().split("T")[0],
    city: "",
    companion: "",
    mood: "",
    lifeStage: "大学",
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    const movies = await searchMovies(query);
    setResults(movies.slice(0, 8));
    setLoading(false);
  };

  const startLogging = (movie: any) => {
    setSelectedMovie(movie);
  };

  const saveToFirebase = async () => {
    if (!selectedMovie || !auth.currentUser) return;

    try {
      const details = await getMovieDetails(selectedMovie.id);
      
      await addDoc(collection(db, "movie_logs"), {
        userId: auth.currentUser.uid,
        tmdbId: selectedMovie.id,
        title: selectedMovie.title,
        posterPath: selectedMovie.poster_path,
        releaseDate: selectedMovie.release_date,
        status: memoryForm.status,
        rating: memoryForm.status === "COMPLETED" ? memoryForm.rating : 0,
        watchDate: memoryForm.status === "COMPLETED" ? memoryForm.watchDate : null,
        city: memoryForm.city,
        companion: memoryForm.companion,
        mood: memoryForm.mood,
        lifeStage: memoryForm.lifeStage,
        genres: details?.genres || [],
        countries: details?.countries || [],
        director: details?.director || null,
        language: details?.language || null,
        decade: details?.decade || null,
        addedAt: serverTimestamp(),
      });

      setFeedback(`Recorded "${selectedMovie.title}"`);
      setResults([]);
      setQuery("");
      setSelectedMovie(null);
      setTimeout(() => setFeedback(""), 3000);
    } catch (e: any) {
      console.error(e);
      alert("Error saving: " + e.message);
    }
  };

  return (
    <div className="mb-10 w-full">
      <form onSubmit={handleSearch} className="relative group max-w-2xl">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What have you watched lately?"
          className="input-editorial w-full pl-12 pr-4 py-4 text-lg focus:ring-2 focus:ring-[var(--purple-soft)] bg-white/70 backdrop-blur-sm"
        />
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xl opacity-40">🔍</div>
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-[var(--purple-mid)] border-t-transparent rounded-full animate-spin" />
        )}
      </form>

      {feedback && (
        <div className="mt-4 p-3 bg-[#e8f5e9] text-[#2e7d32] border border-[#a5d6a7] rounded-xl text-sm anim-fade-up">
          ✓ {feedback}
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 anim-fade-up">
          {results.map((movie) => (
            <div 
              key={movie.id} 
              className="glass-card group cursor-pointer hover:border-[var(--purple-soft)] transition-all overflow-hidden"
              onClick={() => startLogging(movie)}
            >
              <div className="aspect-[2/3] relative overflow-hidden bg-[var(--cream-dark)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={getImageUrl(movie.poster_path, "w500")} 
                  alt={movie.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-3">
                <h3 className="text-xs font-semibold truncate text-[var(--text-primary)] mb-1" style={{fontFamily: 'var(--font-display)'}}>
                  {movie.title}
                </h3>
                <p className="text-[0.6rem] text-[var(--text-muted)] italic">
                  {movie.release_date?.substring(0, 4)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Memory Input Modal */}
      {selectedMovie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[var(--purple-deep)]/20 backdrop-blur-md anim-fade-in">
          <div className="glass-card w-full max-w-md p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <header className="mb-6 flex justify-between items-start">
              <div className="flex gap-4">
                <div className="w-16 h-24 rounded-lg overflow-hidden shrink-0 bg-[var(--cream-dark)] border border-[var(--cream-dark)]">
                   {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getImageUrl(selectedMovie.poster_path, "w200")} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="editorial-label mb-1">Log Experience</p>
                  <h2 className="display-heading text-xl text-[var(--text-primary)] leading-tight">{selectedMovie.title}</h2>
                  <p className="text-xs text-[var(--text-muted)] mt-1">{selectedMovie.release_date}</p>
                </div>
              </div>
              <button onClick={() => setSelectedMovie(null)} className="text-2xl opacity-40 hover:opacity-100">✕</button>
            </header>

            <div className="space-y-5">
              <div>
                <label className="editorial-label block mb-2">Watching Status</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setMemoryForm({...memoryForm, status: 'COMPLETED'})}
                    className={`px-4 py-2 rounded-xl text-sm border transition-all ${memoryForm.status === 'COMPLETED' ? 'bg-[var(--purple-mid)] text-white border-[var(--purple-mid)]' : 'bg-white border-[var(--cream-dark)] text-[var(--text-muted)]'}`}
                  >
                    Watched
                  </button>
                  <button 
                    onClick={() => setMemoryForm({...memoryForm, status: 'PLAN_TO_WATCH'})}
                    className={`px-4 py-2 rounded-xl text-sm border transition-all ${memoryForm.status === 'PLAN_TO_WATCH' ? 'bg-[var(--purple-mid)] text-white border-[var(--purple-mid)]' : 'bg-white border-[var(--cream-dark)] text-[var(--text-muted)]'}`}
                  >
                    Watchlist
                  </button>
                </div>
              </div>

              {memoryForm.status === 'COMPLETED' && (
                <>
                  <div className="anim-fade-up">
                    <label className="editorial-label block mb-2">Personal Rating</label>
                    <div className="flex gap-2">
                      {[1,2,3,4,5].map(s => (
                        <button 
                          key={s} 
                          onClick={() => setMemoryForm({...memoryForm, rating: s})}
                          className={`flex-1 py-1.5 rounded-lg border text-lg transition-all ${memoryForm.rating === s ? 'bg-[var(--blue-accent)] text-white border-[var(--blue-accent)] shadow-md' : 'bg-white border-[var(--cream-dark)] text-[var(--text-muted)] hover:border-[var(--blue-soft)]'}`}
                        >
                          {s}★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 anim-fade-up">
                    <div>
                      <label className="editorial-label block mb-1">Watch Date</label>
                      <input 
                        type="date" 
                        value={memoryForm.watchDate}
                        onChange={e => setMemoryForm({...memoryForm, watchDate: e.target.value})}
                        className="input-editorial w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="editorial-label block mb-1">City</label>
                      <input 
                        type="text" 
                        value={memoryForm.city}
                        onChange={e => setMemoryForm({...memoryForm, city: e.target.value})}
                        placeholder="Paris, Home..."
                        className="input-editorial w-full text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 anim-fade-up">
                    <div>
                      <label className="editorial-label block mb-1">With Who?</label>
                      <input 
                        type="text" 
                        value={memoryForm.companion}
                        onChange={e => setMemoryForm({...memoryForm, companion: e.target.value})}
                        placeholder="Solo, Mom..."
                        className="input-editorial w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="editorial-label block mb-1">Life Stage</label>
                      <select 
                        value={memoryForm.lifeStage}
                        onChange={e => setMemoryForm({...memoryForm, lifeStage: e.target.value})}
                        className="select-editorial w-full text-sm"
                      >
                        <option>高中</option>
                        <option>大学</option>
                        <option>工作</option>
                        <option>旅行</option>
                        <option>Gap Year</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="anim-fade-up">
                    <label className="editorial-label block mb-1">Current Mood / Weather</label>
                    <input 
                      type="text" 
                      value={memoryForm.mood}
                      onChange={e => setMemoryForm({...memoryForm, mood: e.target.value})}
                      placeholder="Rainy day feelings..."
                      className="input-editorial w-full text-sm"
                    />
                  </div>
                </>
              )}

              <footer className="pt-4 flex gap-3 anim-fade-up">
                <button onClick={() => setSelectedMovie(null)} className="btn-ghost flex-1">Cancel</button>
                <button onClick={saveToFirebase} className="btn-primary flex-1">Record Memory</button>
              </footer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
