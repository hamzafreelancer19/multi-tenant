import urllib.request, json, urllib.error
try:
    token_req = urllib.request.Request('http://localhost:8000/api/token/', data=b'{"username":"admin","password":"adminpassword"}', headers={'Content-Type': 'application/json'})
    token = json.loads(urllib.request.urlopen(token_req).read().decode())['access']
    stats_req = urllib.request.Request('http://localhost:8000/api/dashboard/stats/', headers={'Authorization': 'Bearer ' + token})
    urllib.request.urlopen(stats_req)
except urllib.error.HTTPError as e:
    html = e.read().decode()
    import re
    match = re.search(r'<div class="exception_value">(.*?)</div>', html, re.DOTALL)
    if match:
        print("Error content:", match.group(1).strip())
    else:
        print("Error title:", re.search(r'<title>(.*?)</title>', html).group(1))
