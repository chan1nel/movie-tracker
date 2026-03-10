"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { getImageUrl, getMovieDetails, searchMovies } from "@/lib/api/tmdb";
import NavBar from "@/components/layout/NavBar";
import CoupleSetup from "@/components/couple/CoupleSetup";

interface CoupleData {
  id: string;
  userA: string;
  userAName: string;
  userB: string;
  userBName: string;
}

interface CoupleMovie {
  id: string;
  title: string;
  posterPath: string | null;
  watchDate: string | null;
  ratingA: number;
  ratingB: number;
  reviewA: string;
  reviewB: string;
  whoChose: string | null;
  venue: string | null;
  city: string | null;
  addedAt: any;
}

export default function CouplePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [couple, setCouple] = useState<CoupleData | null>(null);
  const [movies, setMovies] = useState<CoupleMovie[]>([]);
  const [isUserA, setIsUserA] = useState(true);

  // Add movie state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ watchDate: new Date().toISOString().split("T")[0], venue: "home", city: "", whoChose: "A" });
  const [selectedMovie, setSelectedMovie] = useState<any>(null);
  const [feedback, setFeedback] = useState("");

  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        findCouple(currentUser.uid);
      } else {
        router.push("/login");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const findCouple = async (uid: string) => {
    try {
      // Check if user is in any couple (as userA or userB)
      let q = query(collection(db, "couples"), where("userA", "==", uid));
      let snapshot = await getDocs(q);

      if (snapshot.empty) {
        q = query(collection(db, "couples"), where("userB", "==", uid));
        snapshot = await getDocs(q);
      }

      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        const data = docSnap.data();
        if (data.userB) {
          const coupleData: CoupleData = {
            id: docSnap.id,
            userA: data.userA,
            userAName: data.userAName || "User A",
            userB: data.userB,
            userBName: data.userBName || "User B",
          };
          setCouple(coupleData);
          setIsUserA(uid === data.userA);
          fetchCoupleMovies(docSnap.id);
        }
      }
    } catch (e) {
      console.error("Error finding couple:", e);
    }
  };

  const fetchCoupleMovies = async (coupleId: string) => {
    try {
      const q = query(collection(db, "movie_logs"), where("coupleId", "==", coupleId));
      const snapshot = await getDocs(q);
      const fetched: CoupleMovie[] = [];
      snapshot.forEach(docSnap => {
        const d = docSnap.data();
        fetched.push({
          id: docSnap.id,
          title: d.title,
          posterPath: d.posterPath,
          watchDate: d.watchDate || null,
          ratingA: d.rating || 0,
          ratingB: d.partnerRating || 0,
          reviewA: d.review || "",
          reviewB: d.partnerReview || "",
          whoChose: d.whoChose || null,
          venue: d.venue || null,
          city: d.city || null,
          addedAt: d.addedAt,
        });
      });
      fetched.sort((a, b) => (b.watchDate || "").localeCompare(a.watchDate || ""));
      setMovies(fetched);
    } catch (e) {
      console.error("Error fetching couple movies:", e);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchMovies(searchQuery);
      setSearchResults(results.slice(0, 8));
    } catch (e) { console.error(e); }
    setIsSearching(false);
  };

  const addCoupleMovie = async () => {
    if (!selectedMovie || !couple) return;
    try {
      const details = await getMovieDetails(selectedMovie.id);
      await addDoc(collection(db, "movie_logs"), {
        userId: auth.currentUser!.uid,
        coupleId: couple.id,
        tmdbId: selectedMovie.id,
        title: selectedMovie.title,
        posterPath: selectedMovie.poster_path || null,
        releaseDate: selectedMovie.release_date || "",
        status: "COMPLETED",
        rating: 0,
        review: "",
        partnerRating: 0,
        partnerReview: "",
        whoChose: addForm.whoChose === "A" ? couple.userAName : couple.userBName,
        venue: addForm.venue,
        city: addForm.city,
        watchDate: addForm.watchDate,
        weatherMood: null,
        addedAt: serverTimestamp(),
        genres: details?.genres || [],
        countries: details?.countries || [],
        director: details?.director || null,
        language: details?.language || null,
        decade: details?.decade || null,
        companion: null,
        mood: null,
        lifeStage: null,
      });
      setFeedback(`"${selectedMovie.title}" added!`);
      setSelectedMovie(null);
      setSearchResults([]);
      setSearchQuery("");
      setShowAddForm(false);
      fetchCoupleMovies(couple.id);
      setTimeout(() => setFeedback(""), 3000);
    } catch (e: any) {
      setFeedback(`Error: ${e.message}`);
    }
  };

  const updateRating = async (movieId: string, rating: number) => {
    try {
      const field = isUserA ? "rating" : "partnerRating";
      await updateDoc(doc(db, "movie_logs", movieId), { [field]: rating });
      setMovies(movies.map(m => m.id === movieId ? { ...m, [isUserA ? 'ratingA' : 'ratingB']: rating } : m));
    } catch (e) { console.error(e); }
  };

  const updateReview = async (movieId: string, review: string) => {
    try {
      const field = isUserA ? "review" : "partnerReview";
      await updateDoc(doc(db, "movie_logs", movieId), { [field]: review });
    } catch (e) { console.error(e); }
  };

  // Stats
  const totalMovies = movies.length;
  const avgDiff = totalMovies > 0
    ? (movies.reduce((sum, m) => sum + Math.abs(m.ratingA - m.ratingB), 0) / totalMovies).toFixed(1)
    : "0";
  const biggestDisagreement = movies.reduce((worst, m) => {
    const diff = Math.abs(m.ratingA - m.ratingB);
    return diff > (worst?.diff || 0) ? { movie: m, diff } : worst;
  }, null as { movie: CoupleMovie; diff: number } | null);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[var(--purple-soft)] border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--text-muted)] text-sm">Loading...</p>
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
        <header className="mb-6 anim-fade-up">
          <p className="editorial-label mb-2">Shared Space</p>
          <h1 className="display-heading text-4xl md:text-5xl text-[var(--text-primary)]">
            Our <span className="text-[var(--purple-mid)]">Cinema</span>
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-2 font-light">
            A shared movie diary for two
          </p>
        </header>

        <NavBar />

        {!couple ? (
          <CoupleSetup onPaired={(id) => findCouple(user.uid)} />
        ) : (
          <div className="space-y-10">
            {/* Couple Header */}
            <div className="glass-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4 anim-fade-up anim-delay-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{background: 'var(--purple-light)'}}>
                  {couple.userAName[0]}
                </div>
                <span className="text-xl text-[var(--purple-mid)]">💕</span>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{background: 'var(--blue-light)'}}>
                  {couple.userBName[0]}
                </div>
                <div className="ml-2">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {couple.userAName} &amp; {couple.userBName}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    You are {isUserA ? couple.userAName : couple.userBName}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowAddForm(!showAddForm)}
                className="btn-primary text-sm">
                + Add Movie Together
              </button>
            </div>

            {/* Add Movie Form */}
            {showAddForm && (
              <div className="glass-card p-6 anim-fade-up" style={{background: 'rgba(255,255,255,0.8)'}}>
                <form onSubmit={handleSearch} className="flex gap-3 mb-4">
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search for a movie..." className="input-editorial flex-1" />
                  <button type="submit" disabled={isSearching} className="btn-primary">
                    {isSearching ? "..." : "Search"}
                  </button>
                </form>

                {searchResults.length > 0 && !selectedMovie && (
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {searchResults.map(m => (
                      <button key={m.id} onClick={() => setSelectedMovie(m)}
                        className="text-left rounded-xl overflow-hidden border border-transparent hover:border-[var(--purple-soft)] transition-all">
                        <div className="aspect-[2/3] bg-[var(--cream-dark)]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={getImageUrl(m.poster_path, "w200")} alt={m.title} className="w-full h-full object-cover" />
                        </div>
                        <p className="text-xs p-2 truncate text-[var(--text-secondary)]">{m.title}</p>
                      </button>
                    ))}
                  </div>
                )}

                {selectedMovie && (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-[var(--text-primary)]" style={{fontFamily: 'var(--font-display)'}}>
                      {selectedMovie.title}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="editorial-label block mb-1">Watch Date</label>
                        <input type="date" value={addForm.watchDate}
                          onChange={e => setAddForm({...addForm, watchDate: e.target.value})}
                          className="input-editorial w-full text-sm" />
                      </div>
                      <div>
                        <label className="editorial-label block mb-1">City</label>
                        <input type="text" value={addForm.city}
                          onChange={e => setAddForm({...addForm, city: e.target.value})}
                          placeholder="Where?" className="input-editorial w-full text-sm" />
                      </div>
                      <div>
                        <label className="editorial-label block mb-1">Venue</label>
                        <select value={addForm.venue} onChange={e => setAddForm({...addForm, venue: e.target.value})}
                          className="select-editorial w-full">
                          <option value="home">🏠 At Home</option>
                          <option value="cinema">🎥 Cinema</option>
                          <option value="other">📍 Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="editorial-label block mb-1">Who Chose</label>
                        <select value={addForm.whoChose} onChange={e => setAddForm({...addForm, whoChose: e.target.value})}
                          className="select-editorial w-full">
                          <option value="A">{couple.userAName}</option>
                          <option value="B">{couple.userBName}</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button onClick={() => { setSelectedMovie(null); setSearchResults([]); }} className="btn-ghost flex-1">Cancel</button>
                      <button onClick={addCoupleMovie} className="btn-primary flex-1">Add Movie</button>
                    </div>
                  </div>
                )}

                {feedback && (
                  <div className="toast-success px-4 py-2 text-sm mt-3">{feedback}</div>
                )}
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 anim-fade-up anim-delay-2">
              <div className="stat-card">
                <p className="editorial-label mb-1">Together</p>
                <p className="display-heading text-3xl text-[var(--purple-deep)]">{totalMovies}</p>
                <p className="text-[0.65rem] text-[var(--text-muted)]">movies</p>
              </div>
              <div className="stat-card">
                <p className="editorial-label mb-1">Avg Diff</p>
                <p className="display-heading text-3xl text-[var(--blue-accent)]">{avgDiff}</p>
                <p className="text-[0.65rem] text-[var(--text-muted)]">score gap</p>
              </div>
              <div className="stat-card col-span-2">
                <p className="editorial-label mb-1">Biggest Disagreement</p>
                <p className="display-heading text-xl text-[var(--purple-mid)] truncate">
                  {biggestDisagreement ? biggestDisagreement.movie.title : "—"}
                </p>
                {biggestDisagreement && (
                  <p className="text-[0.65rem] text-[var(--text-muted)]">
                    Score difference: {biggestDisagreement.diff.toFixed(0)}
                  </p>
                )}
              </div>
            </div>

            {/* Couple Timeline */}
            <div className="anim-fade-up anim-delay-3">
              <p className="editorial-label mb-3">Our Movie Timeline</p>
              {movies.length === 0 ? (
                <div className="glass-card p-12 text-center" style={{borderStyle: 'dashed'}}>
                  <p className="text-[var(--text-muted)]" style={{fontFamily: 'var(--font-display)'}}>
                    No shared memories yet
                  </p>
                </div>
              ) : (
                <div className="relative">
                  {/* Horizontal scroll */}
                  <div className="flex gap-4 overflow-x-auto pb-4" style={{scrollSnapType: 'x mandatory'}}>
                    {movies.map((movie, i) => (
                      <div key={movie.id} className="glass-card p-4 shrink-0 w-64"
                           style={{scrollSnapAlign: 'start'}}>
                        <div className="flex gap-3 mb-3">
                          <div className="w-12 h-18 rounded-lg overflow-hidden shrink-0 bg-[var(--cream-dark)]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={getImageUrl(movie.posterPath, "w200")} alt={movie.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold truncate text-[var(--text-primary)]" style={{fontFamily: 'var(--font-display)'}}>
                              {movie.title}
                            </h3>
                            {movie.watchDate && <p className="text-[0.65rem] text-[var(--text-muted)]">{movie.watchDate}</p>}
                            <div className="flex gap-2 mt-1">
                              {movie.venue && (
                                <span className="text-[0.6rem] px-1.5 py-0.5 rounded bg-[var(--cream-warm)] text-[var(--text-muted)]">
                                  {movie.venue === "home" ? "🏠" : movie.venue === "cinema" ? "🎥" : "📍"} {movie.venue}
                                </span>
                              )}
                              {movie.whoChose && (
                                <span className="text-[0.6rem] px-1.5 py-0.5 rounded bg-[var(--purple-light)] text-[var(--purple-deep)]">
                                  Chosen by {movie.whoChose}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Dual ratings */}
                        <div className="grid grid-cols-2 gap-2 pt-3" style={{borderTop: '1px solid var(--cream-dark)'}}>
                          <div className="text-center">
                            <p className="text-[0.6rem] text-[var(--text-muted)] mb-1">{couple.userAName}</p>
                            <div className="flex justify-center gap-0.5">
                              {[1,2,3,4,5].map(s => (
                                <button key={s} onClick={() => isUserA && updateRating(movie.id, s)}
                                  className={`text-sm ${s <= movie.ratingA ? 'text-[#e8a530]' : 'text-[var(--cream-dark)]'} ${isUserA ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}>
                                  ★
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="text-[0.6rem] text-[var(--text-muted)] mb-1">{couple.userBName}</p>
                            <div className="flex justify-center gap-0.5">
                              {[1,2,3,4,5].map(s => (
                                <button key={s} onClick={() => !isUserA && updateRating(movie.id, s)}
                                  className={`text-sm ${s <= movie.ratingB ? 'text-[#e8a530]' : 'text-[var(--cream-dark)]'} ${!isUserA ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}>
                                  ★
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Average & diff */}
                        {(movie.ratingA > 0 || movie.ratingB > 0) && (
                          <div className="flex justify-between items-center mt-2 pt-2" style={{borderTop: '1px solid var(--cream-dark)'}}>
                            <span className="text-[0.6rem] text-[var(--text-muted)]">
                              Avg: <strong className="text-[var(--text-secondary)]">{((movie.ratingA + movie.ratingB) / 2).toFixed(1)}</strong>
                            </span>
                            {movie.ratingA > 0 && movie.ratingB > 0 && (
                              <span className={`text-[0.6rem] px-2 py-0.5 rounded-full ${
                                Math.abs(movie.ratingA - movie.ratingB) <= 1
                                  ? 'bg-[#e8f5e9] text-[#2e7d32]'
                                  : 'bg-[#fde6e8] text-[#c0392b]'
                              }`}>
                                {Math.abs(movie.ratingA - movie.ratingB) <= 1 ? '✓ Agree' : '✕ Disagree'}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Dual Reviews List */}
            {movies.length > 0 && (
              <div className="anim-fade-up anim-delay-4">
                <div className="h-px bg-gradient-to-r from-transparent via-[var(--cream-dark)] to-transparent mb-8" />
                <p className="editorial-label mb-4">Our Reviews</p>
                <div className="space-y-4">
                  {movies.map(movie => (
                    <div key={movie.id} className="glass-card p-5">
                      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3" style={{fontFamily: 'var(--font-display)'}}>
                        {movie.title}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="editorial-label mb-2">{couple.userAName}&apos;s Thoughts</p>
                          <textarea
                            placeholder={`${couple.userAName}'s review...`}
                            className="textarea-editorial"
                            rows={2}
                            defaultValue={movie.reviewA}
                            disabled={!isUserA}
                            onBlur={e => isUserA && updateReview(movie.id, e.target.value)}
                            style={{opacity: isUserA ? 1 : 0.6}}
                          />
                        </div>
                        <div>
                          <p className="editorial-label mb-2">{couple.userBName}&apos;s Thoughts</p>
                          <textarea
                            placeholder={`${couple.userBName}'s review...`}
                            className="textarea-editorial"
                            rows={2}
                            defaultValue={movie.reviewB}
                            disabled={isUserA}
                            onBlur={e => !isUserA && updateReview(movie.id, e.target.value)}
                            style={{opacity: !isUserA ? 1 : 0.6}}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
