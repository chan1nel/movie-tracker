"use client";

import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 relative z-10">
      {/* Organic shapes */}
      <div className="organic-shape organic-shape-1" />
      <div className="organic-shape organic-shape-2" />

      <div className="w-full max-w-sm glass-card overflow-hidden anim-fade-up">
        {/* Header */}
        <div className="px-8 pt-12 pb-6 text-center">
          <p className="editorial-label mb-3">Welcome to</p>
          <h1 className="display-heading text-4xl text-[var(--text-primary)] mb-2">
            Cine<span className="text-[var(--purple-mid)]">Tracker</span>
          </h1>
          <p className="text-[var(--text-muted)] text-sm font-light leading-relaxed">
            Log your films. Track your journey.<br />Curate your personal cinema.
          </p>
        </div>
        
        {/* Sign in */}
        <div className="px-8 pb-8 flex flex-col items-center space-y-5">
          <p className="text-[var(--text-secondary)] text-center text-sm leading-relaxed">
            Sign in to start building your personalized film collection.
          </p>
          
          <div className="w-full pt-2">
            <GoogleSignInButton />
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-8 py-4 text-center" style={{borderTop: '1px solid var(--cream-dark)'}}>
          <p className="text-[0.65rem] text-[var(--text-light)]">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
