import { useState, useEffect } from 'react';
import { useAccounts, useCurrentAccount, useDisconnectWallet, useSuiClient } from '@mysten/dapp-kit';
import { useAuth } from '../hooks/AuthContext';
import { ConnectButton } from '@mysten/dapp-kit';
import { getTokenBalance } from '../services/tokenService';

interface WalletAccountBalance {
  address: string;
  balance: number;
  isLoading: boolean;
  isLinked: boolean;
}

export function ManageWalletsPage() {
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
    if (!accounts.length) return;

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

      try {
        for (const account of accounts) {
          try {
            const balanceValue = await getTokenBalance(suiClient, account.address);
            
            setAccountBalances(prev => ({
              ...prev,
              [account.address]: {
                ...prev[account.address],
                balance: balanceValue,
                isLoading: false
              }
            }));
          } catch (error) {
            console.error(`Error loading balance for ${account.address}:`, error);
            setAccountBalances(prev => ({
              ...prev,
              [account.address]: {
                ...prev[account.address],
                balance: 0,
                isLoading: false
              }
            }));
          }
        }
      } catch (error) {
        console.error('Error loading account balances:', error);
        setError('Failed to load account balances');
      }
    };

    loadAccountBalances();
  }, [accounts, suiClient, userLinkedAddresses]);

  const formatBalance = (amount: number): string => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6
    });
  };

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleLinkWallet = async (address: string) => {
    try {
      setError(null);
      await addUserWallet(address);
      setAccountBalances(prev => ({
        ...prev,
        [address]: {
          ...prev[address],
          isLinked: true
        }
      }));
    } catch (error: any) {
      console.error('Error linking wallet:', error);
      setError(error.message || 'Failed to link wallet');
    }
  };

  const handleUnlinkWallet = async (address: string) => {
    try {
      setError(null);
      await removeUserWallet(address);
      setAccountBalances(prev => ({
        ...prev,
        [address]: {
          ...prev[address],
          isLinked: false
        }
      }));
    } catch (error: any) {
      console.error('Error unlinking wallet:', error);
      setError(error.message || 'Failed to unlink wallet');
    }
  };

  const handleDisconnectWallet = async (address: string) => {
    try {
      setError(null);
      
      // First unlink from our system if linked
      const accountData = accountBalances[address];
      if (accountData?.isLinked) {
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
      console.error('Error disconnecting wallet:', error);
      setError('Failed to disconnect wallet');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Manage Wallets</h2>
        <p className="text-gray-400 text-sm">
          Manage your connected wallets and link them to your account
        </p>
      </div>

      {error && (
        <div className="badge-error text-center">
          {error}
        </div>
      )}

      {/* Connection Status */}
      <div className="bg-gray-800/30 rounded-lg p-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Connected Accounts:</span>
          <span className="text-white">{accounts.length}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Linked Wallets:</span>
          <span className="text-white">{userLinkedAddresses.length}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Current Account:</span>
          <span className="text-white">
            {currentAccount ? formatAddress(currentAccount.address) : 'None'}
          </span>
        </div>
      </div>

      {/* Connect New Wallet */}
      <div className="text-center">
        <ConnectButton className="!bg-indigo-600 !hover:bg-indigo-700" />
        <p className="text-xs text-gray-400 mt-2">
          Connect more wallets to manage multiple addresses
        </p>
      </div>

      {/* Account List */}
      {accounts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-center">Connected Accounts</h3>
          
          {accounts.map(account => {
            const accountData = accountBalances[account.address];
            if (!accountData) return null;

            return (
              <div 
                key={account.address}
                className="bg-gray-800/30 rounded-lg p-4 space-y-3"
              >
                {/* Account Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      currentAccount?.address === account.address ? 'bg-green-500' : 'bg-gray-500'
                    }`} />
                    <div>
                      <div className="font-mono text-sm text-white">
                        {formatAddress(account.address)}
                      </div>
                      {currentAccount?.address === account.address && (
                        <div className="text-xs text-green-400">Current Account</div>
                      )}
                    </div>
                  </div>
                  
                  {accountData.isLinked && (
                    <div className="badge-success text-xs">Linked</div>
                  )}
                </div>

                {/* Balance */}
                <div className="text-center py-2">
                  {accountData.isLoading ? (
                    <div className="text-gray-400">Loading balance...</div>
                  ) : (
                    <div className="text-xl font-bold text-white">
                      {formatBalance(accountData.balance)} TR_WAL
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  {accountData.isLinked ? (
                    <button
                      onClick={() => handleUnlinkWallet(account.address)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                    >
                      Unlink
                    </button>
                  ) : (
                    <button
                      onClick={() => handleLinkWallet(account.address)}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                    >
                      Link to Account
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDisconnectWallet(account.address)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {accounts.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <p>No wallets connected</p>
          <p className="text-sm mt-2">Connect a wallet to get started</p>
        </div>
      )}
    </div>
  );
} 