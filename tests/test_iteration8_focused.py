"""
Iteration 8 - Focused Verification Tests
- PART A: Trainer checklist access (Vijay, Thinagaran, Hisam)
- PART B: Participant view checklist
- PART C: Supervisor report access
- PART D: Payroll verification (payslips, pay advice)
"""
import pytest
import requests
import os
import json
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
CREDENTIALS = {
    "trainer_vijay": {"email": "vijay@mddrc.com.my", "password": "mddrc1"},
    "trainer_thinagaran": {"email": "Dheena8983@gmail.com", "password": "mddrc1"},
    "trainer_hisam": {"email": "hisam@gmail.com.my", "password": "mddrc1"},
    "participant": {"email": "900101-01-0001", "password": "mddrc1"},  # IC number goes in email field
    "supervisor": {"email": "rapidkl@gmail.com", "password": "mddrc1"},
    "admin": {"email": "arjuna@mddrc.com.my", "password": "Dana102229"}
}

def get_token(response_json):
    """Helper to extract token from login response"""
    return response_json.get("access_token") or response_json.get("token")

SESSION_ID = "d664b79d-91a1-4968-bd72-de82611cdb1f"

class TestPartATrainerChecklistAccess:
    """PART A - Trainer Checklist Access Tests"""
    
    def test_01_trainer_vijay_login(self):
        """Test Vijay can login as trainer"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["trainer_vijay"])
        print(f"Vijay login response: {response.status_code}")
        print(f"Response: {response.json()}")
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data.get("user", {}).get("role") == "trainer"
        return data["token"]
    
    def test_02_trainer_vijay_can_see_session(self):
        """Test Vijay can see RapidKL session"""
        # Login first
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["trainer_vijay"])
        token = login_resp.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get session
        response = requests.get(f"{BASE_URL}/api/sessions/{SESSION_ID}", headers=headers)
        print(f"Session response: {response.status_code}")
        if response.status_code == 200:
            session = response.json()
            print(f"Session name: {session.get('name')}")
            print(f"Company: {session.get('company_name')}")
            print(f"Trainer IDs: {session.get('trainer_ids', [])}")
        else:
            print(f"Error: {response.text}")
        assert response.status_code == 200
    
    def test_03_trainer_vijay_get_assigned_participants(self):
        """Test Vijay can get assigned participants for checklist"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["trainer_vijay"])
        token = login_resp.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(f"{BASE_URL}/api/trainer-checklist/{SESSION_ID}/assigned-participants", headers=headers)
        print(f"Assigned participants response: {response.status_code}")
        if response.status_code == 200:
            participants = response.json()
            print(f"Number of assigned participants: {len(participants)}")
            for p in participants[:3]:
                print(f"  - {p.get('full_name', p.get('name', 'Unknown'))}: checklist_completed={p.get('checklist_completed', False)}")
        else:
            print(f"Error: {response.text}")
        assert response.status_code == 200
        return response.json()
    
    def test_04_trainer_thinagaran_login(self):
        """Test Thinagaran can login as trainer"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["trainer_thinagaran"])
        print(f"Thinagaran login response: {response.status_code}")
        print(f"Response: {response.json()}")
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        return data["token"]
    
    def test_05_trainer_thinagaran_get_assigned_participants(self):
        """Test Thinagaran can get assigned participants"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["trainer_thinagaran"])
        token = login_resp.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(f"{BASE_URL}/api/trainer-checklist/{SESSION_ID}/assigned-participants", headers=headers)
        print(f"Thinagaran assigned participants: {response.status_code}")
        if response.status_code == 200:
            print(f"Number of participants: {len(response.json())}")
        else:
            print(f"Error: {response.text}")
        assert response.status_code == 200
    
    def test_06_trainer_hisam_login(self):
        """Test Hisam can login as trainer"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["trainer_hisam"])
        print(f"Hisam login response: {response.status_code}")
        print(f"Response: {response.json()}")
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        return data["token"]
    
    def test_07_trainer_hisam_get_assigned_participants(self):
        """Test Hisam can get assigned participants"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["trainer_hisam"])
        token = login_resp.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(f"{BASE_URL}/api/trainer-checklist/{SESSION_ID}/assigned-participants", headers=headers)
        print(f"Hisam assigned participants: {response.status_code}")
        if response.status_code == 200:
            print(f"Number of participants: {len(response.json())}")
        else:
            print(f"Error: {response.text}")
        assert response.status_code == 200
    
    def test_08_trainer_submit_checklist(self):
        """Test trainer can submit checklist for a participant"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["trainer_vijay"])
        token = login_resp.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get participants first
        participants_resp = requests.get(f"{BASE_URL}/api/trainer-checklist/{SESSION_ID}/assigned-participants", headers=headers)
        if participants_resp.status_code != 200:
            pytest.skip("Could not get participants")
        
        participants = participants_resp.json()
        if not participants:
            pytest.skip("No participants assigned")
        
        # Submit checklist for first participant
        participant = participants[0]
        participant_id = participant.get("id")
        
        checklist_data = {
            "participant_id": participant_id,
            "session_id": SESSION_ID,
            "items": [
                {"name": "Brake System", "status": "pass", "remarks": "Good condition"},
                {"name": "Tire Condition", "status": "pass", "remarks": "Adequate tread"},
                {"name": "Lights", "status": "pass", "remarks": "All working"},
                {"name": "Mirrors", "status": "pass", "remarks": "Properly adjusted"},
                {"name": "Horn", "status": "pass", "remarks": "Functional"}
            ]
        }
        
        response = requests.post(f"{BASE_URL}/api/trainer-checklist/submit", json=checklist_data, headers=headers)
        print(f"Submit checklist response: {response.status_code}")
        print(f"Response: {response.json() if response.status_code == 200 else response.text}")
        assert response.status_code == 200


class TestPartBParticipantViewChecklist:
    """PART B - Participant View Checklist Tests"""
    
    def test_01_participant_login(self):
        """Test participant can login with IC number"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["participant"])
        print(f"Participant login response: {response.status_code}")
        print(f"Response: {response.json()}")
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        return data["token"]
    
    def test_02_participant_view_own_checklist(self):
        """Test participant can view their own checklist results"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["participant"])
        if login_resp.status_code != 200:
            pytest.skip("Participant login failed")
        
        token = login_resp.json()["token"]
        user = login_resp.json()["user"]
        participant_id = user.get("id")
        headers = {"Authorization": f"Bearer {token}"}
        
        # Try to get checklist for participant
        response = requests.get(f"{BASE_URL}/api/checklists/participant/{participant_id}", headers=headers)
        print(f"Participant checklist response: {response.status_code}")
        if response.status_code == 200:
            checklists = response.json()
            print(f"Number of checklists: {len(checklists)}")
            for c in checklists:
                print(f"  - Session: {c.get('session_id')}, Status: {c.get('verification_status')}")
        else:
            print(f"Error: {response.text}")
        
        # Also try vehicle-checklists endpoint
        response2 = requests.get(f"{BASE_URL}/api/vehicle-checklists/{SESSION_ID}/{participant_id}", headers=headers)
        print(f"Vehicle checklist response: {response2.status_code}")
        if response2.status_code == 200:
            print(f"Vehicle checklist data: {response2.json()}")


class TestPartCSupervisorReportAccess:
    """PART C - Supervisor Report Access Tests"""
    
    def test_01_supervisor_login(self):
        """Test supervisor can login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["supervisor"])
        print(f"Supervisor login response: {response.status_code}")
        print(f"Response: {response.json()}")
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        return data["token"]
    
    def test_02_supervisor_view_sessions(self):
        """Test supervisor can view their company's sessions"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["supervisor"])
        token = login_resp.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(f"{BASE_URL}/api/supervisor/sessions", headers=headers)
        print(f"Supervisor sessions response: {response.status_code}")
        if response.status_code == 200:
            sessions = response.json()
            print(f"Number of sessions: {len(sessions)}")
            for s in sessions:
                print(f"  - {s.get('name')}: {s.get('status')}")
        else:
            print(f"Error: {response.text}")
        assert response.status_code == 200
    
    def test_03_supervisor_view_training_report_sessions(self):
        """Test supervisor can view training report sessions"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["supervisor"])
        token = login_resp.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(f"{BASE_URL}/api/training-reports/supervisor/sessions", headers=headers)
        print(f"Training report sessions response: {response.status_code}")
        if response.status_code == 200:
            sessions = response.json()
            print(f"Number of sessions with reports: {len(sessions)}")
            for s in sessions:
                print(f"  - {s.get('name')}: report_status={s.get('report_status', 'N/A')}")
        else:
            print(f"Error: {response.text}")
        assert response.status_code == 200
    
    def test_04_supervisor_view_session_attendance(self):
        """Test supervisor can view session attendance"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["supervisor"])
        token = login_resp.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(f"{BASE_URL}/api/supervisor/attendance/{SESSION_ID}", headers=headers)
        print(f"Supervisor attendance response: {response.status_code}")
        if response.status_code == 200:
            attendance = response.json()
            print(f"Attendance data: {json.dumps(attendance, indent=2)[:500]}")
        else:
            print(f"Error: {response.text}")


class TestPartDPayrollVerification:
    """PART D - Payroll Verification Tests"""
    
    def test_01_admin_login(self):
        """Test admin can login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["admin"])
        print(f"Admin login response: {response.status_code}")
        assert response.status_code == 200
        return response.json()["token"]
    
    def test_02_get_hr_staff(self):
        """Get HR staff list to find malek, chandra, vijay"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["admin"])
        token = login_resp.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(f"{BASE_URL}/api/hr/staff", headers=headers)
        print(f"HR staff response: {response.status_code}")
        if response.status_code == 200:
            staff = response.json()
            print(f"Total staff: {len(staff)}")
            # Find specific staff
            target_names = ["malek", "chandra", "vijay"]
            for s in staff:
                name = s.get("full_name", "").lower()
                if any(t in name for t in target_names):
                    print(f"  Found: {s.get('full_name')} - ID: {s.get('id')} - Role: {s.get('role')}")
        else:
            print(f"Error: {response.text}")
        assert response.status_code == 200
        return response.json()
    
    def test_03_get_payslips(self):
        """Get payslips and check for malek, chandra, vijay"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["admin"])
        token = login_resp.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(f"{BASE_URL}/api/hr/payslips", headers=headers)
        print(f"Payslips response: {response.status_code}")
        if response.status_code == 200:
            payslips = response.json()
            print(f"Total payslips: {len(payslips)}")
            target_names = ["malek", "chandra", "vijay"]
            for p in payslips:
                name = p.get("staff_name", "").lower()
                if any(t in name for t in target_names):
                    print(f"  Payslip: {p.get('staff_name')} - Month: {p.get('month')}/{p.get('year')} - Nett: RM {p.get('nett_pay', 0)}")
        else:
            print(f"Error: {response.text}")
        assert response.status_code == 200
        return response.json()
    
    def test_04_get_pay_advice(self):
        """Get pay advice records"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["admin"])
        token = login_resp.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(f"{BASE_URL}/api/hr/pay-advice", headers=headers)
        print(f"Pay advice response: {response.status_code}")
        if response.status_code == 200:
            advice_list = response.json()
            print(f"Total pay advice records: {len(advice_list)}")
            for a in advice_list:
                print(f"  Pay Advice: {a.get('worker_name', 'Unknown')} - Type: {a.get('worker_type')} - Amount: RM {a.get('total_amount', 0)}")
                if a.get('sessions'):
                    for s in a.get('sessions', []):
                        print(f"    Session: {s.get('session_name')} - Fee: RM {s.get('fee', 0)}")
        else:
            print(f"Error: {response.text}")
        assert response.status_code == 200
        return response.json()
    
    def test_05_verify_session_costing(self):
        """Verify session costing matches expected values (trainer_fee: 1500, coordinator_fee: 800)"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["admin"])
        token = login_resp.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(f"{BASE_URL}/api/sessions/{SESSION_ID}", headers=headers)
        print(f"Session costing response: {response.status_code}")
        if response.status_code == 200:
            session = response.json()
            costing = session.get("costing", {})
            print(f"Session: {session.get('name')}")
            print(f"Costing: {json.dumps(costing, indent=2)}")
            
            trainer_fee = costing.get("trainer_fee", 0)
            coordinator_fee = costing.get("coordinator_fee", 0)
            print(f"Trainer Fee: RM {trainer_fee} (expected: 1500)")
            print(f"Coordinator Fee: RM {coordinator_fee} (expected: 800)")
            
            # Verify expected values
            assert trainer_fee == 1500, f"Trainer fee mismatch: {trainer_fee} != 1500"
            assert coordinator_fee == 800, f"Coordinator fee mismatch: {coordinator_fee} != 800"
        else:
            print(f"Error: {response.text}")
        assert response.status_code == 200
    
    def test_06_get_trainer_fees_payables(self):
        """Get trainer fees from payables"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["admin"])
        token = login_resp.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(f"{BASE_URL}/api/finance/payables/trainer-fees", headers=headers)
        print(f"Trainer fees payables response: {response.status_code}")
        if response.status_code == 200:
            fees = response.json()
            print(f"Total trainer fee records: {len(fees)}")
            for f in fees[:5]:
                print(f"  Trainer: {f.get('trainer_name')} - Session: {f.get('session_name')} - Fee: RM {f.get('amount', 0)} - Status: {f.get('status')}")
        else:
            print(f"Error: {response.text}")
        assert response.status_code == 200
    
    def test_07_get_coordinator_fees_payables(self):
        """Get coordinator fees from payables"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["admin"])
        token = login_resp.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(f"{BASE_URL}/api/finance/payables/coordinator-fees", headers=headers)
        print(f"Coordinator fees payables response: {response.status_code}")
        if response.status_code == 200:
            fees = response.json()
            print(f"Total coordinator fee records: {len(fees)}")
            for f in fees[:5]:
                print(f"  Coordinator: {f.get('coordinator_name')} - Session: {f.get('session_name')} - Fee: RM {f.get('amount', 0)} - Status: {f.get('status')}")
        else:
            print(f"Error: {response.text}")
        assert response.status_code == 200
    
    def test_08_get_payroll_periods(self):
        """Get payroll periods"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["admin"])
        token = login_resp.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(f"{BASE_URL}/api/hr/payroll-periods", headers=headers)
        print(f"Payroll periods response: {response.status_code}")
        if response.status_code == 200:
            periods = response.json()
            print(f"Total payroll periods: {len(periods)}")
            for p in periods:
                print(f"  Period: {p.get('month')}/{p.get('year')} - Status: {p.get('status')}")
        else:
            print(f"Error: {response.text}")
        assert response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
