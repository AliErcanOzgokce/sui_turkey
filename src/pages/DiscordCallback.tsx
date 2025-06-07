import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/AuthContext";
import { exchangeCodeForToken, getDiscordUser, generateJWT } from "../services/discordService";
import { createOrUpdateUser } from "../services/mongodb";

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
        // Exchange code for access token
        const tokenData = await exchangeCodeForToken(code);
        
        // Get Discord user info
        const discordUser = await getDiscordUser(tokenData.access_token);
        
        // Create or update user in database
        const userProfile = await createOrUpdateUser({
          discordId: discordUser.id,
          discordUsername: `${discordUser.username}#${discordUser.discriminator}`,
          discordAvatar: discordUser.avatar ? 
            `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png` : 
            null,
          email: discordUser.email
        });
        
        // Generate JWT token
        const jwtToken = generateJWT(userProfile);
        
        // Login with JWT and user profile
        login(jwtToken, userProfile);
        
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