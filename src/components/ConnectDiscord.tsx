import { useEffect, useState } from "react";
import { getDiscordAuthUrl } from "../services/discordService";
import { useAuth } from "../hooks/AuthContext";

export function ConnectDiscord() {
  const { authState } = useAuth();
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  useEffect(() => {
    const fetchAuthUrl = async () => {
      try {
        const url = await getDiscordAuthUrl();
        setAuthUrl(url);
      } catch (error) {
        console.error("Error fetching Discord auth URL:", error);
      }
    };
    
    if (!authState.isAuthenticated) {
      fetchAuthUrl();
    }
  }, [authState.isAuthenticated]);
  
  const handleConnect = () => {
    setIsLoading(true);
    if (authUrl) {
      window.location.href = authUrl;
    }
  };
  
  if (authState.isAuthenticated && authState.user) {
    return (
      <div className="text-center space-y-4 fade-in">
        <div className="badge-discord">✓ Connected as {authState.user.discordUsername}</div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 fade-in">
      <button
        onClick={handleConnect}
        disabled={isLoading || !authUrl}
        className="discord-btn w-full"
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <div className="spinner mr-2"></div>
            Connecting...
          </span>
        ) : (
          'Connect with Discord'
        )}
      </button>
    </div>
  );
} 