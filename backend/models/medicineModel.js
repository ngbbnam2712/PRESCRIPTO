import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String }, // Hoạt chất, công dụng
    stock: { type: Number, default: 100 }, // Tồn kho (Mặc định 100 để test)
    unit: { type: String, default: 'Viên' }, // Đơn vị: Viên, Vỉ, Chai
    specializationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Specialization'
    },
    specializationName: { type: String },
    isGeneral: { type: Boolean, default: false },
    price: { type: Number, default: 0 },
})

const medicineModel = mongoose.model("Medicine", medicineSchema);
export default medicineModel;