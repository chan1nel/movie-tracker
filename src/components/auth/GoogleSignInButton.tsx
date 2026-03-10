"use client";

import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "@/lib/firebase";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GoogleSignInButton() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSignIn = async () => {
    try {
      // Force account selection so user can switch Google accounts
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("Logged in user:", user);
      router.push("/dashboard"); 
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      setError(error.message);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={handleSignIn}
        className="flex items-center justify-center gap-3 w-full max-w-sm px-5 py-3 rounded-xl font-medium text-sm transition-all
          bg-white/80 backdrop-blur-sm text-[var(--text-primary)]
          border border-[var(--cream-dark)]
          hover:bg-white hover:border-[var(--purple-soft)] hover:shadow-[0_4px_20px_rgba(155,127,212,0.12)]
          hover:-translate-y-0.5
          active:translate-y-0"
        style={{fontFamily: 'var(--font-body)'}}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 shrink-0">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          <path fill="none" d="M0 0h48v48H0z" />
        </svg>
        Continue with Google
      </button>
      {error && <p className="text-[#c0392b] text-xs mt-3 text-center max-w-xs">{error}</p>}
    </div>
  );
}
