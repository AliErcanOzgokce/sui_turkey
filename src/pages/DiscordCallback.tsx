import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/AuthContext";
import { exchangeCodeForToken, generateJWT } from "../services/discordService";

export function DiscordCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const error = searchParams.get("error");

      if (error) {
        setStatus("error");
        setError("Discord authorization failed");
        return;
      }

      if (!code) {
        setStatus("error");
        setError("No authorization code received");
        return;
      }

      try {
        // Exchange code for token and user data via API
        const authResult = await exchangeCodeForToken(code);
        
        console.log('🔍 Discord OAuth Result:', authResult);
        console.log('🔍 User data:', authResult.user);
        console.log('🔍 User discordId:', authResult.user?.discordId);
        
        // Generate JWT token for frontend
        const jwtToken = generateJWT(authResult.user);
        
        // Login with JWT and user profile
        login(jwtToken, authResult.user);
        
        // Navigate to home
        navigate("/");
      } catch (err) {
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