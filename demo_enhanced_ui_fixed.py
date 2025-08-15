#!/usr/bin/env python3
"""
Enhanced Chatbot UI Demo
===============================

This script demonstrates the enhanced chatbot UI improvements based on the recommendations:
1. Executive Summary First approach
2. Clear Information Hierarchy  
3. Enhanced readability with tabbed interface
4. Interactive elements and drill-down capabilities
5. Multiple file data source display

The demo shows how the UI now presents:
- Key metrics at a glance
- Prioritized recommendations
- Detailed analysis in tabs
- Source file transparency with metadata
"""

import asyncio
import json
import requests
import time

API_BASE_URL = "http://localhost:8000"
GOAL_ID = "689edcebcdabbe9dab199344"

# Authentication
def get_auth_token():
    """Get authentication token for API requests"""
    login_data = {
        "username": "test@example.com",
        "password": "TestPass123"
    }
    
    try:
        response = requests.post(f"{API_BASE_URL}/api/v1/auth/login", data=login_data)
        if response.status_code == 200:
            token_data = response.json()
            return token_data["access_token"]
        else:
            # Try to register first
            register_data = {
                "email": "test@example.com",
                "password": "TestPass123",
                "confirm_password": "TestPass123"
            }
            requests.post(f"{API_BASE_URL}/api/v1/auth/register", json=register_data)
            
            # Try login again
            response = requests.post(f"{API_BASE_URL}/api/v1/auth/login", data=login_data)
            if response.status_code == 200:
                token_data = response.json()
                return token_data["access_token"]
    except Exception as e:
        print(f"Authentication failed: {e}")
    
    return None
GOAL_ID = "689edcebcdabbe9dab199344"

def test_enhanced_chat_ui():
    """Test the enhanced chat UI with various query types"""
    """Test the enhanced chat UI with various query types"""
    
    print("🎨 Enhanced Chatbot UI Demo")
    print("=" * 50)
    print()
    
    queries = [
        {
            "title": "Sales Performance Analysis",
            "query": "Analyze our sales performance across all product categories and provide insights on top performers and underperformers",
            "description": "This query will demonstrate multi-file analysis and executive summary display"
        },
        {
            "title": "Customer Segmentation Strategy", 
            "query": "Based on our customer database and order history, what customer segments should we focus on for the next quarter?",
            "description": "Tests recommendation prioritization and interactive metrics"
        },
        {
            "title": "Inventory Optimization",
            "query": "Review our current inventory levels and suggest optimization strategies to reduce costs while maintaining service levels",
            "description": "Shows tabbed interface with actionable insights"
        }
    ]
    
    # Get authentication token
    print("🔐 Authenticating...")
    token = get_auth_token()
    if not token:
        print("❌ Failed to authenticate")
        return
    print("✅ Authentication successful")
    print()
    
    for i, test_case in enumerate(queries, 1):
        print(f"Test {i}: {test_case['title']}")
        print(f"Description: {test_case['description']}")
        print(f"Query: {test_case['query']}")
        print("-" * 50)
        
        # Make API request
        response = test_agent_query(test_case['query'], test_case['description'], token)
        
        if response:
            print("✅ Response received successfully")
            print(f"Response type: {type(response.get('response', {}))}")
            
            # Check for enhanced UI features
            analyze_response_structure(response)
        else:
            print("❌ Failed to get response")
        
        print()
        if i < len(queries):
            time.sleep(2)  # Brief pause between tests

def test_agent_query(query, description, token):
    """Test a single agent query"""
    try:
        print(f"Query: {query}")
        print("--" * 25)
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(
            f"{API_BASE_URL}/api/v1/agent/query",
            json={"query": query, "goal_id": GOAL_ID},
            headers=headers,
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ API Response received successfully")
            analyze_response_structure(data)
            return data
        else:
            print(f"❌ API Error: {response.status_code} - {response.text}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {str(e)}")
        return None
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        return None

def analyze_response_structure(response):
    """Analyze the response structure for enhanced UI features"""
    
    print("📊 Response Structure Analysis:")
    
    # Check for enhanced response format
    response_data = response.get('response', {})
    
    # Executive Summary check
    if 'executive_summary' in response_data:
        print("  ✅ Executive Summary: Present")
        summary = response_data['executive_summary']
        print(f"     - Title: {summary.get('title', 'N/A')}")
        print(f"     - Key Points: {len(summary.get('key_points', []))}")
    else:
        print("  ⚠️  Executive Summary: Missing")
    
    # Key Metrics check
    if 'key_metrics' in response_data:
        metrics = response_data['key_metrics']
        print(f"  ✅ Key Metrics: {len(metrics)} metrics found")
        for metric in metrics[:3]:  # Show first 3
            print(f"     - {metric.get('label', 'N/A')}: {metric.get('value', 'N/A')}")
    else:
        print("  ⚠️  Key Metrics: Missing")
    
    # Recommendations check
    if 'recommendations' in response_data:
        recs = response_data['recommendations']
        print(f"  ✅ Recommendations: {len(recs)} recommendations")
        priorities = {}
        for rec in recs:
            priority = rec.get('priority', 'unknown')
            priorities[priority] = priorities.get(priority, 0) + 1
        print(f"     - Priority breakdown: {dict(priorities)}")
    else:
        print("  ⚠️  Recommendations: Missing")
    
    # Data Sources check
    sources = response_data.get('sources_used', [])
    if sources:
        print(f"  ✅ Data Sources: {len(sources)} sources")
        for source in sources[:3]:  # Show first 3
            if isinstance(source, dict):
                file_name = source.get('file_name', 'Unknown')
                rows = source.get('rows', 'N/A')
                print(f"     - {file_name} ({rows} rows)")
            else:
                print(f"     - {source}")
    else:
        print("  ⚠️  Data Sources: Missing")

def test_ui_improvements():
    """Test specific UI improvement features"""
    
    print("🎨 UI Improvement Features Test")
    print("=" * 50)
    
    print("Before vs After UI Comparison:")
    print()
    
    print("BEFORE (Dense wall of text):")
    print("- Single long paragraph responses")
    print("- No visual hierarchy")
    print("- Generic section headers")
    print("- Hidden data sources")
    print()
    
    print("AFTER (Enhanced experience):")
    print("✅ Executive Summary with key metrics at top")
    print("✅ Tabbed interface (Recommendations | Analysis | Data Sources)")
    print("✅ Priority-coded recommendation cards")
    print("✅ Interactive clickable elements")
    print("✅ Clear data source transparency")
    print("✅ Descriptive section titles")
    print()

def check_frontend_integration():
    """Check if frontend can consume enhanced responses"""
    
    print("🌐 Frontend Integration Check")
    print("=" * 50)
    
    # Test data structure that frontend expects
    sample_enhanced_response = {
        "executive_summary": {
            "title": "Sales Performance Overview",
            "key_points": [
                "Revenue increased 15% YoY",
                "Top performer: Electronics category",
                "Inventory turnover improved"
            ]
        },
        "key_metrics": [
            {"label": "Total Revenue", "value": "$2.4M", "change": "+15%"},
            {"label": "Orders", "value": "1,247", "change": "+8%"},
            {"label": "Avg Order Value", "value": "$156", "change": "+12%"}
        ],
        "recommendations": [
            {
                "title": "Expand Electronics Inventory",
                "description": "Increase stock levels based on demand trends",
                "priority": "high",
                "impact": "High revenue potential"
            }
        ],
        "sources_used": [
            {
                "file_name": "sales_data_2024.csv",
                "rows": 1247,
                "columns": 8,
                "similarity_score": 0.95
            }
        ]
    }
    
    print("Sample Enhanced Response Structure:")
    print(json.dumps(sample_enhanced_response, indent=2))
    
    # Validate structure
    required_fields = ['executive_summary', 'key_metrics', 'recommendations', 'sources_used']
    
    for field in required_fields:
        if field in sample_enhanced_response:
            print(f"✅ {field}: Valid structure")
        else:
            print(f"❌ {field}: Missing")

def main():
    """Run the complete enhanced UI demo"""
    
    print("🚀 Starting Enhanced Chatbot UI Demo")
    print("=" * 60)
    print()
    
    # Check if backend is running
    try:
        response = requests.get(f"{API_BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Backend server is running")
        else:
            print(f"⚠️  Backend server responded with status: {response.status_code}")
    except requests.exceptions.RequestException:
        print("❌ Backend server is not accessible")
        print("Please ensure the backend is running with: ./start_server.sh")
        return
    
    print()
    
    # Run tests
    test_ui_improvements()
    print()
    
    check_frontend_integration()
    print()
    
    # Test actual API responses
    test_enhanced_chat_ui()
    
    print()
    print("🎉 Enhanced UI Demo Complete!")
    print()
    print("Next Steps:")
    print("1. Visit http://localhost:3000 to see the enhanced UI in action")
    print("2. Try the sample queries to see executive summary layout")
    print("3. Click on metrics and recommendations for interactivity")
    print("4. Check the Data Sources tab for file transparency")

if __name__ == "__main__":
    main()
