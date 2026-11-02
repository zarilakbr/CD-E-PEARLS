<?php

use App\Console\Commands\CheckSeedAccountsCommand;
use App\Console\Commands\ExpireOrderReservationsCommand;
use App\Console\Commands\MigratePaymentProofsToPrivateCommand;
use App\Console\Commands\SetStaffPasswordCommand;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::registerCommand(new SetStaffPasswordCommand());
Artisan::registerCommand(new CheckSeedAccountsCommand());
Artisan::registerCommand(new ExpireOrderReservationsCommand());
Artisan::registerCommand(new MigratePaymentProofsToPrivateCommand());

Schedule::command('orders:expire-reservations')->everyTenMinutes();
