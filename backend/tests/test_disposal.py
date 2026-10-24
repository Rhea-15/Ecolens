from app.disposal import search_facilities


def test_filters_by_category():
    res = search_facilities("", "Batteries")
    assert all("Batteries" in f["accepts"] for f in res)


def test_filters_by_location_text():
    res = search_facilities("brooklyn", "All items")
    assert len(res) == 1 and "Brooklyn" in res[0]["name"]


def test_no_match_returns_empty():
    assert search_facilities("zzzz-nowhere", "All items") == []