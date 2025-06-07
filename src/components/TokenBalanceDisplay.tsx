import { useTokenBalance } from "../hooks/useTokenBalance";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { DISCORD_ROLES } from "../services/tokenService";
import { roleService } from "../services/roleService";
import { useState } from "react";
import { useAuth } from "../hooks/AuthContext";

export function TokenBalanceDisplay() {
  const currentAccount = useCurrentAccount();
  const { balance, isLoading, error } = useTokenBalance();
  const { authState } = useAuth();
  const [isUpdatingRoles, setIsUpdatingRoles] = useState(false);
  const [roleUpdateMessage, setRoleUpdateMessage] = useState<string | null>(null);
  const [roleUpdateError, setRoleUpdateError] = useState<string | null>(null);
  
  const formatBalance = (amount: number): string => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
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
  
  if (!currentAccount) {
    return (
      <div className="text-center text-gray-400 fade-in">
        No wallet connected
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="text-center space-y-4 fade-in">
        <div className="spinner mx-auto"></div>
        <p className="text-gray-400 text-sm">Loading balance...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center fade-in">
        <div className="badge-error">Error: {error.message}</div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 fade-in">
      {/* Balance */}
      <div className="balance-display">
        <p className="text-4xl font-bold text-white mb-2">
          {formatBalance(balance)}
        </p>
        <p className="text-gray-300 text-sm">TR_WAL Tokens</p>
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
    </div>
  );
} 