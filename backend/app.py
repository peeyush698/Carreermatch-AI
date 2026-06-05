# AUTH SYSTEM ADDED
import os
import json
import pymysql
from flask import Flask, request, jsonify, session, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv


from utils.resume_parser import parse_resume
from utils.skill_extractor import extract_skills
from utils.ats_score import calculate_ats_score
from utils.job_matcher import get_recommended_jobs, analyze_skill_gap, load_jobs

# AUTH SYSTEM ADDED
# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

app = Flask(__name__)
# Enable CORS for frontend compatibility
CORS(app, supports_credentials=True)

# Session configuration
app.secret_key = os.getenv("SECRET_KEY", "careermatch_secret_key_default_123!")
app.config["PERMANENT_SESSION_LIFETIME"] = 86400 * 7  # 7 days

JOBS_JSON_PATH = os.path.join(os.path.dirname(__file__), "data", "jobs.json")
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
TEMPLATES_FOLDER = os.path.join(UPLOAD_FOLDER, "resume_templates")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(TEMPLATES_FOLDER, exist_ok=True)

# AUTH SYSTEM ADDED
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", 3306))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "careermatch")

def get_db_connection(include_db=True):
    conn = pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME if include_db else None,
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True
    )
    return conn

def init_db():
    # Ensure database exists
    try:
        conn = get_db_connection(include_db=False)
        cursor = conn.cursor()
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}")
        conn.close()
    except Exception as e:
        print(f"Error creating database: {e}")

    conn = get_db_connection(include_db=True)
    cursor = conn.cursor()
    
    # Create Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        fullName VARCHAR(255) NOT NULL,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50),
        college VARCHAR(255),
        branch VARCHAR(100),
        gradYear VARCHAR(10),
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'student',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Create Resumes Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS resumes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL UNIQUE,
        fileName VARCHAR(255) NOT NULL,
        extractedText LONGTEXT NOT NULL,
        skills TEXT NOT NULL,
        atsScore INT NOT NULL,
        atsBreakdown TEXT NOT NULL,
        profileData TEXT NOT NULL,
        uploadedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
    )
    """)
    
    # Create Applications Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS applications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        jobId VARCHAR(255) NOT NULL,
        appliedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'Applied',
        UNIQUE(userId, jobId),
        FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
    )
    """)
    
    # Create Resume Templates Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS resume_templates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        filename VARCHAR(255) UNIQUE NOT NULL,
        category VARCHAR(100) NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    conn.close()

# Initialize database on start
init_db()

@app.route("/api/register", methods=["POST"])
def register():
    data = request.json
    if not data:
        return jsonify({"success": False, "error": "Invalid request body"}), 400
        
    full_name = data.get("fullName")
    email = data.get("email")
    phone = data.get("phone", "")
    college = data.get("college", "")
    branch = data.get("branch", "")
    grad_year = data.get("gradYear", "")
    password = data.get("password")
    
    if not full_name or not email or not password:
        return jsonify({"success": False, "error": "Full Name, Email and Password are required fields"}), 400
        
    # AUTH SYSTEM ADDED: use generate_password_hash() during signup
    password_hash = generate_password_hash(password)
    
    # Automatic admin granting logic: email containing @admin.com becomes an admin
    role = "admin" if "@admin.com" in email.lower() else "student"
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # AUTH SYSTEM ADDED: Storing username, changed to password_hash
        cursor.execute(
            "INSERT INTO users (fullName, username, email, phone, college, branch, gradYear, password_hash, role) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)",
            (full_name, full_name, email, phone, college, branch, grad_year, password_hash, role)
        )
        user_id = cursor.lastrowid
        conn.close()
        
        # AUTH SYSTEM ADDED: session handling
        session.permanent = True
        session["user_id"] = user_id
        
        user_info = {
            "id": user_id,
            "fullName": full_name,
            "email": email,
            "phone": phone,
            "college": college,
            "branch": branch,
            "gradYear": grad_year,
            "role": role
        }
        return jsonify({"success": True, "user": user_info})
    except pymysql.err.IntegrityError as e:
        # AUTH SYSTEM ADDED: duplicate email check for MySQL
        if e.args[0] == 1062:
            return jsonify({"success": False, "error": "An account with this email address already exists."}), 409
        return jsonify({"success": False, "error": str(e)}), 500
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    if not data:
        return jsonify({"success": False, "error": "Invalid request body"}), 400
        
    email = data.get("email")
    password = data.get("password")
    
    # AUTH SYSTEM ADDED: print login email
    print(f"[DEBUG LOGIN] Email: {email}", flush=True)
    
    if not email or not password:
        return jsonify({"success": False, "error": "Email and Password are required"}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    # AUTH SYSTEM ADDED: changed placeholder to %s
    cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
    user = cursor.fetchone()
    conn.close()
    
    # AUTH SYSTEM ADDED: print DB user found/not found
    print(f"[DEBUG LOGIN] DB User Found: {user is not None}", flush=True)
    
    if not user:
        return jsonify({"success": False, "error": "Invalid email or password"}), 401
        
    db_hash = user.get("password_hash") or user.get("passwordHash")
    verified = False
    if db_hash:
        if db_hash.startswith("$2b$"):
            try:
                import bcrypt
                verified = bcrypt.checkpw(password.encode("utf-8"), db_hash.encode("utf-8"))
            except Exception:
                verified = check_password_hash(db_hash, password)
        else:
            # AUTH SYSTEM ADDED: use check_password_hash() during login
            verified = check_password_hash(db_hash, password)
            
    # AUTH SYSTEM ADDED: print password verification result
    print(f"[DEBUG LOGIN] Password Verification Result: {verified}", flush=True)
    
    if verified:
        # AUTH SYSTEM ADDED: session handling
        session.permanent = True
        session["user_id"] = user["id"]
        
        user_info = {
            "id": user["id"],
            "fullName": user["fullName"],
            "email": user["email"],
            "phone": user["phone"],
            "college": user["college"],
            "branch": user["branch"],
            "gradYear": user["gradYear"],
            "role": user["role"]
        }
        return jsonify({"success": True, "user": user_info})
    else:
        return jsonify({"success": False, "error": "Invalid email or password"}), 401

# AUTH SYSTEM ADDED: Logout functionality
@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"success": True, "message": "Logged out successfully"})

@app.route("/api/upload-resume", methods=["POST"])
def upload_resume():
    if "file" not in request.files:
        return jsonify({"success": False, "error": "No file uploaded"}), 400
    
    file = request.files["file"]
    user_id = request.form.get("userId")
    
    if not user_id:
        return jsonify({"success": False, "error": "userId is required"}), 400
        
    if file.filename == "":
        return jsonify({"success": False, "error": "Empty filename"}), 400
        
    filename = f"user_{user_id}_{file.filename}"
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(file_path)
    
    try:
        # Parse the resume
        parser_res = parse_resume(file_path)
        extracted_text = parser_res["text"]
        
        # Extract skills
        skills = extract_skills(extracted_text)
        
        # Calculate ATS Score
        ats_res = calculate_ats_score(parser_res, skills)
        ats_score = ats_res["score"]
        ats_breakdown = json.dumps(ats_res["breakdown"])
        suggestions = json.dumps(ats_res["suggestions"])
        
        # Structure profile data for save
        profile_data = {
            "name": parser_res["name"],
            "email": parser_res["email"],
            "phone": parser_res["phone"],
            "sections": parser_res["sections"],
            "suggestions": ats_res["suggestions"]
        }
        
        skills_json = json.dumps(skills)
        profile_data_json = json.dumps(profile_data)
        
        # Save or update database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # AUTH SYSTEM ADDED: replaced ? with %s
        cursor.execute("SELECT id FROM resumes WHERE userId = %s", (user_id,))
        existing = cursor.fetchone()
        
        if existing:
            cursor.execute(
                "UPDATE resumes SET fileName = %s, extractedText = %s, skills = %s, atsScore = %s, atsBreakdown = %s, profileData = %s WHERE userId = %s",
                (file.filename, extracted_text, skills_json, ats_score, ats_breakdown, profile_data_json, user_id)
            )
        else:
            cursor.execute(
                "INSERT INTO resumes (userId, fileName, extractedText, skills, atsScore, atsBreakdown, profileData) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (user_id, file.filename, extracted_text, skills_json, ats_score, ats_breakdown, profile_data_json)
            )
            
        conn.close()
        
        return jsonify({
            "success": True,
            "fileName": file.filename,
            "atsScore": ats_score,
            "skills": skills,
            "breakdown": ats_res["breakdown"],
            "suggestions": ats_res["suggestions"],
            "profileData": profile_data
        })
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/recommended-jobs/<int:user_id>", methods=["GET"])
def recommended_jobs(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    # AUTH SYSTEM ADDED: replaced ? with %s
    cursor.execute("SELECT skills FROM resumes WHERE userId = %s", (user_id,))
    resume = cursor.fetchone()
    
    # Get all applied jobIds for this user
    # AUTH SYSTEM ADDED: replaced ? with %s
    cursor.execute("SELECT jobId FROM applications WHERE userId = %s", (user_id,))
    applied_job_ids = set(row["jobId"] for row in cursor.fetchall())
    conn.close()
    
    user_skills = []
    if resume:
        user_skills = json.loads(resume["skills"])
        
    recommendations = get_recommended_jobs(user_skills, JOBS_JSON_PATH)
    
    # Mark applied state
    for job in recommendations:
        job["applied"] = job["id"] in applied_job_ids
        
    return jsonify(recommendations)

@app.route("/api/skill-gap/<int:user_id>/<job_id>", methods=["GET"])
def skill_gap(user_id, job_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    # AUTH SYSTEM ADDED: replaced ? with %s
    cursor.execute("SELECT skills FROM resumes WHERE userId = %s", (user_id,))
    resume = cursor.fetchone()
    conn.close()
    
    user_skills = []
    if resume:
        user_skills = json.loads(resume["skills"])
        
    jobs = load_jobs(JOBS_JSON_PATH)
    target_job = None
    for j in jobs:
        if j["id"] == job_id:
            target_job = j
            break
            
    if not target_job:
        return jsonify({"error": "Job not found"}), 404
        
    gap_res = analyze_skill_gap(user_skills, target_job)
    return jsonify(gap_res)

@app.route("/api/apply-job", methods=["POST"])
def apply_job():
    data = request.json
    if not data:
        return jsonify({"success": False, "error": "Invalid request body"}), 400
        
    user_id = data.get("userId")
    job_id = data.get("jobId")
    
    if not user_id or not job_id:
        return jsonify({"success": False, "error": "userId and jobId are required"}), 400
        
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # AUTH SYSTEM ADDED: replaced ? with %s
        cursor.execute("INSERT INTO applications (userId, jobId) VALUES (%s, %s)", (user_id, job_id))
        conn.close()
        return jsonify({"success": True, "message": "Applied successfully"})
    except pymysql.err.IntegrityError as e:
        # AUTH SYSTEM ADDED: MySQL duplicate check
        if e.args[0] == 1062:
            return jsonify({"success": False, "error": "You have already applied to this job."}), 409
        return jsonify({"success": False, "error": str(e)}), 500
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/applied-jobs/<int:user_id>", methods=["GET"])
def applied_jobs(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    # AUTH SYSTEM ADDED: replaced ? with %s
    cursor.execute("SELECT jobId, appliedAt, status FROM applications WHERE userId = %s ORDER BY appliedAt DESC", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    
    jobs = load_jobs(JOBS_JSON_PATH)
    jobs_map = {j["id"]: j for j in jobs}
    
    applied_list = []
    for r in rows:
        job_id = r["jobId"]
        if job_id in jobs_map:
            job_details = jobs_map[job_id]
            applied_list.append({
                "id": job_id,
                "title": job_details["title"],
                "company": job_details["company"],
                "location": job_details["location"],
                "salary": job_details["salary"],
                "appliedAt": r["appliedAt"],
                "status": r["status"]
            })
            
    return jsonify(applied_list)

@app.route("/api/dashboard/<int:user_id>", methods=["GET"])
def dashboard(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # User Profile
    # AUTH SYSTEM ADDED: replaced ? with %s
    cursor.execute("SELECT fullName, email, college, branch, gradYear FROM users WHERE id = %s", (user_id,))
    user_row = cursor.fetchone()
    if not user_row:
        conn.close()
        return jsonify({"error": "User not found"}), 404
        
    # Resume details
    # AUTH SYSTEM ADDED: replaced ? with %s
    cursor.execute("SELECT atsScore, skills, atsBreakdown, profileData, fileName FROM resumes WHERE userId = %s", (user_id,))
    resume_row = cursor.fetchone()
    
    # Applications
    # AUTH SYSTEM ADDED: replaced ? with %s
    cursor.execute("SELECT jobId, status, appliedAt FROM applications WHERE userId = %s", (user_id,))
    applications_rows = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    
    # Total jobs catalog length
    jobs = load_jobs(JOBS_JSON_PATH)
    total_jobs = len(jobs)
    
    user_skills = []
    ats_score = 0
    ats_breakdown = {}
    profile_data = {}
    file_name = ""
    has_resume = False
    
    if resume_row:
        has_resume = True
        ats_score = resume_row["atsScore"]
        user_skills = json.loads(resume_row["skills"])
        ats_breakdown = json.loads(resume_row["atsBreakdown"])
        profile_data = json.loads(resume_row["profileData"])
        file_name = resume_row["fileName"]
        
    # Compute job matches
    recommendations = get_recommended_jobs(user_skills, JOBS_JSON_PATH)
    best_match = recommendations[0]["matchPercentage"] if recommendations else 0
    missing_skills_count = len(recommendations[0]["missingSkills"]) if recommendations else 0
    
    # Prepare statistics
    stats = {
        "fullName": user_row["fullName"],
        "email": user_row["email"],
        "college": user_row["college"],
        "branch": user_row["branch"],
        "gradYear": user_row["gradYear"],
        "hasResume": has_resume,
        "atsScore": ats_score,
        "totalJobs": total_jobs,
        "bestMatch": best_match,
        "missingSkillsCount": missing_skills_count,
        "appliedCount": len(applications_rows)
    }
    
    # Skills distribution for canvas charts
    radar_skills = [{"label": s, "value": 0.8} for s in user_skills[:6]]
    # Fill remaining to make 6 items on radar chart
    if len(radar_skills) < 6:
        missing_count = 6 - len(radar_skills)
        all_options = ["Python", "Java", "React", "SQL", "Git", "HTML", "CSS", "Problem Solving"]
        for opt in all_options:
            if opt not in user_skills and len(radar_skills) < 6:
                radar_skills.append({"label": opt, "value": 0.3})
                
    response_payload = {
        "stats": stats,
        "atsBreakdown": ats_breakdown,
        "radarSkills": radar_skills,
        "recentJobs": recommendations[:5] if has_resume else recommendations[:5],
        "appliedJobs": applications_rows,
        "profileData": profile_data,
        "fileName": file_name
    }
    return jsonify(response_payload)

@app.route("/api/admin/summary", methods=["GET"])
def admin_summary():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Users metrics
    cursor.execute("SELECT id, fullName, email, college, branch, gradYear, createdAt FROM users WHERE role = 'student' ORDER BY createdAt DESC")
    users = [dict(row) for row in cursor.fetchall()]
    
    # Resumes parsed
    cursor.execute("SELECT count(*) as totalResumes, avg(atsScore) as avgAts FROM resumes")
    resume_stats = cursor.fetchone()
    
    # Applications
    cursor.execute("SELECT count(*) as totalApps FROM applications")
    total_apps = cursor.fetchone()
    
    # Recent applications details
    cursor.execute("""
        SELECT a.id, a.userId, a.jobId, a.appliedAt, a.status, u.fullName, u.email 
        FROM applications a 
        JOIN users u ON a.userId = u.id 
        ORDER BY a.appliedAt DESC LIMIT 10
    """)
    recent_applications = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    
    # Job catalogs
    jobs = load_jobs(JOBS_JSON_PATH)
    
    # AUTH SYSTEM ADDED: convert Decimal to float for JSON serialization
    avg_ats = round(float(resume_stats["avgAts"])) if resume_stats["avgAts"] is not None else 0
    
    # Combine job descriptions into recent applications
    jobs_map = {j["id"]: j for j in jobs}
    for app_item in recent_applications:
        j_id = app_item["jobId"]
        if j_id in jobs_map:
            app_item["jobTitle"] = jobs_map[j_id]["title"]
            app_item["company"] = jobs_map[j_id]["company"]
        else:
            app_item["jobTitle"] = "Unknown Role"
            app_item["company"] = "Unknown Company"
            
    return jsonify({
        "stats": {
            "totalUsers": len(users),
            "totalResumes": resume_stats["totalResumes"],
            "totalJobs": len(jobs),
            "totalApplications": total_apps["totalApps"],
            "avgAts": avg_ats
        },
        "recentUsers": users[:10],
        "recentApplications": recent_applications
    })

# In-memory OTP storage
otps = {}

@app.route("/api/forgot-password", methods=["POST"])
def forgot_password():
    data = request.json
    if not data:
        return jsonify({"success": False, "error": "Invalid request body"}), 400
    
    email = data.get("email")
    if not email:
        return jsonify({"success": False, "error": "Email is required"}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    # AUTH SYSTEM ADDED: replaced ? with %s
    cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        return jsonify({"success": False, "error": "No account found with this email address."}), 404
        
    import random
    otp = f"{random.randint(100000, 999999)}"
    otps[email] = otp
    print(f"\n========================================\n[OTP DEBUG] OTP for {email} is: {otp}\n========================================\n")
    
    return jsonify({"success": True, "message": "OTP generated successfully", "otp": otp})

@app.route("/api/verify-otp", methods=["POST"])
def verify_otp():
    data = request.json
    if not data:
        return jsonify({"success": False, "error": "Invalid request body"}), 400
        
    email = data.get("email")
    otp = data.get("otp")
    
    if not email or not otp:
        return jsonify({"success": False, "error": "Email and OTP are required"}), 400
        
    if email not in otps or otps[email] != str(otp).strip():
        return jsonify({"success": False, "error": "Invalid or expired OTP"}), 400
        
    return jsonify({"success": True, "message": "OTP verified successfully"})

@app.route("/api/reset-password", methods=["POST"])
def reset_password():
    data = request.json
    if not data:
        return jsonify({"success": False, "error": "Invalid request body"}), 400
        
    email = data.get("email")
    otp = data.get("otp")
    new_password = data.get("newPassword")
    
    if not email or not otp or not new_password:
        return jsonify({"success": False, "error": "All fields are required"}), 400
        
    if email not in otps or otps[email] != str(otp).strip():
        return jsonify({"success": False, "error": "Invalid or expired OTP"}), 400
        
    # AUTH SYSTEM ADDED: use generate_password_hash() during signup/reset
    password_hash = generate_password_hash(new_password)
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # AUTH SYSTEM ADDED: replaced ? with %s, changed to password_hash
        cursor.execute("UPDATE users SET password_hash = %s WHERE email = %s", (password_hash, email))
        conn.close()
        
        # Clear OTP
        otps.pop(email, None)
        return jsonify({"success": True, "message": "Password updated successfully"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/google-login", methods=["POST"])
def google_login():
    data = request.json
    if not data:
        return jsonify({"success": False, "error": "Invalid request"}), 400
        
    email = data.get("email")
    name = data.get("name")
    
    if not email or not name:
        return jsonify({"success": False, "error": "Name and Email are required"}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    # AUTH SYSTEM ADDED: replaced ? with %s
    cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
    user = cursor.fetchone()
    
    if not user:
        # Create a new user since they logged in via Google for the first time
        # AUTH SYSTEM ADDED: use generate_password_hash() during signup
        password_hash = generate_password_hash("google_oauth_placeholder")
        role = "admin" if "@admin.com" in email.lower() else "student"
        try:
            # AUTH SYSTEM ADDED: Storing username, changed to password_hash
            cursor.execute(
                "INSERT INTO users (fullName, username, email, password_hash, role) VALUES (%s, %s, %s, %s, %s)",
                (name, name, email, password_hash, role)
            )
            # AUTH SYSTEM ADDED: replaced ? with %s
            cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
            user = cursor.fetchone()
        except Exception as e:
            conn.close()
            return jsonify({"success": False, "error": str(e)}), 500
            
    conn.close()
    
    # AUTH SYSTEM ADDED: session handling
    session.permanent = True
    session["user_id"] = user["id"]
    
    user_info = {
        "id": user["id"],
        "fullName": user["fullName"],
        "email": user["email"],
        "phone": user["phone"] or "",
        "college": user["college"] or "",
        "branch": user["branch"] or "",
        "gradYear": user["gradYear"] or "",
        "role": user["role"]
    }
    return jsonify({"success": True, "user": user_info})

# ADDED FOR AI INTEGRATION
@app.route("/resume-analysis", methods=["POST"])
@app.route("/api/resume-analysis", methods=["POST"])
def resume_analysis():
    data = request.json or {}
    user_id = data.get("userId")
    resume_text = data.get("resumeText")
    
    if not resume_text and user_id:
        conn = get_db_connection()
        cursor = conn.cursor()
        # AUTH SYSTEM ADDED: replaced ? with %s
        cursor.execute("SELECT extractedText FROM resumes WHERE userId = %s", (user_id,))
        row = cursor.fetchone()
        conn.close()
        if row:
            resume_text = row["extractedText"]
            
    if not resume_text:
        return jsonify({"success": False, "error": "No resume text found or provided"}), 400
        
    try:
        from utils.ai_service import analyze_resume_text
        analysis = analyze_resume_text(resume_text)
        if not analysis:
            return jsonify({"success": False, "error": "Failed to analyze resume with AI"}), 500
        return jsonify({"success": True, "analysis": analysis})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/chat", methods=["POST"])
@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.json or {}
    user_id = data.get("userId")
    user_message = data.get("message")
    messages = data.get("messages")
    
    resume_text = None
    if user_id:
        conn = get_db_connection()
        cursor = conn.cursor()
        # AUTH SYSTEM ADDED: replaced ? with %s
        cursor.execute("SELECT extractedText FROM resumes WHERE userId = %s", (user_id,))
        row = cursor.fetchone()
        conn.close()
        if row:
            resume_text = row["extractedText"]
            
    if not messages:
        if not user_message:
            return jsonify({"success": False, "error": "No message or messages array provided"}), 400
        messages = [{"role": "user", "content": user_message}]
        
    try:
        from utils.ai_service import chat_with_coach
        response = chat_with_coach(messages, resume_text)
        if not response:
            return jsonify({"success": False, "error": "Failed to get AI response"}), 500
        return jsonify({"success": True, "response": response})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/job-match", methods=["POST"])
@app.route("/api/job-match", methods=["POST"])
def job_match():
    data = request.json or {}
    user_id = data.get("userId")
    job_id = data.get("jobId")
    resume_text = data.get("resumeText")
    job_description = data.get("jobDescription")
    
    if not resume_text and user_id:
        conn = get_db_connection()
        cursor = conn.cursor()
        # AUTH SYSTEM ADDED: replaced ? with %s
        cursor.execute("SELECT extractedText FROM resumes WHERE userId = %s", (user_id,))
        row = cursor.fetchone()
        conn.close()
        if row:
            resume_text = row["extractedText"]
            
    if not job_description and job_id:
        from utils.job_matcher import load_jobs
        jobs = load_jobs(JOBS_JSON_PATH)
        for j in jobs:
            if j["id"] == job_id:
                job_description = f"Title: {j.get('title')}\nCompany: {j.get('company')}\nRequired Skills: {', '.join(j.get('requiredSkills', []))}\nDescription: {j.get('description')}"
                break
                
    if not resume_text or not job_description:
        return jsonify({"success": False, "error": "Both resume text and job description are required"}), 400
        
    try:
        from utils.ai_service import match_job_compatibility
        match_result = match_job_compatibility(resume_text, job_description)
        if not match_result:
            return jsonify({"success": False, "error": "Failed to get AI job matching result"}), 500
        return jsonify({"success": True, "match": match_result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# ── RESUME TEMPLATES API ──

@app.route("/api/resume-templates", methods=["GET"])
def get_resume_templates():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, title, filename, category, uploaded_at FROM resume_templates ORDER BY uploaded_at DESC")
        templates = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify(templates)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/upload-template", methods=["POST"])
def upload_template():
    if "file" not in request.files:
        return jsonify({"success": False, "error": "No file uploaded"}), 400
        
    file = request.files["file"]
    title = request.form.get("title")
    category = request.form.get("category")
    user_id = request.form.get("userId")
    
    if not title or not category:
        return jsonify({"success": False, "error": "Title and Category are required"}), 400
        
    if file.filename == "":
        return jsonify({"success": False, "error": "Empty filename"}), 400
        
    ext = file.filename.split(".")[-1].lower()
    if ext not in ["pdf", "docx"]:
        return jsonify({"success": False, "error": "Only PDF and DOCX files are allowed."}), 400
        
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)
    if file_size > 5 * 1024 * 1024:
        return jsonify({"success": False, "error": "File size exceeds the 5MB limit."}), 400
        
    if not user_id:
        user_id = session.get("user_id")
        
    if not user_id:
        return jsonify({"success": False, "error": "Authentication required"}), 401
        
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT role FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        if not user or user["role"] != "admin":
            conn.close()
            return jsonify({"success": False, "error": "Access denied. Admin privileges required."}), 403
            
        cursor.execute("SELECT id FROM resume_templates WHERE filename = %s", (file.filename,))
        if cursor.fetchone():
            conn.close()
            return jsonify({"success": False, "error": f"A template with filename '{file.filename}' already exists."}), 409
            
        templates_dir = os.path.join(UPLOAD_FOLDER, "resume_templates")
        file_path = os.path.join(templates_dir, file.filename)
        file.save(file_path)
        
        cursor.execute(
            "INSERT INTO resume_templates (title, filename, category) VALUES (%s, %s, %s)",
            (title, file.filename, category)
        )
        conn.close()
        
        return jsonify({"success": True, "message": "Template uploaded successfully!"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/template/<int:template_id>", methods=["GET"])
def download_template(template_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT title, filename FROM resume_templates WHERE id = %s", (template_id,))
        row = cursor.fetchone()
        conn.close()
        if not row:
            return jsonify({"success": False, "error": "Template not found"}), 404
            
        filename = row["filename"]
        templates_dir = os.path.join(UPLOAD_FOLDER, "resume_templates")
        
        as_attachment = request.args.get("download", "false").lower() == "true"
        
        return send_from_directory(
            templates_dir,
            filename,
            as_attachment=as_attachment,
            download_name=filename
        )
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5000, debug=True)
