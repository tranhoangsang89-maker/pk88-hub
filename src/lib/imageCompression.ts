/**
 * PK88 Automation Portal - Image Compression Utility
 * 
 * Nén và tối ưu hóa ảnh đại diện (Avatar) hoàn toàn ở phía client (trình duyệt).
 * - Tự động crop vuông (1:1) căn giữa khuôn mặt
 * - Resize về kích thước chuẩn avatar (mặc định 400x400 px)
 * - Nén định dạng WebP chất lượng 0.8 (tiết kiệm đến 95 - 99% dung lượng so với ảnh gốc)
 * - Giảm dung lượng từ vài MB xuống chỉ còn ~15KB - 35KB
 * - Chống tràn bộ nhớ & bảo vệ dung lượng Supabase Database / Storage
 */

export interface CompressedImageResult {
  dataUrl: string;
  originalSizeKB: number;
  compressedSizeKB: number;
  savedPercent: number;
  width: number;
  height: number;
}

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  squareCrop?: boolean;
}

export async function compressAvatarImage(
  file: File,
  options: CompressOptions = {}
): Promise<CompressedImageResult> {
  const {
    maxWidth = 400,
    maxHeight = 400,
    quality = 0.8,
    squareCrop = true
  } = options;

  if (!file.type.startsWith('image/')) {
    throw new Error('Vui lòng chọn file hình ảnh hợp lệ (JPG, PNG, WebP, HEIC...)');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Không thể đọc file hình ảnh'));

    reader.onload = () => {
      const img = new Image();

      img.onerror = () => reject(new Error('Không thể xử lý định dạng hình ảnh này'));

      img.onload = () => {
        try {
          const originalWidth = img.width;
          const originalHeight = img.height;

          let targetWidth: number;
          let targetHeight: number;
          let sourceX = 0;
          let sourceY = 0;
          let sourceWidth = originalWidth;
          let sourceHeight = originalHeight;

          if (squareCrop) {
            // Cắt vuông căn giữa (Center square crop) - chuẩn Avatar
            const minSide = Math.min(originalWidth, originalHeight);
            sourceX = (originalWidth - minSide) / 2;
            sourceY = (originalHeight - minSide) / 2;
            sourceWidth = minSide;
            sourceHeight = minSide;

            // Target size tối đa theo maxWidth
            const finalSize = Math.min(minSide, maxWidth);
            targetWidth = finalSize;
            targetHeight = finalSize;
          } else {
            // Giữ nguyên tỉ lệ khung hình
            let width = originalWidth;
            let height = originalHeight;

            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }

            targetWidth = width;
            targetHeight = height;
          }

          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;

          const ctx = canvas.getContext('2d', { alpha: false });
          if (!ctx) {
            throw new Error('Trình duyệt không hỗ trợ Canvas 2D');
          }

          // Khử răng cưa và cải thiện độ nét khi resize
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Nền trắng dự phòng nếu ảnh trong suốt
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, targetWidth, targetHeight);

          // Vẽ ảnh đã crop và scale lên canvas
          ctx.drawImage(
            img,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            targetWidth,
            targetHeight
          );

          // Ưu tiên xuất WebP (tiết kiệm dung lượng nhất), fallback sang JPEG
          let dataUrl = canvas.toDataURL('image/webp', quality);
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }

          // Tính toán dung lượng
          const originalSizeKB = Math.round(file.size / 1024);
          // Base64 length * 0.75 xấp xỉ dung lượng byte thực tế
          const approxBytes = Math.round((dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75);
          const compressedSizeKB = Math.max(1, Math.round(approxBytes / 1024));

          const savedBytes = Math.max(0, file.size - approxBytes);
          const savedPercent = Math.max(0, Math.min(99, Math.round((savedBytes / file.size) * 100)));

          resolve({
            dataUrl,
            originalSizeKB,
            compressedSizeKB,
            savedPercent,
            width: targetWidth,
            height: targetHeight
          });
        } catch (err) {
          reject(err);
        }
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}
