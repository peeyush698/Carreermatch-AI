import unittest
import os
import io
import pymysql
import requests
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", 3306))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "careermatch")

class TestResumeTemplates(unittest.TestCase):
    BASE_URL = "http://127.0.0.1:5000"
    
    @classmethod
    def setUpClass(cls):
        # Setup connection and clean test users & templates
        conn = pymysql.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            cursorclass=pymysql.cursors.DictCursor,
            autocommit=True
        )
        cursor = conn.cursor()
        
        # Clean previous test entries
        cursor.execute("DELETE FROM users WHERE email IN ('admin_test@admin.com', 'student_test@example.com')")
        cursor.execute("DELETE FROM resume_templates WHERE filename IN ('test_template.pdf', 'test_template.docx', 'test_invalid.txt')")
        
        conn.close()
        
        # Register admin user
        res_admin = requests.post(f"{cls.BASE_URL}/api/register", json={
            "fullName": "Test Admin",
            "email": "admin_test@admin.com",
            "password": "password123"
        })
        cls.admin_id = res_admin.json()["user"]["id"]
        
        # Register student user
        res_student = requests.post(f"{cls.BASE_URL}/api/register", json={
            "fullName": "Test Student",
            "email": "student_test@example.com",
            "password": "password123"
        })
        cls.student_id = res_student.json()["user"]["id"]
        
    def test_upload_template_unauthorized(self):
        # 1. Non-admin user tries to upload
        file_data = {"file": ("test_template.pdf", b"Dummy PDF file content", "application/pdf")}
        data = {
            "title": "Software Developer Classic",
            "category": "Software Developer",
            "userId": self.student_id
        }
        res = requests.post(f"{self.BASE_URL}/api/upload-template", data=data, files=file_data)
        self.assertEqual(res.status_code, 403)
        self.assertFalse(res.json()["success"])
        self.assertIn("Access denied", res.json()["error"])
        
    def test_upload_template_success_and_lifecycle(self):
        # 1. Admin user uploads successfully
        file_data = {"file": ("test_template.pdf", b"Dummy PDF file content", "application/pdf")}
        data = {
            "title": "Software Developer Classic",
            "category": "Software Developer",
            "userId": self.admin_id
        }
        res = requests.post(f"{self.BASE_URL}/api/upload-template", data=data, files=file_data)
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()["success"])
        
        # 2. Prevent duplicate filename upload
        file_data_dup = {"file": ("test_template.pdf", b"Different dummy content", "application/pdf")}
        res_dup = requests.post(f"{self.BASE_URL}/api/upload-template", data=data, files=file_data_dup)
        self.assertEqual(res_dup.status_code, 409)
        self.assertFalse(res_dup.json()["success"])
        
        # 3. Invalid extension upload (TXT)
        file_data_txt = {"file": ("test_invalid.txt", b"text content", "text/plain")}
        data_txt = {
            "title": "Invalid TXT Template",
            "category": "General",
            "userId": self.admin_id
        }
        res_txt = requests.post(f"{self.BASE_URL}/api/upload-template", data=data_txt, files=file_data_txt)
        self.assertEqual(res_txt.status_code, 400)
        self.assertFalse(res_txt.json()["success"])
        
        # 4. Large file validation check (exceeds 5MB)
        large_content = b"a" * (5 * 1024 * 1024 + 100) # > 5MB
        file_data_large = {"file": ("test_large.pdf", large_content, "application/pdf")}
        data_large = {
            "title": "Large Template",
            "category": "General",
            "userId": self.admin_id
        }
        res_large = requests.post(f"{self.BASE_URL}/api/upload-template", data=data_large, files=file_data_large)
        self.assertEqual(res_large.status_code, 400)
        self.assertFalse(res_large.json()["success"])
        self.assertIn("exceeds the 5MB limit", res_large.json()["error"])
        
        # 5. Fetch all templates
        res_list = requests.get(f"{self.BASE_URL}/api/resume-templates")
        self.assertEqual(res_list.status_code, 200)
        templates = res_list.json()
        self.assertTrue(len(templates) >= 1)
        
        # Find our uploaded template
        test_tpl = None
        for t in templates:
            if t["filename"] == "test_template.pdf":
                test_tpl = t
                break
        
        self.assertIsNotNone(test_tpl)
        self.assertEqual(test_tpl["title"], "Software Developer Classic")
        self.assertEqual(test_tpl["category"], "Software Developer")
        
        # 6. Download the template
        template_id = test_tpl["id"]
        res_dl = requests.get(f"{self.BASE_URL}/api/template/{template_id}")
        self.assertEqual(res_dl.status_code, 200)
        self.assertEqual(res_dl.content, b"Dummy PDF file content")
        
        # 7. Download template as attachment
        res_dl_att = requests.get(f"{self.BASE_URL}/api/template/{template_id}?download=true")
        self.assertEqual(res_dl_att.status_code, 200)
        self.assertIn('filename=test_template.pdf', res_dl_att.headers.get('Content-Disposition', ''))

if __name__ == "__main__":
    unittest.main()
