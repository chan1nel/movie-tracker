import { redirect } from "next/navigation";

export default function Home() {
  // Directly redirect to login, removing the cinematic intro as requested
  redirect("/login");
}
