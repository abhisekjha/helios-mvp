"""
Real-World Example: How to Use the Multi-Agent System via API
============================================================

This example shows how a frontend or external client would interact
with the enhanced Helios Multi-Agent System through HTTP requests.
"""

import requests
import json
import time

# Configuration
API_BASE_URL = "http://localhost:8000/api/v1"
GOAL_ID = "550e8400-e29b-41d4-a716-446655440000"  # Sample goal ID

def demonstrate_api_usage():
    """Show real API calls to the Multi-Agent System"""
    
    print("🌐 Helios Multi-Agent System - API Usage Example")
    print("=" * 55)
    print()
    
    # Test 1: Simple Business Query
    print("📊 Test 1: Business Intelligence Query")
    print("-" * 40)
    
    query_data = {
        "query": "What are the trends in our sales data and what do you recommend?",
        "goal_id": GOAL_ID,
        "stream": False
    }
    
    try:
        print(f"🔄 Sending query: '{query_data['query']}'")
        response = requests.post(
            f"{API_BASE_URL}/agent/query",
            json=query_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Status: {result['status']}")
            print(f"🎯 Query Type: {result['query_type']}")
            print(f"⏱️  Processing Time: {result['processing_time']:.2f}s")
            print(f"🔍 Sources Used: {len(result['sources_used'])} data sources")
            print(f"📝 Response Preview: {result['response'][:200]}...")
            
            if result.get('insights'):
                print(f"💡 Key Insights: {len(result['insights'])} insights generated")
            
            if result.get('recommendations'):
                print(f"🎯 Recommendations: {len(result['recommendations'])} strategic recommendations")
                
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Backend server not running. Please start with: uvicorn app.main:app --reload")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print()
    
    # Test 2: Streaming Response (if backend is running)
    print("🔄 Test 2: Streaming Response")
    print("-" * 30)
    
    streaming_data = {
        "query": "Calculate the average ROI and provide strategic insights",
        "goal_id": GOAL_ID,
        "stream": True
    }
    
    try:
        print(f"🔄 Streaming query: '{streaming_data['query']}'")
        print("📡 Real-time response:")
        print("-" * 40)
        
        response = requests.post(
            f"{API_BASE_URL}/agent/query", 
            json=streaming_data,
            stream=True,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            for line in response.iter_lines():
                if line:
                    try:
                        chunk = line.decode('utf-8')
                        if chunk.startswith('data: '):
                            chunk_data = chunk[6:]  # Remove 'data: ' prefix
                            if chunk_data.strip() and chunk_data != '[DONE]':
                                print(chunk_data, end='', flush=True)
                    except:
                        pass
        else:
            print(f"❌ Streaming failed: {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Backend server not running for streaming test")
    except Exception as e:
        print(f"❌ Streaming error: {e}")
    
    print("\n")
    
    # Test 3: Performance Metrics
    print("📈 Test 3: Agent Performance Monitoring")
    print("-" * 40)
    
    try:
        perf_response = requests.get(f"{API_BASE_URL}/agent/agent-performance")
        
        if perf_response.status_code == 200:
            metrics = perf_response.json()
            print("🤖 Agent Performance Summary:")
            
            for agent_name, agent_metrics in metrics.items():
                print(f"\n🔧 {agent_name.title()} Agent:")
                print(f"   📞 Total Calls: {agent_metrics['total_calls']}")
                print(f"   ✅ Success Rate: {agent_metrics['success_rate']:.1%}")
                print(f"   ⏱️  Avg Response: {agent_metrics['average_response_time']:.2f}s")
                
                if agent_metrics.get('last_error'):
                    print(f"   ⚠️  Last Error: {agent_metrics['last_error']}")
        else:
            print(f"❌ Performance metrics unavailable: {perf_response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Backend server not running for performance metrics")
    except Exception as e:
        print(f"❌ Performance metrics error: {e}")


def demonstrate_frontend_integration():
    """Show how the frontend would integrate with the Multi-Agent System"""
    
    print("\n" + "=" * 60)
    print("🖥️  Frontend Integration Example")
    print("=" * 60)
    
    print("""
📋 Frontend Integration Guide:

1️⃣ Chat Interface Setup:
   • Use POST /api/v1/agent/query for user questions
   • Enable streaming for real-time responses
   • Show progress indicators during processing

2️⃣ Enhanced User Experience:
   • Display query classification (trend analysis, comparison, etc.)
   • Show step-by-step processing: Router → Retrieval → Synthesis
   • Present key insights and recommendations separately
   • Include confidence scores for AI responses

3️⃣ Business Intelligence Features:
   • Smart query suggestions based on uploaded data
   • Visual indicators for different response types
   • Source attribution for data transparency
   • Export functionality for insights and recommendations

4️⃣ Performance Monitoring (Director View):
   • GET /api/v1/agent/agent-performance for system metrics
   • Real-time agent health monitoring
   • Query processing analytics
   • Error tracking and debugging

📝 Sample Frontend Code (React/TypeScript):

```typescript
const handleBusinessQuery = async (query: string) => {
  setLoading(true);
  
  try {
    const response = await fetch('/api/v1/agent/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        goal_id: currentGoalId,
        stream: true
      })
    });
    
    if (response.body) {
      const reader = response.body.getReader();
      let assistantMessage = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data && data !== '[DONE]') {
              assistantMessage += data;
              setMessages(prev => [...prev, { 
                type: 'assistant', 
                content: assistantMessage,
                streaming: true 
              }]);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Query failed:', error);
  } finally {
    setLoading(false);
  }
};
```

🎯 Key Benefits:
   ✅ Intelligent query understanding
   ✅ Multi-step reasoning process
   ✅ Rich, contextual responses
   ✅ Strategic business insights
   ✅ Real-time performance monitoring
   ✅ Scalable agent architecture
""")


if __name__ == "__main__":
    print("🚀 Starting Real-World API Demo...")
    print("(Make sure the backend server is running on port 8000)")
    print()
    
    # Check if server is running
    try:
        health_check = requests.get(f"{API_BASE_URL}/../health", timeout=2)
        if health_check.status_code == 200:
            print("✅ Backend server is running!")
            print()
            demonstrate_api_usage()
        else:
            print("⚠️  Backend server responded but may have issues")
            demonstrate_api_usage()
    except:
        print("❌ Backend server not accessible at http://localhost:8000")
        print("💡 To start the server, run: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload")
        print()
        print("📚 Here's how the system would work when running:")
        
    # Always show the integration guide
    demonstrate_frontend_integration()
    
    print("\n🎉 Multi-Agent System Demo Complete!")
    print("\n📋 Summary of Sprint S7 Capabilities:")
    print("   🧠 RouterAgent: Smart query classification")
    print("   🔍 RetrievalAgent: Advanced data search & aggregation")  
    print("   ✨ SynthesizerAgent: Strategic insights & recommendations")
    print("   🎭 AgentOrchestrator: Seamless workflow coordination")
    print("   📡 Streaming API: Real-time response generation")
    print("   📊 Performance Monitoring: Complete system analytics")
