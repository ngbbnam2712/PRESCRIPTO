import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    docId: { type: String, required: true },
    slotDate: { type: String, required: true },
    slotTime: { type: String, required: true },
    userData: { type: Object, required: true },
    docData: { type: Object, required: true },
    amount: { type: Number, required: true },
    date: { type: Number, required: true },
    cancelled: { type: Boolean, default: false },
    payment: { type: Boolean, default: false },

    isCompleted: { type: Boolean, default: false },
    status: {
        type: String,
        required: true,
        default: 'Pending'
    },
    isReviewed: { type: Boolean, default: false },
    isRefund: { type: Boolean, default: false },
    diagnosis: { type: String, default: '' }, // Chẩn đoán bệnh
    symptoms: { type: String, default: '' },
    prescription: [ // Mảng chi tiết đơn thuốc
        {
            medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'medicine' },
            name: { type: String, required: true }, // Lưu cứng tên thuốc (snapshot)
            dosage: { type: String, required: true }, // Liều dùng (Sáng 1, Chiều 1)
            quantity: { type: Number, required: true }, // Số lượng
            price: { type: Number } // Lưu giá tại thời điểm kê đơn
        }
    ],
    isPrescribed: { type: Boolean, default: false },
    appointmentType: { type: String, default: 'Clinic' }
}, {
    timestamps: true
});

const appointmentModel = mongoose.models.appointment || mongoose.model('appointment', appointmentSchema);

export default appointmentModel