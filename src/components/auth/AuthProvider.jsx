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
    // 현재 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log(
        "🔐 세션 확인:",
        session ? "있음" : "없음",
        session?.user?.id
      );

      // 세션이 있으면 수동으로 localStorage에 저장
      if (session) {
        const storageKey = "sb-celspwnmirsebfzbyopr-auth-token";
        try {
          localStorage.setItem(storageKey, JSON.stringify(session));
          console.log("✅ 세션을 localStorage에 저장했습니다");
        } catch (e) {
          console.error("❌ localStorage 저장 실패:", e);
        }

        setShowAuthModal(false);
      } else {
        // 로그인 안 되어 있으면 모달 표시
        setShowAuthModal(true);
      }

      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 인증 상태 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("🔐 Auth 상태 변경:", event, session?.user?.id);

      // 세션이 생성/변경되면 localStorage에 저장
      if (session) {
        const storageKey = "sb-celspwnmirsebfzbyopr-auth-token";
        try {
          localStorage.setItem(storageKey, JSON.stringify(session));
          console.log("✅ 세션 변경 감지 → localStorage 저장");
        } catch (e) {
          console.error("❌ localStorage 저장 실패:", e);
        }

        setShowAuthModal(false);

        // 세션 생성 후 URL fragment 제거 (약간 지연)
        setTimeout(() => {
          if (window.location.hash) {
            console.log("🧹 URL fragment 제거");
            window.history.replaceState(null, "", window.location.pathname);
          }
        }, 1000);
      }

      setUser(session?.user ?? null);
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
