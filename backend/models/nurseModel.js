import mongoose from "mongoose";

const nurseSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    image: { type: String, required: true },

    // --- KHÁC BIỆT QUAN TRỌNG ---
    // Mảng các kỹ năng/dịch vụ (Ví dụ: ["Flu", "Basic Checkup", "Vaccination"])
    speciality: { type: [String], required: true },
    // -----------------------------

    degree: { type: String, required: true },
    experience: { type: String, required: true },
    about: { type: String, required: true },
    available: { type: Boolean, default: true },
    fees: { type: Number, required: true }, // Phí thường rẻ hơn Doctor

    address: { type: Object, required: true },
    date: { type: Number, required: true },
    slots_booked: { type: Object, default: {} }
}, { minimize: false })

const nurseModel = mongoose.models.nurse || mongoose.model('nurse', nurseSchema);

export default nurseModel;