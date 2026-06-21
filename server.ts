import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  app.post("/api/generate-story", async (req, res) => {
    try {
      const { setting } = req.body;
      const prompt = `You are an AI storyteller creating a voice-based offline "Choose Your Own Adventure" game.
      Create a detailed, immersive branching story tree for the setting: "${setting}".
      The story must be deep enough to last about 15-20 minutes of reading aloud (generate around 12-16 total nodes in the tree).
      The root node MUST have id "start".
      Ensure valid 'nextNodeId' references for all choices.
      Make the narrative text highly atmospheric and engaging (about 50-100 words per node).
      For leaf nodes (endings), ensure 'isEnding' is true.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              nodes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    text: { type: Type.STRING, description: "Detailed narrative text." },
                    isEnding: { type: Type.BOOLEAN },
                    choices: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          text: { type: Type.STRING, description: "The choice summary presented to the player." },
                          keywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "One-word keywords players might say to select this option." },
                          nextNodeId: { type: Type.STRING }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      const responseText = response.text();
      res.json(JSON.parse(responseText || "{}"));
    } catch (error) {
      console.error("Story generation failed:", error);
      res.status(500).json({ error: "Failed to generate story tree." });
    }
  });

  // API Route for health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
