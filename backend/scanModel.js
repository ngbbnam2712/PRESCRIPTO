import 'dotenv/config'

const apiKey = process.env.GOOGLE_API_KEY;
const baseUrl = "https://generativelanguage.googleapis.com/v1beta";

// Hàm tạm dừng (Sleep) để tránh bị Rate Limit khi test hàng loạt
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function checkModelConnectivity(modelName) {
    const url = `${baseUrl}/${modelName}:generateContent?key=${apiKey}`;
    const payload = {
        contents: [{ parts: [{ text: "Hi" }] }],
        generationConfig: { maxOutputTokens: 10 } // Giới hạn token để test nhanh
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            return { status: "OK", code: 200, msg: "✅ WORKING" };
        } else {
            const errorData = await response.json();
            // Phân loại lỗi phổ biến
            if (response.status === 429) return { status: "FAIL", code: 429, msg: "❌ QUOTA (Hết lượt/Chưa cấp)" };
            if (response.status === 404) return { status: "FAIL", code: 404, msg: "❌ NOT FOUND (Không tìm thấy)" };
            if (response.status === 403) return { status: "FAIL", code: 403, msg: "❌ PERMISSION (Cần trả phí)" };

            return { status: "FAIL", code: response.status, msg: `❌ ERROR: ${errorData.error?.message?.substring(0, 30)}...` };
        }
    } catch (error) {
        return { status: "ERROR", code: 0, msg: "❌ NETWORK ERROR" };
    }
}

async function scanAllModels() {
    if (!apiKey) {
        console.error("LỖI: Thiếu GOOGLE_API_KEY trong .env");
        return;
    }

    console.log("1. Đang lấy danh sách model...");
    const listUrl = `${baseUrl}/models?key=${apiKey}`;

    try {
        const listResponse = await fetch(listUrl);
        const listData = await listResponse.json();

        // Lọc các model tạo text
        const textModels = listData.models.filter(m =>
            m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')
        );

        console.log(`2. Tìm thấy ${textModels.length} model hỗ trợ text. Bắt đầu test từng cái...\n`);
        console.log(`${"MODEL NAME".padEnd(45)} | STATUS`);
        console.log("-".repeat(80));

        const workingModels = [];

        for (const model of textModels) {
            // Test model
            const result = await checkModelConnectivity(model.name);

            // In kết quả ngay lập tức
            const displayMsg = result.status === "OK"
                ? `\x1b[32m${result.msg}\x1b[0m` // Màu xanh lá cho OK
                : `\x1b[31m${result.msg}\x1b[0m`; // Màu đỏ cho Lỗi

            console.log(`${model.name.replace('models/', '').padEnd(45)} | ${displayMsg}`);

            if (result.status === "OK") {
                workingModels.push(model.name.replace('models/', ''));
            }

            // Chờ 1 giây giữa các lần gọi để tránh spam API
            await delay(1000);
        }

        console.log("-".repeat(80));
        console.log("\nKẾT QUẢ TỔNG HỢP:");
        console.log(`Số lượng model hoạt động tốt: ${workingModels.length}`);
        if (workingModels.length > 0) {
            console.log("Danh sách khuyên dùng:");
            console.log(workingModels.join("\n"));
        }

    } catch (error) {
        console.error("LỖI CHƯƠNG TRÌNH:", error);
    }
}

scanAllModels();