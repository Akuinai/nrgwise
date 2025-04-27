import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs/promises";
import path from "path";
import pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";
import { AzureChatOpenAI, AzureOpenAIEmbeddings } from "@langchain/openai";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { Document } from "@langchain/core/documents";

dotenv.config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Client folder serveren
app.use(express.static(path.join(process.cwd(), "client")));

app.get("/", (req, res) => {
    res.sendFile(path.join(process.cwd(), "client", "index.html"));
});

const upload = multer({ dest: "uploads/" });
const DB_DIR = path.join(process.cwd(), "faiss_store");

// Azure OpenAI setup
const embeddings = new AzureOpenAIEmbeddings({
    azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
    azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
    azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME,
    azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME,
});

// Haal tekst uit een PDF-bestand
async function extractTextFromPDF(filePath) {
    const data = await fs.readFile(filePath);
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(item => item.str).join(" ") + "\n";
    }
    return text;
}

// PDF upload Route
app.post("/upload", upload.single("file"), async (req, res) => {
    try {
        const filePath = req.file.path;
        const text = await extractTextFromPDF(filePath);
        const docs = [new Document({ pageContent: text })];

        let vectorStore;
        try {
            vectorStore = await FaissStore.load(DB_DIR, embeddings);
            console.log("✅ Bestaande vectorstore geladen.");
        } catch {
            vectorStore = await FaissStore.fromDocuments([], embeddings);
            console.log("Nieuwe vectorstore aangemaakt.");
        }

        await vectorStore.addDocuments(docs);
        await fs.rm(DB_DIR, { recursive: true, force: true });
        await vectorStore.save(DB_DIR);

        console.log("Document opgeslagen.");
        res.json({ message: "PDF succesvol verwerkt en opgeslagen." });
    } catch (error) {
        console.error("Fout bij verwerken PDF:", error);
        res.status(500).json({ message: "Fout bij uploaden." });
    }
});

// Vraag stellen
app.post("/ask", async (req, res) => {
    const vraag = req.body.vraag;
    if (!vraag) {
        res.status(400).json({ message: "Geen vraag ontvangen." });
        return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
        const vectorStore = await FaissStore.load(DB_DIR, embeddings);
        const relevantDocs = await vectorStore.similaritySearch(vraag, 3);
        const context = relevantDocs.map(doc => doc.pageContent).join("\n");

        const model = new AzureChatOpenAI({
            temperature: 0,
            streaming: true,
            azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
            azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
            azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME,
            azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME,
        });

        const stream = await model.stream(`Gebruik deze context:\n${context}\nVraag: ${vraag}`);

        for await (const chunk of stream) {
            if (chunk?.content) {
                res.write(`data: ${chunk.content}\n\n`);
            }
        }

        res.write(`data: [DONE]\n\n`);
        res.end();
    } catch (error) {
        console.error("Fout bij beantwoorden vraag:", error);
        res.write(`data: [ERROR]\n\n`);
        res.end();
    }
});

// Server starten
app.listen(port, () => console.log(`Server draait op http://localhost:${port}`));