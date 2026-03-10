const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

export async function searchMovies(query: string) {
  if (!query) return [];
  
  try {
    const response = await fetch(
      `${BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&language=zh-CN&query=${encodeURIComponent(query)}&page=1`
    );
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("Error searching movies:", error);
    return [];
  }
}

export async function getTrendingMovies() {
  try {
    const response = await fetch(
      `${BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}&language=zh-CN`
    );
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("Error fetching trending movies:", error);
    return [];
  }
}

export interface MovieDetails {
  genres: string[];
  countries: string[];
  director: string;
  language: string;
  decade: string;
}

export async function getMovieDetails(tmdbId: number): Promise<MovieDetails | null> {
  try {
    // Fetch movie details and credits in parallel
    const [detailsRes, creditsRes] = await Promise.all([
      fetch(`${BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=zh-CN`),
      fetch(`${BASE_URL}/movie/${tmdbId}/credits?api_key=${TMDB_API_KEY}&language=zh-CN`)
    ]);

    const details = await detailsRes.json();
    const credits = await creditsRes.json();

    // Extract genres
    const genres: string[] = (details.genres || []).map((g: any) => g.name);

    // Extract production countries
    const countries: string[] = (details.production_countries || []).map((c: any) => c.name);

    // Extract director from crew
    const directorEntry = (credits.crew || []).find((c: any) => c.job === "Director");
    const director: string = directorEntry?.name || "Unknown";

    // Extract primary language
    const language: string = details.original_language || "unknown";

    // Calculate decade from release date
    let decade = "Unknown";
    if (details.release_date) {
      const year = parseInt(details.release_date.substring(0, 4));
      if (!isNaN(year)) {
        decade = `${Math.floor(year / 10) * 10}s`;
      }
    }

    return { genres, countries, director, language, decade };
  } catch (error) {
    console.error("Error fetching movie details:", error);
    return null;
  }
}

export function getImageUrl(path: string | null, width: string = "w500") {
  if (!path) return "https://via.placeholder.com/500x750?text=No+Poster";
  return `https://image.tmdb.org/t/p/${width}${path}`;
}
