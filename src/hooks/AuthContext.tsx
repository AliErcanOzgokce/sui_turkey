import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { AuthState, UserProfile } from "../types";
import { verifyJWT, generateJWT } from "../services/discordService";
import { findUserByDiscordId, createOrUpdateUser } from "../services/mongodb";

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
}>({
  authState: initialState,
  login: () => {},
  logout: () => {},
  updateUser: async () => {},
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
        // Fetch user data from DB
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
            }
          })
          .catch((err) => {
            console.error("Error fetching user:", err);
            localStorage.removeItem("auth_token");
          });
      } else {
        // Invalid token, remove it
        localStorage.removeItem("auth_token");
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
      console.error("Error updating user:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ authState, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
} 