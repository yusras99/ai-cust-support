import { NextResponse } from "next/server"; // Import NextResponse from Next.js for handling responses. It returns response back from the server
import OpenAI from "openai"; // Import OpenAI library for interacting with the OpenAI API

// This API route will handle communication between our frontend and the OpenAI API.
// This file will process incoming chat messages and stream the AI’s responses back to the client.

// System prompt for the AI, providing guidelines on how to respond to users
// const systemPrompt = // Use your own system prompt here

// POST function to handle incoming requests
export async function POST(req) {
  const openai = new OpenAI(); // Create a new instance of the OpenAI client that will be used to communicate with the OpenAI API.
  const data = await req.json(); // Parse the JSON body of the incoming request, usually contains user messages that need to be processed by the AI

  // Create a chat completion request to the OpenAI API, this allows the model to generate responses in a conversational format
  const completion = await openai.chat.completions.create({
    messages: [{ role: "system", content: systemPrompt }, ...data], // Include the system prompt and user messages
    model: "gpt-4o", // Specify the model to use
    stream: true, // Enable streaming responses
  });

  // Create a ReadableStream to handle the streaming of the AI's response back to the client.
  // A ReadableStream is a web API that allows you to handle streams of data in JavaScript,
  // making it possible to process large chunks of data incrementally as they are received,
  // rather than waiting for the entire data set to be available
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder(); // Create a TextEncoder to convert strings to Uint8Array
      try {
        // Iterate over the streamed chunks of the response
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content; // Extract the content from the chunk
          if (content) {
            const text = encoder.encode(content); // Encode the content to Uint8Array
            controller.enqueue(text); // Enqueue the encoded text to the stream
          }
        }
      } catch (err) {
        controller.error(err); // Handle any errors that occur during streaming
      } finally {
        controller.close(); // Close the stream when done
      }
    },
  });

  return new NextResponse(stream); // Return the stream as the response
}
