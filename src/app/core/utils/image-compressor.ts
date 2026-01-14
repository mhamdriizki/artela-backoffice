/**
 * Utility untuk mengompres gambar menggunakan Canvas API.
 * Target: Max 2MB, Format JPEG, Quality 0.7.
 */
export async function compressImage(file: File, maxSizeMB: number = 2): Promise<File> {
  const maxBytes = maxSizeMB * 1024 * 1024;

  // Jika file sudah kecil, return langsung
  if (file.size <= maxBytes) return file;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event: any) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        const canvas = document.createElement('canvas');

        // Strategi Resize: Kurangi dimensi sebesar 30% dari aslinya
        const scaleFactor = 0.7;
        canvas.width = img.width * scaleFactor;
        canvas.height = img.height * scaleFactor;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Browser tidak mendukung Canvas API'));
          return;
        }

        // Gambar ulang ke canvas dengan ukuran baru
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Export ke Blob JPEG dengan kualitas 70%
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Gagal mengompres gambar'));
            return;
          }

          // Cek hasil kompresi
          if (blob.size > maxBytes) {
             // Jika masih terlalu besar, reject dengan pesan khusus
             reject(new Error('FILE_TOO_LARGE'));
          } else {
            // Sukses! Bungkus jadi File object lagi
            const newFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(newFile);
          }
        }, 'image/jpeg', 0.7);
      };

      img.onerror = (err) => reject(err);
    };

    reader.onerror = (err) => reject(err);
  });
}
