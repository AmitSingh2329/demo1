import jwt from "jsonwebtoken";

export const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    console.error("❌ JWT_SECRET missing");
    process.exit(1);
  }

  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || "7d",
      algorithm: "HS256",
    }
  );
};