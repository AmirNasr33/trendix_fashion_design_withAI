import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Set up multer storage options
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(path.resolve(), 'uploads')); // Save files to 'uploads' folder
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`); // Give unique names to files
    }
});

// Initialize multer upload with storage settings
const upload = multer({ storage });

// Middleware to handle image file uploads and convert to Base64
// const convertToBase64 = async (req, res, next) => {
//     try {
//         // Convert person image to Base64
//         const personImagePath = req.files?.person ? req.files['person'][0].path : null;
//         const clothesImagePath = req.files?.clothes ? req.files['clothes'][0].path : null;

//         if (personImagePath && clothesImagePath) {
//             // Read the image files and convert them to base64
//             const personBase64 = (await fs.promises.readFile(personImagePath)).toString('base64');
//             const clothesBase64 = (await fs.promises.readFile(clothesImagePath)).toString('base64');

//             // Prepend the data URI scheme (make sure it's the correct MIME type for the image)
//             const personBase64Formatted = `data:image/png;base64,${personBase64}`;
//             const clothesBase64Formatted = `data:image/png;base64,${clothesBase64}`;

//             // Attach base64 images to the request body
//             req.body.personBase64 = personBase64Formatted;
//             req.body.clothesBase64 = clothesBase64Formatted;

//             // Optionally, clean up temp files
//             await fs.promises.unlink(personImagePath);
//             await fs.promises.unlink(clothesImagePath);
//         }

//         next(); // Proceed to the next middleware or route handler
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Failed to process images.' });
//     }
// };
export { upload };
