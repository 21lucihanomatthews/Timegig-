import express from "express";
import path from "path";
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json());

  // API routes
  app.post("/api/chat", async (req, res) => {
    const { messages } = req.body;
    
    const lastUserMessage = messages.filter((m: any) => m.sender === 'user').pop()?.text;
    
    if (!lastUserMessage) {
        res.status(400).json({ error: "No user message" });
        return;
    }

    // Heuristics fallback helper if Gemini API is totally unavailable
    const getRuleBasedResponse = (userMessage: string): string => {
        const msg = userMessage.toLowerCase();
        
        if (msg.includes("verify") || msg.includes("identification") || msg.includes("id") || msg.includes("selfie") || msg.includes("camera") || msg.includes("document") || msg.includes("identity")) {
            return "👋 Hi there! I'm the TimeGiG helper.\n\nTo complete **Identity Verification**:\n1. Choose **Identity Verification** from the menu.\n2. Upload an ID or capture live ID using your camera.\n3. Take a live selfie using the capturing tool.\n4. Click **Start Verification** to complete the check. It will verify or reject you instantly!";
        }
        
        if (msg.includes("cwallet") || msg.includes("wallet") || msg.includes("coin") || msg.includes("money") || msg.includes("balance") || msg.includes("deposit") || msg.includes("transfer") || msg.includes("pay")) {
            return "👋 TimeGiG Assistant here. If you are looking to manage your **Cwallet**:\n1. Select **Cwallet** from the main features list.\n2. Here you can check your current virtual coin balance, deposit tokens, or safely perform quick transfers to other gig-workers.";
        }
        
        if (msg.includes("gig") || msg.includes("job") || msg.includes("work") || msg.includes("earn") || msg.includes("hustle") || msg.includes("search")) {
            return "💼 Looking for workspace Gigs? In the **Gigs** tab, you can search and filter through local job posts. Apply in one-click, but note that high-tier gigs require Identity Verification!";
        }
        
        if (msg.includes("market") || msg.includes("buy") || msg.includes("sell") || msg.includes("shop") || msg.includes("item")) {
            return "🛒 The **Market** is your central terminal to buy, sell, or advertise services and physical items directly within the local gig ecosystem.";
        }

        if (msg.includes("chat") || msg.includes("room") || msg.includes("message") || msg.includes("talk") || msg.includes("group")) {
            return "💬 Check out the **Chat Rooms** feature. Join local discussion rooms, coordinate on gig requirements, and build connections with peers.";
        }

        return "👋 Hello there! I am your visual companion and built-in guide for TimeGiG.\n\nHere are some things I can assist you with:\n- **Identity Verification**: Explaining ID & selfie capture workflows.\n- **Cwallet**: Checking balance & transferring coins.\n- **Gigs / Market / Chats**: Walking you through gig listings and chats.\n\nHow can I help you navigate the app today?";
    };

    const getGeminiResponse = async (message: string): Promise<string> => {
      const models = ["gemini-3.1-flash-lite", "gemini-3.5-flash"];
      
      for (const model of models) {
        let retries = 2;
        let delay = 300;
        while (retries >= 0) {
          try {
            console.log(`Trying model: ${model}`);
            const chat = ai.chats.create({
              model,
              config: {
                systemInstruction: "You are a helpful and intelligent assistant for TimeGiG, a web application for discovering gigs, chat rooms, and a market. Guide users through the app, answer questions, and help with their identity verification or cwallet balance if they ask. Always be friendly and helpful. If a user asks something not related to the app, politely bring it back to app-related topics."
              }
            });
            const response = await chat.sendMessage({ message });
            if (response && response.text) {
              console.log(`Success with model: ${model}`);
              return response.text;
            }
          } catch (error: any) {
            const status = error.status || (error.error && error.error.code) || error.code;
            console.warn(`Model ${model} failed with code ${status}. Retries left: ${retries}`);
            if (retries > 0 && (status === 503 || status === 429)) {
              await new Promise(resolve => setTimeout(resolve, delay));
              delay *= 2;
              retries--;
              continue;
            }
            break;
          }
        }
      }

      console.warn("All Gemini models busy/exhausted. Falling back to rule-based system.");
      return getRuleBasedResponse(message);
    };

    try {
        const replyText = await getGeminiResponse(lastUserMessage);
        res.json({ reply: replyText });
    } catch (error) {
        console.error("Chat overall fallback error:", error);
        res.json({ reply: getRuleBasedResponse(lastUserMessage) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
