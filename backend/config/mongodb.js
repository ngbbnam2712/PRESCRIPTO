import monsgoose, { mongo } from 'mongoose';


const connectDB = async () => {

    monsgoose.connection.on('connected', () => console.log('Database connected'))

    await monsgoose.connect(`${process.env.MONGODB_URI}/prescripto`)
}
export default connectDB