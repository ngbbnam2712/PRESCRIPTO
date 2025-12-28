import mongoose from "mongoose";

const specializationSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true },
        code: { type: String, required: true, unique: true, uppercase: true },
        description: { type: String, default: "" },
        image: { type: String, default: "" },
        floor: { type: Number, required: true },
        defaultFee: { type: Number, required: true, min: 0 },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const Specialization = mongoose.model("Specialization", specializationSchema);
export default Specialization