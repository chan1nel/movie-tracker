"use client";

interface CategoryBadgeProps {
  label: string;
  type: string;
}

const CategoryBadge = ({ label, type }: CategoryBadgeProps) => {
  const themes: Record<string, string> = {
    genre: "bg-[var(--purple-light)] text-[var(--purple-deep)] border-[var(--purple-soft)]",
    country: "bg-[var(--blue-light)] text-[var(--blue-deep)] border-[var(--blue-soft)]",
    director: "bg-[#e8f5e9] text-[#2e7d32] border-[#a5d6a7]",
    decade: "bg-[#fff3e0] text-[#e65100] border-[#ffcc80]"
  };
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${themes[type] || ""}`}>
      {label}
    </span>
  );
};

interface MoviePersonalityProps {
  topGenres: string[];
  topCountries: string[];
  topDirector: string;
  topDecade: string;
  totalMovies: number;
}

export default function MoviePersonality({
  topGenres,
  topCountries,
  topDirector,
  topDecade,
  totalMovies
}: MoviePersonalityProps) {
  
  // Simple "Archtype" logic
  let archetype = "Visual Storyteller";
  let description = "You appreciate the art of cinema and deep storytelling.";

  if (topGenres.includes("Action") || topGenres.includes("Sci-Fi")) {
    archetype = "The Adventurer";
    description = "You love high stakes, epic journeys, and the thrill of the unknown.";
  } else if (topGenres.includes("Romance") || topGenres.includes("Drama")) {
    archetype = "The Empath";
    description = "You are drawn to human connection, emotional depth, and complex relationships.";
  } else if (topGenres.includes("Crime") || topGenres.includes("Thriller") || topGenres.includes("Mystery")) {
    archetype = "The Investigator";
    description = "You enjoy solving puzzles, dark atmospheres, and psychological tension.";
  }

  return (
    <div className="glass-card p-10 bg-white/50 relative overflow-hidden">
      {/* Decorative BG element */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-[var(--purple-soft)] rounded-full blur-[80px] opacity-30" />
      
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
        <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-[var(--purple-mid)] to-[var(--blue-accent)] rounded-full flex items-center justify-center text-6xl shadow-xl shadow-purple-200">
           🪞
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <p className="editorial-label text-[var(--purple-deep)] tracking-[0.2em] mb-3">YOUR ARCHETYPE</p>
          <h2 className="display-heading text-4xl md:text-5xl text-[var(--text-primary)] mb-4">{archetype}</h2>
          <p className="text-[var(--text-secondary)] text-lg font-light leading-relaxed max-w-2xl">
            {description} With <strong className="text-[var(--purple-mid)]">{totalMovies}</strong> films logged, your taste is uniquely shaped by {topCountries[0]} {topGenres[0]} cinema, especially from the {topDecade}.
          </p>
          
          <div className="mt-8 flex flex-wrap justify-center md:justify-start gap-3">
            {topGenres.slice(0, 2).map(g => <CategoryBadge key={g} label={g} type="genre" />)}
            {topCountries.slice(0, 1).map(c => <CategoryBadge key={c} label={c} type="country" />)}
            <CategoryBadge label={topDirector} type="director" />
            <CategoryBadge label={topDecade} type="decade" />
          </div>
        </div>
      </div>
    </div>
  );
}
