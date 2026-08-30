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

    // Save session in Redis
    await redis.set(
      `session-${sessionId}`,
      JSON.stringify({
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      }),
      "EX",
      7 * 24 * 60 * 60
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