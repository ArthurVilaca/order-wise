"use client";

import { useSession } from "next-auth/react";
import Chat from "@/app/_components/chat";

export function Main() {
  const { data: session } = useSession();

  return <>{!session?.user?.email ? <>Sign in to use chat...</> : <Chat />}</>;
}
