import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/AuthContext";
import { apiService } from "../services/apiService";
import { generateJWT } from "../services/discordService";

export function DiscordCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const handleCallback = async () => {
      console.log("🔍 DiscordCallback: Starting callback handling");
      
      const code = searchParams.get("code");
      const error = searchParams.get("error");
      
      console.log("🔍 DiscordCallback: URL params", { code: code?.substring(0, 10) + '...', error });

      if (error) {
        console.error("❌ DiscordCallback: OAuth error:", error);
        setStatus("error");
        setError("Discord authorization failed");
        return;
      }

      if (!code) {
        console.error("❌ DiscordCallback: No authorization code");
        setStatus("error");
        setError("No authorization code received");
        return;
      }

      try {
        console.log("🚀 DiscordCallback: Calling processDiscordCallback");
        
        // Exchange code for token and user data via API
        const authResult = await apiService.processDiscordCallback(code);
        
        console.log("✅ DiscordCallback: API response received", authResult);
        
        if (!authResult.success || !authResult.user) {
          throw new Error('Failed to authenticate with Discord');
        }
        
        console.log("🔐 DiscordCallback: Generating JWT");
        
        // Generate JWT token for frontend
        const jwtToken = generateJWT(authResult.user);
        
        console.log("👤 DiscordCallback: Logging in user");
        
        // Login with JWT and user profile
        login(jwtToken, authResult.user);
        
        console.log("🏠 DiscordCallback: Navigating to home");
        
        // Navigate to home
        navigate("/");
      } catch (err) {
        console.error("❌ DiscordCallback: Error during callback", err);
        setStatus("error");
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    };

    handleCallback();
  }, [searchParams, login, navigate]);

  return (
    <div className="full-height flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="minimal-card p-8 text-center fade-in">
          {status === "loading" ? (
            <div className="space-y-4">
              <div className="spinner mx-auto"></div>
              <h2 className="text-xl font-semibold">Connecting...</h2>
              <p className="text-gray-400 text-sm">Completing Discord authentication</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-red-400 text-4xl">⚠</div>
              <h2 className="text-xl font-semibold">Authentication Failed</h2>
              <div className="badge-error">{error}</div>
              <button
                onClick={() => navigate("/")}
                className="discord-btn"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 