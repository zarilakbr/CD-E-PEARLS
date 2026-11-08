<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CategoryResource extends JsonResource
{
    /**
     * Transform the resource into an array with absolute media URLs based on APP_URL.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $data = parent::toArray($request);

        $appUrl = rtrim(config('app.url'), '/');

        // Resolve absolute URL for image
        if (! empty($data['image'])) {
            if (! str_starts_with($data['image'], 'http://') && ! str_starts_with($data['image'], 'https://')) {
                $data['image'] = $appUrl . '/' . ltrim($data['image'], '/');
            }
        } else {
            $data['image'] = null;
        }

        // Generate or resolve absolute webp_url
        if (! empty($data['webp_url'])) {
            if (! str_starts_with($data['webp_url'], 'http://') && ! str_starts_with($data['webp_url'], 'https://')) {
                $data['webp_url'] = $appUrl . '/' . ltrim($data['webp_url'], '/');
            }
        } elseif (! empty($data['image'])) {
            $data['webp_url'] = preg_replace('/\.(jpg|jpeg|png)$/i', '.webp', $data['image']);
        } else {
            $data['webp_url'] = null;
        }

        return $data;
    }
}

