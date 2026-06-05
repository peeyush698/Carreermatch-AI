import re

ALL_SKILLS = [
    "Java", "Python", "C++", "SQL", "MySQL", "HTML", "CSS", "JavaScript", 
    "React", "Angular", "Node.js", "Express.js", "Flask", "Django", "Spring Boot", 
    "REST API", "Git", "GitHub", "MongoDB", "Machine Learning", "Data Analysis", 
    "Excel", "Power BI", "Communication", "Teamwork", "Problem Solving"
]

def extract_skills(text):
    """Case-insensitive scanning for skills list with boundary checks."""
    matched_skills = []
    text_lower = text.lower()
    
    for skill in ALL_SKILLS:
        # Prepare regex pattern
        if skill == "C++":
            # C++ needs custom boundary since '+' is not a word character
            pattern = r'\bc\+\+(?!\+)'
        elif skill == "Node.js":
            pattern = r'\bnode\.js\b|\bnode\b'
        elif skill == "Express.js":
            pattern = r'\bexpress\.js\b|\bexpress\b'
        elif skill == "REST API":
            pattern = r'\brest\s+api\b|\brestful\b'
        elif skill == "HTML":
            pattern = r'\bhtml\b|\bhtml5\b'
        elif skill == "CSS":
            pattern = r'\bcss\b|\bcss3\b'
        elif skill == "Machine Learning":
            pattern = r'\bmachine\s+learning\b|\bml\b'
        elif skill == "Data Analysis":
            pattern = r'\bdata\s+analysis\b|\bdata\s+analytics\b'
        elif skill == "Problem Solving":
            pattern = r'\bproblem\s+solving\b'
        elif skill == "Power BI":
            pattern = r'\bpower\s*bi\b'
        else:
            # Standard word boundary match
            pattern = r'\b' + re.escape(skill.lower()) + r'\b'
            
        if re.search(pattern, text_lower):
            matched_skills.append(skill)
            
    return matched_skills
