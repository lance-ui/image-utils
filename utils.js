const main = async (request) => {
    const imageUrl = request.url;
    const tool = request.tool;

    if (!imageUrl || !tool) {
        throw new Error("Missing required parameters: url or tool[removebg,enhance,upscale,restore,colorize,ocr]")
    }

    const apiEndpoints = {
        removebg: "https://api.remove.bg/v1.0/removebg",
        enhance: "https://api.deepai.org/api/torch-srgan",
        upscale: "https://api.deepai.org/api/waifu2x",
        restore: "https://api.deepai.org/api/image-editor",
        colorize: "https://api.deepai.org/api/colorizer",
        ocr: "https://api.ocr.space/parse/image"
    };

    const apiKey = {
        removebg: process.env.REMOVEBG_API_KEY || "",
        deepai: process.env.DEEPAI_API_KEY || "",
        ocr: process.env.OCR_API_KEY || ""
    };

    if (!apiEndpoints[tool]) {
        throw new Error("invalid tool specified st tool parameter try [ocr, colorizer,upscale,restore,enhance,removebg]")
    } else if (!apiKey.removebg || !apiKey.deepai || !apiKey.ocr) {
        throw new Error("Environment credentials not set: either REMOVEBG_API_KEY or DEEPAI_API_KEY or OCR_API_KEY");
    }

    try {
        let apiUrl = apiEndpoints[tool];
        let headers = {};
        let body = {};

        if (tool.toLowerCase() === "removebg") {
            headers["X-Api-Key"] = apiKey.removebg;
            body = new URLSearchParams({ image_url: imageUrl });
        } else if (tool.toLowerCase() === "ocr") {
            const param = {
                url: imageUrl,
                apikey: apiKey.ocr,
                language: "eng"
            };
            const response = await fetch(
                `${apiUrl}?${new URLSearchParams(param)}`,
                {
                    method: "GET"
                }
            );
            const apiResponse = await response.json();
            if (response.ok && !apiResponse.IsErroredOnProcessing) {
                const extracted_text = apiResponse.ParsedResults[0].ParsedText;
                return { text: extracted_text };
            } else {
                throw new Error(`${apiResponse.ErrorMessage}`)
            }
        } else {
            headers["api-key"] = apiKey.deepai;
            body = new URLSearchParams({ image: imageUrl });
        }

        const apiResponse = await fetch(apiUrl, {
            method: "POST",
            headers: headers,
            body: body
        });

        if (!apiResponse.ok) {
            throw new Error("Failed to process image");
        }

        const jsonResponse = await apiResponse.json();
        const resultUrl =
            jsonResponse.output_url || jsonResponse.data?.output_url;

        if (!resultUrl) {
            throw new Error("No output received");
        }

        const finalImageResponse = await fetch(resultUrl);
        return finalImageResponse
    } catch (error) {
        throw new Error(error.message)
    }
};
export default main;
