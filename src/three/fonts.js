const FONTS = [
  ['Anton', '900'],
  ['Archivo Black', '900'],
  ['Space Mono', '700'],
];

export async function ensureFontsReady() {
  if (!('fonts' in document)) return;
  try {
    await Promise.all(FONTS.map(([family, weight]) => document.fonts.load(`${weight} 48px "${family}"`)));
    await document.fonts.ready;
  } catch (e) {
    // fonts API not fully supported — canvas will fall back to system fonts
  }
}
