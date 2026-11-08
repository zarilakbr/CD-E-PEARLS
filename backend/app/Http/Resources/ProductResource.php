<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
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
        }

        // Generate absolute webp_url
        if (! empty($data['image'])) {
            $data['webp_url'] = preg_replace('/\.(jpg|jpeg|png)$/i', '.webp', $data['image']);
        } else {
            $data['webp_url'] = null;
        }

        // Also resolve images array if present
        if (! empty($data['images']) && is_array($data['images'])) {
            $data['images'] = array_map(function ($img) use ($appUrl) {
                if (is_array($img)) {
                    if (! empty($img['url']) && ! str_starts_with($img['url'], 'http://') && ! str_starts_with($img['url'], 'https://')) {
                        $img['url'] = $appUrl . '/' . ltrim($img['url'], '/');
                    }
                    if (! empty($img['url'])) {
                        $img['webp_url'] = preg_replace('/\.(jpg|jpeg|png)$/i', '.webp', $img['url']);
                    }
                    return $img;
                }
                if (is_string($img) && ! str_starts_with($img, 'http://') && ! str_starts_with($img, 'https://')) {
                    return $appUrl . '/' . ltrim($img, '/');
                }
                return $img;
            }, $data['images']);
        }

        return $data;
    }
}
