"""
HR & Payroll Module API Tests
Tests for EA Forms, Self-service Payroll Portal, and Statutory Rates
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "arjuna@mddrc.com.my"
ADMIN_PASSWORD = "Dana102229"
TRAINER_EMAIL = "vijay@mddrc.com.my"
TRAINER_PASSWORD = "mddrc1"

# Test staff ID from the request
TEST_STAFF_ID = "b67d2e6d-41d7-48a5-9d36-281195dceede"


class TestAuthAndSetup:
    """Authentication tests"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        return data["access_token"]
    
    @pytest.fixture(scope="class")
    def trainer_token(self):
        """Get trainer authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TRAINER_EMAIL,
            "password": TRAINER_PASSWORD
        })
        assert response.status_code == 200, f"Trainer login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        return data["access_token"]
    
    def test_admin_login(self, admin_token):
        """Test admin can login successfully"""
        assert admin_token is not None
        assert len(admin_token) > 0
        print(f"Admin login successful, token length: {len(admin_token)}")
    
    def test_trainer_login(self, trainer_token):
        """Test trainer can login successfully"""
        assert trainer_token is not None
        assert len(trainer_token) > 0
        print(f"Trainer login successful, token length: {len(trainer_token)}")


class TestEAFormsAPI:
    """EA Forms API tests - Admin only"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return response.json()["access_token"]
    
    def test_get_staff_list(self, admin_token):
        """Test getting staff list for EA form generation"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/hr/staff", headers=headers)
        
        assert response.status_code == 200, f"Failed to get staff list: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Staff list should be an array"
        print(f"Found {len(data)} staff members")
        
        # Check staff data structure if any exist
        if len(data) > 0:
            staff = data[0]
            assert "id" in staff, "Staff should have id"
            assert "full_name" in staff, "Staff should have full_name"
            print(f"First staff: {staff.get('full_name', 'N/A')}")
    
    def test_get_ea_form_data(self, admin_token):
        """Test getting EA form data for a specific staff and year"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        year = 2025
        
        # First get staff list to find a valid staff ID
        staff_response = requests.get(f"{BASE_URL}/api/hr/staff", headers=headers)
        if staff_response.status_code != 200 or len(staff_response.json()) == 0:
            pytest.skip("No staff available for EA form test")
        
        staff_id = staff_response.json()[0]["id"]
        
        response = requests.get(f"{BASE_URL}/api/hr/ea-form/{staff_id}/{year}", headers=headers)
        
        # EA form may return 404 if no payslips exist for the year
        if response.status_code == 404:
            print(f"No EA form data for staff {staff_id} in {year} - this is expected if no payslips exist")
            return
        
        assert response.status_code == 200, f"Failed to get EA form: {response.text}"
        data = response.json()
        
        # Verify EA form structure
        assert "year" in data, "EA form should have year"
        assert "staff_id" in data, "EA form should have staff_id"
        assert "employee_details" in data, "EA form should have employee_details"
        assert "annual_totals" in data, "EA form should have annual_totals"
        assert "monthly_breakdown" in data, "EA form should have monthly_breakdown"
        
        print(f"EA Form data retrieved for {data.get('employee_details', {}).get('full_name', 'N/A')}")
    
    def test_ea_form_access_denied_for_non_admin(self):
        """Test that non-admin users cannot access EA form API"""
        # Login as trainer
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TRAINER_EMAIL,
            "password": TRAINER_PASSWORD
        })
        if login_response.status_code != 200:
            pytest.skip("Trainer login failed")
        
        trainer_token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {trainer_token}"}
        
        # Try to access EA form API (should be denied)
        response = requests.get(f"{BASE_URL}/api/hr/ea-form/{TEST_STAFF_ID}/2025", headers=headers)
        
        # Should return 403 Forbidden
        assert response.status_code == 403, f"Expected 403 for non-admin, got {response.status_code}"
        print("Access correctly denied for non-admin user")


class TestSelfServicePayrollAPI:
    """Self-service payroll portal API tests"""
    
    @pytest.fixture(scope="class")
    def trainer_token(self):
        """Get trainer authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TRAINER_EMAIL,
            "password": TRAINER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Trainer login failed")
        return response.json()["access_token"]
    
    def test_get_my_payslips(self, trainer_token):
        """Test getting own payslips"""
        headers = {"Authorization": f"Bearer {trainer_token}"}
        year = 2025
        
        response = requests.get(f"{BASE_URL}/api/hr/my-payslips?year={year}", headers=headers)
        
        assert response.status_code == 200, f"Failed to get my payslips: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Payslips should be an array"
        print(f"Found {len(data)} payslips for year {year}")
        
        # Check payslip structure if any exist
        if len(data) > 0:
            payslip = data[0]
            assert "year" in payslip, "Payslip should have year"
            assert "month" in payslip, "Payslip should have month"
            print(f"First payslip: {payslip.get('month', 'N/A')}/{payslip.get('year', 'N/A')}")
    
    def test_get_my_pay_advice(self, trainer_token):
        """Test getting own pay advice"""
        headers = {"Authorization": f"Bearer {trainer_token}"}
        year = 2025
        
        response = requests.get(f"{BASE_URL}/api/hr/my-pay-advice?year={year}", headers=headers)
        
        assert response.status_code == 200, f"Failed to get my pay advice: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Pay advice should be an array"
        print(f"Found {len(data)} pay advice records for year {year}")
    
    def test_get_my_ea_form(self, trainer_token):
        """Test getting own EA form"""
        headers = {"Authorization": f"Bearer {trainer_token}"}
        year = 2025
        
        response = requests.get(f"{BASE_URL}/api/hr/my-ea-form/{year}", headers=headers)
        
        # May return 404 if no staff record linked to user
        if response.status_code == 404:
            print(f"No EA form data available - staff record may not be linked to user")
            return
        
        assert response.status_code == 200, f"Failed to get my EA form: {response.text}"
        data = response.json()
        
        # Verify EA form structure
        assert "year" in data, "EA form should have year"
        assert "employee_details" in data, "EA form should have employee_details"
        assert "annual_totals" in data, "EA form should have annual_totals"
        print(f"My EA Form data retrieved successfully")


class TestStatutoryRatesAPI:
    """Statutory rates upload API tests"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return response.json()["access_token"]
    
    def test_get_statutory_rates_epf(self, admin_token):
        """Test getting EPF statutory rates"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = requests.get(f"{BASE_URL}/api/hr/statutory-rates?rate_type=epf", headers=headers)
        
        assert response.status_code == 200, f"Failed to get EPF rates: {response.text}"
        data = response.json()
        assert isinstance(data, list), "EPF rates should be an array"
        print(f"Found {len(data)} EPF rate entries")
    
    def test_get_statutory_rates_socso(self, admin_token):
        """Test getting SOCSO statutory rates"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = requests.get(f"{BASE_URL}/api/hr/statutory-rates?rate_type=socso", headers=headers)
        
        assert response.status_code == 200, f"Failed to get SOCSO rates: {response.text}"
        data = response.json()
        assert isinstance(data, list), "SOCSO rates should be an array"
        print(f"Found {len(data)} SOCSO rate entries")
    
    def test_get_statutory_rates_eis(self, admin_token):
        """Test getting EIS statutory rates"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = requests.get(f"{BASE_URL}/api/hr/statutory-rates?rate_type=eis", headers=headers)
        
        assert response.status_code == 200, f"Failed to get EIS rates: {response.text}"
        data = response.json()
        assert isinstance(data, list), "EIS rates should be an array"
        print(f"Found {len(data)} EIS rate entries")
    
    def test_download_template_epf(self, admin_token):
        """Test downloading EPF template"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = requests.get(f"{BASE_URL}/api/hr/statutory-rates/templates/epf", headers=headers)
        
        assert response.status_code == 200, f"Failed to download EPF template: {response.text}"
        assert "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in response.headers.get("content-type", ""), \
            "Template should be an Excel file"
        print("EPF template downloaded successfully")
    
    def test_download_template_socso(self, admin_token):
        """Test downloading SOCSO template"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = requests.get(f"{BASE_URL}/api/hr/statutory-rates/templates/socso", headers=headers)
        
        assert response.status_code == 200, f"Failed to download SOCSO template: {response.text}"
        print("SOCSO template downloaded successfully")
    
    def test_download_template_eis(self, admin_token):
        """Test downloading EIS template"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = requests.get(f"{BASE_URL}/api/hr/statutory-rates/templates/eis", headers=headers)
        
        assert response.status_code == 200, f"Failed to download EIS template: {response.text}"
        print("EIS template downloaded successfully")


class TestCompanySettings:
    """Company settings API tests (used by EA forms)"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return response.json()["access_token"]
    
    def test_get_company_settings(self, admin_token):
        """Test getting company settings"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = requests.get(f"{BASE_URL}/api/finance/company-settings", headers=headers)
        
        assert response.status_code == 200, f"Failed to get company settings: {response.text}"
        data = response.json()
        
        # Company settings should have basic fields
        assert "company_name" in data or data == {}, "Company settings should have company_name or be empty"
        print(f"Company settings retrieved: {data.get('company_name', 'Not set')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
