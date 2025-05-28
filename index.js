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
    
    app.use(express.json()); // Middleware to parse JSON bodies

    // POST endpoint for text-to-image generation
    
    
      app.post(
  '/generate-img2img',
  upload.single('image'), // form-data: key = image
  async (req, res) => {
    try {
      const prompt = req.body.prompt;
      const imageFile = req.file;

      if (!imageFile || !prompt) {
        return res.status(400).json({ error: 'Missing required fields.' });
      }

      // Step 1: Create path with extension
      const imageExt = imageFile.mimetype.split('/')[1];
      const imagePath = imageFile.path + '.' + imageExt;

      // Step 2: Rename file to include extension
      fs.renameSync(imageFile.path, imagePath);

      // Step 3: Upload to Cloudinary
      const uploadedImage = await cloudinary.uploader.upload(imagePath, {
        folder: 'img2img'
      });

      const imageUrl = uploadedImage.secure_url;

      // Step 4: Build payload
      const payload = {
        key: process.env.API_KEY,
        prompt: prompt,
        negative_prompt: "bad quality, low resolution, jpeg artifacts",
        init_image: imageUrl,
        width: "512",
        height: "512",
        samples: "1",
        strength: 0.7,
        temp: false,
        safety_checker: req.body.safety_checker === "true",
        seed: null,
        webhook: null,
        track_id: null
      };

      // Step 5: Call Modelslab API
      const response = await axios.post(
        'https://modelslab.com/api/v6/realtime/img2img',
        payload,
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const imageResult = response.data?.output?.[0];

      console.log("🧾 Full API response:", response.data);

      if (!imageResult) {
        throw new Error('Image not returned from API');
      }

      // Step 6: Upload result to Cloudinary (optional)
      await delay(50000); // wait before accessing the link
      const finalUpload = await cloudinary.uploader.upload(imageResult, {
        folder: 'img2img/results'
      });

      // Step 7: Send response
      res.json({
        message: 'Image-to-image generation completed successfully.',
        image_url: finalUpload.secure_url
      });

    } catch (error) {
      console.error(error.response?.data || error.message || error);
      res.status(500).json({ error: 'Failed to process img2img request.' });
    }
  }
);

app.post(
    '/generate-avatar',
    upload.fields([{ name: 'face' }]),
    async (req, res) => {
      try {
        const prompt = req.body.prompt;
        const faceFile = req.files.face?.[0];
  
        if (!faceFile || !prompt) {
          return res.status(400).json({ error: 'Missing face image or prompt.' });
        }
  
        // Step 1: Construct correct path
        const facePath = faceFile.path + '.' + faceFile.mimetype.split('/')[1];
        fs.renameSync(faceFile.path, facePath);
  
        // Step 2: Upload to Cloudinary
        const uploadedFace = await cloudinary.uploader.upload(facePath, {
          folder: 'avatars',
        });
  
        const faceUrl = uploadedFace.secure_url;
  
        // Step 3: Prepare payload
        const payload = {
          key: process.env.API_KEY,
          prompt: prompt,
          negative_prompt:
            "anime, cartoon, drawing, big nose, long nose, fat, ugly, big lips, big mouth, face proportion mismatch, unrealistic, monochrome, lowres, bad anatomy, worst quality, low quality, blurry",
          face_image: faceUrl,
          width: "512",
          height: "512",
          samples: "1",
          num_inference_steps: "21",
          safety_checker: false,
          base64: false,
          seed: null,
          guidance_scale: 7.5,
          webhook: null,
          track_id: null
        };
  
        // Step 4: Send to Modelslab
        const response = await axios.post(
          'https://modelslab.com/api/v6/image_editing/face_gen',
          payload,
          {
            headers: { 'Content-Type': 'application/json' }
          }
        );
  
        // Step 5: Handle processing

        if (response.data.status === "processing") {
          const fetchUrl = response.data.fetch_result;
  
          console.log("⏳ Image is processing... waiting 50s then fetching:", fetchUrl);
          await delay(10000); // انتظر 50 ثانية
  
          const fetchResponse = await axios.post(fetchUrl, {
            key: process.env.API_KEY
          });
  
          const finalImageUrl = fetchResponse.data?.output?.[0];
          if (!finalImageUrl) {
            throw new Error('Image not returned after processing');
          }
  
          const uploaded = await cloudinary.uploader.upload(finalImageUrl, {
            folder: 'avatars/final',
          });
  
          return res.json({
            message: '✅ Avatar generated and uploaded successfully.',
            image_url: uploaded.secure_url
          });
        }
  
        // Step 6: Immediate result (if not processing)
        const imageUrl = response.data?.output?.[0];
        if (!imageUrl) {
          console.log("📄 Full response:", response.data);
          throw new Error('Image URL not found in API response');
        }
  
        const uploaded = await cloudinary.uploader.upload(imageUrl, {
          folder: 'avatars/final',
        });
  
        res.json({
          message: '✅ Avatar generated and uploaded successfully.',
          image_url: uploaded.secure_url
        });
  
      } catch (error) {
        console.error("❌ Error:", error.response?.data || error.message || error);
        res.status(500).json({ error: 'Failed to generate avatar.' });
      }
    }
  );

  app.post('/generate-text-image', upload.none(), async (req, res) => {
    try {
      const prompt = req.body.prompt;
  
      if (!prompt) {
        return res.status(400).json({ error: 'Missing prompt.' });
      }
  
      const payload = {
        key: process.env.API_KEY,
        prompt: prompt,
        negative_prompt: 'bad quality',
        width: '512',
        height: '512',
        safety_checker: false,
        seed: null,
        samples: 1,
        base64: false,
        webhook: null,
        track_id: null
      };
  
      // Step 1: Send request to text2img endpoint
      const response = await axios.post(
        'https://modelslab.com/api/v6/realtime/text2img',
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );
  
      // Step 2: Handle 'processing' status
      if (response.data.status === 'processing') {
        const fetchUrl = response.data.fetch_result;
        console.log('⏳ Image is processing... waiting 50s then fetching:', fetchUrl);
        await delay(50000); // wait 50 seconds
  
        const fetchResponse = await axios.post(fetchUrl, {
          key: process.env.API_KEY
        });
  
        const finalImageUrl = fetchResponse.data?.output?.[0];
        if (!finalImageUrl) {
          console.log('📥 FETCH RESPONSE:', fetchResponse.data);
          throw new Error('Image not returned after processing');
        }
  
        const uploaded = await cloudinary.uploader.upload(finalImageUrl, {
          folder: 'text2img/results'
        });
  
        return res.json({
          message: '✅ Text-to-image generation completed successfully.',
          image_url: uploaded.secure_url
        });
      }
  
      // Step 3: Immediate result (if not processing)
      const imageUrl = response.data?.output?.[0];
      if (!imageUrl) {
        console.log('📥 FULL RESPONSE:', response.data);
        throw new Error('Image URL not found in API response');
      }
  
      const uploaded = await cloudinary.uploader.upload(imageUrl, {
        folder: 'text2img/results'
      });
  
      res.json({
        message: '✅ Text-to-image completed successfully.',
        image_url: uploaded.secure_url
      });
  
    } catch (error) {
      console.error('❌ Error:', error.response?.data || error.message || error);
      res.status(500).json({ error: 'Failed to generate image from text.' });
    }
  });
    


app.use('/auth', authRouter)


app.use(errorHandler);

db_connection()

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
