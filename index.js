import cookieParser from "cookie-parser";
import { config } from "dotenv";
import express from "express"
import { db_connection } from "./db_connection.js";
import { authRouter } from "./Routes/auth.routes.js";
import errorHandler from "./Middlewares/errorHandler.middleware.js";
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
//import { convertToBase64 } from "./Middlewares/multer.middleware.js";
import cloudinary from "./Services/cloudainry.js";


config()
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();


app.use(express.json());
app.use(cookieParser())
const upload = multer({ dest: path.join(path.resolve(), 'uploads') }); // safer __dirname in ES6
const apiKey = process.env.OPENAI_API_KEY
  app.post(
    '/generate-fashion-image',
   upload.fields([{ name: 'person' }, { name: 'clothes' }]), // Multer middleware to upload files
    //convertToBase64, 
    async (req, res) => {
        
        try {
         
          const{prompt,person,clothes} = req.body
       
            
            const payload = {
                key: process.env.API_KEY,
               
                "prompt" :prompt,
                "negative_prompt": "Low quality, unrealistic, bad cloth, warped cloth",
                "init_image" :person,
                "cloth_image": clothes,
                "cloth_type": "upper_body",
                "guidance_scale": 7.5,
                "num_inference_steps": 21,
                "seed": null,
                "temp": "no",
                "webhook": null,
                "track_id": null
            }

            // Call the external API to generate the fashion image
            const response = await axios.post(
                'https://modelslab.com/api/v6/image_editing/fashion',
                JSON.stringify(payload, null, 2),
                {
                    headers: {
                        'Content-Type': 'application/json'
                    
                    }
                },
            );
             

          console.log(response.data)
            const imageUrl = response.data?.proxy_links?.[0];

            if (!imageUrl) {
                throw new Error('Image URL not found in API response');
            }
            // Helper function to wait for a few seconds
            const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
            try {
                await delay(50000); // انتظر 6 ثوانٍ قبل محاولة رفع الصورة
            } catch (error) {
                console.error('Error waiting for 50 seconds:', error);
            }

            const uploaded = await cloudinary.uploader.upload(imageUrl, {
                folder: 'fashion',
            });

            res.json({
                message: 'Fashion image generated and uploaded successfully.',
                image_url: uploaded.secure_url
            });

        } catch (error) {
            console.error(error.response?.data || error.message || error);
            res.status(500).json({ error: 'Failed to generate fashion image.' });
        }
    }
);
app.post('/chatbot', async (req, res) => {
    const {message} = req.body
    try {
        const response = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: "meta-llama/llama-3-8b-instruct", // أو أي موديل تاني من الموجودين
            messages: [
              { role: 'system', content: 'أنت مساعد ذكي.' },
              { role: 'user', content: message }
            ]
          },
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );
    
        res.json({reply: response.data.choices[0].message.content})    
      } catch (error) {
        console.error('❌ حصل خطأ:\n', error.response?.data || error.message);
      }
    });
    
  
  

app.use('/auth', authRouter)


app.use(errorHandler);

db_connection()

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
