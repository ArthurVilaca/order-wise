"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export function Header() {
  const { data: session } = useSession();
  return (
    <header className="w-full bg-gradient-to-r from-purple-700 via-purple-800 to-purple-900 py-4 shadow-md">
      <div className="container mx-auto flex items-center justify-between px-6">
        <div className="text-2xl font-bold text-white">OrderWise</div>

        <p className="text-white">
          {session && <span>Logged in as {session?.user?.name}</span>}
        </p>

        <Link
          href={session ? "/api/auth/signout" : "/api/auth/signin"}
          className="rounded-full bg-yellow-400 px-6 py-2 text-sm font-semibold text-purple-900 shadow-md transition hover:bg-yellow-500"
        >
          {session ? "Sign out" : "Sign in"}
        </Link>
      </div>
    </header>
  );
}
