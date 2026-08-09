class GeminiAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent';
    this.model = 'gemini-3.6-flash';
  }

  async askFracturepedia(question) {
    try {
      const systemPrompt = `You are Fracturepedia, an expert AI-powered medical reference system specializing in fractures.
      You provide accurate, evidence-based information about:
      - Fracture types and classifications
      - Anatomical locations and severity
      - Diagnosis and imaging findings
      - Treatment approaches
      - Complications and prognosis
      
      Always be clear, concise, and provide relevant medical information.`;

      const response = await fetch(`${this.baseURL}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          system: [{
            text: systemPrompt
          }],
          contents: [{
            parts: [{
              text: question
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            maxOutputTokens: 1024,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
      }
      
      return 'Unable to generate response. Please try again.';
    } catch (error) {
      console.error('Gemini API Error:', error);
      return `Error: ${error.message}. Please check your API key and internet connection.`;
    }
  }

  async askFracturepediaStream(question, onChunk) {
    try {
      const systemPrompt = `You are Fracturepedia, an expert AI-powered medical reference system specializing in fractures.`;

      const response = await fetch(`${this.baseURL}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          system: [{ text: systemPrompt }],
          contents: [{ parts: [{ text: question }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          }
        })
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;
      
      const chunkSize = 50;
      for (let i = 0; i < text.length; i += chunkSize) {
        onChunk(text.substring(i, i + chunkSize));
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } catch (error) {
      console.error('Streaming Error:', error);
      onChunk(`Error: ${error.message}`);
    }
  }
}

export default GeminiAPI;
