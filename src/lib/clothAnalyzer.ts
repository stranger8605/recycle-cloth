// Cloth Analysis Service
// AI-powered cloth scanning for quality, type detection, count, and fabric analysis

export interface ClothAnalysisResult {
  quality: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  qualityScore: number; // 0-100
  condition: string;
  fabricType: string;
  color: string;
  estimatedSize: string;
  wearLevel: string;
  recyclable: boolean;
  priceMultiplier: number; // affects pricing
  detectedClothType: string; // e.g. 'jeans', 'cotton-shirt', 'saree'
  detectedCount: number; // estimated number of items in photo
  details: string[];
}

const fabricTypes = [
  'Cotton', 'Polyester', 'Silk', 'Denim', 'Linen',
  'Wool', 'Nylon', 'Rayon', 'Chiffon', 'Velvet',
];

const conditions = [
  'Like New', 'Gently Used', 'Moderately Used', 'Well Worn', 'Heavily Worn',
];

const colors = [
  'Black', 'White', 'Navy Blue', 'Red', 'Green',
  'Grey', 'Beige', 'Brown', 'Maroon', 'Pink',
  'Yellow', 'Purple', 'Teal', 'Orange', 'Multi-color',
];

const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];

const wearLevels = [
  'No visible wear',
  'Minimal fading',
  'Slight pilling',
  'Minor stains',
  'Color fading',
  'Fabric thinning',
];

// Cloth type labels for display
export const clothTypeLabels: Record<string, string> = {
  'cotton-shirt': 'Cotton Shirt',
  'jeans': 'Jeans',
  'saree': 'Saree',
  'kurta': 'Kurta',
  'jacket': 'Jacket',
  't-shirt': 'T-Shirt',
  'trousers': 'Trousers',
  'others': 'Others',
};

/**
 * Analyzes an image by extracting pixel data to generate
 * deterministic but varied results based on the actual image content.
 * Now also detects cloth type and estimates item count.
 */
export const analyzeClothImage = (imageDataUrl: string): Promise<ClothAnalysisResult> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Create canvas to read pixel data
      const canvas = document.createElement('canvas');
      const size = 50; // sample size
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, size, size);

      const imageData = ctx.getImageData(0, 0, size, size).data;

      // Compute image statistics
      let totalR = 0, totalG = 0, totalB = 0;
      let brightness = 0;
      let colorVariance = 0;
      const pixelCount = size * size;

      for (let i = 0; i < imageData.length; i += 4) {
        totalR += imageData[i];
        totalG += imageData[i + 1];
        totalB += imageData[i + 2];
        brightness += (imageData[i] + imageData[i + 1] + imageData[i + 2]) / 3;
      }

      const avgR = totalR / pixelCount;
      const avgG = totalG / pixelCount;
      const avgB = totalB / pixelCount;
      const avgBrightness = brightness / pixelCount;

      // Color variance for texture detection
      for (let i = 0; i < imageData.length; i += 4) {
        colorVariance += Math.abs(imageData[i] - avgR) +
                         Math.abs(imageData[i + 1] - avgG) +
                         Math.abs(imageData[i + 2] - avgB);
      }
      colorVariance /= (pixelCount * 3);

      // Use image data to generate deterministic results
      const hash = (avgR * 7 + avgG * 13 + avgB * 17 + avgBrightness * 23) % 1000;

      // Quality based on brightness and color uniformity
      const qualityScore = Math.min(95, Math.max(25, Math.round(
        50 + (avgBrightness / 255) * 30 - (colorVariance / 128) * 15 + (hash % 20)
      )));

      let quality: ClothAnalysisResult['quality'];
      if (qualityScore >= 80) quality = 'Excellent';
      else if (qualityScore >= 60) quality = 'Good';
      else if (qualityScore >= 40) quality = 'Fair';
      else quality = 'Poor';

      // Detect dominant color
      let detectedColor: string;
      if (avgBrightness < 50) detectedColor = 'Black';
      else if (avgBrightness > 220) detectedColor = 'White';
      else if (avgR > avgG * 1.4 && avgR > avgB * 1.4) detectedColor = avgR > 180 ? 'Red' : 'Maroon';
      else if (avgG > avgR * 1.3 && avgG > avgB * 1.2) detectedColor = avgG > 150 ? 'Green' : 'Teal';
      else if (avgB > avgR * 1.3 && avgB > avgG * 1.2) detectedColor = avgB > 150 ? 'Navy Blue' : 'Purple';
      else if (avgR > 150 && avgG > 100 && avgB < 100) detectedColor = 'Orange';
      else if (avgR > 180 && avgG > 160 && avgB < 120) detectedColor = 'Yellow';
      else if (avgR > 180 && avgG > 130 && avgB > 130) detectedColor = 'Pink';
      else if (Math.abs(avgR - avgG) < 20 && Math.abs(avgG - avgB) < 20) {
        detectedColor = avgBrightness > 180 ? 'Beige' : avgBrightness > 100 ? 'Grey' : 'Brown';
      }
      else if (colorVariance > 40) detectedColor = 'Multi-color';
      else detectedColor = colors[Math.floor(hash) % colors.length];

      // Fabric detection based on texture variance
      let fabricIndex: number;
      if (colorVariance < 15) fabricIndex = 4; // Linen (smooth)
      else if (colorVariance < 25) fabricIndex = 2; // Silk
      else if (colorVariance < 35) fabricIndex = 0; // Cotton
      else if (colorVariance < 50) fabricIndex = 6; // Nylon
      else fabricIndex = 3; // Denim (textured)

      const fabricType = fabricTypes[fabricIndex];

      // ──── CLOTH TYPE DETECTION ────
      // Detect clothing type based on fabric, color, and image properties
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      let detectedClothType: string;

      if (fabricType === 'Denim') {
        // Denim → Jeans or Jacket
        detectedClothType = aspectRatio > 0.9 ? 'jacket' : 'jeans';
      } else if (fabricType === 'Silk' || fabricType === 'Chiffon') {
        // Silk/Chiffon → Saree or Kurta
        detectedClothType = colorVariance > 20 ? 'saree' : 'kurta';
      } else if (fabricType === 'Cotton') {
        // Cotton → Shirt or T-shirt based on brightness
        if (avgBrightness > 150) {
          detectedClothType = 'cotton-shirt';
        } else {
          detectedClothType = 't-shirt';
        }
      } else if (fabricType === 'Wool' || fabricType === 'Nylon') {
        // Wool/Nylon → Jacket or Trousers
        detectedClothType = aspectRatio > 1.0 ? 'jacket' : 'trousers';
      } else if (fabricType === 'Linen' || fabricType === 'Rayon') {
        // Linen/Rayon → Kurta or Trousers
        detectedClothType = avgBrightness > 140 ? 'kurta' : 'trousers';
      } else {
        // Use hash for others
        const clothTypes = ['cotton-shirt', 'jeans', 'saree', 'kurta', 'jacket', 't-shirt', 'trousers'];
        detectedClothType = clothTypes[Math.floor(hash / 100) % clothTypes.length];
      }

      // ──── ITEM COUNT ESTIMATION ────
      // Estimate count based on image "complexity" (color variance + edges)
      // Higher complexity = more items likely piled together
      let edgeCount = 0;
      for (let y = 1; y < size - 1; y++) {
        for (let x = 1; x < size - 1; x++) {
          const idx = (y * size + x) * 4;
          const right = ((y * size) + x + 1) * 4;
          const below = (((y + 1) * size) + x) * 4;
          const diffH = Math.abs(imageData[idx] - imageData[right]) +
                        Math.abs(imageData[idx + 1] - imageData[right + 1]) +
                        Math.abs(imageData[idx + 2] - imageData[right + 2]);
          const diffV = Math.abs(imageData[idx] - imageData[below]) +
                        Math.abs(imageData[idx + 1] - imageData[below + 1]) +
                        Math.abs(imageData[idx + 2] - imageData[below + 2]);
          if (diffH > 80 || diffV > 80) edgeCount++;
        }
      }

      const edgeDensity = edgeCount / (size * size);
      let detectedCount: number;
      if (edgeDensity > 0.3) detectedCount = 3 + Math.floor((hash % 3)); // complex image: 3-5 items
      else if (edgeDensity > 0.15) detectedCount = 2 + Math.floor((hash % 2)); // moderate: 2-3 items
      else detectedCount = 1; // simple: 1 item

      // Condition & wear based on quality
      const conditionIndex = Math.min(4, Math.floor((100 - qualityScore) / 20));
      const condition = conditions[conditionIndex];

      const wearIndex = Math.min(wearLevels.length - 1, Math.floor((100 - qualityScore) / 18));
      const wearLevel = wearLevels[wearIndex];

      // Size estimation from image aspect ratio
      let estimatedSize: string;
      if (aspectRatio > 1.2) estimatedSize = sizes[Math.floor(hash / 100) % 3 + 3]; // L, XL, XXL
      else if (aspectRatio < 0.8) estimatedSize = sizes[Math.floor(hash / 100) % 3]; // XS, S, M
      else estimatedSize = sizes[Math.floor(hash / 50) % sizes.length];

      // Price multiplier
      const priceMultiplier = quality === 'Excellent' ? 1.3 :
                              quality === 'Good' ? 1.0 :
                              quality === 'Fair' ? 0.8 : 0.5;

      // Generate detail observations
      const details: string[] = [];
      details.push(`Detected: ${clothTypeLabels[detectedClothType] || detectedClothType} × ${detectedCount}`);
      if (qualityScore >= 70) details.push('Fabric is in good structural condition');
      if (qualityScore >= 80) details.push('Colors are well-preserved');
      if (colorVariance < 30) details.push('Uniform texture detected');
      if (colorVariance >= 30) details.push('Rich texture pattern identified');
      if (qualityScore < 50) details.push('Some wear and tear observed');
      if (qualityScore < 35) details.push('Significant fading detected');
      details.push(`Dominant color: ${detectedColor}`);
      details.push(`Estimated recyclable value: ${priceMultiplier >= 1 ? 'High' : priceMultiplier >= 0.8 ? 'Medium' : 'Low'}`);

      // Simulate processing time
      setTimeout(() => {
        resolve({
          quality,
          qualityScore,
          condition,
          fabricType,
          color: detectedColor,
          estimatedSize,
          wearLevel,
          recyclable: qualityScore >= 20,
          priceMultiplier,
          detectedClothType,
          detectedCount,
          details,
        });
      }, 2000 + Math.random() * 1500);
    };

    img.src = imageDataUrl;
  });
};
