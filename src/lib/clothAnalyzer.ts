// Cloth Analysis Service
// Simulates AI-powered cloth scanning for quality, measurements, and fabric detection

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

/**
 * Analyzes an image by extracting pixel data to generate
 * deterministic but varied results based on the actual image content.
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

      // Condition & wear based on quality
      const conditionIndex = Math.min(4, Math.floor((100 - qualityScore) / 20));
      const condition = conditions[conditionIndex];

      const wearIndex = Math.min(wearLevels.length - 1, Math.floor((100 - qualityScore) / 18));
      const wearLevel = wearLevels[wearIndex];

      // Size estimation from image aspect ratio
      const aspectRatio = img.naturalWidth / img.naturalHeight;
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
          details,
        });
      }, 2000 + Math.random() * 1500);
    };

    img.src = imageDataUrl;
  });
};
