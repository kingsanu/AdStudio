import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { userService, UserDetails } from "@/services/userService";
import { toast } from "sonner";

// Use the UserDetails interface from userService
type User = UserDetails;

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  userLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUserDetails: (forceRefresh?: boolean) => Promise<void>;
  updateUserProfile: (updatedDetails: Partial<User>) => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userLoading, setUserLoading] = useState(false);
  const navigate = useNavigate();

  // Function to fetch user details from API
  const fetchUserDetails = async (userId: string, forceRefresh = false) => {
    try {
      // Check if we have cached user data and it's not too old (less than 24 hours old)
      const cachedUserData = localStorage.getItem("s_data");
      const cachedTimestamp = localStorage.getItem("s_data_timestamp");
      const now = Date.now();
      const ONE_DAY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

      // If we have cached data and it's recent and we're not forcing a refresh
      if (
        cachedUserData &&
        cachedTimestamp &&
        now - parseInt(cachedTimestamp) < ONE_DAY &&
        !forceRefresh
      ) {
        console.log("Using cached user data from localStorage");
        const parsedUser = JSON.parse(cachedUserData);
        setUser(parsedUser);
        return; // Exit early - no need to fetch from API
      }

      // If we get here, we need to fetch fresh data
      setUserLoading(true);

      // Set a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.warn(
          "User details fetch timeout - forcing loading state to false"
        );
        setUserLoading(false);
      }, 8000); // 8 second timeout

      const userDetails = await userService.getUserDetails(userId);

      // Clear the timeout since we got a response
      clearTimeout(timeoutId);

      if (userDetails) {
        setUser(userDetails);
        // Update local storage with the latest user data and timestamp
        localStorage.setItem("s_data", JSON.stringify(userDetails));
        localStorage.setItem("s_data_timestamp", now.toString());
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      toast.error("Failed to load user details");
    } finally {
      setUserLoading(false);
    }
  };

  // Function to refresh user details
  const refreshUserDetails = async (forceRefresh = false) => {
    // Prevent refreshing if already loading
    if (userLoading) {
      console.log("Already loading user details, skipping refresh");
      return;
    }

    // Get the outlet ID from user object or cookie
    // The token stored in the cookie is actually the outlet ID
    const outletId = user?.userId || Cookies.get("auth_token");
    if (outletId) {
      console.log("Refreshing user details for outlet ID:", outletId);
      await fetchUserDetails(outletId, forceRefresh);
    } else {
      console.warn("No outlet ID found, cannot refresh user details");
    }
  };

  useEffect(() => {
    // Check for authentication token on mount
    const checkAuth = async () => {
      try {
        // The auth_token cookie actually contains the outlet ID
        const outletId = Cookies.get("auth_token");
        if (outletId) {
          console.log("Found outlet ID in cookie:", outletId);

          // First try to get user data from localStorage for immediate display
          const userData = localStorage.getItem("s_data");
          if (userData) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            console.log("Loaded user data from localStorage");

            // Check if we need to refresh the data (older than 24 hours)
            const cachedTimestamp = localStorage.getItem("s_data_timestamp");
            const now = Date.now();
            const ONE_DAY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

            if (!cachedTimestamp || now - parseInt(cachedTimestamp) > ONE_DAY) {
              console.log("Cached user data is old, refreshing from API");
              // Fetch fresh data in the background, but don't block UI
              fetchUserDetails(outletId, false).then(() => {
                console.log("Background refresh of user data complete");
              });
            } else {
              console.log("Cached user data is recent, no need to refresh");
            }
          } else {
            // No cached data, must fetch from API
            await fetchUserDetails(outletId, true);
          }
        } else {
          console.log("No outlet ID found in cookie, user is not logged in");
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Authentication error:", error);
        Cookies.remove("auth_token");
        localStorage.removeItem("s_data");
        localStorage.removeItem("s_data_timestamp");
        setIsLoading(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (outletId: string, userData: User) => {
    // Store the outlet ID in the auth_token cookie
    Cookies.set("auth_token", outletId, { expires: 30 }); // 7 days

    // Store basic user data in localStorage with timestamp
    localStorage.setItem("s_data", JSON.stringify(userData));
    localStorage.setItem("s_data_timestamp", Date.now().toString());
    setUser(userData);

    // Fetch complete user details after login using the outlet ID
    console.log("Logging in with outlet ID:", outletId);
    await fetchUserDetails(outletId, true); // Force refresh on login

    // Redirect to dashboard after successful login
    navigate("/dashboard");
  };

  const logout = () => {
    Cookies.remove("auth_token");
    localStorage.removeItem("s_data");
    localStorage.removeItem("s_data_timestamp");
    localStorage.removeItem("subscription_data");
    localStorage.removeItem("subscription_timestamp");
    setUser(null);
    // navigate("/login");
  };

  // Function to update user profile
  const updateUserProfile = async (
    updatedDetails: Partial<User>
  ): Promise<boolean> => {
    if (!user?.userId) {
      toast.error("You must be logged in to update your profile");
      return false;
    }

    try {
      setUserLoading(true);
      // Call the userService to update the user details
      const updatedUser = await userService.updateUserDetails(
        user.userId,
        updatedDetails
      );

      if (updatedUser) {
        // Update the user state with the new details
        setUser((prevUser) => ({
          ...prevUser!,
          ...updatedDetails,
        }));

        // Update the cached user data
        const cachedUserData = localStorage.getItem("s_data");
        if (cachedUserData) {
          const parsedUser = JSON.parse(cachedUserData);
          const updatedUserData = {
            ...parsedUser,
            ...updatedDetails,
          };
          localStorage.setItem("s_data", JSON.stringify(updatedUserData));
          localStorage.setItem("s_data_timestamp", Date.now().toString());
        }

        toast.success("Profile updated successfully");
        return true;
      } else {
        toast.error("Failed to update profile");
        return false;
      }
    } catch (error) {
      console.error("Error updating user profile:", error);
      toast.error("Failed to update profile");
      return false;
    } finally {
      setUserLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    userLoading,
    login,
    logout,
    refreshUserDetails,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
