import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  Part,
} from '@google/generative-ai';

export const runtime = 'edge';

const genAI = new GoogleGenerativeAI(process.env.GEM_API_KEY || "");

interface ApiMessage {
    role: 'user' | 'assistant';
    content: string;
    image?: string; // base64 encoded image
}

const formatMessage = (message: ApiMessage) => {
    if (!message.image) {
        return {
            role: message.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: message.content }],
        };
    }

    // This is a multimodal request
    const imagePart: Part = {
        inlineData: {
            mimeType: message.image.match(/data:(.*);base64,/)![1],
            data: message.image.split(',')[1],
        },
    };

    if (!message.content) {
        return {
            role: 'user',
            parts: [imagePart],
        };
    }

    return {
        role: 'user',
        parts: [{ text: message.content }, imagePart],
    };
};

export async function POST(req: Request) {
    const { messages } : { messages: ApiMessage[] } = await req.json();

    const formattedMessages = messages.map(formatMessage);

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash-latest',
      safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
        ],
    });

    const lastMessage = formattedMessages.pop();
    if (!lastMessage) {
        return new Response('No message found', { status: 400 });
    }

    const chat = model.startChat({
        history: formattedMessages,
    });

    const result = await chat.sendMessageStream(lastMessage.parts);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            for await (const chunk of result.stream) {
                controller.enqueue(encoder.encode(chunk.text()));
            }
            controller.close();
        },
    });

    return new Response(stream, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
}
