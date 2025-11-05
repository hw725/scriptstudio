import { useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

/**
 * Google OAuth 로그인 모달 (간소화 버전)
 */
export function AuthModal({ isOpen, onClose, onSuccess: _onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");

    try {
      // origin만 사용 (http://localhost:5173 또는 https://scriptstudio.vercel.app)
      const redirectUrl = window.location.origin;

      console.log("🔐 OAuth redirectTo:", redirectUrl);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) throw error;
      // OAuth는 리다이렉트되므로 여기서는 아무것도 안 함
    } catch (error) {
      console.error("🔐 OAuth 에러:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>ScriptStudio에 오신 것을 환영합니다</DialogTitle>
          <DialogDescription>
            Google 계정으로 간편하게 시작하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="button"
            variant="outline"
            className="w-full h-12"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg
              className="mr-2 h-5 w-5"
              viewBox="0 0 24 24"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {loading ? "로그인 중..." : "Google로 로그인"}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            로그인하면 자동으로 계정이 생성됩니다
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
