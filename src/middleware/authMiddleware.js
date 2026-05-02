import jwt from "jsonwebtoken";

export const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET not configured");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Only store ID (best practice)
    req.user = { _id: decoded.id };

    next();

  } catch (err) {
    console.error("❌ Auth Error:", err.message);

    return res.status(401).json({
      message: "Token invalid or expired",
    });
  }
};