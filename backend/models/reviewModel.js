import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        required: [true, 'Review must belong to an appointment'],
        unique: true
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: [true, 'Review must belong to a doctor']
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Review must belong a user']
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: [true, 'Rating must be between 1 and 5']
    },
    comment: {
        type: String,
        trim: true,
        required: [true, 'Comment cannot be empty']
    },

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

export default mongoose.model("Review", reviewSchema);