import requests

def check_tenant(host_header):
    url = f"http://127.0.0.1:8000/api/tenant-info/"
    headers = {"Host": host_header}
    try:
        response = requests.get(url, headers=headers)
        print(f"--- Checking Host Header: {host_header} ---")
        print(f"Status Code: {response.status_code}")
        print(f"JSON Response: {response.json()}")
    except Exception as e:
        print(f"Error checking {host_header}: {e}")

if __name__ == "__main__":
    check_tenant("localhost")
    check_tenant("school1.localhost")
    check_tenant("school2.localhost")
    check_tenant("invalid.localhost")
