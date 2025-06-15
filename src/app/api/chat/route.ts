export const runtime = 'edge';

// The new route handles POST requests to /api/chat
export async function POST(req: Request) {
  const { messages } = await req.json();
  const lastMessage = messages[messages.length - 1];

  const responseStream = new ReadableStream({
    start(controller) {
      const text = `I am a simple echo bot. You said: "${lastMessage.content}"`;
      const encoder = new TextEncoder();
      const chunks = text.split(" ");

      function push() {
        if (chunks.length > 0) {
          const chunk = chunks.shift();
          if (chunk) {
            controller.enqueue(encoder.encode(chunk + " "));
          }
          setTimeout(push, 50);
        } else {
          controller.close();
        }
      }
      push();
    },
  });

  return new Response(responseStream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
