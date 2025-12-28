import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor",
    },

    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointment",
    },

    message: {
        type: String,
        required: true,
        trim: true,
    },

    type: {
        type: String,
        enum: [
            "appointment",
            "payment",
            "system",
            "reminder"
        ],
        default: "system",
    },

    isRead: {
        type: Boolean,
        default: false,
    },

    sentAt: {
        type: Date,
        default: Date.now,
    },

    metadata: {
        type: Object,
        default: {},
    },
},
    { timestamps: true }
);

const notificationModel = mongoose.model("Notification", notificationSchema);
export default notificationModel;