"use client";

import { Box, Button, Stack, TextField } from "@mui/material";
import { useState, useRef, useEffect } from "react";

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm the Headstarter support assistant. How can I help you today?",
    },
  ]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // This asynchronous function is called when the user sends a message.
  // It handles updating the chat UI and sending the message to the server
  const sendMessage = async () => {
    if (!message.trim() || isLoading) return; // Don't send empty messages
    setIsLoading(true);

    setMessage(""); //clear msg field to send a new message
    // update msg array, by adding user message and assistant message is a place holder assistant's actual response when it's received.
    setMessages((messages) => [
      ...messages,
      { role: "user", content: message },
      { role: "assistant", content: "" },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST", // send msg to server using POST
        headers: {
          // header specifies that the request body is in JSON format
          "Content-Type": "application/json",
        },
        body: JSON.stringify([...messages, { role: "user", content: message }]),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      // The response body is read as a stream using getReader()
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // Keep reading from stream until no data is left to read
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1]; // Get the last message (assistant's placeholder)
          let otherMessages = messages.slice(0, messages.length - 1); // Get all other messages
          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + text }, // Append the decoded text to the assistant's message
          ];
        });
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((messages) => [
        ...messages,
        {
          role: "assistant",
          content:
            "I'm sorry, but I encountered an error. Please try again later.",
        },
      ]);
    }
    setIsLoading(false);
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  // Add auto scrolling to the chat so that the most recent messages are always visible.
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      <Stack
        direction={"column"}
        width="500px"
        height="700px"
        sx={{
          backgroundColor: "#1B1B1B",
        }}
        border="1px solid black"
        p={2}
        spacing={3}
      >
        <Stack
          direction={"column"}
          spacing={2}
          flexGrow={1}
          overflow="auto"
          maxHeight="100%"
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent={
                message.role === "assistant" ? "flex-start" : "flex-end"
              }
            >
              <Box
                bgcolor={
                  message.role === "assistant"
                    ? "primary.main"
                    : "secondary.main"
                }
                color="white"
                borderRadius={16}
                p={3}
              >
                {message.content}
              </Box>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Stack>
        <Stack direction={"row"} spacing={2}>
          <TextField
            label="Message"
            sx={{
              backgroundColor: "#1B1B1B",
              "& .MuiInputBase-input": {
                color: "#FFFFFF", // Text color inside the input field
              },
              "& .MuiFormLabel-root": {
                color: "#FFFFFF", // Color of the label
              },
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: "#FFFFFF", // Border color when not focused
                },
                "&:hover fieldset": {
                  borderColor: "#FFFFFF", // Border color on hover
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#FFFFFF", // Border color when focused
                },
              },
            }}
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage();
              }
            }}
            disabled={isLoading}
          />
          <Button
            variant="contained"
            onClick={sendMessage}
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send"}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
