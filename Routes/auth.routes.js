import { Router } from 'express'
import * as authController from '../Controllers/auth.controller.js'
import { authMiddleware } from '../Middlewares/auth.middleware.js'
import { upload } from '../Middlewares/multer.middleware.js'

const authRouter=Router()

authRouter.post('/register', upload.single('photo'), authController.register)
authRouter.post('/login',authController.login)
// authRouter.post('/logout',authController.logout)

authRouter.get('/profile',authMiddleware,authController.profile)

export {authRouter}