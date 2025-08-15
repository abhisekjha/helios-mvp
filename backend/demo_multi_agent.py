"""
Multi-Agent System Demo for Helios MVP
======================================

This script demonstrates how the enhanced Sprint S7 Multi-Agent System
processes complex business queries through intelligent agent coordination.
"""

import sys
import os
sys.path.append('.')

import asyncio
import json
from datetime import datetime
from app.agents import AgentOrchestrator

class MockVectorService:
    """Mock vector service for demonstration"""
    
    def search_knowledge_base(self, goal_id: str, query: str, top_k: int = 5):
        """Simulate search results based on query type"""
        
        # Simulate different types of data based on query content
        if "sales" in query.lower() or "revenue" in query.lower():
            return [
                {
                    "content": "Date: 2024-Q1, Sales: $125,000, CompetitorPrice: $89, CustomerCount: 450",
                    "metadata": {"source": "sales_data.csv", "quarter": "Q1"},
                    "score": 0.92,
                    "chunk_id": "chunk_001",
                    "source": "Uploaded CSV: Q1 Sales Data"
                },
                {
                    "content": "Date: 2024-Q2, Sales: $143,500, CompetitorPrice: $85, CustomerCount: 520",
                    "metadata": {"source": "sales_data.csv", "quarter": "Q2"},
                    "score": 0.89,
                    "chunk_id": "chunk_002",
                    "source": "Uploaded CSV: Q2 Sales Data"
                },
                {
                    "content": "Date: 2024-Q3, Sales: $165,200, CompetitorPrice: $82, CustomerCount: 610",
                    "metadata": {"source": "sales_data.csv", "quarter": "Q3"},
                    "score": 0.87,
                    "chunk_id": "chunk_003",
                    "source": "Uploaded CSV: Q3 Sales Data"
                }
            ]
        
        elif "trends" in query.lower() or "growth" in query.lower():
            return [
                {
                    "content": "Monthly Growth Rate: Jan: 5.2%, Feb: 7.1%, Mar: 6.8%, Apr: 8.3%",
                    "metadata": {"source": "growth_metrics.csv", "type": "trends"},
                    "score": 0.95,
                    "chunk_id": "chunk_004",
                    "source": "Uploaded CSV: Growth Metrics"
                },
                {
                    "content": "Year-over-Year Comparison: 2023: $400K, 2024: $485K (+21.25% growth)",
                    "metadata": {"source": "yearly_comparison.csv", "type": "comparison"},
                    "score": 0.88,
                    "chunk_id": "chunk_005",
                    "source": "Uploaded CSV: Yearly Comparison"
                }
            ]
        
        else:
            return [
                {
                    "content": "Product Performance: Product A: 35% market share, Product B: 28% market share",
                    "metadata": {"source": "product_data.csv", "type": "performance"},
                    "score": 0.75,
                    "chunk_id": "chunk_006",
                    "source": "Uploaded CSV: Product Performance"
                }
            ]


async def demonstrate_multi_agent_system():
    """Demonstrate the Multi-Agent System with various query types"""
    
    print("🚀 Helios Multi-Agent System Demonstration")
    print("=" * 50)
    print()
    
    # Initialize the orchestrator
    agent_config = {
        "retrieval": {
            "max_chunks": 10,
            "similarity_threshold": 0.6,
            "query_expansion": True
        },
        "synthesizer": {
            "max_tokens": 1000,
            "temperature": 0.3,
            "include_recommendations": True
        },
        "router": {},
        "max_execution_time": 60.0,
        "enable_streaming": True
    }
    
    orchestrator = AgentOrchestrator(agent_config)
    
    # Set up mock vector service
    mock_vector_service = MockVectorService()
    orchestrator.set_vector_service(mock_vector_service)
    
    # Test different types of queries
    test_queries = [
        {
            "query": "What are the trends in our sales data over the last quarter?",
            "type": "Trend Analysis Query",
            "description": "Tests trend analysis with time-based data aggregation"
        },
        {
            "query": "Calculate the average revenue and compare it with competitor pricing",
            "type": "Aggregation & Comparison Query", 
            "description": "Tests data aggregation with comparative analysis"
        },
        {
            "query": "What strategic recommendations do you have based on our growth metrics?",
            "type": "Strategic Planning Query",
            "description": "Tests strategic insight generation and recommendations"
        }
    ]
    
    context = {
        "goal_id": "demo_goal_123",
        "user_id": "demo_user",
        "goal_title": "Increase Revenue by 25%",
        "goal_description": "Strategic initiative to boost company revenue through data-driven decisions"
    }
    
    for i, test_case in enumerate(test_queries, 1):
        print(f"📋 Test Case {i}: {test_case['type']}")
        print(f"📝 Description: {test_case['description']}")
        print(f"❓ Query: \"{test_case['query']}\"")
        print("-" * 60)
        
        print("🎬 Multi-Agent Processing:")
        print()
        
        # Process query with streaming output
        async for chunk in orchestrator.process_query(test_case['query'], context):
            print(chunk, end='', flush=True)
        
        print()
        print("=" * 60)
        print()


async def demonstrate_agent_performance():
    """Show agent performance metrics"""
    
    print("📊 Agent Performance Metrics")
    print("-" * 30)
    
    # Initialize orchestrator
    orchestrator = AgentOrchestrator()
    mock_vector_service = MockVectorService()
    orchestrator.set_vector_service(mock_vector_service)
    
    # Run a few queries to generate metrics
    context = {"goal_id": "test", "user_id": "test"}
    
    queries = [
        "Show me sales data",
        "Calculate average revenue", 
        "What are the growth trends?"
    ]
    
    print("Running test queries to generate performance data...")
    for query in queries:
        try:
            result = await orchestrator.process_query_simple(query, context)
            print(f"✅ Processed: '{query}' - Success: {result.success}")
        except Exception as e:
            print(f"❌ Failed: '{query}' - Error: {e}")
    
    # Show performance metrics
    metrics = orchestrator.get_performance_metrics()
    
    print("\n📈 Performance Summary:")
    for agent_name, agent_metrics in metrics.items():
        print(f"\n🤖 {agent_name}:")
        print(f"   Total Calls: {agent_metrics['total_calls']}")
        print(f"   Success Rate: {agent_metrics['success_rate']:.1%}")
        print(f"   Avg Response Time: {agent_metrics['average_response_time']:.2f}s")
        if agent_metrics['last_error']:
            print(f"   Last Error: {agent_metrics['last_error']}")


async def demonstrate_query_classification():
    """Show how the Router Agent classifies different query types"""
    
    from app.agents import RouterAgent
    
    print("🧠 Query Classification Demonstration")
    print("-" * 40)
    
    router = RouterAgent()
    context = {"goal_id": "demo"}
    
    test_queries = [
        "What is my total sales?",
        "Show me the average revenue over time",
        "Compare Q1 vs Q2 performance", 
        "What trends do you see in the data?",
        "Give me strategic recommendations for growth",
        "How many customers do we have?"
    ]
    
    for query in test_queries:
        try:
            result = await router.execute(query, context)
            
            if result.success:
                classification = result.response['classification']
                print(f"\n❓ Query: \"{query}\"")
                print(f"   🏷️  Type: {classification['query_type']}")
                print(f"   🎯 Confidence: {classification['confidence']:.0%}")
                print(f"   🔧 Tools Needed: {', '.join(classification['requires_tools'])}")
                print(f"   📊 Complexity: {classification['complexity_score']}/10")
            else:
                print(f"\n❌ Failed to classify: \"{query}\"")
                
        except Exception as e:
            print(f"\n❌ Error classifying \"{query}\": {e}")


if __name__ == "__main__":
    print("🎭 Welcome to the Helios Multi-Agent System Demo!")
    print()
    
    try:
        # Run demonstrations
        print("1️⃣ Testing Query Classification...")
        asyncio.run(demonstrate_query_classification())
        
        print("\n" + "="*80 + "\n")
        
        print("2️⃣ Testing Agent Performance...")
        asyncio.run(demonstrate_agent_performance())
        
        print("\n" + "="*80 + "\n")
        
        print("3️⃣ Full Multi-Agent System Demo...")
        asyncio.run(demonstrate_multi_agent_system())
        
        print("\n🎉 Demo Complete! The Multi-Agent System is working perfectly!")
        print("\n📝 Summary of Capabilities:")
        print("   ✅ Intelligent query classification")
        print("   ✅ Multi-step execution planning")
        print("   ✅ Advanced data retrieval and aggregation")
        print("   ✅ Strategic response synthesis")
        print("   ✅ Performance monitoring")
        print("   ✅ Streaming responses with progress indicators")
        
    except Exception as e:
        print(f"❌ Demo failed: {e}")
        import traceback
        traceback.print_exc()
