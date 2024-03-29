import React, { useState } from 'react';
import Chat from '../components/Chat';
import { OpenAIApi, Configuration } from 'openai';

function ChatBot() {
  const [result, setResult] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const configuration = new Configuration({
    apiKey: import.meta.env.VITE_OPENAI_KEY,
  });

  const openai = new OpenAIApi(configuration);

  const handleResult = async () => {
    setLoading(true);
    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: `Q: ${prompt}\nA:`,
      temperature: 0.5,
      max_tokens: 4000,
    });
    setResult(response?.data.choices[0].text);
    setLoading(false);
  };

  return (
    <section className="bg-gradient h-screen flex flex-col justify-center items-center p-3">
      <div className="container mx-auto max-w-xl p-5 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-semibold text-center mb-5 text--600">Hello, Ask about camping equipment here</h1>
        <div className="input-container">
          <Chat
            id="openai"
            placeholder="Ask your question here"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full p-2 rounded-md border"
          />
          <button
            onClick={handleResult}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-md px-4 py-2 mt-2"
          >
            Submit
          </button>
        </div>
        {loading && <div className="text-center text-gray-500 mt-2">Please Wait, in progress...</div>}
      </div>
      <div className="container mx-auto mt-5 p-5 bg-white rounded-lg shadow-lg">
        <textarea
          value={result}
          onChange={(e) => setResult(e.target.value)}
          className="w-full h-32 p-2 rounded-md border"
          placeholder="The answer will be displayed here"
        />
      </div>
    </section>
  );
}

export default ChatBot;
