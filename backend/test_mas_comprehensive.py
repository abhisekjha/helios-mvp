#!/usr/bin/env python3
"""
Comprehensive Multi-Agent System Test Suite
Tests various question types with business intelligence data
"""

import sys
sys.path.append('/Users/ajha/snapdev/helios-mvp/backend')

from app.agents.orchestrator import AgentOrchestrator
from app.db.session import get_database
from app.services.vector_embeddings import VectorEmbeddingService
import asyncio
import time

# Test questions by category
TEST_QUESTIONS = {
    "Financial Analysis": [
        "What is our current financial performance and how much revenue did we generate in 2024?",
        "Analyze our profit margins and identify the most profitable product categories",
    ],
    "Customer Analysis": [
        "Who are our high-value customers and what is their average spend?",
        "Which customers are at risk of churning and what should we do about it?",
    ],
    "Sales & Marketing": [
        "Which marketing campaigns had the highest ROI and why?",
        "Analyze our sales performance and identify top-selling products",
    ],
    "Strategic Planning": [
        "Create a comprehensive action plan to increase Q4 revenue by 25%",
        "What are the biggest opportunities and threats for our business growth?",
    ],
    "Complex Analysis": [
        "Correlate customer behavior with marketing campaigns and sales performance",
        "Create a data-driven business dashboard with our top 10 KPIs",
    ]
}

async def test_question(orchestrator, category, question, goal_id="689edcebcdabbe9dab199344"):
    """Test a single question and return results"""
    print(f"\n🔍 Testing: {category}")
    print(f"❓ Question: {question[:80]}...")
    
    start_time = time.time()
    try:
        context = {'goal_id': goal_id}
        result = await orchestrator.process_query_simple(question, context)
        
        duration = time.time() - start_time
        
        # Check for data usage
        contains_data = any(keyword in result.final_response.lower() for keyword in [
            '$', 'revenue', 'customer', 'sales', 'profit', 'growth', 
            '21,860', '11,185', '437', '280', 'churn', 'high-value'
        ])
        
        status = "✅ SUCCESS" if contains_data else "⚠️  GENERIC"
        
        print(f"{status} | Length: {len(result.final_response)} | Time: {duration:.1f}s | Sources: {len(result.sources_used)}")
        
        if contains_data:
            # Show key insights
            response_preview = result.final_response[:200].replace('\n', ' ')
            print(f"📋 Preview: {response_preview}...")
        
        return {
            "category": category,
            "question": question,
            "success": result.success,
            "contains_data": contains_data,
            "response_length": len(result.final_response),
            "sources": len(result.sources_used),
            "duration": duration
        }
        
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return {
            "category": category,
            "question": question,
            "success": False,
            "error": str(e),
            "duration": time.time() - start_time
        }

async def run_comprehensive_test():
    """Run comprehensive test suite"""
    print("🚀 Starting Comprehensive Multi-Agent System Test")
    print("=" * 60)
    
    # Initialize orchestrator
    orchestrator = AgentOrchestrator()
    db = get_database()
    embedding_service = VectorEmbeddingService(db)
    orchestrator.retriever.set_vector_service(embedding_service)
    
    results = []
    total_tests = sum(len(questions) for questions in TEST_QUESTIONS.values())
    current_test = 0
    
    for category, questions in TEST_QUESTIONS.items():
        print(f"\n📂 CATEGORY: {category.upper()}")
        print("-" * 40)
        
        for question in questions:
            current_test += 1
            print(f"\n[{current_test}/{total_tests}]", end=" ")
            
            result = await test_question(orchestrator, category, question)
            results.append(result)
            
            # Brief pause between tests
            await asyncio.sleep(1)
    
    # Summary report
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY REPORT")
    print("=" * 60)
    
    successful_tests = [r for r in results if r.get('success', False)]
    data_driven_tests = [r for r in results if r.get('contains_data', False)]
    
    print(f"✅ Total Tests: {len(results)}")
    print(f"✅ Successful: {len(successful_tests)} ({len(successful_tests)/len(results)*100:.1f}%)")
    print(f"📊 Data-Driven: {len(data_driven_tests)} ({len(data_driven_tests)/len(results)*100:.1f}%)")
    
    avg_length = sum(r.get('response_length', 0) for r in successful_tests) / len(successful_tests) if successful_tests else 0
    avg_duration = sum(r.get('duration', 0) for r in successful_tests) / len(successful_tests) if successful_tests else 0
    
    print(f"📏 Avg Response Length: {avg_length:.0f} chars")
    print(f"⏱️  Avg Processing Time: {avg_duration:.1f}s")
    
    # Category breakdown
    print(f"\n📂 CATEGORY PERFORMANCE:")
    for category in TEST_QUESTIONS.keys():
        category_results = [r for r in results if r.get('category') == category]
        category_data_driven = [r for r in category_results if r.get('contains_data', False)]
        success_rate = len(category_data_driven) / len(category_results) * 100 if category_results else 0
        print(f"   {category}: {success_rate:.0f}% data-driven")
    
    print(f"\n🎉 Multi-Agent System Test Complete!")
    return results

if __name__ == "__main__":
    asyncio.run(run_comprehensive_test())
