from .models import ProductLedger

def get_product_opening_balance(product, date):
    b = (
        ProductLedger.objects.filter(product=product, date__lte=date)
        .order_by("date")
        .last()
    )
    if b:
        return float(b.bal_after)
    return 0


def correct_all_product_ledgers_after(product, date):
    balance = get_product_opening_balance(product, date)
    ledgers = ProductLedger.objects.filter(product=product, date__gt=date).order_by(
        "date"
    )

    for ledger in ledgers:
        ledger.bal_before = balance
        ledger.bal_after = balance + float(ledger.amount)
        balance = float(ledger.bal_after)
        ledger.save()
    return balance
