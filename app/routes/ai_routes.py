from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models import Expense
from app.utils.database import get_db
from app.schemas import InsightData
import json
import os
from typing import List, Dict, Any
from datetime import datetime, timedelta

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

@router.post("/ai/insights", response_model=InsightData)
def generate_insights(db: Session = Depends(get_db)):
    """Generate AI-powered financial insights from expense data."""
    try:
        expenses = db.query(Expense).all()
        
        if not expenses:
            return InsightData(
                total_spent=0.0,
                top_categories=[],
                patterns=["No spending data available yet"],
                outliers=[],
                suggestions=["Start adding expenses to get personalized insights"]
            )
        
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
                
                return InsightData(
                    total_spent=total_spent,
                    top_categories=top_categories,
                    patterns=ai_insights.get("patterns", ["No patterns detected"]),
                    outliers=ai_insights.get("outliers", ["No outliers detected"]),
                    suggestions=ai_insights.get("suggestions", ["No suggestions available"])
                )
                
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
        
        return InsightData(
            total_spent=total_spent,
            top_categories=top_categories,
            patterns=patterns[:5],
            outliers=outliers[:5],
            suggestions=suggestions[:5]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating insights: {str(e)}")

@router.get("/ai/spending-trends")
def get_spending_trends(days: int = 30, db: Session = Depends(get_db)):
    """Get spending trends over the specified number of days."""
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        expenses = db.query(Expense).filter(
            Expense.date >= start_date.date(),
            Expense.date <= end_date.date()
        ).all()
        
        # Group by date
        daily_spending = {}
        for expense in expenses:
            date_str = expense.date.isoformat()
            daily_spending[date_str] = daily_spending.get(date_str, 0) + expense.amount
        
        # Group by category for the period
        category_spending = {}
        for expense in expenses:
            category_spending[expense.category] = category_spending.get(expense.category, 0) + expense.amount
        
        return {
            "period_days": days,
            "total_expenses": len(expenses),
            "total_amount": sum(expense.amount for expense in expenses),
            "daily_spending": daily_spending,
            "category_breakdown": category_spending,
            "average_daily": sum(daily_spending.values()) / max(len(daily_spending), 1)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting spending trends: {str(e)}")