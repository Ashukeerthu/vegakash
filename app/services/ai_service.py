from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.models import Expense
from app.utils.database import get_db
import json
import os
from typing import List

router = APIRouter()

# Initialize OpenAI client only if API key is available
openai_client = None
if os.getenv("OPENAI_API_KEY"):
    try:
        from openai import OpenAI
        openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    except ImportError:
        print("OpenAI library not available")
        openai_client = None

@router.post("/ai/insights")
def generate_insights(db: Session = Depends(get_db)):
    expenses = db.query(Expense).all()
    
    if not expenses:
        return {
            "total_spent": 0,
            "top_categories": [],
            "patterns": ["No spending data available yet"],
            "outliers": [],
            "suggestions": ["Start adding expenses to get personalized insights"]
        }
    
    # Calculate total spent
    total_spent = sum(expense.amount for expense in expenses)
    
    # Get top categories
    category_totals = {}
    for expense in expenses:
        category_totals[expense.category] = category_totals.get(expense.category, 0) + expense.amount
    
    top_categories = sorted(category_totals.items(), key=lambda x: x[1], reverse=True)[:3]
    top_categories = [f"{cat}: ₹{amount:.2f}" for cat, amount in top_categories]
    
    # Prepare data for AI analysis
    data = [
        {
            "title": e.title,
            "category": e.category,
            "amount": e.amount,
            "date": e.date.isoformat(),
            "description": e.description or ""
        } for e in expenses
    ]

    # Try to use OpenAI if available
    if openai_client:
        try:
            prompt = f"""
            Analyze the following expense data and provide insights in JSON format.
            Return ONLY a JSON object with these exact keys:
            - "patterns": List of 3-5 spending pattern observations
            - "outliers": List of unusual expenses or spending behaviors
            - "suggestions": List of 3-5 actionable money-saving suggestions
            
            Expense data (Total: ₹{total_spent:.2f}):
            {json.dumps(data, indent=2)}
            
            Return only valid JSON without any markdown or explanations.
            """

            response = openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=1000
            )

            ai_content = response.choices[0].message.content.strip()
            
            # Try to parse AI response as JSON
            try:
                ai_insights = json.loads(ai_content)
            except json.JSONDecodeError:
                ai_insights = {
                    "patterns": ["Regular spending detected in your expense data"],
                    "outliers": ["No significant outliers detected"],
                    "suggestions": ["Track your expenses consistently for better insights"]
                }
            
            return {
                "total_spent": total_spent,
                "top_categories": top_categories,
                "patterns": ai_insights.get("patterns", ["No patterns detected"]),
                "outliers": ai_insights.get("outliers", ["No outliers detected"]),
                "suggestions": ai_insights.get("suggestions", ["No suggestions available"])
            }
            
        except Exception as e:
            print(f"OpenAI API Error: {e}")
    
    # Fallback response (basic analysis without AI)
    avg_expense = total_spent / len(expenses)
    most_frequent_category = max(category_totals, key=category_totals.get)
    
    # Basic pattern analysis
    patterns = [
        f"You've made {len(expenses)} expense entries",
        f"Average expense amount: ₹{avg_expense:.2f}",
        f"Most frequent category: {most_frequent_category}"
    ]
    
    # Basic outlier detection
    outliers = []
    for expense in expenses:
        if expense.amount > avg_expense * 2:
            outliers.append(f"High expense: {expense.title} (₹{expense.amount:.2f})")
    
    if not outliers:
        outliers = ["No significant outliers detected"]
    
    # Basic suggestions
    suggestions = [
        "Continue tracking your expenses for better insights",
        f"Consider setting a budget for {most_frequent_category}",
        "Review your spending patterns weekly",
        "Look for ways to reduce expenses in your top categories"
    ]
    
    return {
        "total_spent": total_spent,
        "top_categories": top_categories,
        "patterns": patterns[:5],  # Limit to 5 patterns
        "outliers": outliers[:5],  # Limit to 5 outliers
        "suggestions": suggestions[:5]  # Limit to 5 suggestions
    }