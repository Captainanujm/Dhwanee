from customers.models import CustomerLedger


def get_opening_balance(customer, date):
    b = (
        CustomerLedger.objects.filter(customer=customer, date__lte=date)
        .order_by("date", "id")
        .last()
    )
    if b:
        return float(b.balance_after)
    return 0


def correct_all_ledgers_after(customer, date):
    balance = get_opening_balance(customer, date)
    ledgers = CustomerLedger.objects.filter(customer=customer, date__gt=date).order_by(
        "date"
    )

    for ledger in ledgers:
        ledger.balance_before = balance
        ledger.balance_after = balance + float(ledger.amount)
        balance = float(ledger.balance_after)
        ledger.save()
    return balance
