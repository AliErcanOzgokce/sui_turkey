import { useSuiClient,  } from "@mysten/dapp-kit";
import { useEffect, useState, useRef } from "react";
import { getTokenBalance } from "../services/tokenService";
import { useAuth } from "./AuthContext";

export function useTokenBalance() {
  const suiClient = useSuiClient();
  //const currentAccount = useCurrentAccount();
  const { authState } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [addressBalances, setAddressBalances] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Prevent multiple API calls for the same addresses
  const lastCheckedAddresses = useRef<string[]>([]);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const checkBalanceForAddress = async (address: string): Promise<number> => {
    try {
      const tokenBalance = await getTokenBalance(suiClient, address);
      return tokenBalance;
    } catch (err) {
      console.error(`Error checking token balance for ${address}:`, err);
      return 0;
    }
  };

  const checkBalancesForAddresses = async (addresses: string[]) => {
    if (!addresses || addresses.length === 0) {
      setBalance(0);
      setAddressBalances({});
      return;
    }
    
    // Check if we need to update (addresses changed)
    const addressesString = addresses.sort().join(',');
    const lastAddressesString = lastCheckedAddresses.current.sort().join(',');
    
    if (lastAddressesString === addressesString && !isLoading) {
      return;
    }
    
    lastCheckedAddresses.current = addresses;
    setIsLoading(true);
    setError(null);
    
    try {
      // Check balance for each address in parallel
      const balancePromises = addresses.map(async (address) => ({
        address,
        balance: await checkBalanceForAddress(address)
      }));
      
      const results = await Promise.all(balancePromises);
      
      // Create address balance map
      const newAddressBalances: Record<string, number> = {};
      let totalBalance = 0;
      
      results.forEach(({ address, balance }) => {
        newAddressBalances[address] = balance;
        totalBalance += balance;
      });
      
      setAddressBalances(newAddressBalances);
      setBalance(totalBalance);
      
    } catch (err) {
      console.error("Error checking token balances:", err);
      setError(err as Error);
      setBalance(0);
      setAddressBalances({});
    } finally {
      setIsLoading(false);
    }
  };

  const manualRefresh = async () => {
    const addresses = authState.user?.suiAddresses || [];
    if (addresses.length > 0) {
      // Force refresh by clearing the cache
      lastCheckedAddresses.current = [];
      await checkBalancesForAddresses(addresses);
    }
  };

  useEffect(() => {
    // Clear previous timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    // Get all linked addresses from user
    const addresses = authState.user?.suiAddresses || [];
    
    if (addresses.length > 0) {
      // Debounce the balance check to prevent excessive requests
      debounceTimeout.current = setTimeout(() => {
        checkBalancesForAddresses(addresses);
      }, 300); // 300ms debounce
    } else {
      lastCheckedAddresses.current = [];
      setBalance(0);
      setAddressBalances({});
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [authState.user?.suiAddresses, suiClient]);

  return {
    balance, // Total balance across all addresses
    addressBalances, // Individual address balances
    isLoading,
    error,
    manualRefresh,
    linkedAddressesCount: authState.user?.suiAddresses?.length || 0
  };
} 