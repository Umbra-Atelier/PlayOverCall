import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import path from "path";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  const server = createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    if (request.url?.startsWith("/live")) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
  });

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  wss.on("connection", (clientWs) => {
    let session: any = null;

    clientWs.on("message", async (data) => {
      try {
        const msg = JSON.parse(data.toString());

        if (msg.type === "start") {
          const setting = msg.setting || "Mystery Adventure";
          
          session = await ai.live.connect({
            model: "gemini-3.1-flash-live-preview",
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
              },
              systemInstruction: `You are an interactive AI storyteller for a 2-player voice game. The players are on a phone call together. You will guide them through a story based on the setting they chose: ${setting}. Describe the environment creatively, present a situation, and give them a couple of options of what to do (or allow them to come up with their own). Pause and wait for them to speak. Keep your turns brief and atmospheric. Always end your turn by asking what they want to do. If you hear them talking to each other, wait for them to make a final decision before continuing.`,
            },
            callbacks: {
              onmessage: (serverMsg: LiveServerMessage) => {
                const audio = serverMsg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                if (audio) {
                  clientWs.send(JSON.stringify({ type: "audio", audio }));
                }
                if (serverMsg.serverContent?.interrupted) {
                  clientWs.send(JSON.stringify({ type: "interrupted" }));
                }
              },
            },
          });

          // Kick off the story
          session.sendRealtimeInput({
            text: `We are ready to start. The setting is: ${setting}. Give us the opening hook and ask what we do.`,
          });
        } else if (msg.type === "audio" && session) {
           session.sendRealtimeInput({
             audio: { data: msg.audio, mimeType: "audio/pcm;rate=16000" },
           });
        }
      } catch (err) {
        console.error("Error handling message", err);
      }
    });

    clientWs.on("close", () => {
      // Cleanup session if needed (the SDK currently auto-cleans on disconnect, but we can call close if available)
      if (session && typeof session.close === 'function') {
         session.close();
      }
    });
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

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
