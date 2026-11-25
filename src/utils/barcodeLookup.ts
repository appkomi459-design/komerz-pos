/**
 * Consulta gratuita en OpenFoodFacts para obtener nombre e imagen
 * de un producto a partir de su código de barras (EAN-13 / UPC) cuando
 * aún no existe en el inventario del negocio.
 */
export interface OnlineBarcodeInfo {
  name?: string;
  brand?: string;
  imageUrl?: string;
}

export async function lookupBarcodeOnline(code: string): Promise<OnlineBarcodeInfo | null> {
  const clean = code.trim();
  if (!clean || clean.length < 6) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(clean)}.json?fields=product_name,product_name_es,brands,image_front_small_url,image_url`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data = await res.json();
    if (data?.status !== 1 || !data?.product) return null;

    const p = data.product;
    const rawName = (p.product_name_es || p.product_name || '').trim();
    const brand = (p.brands || '').split(',')[0]?.trim();
    const fullName = rawName
      ? brand && !rawName.toLowerCase().includes(brand.toLowerCase())
        ? `${rawName} (${brand})`
        : rawName
      : brand || undefined;

    const imageUrl = p.image_front_small_url || p.image_url || undefined;

    if (!fullName && !imageUrl) return null;
    return { name: fullName, brand, imageUrl };
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}
