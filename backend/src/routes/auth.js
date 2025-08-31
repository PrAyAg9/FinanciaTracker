import express from "express";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Initialize Google OAuth2 client lazily
let googleClient = null;

const getGoogleClient = () => {
  if (!googleClient) {
    console.log("🔍 Initializing Google OAuth Client...");
    console.log(
      "Client ID:",
      process.env.GOOGLE_CLIENT_ID ? "Present" : "Missing"
    );
    console.log(
      "Client Secret:",
      process.env.GOOGLE_CLIENT_SECRET ? "Present" : "Missing"
    );

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new Error("Missing Google OAuth credentials");
    }

    googleClient = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${
        process.env.BACKEND_URL || "http://localhost:3001"
      }/auth/google/callback`
    );

    console.log("✅ Google OAuth Client initialized");
  }
  return googleClient;
};

/**
 * @route   GET /auth/google
 * @desc    Initiate Google OAuth flow
 * @access  Public
 */
router.get("/google", (req, res) => {
  try {
    console.log("🚀 Initiating Google OAuth flow...");

    // Get Google client (this will initialize it if needed)
    const client = getGoogleClient();

    const authUrl = client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
      include_granted_scopes: true,
      prompt: "consent", // Force consent screen to ensure refresh token
      state: JSON.stringify({
        returnTo: req.query.returnTo || "/dashboard",
        timestamp: Date.now(),
      }),
    });

    console.log("✅ Generated OAuth URL:", authUrl.substring(0, 100) + "...");
    res.json({ authUrl });
  } catch (error) {
    console.error("❌ Google OAuth URL generation error:", error);
    res.status(500).json({
      error: "Authentication Error",
      message: error.message || "Failed to initiate Google OAuth",
    });
  }
});

/**
 * @route   GET /auth/google/callback
 * @desc    Handle Google OAuth callback
 * @access  Public
 */
router.get("/google/callback", async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Authorization code is required",
      });
    }

    // Get Google client (this will initialize it if needed)
    const client = getGoogleClient();

    // Exchange code for tokens
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // Get user info from Google
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture, email_verified } = payload;

    if (!email_verified) {
      return res.status(400).json({
        error: "Email Not Verified",
        message: "Please verify your email with Google first",
      });
    }

    // Find or create user
    let user = await User.findOne({
      $or: [{ googleId: googleId }, { email: email }],
    });

    if (user) {
      // Update existing user
      user.googleId = googleId;
      user.name = name || user.name;
      user.picture = picture || user.picture;
      user.lastLogin = new Date();
      await user.save();
    } else {
      // Create new user
      user = new User({
        googleId,
        email,
        name: name || email.split("@")[0],
        picture,
        lastLogin: new Date(),
      });
      await user.save();
    }

    // Generate JWT token
    const jwtPayload = {
      userId: user._id,
      email: user.email,
      name: user.name,
      picture: user.picture,
    };

    const token = jwt.sign(jwtPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      issuer: "finance-dashboard",
      audience: "finance-dashboard-users",
    });

    // Parse state to get return URL
    let returnTo = "/dashboard";
    try {
      if (state) {
        const stateData = JSON.parse(state);
        returnTo = stateData.returnTo || "/dashboard";
      }
    } catch (error) {
      console.warn("Invalid state parameter:", error.message);
    }

    // Redirect to frontend with token and user info
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const redirectUrl = `${frontendUrl}/auth/callback?token=${encodeURIComponent(
      token
    )}&user=${encodeURIComponent(
      JSON.stringify({
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      })
    )}&returnTo=${encodeURIComponent(returnTo)}`;

    res.redirect(redirectUrl);
  } catch (error) {
    console.error("Google OAuth callback error:", error);

    // Redirect to frontend with error
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    let errorMessage = "Failed to authenticate with Google";

    if (error.message.includes("invalid_grant")) {
      errorMessage = "Authorization code has expired or is invalid";
    }

    const redirectUrl = `${frontendUrl}/auth/callback?error=${encodeURIComponent(
      errorMessage
    )}`;
    res.redirect(redirectUrl);
  }
});

/**
 * @route   GET /auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-__v");

    if (!user) {
      return res.status(404).json({
        error: "User Not Found",
        message: "User profile not found",
      });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        preferences: user.preferences,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({
      error: "Server Error",
      message: "Failed to fetch user profile",
    });
  }
});

/**
 * @route   PUT /auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { name, preferences } = req.body;
    const userId = req.user._id;

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (preferences)
      updateData.preferences = { ...req.user.preferences, ...preferences };

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-__v");

    if (!user) {
      return res.status(404).json({
        error: "User Not Found",
        message: "User not found",
      });
    }

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        preferences: user.preferences,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({
      error: "Server Error",
      message: "Failed to update profile",
    });
  }
});

/**
 * @route   POST /auth/refresh
 * @desc    Refresh JWT token
 * @access  Private
 */
router.post("/refresh", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    // Generate new JWT token
    const jwtPayload = {
      userId: req.user._id,
      email: req.user.email,
      name: req.user.name,
      picture: req.user.picture,
    };

    const newToken = jwt.sign(jwtPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      issuer: "finance-dashboard",
      audience: "finance-dashboard-users",
    });

    res.json({
      success: true,
      token: newToken,
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        picture: req.user.picture,
      },
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({
      error: "Server Error",
      message: "Failed to refresh token",
    });
  }
});

/**
 * @route   POST /auth/logout
 * @desc    Logout user (optional server-side cleanup)
 * @access  Private
 */
router.post("/logout", authenticateToken, async (req, res) => {
  try {
    // In a stateless JWT setup, logout is primarily handled client-side
    // This endpoint can be used for any server-side cleanup if needed

    res.json({
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      error: "Server Error",
      message: "Logout failed",
    });
  }
});

/**
 * @route   POST /auth/verify-token
 * @desc    Verify if token is valid
 * @access  Private
 */
router.post("/verify-token", authenticateToken, (req, res) => {
  res.json({
    valid: true,
    user: {
      id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      picture: req.user.picture,
    },
  });
});

export default router;
