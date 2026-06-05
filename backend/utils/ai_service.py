# ADDED FOR AI INTEGRATION
import json
import os
import urllib.request
import urllib.error

# Config parameters for FreeLLMAPI
FREELLMAPI_URL = os.environ.get("FREELLMAPI_URL", "http://localhost:3001/v1")
FREELLMAPI_KEY = os.environ.get("FREELLMAPI_KEY", "freellmapi-key-placeholder")
FREELLMAPI_MODEL = os.environ.get("FREELLMAPI_MODEL", "auto")

def extract_json(llm_output):
    """
    Safely extracts and parses JSON content from the LLM output,
    cleaning up any markdown code blocks if necessary.
    """
    if not llm_output:
        return None
        
    s = llm_output.strip()
    if s.startswith("```json"):
        s = s[7:]
    elif s.startswith("```"):
        s = s[3:]
    if s.endswith("```"):
        s = s[:-3]
    s = s.strip()
    
    try:
        return json.loads(s)
    except Exception as e:
        print(f"[AI SERVICE] JSON parsing error: {e}. Raw content: {llm_output}")
        # Try to locate the JSON block using bracket delimiters
        try:
            start_idx = s.find('{')
            end_idx = s.rfind('}')
            if start_idx != -1 and end_idx != -1:
                return json.loads(s[start_idx:end_idx+1])
        except Exception as e2:
            print(f"[AI SERVICE] Delimiter JSON parsing error: {e2}")
        return None

def call_llm(prompt, system_message=None):
    """
    Makes a POST call to the FreeLLMAPI endpoint using messages structure.
    """
    messages = []
    if system_message:
        messages.append({"role": "system", "content": system_message})
    messages.append({"role": "user", "content": prompt})
    
    return call_llm_messages(messages)

def call_llm_messages(messages):
    """
    Makes a POST call to the FreeLLMAPI endpoint using standard messages layout.
    """
    payload = {
        "model": FREELLMAPI_MODEL,
        "messages": messages,
        "temperature": 0.2
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    if FREELLMAPI_KEY:
        headers["Authorization"] = f"Bearer {FREELLMAPI_KEY}"
        
    url = f"{FREELLMAPI_URL.rstrip('/')}/chat/completions"
    req_body = json.dumps(payload).encode("utf-8")
    
    # Try requests library if available
    try:
        import requests
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        if response.status_code == 200:
            res_data = response.json()
            return res_data["choices"][0]["message"]["content"]
        else:
            print(f"[AI SERVICE] FreeLLMAPI returned status code: {response.status_code} - {response.text}")
    except ImportError:
        # Fallback to python standard library urllib
        try:
            req = urllib.request.Request(url, data=req_body, headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=30) as response:
                res_body = response.read().decode("utf-8")
                res_data = json.loads(res_body)
                return res_data["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"[AI SERVICE] urllib call failed: {e}")
    except Exception as e:
        print(f"[AI SERVICE] requests call failed: {e}")
        
    return None

def analyze_resume_text(resume_text):
    """
    Analyze resume content and return structured strengths, weaknesses, and optimization advice.
    """
    prompt = f"""
    You are an ATS (Applicant Tracking System) optimizer and professional career coach.
    Analyze the following resume text and provide structured feedback.
    
    Resume Text:
    \"\"\"{resume_text}\"\"\"
    
    Provide the analysis results in JSON format with the following keys:
    - "strengths": A list of key strengths identified in the resume (3-5 items).
    - "weaknesses": A list of gaps or areas needing improvement (3-5 items).
    - "improvements": Actionable advice to improve formatting, impact, or content (3-5 items).
    - "recommendations": An object containing lists of recommended "skills", "projects", and "certifications" to target.
    
    Respond ONLY with the JSON object. Do not include any introductory or concluding text outside of the JSON block.
    """
    output = call_llm(prompt)
    return extract_json(output)

def chat_with_coach(messages, resume_text=None):
    """
    Generates conversational response using the career coach persona, optionally aware of resume details.
    """
    system_message = "You are a helpful and experienced Career Coach. "
    if resume_text:
        system_message += f"The user's resume details are as follows:\n{resume_text}\n"
    system_message += "Provide concise, encouraging, and highly professional career coaching advice."
    
    full_messages = [{"role": "system", "content": system_message}] + messages
    return call_llm_messages(full_messages)

def match_job_compatibility(resume_text, job_description):
    """
    Evaluates how well a resume fits a target job description.
    """
    prompt = f"""
    You are an expert recruiter. Analyze the compatibility between this resume and the job description.
    
    Resume:
    \"\"\"{resume_text}\"\"\"
    
    Job Description:
    \"\"\"{job_description}\"\"\"
    
    Assess the candidate's fit for this role and respond ONLY with a JSON object containing:
    - "matchPercentage": An integer between 0 and 100 indicating fit.
    - "matchedSkills": A list of skills/requirements from the job description that the candidate possesses.
    - "missingSkills": A list of skills/requirements from the job description that the candidate lacks.
    - "compatibilityExplanation": A brief explanation of the fit (2-3 sentences).
    - "tailoringSuggestions": A list of actionable suggestions to tailor the resume for this job (e.g. key terms to add, projects to highlight).
    
    Respond ONLY with the JSON object. Do not include any introductory or concluding text outside of the JSON block.
    """
    output = call_llm(prompt)
    return extract_json(output)
