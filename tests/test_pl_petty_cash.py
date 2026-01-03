"""
Test suite for Profit/Loss Ledger and Petty Cash Module APIs
Tests: P&L report, manual income/expense entries, petty cash transactions, approvals, reconciliation
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "arjuna@mddrc.com.my"
ADMIN_PASSWORD = "Dana102229"


class TestAuth:
    """Authentication tests"""
    
    def test_admin_login(self):
        """Test admin login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "admin"
        print(f"✓ Admin login successful - User: {data['user']['full_name']}")
        return data["access_token"]


class TestProfitLossLedger:
    """P&L Ledger API tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_profit_loss_report(self):
        """Test GET /finance/profit-loss - Monthly overview with all 12 months"""
        response = requests.get(
            f"{BASE_URL}/api/finance/profit-loss?year=2025",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify structure
        assert "year" in data
        assert data["year"] == 2025
        assert "monthly_breakdown" in data
        assert len(data["monthly_breakdown"]) == 12, "Should have 12 months"
        
        # Verify each month has required fields
        for month in data["monthly_breakdown"]:
            assert "month" in month
            assert "month_name" in month
            assert "income" in month
            assert "expenses" in month
            assert "net_profit" in month
            assert "total" in month["income"]
            assert "total" in month["expenses"]
        
        # Verify YTD summary
        assert "ytd_summary" in data
        ytd = data["ytd_summary"]
        assert "total_income" in ytd
        assert "total_expenses" in ytd
        assert "net_profit" in ytd
        assert "profit_margin" in ytd
        
        # Verify expense breakdown
        assert "expense_breakdown" in data
        breakdown = data["expense_breakdown"]
        assert "payroll" in breakdown
        assert "session_workers" in breakdown
        assert "session_expenses" in breakdown
        assert "petty_cash" in breakdown
        assert "manual" in breakdown
        
        print(f"✓ P&L Report - Year: {data['year']}")
        print(f"  YTD Income: RM {ytd['total_income']:,.2f}")
        print(f"  YTD Expenses: RM {ytd['total_expenses']:,.2f}")
        print(f"  Net Profit: RM {ytd['net_profit']:,.2f}")
        print(f"  Profit Margin: {ytd['profit_margin']}%")
    
    def test_add_manual_income(self):
        """Test POST /finance/manual-income - Add manual income entry"""
        today = datetime.now().strftime("%Y-%m-%d")
        payload = {
            "description": "TEST_Sponsorship from ABC Corp",
            "amount": 5000.00,
            "category": "Sponsorship",
            "date": today,
            "notes": "Test income entry"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/finance/manual-income",
            headers=self.headers,
            json=payload
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert data["message"] == "Income entry added"
        print(f"✓ Manual income added - ID: {data['id']}")
        return data["id"]
    
    def test_get_manual_income(self):
        """Test GET /finance/manual-income - List manual income entries"""
        response = requests.get(
            f"{BASE_URL}/api/finance/manual-income?year=2025",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Manual income entries: {len(data)} found")
        return data
    
    def test_add_manual_expense(self):
        """Test POST /finance/manual-expense - Add manual expense entry"""
        today = datetime.now().strftime("%Y-%m-%d")
        payload = {
            "description": "TEST_Equipment repair",
            "amount": 350.00,
            "category": "Maintenance",
            "date": today,
            "notes": "Test expense entry"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/finance/manual-expense",
            headers=self.headers,
            json=payload
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert data["message"] == "Expense entry added"
        print(f"✓ Manual expense added - ID: {data['id']}")
        return data["id"]
    
    def test_get_manual_expenses(self):
        """Test GET /finance/manual-expenses - List manual expense entries"""
        response = requests.get(
            f"{BASE_URL}/api/finance/manual-expenses?year=2025",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Manual expense entries: {len(data)} found")
        return data
    
    def test_delete_manual_income(self):
        """Test DELETE /finance/manual-income/{id} - Delete income entry"""
        # First create an entry
        today = datetime.now().strftime("%Y-%m-%d")
        create_response = requests.post(
            f"{BASE_URL}/api/finance/manual-income",
            headers=self.headers,
            json={
                "description": "TEST_To be deleted",
                "amount": 100.00,
                "category": "Other Income",
                "date": today
            }
        )
        entry_id = create_response.json()["id"]
        
        # Delete it
        response = requests.delete(
            f"{BASE_URL}/api/finance/manual-income/{entry_id}",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        print(f"✓ Manual income deleted - ID: {entry_id}")
    
    def test_delete_manual_expense(self):
        """Test DELETE /finance/manual-expense/{id} - Delete expense entry"""
        # First create an entry
        today = datetime.now().strftime("%Y-%m-%d")
        create_response = requests.post(
            f"{BASE_URL}/api/finance/manual-expense",
            headers=self.headers,
            json={
                "description": "TEST_To be deleted",
                "amount": 50.00,
                "category": "Other",
                "date": today
            }
        )
        entry_id = create_response.json()["id"]
        
        # Delete it
        response = requests.delete(
            f"{BASE_URL}/api/finance/manual-expense/{entry_id}",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        print(f"✓ Manual expense deleted - ID: {entry_id}")


class TestPettyCash:
    """Petty Cash Module API tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_petty_cash_settings(self):
        """Test GET /finance/petty-cash/settings - Get current settings"""
        response = requests.get(
            f"{BASE_URL}/api/finance/petty-cash/settings",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "float_amount" in data
        assert "current_balance" in data
        assert "approval_threshold" in data
        
        print(f"✓ Petty Cash Settings:")
        print(f"  Float Amount: RM {data['float_amount']:.2f}")
        print(f"  Current Balance: RM {data['current_balance']:.2f}")
        print(f"  Approval Threshold: RM {data['approval_threshold']:.2f}")
        return data
    
    def test_setup_petty_cash(self):
        """Test POST /finance/petty-cash/setup - Update settings"""
        payload = {
            "float_amount": 500.0,
            "custodian_name": "Finance Admin",
            "approval_threshold": 100.0
        }
        
        response = requests.post(
            f"{BASE_URL}/api/finance/petty-cash/setup",
            headers=self.headers,
            json=payload
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "settings" in data
        print(f"✓ Petty cash settings updated")
    
    def test_add_expense_under_threshold_auto_approved(self):
        """Test POST /finance/petty-cash/transaction - Expense under RM 100 (auto-approved)"""
        today = datetime.now().strftime("%Y-%m-%d")
        payload = {
            "type": "expense",
            "amount": 45.00,  # Under RM 100 threshold
            "description": "TEST_Office supplies",
            "category": "Office Supplies",
            "date": today,
            "notes": "Test auto-approved expense"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/finance/petty-cash/transaction",
            headers=self.headers,
            json=payload
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "transaction_id" in data
        assert data["requires_approval"] == False, "Should be auto-approved"
        print(f"✓ Expense under threshold - Auto-approved, ID: {data['transaction_id']}")
        return data["transaction_id"]
    
    def test_add_expense_over_threshold_requires_approval(self):
        """Test POST /finance/petty-cash/transaction - Expense over RM 100 (requires approval)"""
        today = datetime.now().strftime("%Y-%m-%d")
        payload = {
            "type": "expense",
            "amount": 150.00,  # Over RM 100 threshold
            "description": "TEST_Equipment purchase",
            "category": "Equipment",
            "date": today,
            "notes": "Test pending approval expense"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/finance/petty-cash/transaction",
            headers=self.headers,
            json=payload
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "transaction_id" in data
        assert data["requires_approval"] == True, "Should require approval"
        print(f"✓ Expense over threshold - Pending approval, ID: {data['transaction_id']}")
        return data["transaction_id"]
    
    def test_get_transactions(self):
        """Test GET /finance/petty-cash/transactions - List transactions"""
        response = requests.get(
            f"{BASE_URL}/api/finance/petty-cash/transactions?year=2025",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        
        # Check transaction structure
        if len(data) > 0:
            txn = data[0]
            assert "id" in txn
            assert "type" in txn
            assert "amount" in txn
            assert "status" in txn
        
        print(f"✓ Petty cash transactions: {len(data)} found")
        return data
    
    def test_approve_pending_transaction(self):
        """Test POST /finance/petty-cash/approve/{id} - Approve pending transaction"""
        # First create a pending transaction
        today = datetime.now().strftime("%Y-%m-%d")
        create_response = requests.post(
            f"{BASE_URL}/api/finance/petty-cash/transaction",
            headers=self.headers,
            json={
                "type": "expense",
                "amount": 120.00,  # Over threshold
                "description": "TEST_For approval test",
                "category": "Miscellaneous",
                "date": today
            }
        )
        txn_id = create_response.json()["transaction_id"]
        
        # Approve it
        response = requests.post(
            f"{BASE_URL}/api/finance/petty-cash/approve/{txn_id}",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["message"] == "Approved"
        print(f"✓ Transaction approved - ID: {txn_id}")
    
    def test_reject_pending_transaction(self):
        """Test POST /finance/petty-cash/reject/{id} - Reject pending transaction"""
        # First create a pending transaction
        today = datetime.now().strftime("%Y-%m-%d")
        create_response = requests.post(
            f"{BASE_URL}/api/finance/petty-cash/transaction",
            headers=self.headers,
            json={
                "type": "expense",
                "amount": 200.00,  # Over threshold
                "description": "TEST_For rejection test",
                "category": "Miscellaneous",
                "date": today
            }
        )
        txn_id = create_response.json()["transaction_id"]
        
        # Reject it
        response = requests.post(
            f"{BASE_URL}/api/finance/petty-cash/reject/{txn_id}",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["message"] == "Rejected"
        print(f"✓ Transaction rejected - ID: {txn_id}")
    
    def test_topup_cash(self):
        """Test POST /finance/petty-cash/transaction - Top-up cash"""
        today = datetime.now().strftime("%Y-%m-%d")
        payload = {
            "type": "topup",
            "amount": 100.00,
            "description": "TEST_Monthly replenishment",
            "date": today,
            "notes": "Test top-up"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/finance/petty-cash/transaction",
            headers=self.headers,
            json=payload
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "transaction_id" in data
        print(f"✓ Top-up recorded - ID: {data['transaction_id']}")
    
    def test_reconcile_balance(self):
        """Test POST /finance/petty-cash/reconcile - Reconcile with physical count"""
        # Get current balance first
        settings_response = requests.get(
            f"{BASE_URL}/api/finance/petty-cash/settings",
            headers=self.headers
        )
        current_balance = settings_response.json()["current_balance"]
        
        # Reconcile with same amount (no variance)
        payload = {
            "physical_count": current_balance,
            "notes": "Test reconciliation - no variance"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/finance/petty-cash/reconcile",
            headers=self.headers,
            json=payload
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "variance" in data
        assert data["variance"] == 0, "Variance should be 0"
        print(f"✓ Reconciliation complete - Variance: RM {data['variance']:.2f}")
    
    def test_get_reconciliation_history(self):
        """Test GET /finance/petty-cash/reconciliations - Get reconciliation history"""
        response = requests.get(
            f"{BASE_URL}/api/finance/petty-cash/reconciliations",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        
        if len(data) > 0:
            rec = data[0]
            assert "system_balance" in rec
            assert "physical_count" in rec
            assert "variance" in rec
        
        print(f"✓ Reconciliation history: {len(data)} records")
    
    def test_get_summary_by_category(self):
        """Test GET /finance/petty-cash/summary - Get summary with category breakdown"""
        response = requests.get(
            f"{BASE_URL}/api/finance/petty-cash/summary?year=2025",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "year" in data
        assert "current_balance" in data
        assert "float_amount" in data
        assert "by_category" in data
        assert "total_expenses" in data
        
        print(f"✓ Petty Cash Summary - Year: {data['year']}")
        print(f"  Current Balance: RM {data['current_balance']:.2f}")
        print(f"  Total Expenses: RM {data['total_expenses']:.2f}")
        print(f"  Categories: {list(data['by_category'].keys())}")


class TestCleanup:
    """Cleanup test data"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_cleanup_test_income(self):
        """Clean up TEST_ prefixed income entries"""
        response = requests.get(
            f"{BASE_URL}/api/finance/manual-income?year=2025",
            headers=self.headers
        )
        entries = response.json()
        deleted = 0
        for entry in entries:
            if entry.get("description", "").startswith("TEST_"):
                requests.delete(
                    f"{BASE_URL}/api/finance/manual-income/{entry['id']}",
                    headers=self.headers
                )
                deleted += 1
        print(f"✓ Cleaned up {deleted} test income entries")
    
    def test_cleanup_test_expenses(self):
        """Clean up TEST_ prefixed expense entries"""
        response = requests.get(
            f"{BASE_URL}/api/finance/manual-expenses?year=2025",
            headers=self.headers
        )
        entries = response.json()
        deleted = 0
        for entry in entries:
            if entry.get("description", "").startswith("TEST_"):
                requests.delete(
                    f"{BASE_URL}/api/finance/manual-expense/{entry['id']}",
                    headers=self.headers
                )
                deleted += 1
        print(f"✓ Cleaned up {deleted} test expense entries")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
