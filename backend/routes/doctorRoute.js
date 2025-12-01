import epxress from 'express';
import { doctorList, loginDoctor, appointmentsDoctor } from '../controllers/doctorController.js';
import authDoctor from '../middlewares/authDoctor.js'
const doctorRouter = epxress.Router()


doctorRouter.get('/list', doctorList)
doctorRouter.post('/login', loginDoctor)
doctorRouter.get('/appointments', authDoctor, appointmentsDoctor)


export default doctorRouter