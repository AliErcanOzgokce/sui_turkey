import { SuiClient } from "@mysten/sui/client";
import { DiscordRole, TokenBalance } from "../types";

// TR_WAL token type
const TR_WAL_TYPE = "0xa8ad8c2720f064676856f4999894974a129e3d15386b3d0a27f3a7f85811c64a::tr_wal::TR_WAL";

// Token decimals (10^9)
const TOKEN_DECIMALS = 1_000_000_000;

// Discord roles configuration - Updated to marine theme
export const DISCORD_ROLES: DiscordRole[] = [
  { id: "dolphin", name: "🐬 Dolphin", requiredTokens: 100 },
  { id: "shark", name: "🦈 Shark", requiredTokens: 1000 },
  { id: "whale", name: "🐳 Whale", requiredTokens: 10000 }
];

export async function getTokenBalance(suiClient: SuiClient, address: string): Promise<number> {
  try {
    // Get all coin objects owned by the address
    const { data: coinObjects } = await suiClient.getCoins({
      owner: address,
      coinType: TR_WAL_TYPE,
    });

    // Sum up all balances
    const totalBalance = coinObjects.reduce(
      (total, coin) => total + BigInt(coin.balance),
      BigInt(0)
    );

    // Convert to number and divide by decimals to get human-readable amount
    return Number(totalBalance) / TOKEN_DECIMALS;
  } catch (error) {
    console.error("Error fetching token balance:", error);
    return 0;
  }
}

// Mock function for development
export async function getMockTokenBalance(): Promise<number> {
  // Simulate different token amounts for testing
  const mockBalances = [0, 50, 150, 1500, 15000];
  const randomBalance = mockBalances[Math.floor(Math.random() * mockBalances.length)];
  
  console.log(`🎭 Mock balance generated: ${randomBalance} TR_WAL`);
  return randomBalance;
}

export function determineEligibleRoles(balance: number): DiscordRole[] {
  return DISCORD_ROLES.filter(role => balance >= role.requiredTokens);
}

export function getHighestRole(balance: number): DiscordRole | null {
  const eligibleRoles = determineEligibleRoles(balance);
  if (eligibleRoles.length === 0) return null;
  
  // Return the role with highest token requirement
  return eligibleRoles.reduce((highest, current) => 
    current.requiredTokens > highest.requiredTokens ? current : highest
  );
}

// Get all objects of a specific type
export async function getObjectsOfType(suiClient: SuiClient, address: string, objectType: string) {
  try {
    const response = await suiClient.getOwnedObjects({
      owner: address,
      filter: {
        MatchAll: [
          { StructType: TR_WAL_TYPE }
        ]
      },
      options: {
        showType: true,
        showContent: true,
        showDisplay: true,
      }
    });

    return response.data.filter((obj: any) => obj.data?.type === objectType);
  } catch (error) {
    console.error('Error fetching objects:', error);
    return [];
  }
}

export async function checkOwnedTokens(suiClient: SuiClient, address: string): Promise<TokenBalance[]> {
  try {
    // Get owned objects with the specific type - using proper type filter
    const { data: objects } = await suiClient.getOwnedObjects({
      owner: address,
      filter: {
        MatchAll: [
          { StructType: TR_WAL_TYPE }
        ]
      },
      options: {
        showContent: true,
      }
    });

    return objects.map(obj => {
      // Extract balance from object content safely
      let balance = 0;
      if (obj.data?.content?.dataType === "moveObject") {
        const fields = obj.data.content.fields as { balance?: string };
        balance = fields.balance ? Number(fields.balance) / TOKEN_DECIMALS : 0;
      }
      
      return {
        objectId: obj.data?.objectId || "",
        balance
      };
    });
  } catch (error) {
    console.error("Error checking owned tokens:", error);
    return [];
  }
}

export function getRolesByTokenAmount(tokenAmount: number): string[] {
  // Sort roles by required tokens in ascending order
  const sortedRoles = [...DISCORD_ROLES].sort((a, b) => a.requiredTokens - b.requiredTokens);
  
  // Determine which roles the user qualifies for
  const qualifiedRoles = sortedRoles.filter(role => tokenAmount >= role.requiredTokens);
  
  // Return the role IDs
  return qualifiedRoles.map(role => role.id);
} 