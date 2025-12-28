import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema({
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    symptoms: { type: String, required: true },// trieu chung
    diagnosis: { type: String, required: true },//chuan doan
    note: { type: String },

    medicines: [
        {
            medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
            name: { type: String, required: true },
            quantity: { type: Number, required: true },
            unit: { type: String },
            dosage: { type: String, required: true }
        }
    ]
}, { timestamps: true });

const prescriptionModel = mongoose.model("Prescription", prescriptionSchema)

export default prescriptionModel;