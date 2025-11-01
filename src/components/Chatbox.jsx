import React, { useState, useRef, useEffect } from "react";
import "./Chatbot.css";

const Chatbox = () => {
  const [showChat, setShowChat] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const chatMessagesRef = useRef(null);
  const volumeCanvasRef = useRef(null);
  const isRecordingRef = useRef(false);

  // Gemini API configuration
  const GEMINI_API_KEY = "AIzaSyB8Fc-sPpmuY0cg4CcZgyhpCywmbOH754I";
  const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

  // Refs for audio/speech
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const volumeAnimationRef = useRef(null);
  const recognitionRef = useRef(null);
  const streamRef = useRef(null);
  const transcriptRef = useRef("");

  const toggleChatbot = () => {
    setShowChat(!showChat);
  };

  const scrollToBottom = () => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Test speech recognition support on component mount
  useEffect(() => {
    const testSpeechRecognition = () => {
      console.log("🔍 Testing speech recognition support...");
      
      if ("webkitSpeechRecognition" in window) {
        console.log("✅ webkitSpeechRecognition supported");
      } else if ("SpeechRecognition" in window) {
        console.log("✅ SpeechRecognition supported");
      } else {
        console.log("❌ Speech recognition not supported");
      }
      
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        console.log("✅ getUserMedia supported");
      } else {
        console.log("❌ getUserMedia not supported");
      }
      
      console.log("🌐 User Agent:", navigator.userAgent);
    };
    
    testSpeechRecognition();
  }, []);

  const addMessage = (sender, text) => {
    const newMsg = { sender, text, timestamp: new Date().toLocaleTimeString() };
    setMessages((prev) => [...prev, newMsg]);
  };

  const sendMessage = async () => {
    if (!inputValue.trim()) return;
    addMessage("user", inputValue);
    const userText = inputValue;
    setInputValue("");
    
    try {
      const botReply = await getBotResponse(userText);
      addMessage("bot", botReply);
    } catch (error) {
      addMessage("bot", "Sorry, there was an error processing your message.");
    }
  };

  const getBotResponse = async (userText) => {
    try {
      const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ 
              text: userText 
            }]
          }],
          generationConfig: {
            maxOutputTokens: 512,
            temperature: 0.7,
            topP: 0.9
          }
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates.length > 0) {
        return data.candidates[0].content.parts[0].text.trim();
      } else {
        return "No response from the model.";
      }
    } catch (error) {
      console.error("Error in getBotResponse:", error);
      throw error;
    }
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Audio recording not supported in this browser.");
      return;
    }
    
    try {
      console.log("🎤 Requesting microphone access...");
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      console.log("✅ Microphone access granted");
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      isRecordingRef.current = true;
      transcriptRef.current = "";
      
      // Start volume meter first
      startVolumeMeter(stream);
      
      // Then start speech recognition
      setTimeout(() => {
        startSpeechRecognition();
      }, 500);
      
      console.log("🎤 Recording started successfully");
      
    } catch (err) {
      console.error("❌ Error starting recording:", err);
      
      if (err.name === 'NotAllowedError') {
        alert("Microphone permission denied. Please allow microphone access in your browser settings and try again.");
      } else if (err.name === 'NotFoundError') {
        alert("No microphone found. Please check your microphone connection.");
      } else {
        alert("Could not access microphone: " + err.message);
      }
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    isRecordingRef.current = false;
    
    stopSpeechRecognition();
    stopVolumeMeter();
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      await startRecording();
    } else {
      stopRecording();
    }
  };

  const startSpeechRecognition = () => {
    // Check for speech recognition support
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      console.error("Speech recognition not supported");
      alert("Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }
    
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      // Configure recognition settings
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognition.maxAlternatives = 1;
      
      recognition.onstart = () => {
        console.log("🎤 Speech recognition started successfully");
      };
      
      recognition.onresult = (event) => {
        let interimTranscript = "";
        let finalTranscript = "";
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
            transcriptRef.current += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }
        
        const fullText = (transcriptRef.current + interimTranscript).trim();
        setInputValue(fullText);
        
        if (finalTranscript) {
          console.log("📝 Final transcript:", finalTranscript);
        }
        if (interimTranscript) {
          console.log("📝 Interim transcript:", interimTranscript);
        }
      };
      
      recognition.onerror = (event) => {
        console.error("❌ Speech recognition error:", event.error, event);
        
        switch (event.error) {
          case "not-allowed":
            alert("Microphone permission denied. Please allow microphone access and try again.");
            stopRecording();
            break;
          case "no-speech":
            console.log("No speech detected, continuing...");
            break;
          case "audio-capture":
            alert("No microphone found. Please check your microphone connection.");
            stopRecording();
            break;
          case "network":
            console.log("Network error, retrying...");
            break;
          default:
            console.log("Speech recognition error:", event.error);
        }
      };
      
      recognition.onend = () => {
        console.log("🔄 Speech recognition ended");
        
        // Only restart if we're still supposed to be recording
        if (isRecordingRef.current && recognitionRef.current) {
          console.log("🔄 Restarting recognition...");
          setTimeout(() => {
            if (isRecordingRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (err) {
                console.error("❌ Error restarting recognition:", err);
                // Try to reinitialize if restart fails
                if (isRecordingRef.current) {
                  startSpeechRecognition();
                }
              }
            }
          }, 100);
        } else {
          console.log("⏹️ Not restarting - recording stopped");
        }
      };
      
      // Start recognition
      recognition.start();
      recognitionRef.current = recognition;
      console.log("✅ Speech recognition initialized and started");
      
    } catch (err) {
      console.error("❌ Error initializing speech recognition:", err);
      alert("Could not start voice recognition. Please check your browser settings.");
      stopRecording();
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      try {
        const recognition = recognitionRef.current;
        recognitionRef.current = null;
        recognition.onend = null;
        recognition.stop();
        console.log("🛑 Speech recognition stopped");
      } catch (err) {
        console.error("Error stopping recognition:", err);
      }
    }
  };

  const startVolumeMeter = (stream) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      animateMeter();
      console.log("📊 Volume meter started");
    } catch (err) {
      console.error("Error starting volume meter:", err);
    }
  };

  const animateMeter = () => {
    if (!isRecordingRef.current) return;
    
    const canvas = volumeCanvasRef.current;
    if (!canvas || !analyserRef.current) return;
    
    const ctx = canvas.getContext("2d");
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#f8f9fa');
    gradient.addColorStop(1, '#e9ecef');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Calculate average volume for overall visualization
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    
    // Draw frequency bars
    const barCount = Math.min(32, dataArray.length); // Limit bars for better visibility
    const barWidth = (canvas.width - (barCount - 1)) / barCount;
    
    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor((i / barCount) * dataArray.length);
      const barHeight = Math.max(2, (dataArray[dataIndex] / 255) * canvas.height * 0.8);
      const x = i * (barWidth + 1);
      
      // Create color based on frequency and volume
      const intensity = dataArray[dataIndex] / 255;
      const red = Math.min(255, 100 + intensity * 155);
      const green = Math.min(255, 200 - intensity * 100);
      const blue = Math.min(255, 50 + intensity * 50);
      
      // Create gradient for each bar
      const barGradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
      barGradient.addColorStop(0, `rgba(${red}, ${green}, ${blue}, 0.8)`);
      barGradient.addColorStop(1, `rgba(${red}, ${green}, ${blue}, 1)`);
      
      ctx.fillStyle = barGradient;
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
      
      // Add highlight on top
      ctx.fillStyle = `rgba(255, 255, 255, ${intensity * 0.3})`;
      ctx.fillRect(x, canvas.height - barHeight, barWidth, Math.max(1, barHeight * 0.1));
    }
    
    // Draw volume level indicator
    const volumeLevel = average / 255;
    ctx.fillStyle = volumeLevel > 0.1 ? '#4ade80' : '#94a3b8';
    ctx.fillRect(canvas.width - 60, 5, 50, 8);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(canvas.width - 58, 7, 46 * volumeLevel, 4);
    
    volumeAnimationRef.current = requestAnimationFrame(animateMeter);
  };

  const stopVolumeMeter = () => {
    if (volumeAnimationRef.current) {
      cancelAnimationFrame(volumeAnimationRef.current);
      volumeAnimationRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    console.log("📊 Volume meter stopped");
  };

  const speakText = (text) => {
    if (!window.speechSynthesis) {
      alert("Speech Synthesis not supported in this browser.");
      return;
    }
    const utter = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utter);
  };

  const triggerFileDialog = (mode) => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.style.display = "none";
    fileInput.accept = mode === "image" ? "image/*" : "*/*";
    fileInput.onchange = (event) => {
      const file = event.target.files[0];
      if (file) {
        addMessage("user", `Uploaded file: ${file.name}`);
      }
    };
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
  };

  return (
    <div>
      <div className="chat-toggle-btn" onClick={toggleChatbot}>
        <img src="https://png.pngtree.com/png-clipart/20230401/original/pngtree-smart-chatbot-cartoon-clipart-png-image_9015126.png" alt="Chat" />
      </div>

      {showChat && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <span>Chatbot</span>
            <button className="close-btn" onClick={toggleChatbot}>
              X
            </button>
          </div>

          {isRecording && (
            <div className="volume-meter-container">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    width: '12px', 
                    height: '12px', 
                    borderRadius: '50%', 
                    background: '#ff4444',
                    animation: 'blink 1s infinite'
                  }}></div>
                  <span style={{ fontSize: '13px', color: '#333', fontWeight: '600' }}>🎤 Listening...</span>
                </div>
                <div style={{ fontSize: '11px', color: '#666' }}>
                  {recognitionRef.current ? '✅ Recognition Active' : '❌ Recognition Inactive'}
                </div>
              </div>
              <canvas 
                ref={volumeCanvasRef} 
                width="350" 
                height="60" 
                style={{
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', 
                  borderRadius: '8px',
                  border: '2px solid #dee2e6'
                }}
              ></canvas>
              <div style={{ 
                fontSize: '10px', 
                color: '#666', 
                marginTop: '5px',
                textAlign: 'center'
              }}>
                Speak clearly into your microphone
              </div>
            </div>
          )}

          <div className="chat-messages" ref={chatMessagesRef}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`message-bubble ${
                  msg.sender === "bot" ? "bot-message" : "user-message"
                }`}
              >
                {msg.text}
                <br />
                <span className="message-timestamp">{msg.timestamp}</span>
                {msg.sender === "bot" && (
                  <div className="bot-actions">
                    <button onClick={() => speakText(msg.text)}>Speak</button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="chat-input-area">
            <div className="input-buttons">
              <button className="icon-btn" onClick={() => triggerFileDialog("any")}>
                <img
                  src="https://static.vecteezy.com/system/resources/previews/004/588/642/non_2x/attach-paper-clip-thin-line-flat-color-icon-linear-illustration-pictogram-isolated-on-white-background-colorful-long-shadow-design-free-vector.jpg"
                  alt="Attach"
                />
              </button>
              <button className="icon-btn" onClick={() => triggerFileDialog("image")}>
                <img
                  src="https://static.vecteezy.com/system/resources/previews/000/593/600/original/camera-icon-logo-template-illustration-design-vector-eps-10.jpg"
                  alt="Camera"
                />
              </button>
              <button 
                className="icon-btn" 
                onClick={toggleRecording}
                style={{
                  background: isRecording ? 'linear-gradient(135deg, #ff4444 0%, #ff6b6b 100%)' : undefined,
                  borderColor: isRecording ? '#ff4444' : undefined,
                  transform: isRecording ? 'scale(1.1)' : undefined
                }}
              >
                <img
                  src="https://static.vecteezy.com/system/resources/previews/012/750/893/original/microphone-silhouette-icon-voice-record-simbol-audio-mic-logo-vector.jpg"
                  alt="Mic"
                  style={{ filter: isRecording ? 'brightness(0) invert(1)' : undefined }}
                />
              </button>
            </div>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isRecording ? "🎤 Listening... Speak now" : "Type your message or click mic to speak..."}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              style={{
                borderColor: isRecording ? '#ff6b35' : '#e2e8f0',
                background: isRecording ? '#fff5f0' : '#f8f9fa'
              }}
            />
            <button className="send-btn" onClick={sendMessage}>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbox;