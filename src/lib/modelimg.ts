// Pfade der Modellfotos (eigene kleine Datei, damit das Hauptbündel nicht den ganzen Katalog lädt)
export const modelThumb = (id: string) => `${import.meta.env.BASE_URL}images/m/${id}-0.webp`
export const modelImg = (id: string, k = 0) => `${import.meta.env.BASE_URL}images/m/${id}-${k}.avif`
