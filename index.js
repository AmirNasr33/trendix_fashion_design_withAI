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
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
app.post(
    '/generate-fashion-image',
    upload.fields([{ name: 'person' }, { name: 'clothes' }]),
    async (req, res) => {
      try {
        const prompt = req.body.prompt;
  
        // Step 1: Get files
        const personFile = req.files.person?.[0];
        const clothesFile = req.files.clothes?.[0];
  
        if (!personFile || !clothesFile || !prompt) {
          return res.status(400).json({ error: 'Missing required fields.' });
        }
  
        // Step 2: Construct correct paths with extensions
        const personPath = personFile.path + '.' + personFile.mimetype.split('/')[1];
        const clothesPath = clothesFile.path + '.' + clothesFile.mimetype.split('/')[1];
  
        // Rename files to include extension
        fs.renameSync(personFile.path, personPath);
        fs.renameSync(clothesFile.path, clothesPath);
  
        // Step 3: Upload to Cloudinary
        const [uploadedPerson, uploadedClothes] = await Promise.all([
          cloudinary.uploader.upload(personPath, { folder: 'fashion' }),
          cloudinary.uploader.upload(clothesPath, { folder: 'fashion' })
        ]);
  
        const personUrl = uploadedPerson.secure_url;
        const clothesUrl = uploadedClothes.secure_url;
  
        // Step 4: Prepare Payload
        const payload = {
          key: process.env.API_KEY,
          prompt: prompt,
          negative_prompt: "Low quality, unrealistic, bad cloth, warped cloth",
          init_image: personUrl,
          cloth_image: clothesUrl,
          cloth_type: "upper_body",
          guidance_scale: 7.5,
          num_inference_steps: 21,
          seed: null,
          temp: "no",
          webhook: null,
          track_id: null
        };
  
        // Step 5: Send to external API
        const response = await axios.post(
          'https://modelslab.com/api/v6/image_editing/fashion',
          payload,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
  
        const imageUrl = response.data?.proxy_links?.[0];
  
        if (!imageUrl) {
          throw new Error('Image URL not found in API response');
        }
        await delay(30000); // 10 ثواني
        // Optional: Upload generated image to Cloudinary
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
