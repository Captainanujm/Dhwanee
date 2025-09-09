from .models import SupplierLedger

def get_opening_balance(supplier, date):
    b = SupplierLedger.objects.filter(supplier=supplier, date__lte=date).order_by("date", "id").last()
    if b:
        return float(b.balance_after)
    return 0

def correct_all_ledgers_after(supplier, date):
    balance = get_opening_balance(supplier, date)
    ledgers = SupplierLedger.objects.filter(supplier=supplier, date__gt=date).order_by("date", "id")

    for ledger in ledgers:
        ledger.balance_before = balance
        ledger.balance_after = balance + float(ledger.amount)
        balance = float(ledger.balance_after)
        ledger.save()
    return balance
