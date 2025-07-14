import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { AuthState, UserProfile } from "../types";
import { verifyJWT, generateJWT } from "../services/discordService";
import { findUserByDiscordId, createOrUpdateUser, addWallet, removeWallet } from "../services/apiService";

// Initial state
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
};

// Create context
export const AuthContext = createContext<{
  authState: AuthState;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
  updateUser: (userData: Partial<UserProfile>) => Promise<void>;
  addUserWallet: (suiAddress: string) => Promise<void>;
  removeUserWallet: (suiAddress: string) => Promise<void>;
}>({
  authState: initialState,
  login: () => {},
  logout: () => {},
  updateUser: async () => {},
  addUserWallet: async () => {},
  removeUserWallet: async () => {},
});

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(initialState);

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      const decoded = verifyJWT(token);
      if (decoded) {
        // Fetch user data from real API
        findUserByDiscordId(decoded.discordId)
          .then((user) => {
            if (user) {
              setAuthState({
                isAuthenticated: true,
                user,
                token,
              });
            } else {
              // Token valid but user not found, log out
              localStorage.removeItem("auth_token");
              setAuthState(initialState);
            }
          })
          .catch((err) => {
            console.error("Error fetching user from API:", err);
            localStorage.removeItem("auth_token");
            setAuthState(initialState);
          });
      } else {
        // Invalid token, remove it
        localStorage.removeItem("auth_token");
        setAuthState(initialState);
      }
    }
  }, []);

  const login = (token: string, user: UserProfile) => {
    localStorage.setItem("auth_token", token);
    setAuthState({
      isAuthenticated: true,
      user,
      token,
    });
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    setAuthState(initialState);
  };

  const updateUser = async (userData: Partial<UserProfile>) => {
    if (!authState.user) return;

    try {
      const updatedUser = await createOrUpdateUser({
        ...userData,
        discordId: authState.user.discordId,
      });

      // Generate a new token with updated data
      const newToken = generateJWT(updatedUser);

      // Update state
      setAuthState({
        isAuthenticated: true,
        user: updatedUser,
        token: newToken,
      });

      // Update local storage
      localStorage.setItem("auth_token", newToken);
    } catch (error) {
      console.error("Error updating user via API:", error);
      throw error;
    }
  };

  const addUserWallet = async (suiAddress: string) => {
    if (!authState.user) return;

    try {
      const updatedUser = await addWallet(authState.user.discordId, suiAddress);

      // Generate a new token with updated data
      const newToken = generateJWT(updatedUser);

      // Update state
      setAuthState({
        isAuthenticated: true,
        user: updatedUser,
        token: newToken,
      });

      // Update local storage
      localStorage.setItem("auth_token", newToken);
    } catch (error) {
      console.error("Error adding wallet via API:", error);
      throw error;
    }
  };

  const removeUserWallet = async (suiAddress: string) => {
    if (!authState.user) return;

    try {
      const updatedUser = await removeWallet(authState.user.discordId, suiAddress);

      // Generate a new token with updated data
      const newToken = generateJWT(updatedUser);

      // Update state
      setAuthState({
        isAuthenticated: true,
        user: updatedUser,
        token: newToken,
      });

      // Update local storage
      localStorage.setItem("auth_token", newToken);
    } catch (error) {
      console.error("Error removing wallet via API:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      authState, 
      login, 
      logout, 
      updateUser, 
      addUserWallet,
      removeUserWallet 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
} 