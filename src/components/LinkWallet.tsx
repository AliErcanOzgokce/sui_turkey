import { useCurrentAccount } from "@mysten/dapp-kit";
import { useAuth } from "../hooks/AuthContext";
import { useState } from "react";

export function LinkWallet() {
  const { authState, updateUser } = useAuth();
  const currentAccount = useCurrentAccount();
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // If not authenticated with Discord, don't show this component
  if (!authState.isAuthenticated || !authState.user) {
    return null;
  }
  
  // If wallet is already linked, show status
  if (authState.user.suiAddress) {
    const isSameWallet = currentAccount?.address === authState.user.suiAddress;
    
    return (
      <div className="text-center space-y-3 fade-in">
        <div className={`badge ${isSameWallet ? 'badge-success' : 'badge-error'}`}>
          {isSameWallet ? '✓ Wallet Linked' : '⚠ Different Wallet'}
        </div>
        
        {!isSameWallet && (
          <p className="text-xs text-gray-400">
            Current: {currentAccount?.address.slice(0, 8)}...{currentAccount?.address.slice(-8)}
          </p>
        )}
      </div>
    );
  }

  const handleLinkWallet = async () => {
    if (!currentAccount?.address) {
      setError("No wallet connected");
      return;
    }

    setIsLinking(true);
    setError(null);

    try {
      await updateUser({ suiAddress: currentAccount.address });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to link wallet");
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div className="space-y-4 fade-in">
      {error && (
        <div className="badge-error text-center">{error}</div>
      )}

      <button
        onClick={handleLinkWallet}
        disabled={isLinking || !currentAccount}
        className="discord-btn w-full"
      >
        {isLinking ? (
          <span className="flex items-center justify-center">
            <div className="spinner mr-2"></div>
            Linking...
          </span>
        ) : (
          'Link Wallet'
        )}
      </button>
    </div>
  );
} 