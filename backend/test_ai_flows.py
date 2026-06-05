# ADDED FOR AI INTEGRATION
import json
import unittest
from unittest.mock import patch
from app import app, get_db_connection

class TestAIFlows(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True
        
        # Ensure we have a dummy user and resume for DB-based tests
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Insert a test user if not exists
        # AUTH SYSTEM ADDED: replaced ? with %s
        cursor.execute("SELECT id FROM users WHERE email = %s", ('ai_test_user@example.com',))
        user_row = cursor.fetchone()
        if user_row:
            self.user_id = user_row["id"]
        else:
            # AUTH SYSTEM ADDED: Storing username, changed to password_hash
            cursor.execute(
                "INSERT INTO users (fullName, username, email, password_hash, role) VALUES (%s, %s, %s, %s, %s)",
                ("AI Test User", "AI Test User", "ai_test_user@example.com", "dummy_hash", "student")
            )
            self.user_id = cursor.lastrowid
            
        # Insert or update a test resume
        # AUTH SYSTEM ADDED: replaced ? with %s
        cursor.execute("SELECT id FROM resumes WHERE userId = %s", (self.user_id,))
        resume_row = cursor.fetchone()
        if resume_row:
            cursor.execute(
                "UPDATE resumes SET fileName = %s, extractedText = %s, skills = %s, atsScore = %s, atsBreakdown = %s, profileData = %s WHERE userId = %s",
                ("test.pdf", "John Doe Python Developer SQL React Git", '["Python", "SQL", "React", "Git"]', 80, "{}", "{}", self.user_id)
            )
        else:
            cursor.execute(
                "INSERT INTO resumes (userId, fileName, extractedText, skills, atsScore, atsBreakdown, profileData) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (self.user_id, "test.pdf", "John Doe Python Developer SQL React Git", '["Python", "SQL", "React", "Git"]', 80, "{}", "{}")
            )
        conn.close()

    @patch("utils.ai_service.call_llm")
    def test_resume_analysis(self, mock_call):
        # Mock resume analysis output JSON
        mock_analysis = {
            "strengths": ["Strong Python experience", "Database skills"],
            "weaknesses": ["Lack of cloud experience"],
            "improvements": ["Add AWS credentials"],
            "recommendations": {
                "skills": ["AWS", "Docker"],
                "projects": ["Cloud Deployment Project"],
                "certifications": ["AWS Developer Associate"]
            }
        }
        mock_call.return_value = json.dumps(mock_analysis)
        
        # Test calling with raw text
        resp = self.app.post("/resume-analysis", json={
            "resumeText": "Experienced Developer in React and SQL"
        })
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["analysis"]["strengths"], mock_analysis["strengths"])
        
        # Test calling with userId
        resp_user = self.app.post("/api/resume-analysis", json={
            "userId": self.user_id
        })
        self.assertEqual(resp_user.status_code, 200)
        data_user = resp_user.get_json()
        self.assertTrue(data_user["success"])

    @patch("utils.ai_service.call_llm_messages")
    def test_chat(self, mock_call):
        mock_call.return_value = "Hello, I am your career coach. How can I help you today?"
        
        resp = self.app.post("/chat", json={
            "message": "Hi coach!",
            "userId": self.user_id
        })
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertTrue(data["success"])
        self.assertIn("coach", data["response"])

    @patch("utils.ai_service.call_llm")
    def test_job_match(self, mock_call):
        mock_match = {
            "matchPercentage": 90,
            "matchedSkills": ["Python", "React"],
            "missingSkills": ["Docker"],
            "compatibilityExplanation": "Candidate has excellent front-end and scripting skills, but lacks docker.",
            "tailoringSuggestions": ["Add a docker section"]
        }
        mock_call.return_value = json.dumps(mock_match)
        
        resp = self.app.post("/job-match", json={
            "resumeText": "Experienced Python and React developer",
            "jobDescription": "Looking for Python, React, and Docker developer"
        })
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["match"]["matchPercentage"], 90)

if __name__ == "__main__":
    unittest.main()
