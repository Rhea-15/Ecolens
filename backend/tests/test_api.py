from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_rejects_wrong_mime():
    r = client.post("/api/scan", files={"file": ("x.txt", b"hi", "text/plain")})
    assert r.status_code == 415


def test_facilities_endpoint():
    r = client.post("/api/facilities/search", json={"location": "", "category": "Phones"})
    assert r.status_code == 200
    assert len(r.json()["results"]) >= 1