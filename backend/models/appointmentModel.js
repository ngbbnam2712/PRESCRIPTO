import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor",
        required: true,
    },
    docId: { type: String },
    specializationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Specialization",
        required: true
    },
    slotDate: { type: String, required: true },
    slotTime: { type: String, required: true },
    userData: { type: Object, required: true },
    docData: { type: Object, required: true },
    clinicInfo: {
        room: { type: String },
        floor: { type: Number },
        fee: { type: Number }
    },
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
    paymentInfo: {
        transactionId: { type: String, default: null },
        status: {
            type: String,
            enum: ["unpaid", "paid", "refunded"],
            default: "unpaid"
        },
        paidAt: { type: Date }
    },

    isRated: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
    review: { type: String, default: "" },
    cancelReason: { type: String, default: "" },
    statusHistory: [
        {
            status: { type: String },
            changedAt: { type: Date, default: Date.now },
        },
    ],
    //isRefund: { type: Boolean, default: false },
    // diagnosis: { type: String, default: '' }, // Chẩn đoán bệnh
    // symptoms: { type: String, default: '' },
    // prescription: [ // Mảng chi tiết đơn thuốc
    //     {
    //         medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'medicine' },
    //         name: { type: String, required: true }, // Lưu cứng tên thuốc (snapshot)
    //         dosage: { type: String, required: true }, // Liều dùng (Sáng 1, Chiều 1)
    //         quantity: { type: Number, required: true }, // Số lượng
    //         price: { type: Number } // Lưu giá tại thời điểm kê đơn
    //     }
    // ], // tao prescriptomodel
    hasPrescription: { type: Boolean, default: false },
    appointmentType: { type: String, default: 'Clinic' },
    // docName,patientName, specializationName

}, {
    timestamps: true
});
appointmentSchema.pre('save', function (next) {

    if (this.doctorId) {
        this.docId = this.doctorId;
    }
    next();
});
const appointmentModel = mongoose.model('Appointment', appointmentSchema);

export default appointmentModel