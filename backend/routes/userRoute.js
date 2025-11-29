import express from 'express';
import { registerUser, loginUser, getProfile, updateProfile, bookAppointment, listAppointments, cancelAppointment, createPayPalPayment, executePayPalPayment } from '../controllers/userController.js';
import authUser from '../middlewares/authUser.js';
import upload from '../middlewares/multer.js';

const userRouter = express.Router()


userRouter.post('/register', registerUser)
userRouter.post('/login', loginUser)

userRouter.get('/get-profile', authUser, getProfile)

userRouter.post('/update-profile', upload.single('image'), authUser, updateProfile)
userRouter.post('/book-appointment', authUser, bookAppointment)
userRouter.get('/appointments', authUser, listAppointments)
userRouter.post('/cancel-appointment', authUser, cancelAppointment)


// --- PAYPAL ROUTES ---
userRouter.post('/payment-paypal', authUser, createPayPalPayment)
userRouter.get('/paypal-return', executePayPalPayment)
userRouter.get('/paypal-cancel', (req, res) => res.send('Cancelled')) // Simple cancel handler

export default userRouter  