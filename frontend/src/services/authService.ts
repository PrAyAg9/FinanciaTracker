import { API_CONFIG, User, ApiError } from "./types";

class AuthService {
  private baseURL = API_CONFIG.BASE_URL;

  /**
   * Get Google OAuth URL
   */
  async getGoogleAuthUrl(returnTo?: string): Promise<string> {
    try {
      const params = new URLSearchParams();
      if (returnTo) params.append("returnTo", returnTo);

      const response = await fetch(
        `${this.baseURL}/auth/google?${params.toString()}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get authentication URL");
      }

      const data = await response.json();
      return data.authUrl;
    } catch (error) {
      console.error("Error getting Google auth URL:", error);
      throw new Error("Failed to initialize authentication");
    }
  }

  /**
   * Handle Google OAuth callback
   */
  async handleGoogleCallback(
    code: string,
    state?: string
  ): Promise<{
    token: string;
    user: User;
    returnTo: string;
  }> {
    try {
      const response = await fetch(`${this.baseURL}/auth/google/callback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, state }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed");
      }

      return {
        token: data.token,
        user: data.user,
        returnTo: data.returnTo || "/dashboard",
      };
    } catch (error) {
      console.error("Error handling Google callback:", error);
      throw error instanceof Error ? error : new Error("Authentication failed");
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<User> {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${this.baseURL}/auth/profile`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch profile");
      }

      return data.user;
    } catch (error) {
      console.error("Error fetching profile:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to fetch profile");
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<User>): Promise<User> {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${this.baseURL}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      return data.user;
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to update profile");
    }
  }

  /**
   * Verify authentication token
   */
  async verifyToken(): Promise<User> {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${this.baseURL}/auth/verify-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Token verification failed");
      }

      return data.user;
    } catch (error) {
      console.error("Error verifying token:", error);
      // Clear invalid token
      localStorage.removeItem("auth_token");
      throw error instanceof Error
        ? error
        : new Error("Token verification failed");
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      const token = localStorage.getItem("auth_token");

      if (token) {
        // Optional server-side logout
        await fetch(`${this.baseURL}/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error("Error during logout:", error);
      // Continue with client-side logout even if server-side fails
    } finally {
      // Always clear local storage
      localStorage.removeItem("auth_token");
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem("auth_token");
    return !!token;
  }

  /**
   * Get stored authentication token
   */
  getToken(): string | null {
    return localStorage.getItem("auth_token");
  }

  /**
   * Store authentication token
   */
  setToken(token: string): void {
    localStorage.setItem("auth_token", token);
  }

  /**
   * Clear authentication token
   */
  clearToken(): void {
    localStorage.removeItem("auth_token");
  }
}

export const authService = new AuthService();
