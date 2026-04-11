const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const multer = require('multer');
const pdf = require('pdf-parse');
const officeParser = require('officeparser');
// const cheerio = require("cheerio");
const csv = require("csv-parser");
const fs = require('fs');
const { MongoClient } = require('mongodb');
const mongoDBConfig = JSON.parse(fs.readFileSync('./configs/mongoDB.json'));// Import the MongoDB connection configuration
const { mongoUrl, dbName, optionsCollectionName, datasetCollection, userDatasetsCollection, jobsCollection, preProcessResultsCollection, benchmarksCollection, errorlogcollection, projectsCollection, chatHistoryCollection } = mongoDBConfig;

// Configure multer for file uploads (memory storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const toMarkdown = (nodes) => {
    return nodes.map(node => {
        if (node.type === 'heading') return `${'#'.repeat(node.metadata?.level || 1)} ${node.text}`;
        if (node.type === 'list') return `- ${node.text}`;
        if (node.type === 'table') return "[Table Data]"; // expand children for actual table
        return node.text;
    }).join('\n\n');
};

async function sync_chat(userId, role, msg) {
    try {
        if (!msg || msg.length === 0) {
            console.error('No message provided');
            return;
        }
        const client = new MongoClient(mongoUrl);
        await client.connect();
        const db = client.db(dbName);

        // Reference the specific collection
        const collection = db.collection('chat_history');

        // Format the document (Handling our own defaults since Mongoose is gone)
        const newChatSync = {
            userId: userId || 'anonymous',
            // Ensure messages have timestamps if the frontend didn't provide them
            role: role,
            messages: msg,
            timestamp: new Date() // Manual timestamp for when the sync occurred
        };

        // Insert into the database
        const result = await collection.insertOne(newChatSync);
        console.log('Chat history successfully saved to DB!');
    } catch (error) {
        console.error('Error saving chat:', error);
    }
}

// Initialize OpenAI client
// Note: It's best practice to use environment variables for API keys
// For now, we'll try to read from process.env, but placeholders are here if needed.
// Users should add OPENAI_API_KEY and GEMINI_API_KEY to their .env file.

router.post('/', upload.single('file'), async (req, res) => {
    let { userId, message, model } = req.body;
    const file = req.file;

    console.log(`[Chat API] User ID: ${userId}`);
    console.log(`[Chat API] Received request for model: ${model}`);

    // Log key presence (checking length to be safe against empty strings)
    console.log(`[Chat API] OpenAI Key present: ${process.env.OPENAI_API_KEY ? 'Yes' : 'No'}`);
    console.log(`[Chat API] Gemini Key present: ${process.env.GEMINI_API_KEY ? 'Yes' : 'No'}`);
    // console.log("message: ", message);
    // console.log("file: ", file ? file.originalname : 'No file attached');

    if (!message && !file) {
        return res.status(400).json({ error: 'Message or file is required' });
    }

    // Default message if only file is provided
    if (!message) {
        message = "Please analyze the attached file.";
    }

    try {
        let fileContext = '';
        let imagePart = null;

        if (file) {
            console.log(`[Chat API] Processing file: ${file.originalname} (${file.mimetype})`);

            if (file.mimetype === 'application/pdf') {
                try {
                    const data = await pdf(file.buffer);
                    fileContext = `\n\n[Attached PDF Content: ${file.originalname}]\n${data.text}\n[End of PDF]\n`;
                } catch (e) {
                    console.error("Error parsing PDF:", e);
                    fileContext = `\n\n[Error reading PDF file: ${file.originalname}]`;
                }
            } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.mimetype === 'application/msword' || file.originalname.endsWith('.docx') || file.originalname.endsWith('.pptx') || file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.odt') || file.originalname.endsWith('.odp') || file.originalname.endsWith('.ods') || file.originalname.endsWith('.rtf')) {
                try {
                    const ast = await officeParser.parseOffice(file.buffer, { ocr: true });
                    fileContext = `\n\n[Attached Office File Content: ${file.originalname}]\n${toMarkdown(ast.content)}\n[End of Office File]\n`;
                    console.log("Metadata:", ast.metadata);
                } catch (error) {
                    console.error(error);
                    fileContext = `\n\n[Error reading Office file: ${file.originalname}]`;
                }
            } else if (file.mimetype.startsWith('text/') || file.mimetype === 'application/json' || file.mimetype === 'text/csv' || file.originalname.endsWith('.js') || file.originalname.endsWith('.py') || file.originalname.endsWith('.md')) {
                // Inside your CSV handling block:
                if (file.originalname.endsWith('.csv')) {
                    const jsonCsv = [];
                    const stream = fs.createReadStream(file.buffer) // Use stream if passing file path, but here you have buffer
                        .pipe(csv());

                    // Better approach for Buffer with csv-parser
                    const results = [];
                    // You'd need to convert buffer to stream or use a different parser logic
                    // But keeping your current logic, just slice the array:

                    const fullJson = await new Promise((resolve) => {
                        const rows = [];
                        const bufferStream = new require('stream').PassThrough();
                        bufferStream.end(file.buffer);

                        bufferStream
                            .pipe(csv())
                            .on('data', (data) => rows.push(data))
                            .on('end', () => resolve(rows));
                    });

                    // OPTIMIZATION: Truncate if too large
                    const MAX_ROWS = 50;
                    const truncated = fullJson.slice(0, MAX_ROWS);
                    const isTruncated = fullJson.length > MAX_ROWS;

                    fileContext = `\n\n[Attached CSV Content: ${file.originalname}]\n`;
                    fileContext += `Total Rows: ${fullJson.length} (Showing first ${MAX_ROWS})\n`;
                    fileContext += JSON.stringify(truncated, null, 2);
                    fileContext += `\n[End of CSV Preview]${isTruncated ? '\n(Note: Data truncated for brevity)' : ''}\n`;
                } else {
                    const text = file.buffer.toString('utf8');
                    fileContext = `\n\n[Attached File Content: ${file.originalname}]\n${text}\n[End of File]\n`;
                }
                // const text = file.buffer.toString('utf8');
                // fileContext = `\n\n[Attached File Content: ${file.originalname}]\n${text}\n[End of File]\n`;
            } else if (file.mimetype.startsWith('image/')) {
                // For images, we process them differently based on the model
                const base64Image = file.buffer.toString('base64');
                imagePart = {
                    mimeType: file.mimetype,
                    data: base64Image
                };
            } else {
                fileContext = `\n\n[Attached File: ${file.originalname} (Unsupported type: ${file.mimetype})]`;
            }
        }

        let reply = '';

        if (model === 'gpt') {
            const openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            });

            const messages = [
                {
                    role: "system",
                    content: "You are an expert bioinformatician specializing in single-cell RNA sequencing (scRNA-seq)."
                }
            ];

            if (imagePart) {
                messages.push({
                    role: "user",
                    content: [
                        { type: "text", text: message },
                        {
                            type: "image_url",
                            image_url: {
                                "url": `data:${imagePart.mimeType};base64,${imagePart.data}`
                            }
                        }
                    ]
                });
            } else {
                messages.push({ role: "user", content: message + fileContext });
            }

            const completion = await openai.chat.completions.create({
                messages: messages,
                model: "gpt-4o", // or gpt-4
            });
            // console.log("Reply:", completion.choices[0].message.content);
            reply = completion.choices[0].message.content;
            await sync_chat(userId, 'user', messages);
            await sync_chat(userId, 'ChatGPT', reply);
        } else if (model === 'gemini') {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            // Use gemini-1.5-flash-001 for specific version compatibility
            console.log("Using Gemini Model: gemini-flash-latest");
            const geminiModel = genAI.getGenerativeModel({
                model: "gemini-flash-latest",
                systemInstruction: "You are an expert bioinformatician specializing in single-cell RNA sequencing (scRNA-seq)."
            });

            let prompt = message + fileContext;
            let result;

            if (imagePart) {
                // Gemini format for inline data
                const image = {
                    inlineData: {
                        data: imagePart.data,
                        mimeType: imagePart.mimeType,
                    },
                };
                result = await geminiModel.generateContent([prompt, image]);
            } else {
                result = await geminiModel.generateContent(prompt);
            }

            const response = await result.response;
            reply = response.text();

            await sync_chat(userId, 'user', prompt);
            await sync_chat(userId, 'Gemini', reply);

        } else {
            return res.status(400).json({ error: 'Invalid model selection' });
        }

        res.json({ reply });

    } catch (error) {
        console.error('Chat API Error:', error);
        if (error.response) {
            console.error('Chat API Error Response:', error.response.data);
        }

        const status = error.status || 500;
        // Return more specific error message if possible
        const errorMessage = error.message || 'Failed to fetch response from AI provider';
        res.status(status).json({ error: 'AI Provider Error', details: errorMessage });
    }
});

module.exports = router;
