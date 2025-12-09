import React, { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import './style.css';

export default function App() {
  // ⬇️ PASTE YOUR KEY HERE
  const API_KEY = "PASTE_YOUR_KEY_HERE"; 

  const [input, setInput] = useState("");
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [mode, setMode] = useState("explain"); 
  const [loading, setLoading] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [score, setScore] = useState(0);

  // 🗣️ Text to Speech
  const speak = (text) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  async function handleSend(selectedMode) {
    setLoading(true);
    setResult(null);
    setSelectedAnswers({});
    setScore(0);
    setMode(selectedMode);

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      
      // Using the 2.5-flash model (Standard for Dec 2025)
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash", 
        generationConfig: { responseMimeType: "application/json" }
      });
      
      let promptText = "";
      if (selectedMode === "explain") {
        promptText = `
          Analyze this image. 
          Explain it using a fun analogy (video games, sports, movies) based on: "${input}".
          Return JSON: { "type": "explanation", "content": "The analogy text..." }
        `;
      } else {
        promptText = `
          Analyze this image. 
          Generate a 5-question multiple choice quiz.
          Return JSON: { 
            "type": "quiz", 
            "questions": [
              { "text": "Question?", "options": ["A", "B", "C", "D"], "answer": "The correct option text", "hint": "Why it's right" }
            ] 
          }
        `;
      }

      let content = [promptText];
      if (image) {
        const reader = new FileReader();
        const base64 = await new Promise((r) => {
          reader.onload = () => r(reader.result.split(',')[1]);
          reader.readAsDataURL(image);
        });
        content.push({ inlineData: { data: base64, mimeType: image.type } });
      }

      const response = await model.generateContent(content);
      const data = JSON.parse(response.response.text());
      setResult(data);
      
    } catch (error) {
      alert("Error: " + error.message);
    }
    setLoading(false);
  }

  const handleQuizClick = (idx, opt, correct) => {
    if (selectedAnswers[idx]) return; 
    setSelectedAnswers(prev => ({...prev, [idx]: opt}));
    if (opt === correct) setScore(prev => prev + 1);
  };

  // --- DARK MODE STYLES ---
  const styles = {
    container: {
      minHeight: "100vh",
      padding: "40px 20px",
      fontFamily: "Arial, sans-serif",
      background: "#121212", // Dark Background
      color: "#ffffff"
    },
    card: {
      background: "#1e1e1e",
      borderRadius: "15px",
      padding: "30px",
      border: "1px solid #333",
      maxWidth: "800px",
      margin: "0 auto",
      boxShadow: "0 4px 20px rgba(0,0,0,0.5)"
    },
    input: {
      width: "100%", padding: "15px", borderRadius: "10px", 
      border: "1px solid #444", background: "#2d2d2d", color: "white",
      marginTop: "10px", fontSize: "16px"
    },
    btnBlue: { 
      background: "#4285F4", color: "white", padding: "15px", 
      border: "none", borderRadius: "10px", fontSize: "1.1rem", 
      cursor: "pointer", width: "100%", fontWeight: "bold"
    },
    btnGreen: { 
      background: "#0F9D58", color: "white", padding: "15px", 
      border: "none", borderRadius: "10px", fontSize: "1.1rem", 
      cursor: "pointer", width: "100%", fontWeight: "bold"
    }
  };

  return (
    <div style={styles.container}>
      <div style={{textAlign: "center", marginBottom: "30px"}}>
        <h1 style={{fontSize: "3rem", margin: 0}}>🧠 NeuroAlly <span style={{color: "#4285F4"}}>Dark</span></h1>
        <p style={{color: "#aaa"}}>The AI Tutor</p>
      </div>

      <div style={styles.card}>
        <p><b>1. Upload Image:</b></p>
        <input type="file" onChange={(e) => setImage(e.target.files[0])} accept="image/*" style={{color: "white"}} />
        
        <p style={{marginTop: "20px"}}><b>2. Your Interest:</b></p>
        <textarea 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="e.g. 'Explain using Minecraft'..."
          style={{...styles.input, height: "80px"}} 
        />
        
        <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginTop: "20px"}}>
          <button onClick={() => handleSend("explain")} disabled={loading} style={styles.btnBlue}>
            {loading && mode === "explain" ? "Thinking..." : "📖 Explain It"}
          </button>
          <button onClick={() => handleSend("quiz")} disabled={loading} style={styles.btnGreen}>
            {loading && mode === "quiz" ? "Generating..." : "📝 Generate Quiz"}
          </button>
        </div>
      </div>

      {result && (
        <div style={{marginTop: "30px"}}>
          {result.type === "explanation" && (
            <div style={{...styles.card, border: "1px solid #4285F4"}}>
              <div style={{display: "flex", justifyContent: "space-between"}}>
                 <h2 style={{color: "#4285F4", marginTop: 0}}>💡 Explanation</h2>
                 <button onClick={() => speak(result.content)} style={{background: "none", border: "1px solid #4285F4", borderRadius: "50%", width: "40px", height: "40px", color: "white", cursor: "pointer"}}>🔊</button>
              </div>
              <p style={{ lineHeight: "1.6", fontSize: "1.2rem", color: "#ddd" }}>{result.content}</p>
            </div>
          )}

          {result.type === "quiz" && (
            <div style={{...styles.card, border: "1px solid #0F9D58"}}>
              <div style={{display: "flex", justifyContent: "space-between"}}>
                <h2 style={{color: "#0F9D58", marginTop: 0}}>📝 Quiz</h2>
                <span style={{background: "#0F9D58", padding: "5px 15px", borderRadius: "20px"}}>Score: {score}/{result.questions.length}</span>
              </div>
              
              {result.questions.map((q, idx) => (
                <div key={idx} style={{ marginTop: "20px", paddingBottom: "15px", borderBottom: "1px solid #333" }}>
                  <p style={{ fontWeight: "bold", fontSize: "1.1rem" }}>{idx + 1}. {q.text}</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    {q.options.map((opt) => (
                      <button 
                        key={opt}
                        onClick={() => handleQuizClick(idx, opt, q.answer)}
                        disabled={!!selectedAnswers[idx]}
                        style={{ 
                          padding: "10px", borderRadius: "8px", cursor: "pointer",
                          background: selectedAnswers[idx] === opt 
                            ? (opt === q.answer ? "#155724" : "#721c24") // Dark Green or Dark Red
                            : "#2d2d2d",
                          color: "white", border: "1px solid #444"
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  {selectedAnswers[idx] && <p style={{marginTop: "10px", color: "#aaa"}}>ℹ️ {q.hint}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
