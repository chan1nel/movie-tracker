"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { getMovieDetails } from "@/lib/api/tmdb";
import NavBar from "@/components/layout/NavBar";
import PieChart from "@/components/charts/PieChart";
import BarChart from "@/components/charts/BarChart";
import MoviePersonality from "@/components/dna/MoviePersonality";

const PIE_COLORS = [
  "#9b7fd4", "#5b8def", "#e8a530", "#4ecdc4", "#e85d75",
  "#a3c0f7", "#c9b8e8", "#7cb342", "#ff8a65", "#78909c"
];

const BAR_COLORS = {
  genre: "#9b7fd4",
  director: "#5b8def",
  decade: "#e8a530",
};

export default function DnaPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [enrichProgress, setEnrichProgress] = useState("");

  const [countryData, setCountryData] = useState<{label: string; value: number; color: string}[]>([]);
  const [genreData, setGenreData] = useState<{label: string; value: number; color: string}[]>([]);
  const [directorData, setDirectorData] = useState<{label: string; value: number; color: string}[]>([]);
  const [decadeData, setDecadeData] = useState<{label: string; value: number; color: string}[]>([]);
  const [personalityData, setPersonalityData] = useState<{
    topGenres: string[]; topCountries: string[]; topDirector: string; topDecade: string; totalMovies: number;
  } | null>(null);

  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        analyzeDNA(currentUser.uid);
      } else {
        router.push("/login");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const analyzeDNA = async (uid: string) => {
    try {
      const q = query(collection(db, "movie_logs"), where("userId", "==", uid));
      const snapshot = await getDocs(q);

      interface MovieDoc { id: string; tmdbId: number; genres: string[]; countries: string[]; director: string; language: string; decade: string; }
      const movies: MovieDoc[] = [];
      const toEnrich: { docId: string; tmdbId: number }[] = [];

      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const movie: MovieDoc = {
          id: docSnap.id,
          tmdbId: data.tmdbId,
          genres: data.genres || [],
          countries: data.countries || [],
          director: data.director || "",
          language: data.language || "",
          decade: data.decade || "",
        };
        movies.push(movie);
        // Mark for enrichment if missing data
        if (movie.genres.length === 0 && movie.tmdbId) {
          toEnrich.push({ docId: movie.id, tmdbId: movie.tmdbId });
        }
      });

      // Backfill missing TMDB data
      if (toEnrich.length > 0) {
        setEnriching(true);
        for (let i = 0; i < toEnrich.length; i++) {
          setEnrichProgress(`Enriching movie data... ${i + 1}/${toEnrich.length}`);
          const details = await getMovieDetails(toEnrich[i].tmdbId);
          if (details) {
            // Update Firestore
            await updateDoc(doc(db, "movie_logs", toEnrich[i].docId), {
              genres: details.genres,
              countries: details.countries,
              director: details.director,
              language: details.language,
              decade: details.decade,
            });
            // Update local data
            const m = movies.find(x => x.id === toEnrich[i].docId);
            if (m) {
              m.genres = details.genres;
              m.countries = details.countries;
              m.director = details.director;
              m.language = details.language;
              m.decade = details.decade;
            }
          }
          // Throttle API calls
          await new Promise(r => setTimeout(r, 250));
        }
        setEnriching(false);
      }

      // ─── Aggregate ───
      const countryCounts: Record<string, number> = {};
      const genreCounts: Record<string, number> = {};
      const directorCounts: Record<string, number> = {};
      const decadeCounts: Record<string, number> = {};

      movies.forEach(m => {
        m.countries.forEach(c => { countryCounts[c] = (countryCounts[c] || 0) + 1; });
        m.genres.forEach(g => { genreCounts[g] = (genreCounts[g] || 0) + 1; });
        if (m.director) directorCounts[m.director] = (directorCounts[m.director] || 0) + 1;
        if (m.decade) decadeCounts[m.decade] = (decadeCounts[m.decade] || 0) + 1;
      });

      const sortedCountries = Object.entries(countryCounts).sort(([,a],[,b]) => b - a);
      const sortedGenres = Object.entries(genreCounts).sort(([,a],[,b]) => b - a);
      const sortedDirectors = Object.entries(directorCounts).sort(([,a],[,b]) => b - a);
      const sortedDecades = Object.entries(decadeCounts).sort(([a],[b]) => a.localeCompare(b));

      setCountryData(sortedCountries.slice(0, 8).map(([label, value], i) => ({
        label, value, color: PIE_COLORS[i % PIE_COLORS.length]
      })));
      setGenreData(sortedGenres.map(([label, value]) => ({ label, value, color: BAR_COLORS.genre })));
      setDirectorData(sortedDirectors.map(([label, value]) => ({ label, value, color: BAR_COLORS.director })));
      setDecadeData(sortedDecades.map(([label, value]) => ({ label, value, color: BAR_COLORS.decade })));

      setPersonalityData({
        topGenres: sortedGenres.slice(0, 5).map(([g]) => g),
        topCountries: sortedCountries.slice(0, 3).map(([c]) => c),
        topDirector: sortedDirectors[0]?.[0] || "Unknown",
        topDecade: sortedDecades[sortedDecades.length - 1]?.[0] || "Unknown",
        totalMovies: movies.length,
      });
    } catch (e) {
      console.error("Error analyzing DNA:", e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[var(--purple-soft)] border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--text-muted)] text-sm">Analyzing your cinema DNA...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen relative z-10">
      <div className="organic-shape organic-shape-1" />
      <div className="organic-shape organic-shape-3" />

      <div className="max-w-5xl mx-auto px-6 md:px-10 py-8 md:py-12">
        {/* Header */}
        <header className="mb-6 anim-fade-up">
          <p className="editorial-label mb-2">Analysis</p>
          <h1 className="display-heading text-4xl md:text-5xl text-[var(--text-primary)]">
            Your Film <span className="text-[var(--purple-mid)]">DNA</span>
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-2 font-light">
            A deep look at your cinematic preferences
          </p>
        </header>

        <NavBar />

        {enriching && (
          <div className="glass-card p-4 mb-8 flex items-center gap-3 anim-fade-up">
            <div className="w-5 h-5 border-2 border-[var(--purple-soft)] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[var(--text-secondary)]">{enrichProgress}</p>
          </div>
        )}

        {personalityData && personalityData.totalMovies === 0 ? (
          <div className="text-center py-20 glass-card anim-fade-up" style={{borderStyle: 'dashed'}}>
            <p className="display-heading text-xl text-[var(--text-muted)] mb-2">No data yet</p>
            <p className="text-sm text-[var(--text-light)]">Add movies from the dashboard to discover your Film DNA</p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Personality */}
            {personalityData && (
              <div className="anim-fade-up anim-delay-1">
                <MoviePersonality {...personalityData} />
              </div>
            )}

            {/* Charts grid — asymmetric */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Country Pie */}
              {countryData.length > 0 && (
                <div className="glass-card p-6 anim-fade-up anim-delay-2">
                  <PieChart data={countryData} title="Country Preferences" size={200} />
                </div>
              )}

              {/* Genre Bars */}
              {genreData.length > 0 && (
                <div className="glass-card p-6 anim-fade-up anim-delay-2">
                  <BarChart data={genreData} title="Genre Preferences" />
                </div>
              )}

              {/* Director Bars */}
              {directorData.length > 0 && (
                <div className="glass-card p-6 anim-fade-up anim-delay-3">
                  <BarChart data={directorData} title="Most Watched Directors" maxBars={6} />
                </div>
              )}

              {/* Decade Bars */}
              {decadeData.length > 0 && (
                <div className="glass-card p-6 anim-fade-up anim-delay-3">
                  <BarChart data={decadeData} title="Decade Preferences" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
