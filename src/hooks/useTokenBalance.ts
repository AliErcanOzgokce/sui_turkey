import { useSuiClient, useCurrentAccount } from "@mysten/dapp-kit";
import { useEffect, useState, useRef } from "react";
import { getTokenBalance } from "../services/tokenService";

export function useTokenBalance() {
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
      // Debounce the balance check to prevent excessive requests
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
  }, [currentAccount?.address, suiClient]); // Removed authState dependency

  return {
    balance,
    isLoading,
    error,
    checkBalance,
  };
} 