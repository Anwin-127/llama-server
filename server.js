require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const Groq = require('groq-sdk');

// Initialize the Groq client with the API key from environment variables
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const app = express();
app.use(bodyParser.json()); // Middleware to parse JSON request bodies

app.post('/chat', async (req, res) => {
  const { topic } = req.body;

  if (!topic) {
    return res.status(400).json({ error: "No topic provided" });
  }

  try {
    // Make the request to Groq's chat completion endpoint
    const chatCompletion = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [
        {
          role: "user",
          content: `I have to decide whether to ${topic}. List the pros and cons for each option, with absurd, exaggerated, and humorous reasons. Make the choice sound like a life-altering decision`
        },
        {
          role: "assistant",
          content: ""
        }
      ],
      temperature: 1,
      max_tokens: 1024,
      top_p: 1,
      stream: true,
      stop: null
    });

    res.setHeader('Content-Type', 'application/json');
    res.write('{"response": "'); // Start JSON response

    // Stream the response as it arrives
    for await (const chunk of chatCompletion) {
      const content = chunk.choices[0]?.delta?.content || '';
      res.write(content.replace(/"/g, '\\"')); // Escape quotes for valid JSON
    }

    res.write('"}'); // End JSON response
    res.end();

  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).json({ error: "Failed to get a response from the model", details: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
