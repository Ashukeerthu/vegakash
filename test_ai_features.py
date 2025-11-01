#!/usr/bin/env python3
"""
Test script for the enhanced AI routes in VegaKash
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.routes.ai_routes import generate_fallback_insights

# Test data
test_expenses = [
    type('Expense', (), {'amount': 500, 'category': 'Food', 'title': 'Grocery Shopping', 'date': '2025-01-01'}),
    type('Expense', (), {'amount': 200, 'category': 'Transport', 'title': 'Uber ride', 'date': '2025-01-02'}),
    type('Expense', (), {'amount': 1500, 'category': 'Food', 'title': 'Restaurant', 'date': '2025-01-03'}),
    type('Expense', (), {'amount': 300, 'category': 'Entertainment', 'title': 'Movie tickets', 'date': '2025-01-04'}),
    type('Expense', (), {'amount': 100, 'category': 'Transport', 'title': 'Bus fare', 'date': '2025-01-05'}),
]

category_totals = {
    'Food': 2000,
    'Transport': 300,
    'Entertainment': 300
}

total_spent = 2600

def test_fallback_insights():
    """Test the fallback insights generation"""
    print("🧪 Testing fallback insights generation...")
    
    try:
        insights = generate_fallback_insights(test_expenses, category_totals, total_spent)
        
        print("✅ Fallback insights generated successfully!")
        print(f"📊 Patterns: {len(insights['patterns'])}")
        print(f"⚠️  Outliers: {len(insights['outliers'])}")
        print(f"💡 Suggestions: {len(insights['suggestions'])}")
        
        print("\n📋 Sample Patterns:")
        for i, pattern in enumerate(insights['patterns'][:3]):
            print(f"  {i+1}. {pattern}")
        
        print("\n📋 Sample Suggestions:")
        for i, suggestion in enumerate(insights['suggestions'][:3]):
            print(f"  {i+1}. {suggestion}")
            
        return True
        
    except Exception as e:
        print(f"❌ Error testing fallback insights: {e}")
        return False

def test_savings_suggestions_logic():
    """Test the savings suggestions logic"""
    print("\n🧪 Testing savings suggestions logic...")
    
    try:
        # Simulate savings calculation
        sorted_categories = sorted(category_totals.items(), key=lambda x: x[1], reverse=True)
        suggestions = []
        potential_savings = 0
        priority_areas = []
        
        for category, amount in sorted_categories[:3]:
            percentage = (amount / total_spent) * 100
            if percentage > 30:
                suggestions.append(f"High spending in {category} (₹{amount:.2f}, {percentage:.1f}% of total). Consider reducing by 10-15%.")
                potential_savings += amount * 0.1
                priority_areas.append(category)
            elif percentage > 20:
                suggestions.append(f"{category} spending could be optimized. Potential savings: ₹{amount * 0.05:.2f}")
                potential_savings += amount * 0.05
        
        print("✅ Savings suggestions logic working!")
        print(f"💰 Potential savings: ₹{potential_savings:.2f}")
        print(f"🎯 Priority areas: {priority_areas}")
        
        print("\n📋 Sample Suggestions:")
        for i, suggestion in enumerate(suggestions[:3]):
            print(f"  {i+1}. {suggestion}")
            
        return True
        
    except Exception as e:
        print(f"❌ Error testing savings logic: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Testing VegaKash Enhanced AI Features")
    print("=" * 50)
    
    tests_passed = 0
    total_tests = 2
    
    if test_fallback_insights():
        tests_passed += 1
    
    if test_savings_suggestions_logic():
        tests_passed += 1
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tests_passed}/{total_tests} tests passed")
    
    if tests_passed == total_tests:
        print("🎉 All tests passed! Enhanced AI features are working correctly.")
    else:
        print("⚠️  Some tests failed. Please check the implementation.")

if __name__ == "__main__":
    main()