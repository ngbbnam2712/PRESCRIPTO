import epxress from 'express';
import { doctorList, loginDoctor } from '../controllers/doctorController.js';

const doctorRouter = epxress.Router()


doctorRouter.get('/list', doctorList)
doctorRouter.post('/login', loginDoctor)

export default doctorRouter