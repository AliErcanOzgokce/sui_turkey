import { useSuiClient } from "@mysten/dapp-kit";
import { useEffect, useState } from "react";
import { getTokenBalance, getRolesByTokenAmount } from "../services/tokenService";
import { useAuth } from "./AuthContext";
import { updateUserRoles, updateUserTokenBalance } from "../services/mongodb";

export function useTokenBalance() {
  const { authState, updateUser } = useAuth();
  const suiClient = useSuiClient();
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const checkBalance = async (address: string) => {
    if (!address) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const tokenBalance = await getTokenBalance(suiClient, address);
      setBalance(tokenBalance);
      
      // If user is authenticated, update their balance in the database
      if (authState.isAuthenticated && authState.user) {
        await updateUserTokenBalance(authState.user.discordId, tokenBalance);
        
        // Get the roles based on token amount
        const roles = getRolesByTokenAmount(tokenBalance);
        
        // Update user roles in the database
        await updateUserRoles(authState.user.discordId, roles);
        
        // Update user in context
        await updateUser({ 
          tokenBalance, 
          roles,
        });
      }
      
      return tokenBalance;
    } catch (err) {
      setError(err as Error);
      return 0;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // If user has a connected wallet, check their balance
    if (authState.user?.suiAddress) {
      checkBalance(authState.user.suiAddress);
    }
  }, [authState.user?.suiAddress, suiClient]);

  return {
    balance,
    isLoading,
    error,
    checkBalance,
  };
} 