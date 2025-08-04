
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/icons";

export default function AuthPage() {
  const { user, signInWithGoogle, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
     return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (user) {
    return null; // Or a redirect component
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center p-8 border rounded-lg shadow-lg max-w-sm w-full bg-card">
        <Logo className="h-12 w-12 text-primary mb-4" />
        <h1 className="text-2xl font-bold text-primary mb-2">Welcome to SmartTodoo</h1>
        <p className="text-muted-foreground mb-6 text-center">
            Sign in to sync your tasks across all your devices and never lose your progress.
        </p>
        <Button onClick={signInWithGoogle} className="w-full">
            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-72.2 72.2C322 108.8 287.8 96 248 96c-88.8 0-160.1 72.1-160.1 160s71.3 160 160.1 160c97.4 0 142.2-64.7 148.6-96.5H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path>
            </svg>
            Sign in with Google
        </Button>
      </div>
    </div>
  );
}
