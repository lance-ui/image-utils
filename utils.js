export default {
    async main(request) {
        const imageUrl = request.url;
        const tool = request.tool;

        if (!imageUrl || !tool) {
            return new Response(
                "Missing required parameters: url or tool[removebg,enhance,upscale,restore,colorize,ocr]",
                { status: 400 }
            );
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
            return new Response("Invalid tool specified", { status: 400 });
        } else if (!apiKey.removebg || !apiKey.deepai) {
            return new Response(
                "env credetionials not set either REMOVEBG_API_KEY or DEEPAI_API_KEY",
                { status: 500 }
            );
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
                    apikey: apikey.ocr,
                    language: "eng"
                };
                try {
                    const response = await fetch(apiUrl, {
                        method: "GET",
                        params: param
                    });
                    if (!apiResponse.ok) {
                        throw new Error("Failed to process image");
                    }
                    if (response.IsErroredOnProcessing) {
                        return new Response(`${response.ErrorMessage}`, {
                            status: 500
                        });
                    } else {
                        const extracted_text =
                            response.ParsedResults[0].ParsedText;
                        return { "text": extracted_text };
                    }
                } catch (e) {
                    console.log(e);
                    return new Response(
                        "an Error occurred while processing your request"
                    );
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
                return throw new Error("No output received");
            }

            const finalImageResponse = await fetch(resultUrl);
           /* return new Response(finalImageResponse.body, {
                headers: {
                    "Content-Type":
                        finalImageResponse.headers.get("Content-Type")
                }
            });*/
            console.log(finalImageResponse)
        } catch (error) {
            return new Response(`Error processing request: ${error.message}`, {
                status: 500
            });
        }
    }
};
