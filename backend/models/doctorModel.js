import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, match: [/^0\d{9}$/], default: "" },
    image: { type: String, required: "" },
    speciality: { type: String, required: true },
    specializationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Specialization",
        required: true
    },
    degree: { type: String, required: true },
    experience: { type: String, required: true },
    about: { type: String, required: true },
    available: { type: Boolean, default: true },
    clinicRoom: { type: String, default: "" },
    fees: { type: Number, required: true, default: 200000 },
    availableTime: [
        {
            day: { type: String, enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] },
            sessions: [
                {
                    shift: { type: String, enum: ["morning", "afternoon", "evening"] },
                    start: String,
                    end: String,
                    duration: { type: Number, default: 45 },
                    maxPatients: { type: Number, default: 10 },
                },
            ],
        },
    ],
    address: { type: Object, required: true },
    date: { type: Number, required: true },
    slots_booked: { type: Map, of: [String], default: {} },
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    docId: { type: String },
    // available time required false khi mà demo thời gian , tất cả - slotTime slotDate 

}, {
    minimize: false,
    timestamps: true
})
doctorSchema.pre('save', function (next) {
    // Chỉ thực hiện khi tạo mới bác sĩ
    if (this.isNew) {
        this.docId = this._id.toString();
    }
    next();
});

const doctorModel = mongoose.model("Doctor", doctorSchema)

export default doctorModel;