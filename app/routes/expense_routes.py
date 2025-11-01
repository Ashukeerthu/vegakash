from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, and_, or_
from app.schemas import ExpenseCreate, ExpenseOut, ExpenseUpdate
from app.models import Expense
from app.utils.database import get_db
from typing import List, Optional
from datetime import date, datetime

router = APIRouter()

@router.post("/expenses", response_model=ExpenseOut)
def create_expense(expense: ExpenseCreate, db: Session = Depends(get_db)):
    """Create a new expense entry."""
    try:
        db_expense = Expense(**expense.model_dump())
        db.add(db_expense)
        db.commit()
        db.refresh(db_expense)
        return db_expense
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error creating expense: {str(e)}")

@router.get("/expenses", response_model=List[ExpenseOut])
def get_expenses(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Number of records to return"),
    category: Optional[str] = Query(None, description="Filter by category"),
    date_from: Optional[date] = Query(None, description="Filter expenses from this date"),
    date_to: Optional[date] = Query(None, description="Filter expenses to this date"),
    min_amount: Optional[float] = Query(None, ge=0, description="Minimum amount filter"),
    max_amount: Optional[float] = Query(None, ge=0, description="Maximum amount filter"),
    search: Optional[str] = Query(None, description="Search in title and description"),
    sort_by: str = Query("date", description="Sort by field (date, amount, title)"),
    sort_order: str = Query("desc", description="Sort order (asc, desc)")
):
    """Get expenses with filtering, pagination, and sorting."""
    try:
        query = db.query(Expense)
        
        # Apply filters
        if category:
            query = query.filter(Expense.category.ilike(f"%{category}%"))
        
        if date_from:
            query = query.filter(Expense.date >= date_from)
            
        if date_to:
            query = query.filter(Expense.date <= date_to)
            
        if min_amount is not None:
            query = query.filter(Expense.amount >= min_amount)
            
        if max_amount is not None:
            query = query.filter(Expense.amount <= max_amount)
            
        if search:
            search_filter = or_(
                Expense.title.ilike(f"%{search}%"),
                Expense.description.ilike(f"%{search}%")
            )
            query = query.filter(search_filter)
        
        # Apply sorting
        sort_column = getattr(Expense, sort_by, Expense.date)
        if sort_order.lower() == "asc":
            query = query.order_by(asc(sort_column))
        else:
            query = query.order_by(desc(sort_column))
        
        # Apply pagination
        expenses = query.offset(skip).limit(limit).all()
        return expenses
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching expenses: {str(e)}")

@router.get("/expenses/{expense_id}", response_model=ExpenseOut)
def get_expense(expense_id: int, db: Session = Depends(get_db)):
    """Get a specific expense by ID."""
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense

@router.put("/expenses/{expense_id}", response_model=ExpenseOut)
def update_expense(expense_id: int, expense_update: ExpenseUpdate, db: Session = Depends(get_db)):
    """Update an existing expense."""
    try:
        expense = db.query(Expense).filter(Expense.id == expense_id).first()
        if not expense:
            raise HTTPException(status_code=404, detail="Expense not found")
        
        # Update only provided fields
        update_data = expense_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(expense, field, value)
        
        db.commit()
        db.refresh(expense)
        return expense
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error updating expense: {str(e)}")

@router.delete("/expenses/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    """Delete an expense."""
    try:
        expense = db.query(Expense).filter(Expense.id == expense_id).first()
        if not expense:
            raise HTTPException(status_code=404, detail="Expense not found")
        
        db.delete(expense)
        db.commit()
        return {"message": "Expense deleted successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error deleting expense: {str(e)}")

@router.get("/expenses/stats/summary")
def get_expense_summary(db: Session = Depends(get_db)):
    """Get expense summary statistics."""
    try:
        expenses = db.query(Expense).all()
        
        if not expenses:
            return {
                "total_expenses": 0,
                "total_amount": 0.0,
                "average_amount": 0.0,
                "categories": [],
                "expense_count": 0
            }
        
        total_amount = sum(expense.amount for expense in expenses)
        average_amount = total_amount / len(expenses)
        
        # Category breakdown
        categories = {}
        for expense in expenses:
            if expense.category in categories:
                categories[expense.category]["count"] += 1
                categories[expense.category]["amount"] += expense.amount
            else:
                categories[expense.category] = {
                    "count": 1,
                    "amount": expense.amount
                }
        
        return {
            "total_expenses": len(expenses),
            "total_amount": total_amount,
            "average_amount": average_amount,
            "categories": categories,
            "expense_count": len(expenses)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting expense summary: {str(e)}")

@router.get("/expenses/categories/list")
def get_categories(db: Session = Depends(get_db)):
    """Get list of all unique categories."""
    try:
        categories = db.query(Expense.category).distinct().all()
        return [cat[0] for cat in categories if cat[0]]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching categories: {str(e)}")