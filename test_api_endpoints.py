#!/usr/bin/env python3
"""
VegaKash API Endpoint Tester
Tests all API endpoints to identify issues
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

def test_endpoint(method, endpoint, data=None, params=None):
    """Test a single API endpoint"""
    url = f"{BASE_URL}{endpoint}"
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, params=params, timeout=5)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, timeout=5)
        elif method.upper() == "PUT":
            response = requests.put(url, json=data, timeout=5)
        elif method.upper() == "DELETE":
            response = requests.delete(url, timeout=5)
        else:
            return {"error": f"Unsupported method: {method}"}
        
        return {
            "status_code": response.status_code,
            "success": response.status_code < 400,
            "data": response.json() if response.headers.get('content-type') == 'application/json' else response.text,
            "url": url
        }
    except requests.exceptions.ConnectionError:
        return {"error": "Connection refused - backend not running", "url": url}
    except requests.exceptions.Timeout:
        return {"error": "Request timeout", "url": url}
    except Exception as e:
        return {"error": str(e), "url": url}

def run_api_tests():
    """Run comprehensive API endpoint tests"""
    print("🔍 VegaKash API Endpoint Tests")
    print("=" * 50)
    
    # Test 1: Health Check
    print("\n1. Testing Health Check...")
    result = test_endpoint("GET", "/health")
    print(f"   Status: {result.get('status_code', 'ERROR')}")
    if result.get('success'):
        print(f"   Response: {result['data']}")
    else:
        print(f"   Error: {result.get('error', 'Unknown error')}")
    
    # Test 2: Root Endpoint
    print("\n2. Testing Root Endpoint...")
    result = test_endpoint("GET", "/")
    print(f"   Status: {result.get('status_code', 'ERROR')}")
    if result.get('success'):
        print(f"   Message: {result['data'].get('message', 'No message')}")
    else:
        print(f"   Error: {result.get('error', 'Unknown error')}")
    
    # Test 3: Get Expenses (Empty)
    print("\n3. Testing Get All Expenses...")
    result = test_endpoint("GET", "/expenses")
    print(f"   Status: {result.get('status_code', 'ERROR')}")
    if result.get('success'):
        expenses = result['data']
        print(f"   Found {len(expenses)} expenses")
    else:
        print(f"   Error: {result.get('error', 'Unknown error')}")
    
    # Test 4: Create Expense
    print("\n4. Testing Create Expense...")
    test_expense = {
        "title": "API Test Expense",
        "category": "Testing",
        "amount": 100.50,
        "date": "2025-11-01",
        "description": "Test expense from API tester"
    }
    result = test_endpoint("POST", "/expenses", data=test_expense)
    print(f"   Status: {result.get('status_code', 'ERROR')}")
    
    expense_id = None
    if result.get('success'):
        expense_id = result['data'].get('id')
        print(f"   Created expense with ID: {expense_id}")
    else:
        print(f"   Error: {result.get('error', 'Unknown error')}")
    
    # Test 5: Get Single Expense (if created)
    if expense_id:
        print(f"\n5. Testing Get Single Expense (ID: {expense_id})...")
        result = test_endpoint("GET", f"/expenses/{expense_id}")
        print(f"   Status: {result.get('status_code', 'ERROR')}")
        if result.get('success'):
            print(f"   Title: {result['data'].get('title')}")
        else:
            print(f"   Error: {result.get('error', 'Unknown error')}")
    
    # Test 6: Update Expense (if created)
    if expense_id:
        print(f"\n6. Testing Update Expense (ID: {expense_id})...")
        update_data = {
            "title": "Updated API Test Expense",
            "amount": 150.75
        }
        result = test_endpoint("PUT", f"/expenses/{expense_id}", data=update_data)
        print(f"   Status: {result.get('status_code', 'ERROR')}")
        if result.get('success'):
            print(f"   Updated title: {result['data'].get('title')}")
        else:
            print(f"   Error: {result.get('error', 'Unknown error')}")
    
    # Test 7: Get Expenses with Filters
    print("\n7. Testing Get Expenses with Filters...")
    params = {
        "category": "Testing",
        "sort_by": "amount",
        "sort_order": "desc",
        "limit": 10
    }
    result = test_endpoint("GET", "/expenses", params=params)
    print(f"   Status: {result.get('status_code', 'ERROR')}")
    if result.get('success'):
        print(f"   Filtered results: {len(result['data'])} expenses")
    else:
        print(f"   Error: {result.get('error', 'Unknown error')}")
    
    # Test 8: Get Expense Stats
    print("\n8. Testing Expense Statistics...")
    result = test_endpoint("GET", "/expenses/stats/summary")
    print(f"   Status: {result.get('status_code', 'ERROR')}")
    if result.get('success'):
        stats = result['data']
        print(f"   Total expenses: {stats.get('total_expenses', 0)}")
        print(f"   Total amount: ₹{stats.get('total_amount', 0)}")
    else:
        print(f"   Error: {result.get('error', 'Unknown error')}")
    
    # Test 9: Get Categories
    print("\n9. Testing Get Categories...")
    result = test_endpoint("GET", "/expenses/categories/list")
    print(f"   Status: {result.get('status_code', 'ERROR')}")
    if result.get('success'):
        categories = result['data']
        print(f"   Categories: {', '.join(categories) if categories else 'None'}")
    else:
        print(f"   Error: {result.get('error', 'Unknown error')}")
    
    # Test 10: AI Insights
    print("\n10. Testing AI Insights...")
    result = test_endpoint("POST", "/ai/insights")
    print(f"    Status: {result.get('status_code', 'ERROR')}")
    if result.get('success'):
        insights = result['data']
        print(f"    Total spent: ₹{insights.get('total_spent', 0)}")
        print(f"    Top categories: {len(insights.get('top_categories', []))}")
    else:
        print(f"    Error: {result.get('error', 'Unknown error')}")
    
    # Test 11: Delete Expense (if created)
    if expense_id:
        print(f"\n11. Testing Delete Expense (ID: {expense_id})...")
        result = test_endpoint("DELETE", f"/expenses/{expense_id}")
        print(f"    Status: {result.get('status_code', 'ERROR')}")
        if result.get('success'):
            print(f"    Message: {result['data'].get('message', 'Deleted successfully')}")
        else:
            print(f"    Error: {result.get('error', 'Unknown error')}")
    
    print("\n" + "=" * 50)
    print("✅ API Endpoint Testing Complete!")
    print("\nIf you see connection errors, the backend server is not running.")
    print("The frontend uses localStorage fallback for offline functionality.")

if __name__ == "__main__":
    run_api_tests()