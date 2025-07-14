import { useCurrentAccount } from "@mysten/dapp-kit";
import { useAuth } from "../hooks/AuthContext";
import { useState } from "react";

export function LinkWallet() {
  const { authState, addUserWallet, removeUserWallet } = useAuth();
  const currentAccount = useCurrentAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // If not authenticated with Discord, don't show this component
  if (!authState.isAuthenticated || !authState.user) {
    return null;
  }

  const userAddresses = authState.user.suiAddresses || [];
  const currentAddress = currentAccount?.address;
  const isCurrentAddressLinked = currentAddress && userAddresses.includes(currentAddress);

  const handleAddWallet = async () => {
    if (!currentAddress) {
      setError("No wallet connected");
      return;
    }

    if (isCurrentAddressLinked) {
      setError("This wallet is already linked");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await addUserWallet(currentAddress);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add wallet");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveWallet = async (address: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await removeUserWallet(address);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove wallet");
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  return (
    <div className="space-y-4 fade-in">
      {error && (
        <div className="badge-error text-center">{error}</div>
      )}

      {/* Current Wallet Status */}
      {currentAddress && (
        <div className="space-y-3">
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Current Wallet</h3>
            <div className={`badge ${isCurrentAddressLinked ? 'badge-success' : 'badge-warning'}`}>
              {isCurrentAddressLinked ? '✓ Linked' : '⚠ Not Linked'}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {formatAddress(currentAddress)}
            </p>
          </div>

          {!isCurrentAddressLinked && (
            <button
              onClick={handleAddWallet}
              disabled={isLoading}
              className="discord-btn w-full"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <div className="spinner mr-2"></div>
                  Adding...
                </span>
              ) : (
                'Add Current Wallet'
              )}
            </button>
          )}
        </div>
      )}

      {/* Linked Wallets List */}
      {userAddresses.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-300 text-center">
            Linked Wallets ({userAddresses.length})
          </h3>
          
          <div className="space-y-2">
            {userAddresses.map((address) => (
              <div
                key={address}
                className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-gray-300">
                      {formatAddress(address)}
                    </span>
                    {address === currentAddress && (
                      <span className="badge badge-success text-xs">Current</span>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => handleRemoveWallet(address)}
                  disabled={isLoading}
                  className="text-red-400 hover:text-red-300 text-sm disabled:opacity-50"
                  title="Remove wallet"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Wallets Message */}
      {userAddresses.length === 0 && !currentAddress && (
        <div className="text-center text-gray-400 text-sm">
          <p>Connect a wallet to get started</p>
        </div>
      )}
    </div>
  );
} 