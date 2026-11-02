<?php

use Database\Seeders\DatabaseSeeder;
use Illuminate\Support\Env;

afterEach(function () {
    app()['env'] = 'testing';
});

test('seeder in production without SEED_USER_PASSWORD throws RuntimeException', function () {
    app()['env'] = 'production';
    Env::getRepository()->clear('SEED_USER_PASSWORD');
    Env::getRepository()->set('SEED_ADMIN_PASSWORD', 'ValidAdminPass123!');
    Env::getRepository()->set('SEED_SPI_PASSWORD', 'ValidSpiPass123!');

    expect(fn () => (new DatabaseSeeder())->run())
        ->toThrow(\RuntimeException::class, 'SEED_USER_PASSWORD');
});

test('seeder in production without SEED_ADMIN_PASSWORD throws RuntimeException', function () {
    app()['env'] = 'production';
    Env::getRepository()->set('SEED_USER_PASSWORD', 'ValidUserPass123!');
    Env::getRepository()->clear('SEED_ADMIN_PASSWORD');
    Env::getRepository()->set('SEED_SPI_PASSWORD', 'ValidSpiPass123!');

    expect(fn () => (new DatabaseSeeder())->run())
        ->toThrow(\RuntimeException::class, 'SEED_ADMIN_PASSWORD');
});

test('seeder in production without SEED_SPI_PASSWORD throws RuntimeException', function () {
    app()['env'] = 'production';
    Env::getRepository()->set('SEED_USER_PASSWORD', 'ValidUserPass123!');
    Env::getRepository()->set('SEED_ADMIN_PASSWORD', 'ValidAdminPass123!');
    Env::getRepository()->clear('SEED_SPI_PASSWORD');

    expect(fn () => (new DatabaseSeeder())->run())
        ->toThrow(\RuntimeException::class, 'SEED_SPI_PASSWORD');
});

test('seeder in local environment without SEED_* throws RuntimeException', function () {
    app()['env'] = 'local';
    Env::getRepository()->clear('SEED_USER_PASSWORD');
    Env::getRepository()->set('SEED_ADMIN_PASSWORD', 'ValidAdminPass123!');
    Env::getRepository()->set('SEED_SPI_PASSWORD', 'ValidSpiPass123!');

    expect(fn () => (new DatabaseSeeder())->run())
        ->toThrow(\RuntimeException::class, 'SEED_USER_PASSWORD');
});

test('seeder in testing environment falls back safely to test credentials without throwing', function () {
    app()['env'] = 'testing';
    Env::getRepository()->clear('SEED_USER_PASSWORD');
    Env::getRepository()->clear('SEED_ADMIN_PASSWORD');
    Env::getRepository()->clear('SEED_SPI_PASSWORD');

    expect(fn () => (new DatabaseSeeder())->run())
        ->not->toThrow(\RuntimeException::class);
});
