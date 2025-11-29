"""
Test management routes
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from typing import List
import pandas as pd
import io

from models import Test, TestCreate, TestResult, TestSubmit, TestQuestion
from services.auth_service import get_current_user
from services.participant_service import get_or_create_participant_access
from utils import db

router = APIRouter(prefix="/tests", tags=["tests"])


@router.get("/program/{program_id}", response_model=List[Test])
async def get_tests_by_program(program_id: str, current_user = Depends(get_current_user)):
    """Get all tests for a program"""
    tests = await db.tests.find({"program_id": program_id}, {"_id": 0}).to_list(100)
    from datetime import datetime
    for test in tests:
        if isinstance(test.get('created_at'), str):
            test['created_at'] = datetime.fromisoformat(test['created_at'])
    return tests


@router.post("", response_model=Test)
async def create_test(test_data: TestCreate, current_user = Depends(get_current_user)):
    """Create a new test"""
    if current_user.role not in ["admin", "assistant_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can create tests")
    
    test_obj = Test(
        program_id=test_data.program_id,
        title=test_data.title,
        test_type=test_data.test_type,
        questions=test_data.questions
    )
    doc = test_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.tests.insert_one(doc)
    return test_obj


@router.post("/submit", response_model=TestResult)
async def submit_test(submission: TestSubmit, current_user = Depends(get_current_user)):
    """Submit test answers and calculate score"""
    if current_user.role != "participant":
        raise HTTPException(status_code=403, detail="Only participants can submit tests")
    
    test = await db.tests.find_one({"id": submission.test_id}, {"_id": 0})
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    correct_answers = 0
    total_questions = len(test['questions'])
    
    for i, question in enumerate(test['questions']):
        if i < len(submission.answers) and submission.answers[i] == question['correct_answer']:
            correct_answers += 1
    
    score = (correct_answers / total_questions) * 100 if total_questions > 0 else 0
    
    session = await db.sessions.find_one({"id": submission.session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    program = await db.programs.find_one({"id": session['program_id']}, {"_id": 0})
    pass_percentage = program.get('pass_percentage', 70.0) if program else 70.0
    
    passed = score >= pass_percentage
    
    result_obj = TestResult(
        test_id=submission.test_id,
        participant_id=current_user.id,
        session_id=submission.session_id,
        answers=submission.answers,
        score=score,
        passed=passed,
        participant_name=current_user.full_name,
        participant_ic=current_user.id_number,
        question_indices=submission.question_indices
    )
    
    doc = result_obj.model_dump()
    doc['submitted_at'] = doc['submitted_at'].isoformat()
    await db.test_results.insert_one(doc)
    
    # Update participant access based on test_type
    test_type = test.get('test_type', 'general')
    if test_type == 'pre':
        await db.participant_access.update_one(
            {"participant_id": current_user.id, "session_id": submission.session_id},
            {"$set": {"pre_test_completed": True}},
            upsert=True
        )
    elif test_type == 'post':
        await db.participant_access.update_one(
            {"participant_id": current_user.id, "session_id": submission.session_id},
            {"$set": {"post_test_completed": True}},
            upsert=True
        )
    
    return result_obj


@router.get("/session/{session_id}/results")
async def get_session_test_results(session_id: str, current_user = Depends(get_current_user)):
    """Get all test results for a session with test type info"""
    results = await db.test_results.find({"session_id": session_id}, {"_id": 0}).to_list(1000)
    from datetime import datetime
    
    for result in results:
        if isinstance(result.get('submitted_at'), str):
            result['submitted_at'] = datetime.fromisoformat(result['submitted_at'])
        
        # Get test info to include test_type
        test = await db.tests.find_one({"id": result['test_id']}, {"_id": 0, 'test_type': 1, 'questions': 1})
        if test:
            result['test_type'] = test.get('test_type', 'general')
            
            # Calculate correct/total for display
            correct_answers = sum(1 for i, ans in enumerate(result.get('answers', [])) 
                                if i < len(test.get('questions', [])) and ans == test['questions'][i]['correct_answer'])
            result['correct_answers'] = correct_answers
            result['total_questions'] = len(test.get('questions', []))
    
    return results


@router.delete("/{test_id}")
async def delete_test(test_id: str, current_user = Depends(get_current_user)):
    """Delete a test"""
    if current_user.role not in ["admin", "assistant_admin"]:
        raise HTTPException(status_code=403, detail="Only admins and assistant admins can delete tests")
    
    result = await db.tests.delete_one({"id": test_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Test not found")
    
    return {"message": "Test deleted successfully"}


@router.get("/results/{result_id}")
async def get_test_result(result_id: str, current_user = Depends(get_current_user)):
    """Get a specific test result with questions for review"""
    result = await db.test_results.find_one({"id": result_id}, {"_id": 0})
    if not result:
        raise HTTPException(status_code=404, detail="Test result not found")
    
    from datetime import datetime
    if isinstance(result.get('submitted_at'), str):
        result['submitted_at'] = datetime.fromisoformat(result['submitted_at'])
    
    # Get the test to include questions
    test = await db.tests.find_one({"id": result['test_id']}, {"_id": 0})
    if test:
        result['test_questions'] = test.get('questions', [])
        result['test_type'] = test.get('test_type', 'general')
        
        # Calculate correct/total for display
        correct_answers = sum(1 for i, ans in enumerate(result.get('answers', [])) 
                            if i < len(test.get('questions', [])) and ans == test['questions'][i]['correct_answer'])
        result['correct_answers'] = correct_answers
        result['total_questions'] = len(test.get('questions', []))
    
    return result


@router.get("/results/participant/{participant_id}")
async def get_participant_test_results(participant_id: str, current_user = Depends(get_current_user)):
    """Get all test results for a participant with summary info"""
    results = await db.test_results.find({"participant_id": participant_id}, {"_id": 0}).to_list(1000)
    from datetime import datetime
    
    for result in results:
        if isinstance(result.get('submitted_at'), str):
            result['submitted_at'] = datetime.fromisoformat(result['submitted_at'])
        
        # Get test info for display
        test = await db.tests.find_one({"id": result['test_id']}, {"_id": 0, 'questions': 1, 'test_type': 1, 'title': 1})
        if test:
            result['test_type'] = test.get('test_type', 'general')
            result['test_title'] = test.get('title', 'Test')
            
            # Calculate correct/total
            correct_answers = sum(1 for i, ans in enumerate(result.get('answers', [])) 
                                if i < len(test.get('questions', [])) and ans == test['questions'][i]['correct_answer'])
            result['correct_answers'] = correct_answers
            result['total_questions'] = len(test.get('questions', []))
    
    return results


@router.get("/results/session/{session_id}", response_model=List[TestResult])
async def get_session_test_results_alt(session_id: str, current_user = Depends(get_current_user)):
    """Alternative endpoint for session test results"""
    results = await db.test_results.find({"session_id": session_id}, {"_id": 0}).to_list(1000)
    from datetime import datetime
    for result in results:
        if isinstance(result.get('submitted_at'), str):
            result['submitted_at'] = datetime.fromisoformat(result['submitted_at'])
    return results


@router.get("/{test_id}", response_model=Test)
async def get_test(test_id: str, current_user = Depends(get_current_user)):
    """Get a specific test"""
    test = await db.tests.find_one({"id": test_id}, {"_id": 0})
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    from datetime import datetime
    if isinstance(test.get('created_at'), str):
        test['created_at'] = datetime.fromisoformat(test['created_at'])
    
    return Test(**test)


@router.post("/bulk-upload")
async def bulk_upload_tests(
    file: UploadFile = File(...),
    program_id: str = None,
    current_user = Depends(get_current_user)
):
    """Bulk upload test questions from Excel"""
    if current_user.role not in ["admin", "assistant_admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    if not program_id:
        raise HTTPException(status_code=400, detail="program_id is required")
    
    try:
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read Excel file: {str(e)}")
    
    from models import TestQuestion
    questions = []
    for _, row in df.iterrows():
        question = TestQuestion(
            question=str(row.get('Question', '')),
            options=[
                str(row.get('Option A', '')),
                str(row.get('Option B', '')),
                str(row.get('Option C', '')),
                str(row.get('Option D', ''))
            ],
            correct_answer=str(row.get('Correct Answer', ''))
        )
        questions.append(question)
    
    test_obj = Test(
        program_id=program_id,
        title=f"Test Questions - Bulk Upload",
        questions=questions
    )
    doc = test_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.tests.insert_one(doc)
    
    return {"message": "Tests uploaded successfully", "count": len(questions)}
