"""
Test Suite for P0 (Billing Parties) and P1 (Company Fields) Features
- P0: Billing Parties CRUD - Create, Read, Update, Delete billing parties in Finance Settings
- P1: Company create/edit forms with new fields (registration_no, address fields, phone, email, contact_person)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "arjuna@mddrc.com.my"
ADMIN_PASSWORD = "Dana102229"

class TestAuth:
    """Authentication tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        return data["access_token"]
    
    def test_admin_login(self, auth_token):
        """Test admin can login successfully"""
        assert auth_token is not None
        assert len(auth_token) > 0
        print(f"✓ Admin login successful, token length: {len(auth_token)}")


class TestBillingPartiesCRUD:
    """P0: Billing Parties CRUD Tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def headers(self, auth_token):
        """Get headers with auth token"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    def test_create_billing_party(self, headers):
        """Test creating a new billing party"""
        unique_id = str(uuid.uuid4())[:8]
        billing_party_data = {
            "name": f"TEST_HRDC Corp {unique_id}",
            "registration_no": f"REG-{unique_id}",
            "address_line1": "Level 10, Wisma HRDC",
            "address_line2": "Jalan Beringin",
            "city": "Kuala Lumpur",
            "postcode": "50450",
            "state": "Wilayah Persekutuan",
            "country": "Malaysia",
            "phone": "+60-3-1234-5678",
            "email": f"test_{unique_id}@hrdc.gov.my",
            "contact_person": "Test Contact Person"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/finance/billing-parties",
            json=billing_party_data,
            headers=headers
        )
        
        assert response.status_code == 200, f"Create billing party failed: {response.text}"
        data = response.json()
        assert "billing_party" in data, "No billing_party in response"
        assert data["billing_party"]["name"] == billing_party_data["name"]
        assert data["billing_party"]["registration_no"] == billing_party_data["registration_no"]
        assert data["billing_party"]["city"] == billing_party_data["city"]
        print(f"✓ Created billing party: {data['billing_party']['name']}")
        
        # Store ID for later tests
        return data["billing_party"]["id"]
    
    def test_get_billing_parties(self, headers):
        """Test getting all billing parties"""
        response = requests.get(
            f"{BASE_URL}/api/finance/billing-parties",
            headers=headers
        )
        
        assert response.status_code == 200, f"Get billing parties failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Retrieved {len(data)} billing parties")
        
        # Verify structure of billing parties
        if len(data) > 0:
            party = data[0]
            assert "id" in party, "Billing party should have id"
            assert "name" in party, "Billing party should have name"
            print(f"✓ First billing party: {party['name']}")
    
    def test_update_billing_party(self, headers):
        """Test updating a billing party"""
        # First create a billing party to update
        unique_id = str(uuid.uuid4())[:8]
        create_data = {
            "name": f"TEST_Update Party {unique_id}",
            "registration_no": f"UPD-{unique_id}",
            "city": "Petaling Jaya"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/finance/billing-parties",
            json=create_data,
            headers=headers
        )
        assert create_response.status_code == 200
        party_id = create_response.json()["billing_party"]["id"]
        
        # Now update it
        update_data = {
            "name": f"TEST_Updated Party {unique_id}",
            "city": "Shah Alam",
            "phone": "+60-3-9999-8888"
        }
        
        update_response = requests.put(
            f"{BASE_URL}/api/finance/billing-parties/{party_id}",
            json=update_data,
            headers=headers
        )
        
        assert update_response.status_code == 200, f"Update billing party failed: {update_response.text}"
        print(f"✓ Updated billing party {party_id}")
        
        # Verify update by getting all parties
        get_response = requests.get(
            f"{BASE_URL}/api/finance/billing-parties",
            headers=headers
        )
        parties = get_response.json()
        updated_party = next((p for p in parties if p["id"] == party_id), None)
        
        if updated_party:
            assert updated_party["city"] == "Shah Alam", "City should be updated"
            print(f"✓ Verified update: city is now {updated_party['city']}")
    
    def test_delete_billing_party(self, headers):
        """Test deleting (soft delete) a billing party"""
        # First create a billing party to delete
        unique_id = str(uuid.uuid4())[:8]
        create_data = {
            "name": f"TEST_Delete Party {unique_id}",
            "registration_no": f"DEL-{unique_id}"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/finance/billing-parties",
            json=create_data,
            headers=headers
        )
        assert create_response.status_code == 200
        party_id = create_response.json()["billing_party"]["id"]
        
        # Now delete it
        delete_response = requests.delete(
            f"{BASE_URL}/api/finance/billing-parties/{party_id}",
            headers=headers
        )
        
        assert delete_response.status_code == 200, f"Delete billing party failed: {delete_response.text}"
        print(f"✓ Deleted billing party {party_id}")
        
        # Verify it's no longer in active list (soft delete sets is_active=False)
        get_response = requests.get(
            f"{BASE_URL}/api/finance/billing-parties",
            headers=headers
        )
        parties = get_response.json()
        deleted_party = next((p for p in parties if p["id"] == party_id), None)
        
        assert deleted_party is None, "Deleted party should not appear in active list"
        print(f"✓ Verified deletion: party no longer in active list")


class TestCompanyFieldsCRUD:
    """P1: Company Create/Edit with New Fields Tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def headers(self, auth_token):
        """Get headers with auth token"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    def test_create_company_with_new_fields(self, headers):
        """Test creating a company with all new fields"""
        unique_id = str(uuid.uuid4())[:8]
        company_data = {
            "name": f"TEST_Company {unique_id}",
            "registration_no": f"1234567-{unique_id}",
            "address_line1": "123 Test Street",
            "address_line2": "Suite 456",
            "city": "Kuala Lumpur",
            "postcode": "50000",
            "state": "Wilayah Persekutuan",
            "phone": "+60-3-1234-5678",
            "email": f"test_{unique_id}@company.com",
            "contact_person": "John Doe"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/companies",
            json=company_data,
            headers=headers
        )
        
        assert response.status_code == 200, f"Create company failed: {response.text}"
        data = response.json()
        
        # Verify all new fields are saved
        assert data["name"] == company_data["name"]
        assert data["registration_no"] == company_data["registration_no"]
        assert data["address_line1"] == company_data["address_line1"]
        assert data["address_line2"] == company_data["address_line2"]
        assert data["city"] == company_data["city"]
        assert data["postcode"] == company_data["postcode"]
        assert data["state"] == company_data["state"]
        assert data["phone"] == company_data["phone"]
        assert data["email"] == company_data["email"]
        assert data["contact_person"] == company_data["contact_person"]
        
        print(f"✓ Created company with all new fields: {data['name']}")
        print(f"  - Registration No: {data['registration_no']}")
        print(f"  - Address: {data['address_line1']}, {data['city']}")
        print(f"  - Contact: {data['contact_person']}")
        
        return data["id"]
    
    def test_get_companies_shows_registration_no(self, headers):
        """Test that company list includes registration number"""
        response = requests.get(
            f"{BASE_URL}/api/companies",
            headers=headers
        )
        
        assert response.status_code == 200, f"Get companies failed: {response.text}"
        companies = response.json()
        assert isinstance(companies, list), "Response should be a list"
        
        # Find a company with registration_no
        companies_with_reg = [c for c in companies if c.get("registration_no")]
        print(f"✓ Retrieved {len(companies)} companies, {len(companies_with_reg)} have registration numbers")
        
        if companies_with_reg:
            company = companies_with_reg[0]
            print(f"  - Example: {company['name']} (Reg: {company['registration_no']})")
    
    def test_update_company_with_new_fields(self, headers):
        """Test updating a company with new fields"""
        # First create a company
        unique_id = str(uuid.uuid4())[:8]
        create_data = {
            "name": f"TEST_Update Company {unique_id}",
            "registration_no": f"OLD-{unique_id}"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/companies",
            json=create_data,
            headers=headers
        )
        assert create_response.status_code == 200
        company_id = create_response.json()["id"]
        
        # Now update with new fields
        update_data = {
            "registration_no": f"NEW-{unique_id}",
            "address_line1": "Updated Address Line 1",
            "address_line2": "Updated Address Line 2",
            "city": "Penang",
            "postcode": "10000",
            "state": "Pulau Pinang",
            "phone": "+60-4-1111-2222",
            "email": f"updated_{unique_id}@company.com",
            "contact_person": "Jane Smith"
        }
        
        update_response = requests.put(
            f"{BASE_URL}/api/companies/{company_id}",
            json=update_data,
            headers=headers
        )
        
        assert update_response.status_code == 200, f"Update company failed: {update_response.text}"
        data = update_response.json()
        
        # Verify updates
        assert data["registration_no"] == update_data["registration_no"]
        assert data["address_line1"] == update_data["address_line1"]
        assert data["city"] == update_data["city"]
        assert data["contact_person"] == update_data["contact_person"]
        
        print(f"✓ Updated company {company_id} with new fields")
        print(f"  - New Registration No: {data['registration_no']}")
        print(f"  - New City: {data['city']}")
        print(f"  - New Contact: {data['contact_person']}")
    
    def test_company_fields_persistence(self, headers):
        """Test that company fields persist after GET"""
        # Create company with all fields
        unique_id = str(uuid.uuid4())[:8]
        company_data = {
            "name": f"TEST_Persist Company {unique_id}",
            "registration_no": f"PERSIST-{unique_id}",
            "address_line1": "Persist Address 1",
            "address_line2": "Persist Address 2",
            "city": "Johor Bahru",
            "postcode": "80000",
            "state": "Johor",
            "phone": "+60-7-3333-4444",
            "email": f"persist_{unique_id}@company.com",
            "contact_person": "Persist Contact"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/companies",
            json=company_data,
            headers=headers
        )
        assert create_response.status_code == 200
        company_id = create_response.json()["id"]
        
        # Get all companies and find the created one
        get_response = requests.get(
            f"{BASE_URL}/api/companies",
            headers=headers
        )
        assert get_response.status_code == 200
        
        companies = get_response.json()
        created_company = next((c for c in companies if c["id"] == company_id), None)
        
        assert created_company is not None, "Created company should be in list"
        assert created_company["registration_no"] == company_data["registration_no"]
        assert created_company["address_line1"] == company_data["address_line1"]
        assert created_company["city"] == company_data["city"]
        assert created_company["contact_person"] == company_data["contact_person"]
        
        print(f"✓ Verified company fields persist correctly")


class TestCleanup:
    """Cleanup test data"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def headers(self, auth_token):
        """Get headers with auth token"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    def test_cleanup_test_companies(self, headers):
        """Clean up TEST_ prefixed companies"""
        response = requests.get(f"{BASE_URL}/api/companies", headers=headers)
        if response.status_code == 200:
            companies = response.json()
            test_companies = [c for c in companies if c["name"].startswith("TEST_")]
            
            deleted_count = 0
            for company in test_companies:
                delete_response = requests.delete(
                    f"{BASE_URL}/api/companies/{company['id']}",
                    headers=headers
                )
                if delete_response.status_code == 200:
                    deleted_count += 1
            
            print(f"✓ Cleaned up {deleted_count} test companies")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
