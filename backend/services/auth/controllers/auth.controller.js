import { app } from "../config/firebase.js";
import { getAuth } from "firebase-admin/auth";
import crypto from "crypto";
import redis from "../../../shared/redis/redis.js";
import User from "../models/user.model.js";

export const login = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        message: "Firebase token is required",
      });
    }

    // Verify Firebase token
    const decoded = await getAuth(app).verifyIdToken(token);

    // Find user
    let user = await User.findOne({
      firebaseUid: decoded.uid,
    });

    // Create user if not exists
    if (!user) {
      user = await User.create({
        firebaseUid: decoded.uid,
        name: decoded.name,
        email: decoded.email,
        avatar: decoded.picture,
      });
    }

    // Create session ID
    const sessionId = crypto.randomUUID();

    await redis.set(
      `user-session-${user._id}`,
      sessionId,
      "EX",
      7 * 24 * 60 * 60,
    );

    // Save session in Redis
    await redis.set(
      `session-${sessionId}`,
      JSON.stringify({
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        credits: user.credits,
      }),
      "EX",
      7 * 24 * 60 * 60,
    );

    // Set cookie
    res.cookie("session", sessionId, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json(user);
  } catch (error) {
    console.error("========== LOGIN ERROR ==========");
    console.error(error);
    console.error("=================================");

    return res.status(500).json({
      message: error.message,
    });
  }
};

export const logout = async (req, res) => {
  try {
    const sessionId = req.cookies?.session;

    if (sessionId) {
      await redis.del(`session-${sessionId}`);
    }

    res.clearCookie("session", {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });

    return res.status(200).json({
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout Error:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};

const getSessionUser = async (req) => {
  const sessionId = req.cookies?.session;

  if (!sessionId) {
    return null;
  }

  const sessionData = await redis.get(`session-${sessionId}`);

  if (!sessionData) {
    return null;
  }

  return JSON.parse(sessionData);
};


export const deductCredits = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({
        message: "amount must be a positive integer",
      });
    }

    const sessionUser = await getSessionUser(req);

    if (!sessionUser) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const user = await User.findOneAndUpdate(
      {
        _id: sessionUser._id,
        credits: { $gte: amount },
      },
      {
        $inc: {
          credits: -amount,
        },
      },
      {
        new: true,
      },
    ).select("credits name email avatar");

    if (!user) {
      return res.status(400).json({
        message: "Insufficient credits",
      });
    }

    const sessionId = req.cookies.session;

    await redis.set(
      `session-${sessionId}`,
      JSON.stringify({
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        credits: user.credits,
      }),
      "EX",
      7 * 24 * 60 * 60,
    );

    return res.status(200).json({
      message: "Credits deducted successfully",
      credits: user.credits,
    });
  } catch (error) {
    console.error("Deduct credits error:", error);

    return res.status(500).json({
      message: "Failed to deduct credits",
    });
  }
};

export const addCredits = async (req, res) => {
  try {
    const { credits } = req.body;

    if (!Number.isInteger(credits) || credits <= 0) {
      return res.status(400).json({
        message: "credits must be a positive integer",
      });
    }

    const sessionUser = await getSessionUser(req);

    if (!sessionUser) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const user = await User.findOneAndUpdate(
      {
        _id: sessionUser._id,
      },
      {
        $inc: {
          credits,
        },
      },
      {
        new: true,
      },
    ).select("credits name email avatar");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const sessionId = req.cookies.session;

    await redis.set(
      `session-${sessionId}`,
      JSON.stringify({
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        credits: user.credits,
      }),
      "EX",
      7 * 24 * 60 * 60,
    );

    return res.status(200).json({
      message: "Credits added successfully",
      credits: user.credits,
    });
  } catch (error) {
    console.error("Add credits error:", error);

    return res.status(500).json({
      message: "Failed to add credits",
    });
  }
};


