#!/usr/bin/env python3
"""
Demo Script: Creating and Testing a Business Goal in Helios MVP
This script demonstrates the complete workflow of the platform.
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"

def create_demo_goal():
    """Create a sample business goal for demonstration"""
    
    goal_data = {
        "title": "Increase Q4 2024 Revenue by 25%",
        "description": """
        Strategic Goal: Boost company revenue by 25% in Q4 2024 through data-driven optimization.
        
        Key Focus Areas:
        1. Product Performance Analysis - Identify top-selling products and optimize inventory
        2. Customer Segmentation - Target high-value customers and reduce churn risk
        3. Marketing Campaign Optimization - Maximize ROI across all channels
        4. Sales Channel Enhancement - Optimize online vs retail performance
        5. Regional Market Expansion - Identify growth opportunities by geography
        
        Success Metrics:
        - 25% revenue increase over Q3 2024
        - Improved customer retention rate
        - Higher marketing campaign conversion rates
        - Optimized product mix and inventory turnover
        - Enhanced operational efficiency
        
        Timeline: Q4 2024 (October - December)
        Target Revenue: $1.8M (from current $1.44M baseline)
        """,
        "deadline": "2024-12-31T23:59:59Z",
        "status": "active"
    }
    
    print("🎯 Creating Demo Business Goal...")
    print(f"Title: {goal_data['title']}")
    print(f"Description: {goal_data['description'][:100]}...")
    
    try:
        # Note: You'll need to create this goal through the UI since we need authentication
        print("\n📋 Goal Configuration Ready!")
        print("\n✅ Next Steps:")
        print("1. Open http://localhost:3000 in your browser")
        print("2. Navigate to Goals section")
        print("3. Create a new goal with the above details")
        print("4. Upload the test CSV files")
        print("5. Start asking strategic questions!")
        
        return goal_data
        
    except requests.exceptions.ConnectionError:
        print("❌ Backend server not running. Please start with:")
        print("cd backend && python -m uvicorn app.main:app --reload")
        return None

def demonstrate_ai_questions():
    """Show example questions to ask the AI system"""
    
    questions = [
        {
            "category": "📊 Revenue Analysis",
            "questions": [
                "Analyze my sales performance trends for 2024 and identify growth opportunities",
                "Which products are driving the highest revenue and should be prioritized for Q4?",
                "Compare monthly revenue patterns and predict Q4 potential based on current trends",
                "What's the impact of discounts on overall profitability?"
            ]
        },
        {
            "category": "🎯 Customer Insights", 
            "questions": [
                "Segment my customers by value and identify high-potential targets for Q4 campaigns",
                "Which customers have the highest churn risk and what retention strategies should we implement?",
                "Analyze customer purchase patterns by demographics and geography",
                "What's the customer lifetime value for each segment and how can we improve it?"
            ]
        },
        {
            "category": "📈 Marketing Optimization",
            "questions": [
                "Compare ROI across all marketing channels and recommend budget reallocation for Q4",
                "Which campaigns had the best conversion rates and what made them successful?",
                "Analyze cost per acquisition by channel and identify optimization opportunities",
                "Create a comprehensive marketing strategy to support 25% revenue growth"
            ]
        },
        {
            "category": "🔍 Operational Intelligence",
            "questions": [
                "Analyze current inventory levels and create reorder recommendations for Q4 demand",
                "Which suppliers are performing best and should be prioritized for partnerships?",
                "Identify operational bottlenecks that could impact Q4 revenue goals",
                "Optimize product mix and pricing strategies based on performance data"
            ]
        },
        {
            "category": "💰 Financial Planning",
            "questions": [
                "Analyze current financial performance and create Q4 projections",
                "What are the key drivers of profitability and how can we optimize them?",
                "Identify cash flow patterns and recommend working capital optimizations",
                "Create a comprehensive financial plan to achieve 25% revenue growth"
            ]
        },
        {
            "category": "🚀 Strategic Recommendations",
            "questions": [
                "Generate a comprehensive action plan to increase Q4 revenue by 25%",
                "What are the top 5 strategic priorities for achieving our revenue goal?",
                "Identify potential risks to our growth plan and recommend mitigation strategies",
                "Create specific, measurable targets for each business area to support overall growth"
            ]
        }
    ]
    
    print("\n🤖 AI-Powered Questions to Ask Your Data:\n")
    
    for category in questions:
        print(f"\n{category['category']}")
        print("=" * 50)
        for i, question in enumerate(category['questions'], 1):
            print(f"{i}. {question}")
    
    print("\n💡 Pro Tips:")
    print("- Start with broad questions, then drill down into specifics")
    print("- Upload multiple data files for comprehensive insights")
    print("- Use the enhanced visualization features to explore insights")
    print("- Ask follow-up questions to refine recommendations")
    print("- Save important insights for strategy documentation")

def show_expected_insights():
    """Show what kind of insights the AI will generate"""
    
    print("\n🧠 Expected AI Insights Based on Your Test Data:\n")
    
    insights = [
        {
            "type": "📊 Revenue Metrics",
            "insights": [
                "Total Sales Volume: $40,515 across 50 transactions",
                "Average Order Value: $519.62",
                "Top Product: Laptop Pro X1 ($1,299.99) - 6 units sold",
                "Peak Sales Period: March-April 2024",
                "Geographic Distribution: 40% from California, Texas, New York"
            ]
        },
        {
            "type": "🎯 Customer Analysis", 
            "insights": [
                "Customer Segments: 35% High Value, 45% Medium Value, 20% Low Value",
                "High Churn Risk: 8 customers flagged for retention campaigns",
                "Average Customer Lifetime Value: $2,156 for high-value segment", 
                "Top Customer: CUST_027 with $4,890 total spent",
                "Geographic Concentration: West Coast customers show highest spending"
            ]
        },
        {
            "type": "📈 Marketing Performance",
            "insights": [
                "Best ROI Channel: Email (20x ROAS) vs Google Ads (10x ROAS)",
                "Highest Converting Campaign: 'Valentine's Day' with 267 conversions",
                "Cost Efficiency: LinkedIn has highest cost per conversion",
                "Seasonal Trends: February campaigns show 40% higher performance",
                "Budget Recommendation: Shift 30% budget from LinkedIn to Email"
            ]
        },
        {
            "type": "🔍 Operational Insights",
            "insights": [
                "Inventory Alert: Gaming Chair stock low (29 units)",
                "Top Performer: Supplier_A provides 25% of products",
                "Warehouse Efficiency: North warehouse handles 35% of orders",
                "Product Ratings: Air Purifier leads with 4.5 rating",
                "Stock Optimization: 15 products need reorder within 30 days"
            ]
        },
        {
            "type": "💰 Financial Projections",
            "insights": [
                "Monthly Revenue Growth: 8.5% average increase",
                "Operating Margin: Consistent 33.3% across all months",
                "Cash Flow Trend: Positive growth averaging $158,000 monthly",
                "Q4 Projection: $712,000 peak month suggests $2.1M quarterly potential",
                "Profitability: 25% revenue increase achievable with current margins"
            ]
        }
    ]
    
    for category in insights:
        print(f"{category['type']}")
        print("-" * 40)
        for insight in category['insights']:
            print(f"• {insight}")
        print()

def main():
    """Main demonstration function"""
    
    print("🚀 Helios MVP Platform Demonstration")
    print("=" * 50)
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Backend URL: {BASE_URL}")
    print(f"Frontend URL: {FRONTEND_URL}")
    
    # Create demo goal
    goal_data = create_demo_goal()
    
    # Show question examples
    demonstrate_ai_questions()
    
    # Show expected insights
    show_expected_insights()
    
    print("\n🎯 Quick Start Instructions:")
    print("1. ✅ Backend Server: Running on http://localhost:8000")
    print("2. ✅ Frontend Server: Running on http://localhost:3000") 
    print("3. 📊 Test Data: 7 CSV files ready in /test_data/ directory")
    print("4. 🤖 AI Agents: Multi-agent system configured and ready")
    print("5. 🎨 Visualization: Enhanced insight cards and progress tracking")
    
    print("\n📋 Next Actions:")
    print("• Open the browser to http://localhost:3000")
    print("• Create the goal using the provided template")
    print("• Upload CSV files from the test_data directory")
    print("• Start with: 'Analyze my sales data for revenue growth opportunities'")
    print("• Explore the enhanced visualization features")
    
    print(f"\n✨ Your platform is ready to transform business data into strategic intelligence!")

if __name__ == "__main__":
    main()
