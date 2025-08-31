import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { authService } from "../services/authService";
import { CreditCard } from "lucide-react";

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      // Check for direct token (new flow)
      const token = searchParams.get("token");
      const userStr = searchParams.get("user");
      const returnTo = searchParams.get("returnTo");
      const error = searchParams.get("error");

      if (error) {
        throw new Error(`Authentication error: ${error}`);
      }

      if (token && userStr) {
        // New flow: token and user data provided directly
        // Store token and login user
        localStorage.setItem("finance_dashboard_token", token);
        await login(token);

        // Redirect to the intended destination
        setTimeout(() => {
          navigate(decodeURIComponent(returnTo || "/dashboard"), {
            replace: true,
          });
        }, 1500);
        return;
      }

      // Fallback to old flow for backwards compatibility
      const code = searchParams.get("code");
      const state = searchParams.get("state");

      if (!code) {
        throw new Error("Authorization code not found");
      }

      // Handle Google OAuth callback
      const response = await authService.handleGoogleCallback(
        code,
        state || undefined
      );

      // Log in the user
      await login(response.token);

      // Redirect to the intended destination
      setTimeout(() => {
        navigate(response.returnTo || "/dashboard", { replace: true });
      }, 1500);
    } catch (error) {
      console.error("Auth callback error:", error);
      setError(
        error instanceof Error ? error.message : "Authentication failed"
      );

      // Redirect to login after error
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl mx-auto mb-6">
            <CreditCard className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Authentication Failed
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500">
            You will be redirected to the login page shortly...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mx-auto mb-6 animate-pulse">
          <CreditCard className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {isProcessing ? "Authenticating..." : "Welcome!"}
        </h2>
        <p className="text-gray-600 mb-8">
          {isProcessing
            ? "Please wait while we complete your sign-in process"
            : "Redirecting to your dashboard..."}
        </p>

        <div className="flex items-center justify-center space-x-2">
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
          <div
            className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"
            style={{ animationDelay: "0.1s" }}
          ></div>
          <div
            className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
