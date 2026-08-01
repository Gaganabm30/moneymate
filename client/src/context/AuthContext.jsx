import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  getCurrentUser,
  loginUser,
  registerUser,
} from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = localStorage.getItem(
          "moneymate_token"
        );

        // No token = user is not logged in
        if (!token) {
          setUser(null);
          return;
        }

        const response = await getCurrentUser();

        if (response?.user) {
          setUser(response.user);

          localStorage.setItem(
            "moneymate_user",
            JSON.stringify(response.user)
          );
        } else {
          throw new Error("User not found");
        }
      } catch (error) {
        console.error(
          "Session restore failed:",
          error
        );

        localStorage.removeItem(
          "moneymate_token"
        );

        localStorage.removeItem(
          "moneymate_user"
        );

        setUser(null);
      } finally {
        // CRITICAL:
        // Loading must ALWAYS stop.
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const register = async (formData) => {
    const response = await registerUser(formData);

    localStorage.setItem(
      "moneymate_token",
      response.token
    );

    localStorage.setItem(
      "moneymate_user",
      JSON.stringify(response.user)
    );

    setUser(response.user);

    return response;
  };

  const login = async (credentials) => {
    const response = await loginUser(credentials);

    localStorage.setItem(
      "moneymate_token",
      response.token
    );

    localStorage.setItem(
      "moneymate_user",
      JSON.stringify(response.user)
    );

    setUser(response.user);

    return response;
  };

  const logout = () => {
    localStorage.removeItem(
      "moneymate_token"
    );

    localStorage.removeItem(
      "moneymate_user"
    );

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        register,
        login,
        logout,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
};