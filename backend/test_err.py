import requests, re
r = requests.post('http://127.0.0.1:8000/api/enrollments/', headers={'Host': 'epic.localhost:8000'}, json={'student_name': 'John Doe', 'student_age': 10, 'father_name': 'Jane Doe', 'father_phone': '123', 'school': 22})
print(re.search(r'(?<=<title>).*?(?=</title>)', r.text, re.DOTALL).group(0).strip())
print(re.search(r'(?<=<textarea id="traceback_area" cols="140" rows="25">).*?(?=</textarea>)', r.text, re.DOTALL).group(0).strip())
