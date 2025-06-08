import { SuiClient } from "@mysten/sui/client";

// TR_WAL Token Configuration
const TR_WAL_TYPE = "0xa8ad8c2720f064676856f4999894974a129e3d15386b3d0a27f3a7f85811c64a::tr_wal::TR_WAL";
const TOKEN_DECIMALS = 1_000_000_000; // 9 decimals

// Role thresholds
const ROLE_THRESHOLDS = {
  DOLPHIN: 100,
  SHARK: 1000,
  WHALE: 10000,
};

// Discord roles configuration - Marine theme
export const DISCORD_ROLES = [
  { id: "dolphin", name: "🐬 Dolphin", requiredTokens: 100 },
  { id: "shark", name: "🦈 Shark", requiredTokens: 1000 },
  { id: "whale", name: "🐳 Whale", requiredTokens: 10000 }
];

export interface TokenBalance {
  objectId: string;
  balance: number;
}

export interface RoleInfo {
  name: string;
  emoji: string;
  threshold: number;
}

// Get total token balance for an address using getCoins API
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
    const humanReadableBalance = Number(totalBalance) / TOKEN_DECIMALS;
    
    return humanReadableBalance;
  } catch (error) {
    console.error("❌ Error getting token balance:", error);
    return 0;
  }
}

// Determine roles based on token amount
export function getRolesByTokenAmount(tokenAmount: number): string[] {
  const roles: string[] = [];
  
  if (tokenAmount >= ROLE_THRESHOLDS.WHALE) {
    roles.push("Whale");
  } else if (tokenAmount >= ROLE_THRESHOLDS.SHARK) {
    roles.push("Shark");
  } else if (tokenAmount >= ROLE_THRESHOLDS.DOLPHIN) {
    roles.push("Dolphin");
  }
  
  return roles;
}

// Get role info with emojis
export function getRoleInfo(tokenAmount: number): RoleInfo | null {
  if (tokenAmount >= ROLE_THRESHOLDS.WHALE) {
    return { name: "Whale", emoji: "🐳", threshold: ROLE_THRESHOLDS.WHALE };
  } else if (tokenAmount >= ROLE_THRESHOLDS.SHARK) {
    return { name: "Shark", emoji: "🦈", threshold: ROLE_THRESHOLDS.SHARK };
  } else if (tokenAmount >= ROLE_THRESHOLDS.DOLPHIN) {
    return { name: "Dolphin", emoji: "🐬", threshold: ROLE_THRESHOLDS.DOLPHIN };
  }
  
  return null;
}

// Get all available roles
export function getAllRoles(): RoleInfo[] {
  return [
    { name: "Dolphin", emoji: "🐬", threshold: ROLE_THRESHOLDS.DOLPHIN },
    { name: "Shark", emoji: "🦈", threshold: ROLE_THRESHOLDS.SHARK },
    { name: "Whale", emoji: "🐳", threshold: ROLE_THRESHOLDS.WHALE },
  ];
}

export function determineEligibleRoles(balance: number) {
  return DISCORD_ROLES.filter(role => balance >= role.requiredTokens);
}

export function getHighestRole(balance: number) {
  const eligibleRoles = determineEligibleRoles(balance);
  if (eligibleRoles.length === 0) return null;
  
  // Return the role with highest token requirement
  return eligibleRoles.reduce((highest, current) => 
    current.requiredTokens > highest.requiredTokens ? current : highest
  );
} 