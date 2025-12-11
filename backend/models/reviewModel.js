import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    docId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true }, // Quan trọng: Gắn liền với cuộc hẹn cụ thể
    rating: { type: Number, required: true, min: 1, max: 5 }, // 1 đến 5 sao
    comment: { type: String, required: true },
    isRecommend: { type: Boolean, default: true } // Có khuyên dùng không (Optional)
}, { timestamps: true });

export default mongoose.model("Review", reviewSchema);