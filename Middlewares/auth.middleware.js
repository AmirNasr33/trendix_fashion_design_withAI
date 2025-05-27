import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const authMiddleware = async (req, res, next) => {
    try {

        const token = req.headers.token;
        if (!token) {
            return res.status(401).json({ message: "you should provide token" });
        }
        let decodedToken 
        try {
            decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({
                    message: "Token expired",
                    expiredAt: err.expiredAt // Optional: include expiration timestamp
                });
            }

            if (err.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    message: "Invalid token",
                    details: err.message // Optional: include specific error details
                });
            }

            // Handle any other unexpected errors
            return res.status(401).json({
                message: "Authentication failed",
                error: err.message
            });
        }

        const user = await User.findById(decodedToken.userId).select("-password");
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }
        req.user = user;
        next();
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Error in auth middleware", err });
    }
};
