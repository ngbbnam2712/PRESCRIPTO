import epxress from 'express';
import { doctorList } from '../controllers/doctorController.js';

const doctorRouter = epxress.Router()


doctorRouter.get('/list', doctorList)


export default doctorRouter