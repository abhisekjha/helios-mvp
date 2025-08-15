// Debug utility for checking streaming response format
// Run this in browser console while testing chat

let debugStreamingData = [];

// Override fetch to intercept streaming responses
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const response = originalFetch.apply(this, args);
  
  // Only intercept agent query requests
  if (args[0] && args[0].includes('/api/v1/agent/query')) {
    return response.then(resp => {
      if (resp.body) {
        const reader = resp.body.getReader();
        const originalRead = reader.read.bind(reader);
        
        reader.read = function() {
          return originalRead().then(result => {
            if (!result.done) {
              const chunk = new TextDecoder().decode(result.value);
              console.log('Raw streaming chunk:', chunk);
              
              const lines = chunk.split('\n');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const dataStr = line.slice(6);
                  console.log('Data string:', dataStr);
                  
                  try {
                    const parsed = JSON.parse(dataStr);
                    console.log('Parsed JSON:', parsed);
                    debugStreamingData.push(parsed);
                  } catch (e) {
                    console.log('Failed to parse as JSON:', dataStr);
                    debugStreamingData.push({ raw: dataStr, parseError: e.message });
                  }
                }
              }
            }
            return result;
          });
        };
        
        return {
          ...resp,
          body: {
            ...resp.body,
            getReader: () => reader
          }
        };
      }
      return resp;
    });
  }
  
  return response;
};

console.log('🐛 Debug mode enabled for streaming responses');
console.log('To view captured data: debugStreamingData');

// Helper function to analyze streaming data
window.analyzeStreamingData = function() {
  console.log('📊 Streaming Data Analysis:');
  console.log('Total chunks received:', debugStreamingData.length);
  
  const byType = debugStreamingData.reduce((acc, item) => {
    const type = item.type || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  
  console.log('Chunks by type:', byType);
  
  const hasContent = debugStreamingData.filter(item => item.content);
  console.log('Chunks with content:', hasContent.length);
  
  const agentKeywords = debugStreamingData.filter(item => 
    item.content && (
      item.content.includes('🧠') || 
      item.content.includes('🔍') || 
      item.content.includes('✨') ||
      item.content.includes('Router') ||
      item.content.includes('Retrieval') ||
      item.content.includes('Synthesizer')
    )
  );
  
  console.log('Agent-related chunks:', agentKeywords.length);
  agentKeywords.forEach((chunk, i) => {
    console.log(`Agent chunk ${i + 1}:`, chunk.content?.substring(0, 100));
  });
  
  return {
    total: debugStreamingData.length,
    byType,
    withContent: hasContent.length,
    agentRelated: agentKeywords.length
  };
};

console.log('🔧 Use analyzeStreamingData() after sending a chat message to analyze the stream');
