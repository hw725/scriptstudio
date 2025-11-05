import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { AuthModal } from "@/components/auth/AuthModal";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

/**
 * 인증 Provider
 * 앱 전체에서 사용자 인증 상태 관리
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    // URL fragment 제거 (OAuth 리다이렉트 후 남은 토큰 정리)
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }

    // 현재 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);

      // 로그인 안 되어 있으면 모달 표시
      if (!session) {
        setShowAuthModal(true);
      }
    });

    // 인증 상태 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      // OAuth 리다이렉트 후 세션이 생성되면 모달 닫기
      if (session) {
        setShowAuthModal(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setShowAuthModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 사용자 정보 표시 */}
      {user && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
          <div className="flex items-center gap-2 bg-background border rounded-lg px-3 py-2 shadow-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{user.email}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="h-6 w-6 p-0"
            >
              <LogOut className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* 로그인 모달 */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          if (user) {
            setShowAuthModal(false);
          }
        }}
        onSuccess={(user) => {
          setUser(user);
          setShowAuthModal(false);
        }}
      />

      {/* 메인 콘텐츠 */}
      {children}
    </>
  );
}
