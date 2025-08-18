import requests
import sys
import json
from datetime import datetime
import base64

class TestMakerAPITester:
    def __init__(self, base_url="https://testmaker-4.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_auth = None
        self.test_data = {}

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, auth=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}" if not endpoint.startswith('http') else endpoint
        
        request_headers = {'Content-Type': 'application/json'}
        if headers:
            request_headers.update(headers)
        
        if auth:
            request_headers['Authorization'] = f'Basic {auth}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=request_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=request_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=request_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=request_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def setup_admin_auth(self):
        """Setup admin authentication"""
        credentials = base64.b64encode(b"admin:1234").decode('ascii')
        self.admin_auth = credentials
        return credentials

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, response = self.run_test(
            "Root API Endpoint",
            "GET", 
            "",
            200
        )
        return success

    def test_categories_api(self):
        """Test categories endpoints"""
        print("\n📂 Testing Categories API...")
        
        # Get categories
        success, categories = self.run_test(
            "Get Categories",
            "GET",
            "categories",
            200
        )
        
        if success:
            print(f"   Found {len(categories)} categories")
            self.test_data['categories'] = categories
        
        return success

    def test_test_templates_api(self):
        """Test test templates endpoints"""
        print("\n📋 Testing Test Templates API...")
        
        # Get all templates
        success, templates = self.run_test(
            "Get Test Templates",
            "GET",
            "test-templates",
            200
        )
        
        if success:
            print(f"   Found {len(templates)} templates")
            self.test_data['templates'] = templates
            
            # Test getting specific template if any exist
            if templates:
                template_id = templates[0]['id']
                success2, template = self.run_test(
                    "Get Specific Template",
                    "GET",
                    f"test-templates/{template_id}",
                    200
                )
                return success and success2
        
        return success

    def test_custom_tests_api(self):
        """Test custom tests creation and retrieval"""
        print("\n🔧 Testing Custom Tests API...")
        
        # Create a custom test
        test_data = {
            "title": "Тестовый опрос",
            "description": "Это тестовый опрос для проверки API",
            "creator_email": "test@example.com",
            "questions": [
                {
                    "text": "Как дела?",
                    "type": "single_choice",
                    "options": ["Хорошо", "Плохо", "Нормально"],
                    "required": True,
                    "order": 1
                },
                {
                    "text": "Оцените настроение от 1 до 10",
                    "type": "scale",
                    "min_value": 1,
                    "max_value": 10,
                    "min_label": "Плохо",
                    "max_label": "Отлично",
                    "required": True,
                    "order": 2
                }
            ]
        }
        
        success, custom_test = self.run_test(
            "Create Custom Test",
            "POST",
            "custom-tests",
            200,
            data=test_data
        )
        
        if success and 'share_token' in custom_test:
            share_token = custom_test['share_token']
            self.test_data['custom_test'] = custom_test
            print(f"   Created test with token: {share_token}")
            
            # Test retrieving the custom test
            success2, retrieved_test = self.run_test(
                "Get Custom Test by Token",
                "GET",
                f"custom-tests/{share_token}",
                200
            )
            
            return success and success2
        
        return success

    def test_responses_api(self):
        """Test test responses submission"""
        print("\n📝 Testing Test Responses API...")
        
        if 'custom_test' not in self.test_data:
            print("❌ No custom test available for response testing")
            return False
        
        custom_test = self.test_data['custom_test']
        
        # Submit a test response
        response_data = {
            "test_id": custom_test['id'],
            "test_type": "custom",
            "respondent_email": "respondent@example.com",
            "answers": {
                custom_test['questions'][0]['id']: "Хорошо",
                custom_test['questions'][1]['id']: 8
            }
        }
        
        success, response = self.run_test(
            "Submit Test Response",
            "POST",
            "test-responses",
            200,
            data=response_data
        )
        
        return success

    def test_admin_endpoints(self):
        """Test admin-protected endpoints"""
        print("\n👑 Testing Admin Endpoints...")
        
        auth = self.setup_admin_auth()
        
        # Test admin stats
        success, stats = self.run_test(
            "Get Admin Stats",
            "GET",
            "admin/stats",
            200,
            auth=auth
        )
        
        if success:
            print(f"   Stats: {stats}")
        
        # Test init data (should return message that data already exists)
        success2, init_response = self.run_test(
            "Initialize Default Data",
            "POST",
            "admin/init-data",
            200,
            auth=auth
        )
        
        return success and success2

    def test_admin_auth_protection(self):
        """Test that admin endpoints are properly protected"""
        print("\n🔒 Testing Admin Authentication Protection...")
        
        # Try to access admin stats without auth
        success, _ = self.run_test(
            "Admin Stats Without Auth (should fail)",
            "GET",
            "admin/stats",
            401  # Should be unauthorized
        )
        
        return success

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting TestMaker API Testing...")
        print(f"Base URL: {self.base_url}")
        
        tests = [
            self.test_root_endpoint,
            self.test_categories_api,
            self.test_test_templates_api,
            self.test_custom_tests_api,
            self.test_responses_api,
            self.test_admin_auth_protection,
            self.test_admin_endpoints,
        ]
        
        for test in tests:
            try:
                test()
            except Exception as e:
                print(f"❌ Test failed with exception: {str(e)}")
        
        # Print final results
        print(f"\n📊 Final Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed")
            return 1

def main():
    tester = TestMakerAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())