import { useState, useEffect } from "react";
import { useAccounts, useCurrentAccount, useDisconnectWallet } from "@mysten/dapp-kit";
import { useSuiClient } from "@mysten/dapp-kit";
import { useAuth } from "../hooks/AuthContext";
import { getTokenBalance } from "../services/tokenService";

interface WalletAccountBalance {
  address: string;
  balance: number;
  isLoading: boolean;
  isLinked: boolean;
}

interface ManageWalletsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ManageWalletsModal({ isOpen, onClose }: ManageWalletsModalProps) {
  const accounts = useAccounts();
  const currentAccount = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const suiClient = useSuiClient();
  const { authState, addUserWallet, removeUserWallet } = useAuth();
  
  const [accountBalances, setAccountBalances] = useState<Record<string, WalletAccountBalance>>({});
  const [error, setError] = useState<string | null>(null);

  const userLinkedAddresses = authState.user?.suiAddresses || [];

  // Load balances for all accounts
  useEffect(() => {
    if (!isOpen || !accounts.length) return;

    const loadAccountBalances = async () => {
      const balances: Record<string, WalletAccountBalance> = {};

      for (const account of accounts) {
        balances[account.address] = {
          address: account.address,
          balance: 0,
          isLoading: true,
          isLinked: userLinkedAddresses.includes(account.address)
        };
      }
      
      setAccountBalances(balances);

      // Load balances in parallel
      const balancePromises = accounts.map(async (account) => {
        try {
          const balance = await getTokenBalance(suiClient, account.address);
          return { address: account.address, balance };
        } catch (error) {
          console.error(`Error loading balance for ${account.address}:`, error);
          return { address: account.address, balance: 0 };
        }
      });

      try {
        const results = await Promise.all(balancePromises);
        
        const updatedBalances = { ...balances };
        results.forEach(({ address, balance }) => {
          if (updatedBalances[address]) {
            updatedBalances[address].balance = balance;
            updatedBalances[address].isLoading = false;
          }
        });
        
        setAccountBalances(updatedBalances);
      } catch (error) {
        console.error('Error loading account balances:', error);
        setError('Failed to load account balances');
      }
    };

    loadAccountBalances();
  }, [isOpen, accounts, suiClient, userLinkedAddresses]);

  const formatBalance = (amount: number): string => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const handleLinkWallet = async (address: string) => {
    try {
      setError(null);
      await addUserWallet(address);
      
      // Update local state
      setAccountBalances(prev => ({
        ...prev,
        [address]: { ...prev[address], isLinked: true }
      }));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to link wallet');
    }
  };

  const handleUnlinkWallet = async (address: string) => {
    try {
      setError(null);
      await removeUserWallet(address);
      
      // Update local state
      setAccountBalances(prev => ({
        ...prev,
        [address]: { ...prev[address], isLinked: false }
      }));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to unlink wallet');
    }
  };

  const handleDisconnectWallet = async (address: string) => {
    try {
      setError(null);
      
      // First unlink from our system if linked
      const accountBalance = accountBalances[address];
      if (accountBalance?.isLinked) {
        await handleUnlinkWallet(address);
      }
      
      // Then disconnect from wallet
      disconnect();
      
      // Remove from local state
      setAccountBalances(prev => {
        const newBalances = { ...prev };
        delete newBalances[address];
        return newBalances;
      });
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to disconnect wallet');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-md max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Manage Wallets</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-gray-400 text-sm mt-2">
            Manage your connected wallets and view their TR_WAL balances
          </p>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {error && (
            <div className="badge-error mb-4 text-center">
              {error}
            </div>
          )}

          {!accounts.length ? (
            <div className="text-center text-gray-400 py-8">
              <p>No wallets connected</p>
              <p className="text-sm mt-2">Connect a wallet to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => {
                const accountBalance = accountBalances[account.address];
                const isCurrentAccount = currentAccount?.address === account.address;

                return (
                  <div
                    key={account.address}
                    className="p-4 bg-gray-800 rounded-lg border border-gray-700"
                  >
                    {/* Account Info */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-mono text-gray-300">
                            {formatAddress(account.address)}
                          </span>
                          {isCurrentAccount && (
                            <span className="badge badge-success text-xs">Current</span>
                          )}
                          {accountBalance?.isLinked && (
                            <span className="badge badge-success text-xs">Linked</span>
                          )}
                        </div>
                        
                        {/* Balance */}
                        <div className="text-lg font-semibold text-white">
                          {accountBalance?.isLoading ? (
                            <span className="text-gray-400">Loading...</span>
                          ) : (
                            `${formatBalance(accountBalance?.balance || 0)} TR_WAL`
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      {accountBalance?.isLinked ? (
                        <button
                          onClick={() => handleUnlinkWallet(account.address)}
                          className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                        >
                          Unlink
                        </button>
                      ) : (
                        <button
                          onClick={() => handleLinkWallet(account.address)}
                          className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors"
                        >
                          Link
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDisconnectWallet(account.address)}
                        className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700">
          <div className="text-xs text-gray-400 text-center">
            <p>• Link wallets to include them in balance calculations</p>
            <p>• Disconnect removes wallet from authorized list</p>
          </div>
        </div>
      </div>
    </div>
  );
} 