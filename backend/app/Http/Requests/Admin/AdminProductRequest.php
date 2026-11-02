<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdminProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user && in_array($user->role, ['admin', 'spi'], true);
    }

    public function rules(): array
    {
        $isPost = $this->isMethod('POST');

        return [
            'name' => [$isPost ? 'required' : 'sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category_slug' => [$isPost ? 'required' : 'sometimes', 'string', 'exists:categories,slug'],
            'varietas' => [$isPost ? 'required' : 'sometimes', 'string', Rule::in([
                'Freshwater', 'South Sea', 'Tahitian',
                'Freshwater Pearl', 'South Sea Pearl', 'Tahitian Black Pearl', 'Golden South Sea',
            ])],
            'grade' => [$isPost ? 'required' : 'sometimes', 'string', Rule::in(['Low', 'C', 'B', 'A', 'AA', 'AAA'])],
            'ukuran_mm' => [
                $isPost ? 'required' : 'sometimes',
                function ($attribute, $value, $fail) {
                    $num = null;
                    if (is_numeric($value)) {
                        $num = (float) $value;
                    } elseif (is_string($value) && preg_match('/^([0-9]+(?:\.[0-9]+)?)/', trim($value), $matches)) {
                        $num = (float) $matches[1];
                    }

                    if ($num === null || $num < 9.0 || $num > 21.0) {
                        $fail('Ukuran mutiara wajib berada dalam rentang 9 hingga 21 mm.');
                    }
                },
            ],
            'berat' => ['nullable', 'string', 'max:50'],
            'bentuk' => ['nullable', 'string', 'max:50'],
            'kelompok_warna' => [$isPost ? 'required' : 'sometimes', 'string', Rule::in(['putih', 'emas', 'kuning', 'langka'])],
            'varian_warna' => ['nullable', 'string', 'max:100'],
            'price' => [$isPost ? 'required' : 'sometimes', 'numeric', 'min:0'],
            'stock' => [$isPost ? 'required' : 'sometimes', 'integer', 'min:0'],
            'original_price' => ['nullable', 'numeric', 'min:0'],
            'status' => ['nullable', 'string', Rule::in(['published', 'draft', 'archived'])],
            'certificate_id' => ['nullable', 'exists:certificates,id'],
            'is_featured' => ['nullable', 'boolean'],
            'is_bestseller' => ['nullable', 'boolean'],
            'photos' => ['nullable', 'array', 'max:10'],
            'photos.*' => ['file', 'mimes:jpeg,jpg,png,webp', 'mimetypes:image/jpeg,image/png,image/webp', 'max:5120'],
            'photo_alts' => ['nullable', 'array'],
            'photo_alts.*' => ['nullable', 'string', 'max:255'],
            'primary_photo_index' => ['nullable', 'integer', 'min:0'],
            'reason' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'price.min' => 'Harga perhiasan mutiara tidak boleh kurang dari Rp 0.',
            'stock.min' => 'Stok produk mutiara tidak boleh kurang dari 0 unit.',
            'varietas.in' => 'Jenis mutiara harus salah satu dari: Freshwater, South Sea, atau Tahitian.',
            'grade.in' => 'Grade mutiara harus salah satu dari: Low, C, B, A, AA, atau AAA.',
            'kelompok_warna.in' => 'Kelompok warna harus salah satu dari: putih, emas, kuning, atau langka.',
            'photos.*.mimetypes' => 'Berkas foto harus berupa citra asli bertipe JPEG, PNG, atau WebP.',
        ];
    }
}

