import 'dotenv/config'
import { GoogleGenerativeAI } from "@google/generative-ai";


const apiKey = process.env.GOOGLE_API_KEY;
const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

async function listAvailableModels() {
    // 1. Kiểm tra API Key
    if (!apiKey) {
        console.error("LỖI: Không tìm thấy GOOGLE_API_KEY trong file .env");
        return;
    }

    try {
        console.log(`Key đang sử dụng: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`);
        console.log("Đang kết nối đến Google API để lấy danh sách model...\n");

        // 2. Gọi REST API
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();

        // 3. Hiển thị tiêu đề bảng
        console.log(`${"MODEL NAME".padEnd(40)} | DISPLAY NAME`);
        console.log("-".repeat(75));

        let count = 0;

        // 4. Lọc và hiển thị model
        if (data.models) {
            data.models.forEach(model => {

                const modelName = model.name.replace('models/', '');
                console.log(`${modelName.padEnd(40)} | ${model.displayName}`);
                count++;

            });
        }

        console.log("-".repeat(75));
        console.log(`Tổng cộng: ${count} models có thể truy cập.`);

    } catch (error) {
        console.error("LỖI KẾT NỐI:", error.message);
    }
}

listAvailableModels();