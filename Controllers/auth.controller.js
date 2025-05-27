import User from "../models/user.model.js";
import { generateVerificationEmail } from "../Services/emailTemplete.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import sendmail from "../Services/emailSender.js";
import { setCookie } from "../Services/setCookies.js";
import cloudinary from "../Services/cloudainry.js";
import fs from 'fs';

export const register = async (req, res, next) => {
    try {
        const { name, email, password, phoneNumber, address } = req.body;

        if (!name || !email || !password || !phoneNumber || !address) {
            return next(new Error("Please provide all required data", 400));
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return next(new Error("User already exists", 400));
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        let photoUrl = null;
        if (req.file) {
            // Upload photo to Cloudinary
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'user_photos'
            });
            photoUrl = result.secure_url;
            
            // Delete the temporary file
            fs.unlinkSync(req.file.path);
        }

        const userObj = {
            name,
            email,
            password: hashedPassword,
            phoneNumber,
            address,
            photo: photoUrl
        }

        const user = await User.create(userObj);

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);

        const isEmailSent = await sendmail({
            to: user.email,
            subject: "Welcome to Trendix",
            message: generateVerificationEmail({
                userName: user.name,
                verificationLink: `${process.env.FRONTEND_URL}/verify/${token}`,
            })
        });

        if (!isEmailSent) {
            return next(new Error("Email not sent", 500));
        }

        res.status(201).json({
            message: "verification link sent to your email successfully",
            user: {
                name: user.name,
                email: user.email,
                photo: user.photo
            }
        });
    }
    catch (error) {
        // Clean up the uploaded file if there's an error
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        next(error);
    }
}

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return next(new Error("Please provide all required data", 400));
        }
        const user = await User.findOne({ email });
        if (!user) {
            return next(new Error("User not found", 400));
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return next(new Error("Invalid credentials", 400));
        }
        const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

        setCookie(res, 'authToken', accessToken, {
            maxAge: 7 * 24 * 60 * 60 * 1000 
        });
        res.status(200).json({
            message: "Login successful",
            token:accessToken
        })
    }
    catch (error) {
        next(error);
    }
}


export const profile=async(req,res,next)=>{
    try{
        const user=req.user
        res.status(200).json({
            message:"User profile",
            user
        })
    }
    catch(error){
        next(error);
    }
}