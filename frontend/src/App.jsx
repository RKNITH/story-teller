import React, { useState, useRef } from 'react';
import { GiMagicSwirl } from 'react-icons/gi';
import { FaPlay, FaStop, FaMicrophone } from 'react-icons/fa';

const App = () => {
  const [prompt, setPrompt] = useState('');
  const [story, setStory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef(null);

  const handleGenerateStory = async () => {
    if (!prompt) {
      alert("Please tell me what the story should be about!");
      return;
    }
    setIsLoading(true);
    setStory('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/generate-story`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Something went wrong on the server.');
      }

      const data = await response.json();
      setStory(data.story);
    } catch (error) {
      console.error("Failed to fetch story:", error);
      alert("Oops! I couldn't create a story right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (recipe) {
      const text = recipe
        .replace(/[*_#`]/g, '') // remove markdown symbols
        .replace(/\d+\./g, '')  // remove step numbers like "1."
        .trim();

      const utterance = new SpeechSynthesisUtterance(text);

      // Load voices safely
      let voices = window.speechSynthesis.getVoices();
      if (!voices.length) {
        window.speechSynthesis.onvoiceschanged = () => handleSpeak();
        return;
      }

      // Find Hindi voice
      const hindiVoice = voices.find(v => v.lang === 'hi-IN' || v.lang.startsWith('hi'));
      if (hindiVoice) {
        utterance.voice = hindiVoice;
      } else {
        console.warn("⚠️ Hindi voice not found, using default voice.");
      }

      utterance.pitch = 1.1;
      utterance.rate = 0.95;
      utterance.volume = 1;
      utterance.onend = () => setIsSpeaking(false);

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };


  const startRecognition = () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'hi-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();

    recognition.onresult = (event) => {
      const speechResult = event.results[0][0].transcript;
      setPrompt(speechResult);
    };

    recognition.onspeechend = () => {
      recognition.stop();
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      alert("I couldn't understand that. Please try again.");
    };
  };


  return (
    <div className="min-h-screen bg-night-sky font-sans text-star-twinkle flex flex-col items-center p-4">
      <div className="w-full max-w-3xl mx-auto">
        <header className="text-center my-8">
          <h1 className="text-5xl font-bold text-moon-glow animate-pulse">
            Magical Bedtime Stories ✨
          </h1>
          <p className="text-lg mt-2">Tell me a topic, and I'll weave a tale for you in Hindi!</p>
        </header>

        <main>
          <div className="bg-storybook-bg/20 p-6 rounded-2xl shadow-lg backdrop-blur-sm border border-moon-glow/50">
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="जैसे: एक बहादुर शेर और एक चालाक खरगोश"
                className="w-full p-4 rounded-xl bg-night-sky/80 text-moon-glow placeholder-moon-glow/70 focus:ring-2 focus:ring-moon-glow focus:outline-none"
              />
              <button
                onClick={startRecognition}
                className="p-4 rounded-full bg-moon-glow text-night-sky hover:bg-moon-glow/80 transition-transform transform hover:scale-110"
                aria-label="Use microphone"
              >
                <FaMicrophone size={24} />
              </button>
            </div>

            <button
              onClick={handleGenerateStory}
              disabled={isLoading}
              className="w-full mt-4 flex items-center justify-center gap-2 text-2xl font-bold bg-moon-glow text-night-sky py-4 rounded-xl hover:bg-moon-glow/80 transition-transform transform hover:scale-105 disabled:bg-gray-400"
            >
              {isLoading ? (
                <>
                  <span>Creating...</span>
                  <GiMagicSwirl className="animate-spin" />
                </>
              ) : (
                <>
                  <span>Create a Story</span>
                  <GiMagicSwirl />
                </>
              )}
            </button>
          </div>

          {story && (
            <div className="mt-8 bg-storybook-bg p-8 rounded-2xl shadow-2xl text-storybook-text leading-loose">
              <h2 className="text-3xl font-bold text-center mb-4 text-storybook-text/80">Your Story!</h2>
              <p className="text-lg whitespace-pre-wrap">{story}</p>
              <div className="text-center mt-6">
                <button
                  onClick={handleSpeak}
                  className="p-4 rounded-full bg-night-sky text-moon-glow hover:bg-night-sky/80 transition-transform transform hover:scale-110"
                  aria-label={isSpeaking ? "Stop reading" : "Read story aloud"}
                >
                  {isSpeaking ? <FaStop size={30} /> : <FaPlay size={30} />}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
