def pad(n, places: int) -> str:
    n = str(n)
    if(len(n) < places):
        n = "0" * (places-len(n)) + n
    return n
