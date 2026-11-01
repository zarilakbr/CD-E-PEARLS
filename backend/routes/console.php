<?php

use App\Console\Commands\CheckSeedAccountsCommand;
use App\Console\Commands\SetStaffPasswordCommand;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::registerCommand(new SetStaffPasswordCommand());
Artisan::registerCommand(new CheckSeedAccountsCommand());
