import { useTokenBalance } from "../hooks/useTokenBalance";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { DISCORD_ROLES } from "../services/tokenService";
import { roleService } from "../services/roleService";
import { useState } from "react";
import { useAuth } from "../hooks/AuthContext";
import { triggerBalanceCheck } from "../services/apiService";
import { ManageWalletsModal } from "./ManageWalletsModal";

export function TokenBalanceDisplay() {
  const currentAccount = useCurrentAccount();
  const { balance, isLoading, error, manualRefresh, linkedAddressesCount } = useTokenBalance();
  const { authState } = useAuth();
  const [isUpdatingRoles, setIsUpdatingRoles] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isManageWalletsOpen, setIsManageWalletsOpen] = useState(false);
  const [roleUpdateMessage, setRoleUpdateMessage] = useState<string | null>(null);
  const [roleUpdateError, setRoleUpdateError] = useState<string | null>(null);
  
  const formatBalance = (amount: number): string => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  const handleUpdateRoles = async () => {
    // Check if user is authenticated using AuthContext
    if (!authState.isAuthenticated || !authState.user) {
      setRoleUpdateError('Discord authentication required');
      return;
    }

    const discordUserId = authState.user.discordId;
    if (!discordUserId) {
      setRoleUpdateError('Discord user ID not found');
      return;
    }

    setIsUpdatingRoles(true);
    setRoleUpdateMessage(null);
    setRoleUpdateError(null);

    try {
      const result = await roleService.updateUserRoles(discordUserId, balance);
      
      if (result.success) {
        setRoleUpdateMessage(
          result.roles?.length ? 
            `Granted: ${result.roles.join(', ')}` : 
            'No roles granted'
        );
      } else {
        setRoleUpdateError(`Failed: ${result.error}`);
      }
    } catch (error) {
      setRoleUpdateError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUpdatingRoles(false);
    }
  };

  const handleRefreshBalance = async () => {
    setIsRefreshing(true);
    try {
      await manualRefresh();
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTriggerServerBalanceCheck = async () => {
    try {
      await triggerBalanceCheck();
      setRoleUpdateMessage('Server balance check triggered successfully');
      // Refresh our local balance after server check
      setTimeout(() => {
        manualRefresh();
      }, 2000);
    } catch (error) {
      setRoleUpdateError(`Failed to trigger server balance check: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  if (!authState.user?.suiAddresses || authState.user.suiAddresses.length === 0) {
    return (
      <div className="text-center text-gray-400 fade-in">
        <p>No wallets linked to your account</p>
        <p className="text-sm mt-2">Link a wallet in the previous step</p>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="text-center space-y-4 fade-in">
        <div className="spinner mx-auto"></div>
        <p className="text-gray-400 text-sm">Loading balances from {linkedAddressesCount} wallet{linkedAddressesCount > 1 ? 's' : ''}...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center fade-in space-y-3">
        <div className="badge-error">Error: {error.message}</div>
        <button
          onClick={handleRefreshBalance}
          disabled={isRefreshing}
          className="text-sm text-indigo-400 hover:text-indigo-300"
        >
          {isRefreshing ? 'Refreshing...' : 'Try Again'}
        </button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 fade-in">
      {/* Total Balance */}
      <div className="balance-display">
        <div className="flex items-center justify-between mb-2">
          <p className="text-4xl font-bold text-white">
            {formatBalance(balance)}
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsManageWalletsOpen(true)}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors"
              title="Manage wallets"
            >
              Manage Wallets
            </button>
            <button
              onClick={handleRefreshBalance}
              disabled={isRefreshing || isLoading}
              className="text-gray-400 hover:text-white transition-colors text-sm"
              title="Refresh balance"
            >
              {isRefreshing ? '🔄' : '↻'}
            </button>
          </div>
        </div>
        <p className="text-gray-300 text-sm">Total TR_WAL Tokens</p>
        <p className="text-gray-400 text-xs mt-1">
          Across {linkedAddressesCount} wallet{linkedAddressesCount > 1 ? 's' : ''}
        </p>
      </div>

      {/* Roles */}
      <div className="space-y-4">
        <p className="text-center text-gray-300 text-sm font-medium">Marine Roles</p>
        
        <div className="space-y-3">
          {DISCORD_ROLES.map((role) => {
            const isEligible = balance >= role.requiredTokens;
            return (
              <div 
                key={role.id}
                className={`role-card ${role.id} ${isEligible ? 'eligible' : ''}`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{role.name.split(' ')[0]}</span>
                    <span className="text-sm font-medium text-white">{role.name.split(' ')[1]}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-gray-400">
                      {role.requiredTokens.toLocaleString()}+ TR_WAL
                    </span>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isEligible ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-300'
                    }`}>
                      {isEligible ? '✓' : '✗'}
                    </div>
                  </div>
                </div>
                
                {/* Role Description */}
                {role.id === 'whale' && (
                  <p className="text-xs text-gray-400 mt-2">🐳・whale-lair erişimi, en yüksek ayrıcalıklar ve VIP etkinlikler</p>
                )}
                {role.id === 'shark' && (
                  <p className="text-xs text-gray-400 mt-2">🦈・shark-den'de özel etkinlikler</p>
                )}
                {role.id === 'dolphin' && (
                  <p className="text-xs text-gray-400 mt-2">🐬・dolphin-cove'da eğlenceli etkinlikler</p>
                )}
              </div>
            );
          })}
        </div>

        <div className="space-y-3">
          <button
            onClick={handleUpdateRoles}
            disabled={isUpdatingRoles}
            className="discord-btn w-full"
          >
            {isUpdatingRoles ? (
              <span className="flex items-center justify-center">
                <div className="spinner mr-3"></div>
                Updating Marine Roles...
              </span>
            ) : (
              'Update Discord Roles'
            )}
          </button>

          {/* Server Balance Check (Development/Testing) */}
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={handleTriggerServerBalanceCheck}
              className="text-sm text-gray-400 hover:text-gray-300 w-full py-2 border border-gray-700 rounded-lg"
            >
              Trigger Server Balance Check
            </button>
          )}
        </div>

        {/* Messages */}
        {roleUpdateMessage && (
          <div className="badge-success text-center text-sm w-full justify-center">
            {roleUpdateMessage}
          </div>
        )}

        {roleUpdateError && (
          <div className="badge-error text-center text-sm w-full justify-center">
            {roleUpdateError}
          </div>
        )}
      </div>

      {/* Manage Wallets Modal */}
      <ManageWalletsModal 
        isOpen={isManageWalletsOpen}
        onClose={() => setIsManageWalletsOpen(false)}
      />
    </div>
  );
} 