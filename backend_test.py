#!/usr/bin/env python3
"""
Backend API tests for LineSight QA - Baseline Versioning feature
Tests the new baseline versioning endpoints
"""
import requests
import sys

BASE_URL = "https://cnn-ideas-lab.preview.emergentagent.com/api"

class VersioningAPITester:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.line_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{BASE_URL}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                return True, response.json() if response.text else {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_list_baseline_versions(self):
        """Test GET /product-lines/{id}/baseline-versions"""
        success, response = self.run_test(
            "List baseline versions",
            "GET",
            f"product-lines/{self.line_id}/baseline-versions",
            200
        )
        if success:
            # Verify response structure
            if 'active_version' in response and 'versions' in response:
                print(f"   Active version: {response['active_version']}")
                print(f"   Total versions: {len(response['versions'])}")
                for v in response['versions']:
                    status = "ACTIVE" if v['active'] else "ARCHIVED"
                    print(f"   - v{v['version']}: {status}, {v['inspections_used']} inspections")
                return True, response
            else:
                print("❌ Response missing required fields")
                return False, {}
        return False, {}

    def test_activate_baseline_version(self, version):
        """Test POST /product-lines/{id}/baseline-versions/{version}/activate"""
        success, response = self.run_test(
            f"Activate baseline version {version}",
            "POST",
            f"product-lines/{self.line_id}/baseline-versions/{version}/activate",
            200
        )
        if success:
            if response.get('baseline_version') == version:
                print(f"   ✅ Baseline version updated to v{version}")
                return True
            else:
                print(f"   ❌ Baseline version not updated correctly")
                return False
        return False

def main():
    print("=" * 60)
    print("LineSight QA - Baseline Versioning API Tests")
    print("=" * 60)
    
    tester = VersioningAPITester()
    
    # Get a calibrated line to test with
    print("\n🔍 Finding a calibrated product line...")
    try:
        response = requests.get(f"{BASE_URL}/product-lines")
        lines = response.json()
        calibrated_lines = [l for l in lines if l.get('calibrated') and l.get('baseline_version', 0) > 0]
        
        if not calibrated_lines:
            print("❌ No calibrated lines found. Please calibrate a line first.")
            return 1
        
        tester.line_id = calibrated_lines[0]['id']
        print(f"✅ Using line: {calibrated_lines[0]['name']} (v{calibrated_lines[0]['baseline_version']})")
        
    except Exception as e:
        print(f"❌ Failed to get product lines: {e}")
        return 1

    # Test 1: List baseline versions
    success, versions_data = tester.test_list_baseline_versions()
    if not success:
        print("\n❌ Critical test failed, stopping")
        return 1

    # Test 2: Activate a different version (if multiple versions exist)
    if len(versions_data['versions']) > 1:
        # Find an archived version to activate
        archived_versions = [v for v in versions_data['versions'] if not v['active']]
        if archived_versions:
            target_version = archived_versions[0]['version']
            if not tester.test_activate_baseline_version(target_version):
                print("\n❌ Activation test failed")
                return 1
            
            # Verify the change by listing versions again
            success, new_data = tester.test_list_baseline_versions()
            if success:
                if new_data['active_version'] == target_version:
                    print(f"   ✅ Verified: v{target_version} is now active")
                else:
                    print(f"   ❌ Verification failed: active version is v{new_data['active_version']}, expected v{target_version}")
                    return 1
            
            # Restore original version
            original_version = versions_data['active_version']
            tester.test_activate_baseline_version(original_version)
    else:
        print("\n⚠️  Only one version exists, skipping activation test")

    # Print results
    print("\n" + "=" * 60)
    print(f"📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print("=" * 60)
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
