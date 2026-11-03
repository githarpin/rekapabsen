// Persiapan foto di sisi browser: perkecil agar unggahan dan bacaan AI ringan.

const MAKS_SISI_PIKSEL = 1600;
const KUALITAS_JPEG = 0.85;

export interface FotoSiap {
  dataUrl: string;
  blob: Blob;
}

export async function siapkanFoto(file: File): Promise<FotoSiap> {
  try {
    const bitmap = await createImageBitmap(file);
    const skala = Math.min(1, MAKS_SISI_PIKSEL / Math.max(bitmap.width, bitmap.height));
    const lebar = Math.round(bitmap.width * skala);
    const tinggi = Math.round(bitmap.height * skala);

    const kanvas = document.createElement("canvas");
    kanvas.width = lebar;
    kanvas.height = tinggi;
    kanvas.getContext("2d")?.drawImage(bitmap, 0, 0, lebar, tinggi);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      kanvas.toBlob(resolve, "image/jpeg", KUALITAS_JPEG),
    );
    if (!blob) throw new Error("canvas-toBlob gagal");
    return { dataUrl: await bacaDataUrl(blob), blob };
  } catch {
    // Bila pengecilan gagal, pakai berkas asli apa adanya.
    return { dataUrl: await bacaDataUrl(file), blob: file };
  }
}

function bacaDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const pembaca = new FileReader();
    pembaca.onload = () => resolve(String(pembaca.result));
    pembaca.onerror = () => reject(pembaca.error);
    pembaca.readAsDataURL(blob);
  });
}
