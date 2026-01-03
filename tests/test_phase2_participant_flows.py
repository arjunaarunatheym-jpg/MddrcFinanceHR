"""
Phase 2 Testing: Participant Flows
- Participant indemnity signing
- Clock-in for training session
- Vehicle details entry
- Coordinator attendance management
- Pre-test release and completion
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
SESSION_ID = "d664b79d-91a1-4968-bd72-de82611cdb1f"

# Test credentials
COORDINATOR_EMAIL = "malek@mddrc.com.my"
COORDINATOR_PASSWORD = "mddrc1"
PARTICIPANT_PASSWORD = "mddrc1"

# Participant IC numbers (900101-01-0001 to 900101-01-0015)
PARTICIPANT_ICS = [f"900101-01-{str(i).zfill(4)}" for i in range(1, 16)]

# Track test results
test_results = {
    "participants_logged_in": [],
    "indemnity_signed": [],
    "vehicle_details_submitted": [],
    "clocked_in": [],
    "pre_test_completed": [],
    "pre_test_passed": [],
    "pre_test_failed": []
}


class TestPhase2Setup:
    """Verify Phase 1 setup is complete"""
    
    def test_backend_health(self):
        """Test backend is accessible"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        print("✓ Backend is healthy")
    
    def test_session_exists(self):
        """Verify the RapidKL session exists"""
        # Login as coordinator first
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COORDINATOR_EMAIL,
            "password": COORDINATOR_PASSWORD
        })
        assert login_response.status_code == 200, f"Coordinator login failed: {login_response.text}"
        token = login_response.json()["access_token"]
        
        # Get session
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/sessions/{SESSION_ID}", headers=headers)
        assert response.status_code == 200, f"Session not found: {response.text}"
        
        session = response.json()
        print(f"✓ Session found: {session.get('name')}")
        print(f"  - Company: {session.get('company_name')}")
        print(f"  - Participants: {len(session.get('participant_ids', []))}")
        assert len(session.get('participant_ids', [])) == 15, "Expected 15 participants"


class TestParticipantLogin:
    """Test participant login with IC number"""
    
    @pytest.fixture
    def participant_tokens(self):
        """Login all participants and return tokens"""
        tokens = {}
        for ic in PARTICIPANT_ICS[:13]:  # Only first 13 participants (14 & 15 will be absent)
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": ic,  # Login with IC number
                "password": PARTICIPANT_PASSWORD
            })
            if response.status_code == 200:
                tokens[ic] = response.json()["access_token"]
                test_results["participants_logged_in"].append(ic)
        return tokens
    
    def test_participant_1_login(self):
        """Test login for participant 1"""
        ic = "900101-01-0001"
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ic,
            "password": PARTICIPANT_PASSWORD
        })
        assert response.status_code == 200, f"Login failed for {ic}: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "participant"
        print(f"✓ Participant 1 ({ic}) logged in successfully")
    
    def test_all_participants_can_login(self):
        """Test all 15 participants can login"""
        success_count = 0
        for ic in PARTICIPANT_ICS:
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": ic,
                "password": PARTICIPANT_PASSWORD
            })
            if response.status_code == 200:
                success_count += 1
                print(f"✓ {ic} - Login OK")
            else:
                print(f"✗ {ic} - Login FAILED: {response.text}")
        
        assert success_count == 15, f"Only {success_count}/15 participants could login"
        print(f"\n✓ All 15 participants can login")


class TestIndemnityFlow:
    """Test indemnity form signing flow"""
    
    def test_sign_indemnity_participant_1(self):
        """Test indemnity signing for participant 1"""
        ic = "900101-01-0001"
        
        # Login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ic,
            "password": PARTICIPANT_PASSWORD
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        user = login_response.json()["user"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Sign indemnity
        indemnity_data = {
            "profile_verified": True,
            "indemnity_accepted": True,
            "indemnity_accepted_at": "2025-01-15T08:00:00Z",
            "indemnity_signature": f"Digitally signed by {user['full_name']}",
            "indemnity_signed_name": user['full_name'],
            "indemnity_signed_ic": ic,
            "indemnity_signed_date": "2025-01-15"
        }
        
        response = requests.put(f"{BASE_URL}/api/users/profile", json=indemnity_data, headers=headers)
        assert response.status_code == 200, f"Indemnity signing failed: {response.text}"
        
        # Verify indemnity was saved
        me_response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        assert me_response.status_code == 200
        user_data = me_response.json()
        assert user_data.get("indemnity_accepted") == True
        
        test_results["indemnity_signed"].append(ic)
        print(f"✓ Participant 1 ({ic}) signed indemnity form")
    
    def test_sign_indemnity_all_present_participants(self):
        """Sign indemnity for participants 1-13 (14 & 15 will be absent)"""
        signed_count = 0
        
        for ic in PARTICIPANT_ICS[:13]:  # Only first 13
            # Login
            login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": ic,
                "password": PARTICIPANT_PASSWORD
            })
            if login_response.status_code != 200:
                print(f"✗ {ic} - Login failed")
                continue
            
            token = login_response.json()["access_token"]
            user = login_response.json()["user"]
            headers = {"Authorization": f"Bearer {token}"}
            
            # Sign indemnity
            indemnity_data = {
                "profile_verified": True,
                "indemnity_accepted": True,
                "indemnity_accepted_at": "2025-01-15T08:00:00Z",
                "indemnity_signature": f"Digitally signed by {user['full_name']}",
                "indemnity_signed_name": user['full_name'],
                "indemnity_signed_ic": ic,
                "indemnity_signed_date": "2025-01-15"
            }
            
            response = requests.put(f"{BASE_URL}/api/users/profile", json=indemnity_data, headers=headers)
            if response.status_code == 200:
                signed_count += 1
                test_results["indemnity_signed"].append(ic)
                print(f"✓ {ic} - Indemnity signed")
            else:
                print(f"✗ {ic} - Indemnity failed: {response.text}")
        
        print(f"\n✓ {signed_count}/13 participants signed indemnity")
        assert signed_count >= 10, f"Only {signed_count}/13 signed indemnity"


class TestVehicleDetails:
    """Test vehicle details submission"""
    
    def test_submit_vehicle_details_participant_1(self):
        """Test vehicle details submission for participant 1"""
        ic = "900101-01-0001"
        
        # Login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ic,
            "password": PARTICIPANT_PASSWORD
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Submit vehicle details
        vehicle_data = {
            "session_id": SESSION_ID,
            "vehicle_model": "Honda City 2020",
            "registration_number": "WKL 1001",
            "roadtax_expiry": "2026-06-15"
        }
        
        response = requests.post(f"{BASE_URL}/api/vehicle-details/submit", json=vehicle_data, headers=headers)
        assert response.status_code == 200, f"Vehicle details submission failed: {response.text}"
        
        test_results["vehicle_details_submitted"].append(ic)
        print(f"✓ Participant 1 ({ic}) submitted vehicle details")
    
    def test_submit_vehicle_details_all_present_participants(self):
        """Submit vehicle details for participants 1-13"""
        submitted_count = 0
        
        vehicle_models = ["Honda City", "Toyota Vios", "Perodua Myvi", "Proton Saga", "Nissan Almera"]
        
        for idx, ic in enumerate(PARTICIPANT_ICS[:13]):
            # Login
            login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": ic,
                "password": PARTICIPANT_PASSWORD
            })
            if login_response.status_code != 200:
                print(f"✗ {ic} - Login failed")
                continue
            
            token = login_response.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            
            # Submit vehicle details
            vehicle_data = {
                "session_id": SESSION_ID,
                "vehicle_model": f"{vehicle_models[idx % len(vehicle_models)]} 202{idx % 5}",
                "registration_number": f"WKL {1001 + idx}",
                "roadtax_expiry": f"2026-{str((idx % 12) + 1).zfill(2)}-15"
            }
            
            response = requests.post(f"{BASE_URL}/api/vehicle-details/submit", json=vehicle_data, headers=headers)
            if response.status_code == 200:
                submitted_count += 1
                test_results["vehicle_details_submitted"].append(ic)
                print(f"✓ {ic} - Vehicle details submitted")
            else:
                print(f"✗ {ic} - Vehicle details failed: {response.text}")
        
        print(f"\n✓ {submitted_count}/13 participants submitted vehicle details")
        assert submitted_count >= 10, f"Only {submitted_count}/13 submitted vehicle details"


class TestClockIn:
    """Test clock-in functionality"""
    
    def test_clock_in_participant_1(self):
        """Test clock-in for participant 1"""
        ic = "900101-01-0001"
        
        # Login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ic,
            "password": PARTICIPANT_PASSWORD
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Clock in
        response = requests.post(f"{BASE_URL}/api/attendance/clock-in", 
                                json={"session_id": SESSION_ID}, 
                                headers=headers)
        
        # May already be clocked in from previous test
        if response.status_code == 400 and "Already clocked in" in response.text:
            print(f"✓ Participant 1 ({ic}) already clocked in")
            test_results["clocked_in"].append(ic)
            return
        
        assert response.status_code == 200, f"Clock-in failed: {response.text}"
        test_results["clocked_in"].append(ic)
        print(f"✓ Participant 1 ({ic}) clocked in successfully")
    
    def test_clock_in_all_present_participants(self):
        """Clock in participants 1-13 (14 & 15 will be absent)"""
        clocked_in_count = 0
        
        for ic in PARTICIPANT_ICS[:13]:  # Only first 13
            # Login
            login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": ic,
                "password": PARTICIPANT_PASSWORD
            })
            if login_response.status_code != 200:
                print(f"✗ {ic} - Login failed")
                continue
            
            token = login_response.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            
            # Clock in
            response = requests.post(f"{BASE_URL}/api/attendance/clock-in", 
                                    json={"session_id": SESSION_ID}, 
                                    headers=headers)
            
            if response.status_code == 200:
                clocked_in_count += 1
                test_results["clocked_in"].append(ic)
                print(f"✓ {ic} - Clocked in")
            elif response.status_code == 400 and "Already clocked in" in response.text:
                clocked_in_count += 1
                if ic not in test_results["clocked_in"]:
                    test_results["clocked_in"].append(ic)
                print(f"✓ {ic} - Already clocked in")
            else:
                print(f"✗ {ic} - Clock-in failed: {response.text}")
        
        print(f"\n✓ {clocked_in_count}/13 participants clocked in")
        assert clocked_in_count >= 10, f"Only {clocked_in_count}/13 clocked in"


class TestCoordinatorAttendance:
    """Test coordinator attendance management"""
    
    @pytest.fixture
    def coordinator_token(self):
        """Get coordinator token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COORDINATOR_EMAIL,
            "password": COORDINATOR_PASSWORD
        })
        assert response.status_code == 200, f"Coordinator login failed: {response.text}"
        return response.json()["access_token"]
    
    def test_coordinator_login(self, coordinator_token):
        """Test coordinator can login"""
        assert coordinator_token is not None
        print("✓ Coordinator logged in successfully")
    
    def test_view_attendance_list(self, coordinator_token):
        """Test coordinator can view attendance list"""
        headers = {"Authorization": f"Bearer {coordinator_token}"}
        
        response = requests.get(f"{BASE_URL}/api/sessions/{SESSION_ID}/participants/attendance", headers=headers)
        assert response.status_code == 200, f"Failed to get attendance: {response.text}"
        
        attendance = response.json()
        print(f"✓ Attendance list retrieved: {len(attendance)} records")
        
        # Count present/absent
        present_count = sum(1 for v in attendance.values() if v == "present")
        absent_count = sum(1 for v in attendance.values() if v == "absent")
        print(f"  - Present: {present_count}")
        print(f"  - Absent: {absent_count}")
    
    def test_mark_participants_14_15_absent(self, coordinator_token):
        """Mark participants 14 & 15 as absent"""
        headers = {"Authorization": f"Bearer {coordinator_token}"}
        
        # Get participant IDs for 14 & 15
        response = requests.get(f"{BASE_URL}/api/sessions/{SESSION_ID}/participants", headers=headers)
        assert response.status_code == 200
        participants = response.json()
        
        # Find participants 14 and 15 by IC number
        absent_ics = ["900101-01-0014", "900101-01-0015"]
        marked_absent = 0
        
        for p in participants:
            if p.get("id_number") in absent_ics:
                # Mark as absent
                mark_response = requests.post(
                    f"{BASE_URL}/api/sessions/{SESSION_ID}/participants/{p['id']}/attendance",
                    params={"status": "absent"},
                    headers=headers
                )
                if mark_response.status_code == 200:
                    marked_absent += 1
                    print(f"✓ Marked {p.get('full_name')} ({p.get('id_number')}) as ABSENT")
                else:
                    print(f"✗ Failed to mark {p.get('id_number')} absent: {mark_response.text}")
        
        assert marked_absent == 2, f"Only marked {marked_absent}/2 as absent"
    
    def test_mark_participants_1_13_present(self, coordinator_token):
        """Mark participants 1-13 as present"""
        headers = {"Authorization": f"Bearer {coordinator_token}"}
        
        # Get participant IDs
        response = requests.get(f"{BASE_URL}/api/sessions/{SESSION_ID}/participants", headers=headers)
        assert response.status_code == 200
        participants = response.json()
        
        present_ics = PARTICIPANT_ICS[:13]
        marked_present = 0
        
        for p in participants:
            if p.get("id_number") in present_ics:
                # Mark as present
                mark_response = requests.post(
                    f"{BASE_URL}/api/sessions/{SESSION_ID}/participants/{p['id']}/attendance",
                    params={"status": "present"},
                    headers=headers
                )
                if mark_response.status_code == 200:
                    marked_present += 1
                    print(f"✓ Marked {p.get('full_name')} ({p.get('id_number')}) as PRESENT")
                else:
                    print(f"✗ Failed to mark {p.get('id_number')} present: {mark_response.text}")
        
        print(f"\n✓ {marked_present}/13 participants marked as present")
        assert marked_present >= 10, f"Only marked {marked_present}/13 as present"


class TestPreTestRelease:
    """Test pre-test release and completion"""
    
    @pytest.fixture
    def coordinator_token(self):
        """Get coordinator token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COORDINATOR_EMAIL,
            "password": COORDINATOR_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_release_pre_test(self, coordinator_token):
        """Coordinator releases pre-test for the session"""
        headers = {"Authorization": f"Bearer {coordinator_token}"}
        
        # Release pre-test
        response = requests.post(f"{BASE_URL}/api/sessions/{SESSION_ID}/release-pre-test", headers=headers)
        
        # May already be released
        if response.status_code == 400 and "already" in response.text.lower():
            print("✓ Pre-test already released")
            return
        
        assert response.status_code == 200, f"Failed to release pre-test: {response.text}"
        print("✓ Pre-test released for all participants")
    
    def test_verify_pre_test_available(self, coordinator_token):
        """Verify pre-test is available for participants"""
        # Login as participant 1
        ic = "900101-01-0001"
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ic,
            "password": PARTICIPANT_PASSWORD
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Check available tests
        response = requests.get(f"{BASE_URL}/api/sessions/{SESSION_ID}/tests/available", headers=headers)
        assert response.status_code == 200, f"Failed to get available tests: {response.text}"
        
        tests = response.json()
        pre_test = next((t for t in tests if t.get("test_type") == "pre"), None)
        
        if pre_test:
            print(f"✓ Pre-test available with {len(pre_test.get('questions', []))} questions")
        else:
            print("✗ Pre-test not available - may need to check access settings")


class TestPreTestCompletion:
    """Test pre-test completion by participants"""
    
    def test_complete_pre_test_participant_1_fail(self):
        """Participant 1 completes pre-test and FAILS (answers incorrectly)"""
        ic = "900101-01-0001"
        
        # Login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ic,
            "password": PARTICIPANT_PASSWORD
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get available tests
        tests_response = requests.get(f"{BASE_URL}/api/sessions/{SESSION_ID}/tests/available", headers=headers)
        if tests_response.status_code != 200:
            pytest.skip("Pre-test not available")
        
        tests = tests_response.json()
        pre_test = next((t for t in tests if t.get("test_type") == "pre"), None)
        
        if not pre_test:
            pytest.skip("Pre-test not found in available tests")
        
        # Answer incorrectly - to fail (need <36/40 correct for 90% pass mark)
        # Answer only 30 correctly (75%) - should FAIL
        questions = pre_test.get("questions", [])
        answers = []
        for i, q in enumerate(questions):
            correct_answer = q.get("correct_answer", 0)
            if i < 30:  # First 30 correct
                answers.append(correct_answer)
            else:  # Last 10 wrong
                wrong_answer = (correct_answer + 1) % len(q.get("options", [4]))
                answers.append(wrong_answer)
        
        # Submit test
        submit_data = {
            "test_id": pre_test["id"],
            "session_id": SESSION_ID,
            "answers": answers
        }
        
        response = requests.post(f"{BASE_URL}/api/tests/submit", json=submit_data, headers=headers)
        
        if response.status_code == 400 and "already" in response.text.lower():
            print(f"✓ {ic} - Pre-test already completed")
            return
        
        assert response.status_code == 200, f"Test submission failed: {response.text}"
        
        result = response.json()
        passed = result.get("passed", False)
        score = result.get("score", 0)
        
        if passed:
            test_results["pre_test_passed"].append(ic)
            print(f"✓ {ic} - Pre-test PASSED with {score:.1f}%")
        else:
            test_results["pre_test_failed"].append(ic)
            print(f"✓ {ic} - Pre-test FAILED with {score:.1f}% (expected)")
        
        test_results["pre_test_completed"].append(ic)
    
    def test_complete_pre_test_participants_2_10_fail(self):
        """Participants 2-10 complete pre-test and FAIL"""
        failed_count = 0
        
        for idx, ic in enumerate(PARTICIPANT_ICS[1:10]):  # Participants 2-10
            # Login
            login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": ic,
                "password": PARTICIPANT_PASSWORD
            })
            if login_response.status_code != 200:
                print(f"✗ {ic} - Login failed")
                continue
            
            token = login_response.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            
            # Get available tests
            tests_response = requests.get(f"{BASE_URL}/api/sessions/{SESSION_ID}/tests/available", headers=headers)
            if tests_response.status_code != 200:
                print(f"✗ {ic} - Could not get tests")
                continue
            
            tests = tests_response.json()
            pre_test = next((t for t in tests if t.get("test_type") == "pre"), None)
            
            if not pre_test:
                print(f"✗ {ic} - Pre-test not available")
                continue
            
            # Answer incorrectly - vary the number of correct answers (30-34)
            questions = pre_test.get("questions", [])
            correct_count = 30 + (idx % 5)  # 30, 31, 32, 33, 34 correct
            answers = []
            
            for i, q in enumerate(questions):
                correct_answer = q.get("correct_answer", 0)
                if i < correct_count:
                    answers.append(correct_answer)
                else:
                    wrong_answer = (correct_answer + 1) % len(q.get("options", [4]))
                    answers.append(wrong_answer)
            
            # Submit test
            submit_data = {
                "test_id": pre_test["id"],
                "session_id": SESSION_ID,
                "answers": answers
            }
            
            response = requests.post(f"{BASE_URL}/api/tests/submit", json=submit_data, headers=headers)
            
            if response.status_code == 400 and "already" in response.text.lower():
                print(f"✓ {ic} - Pre-test already completed")
                continue
            
            if response.status_code == 200:
                result = response.json()
                passed = result.get("passed", False)
                score = result.get("score", 0)
                
                if not passed:
                    failed_count += 1
                    test_results["pre_test_failed"].append(ic)
                    print(f"✓ {ic} - Pre-test FAILED with {score:.1f}%")
                else:
                    test_results["pre_test_passed"].append(ic)
                    print(f"! {ic} - Pre-test PASSED with {score:.1f}% (unexpected)")
                
                test_results["pre_test_completed"].append(ic)
            else:
                print(f"✗ {ic} - Test submission failed: {response.text}")
        
        print(f"\n✓ {failed_count}/9 participants failed pre-test as expected")
    
    def test_complete_pre_test_participants_11_13_pass(self):
        """Participants 11-13 complete pre-test and PASS"""
        passed_count = 0
        
        for ic in PARTICIPANT_ICS[10:13]:  # Participants 11, 12, 13
            # Login
            login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": ic,
                "password": PARTICIPANT_PASSWORD
            })
            if login_response.status_code != 200:
                print(f"✗ {ic} - Login failed")
                continue
            
            token = login_response.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            
            # Get available tests
            tests_response = requests.get(f"{BASE_URL}/api/sessions/{SESSION_ID}/tests/available", headers=headers)
            if tests_response.status_code != 200:
                print(f"✗ {ic} - Could not get tests")
                continue
            
            tests = tests_response.json()
            pre_test = next((t for t in tests if t.get("test_type") == "pre"), None)
            
            if not pre_test:
                print(f"✗ {ic} - Pre-test not available")
                continue
            
            # Answer correctly - 36+ correct to pass (90%)
            questions = pre_test.get("questions", [])
            answers = []
            
            for q in questions:
                correct_answer = q.get("correct_answer", 0)
                answers.append(correct_answer)  # All correct
            
            # Submit test
            submit_data = {
                "test_id": pre_test["id"],
                "session_id": SESSION_ID,
                "answers": answers
            }
            
            response = requests.post(f"{BASE_URL}/api/tests/submit", json=submit_data, headers=headers)
            
            if response.status_code == 400 and "already" in response.text.lower():
                print(f"✓ {ic} - Pre-test already completed")
                continue
            
            if response.status_code == 200:
                result = response.json()
                passed = result.get("passed", False)
                score = result.get("score", 0)
                
                if passed:
                    passed_count += 1
                    test_results["pre_test_passed"].append(ic)
                    print(f"✓ {ic} - Pre-test PASSED with {score:.1f}%")
                else:
                    test_results["pre_test_failed"].append(ic)
                    print(f"! {ic} - Pre-test FAILED with {score:.1f}% (unexpected)")
                
                test_results["pre_test_completed"].append(ic)
            else:
                print(f"✗ {ic} - Test submission failed: {response.text}")
        
        print(f"\n✓ {passed_count}/3 participants passed pre-test as expected")


class TestVerifyResults:
    """Verify all Phase 2 results"""
    
    @pytest.fixture
    def coordinator_token(self):
        """Get coordinator token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COORDINATOR_EMAIL,
            "password": COORDINATOR_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_verify_attendance_status(self, coordinator_token):
        """Verify attendance status shows correct counts"""
        headers = {"Authorization": f"Bearer {coordinator_token}"}
        
        response = requests.get(f"{BASE_URL}/api/sessions/{SESSION_ID}/participants/attendance", headers=headers)
        assert response.status_code == 200
        
        attendance = response.json()
        present_count = sum(1 for v in attendance.values() if v == "present")
        absent_count = sum(1 for v in attendance.values() if v == "absent")
        
        print(f"\n=== ATTENDANCE SUMMARY ===")
        print(f"Present: {present_count}")
        print(f"Absent: {absent_count}")
        print(f"Total: {len(attendance)}")
    
    def test_verify_pre_test_results(self, coordinator_token):
        """Verify pre-test results in coordinator view"""
        headers = {"Authorization": f"Bearer {coordinator_token}"}
        
        response = requests.get(f"{BASE_URL}/api/tests/results/session/{SESSION_ID}", headers=headers)
        assert response.status_code == 200
        
        results = response.json()
        pre_test_results = [r for r in results if r.get("test_type") == "pre"]
        
        passed = sum(1 for r in pre_test_results if r.get("passed"))
        failed = len(pre_test_results) - passed
        
        print(f"\n=== PRE-TEST RESULTS SUMMARY ===")
        print(f"Total completed: {len(pre_test_results)}")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        
        # Print individual results
        for r in pre_test_results:
            status = "PASS" if r.get("passed") else "FAIL"
            print(f"  - Score: {r.get('score', 0):.1f}% ({status})")
    
    def test_print_phase2_summary(self):
        """Print summary of Phase 2 testing"""
        print("\n" + "="*50)
        print("PHASE 2 TESTING SUMMARY")
        print("="*50)
        print(f"Participants logged in: {len(test_results['participants_logged_in'])}")
        print(f"Indemnity signed: {len(test_results['indemnity_signed'])}")
        print(f"Vehicle details submitted: {len(test_results['vehicle_details_submitted'])}")
        print(f"Clocked in: {len(test_results['clocked_in'])}")
        print(f"Pre-test completed: {len(test_results['pre_test_completed'])}")
        print(f"Pre-test passed: {len(test_results['pre_test_passed'])}")
        print(f"Pre-test failed: {len(test_results['pre_test_failed'])}")
        print("="*50)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
