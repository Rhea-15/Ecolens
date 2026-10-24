from .config import facilities


def search_facilities(location: str, category: str) -> list[dict]:
    """
    Rule-based filter. Location matches name, address, city or state.
    A specific category only returns facilities with that item listed in
    `accepts`. Facilities with no listed items appear only under "All items".
    """
    q = location.strip().lower()
    cat = category.strip().lower()
    results = []
    for f in facilities():
        haystack = " ".join(
            [f["name"], f["address"], f.get("city", ""), f.get("state", "")]
        ).lower()
        text_match = not q or q in haystack

        if cat in ("", "all items"):
            category_match = True
        else:
            category_match = cat in [a.lower() for a in f.get("accepts", [])]

        if text_match and category_match:
            results.append(f)
    return results