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

    protected function prepareForValidation(): void
    {
        if ($this->has('ukuran_mm') && is_numeric($this->ukuran_mm)) {
            $this->merge(['ukuran_mm' => (string) $this->ukuran_mm]);
        }
        if ($this->has('jumlah') && is_numeric($this->jumlah)) {
            $this->merge(['jumlah' => (string) $this->jumlah]);
        }
        if ($this->has('berat') && is_numeric($this->berat)) {
            $this->merge(['berat' => (string) $this->berat]);
        }
        if ($this->has('code') && is_numeric($this->code)) {
            $this->merge(['code' => (string) $this->code]);
        }
    }

    public function rules(): array
    {
        $isPost = $this->isMethod('POST');

        return [
            'code' => ['nullable', 'string', 'max:100'],
            'name' => [$isPost ? 'required' : 'sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category_slug' => [$isPost ? 'required' : 'sometimes', 'string', 'exists:categories,slug'],
            'varietas' => ['nullable', 'string', 'max:100'],
            'grade' => ['nullable', 'string', 'max:100'],
            'ukuran_mm' => ['nullable', 'string', 'max:100'],
            'jumlah' => ['nullable', 'string', 'max:100'],
            'berat' => ['nullable', 'string', 'max:100'],
            'bentuk' => ['nullable', 'string', 'max:50'],
            'kelompok_warna' => ['nullable', 'string', 'max:50'],
            'varian_warna' => ['nullable', 'string', 'max:100'],
            'price' => [$isPost ? 'required' : 'sometimes', 'numeric', 'min:0'],
            'stock' => [$isPost ? 'required' : 'sometimes', 'integer', 'min:0'],
            'original_price' => ['nullable', 'numeric', 'min:0'],
            'status' => ['nullable', 'string', Rule::in(['published', 'draft', 'archived', 'pending_approval'])],
            'certificate_id' => ['nullable', 'exists:certificates,id'],
            'certificate_number' => ['nullable', 'string', 'max:100'],
            'certificate_file' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
            'is_featured' => ['nullable', 'boolean'],
            'is_bestseller' => ['nullable', 'boolean'],
            'photos' => ['nullable', 'array', 'max:10'],
            'photos.*' => ['file', 'mimes:jpeg,jpg,png,webp', 'mimetypes:image/jpeg,image/png,image/webp', 'max:5120', 'dimensions:max_width=4000,max_height=4000'],
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
            'photos.*.dimensions' => 'Dimensi foto produk tidak boleh melebihi 4000 piksel pada sisi terpanjang.',
        ];
    }
}

