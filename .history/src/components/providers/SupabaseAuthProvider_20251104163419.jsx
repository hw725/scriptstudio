import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { AuthModal } from "@/components/auth/AuthModal";

/**
 * Supabase 인증 프로바이더
 * Google OAuth 로그인 처리
 */
export function SupabaseAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    // 현재 세션 확인
    checkUser();

    // 인증 상태 변경 리스너
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
      if (session?.user) {
        setShowAuthModal(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (!session?.user) {
        setShowAuthModal(true);
      }
    } catch (error) {
      console.error("인증 확인 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = (user) => {
    setUser(user);
    setShowAuthModal(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}
