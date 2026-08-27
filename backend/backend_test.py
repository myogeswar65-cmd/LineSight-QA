"""
LineSight QA Backend API Test Suite
Tests all endpoints including real Gemini vision integration
"""
import requests
import sys
import time
import base64
from io import BytesIO
from PIL import Image

BASE_URL = "https://cnn-ideas-lab.preview.emergentagent.com/api"

class LineSightTester:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.line_id = None
        self.inspection_id = None
        self.samples = None
        
    def log(self, msg, status="INFO"):
        symbols = {"PASS": "✅", "FAIL": "❌", "INFO": "🔍", "WAIT": "⏳"}
        print(f"{symbols.get(status, '•')} {msg}")
    
    def test(self, name, method, endpoint, expected_status=200, data=None, files=None, timeout=120):
        """Run a single API test"""
        url = f"{BASE_URL}{endpoint}"
        self.tests_run += 1
        self.log(f"Testing {name}...", "INFO")
        
        try:
            if method == "GET":
                response = requests.get(url, timeout=timeout)
            elif method == "POST":
                if files:
                    response = requests.post(url, files=files, timeout=timeout)
                else:
                    response = requests.post(url, json=data, timeout=timeout)
            elif method == "DELETE":
                response = requests.delete(url, timeout=timeout)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"PASSED - {name} (status: {response.status_code})", "PASS")
                return True, response.json() if response.content else {}
            else:
                self.log(f"FAILED - {name} (expected {expected_status}, got {response.status_code})", "FAIL")
                if response.content:
                    self.log(f"Response: {response.text[:200]}", "FAIL")
                return False, {}
                
        except Exception as e:
            self.log(f"FAILED - {name} (error: {str(e)})", "FAIL")
            return False, {}
    
    def run_all_tests(self):
        """Execute complete test suite"""
        self.log("=" * 60, "INFO")
        self.log("LineSight QA Backend API Test Suite", "INFO")
        self.log("=" * 60, "INFO")
        
        # Test 1: Root endpoint
        success, data = self.test("Root API", "GET", "/")
        if success and "model" in data:
            self.log(f"Model: {data['model']}", "INFO")
        
        # Test 2: Get samples (demo images)
        success, data = self.test("Get demo samples", "GET", "/samples")
        if success:
            self.samples = data
            good_count = len(data.get("good", []))
            defect_count = len(data.get("defects", []))
            self.log(f"Samples: {good_count} good, {defect_count} defects", "INFO")
        
        # Test 3: Overview (empty state)
        success, data = self.test("Get overview (empty)", "GET", "/overview")
        if success:
            self.log(f"Lines: {data.get('lines_count', 0)}, Inspections: {data.get('total_inspections', 0)}", "INFO")
        
        # Test 4: List product lines (empty)
        success, data = self.test("List product lines (empty)", "GET", "/product-lines")
        if success:
            self.log(f"Found {len(data)} lines", "INFO")
        
        # Test 5: Create product line
        success, data = self.test(
            "Create product line",
            "POST",
            "/product-lines",
            data={"name": "Test CNC Bracket", "description": "Automated test line"}
        )
        if success and "id" in data:
            self.line_id = data["id"]
            self.log(f"Created line ID: {self.line_id}", "INFO")
        else:
            self.log("Cannot continue without line ID", "FAIL")
            return self.print_summary()
        
        # Test 6: Get specific line
        success, data = self.test("Get product line", "GET", f"/product-lines/{self.line_id}")
        if success:
            calibrated = data.get("calibrated", False)
            self.log(f"Line calibrated: {calibrated}", "INFO")
        
        # Test 7: Calibrate line with demo images
        if not self.samples or not self.samples.get("good"):
            self.log("No demo samples available for calibration", "FAIL")
            return self.print_summary()
        
        self.log("Preparing calibration with demo good images (this will take 10-30s)...", "WAIT")
        files = []
        for i, b64_img in enumerate(self.samples["good"][:3]):
            # Convert base64 to file-like object
            img_data = base64.b64decode(b64_img)
            files.append(("files", (f"good{i}.jpg", BytesIO(img_data), "image/jpeg")))
        
        success, data = self.test(
            "Calibrate line (Gemini API call)",
            "POST",
            f"/product-lines/{self.line_id}/calibrate",
            files=files,
            timeout=60
        )
        if success:
            calibrated = data.get("calibrated", False)
            baseline_version = data.get("baseline_version", 0)
            self.log(f"Calibration complete - calibrated: {calibrated}, version: {baseline_version}", "PASS")
            if data.get("baseline_profile"):
                profile = data["baseline_profile"]
                self.log(f"Baseline profile: {profile.get('part_summary', 'N/A')[:80]}...", "INFO")
        else:
            self.log("Calibration failed - cannot test inspection", "FAIL")
            return self.print_summary()
        
        # Test 8: Inspect with defect image (scratch)
        if not self.samples or not self.samples.get("defects"):
            self.log("No demo defect samples available", "FAIL")
            return self.print_summary()
        
        scratch_defect = next((d for d in self.samples["defects"] if d["type"] == "scratch"), None)
        if scratch_defect:
            self.log("Inspecting scratch defect image (Gemini API call, 10-30s)...", "WAIT")
            img_data = base64.b64decode(scratch_defect["image"])
            files = [("file", ("scratch.jpg", BytesIO(img_data), "image/jpeg"))]
            
            success, data = self.test(
                "Inspect scratch defect",
                "POST",
                f"/product-lines/{self.line_id}/inspect",
                files=files,
                timeout=60
            )
            if success:
                verdict = data.get("verdict", "UNKNOWN")
                confidence = data.get("confidence", 0)
                regions = data.get("regions", [])
                self.inspection_id = data.get("id")
                self.log(f"Verdict: {verdict}, Confidence: {confidence:.2f}, Regions: {len(regions)}", "INFO")
                
                # Verify scratch should be FAIL or UNCERTAIN with regions
                if verdict in ["FAIL", "UNCERTAIN"] and len(regions) >= 1:
                    self.log("Scratch correctly detected as defect", "PASS")
                else:
                    self.log(f"Expected FAIL/UNCERTAIN with regions, got {verdict} with {len(regions)} regions", "FAIL")
        
        # Test 9: Inspect with good image
        good_defect = next((d for d in self.samples["defects"] if d["type"] == "good"), None)
        if good_defect:
            self.log("Inspecting good image (Gemini API call, 10-30s)...", "WAIT")
            img_data = base64.b64decode(good_defect["image"])
            files = [("file", ("good.jpg", BytesIO(img_data), "image/jpeg"))]
            
            success, data = self.test(
                "Inspect good part",
                "POST",
                f"/product-lines/{self.line_id}/inspect",
                files=files,
                timeout=60
            )
            if success:
                verdict = data.get("verdict", "UNKNOWN")
                confidence = data.get("confidence", 0)
                regions = data.get("regions", [])
                self.log(f"Verdict: {verdict}, Confidence: {confidence:.2f}, Regions: {len(regions)}", "INFO")
                
                # Verify good should be PASS
                if verdict == "PASS":
                    self.log("Good part correctly passed", "PASS")
                else:
                    self.log(f"Expected PASS, got {verdict}", "FAIL")
        
        # Test 10: List inspections
        success, data = self.test("List inspections", "GET", f"/product-lines/{self.line_id}/inspections")
        if success:
            self.log(f"Found {len(data)} inspections", "INFO")
        
        # Test 11: List inspections with verdict filter
        success, data = self.test("List inspections (FAIL filter)", "GET", f"/product-lines/{self.line_id}/inspections?verdict=FAIL")
        if success:
            self.log(f"Found {len(data)} FAIL inspections", "INFO")
        
        # Test 12: Get specific inspection
        if self.inspection_id:
            success, data = self.test("Get inspection detail", "GET", f"/inspections/{self.inspection_id}")
            if success:
                line_name = data.get("line_name", "Unknown")
                self.log(f"Inspection line: {line_name}", "INFO")
        
        # Test 13: Dashboard
        success, data = self.test("Get dashboard", "GET", f"/product-lines/{self.line_id}/dashboard")
        if success:
            total = data.get("total", 0)
            pass_rate = data.get("pass_rate", 0)
            drift_state = data.get("drift", {}).get("state", "unknown")
            self.log(f"Dashboard: {total} inspections, {pass_rate}% pass rate, drift: {drift_state}", "INFO")
        
        # Test 14: Insights
        success, data = self.test("Get insights", "GET", f"/product-lines/{self.line_id}/insights")
        if success:
            total_defects = data.get("total_defects", 0)
            clusters = len(data.get("clusters", []))
            hints = len(data.get("hints", []))
            self.log(f"Insights: {total_defects} defects, {clusters} clusters, {hints} hints", "INFO")
        
        # Test 15: Delete inspection
        if self.inspection_id:
            success, data = self.test("Delete inspection", "DELETE", f"/inspections/{self.inspection_id}")
        
        # Test 16: Delete product line
        success, data = self.test("Delete product line", "DELETE", f"/product-lines/{self.line_id}")
        
        # Test 17: Overview after cleanup
        success, data = self.test("Get overview (after cleanup)", "GET", "/overview")
        if success:
            self.log(f"Lines: {data.get('lines_count', 0)}, Inspections: {data.get('total_inspections', 0)}", "INFO")
        
        return self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        self.log("=" * 60, "INFO")
        self.log(f"Tests completed: {self.tests_passed}/{self.tests_run} passed", "INFO")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        self.log(f"Success rate: {success_rate:.1f}%", "INFO")
        self.log("=" * 60, "INFO")
        
        return 0 if self.tests_passed == self.tests_run else 1

if __name__ == "__main__":
    tester = LineSightTester()
    sys.exit(tester.run_all_tests())
