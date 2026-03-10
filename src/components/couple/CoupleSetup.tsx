"use client";

import { auth, db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { useState } from "react";

export default function CoupleSetup({ onPaired }: { onPaired: (id: string) => void }) {
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");

  const createCouple = async () => {
    setLoading(true);
    setError("");
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const docRef = await addDoc(collection(db, "couples"), {
        userA: auth.currentUser!.uid,
        userAName: auth.currentUser!.displayName || "User A",
        userB: null,
        inviteCode: code,
        createdAt: new Date()
      });
      setGeneratedCode(code);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const joinCouple = async () => {
    if (!inviteCode.trim()) return;
    setLoading(true);
    setError("");
    try {
      const q = query(collection(db, "couples"), where("inviteCode", "==", inviteCode.trim().toUpperCase()));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setError("Invalid invite code.");
      } else {
        const coupleDoc = snapshot.docs[0];
        if (coupleDoc.data().userB) {
          setError("This code has already been used.");
        } else {
          await updateDoc(doc(db, "couples", coupleDoc.id), {
            userB: auth.currentUser!.uid,
            userBName: auth.currentUser!.displayName || "User B",
          });
          onPaired(coupleDoc.id);
        }
      }
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto py-10 anim-fade-up">
      <div className="glass-card p-10 text-center">
        <h2 className="display-heading text-3xl text-[var(--text-primary)] mb-4">Connect with Partner</h2>
        <p className="text-[var(--text-muted)] text-sm mb-8 leading-relaxed">
          Start a shared movie journey with your special someone. Share a watchlist, rate together, and track your cinema memories as a duo.
        </p>

        {generatedCode ? (
          <div className="space-y-6">
            <p className="editorial-label">Your Connection Code</p>
            <div className="text-4xl font-bold tracking-[0.3em] text-[var(--purple-deep)] py-4 bg-white/60 rounded-2xl border border-[var(--purple-soft)]">
              {generatedCode}
            </div>
            <p className="text-xs text-[var(--text-light)]">Share this code with your partner</p>
            <button onClick={() => window.location.reload()} className="btn-ghost text-sm">Done</button>
          </div>
        ) : (
          <div className="space-y-8">
            <div>
              <button 
                onClick={createCouple}
                disabled={loading}
                className="btn-primary w-full py-4 text-base"
              >
                {loading ? "Creating..." : "Generate Invite Code"}
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-[var(--cream-dark)]" />
              <span className="text-xs text-[var(--text-light)] uppercase tracking-widest">or</span>
              <div className="h-px flex-1 bg-[var(--cream-dark)]" />
            </div>

            <div className="space-y-3">
              <input 
                type="text"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value)}
                placeholder="Enter Invite Code"
                className="input-editorial w-full text-center tracking-[0.1em] font-bold"
              />
              <button 
                onClick={joinCouple}
                disabled={loading || !inviteCode}
                className="btn-ghost w-full py-3 hover:bg-[var(--purple-mid)] hover:text-white transition-colors"
              >
                Join Partner
              </button>
            </div>
          </div>
        )}

        {error && <p className="mt-4 text-xs text-red-500 bg-red-50 p-2 rounded-lg">{error}</p>}
      </div>
    </div>
  );
}
