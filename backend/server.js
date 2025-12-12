import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
import adminRouter from './routes/adminRoute.js'
import doctorRouter from './routes/doctorRoute.js'
import userRouter from './routes/userRoute.js'
import cron from 'node-cron'
import { checkExpiredAppointments } from './controllers/userController.js';

//app config
const app = express()
const port = process.env.PORT || 4000
connectDB()
connectCloudinary()



//middlewares
app.use(express.json())
app.use(cors())



//api endpoint
app.use('/api/admin', adminRouter)
app.use('/api/doctor', doctorRouter)
app.use('/api/user', userRouter)




//localhost:4000/api/admin/add-doctor
app.get('/', (req, res) => {
    res.send('API WORKING')
})


cron.schedule('*/5 * * * *', () => {
    // Gọi hàm logic bên controller
    checkExpiredAppointments();
});


app.listen(port, () => {
    console.log("server running on port " + port)
})