// Extracted from the inline Waze template string that used to live directly
// in InviteView.tsx - now shared so any new "get directions" UI (the
// category-aware location field, InvitePhotoCard, ...) uses the exact same
// link everywhere instead of re-deriving it.
export function wazeUrl(address: string): string {
  return `https://waze.com/ul?q=${encodeURIComponent(address)}`;
}

export function googleMapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
