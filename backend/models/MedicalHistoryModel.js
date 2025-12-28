import mongoose from "mongoose";
const medicalHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },

    allergies: { type: String, default: '' },
    chronicConditions: { type: String, default: '' },
    currentMedications: { type: String, default: '' },
    surgeries: { type: String, default: '' },
    familyHistory: { type: String, default: '' },

    attachments: [
        {
            url: { type: String, required: true },
            type: { type: String, enum: ['prescription', 'test_result', 'other'], default: 'prescription' },
            uploadedAt: { type: Date, default: Date.now },
            note: { type: String, default: '' }
        }
    ]
}, { timestamps: true });

const MedicalHistory = mongoose.model('MedicalHistory', medicalHistorySchema);

export default MedicalHistoryModel;