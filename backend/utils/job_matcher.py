import json
import os

def load_jobs(jobs_json_path):
    """Load jobs catalog from jobs.json."""
    if not os.path.exists(jobs_json_path):
        return []
    try:
        with open(jobs_json_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading jobs file: {e}")
        return []

def get_recommended_jobs(user_skills, jobs_json_path):
    """
    Compares user skills against all jobs.
    Calculates match percentage and returns sorted list.
    """
    jobs = load_jobs(jobs_json_path)
    user_skills_set = set(s.lower() for s in user_skills)
    
    recommended_jobs = []
    
    for job in jobs:
        req_skills = job.get("requiredSkills", [])
        if not req_skills:
            match_pct = 0
            matched = []
            missing = []
        else:
            req_skills_lower = [s.lower() for s in req_skills]
            matched_set = user_skills_set.intersection(set(req_skills_lower))
            
            # Map back to original casing in job['requiredSkills']
            matched = []
            missing = []
            for skill in req_skills:
                if skill.lower() in matched_set:
                    matched.append(skill)
                else:
                    missing.append(skill)
                    
            match_pct = round((len(matched) / len(req_skills)) * 100)
            
        # Create a deep copy of the job and append matching details
        job_recommendation = dict(job)
        job_recommendation["matchPercentage"] = match_pct
        job_recommendation["matchedSkills"] = matched
        job_recommendation["missingSkills"] = missing
        
        recommended_jobs.append(job_recommendation)
        
    # Sort by match percentage (highest first)
    recommended_jobs.sort(key=lambda x: x["matchPercentage"], reverse=True)
    return recommended_jobs

def analyze_skill_gap(user_skills, job):
    """
    Analyzes gaps for a specific job.
    Returns matched, missing, priority, and suggestions.
    """
    user_skills_set = set(s.lower() for s in user_skills)
    req_skills = job.get("requiredSkills", [])
    
    matched = []
    missing = []
    
    for skill in req_skills:
        if skill.lower() in user_skills_set:
            matched.append(skill)
        else:
            missing.append(skill)
            
    # Generate roadmap priority & suggestions
    learning_suggestions = []
    
    for skill in missing:
        # Determine priority based on importance (fictional heuristic for demonstration)
        priority = "HIGH" if skill in ["Spring Boot", "React", "Python", "SQL", "REST API", "Java"] else "MED"
        learning_suggestions.append({
            "skill": skill,
            "priority": priority,
            "desc": f"Crucial framework found in {job.get('company')} requirements. Closing this gap increases match odds.",
            "resources": [
                {"name": "Udemy/YouTube tutorials", "url": "#"},
                {"name": f"Official {skill} Documentation", "url": "#"}
            ]
        })
        
    return {
        "matchedSkills": matched,
        "missingSkills": missing,
        "learningSuggestions": learning_suggestions
    }
