<?php

namespace App\Enums;

enum ReminderType: string
{
    case PendingPayment = 'pending_payment';
    case PaymentDp = 'payment_dp';
    case PaymentPaid = 'payment_paid';
    case SettlementH1 = 'settlement_h1';
    case Settlement6h = 'settlement_6h';
    case PlayH1 = 'play_h1';
    case Play1h = 'play_1h';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
