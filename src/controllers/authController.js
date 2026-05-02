import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../config/jwt.js";

const isProd = process.env.NODE_ENV === "production";

// REGISTER
export const registerUser = async (req, res) => {
  try {
    let { name, email, password, location } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    email = email.toLowerCase();

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    const hashed = await bcrypt.hash(password, saltRounds);

    const user = await User.create({
      name,
      email,
      password: hashed,
      location
    });

    const token = generateToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "None" : "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      message: "Registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    console.error("❌ Register Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// LOGIN
export const loginUser = async (req, res) => {
  try {
    let { email, password } = req.body;

    email = email.toLowerCase();

    const user = await User.findOne({ email }).select("+password");;
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "None" : "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    console.error("❌ Login Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// LOGOUT
export const logoutUser = async (req, res) => {
  try {
    res.cookie("token", "", {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "None" : "Lax",
      expires: new Date(0)
    });

    res.status(200).json({ message: "Logged out successfully" });

  } catch (err) {
    console.error("❌ Logout Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// PROFILE
export const getProfile = async (req, res) => {
  try {
    // ✅ Check authentication
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // ✅ Fetch fresh user data from DB
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);

  } catch (error) {
    console.error("❌ Profile Error:", error.message);

    res.status(500).json({
      message: "Failed to fetch profile",
    });
  }
};