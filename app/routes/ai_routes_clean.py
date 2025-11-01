from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.models import Expense
from app.utils.database import get_db
from app.schemas import InsightData
import json
import os
from typing import List, Dict, Any
from datetime import datetime, timedelta
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

def generate_fallback_insights(expenses, category_totals, total_spent):
    """Generate rule-based insights when AI is not available."""
    avg_amount = total_spent / len(expenses) if expenses else 0
    
    # Generate patterns
    patterns = [
        f"You've made {len(expenses)} expense entries",
        f"Average expense amount: ₹{avg_amount:.2f}",
    ]
    
    if category_totals:
        top_category = max(category_totals.items(), key=lambda x: x[1])
        patterns.append(f"Most frequent category: {top_category[0]} (₹{top_category[1]:.2f})")
    
    # Generate outliers
    outliers = []
    if expenses:
        amounts = [e.amount for e in expenses]
        max_amount = max(amounts)
        if max_amount > avg_amount * 3:
            outliers.append(f"High expense detected: ₹{max_amount:.2f}")
        
        # Check for categories with high spending
        for category, amount in category_totals.items():
            if amount > total_spent * 0.4:  # More than 40% of total
                outliers.append(f"High spending in {category}: ₹{amount:.2f}")
    
    if not outliers:
        outliers = ["No unusual spending patterns detected"]
    
    # Generate suggestions
    suggestions = [
        "Track your expenses consistently for better insights",
        "Consider setting category-wise budgets",
        "Review your highest expense categories for potential savings"
    ]
    
    if category_totals:
        for category, amount in sorted(category_totals.items(), key=lambda x: x[1], reverse=True)[:2]:
            suggestions.append(f"Look for alternatives in {category} to reduce ₹{amount:.2f} spending")
    
    return {
        "patterns": patterns,
        "outliers": outliers,
        "suggestions": suggestions[:5]  # Limit to 5 suggestions
    }

# Initialize OpenAI client only if API key is available
openai_client = None
openai_available = False

if os.getenv("OPENAI_API_KEY"):
    try:
        from openai import OpenAI
        openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        openai_available = True
        logger.info("✅ OpenAI client initialized successfully")
    except ImportError as e:
        logger.warning(f"❌ OpenAI library not available: {e}")
        openai_client = None
        openai_available = False
    except Exception as e:
        logger.error(f"❌ Error initializing OpenAI client: {e}")
        openai_client = None
        openai_available = False
else:
    logger.warning("❌ OPENAI_API_KEY not found in environment variables")

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
        if openai_available and openai_client:
            try:
                # Enhanced prompt for better insights
                prompt = f"""
                You are an expert financial advisor analyzing personal expense data. 
                Analyze the following expense data and provide actionable insights.
                
                EXPENSE DATA SUMMARY:
                - Total Amount Spent: ₹{total_spent:.2f}
                - Number of Transactions: {len(expenses)}
                - Time Period: {expenses[0].date} to {expenses[-1].date}
                - Top Categories: {', '.join([cat.split(':')[0] for cat in top_categories[:3]])}
                
                DETAILED TRANSACTIONS:
                {json.dumps(data[:10], indent=2)}
                
                Please provide insights in the following JSON format ONLY:
                {{
                  "patterns": [
                    "3-5 specific spending pattern observations with amounts and frequencies",
                    "Include trends, seasonal patterns, or behavioral insights"
                  ],
                  "outliers": [
                    "Unusual expenses or irregular spending behaviors",
                    "High-value transactions that stand out",
                    "Categories with unexpected amounts"
                  ],
                  "suggestions": [
                    "Specific actionable money-saving recommendations",
                    "Budget optimization strategies based on actual data",
                    "Behavioral changes that could reduce spending",
                    "Category-specific advice with potential savings amounts"
                  ]
                }}
                
                Focus on:
                1. Specific amounts and percentages where relevant
                2. Actionable advice rather than generic tips
                3. Pattern recognition based on actual data
                4. Realistic savings opportunities
                
                Return ONLY the JSON object, no additional text or formatting.
                """

                response = openai_client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {
                            "role": "system", 
                            "content": "You are a professional financial advisor. Analyze expense data and provide specific, actionable insights in JSON format only."
                        },
                        {
                            "role": "user", 
                            "content": prompt
                        }
                    ],
                    temperature=0.3,
                    max_tokens=1200
                )

                ai_content = response.choices[0].message.content.strip()
                
                # Clean the response to ensure it's valid JSON
                if ai_content.startswith('```json'):
                    ai_content = ai_content.replace('```json', '').replace('```', '').strip()
                
                # Try to parse AI response as JSON
                try:
                    ai_insights = json.loads(ai_content)
                    
                    # Validate structure
                    if not all(key in ai_insights for key in ['patterns', 'outliers', 'suggestions']):
                        raise ValueError("Invalid response structure")
                    
                except (json.JSONDecodeError, ValueError) as e:
                    logger.error(f"AI response parsing error: {e}")
                    ai_insights = generate_fallback_insights(expenses, category_totals, total_spent)
                
                return InsightData(
                    total_spent=total_spent,
                    top_categories=top_categories,
                    patterns=ai_insights.get("patterns", ["No patterns detected"]),
                    outliers=ai_insights.get("outliers", ["No outliers detected"]),
                    suggestions=ai_insights.get("suggestions", ["No suggestions available"])
                )
                
            except Exception as e:
                logger.error(f"OpenAI API error: {e}")
                # Fallback to rule-based insights
                pass
        
        # Fallback: Generate rule-based insights
        ai_insights = generate_fallback_insights(expenses, category_totals, total_spent)
        
        return InsightData(
            total_spent=total_spent,
            top_categories=top_categories,
            patterns=ai_insights.get("patterns", ["No patterns detected"]),
            outliers=ai_insights.get("outliers", ["No outliers detected"]),
            suggestions=ai_insights.get("suggestions", ["No suggestions available"])
        )
        
    except Exception as e:
        logger.error(f"Error generating insights: {str(e)}")
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
        logger.error(f"Error getting spending trends: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting spending trends: {str(e)}")

@router.post("/ai/savings-suggestions")
def generate_savings_suggestions(db: Session = Depends(get_db)):
    """Generate AI-powered savings suggestions based on expense patterns."""
    try:
        expenses = db.query(Expense).all()
        
        if not expenses:
            return {
                "suggestions": ["Start tracking expenses to get personalized savings suggestions"],
                "potential_savings": 0,
                "priority_areas": []
            }
        
        # Calculate category spending
        category_totals = {}
        monthly_expenses = {}
        
        for expense in expenses:
            category_totals[expense.category] = category_totals.get(expense.category, 0) + expense.amount
            month_key = expense.date.strftime("%Y-%m")
            if month_key not in monthly_expenses:
                monthly_expenses[month_key] = 0
            monthly_expenses[month_key] += expense.amount
        
        total_spent = sum(expense.amount for expense in expenses)
        avg_monthly = sum(monthly_expenses.values()) / len(monthly_expenses) if monthly_expenses else 0
        
        # Prepare data for AI
        expense_data = {
            "total_spent": total_spent,
            "average_monthly": avg_monthly,
            "top_categories": dict(sorted(category_totals.items(), key=lambda x: x[1], reverse=True)[:5]),
            "monthly_breakdown": monthly_expenses,
            "expense_count": len(expenses)
        }
        
        # Try to use OpenAI for savings suggestions
        if openai_available and openai_client:
            try:
                prompt = f"""
                As a financial advisor, analyze this expense data and provide specific savings recommendations:
                
                FINANCIAL OVERVIEW:
                - Total Spending: ₹{total_spent:.2f}
                - Average Monthly: ₹{avg_monthly:.2f}
                - Top Categories: {json.dumps(expense_data['top_categories'], indent=2)}
                
                Provide savings suggestions in this JSON format:
                {{
                  "suggestions": [
                    "Specific, actionable savings tips with estimated amounts",
                    "Category-specific recommendations",
                    "Behavioral changes with financial impact"
                  ],
                  "potential_savings": "Total estimated monthly savings amount (number only)",
                  "priority_areas": [
                    "Categories or behaviors to focus on first"
                  ]
                }}
                
                Focus on realistic, achievable savings with specific amounts.
                """
                
                response = openai_client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are a financial advisor providing specific savings recommendations. Return only JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.2,
                    max_tokens=800
                )
                
                ai_content = response.choices[0].message.content.strip()
                
                # Clean response
                if ai_content.startswith('```json'):
                    ai_content = ai_content.replace('```json', '').replace('```', '').strip()
                
                try:
                    savings_data = json.loads(ai_content)
                    return savings_data
                except json.JSONDecodeError:
                    pass
                    
            except Exception as e:
                logger.error(f"OpenAI API error for savings: {e}")
        
        # Fallback savings suggestions
        suggestions = []
        potential_savings = 0
        priority_areas = []
        
        # Analyze top spending categories
        sorted_categories = sorted(category_totals.items(), key=lambda x: x[1], reverse=True)
        
        for category, amount in sorted_categories[:3]:
            percentage = (amount / total_spent) * 100
            if percentage > 30:
                suggestions.append(f"High spending in {category} (₹{amount:.2f}, {percentage:.1f}% of total). Consider reducing by 10-15%.")
                potential_savings += amount * 0.1
                priority_areas.append(category)
            elif percentage > 20:
                suggestions.append(f"{category} spending could be optimized. Potential savings: ₹{amount * 0.05:.2f}")
                potential_savings += amount * 0.05
        
        # Add general suggestions
        if avg_monthly > 0:
            suggestions.extend([
                f"Set a monthly budget of ₹{avg_monthly * 0.9:.2f} (10% reduction)",
                "Track daily expenses to identify impulse purchases",
                "Review subscriptions and recurring payments"
            ])
        
        return {
            "suggestions": suggestions[:5],
            "potential_savings": round(potential_savings, 2),
            "priority_areas": priority_areas[:3]
        }
        
    except Exception as e:
        logger.error(f"Error generating savings suggestions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating savings suggestions: {str(e)}")

@router.post("/ai/chat")
def chat_with_ai(message: str = Query(..., description="The chat message from user"), db: Session = Depends(get_db)):
    """Enhanced AI Financial Specialist - Comprehensive financial advisor with improved error handling."""
    try:
        logger.info(f"🤖 Chat request received: '{message}'")
        
        # Get user's expense data for context
        expenses = db.query(Expense).all()
        logger.info(f"📊 Found {len(expenses)} expenses in database")
        
        # Prepare comprehensive financial context
        financial_context = ""
        if expenses:
            total_spent = sum(e.amount for e in expenses)
            category_totals = {}
            monthly_trends = {}
            
            for expense in expenses:
                category_totals[expense.category] = category_totals.get(expense.category, 0) + expense.amount
                month_key = expense.date.strftime("%Y-%m")
                monthly_trends[month_key] = monthly_trends.get(month_key, 0) + expense.amount
            
            top_categories = sorted(category_totals.items(), key=lambda x: x[1], reverse=True)[:5]
            avg_monthly = sum(monthly_trends.values()) / max(len(monthly_trends), 1)
            
            financial_context = f"""
            USER'S FINANCIAL PROFILE:
            💰 Total Expenses Tracked: ₹{total_spent:,.2f}
            📊 Number of Transactions: {len(expenses)}
            📈 Average Monthly Spending: ₹{avg_monthly:,.2f}
            🏆 Top Spending Categories: {', '.join([f"{cat}: ₹{amount:,.2f}" for cat, amount in top_categories[:3]])}
            📅 Tracking Period: {expenses[0].date.strftime('%b %Y')} to {expenses[-1].date.strftime('%b %Y')}
            📋 Active Categories: {len(category_totals)} different expense types
            """
            logger.info(f"💼 User financial context prepared - Total: ₹{total_spent:,.2f}, Categories: {len(category_totals)}")
        else:
            financial_context = "USER'S FINANCIAL PROFILE: New user - No expense tracking data available yet."
            logger.info("👤 New user - no expense data available")
        
        # Try to use OpenAI if available for comprehensive financial advice
        if openai_available and openai_client:
            try:
                logger.info("🤖 Sending request to OpenAI GPT-3.5-turbo")
                
                enhanced_prompt = f"""
                You are VegaKash AI - A Comprehensive Personal Finance Specialist & Investment Advisor.
                
                EXPERTISE AREAS:
                ✓ Expense Management & Budgeting
                ✓ Investment Planning & Portfolio Management  
                ✓ Credit Management & Debt Optimization
                ✓ ROI Analysis & Financial Planning
                ✓ Tax Planning & Savings Strategies
                ✓ Insurance & Risk Management
                ✓ Retirement & Long-term Financial Goals
                
                {financial_context}
                
                USER QUERY: "{message}"
                
                RESPONSE GUIDELINES:
                1. 📊 CONCISE ADVICE: Keep responses to 3-4 key points maximum (150 words)
                2. 🎯 PERSONALIZED: Use their actual expense data when relevant
                3. 💡 ACTIONABLE: Give specific, implementable recommendations
                4. 📈 STRATEGIC: Focus on immediate actionable steps
                5. 🔢 QUANTITATIVE: Include 1-2 key numbers when helpful
                6. 🏆 PROFESSIONAL: Respond as a certified financial planner would
                7. 📞 FOLLOW-UP: End with "For detailed planning, call our toll-free: 1800-VEGAKASH (1800-834-2527)"
                8. ⚠️ PRACTICAL: Consider Indian financial context (₹, tax rules, investment options)
                
                RESPONSE FORMAT:
                • Keep responses under 150 words
                • Use bullet points for clarity
                • End with toll-free number for detailed consultation
                • Focus on 2-3 most important points only
                
                TOPICS YOU CAN HANDLE:
                • Expense tracking, budgeting, cost optimization
                • Investment options (SIP, mutual funds, stocks, FD, bonds)
                • Credit cards, loans, EMI planning, credit score improvement
                • ROI calculations, compound interest, financial projections
                • Tax saving (80C, ELSS, PPF), tax planning strategies
                • Emergency funds, insurance planning, risk assessment
                • Retirement planning, wealth creation, financial independence
                • Specific Indian financial products and regulations
                
                Provide detailed, professional financial advice with specific recommendations and action steps.
                """
                
                response = openai_client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {
                            "role": "system", 
                            "content": """You are VegaKash AI, a concise Personal Finance Specialist with expertise in:
                            - Expense Management & Smart Budgeting
                            - Investment Planning & Portfolio Management
                            - Credit Optimization & Debt Management  
                            - ROI Analysis & Financial Projections
                            - Tax Planning & Wealth Building Strategies
                            - Insurance & Risk Management
                            - Indian Financial Markets & Regulations
                            
                            IMPORTANT: Keep responses under 150 words with 2-3 key points only. 
                            Always end with: "For detailed planning, call our toll-free: 1800-VEGAKASH (1800-834-2527)"
                            Provide expert-level but concise financial advice with specific recommendations."""
                        },
                        {
                            "role": "user", 
                            "content": enhanced_prompt
                        }
                    ],
                    temperature=0.3,  # Lower temperature for more consistent financial advice
                    max_tokens=200    # Reduced token limit for concise chat responses
                )
                
                ai_response = response.choices[0].message.content.strip()
                logger.info(f"✅ OpenAI response received: {len(ai_response)} characters")
                
                return {
                    "response": ai_response,
                    "timestamp": datetime.now().isoformat(),
                    "context_available": bool(expenses),
                    "specialist_mode": "ai_powered",
                    "response_type": "comprehensive_financial_advice"
                }
                
            except Exception as e:
                logger.error(f"❌ OpenAI API error for financial specialist chat: {e}")
                # Continue to fallback
        
        logger.info("📱 Using enhanced fallback responses")
        
        # Enhanced fallback responses with comprehensive financial advice
        message_lower = message.lower()
        
        # Investment-related queries
        if any(word in message_lower for word in ["invest", "investment", "mutual fund", "sip", "stock", "portfolio", "return"]):
            if expenses:
                monthly_avg = sum(monthly_trends.values()) / max(len(monthly_trends), 1)
                potential_savings = monthly_avg * 0.2  # Suggest 20% savings
                response_text = f"""💼 INVESTMENT ADVICE:

Based on your ₹{monthly_avg:,.0f} monthly spending, start investing ₹{potential_savings:,.0f} (20%):

🎯 QUICK START:
• SIP in Equity Mutual Funds: ₹{potential_savings*0.7:,.0f}/month
• ELSS for Tax Saving: ₹{min(12500, potential_savings*0.3):,.0f}/month

📈 POTENTIAL: ₹{potential_savings * 12 * 10:,.0f} in 10 years @ 12% returns

📞 For detailed portfolio planning, call our toll-free: 1800-VEGAKASH (1800-834-2527)"""
            else:
                response_text = """💼 INVESTMENT STARTER GUIDE:

🎯 BEGIN WITH:
• Emergency Fund: 6 months expenses
• SIP in Equity Funds: ₹3,000-5,000/month  
• ELSS for tax saving: ₹12,500/month

Start tracking expenses to determine investment capacity!

📞 For personalized investment planning, call our toll-free: 1800-VEGAKASH (1800-834-2527)"""
        
        # Credit and debt management
        elif any(word in message_lower for word in ["credit", "loan", "emi", "debt", "credit card", "interest"]):
            response_text = """💳 CREDIT OPTIMIZATION:

🎯 KEY RULES:
• Keep credit utilization <30%
• Pay full amount, never minimum
• Check credit score quarterly (free on CIBIL)
• Total EMIs <40% of income

🏆 QUICK WINS:
• Set auto-pay for all bills
• Request credit limit increase
• Keep old cards active

📞 For detailed debt strategy, call our toll-free: 1800-VEGAKASH (1800-834-2527)"""
        
        # ROI and calculations
        elif any(word in message_lower for word in ["roi", "return", "calculation", "compound", "interest", "growth"]):
            response_text = """📈 ROI QUICK GUIDE:

🎯 EXPECTED RETURNS:
• FD/Savings: 3-6% (Safe)
• Debt Funds: 6-9% (Stable)
• Equity Funds: 12-15% (Growth)

💰 POWER OF SIP:
₹10K monthly @ 12% = ₹23L in 10 years

📊 KEY: Start early, stay consistent, rebalance annually

📞 For detailed ROI analysis, call our toll-free: 1800-VEGAKASH (1800-834-2527)"""
        
        # Tax planning
        elif any(word in message_lower for word in ["tax", "80c", "elss", "ppf", "deduction", "saving"]):
            response_text = """🎯 TAX SAVING ESSENTIALS:

💰 SECTION 80C (₹1.5L limit):
• ELSS: Best growth + tax saving
• PPF: 15-year safe option
• Home loan principal counts

📊 OTHER DEDUCTIONS:
• 80D: Health insurance (₹25K-50K)
• NPS: Extra ₹50K deduction

💡 TIP: Start ELSS SIP in January for full benefit!

📞 For complete tax strategy, call our toll-free: 1800-VEGAKASH (1800-834-2527)"""
        
        # General spending and budgeting
        elif any(word in message_lower for word in ["spending", "expense", "budget", "save", "money", "month"]):
            if expenses:
                total = sum(e.amount for e in expenses)
                top_cat = max(category_totals.items(), key=lambda x: x[1])
                monthly_avg = sum(monthly_trends.values()) / max(len(monthly_trends), 1)
                
                response_text = f"""💰 YOUR SPENDING SNAPSHOT:

📊 CURRENT STATUS:
• Total Expenses: ₹{total:,.0f}
• Monthly Average: ₹{monthly_avg:,.0f}
• Top Category: {top_cat[0]} (₹{top_cat[1]:,.0f})

🎯 50/30/20 RULE:
• Needs: ₹{monthly_avg*0.5:,.0f} | Wants: ₹{monthly_avg*0.3:,.0f} | Savings: ₹{monthly_avg*0.2:,.0f}

💡 Focus on optimizing {top_cat[0]} expenses first!

📞 For detailed budget planning, call our toll-free: 1800-VEGAKASH (1800-834-2527)"""
            else:
                response_text = """💰 BUDGET BASICS:

🎯 START WITH:
• Track expenses for 3 months
• Follow 50/30/20 rule
• Automate savings first
• Build emergency fund

💡 QUICK TIPS:
• Cook home 70% time
• Use cashback cards wisely
• Compare before big purchases

📞 For personalized budgeting, call our toll-free: 1800-VEGAKASH (1800-834-2527)"""
        
        # General financial advice
        else:
            response_text = """🎯 FINANCIAL GUIDANCE MENU:

💰 I can help with:
• Budget planning & expense tracking
• Investment strategies (SIP, mutual funds)
• Credit score & debt management
• Tax saving (80C, ELSS, PPF)
• ROI calculations & planning

💡 POPULAR TOPICS:
• "How to start investing?"
• "Improve credit score"
• "Tax saving options"
• "Budget planning tips"

📞 For detailed financial planning, call our toll-free: 1800-VEGAKASH (1800-834-2527)"""
        
        logger.info(f"✅ Fallback response generated: {len(response_text)} characters")
        
        return {
            "response": response_text,
            "timestamp": datetime.now().isoformat(),
            "context_available": bool(expenses),
            "specialist_mode": "enhanced_fallback",
            "response_type": "comprehensive_financial_advice"
        }
        
    except Exception as e:
        logger.error(f"❌ Error in financial specialist chat: {str(e)}")
        error_response = {
            "response": f"I apologize, but I encountered an error processing your request: {str(e)}\n\nPlease try again or contact our support team.\n\n📞 For immediate assistance, call our toll-free: 1800-VEGAKASH (1800-834-2527)",
            "timestamp": datetime.now().isoformat(),
            "context_available": False,
            "specialist_mode": "error_fallback",
            "response_type": "error_message"
        }
        return error_response