import { useSuiClient, useCurrentAccount } from "@mysten/dapp-kit";
import { useEffect, useState, useRef } from "react";
import { getTokenBalance, getRolesByTokenAmount } from "../services/tokenService";
import { useAuth } from "./AuthContext";
import { updateUserTokenBalance } from "../services/apiService";

export function useTokenBalance() {
  const { authState, updateUser } = useAuth();
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Prevent multiple API calls for the same address
  const lastCheckedAddress = useRef<string | null>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const checkBalance = async (address: string) => {
    if (!address) return;
    
    // Prevent duplicate calls for the same address
    if (lastCheckedAddress.current === address && !isLoading) {
      return;
    }
    
    lastCheckedAddress.current = address;
    setIsLoading(true);
    setError(null);
    
    try {
      const tokenBalance = await getTokenBalance(suiClient, address);
      setBalance(tokenBalance);
      
      // If user is authenticated, update their balance via API
      if (authState.isAuthenticated && authState.user && authState.user.discordId) {
        try {
          // Update token balance and roles via API
          await updateUserTokenBalance(authState.user.discordId, tokenBalance);
          
          // Get the roles based on token amount for local state
          const roles = getRolesByTokenAmount(tokenBalance);
          
          // Update user in context with new data
          await updateUser({ 
            tokenBalance, 
            roles,
          });
        } catch (apiError) {
          console.error("Failed to update user balance via API:", apiError);
          // Don't throw here - we still want to show the balance even if API update fails
        }
      }
      
      return tokenBalance;
    } catch (err) {
      console.error("Error checking token balance:", err);
      setError(err as Error);
      return 0;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Clear previous timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    // Check balance for currently connected wallet with debounce
    if (currentAccount?.address) {
      // Debounce the API call to prevent excessive requests
      debounceTimeout.current = setTimeout(() => {
        checkBalance(currentAccount.address);
      }, 300); // 300ms debounce
    } else {
      lastCheckedAddress.current = null;
      setBalance(0);
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [currentAccount?.address, suiClient, authState.isAuthenticated]);

  return {
    balance,
    isLoading,
    error,
    checkBalance,
  };
} 