export interface BeadColor {
  id: string;
  name: string;
  hex: string;
  rgb: [number, number, number];
}

// A representative set of common Perler/Artkal bead colors
export const BEAD_PALETTE: BeadColor[] = [
  { id: "A1", name: "白色", hex: "#FFFFFF", rgb: [255, 255, 255] },
  { id: "A2", name: "黑色", hex: "#000000", rgb: [0, 0, 0] },
  { id: "A3", name: "红色", hex: "#BE0027", rgb: [190, 0, 39] },
  { id: "A4", name: "黄色", hex: "#F9D71C", rgb: [249, 215, 28] },
  { id: "A5", name: "蓝色", hex: "#00539C", rgb: [0, 83, 156] },
  { id: "A6", name: "绿色", hex: "#008B45", rgb: [0, 139, 69] },
  { id: "A7", name: "橙色", hex: "#FF8C00", rgb: [255, 140, 0] },
  { id: "A8", name: "紫色", hex: "#6A0DAD", rgb: [106, 13, 173] },
  { id: "A9", name: "粉色", hex: "#FFC0CB", rgb: [255, 192, 203] },
  { id: "A10", name: "棕色", hex: "#8B4513", rgb: [139, 69, 19] },
  { id: "A11", name: "灰色", hex: "#808080", rgb: [128, 128, 128] },
  { id: "A12", name: "肤色", hex: "#FFDBAC", rgb: [255, 219, 172] },
  // Adding more variety based on common palettes
  { id: "B1", name: "浅蓝", hex: "#ADD8E6", rgb: [173, 216, 230] },
  { id: "B2", name: "深蓝", hex: "#00008B", rgb: [0, 0, 139] },
  { id: "B3", name: "草绿", hex: "#7CFC00", rgb: [124, 252, 0] },
  { id: "B4", name: "柠檬黄", hex: "#FFF700", rgb: [255, 247, 0] },
  { id: "B5", name: "桃红", hex: "#FF69B4", rgb: [255, 105, 180] },
  { id: "B6", name: "天蓝", hex: "#87CEEB", rgb: [135, 206, 235] },
  { id: "B7", name: "薄荷绿", hex: "#98FF98", rgb: [152, 255, 152] },
  { id: "B8", name: "咖啡色", hex: "#4B2C20", rgb: [75, 44, 32] },
  { id: "B9", name: "米色", hex: "#F5F5DC", rgb: [245, 245, 220] },
  { id: "B10", name: "浅紫", hex: "#E6E6FA", rgb: [230, 230, 250] },
  { id: "C1", name: "珊瑚色", hex: "#FF7F50", rgb: [255, 127, 80] },
  { id: "C2", name: "金黄", hex: "#FFD700", rgb: [255, 215, 0] },
  { id: "C3", name: "深绿", hex: "#006400", rgb: [0, 100, 0] },
  { id: "C4", name: "青色", hex: "#00FFFF", rgb: [0, 255, 255] },
  { id: "C5", name: "深红", hex: "#8B0000", rgb: [139, 0, 0] },
  { id: "C6", name: "浅粉", hex: "#FFB6C1", rgb: [255, 182, 193] },
  { id: "C7", name: "紫罗兰", hex: "#EE82EE", rgb: [238, 130, 238] },
  { id: "C8", name: "卡其色", hex: "#F0E68C", rgb: [240, 230, 140] },
  { id: "C9", name: "银色", hex: "#C0C0C0", rgb: [192, 192, 192] },
  { id: "C10", name: "炭黑", hex: "#333333", rgb: [51, 51, 51] },
  // Extra colors for better matching
  { id: "D1", name: "深灰", hex: "#404040", rgb: [64, 64, 64] },
  { id: "D2", name: "浅灰", hex: "#D3D3D3", rgb: [211, 211, 211] },
  { id: "D3", name: "橄榄绿", hex: "#808000", rgb: [128, 128, 0] },
  { id: "D4", name: "海军蓝", hex: "#000080", rgb: [0, 0, 128] },
  { id: "D5", name: "栗色", hex: "#800000", rgb: [128, 0, 0] },
  { id: "D6", name: "蓝紫色", hex: "#8A2BE2", rgb: [138, 43, 226] },
  { id: "D7", name: "森林绿", hex: "#228B22", rgb: [34, 139, 34] },
  { id: "D8", name: "巧克力色", hex: "#D2691E", rgb: [210, 105, 30] },
  { id: "D9", name: "秘鲁色", hex: "#CD853F", rgb: [205, 133, 63] },
  { id: "D10", name: "浅珊瑚色", hex: "#F08080", rgb: [240, 128, 128] },
  { id: "E1", name: "深紫罗兰", hex: "#9400D3", rgb: [148, 0, 211] },
  { id: "E2", name: "蓝绿色", hex: "#008080", rgb: [0, 128, 128] },
  { id: "E3", name: "深橙色", hex: "#FF4500", rgb: [255, 69, 0] },
  { id: "E4", name: "金麒麟色", hex: "#DAA520", rgb: [218, 165, 32] },
  { id: "E5", name: "黄绿色", hex: "#9ACD32", rgb: [154, 205, 50] },
];
