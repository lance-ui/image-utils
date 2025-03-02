import { main } from "./utils.js";
import express from "express";

const app = express();

app.use(express.json());

const port = process.env.PORT || 5000;

app.get("/images", async (res, rej) => {
    const { url, tool } = req.query;
    if (!tool) return res.status(400).json({ error: "missing tool parameter" });
    else if (!url)
        return res.status(400).json({ error: "missing url parameter" });
    else
        try {
            main({ url, tool });
        } catch (e) {
            console.log(e)
            return res.status(500).json({ error: "internal server error" });
        }
});

app.listen(port, () => {
    console.log(`server is running on port: ${port}`);
});
