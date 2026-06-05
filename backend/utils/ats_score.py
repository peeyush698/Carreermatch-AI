import re

ACTION_VERBS = [
    "developed", "implemented", "optimized", "created", "designed",
    "managed", "built", "researched", "solved", "programmed",
    "coded", "integrated", "deployed", "analyzed", "improved",
    "led", "coordinated", "achieved", "executed", "architected"
]

def calculate_ats_score(parser_results, extracted_skills):
    """
    Calculates an ATS score out of 100 and returns a breakdown and targeted suggestions.
    """
    text = parser_results["text"]
    text_lower = text.lower()
    
    # 1. Contact details: 10 pts
    contact_score = 0
    has_name = bool(parser_results["name"])
    has_email = bool(parser_results["email"])
    has_phone = bool(parser_results["phone"])
    
    if has_name: contact_score += 4
    if has_email: contact_score += 3
    if has_phone: contact_score += 3

    # 2. Skills: 20 pts
    # 2 pts per matching skill, max 10 skills
    skills_score = min(20, len(extracted_skills) * 2)

    # 3. Education: 15 pts
    education_score = 15 if parser_results["sections"]["education"] else 0

    # 4. Projects: 15 pts
    projects_score = 15 if parser_results["sections"]["projects"] else 0

    # 5. Experience: 10 pts
    experience_score = 10 if parser_results["sections"]["experience"] else 0

    # 6. Certifications: 10 pts
    certifications_score = 10 if parser_results["sections"]["certifications"] else 0

    # 7. Action verbs: 15 pts
    # Find unique action verbs in the text
    found_verbs = []
    for verb in ACTION_VERBS:
        if re.search(r'\b' + verb + r'\b', text_lower):
            found_verbs.append(verb)
    verbs_score = min(15, len(found_verbs) * 1.5)

    # 8. Resume format & length: 5 pts
    word_count = len(text.split())
    if 200 <= word_count <= 1000:
        format_score = 5
    elif 100 <= word_count <= 1500:
        format_score = 3
    else:
        format_score = 1

    # Aggregate total
    total_score = round(
        contact_score +
        skills_score +
        education_score +
        projects_score +
        experience_score +
        certifications_score +
        verbs_score +
        format_score
    )
    
    # Suggestions logic
    suggestions = []
    
    # Contact suggestions
    if not (has_email and has_phone):
        suggestions.append({
            "type": "error",
            "text": "<strong>Missing Contact Details</strong> — Ensure your Email Address and Phone Number are prominently displayed at the top of your resume."
        })
        
    # Skills suggestions
    if len(extracted_skills) < 5:
        suggestions.append({
            "type": "warning",
            "text": "<strong>Low Skill Density</strong> — Add more technical keywords to your skills section. Target high-demand skills like React, Spring Boot, or SQL."
        })
        
    # Sections suggestions
    if not parser_results["sections"]["experience"]:
        suggestions.append({
            "type": "warning",
            "text": "<strong>Experience section missing</strong> — Add details of internships, freelancing, or previous jobs to establish professional credibility."
        })
        
    if not parser_results["sections"]["projects"]:
        suggestions.append({
            "type": "error",
            "text": "<strong>No Projects Detected</strong> — Include a structured Projects section detailing what technologies you used and your exact contributions."
        })
        
    if not parser_results["sections"]["certifications"]:
        suggestions.append({
            "type": "warning",
            "text": "<strong>No Certifications listed</strong> — Adding professional credentials (e.g. AWS, Oracle, Google Cloud) enhances fresher resume weight."
        })

    # Verbs and quantifiable metrics suggestions
    if len(found_verbs) < 4:
        suggestions.append({
            "type": "error",
            "text": "<strong>Weak Action Verbs</strong> — Start bullet points with impact words like 'Developed', 'Implemented', 'Optimized' rather than 'Worked on'."
        })
    else:
        suggestions.append({
            "type": "success",
            "text": "<strong>Strong Action Verbs</strong> — Your resume leverages dynamic power verbs to describe your individual contributions effectively."
        })

    # Quantifiable metrics heuristic (numbers / percentages)
    numbers = re.findall(r'\b\d+(?:%|\s*percent|\s*LPA|\s*L)?\b', text)
    # Filter out year numbers like 2023, 2024, etc.
    filtered_numbers = [num for num in numbers if num not in ["2020", "2021", "2022", "2023", "2024", "2025", "2026", "2027", "2028"]]
    if len(filtered_numbers) < 3:
        suggestions.append({
            "type": "error",
            "text": "<strong>Add quantifiable achievements</strong> — Replace general statements with metrics. E.g. 'Reduced database load by 35%' or 'Developed 4 modules'."
        })
    else:
        suggestions.append({
            "type": "success",
            "text": "<strong>Quantified Achievements</strong> — Your resume includes numbers and measurable results which dramatically improve ATS readability."
        })

    if 200 <= word_count <= 1000:
        suggestions.append({
            "type": "success",
            "text": "<strong>Perfect Length</strong> — Your word count is well-proportioned for a fresher/student resume, allowing easy extraction by ATS spiders."
        })
        
    # Calculate mapped scores for the frontend
    keywords_score = round((skills_score / 20) * 100)
    format_score_val = round((format_score / 5) * 100)
    content_score = round(((contact_score + (education_score / 1.5) + (projects_score / 1.5) + experience_score + certifications_score) / 50) * 100)
    verbs_score_val = round((verbs_score / 15) * 100)
    metrics_score = 100 if len(filtered_numbers) >= 3 else (60 if len(filtered_numbers) >= 1 else 30)

    return {
        "score": total_score,
        "breakdown": {
            "contact": round(contact_score * 10),  # Convert out of 100 for ui consistency
            "skills": keywords_score,
            "education": round((education_score / 15) * 100),
            "projects": round((projects_score / 15) * 100),
            "experience": round((experience_score / 10) * 100),
            "certifications": round((certifications_score / 10) * 100),
            "verbs": verbs_score_val,
            "format": format_score_val,
            # Mapped keys for frontend compatibility
            "keywords": keywords_score,
            "content": content_score,
            "metrics": metrics_score
        },
        "suggestions": suggestions
    }
