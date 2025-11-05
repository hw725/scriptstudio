import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Base44 인증 처리 컴포넌트
 * 로그인되지 않았으면 로그인 페이지로 리디렉션
 */
export function Base44AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const handleLogin = useCallback(async () => {
    try {
      console.log("� 로그인 시도...");

      // Base44 SDK의 로그인 메서드 호출
      // SDK에 따라 다를 수 있음
      if (base44.auth.signIn) {
        await base44.auth.signIn();
      } else if (base44.auth.login) {
        await base44.auth.login();
      } else {
        // 수동으로 Base44 로그인 페이지로 이동
        const loginUrl = `https://app.base44.com/login?redirect=${encodeURIComponent(
          window.location.href
        )}`;
        console.log("🌐 로그인 페이지로 이동:", loginUrl);
        window.location.href = loginUrl;
      }
    } catch (error) {
      console.error("❌ 로그인 실패:", error);
      setAuthError(error.message);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      console.log("� 인증 상태 확인 중...");

      // Base44 인증 확인
      const user = await base44.auth.getCurrentUser();

      if (user) {
        console.log("✅ 로그인됨:", user);
        setIsAuthenticated(true);
      } else {
        console.log("❌ 로그인 필요");
        // 로그인 페이지로 리디렉션
        await handleLogin();
      }
    } catch (error) {
      console.error("❌ 인증 확인 실패:", error);
      setAuthError(error.message);

      // 인증 실패 시 로그인 시도
      await handleLogin();
    } finally {
      setIsLoading(false);
    }
  }, [handleLogin]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

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

  if (authError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md p-6 bg-red-50 rounded-lg">
          <h2 className="text-xl font-bold text-red-800 mb-2">인증 오류</h2>
          <p className="text-red-600 mb-4">{authError}</p>
          <button
            onClick={checkAuth}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">로그인이 필요합니다...</p>
          <button
            onClick={handleLogin}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            로그인
          </button>
        </div>
      </div>
    );
  }

  return children;
}

export default Base44AuthProvider;
