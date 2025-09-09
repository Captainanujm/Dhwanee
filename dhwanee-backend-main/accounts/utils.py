from .models import AccountLedger


def get_opening_balance(account_id, date):
    b = (
        AccountLedger.objects.filter(account=account_id, date__lte=date)
        .order_by("date", "id")
        .last()
    )
    if b:
        return float(b.balance_after)
    return 0


def correct_all_ledgers_after(account_id: int, date):
    balance = get_opening_balance(account_id, date)
    ledgers = AccountLedger.objects.filter(account=account_id, date__gt=date).order_by(
        "date", "id"
    )

    for ledger in ledgers:
        ledger.balance_before = balance
        ledger.balance_after = balance + float(ledger.amount)
        balance = float(ledger.balance_after)
        ledger.save()
    return balance
