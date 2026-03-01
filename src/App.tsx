import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Settings, Download, RefreshCw, Palette, Info, Grid3X3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BEAD_PALETTE } from './constants';
import { processImage } from './utils/imageProcessor';



interface PatternData {
  grid: string[][]; // Array of bead IDs
  colors: Map<string, number>; // ID -> count
  width: number;
  height: number;
}

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [optimizedImage, setOptimizedImage] = useState<string | null>(null);
  const [gridWidth, setGridWidth] = useState(50);
  const [gridHeight, setGridHeight] = useState(50);
  const [pattern, setPattern] = useState<PatternData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showGridNumbers, setShowGridNumbers] = useState(true);
  const [showGridLines, setShowGridLines] = useState(true);
  const [isFeasible, setIsFeasible] = useState(true);
  const [highlightedColorId, setHighlightedColorId] = useState<string | null>(null);
  const [statsStyle, setStatsStyle] = useState<'ribbon' | 'table' | 'card'>('ribbon');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generatePattern = useCallback(async () => {
    const sourceImage = optimizedImage || image;
    if (!sourceImage) return;
    setIsProcessing(true);
    try {
      // 1. Core Algorithm Call
      const result = await processImage(sourceImage, gridWidth, gridHeight, BEAD_PALETTE);
      
      // 2. Map Stats Calculation
      const statsMap = new Map<string, number>();
      const gridIds: string[][] = result.map(row => 
        row.map(cell => {
          if (cell.id !== 'EMPTY') {
            statsMap.set(cell.id, (statsMap.get(cell.id) || 0) + 1);
          }
          return cell.id;
        })
      );

      setPattern({
        grid: gridIds,
        colors: statsMap,
        width: gridWidth,
        height: gridHeight,
      });
      
      setIsFeasible(true); 
    } catch (error) {
      console.error("Processing error:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [image, optimizedImage, gridWidth, gridHeight]);

  const resizeImage = (base64Str: string, maxSide: number = 768): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSide) {
            height *= maxSide / width;
            width = maxSide;
          }
        } else {
          if (height > maxSide) {
            width *= maxSide / height;
            height = maxSide;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png', 0.8));
      };
    });
  };

 // Optimize image via server API (no Gemini SDK in frontend)
     const optimizeImage = async (base64Data: string) => {
  setIsOptimizing(true);

  try {
    const resizedBase64 = await resizeImage(base64Data, 768);
    const pureBase64 = resizedBase64.split(",")[1];

    const resp = await fetch("/api/optimize-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageBase64: pureBase64,
        mimeType: "image/png",
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`optimize api failed: ${resp.status} ${errText}`);
    }

    const data = await resp.json();

    // 你后端如果返回的是“优化后的base64图片”，按下面取；否则就退回原图
    const inline =
      data?.candidates?.[0]?.content?.parts?.find((p: any) => p?.inline_data || p?.inlineData);

    const b64 = inline?.inline_data?.data || inline?.inlineData?.data;

    if (b64) {
      setOptimizedImage(`data:image/png;base64,${b64}`);
    } else {
      // 后端没返回图片，就用原图（不影响拼豆生成）
      setOptimizedImage(base64Data);
    }
  } catch (e) {
    console.error("Optimization error:", e);
    setOptimizedImage(base64Data);
  } finally {
    setIsOptimizing(false);
  }
};


  useEffect(() => {
    if (image) {
      optimizeImage(image);
    }
  }, [image]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (image) {
        generatePattern();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [image, optimizedImage, gridWidth, gridHeight, generatePattern]);

  const handleFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const img = new Image();
        img.src = base64;
        img.onload = () => {
          // Auto-adjust aspect ratio
          const ratio = img.width / img.height;
          setGridHeight(50);
          setGridWidth(Math.round(50 * ratio));
          setImage(base64);
          setOptimizedImage(null); // Reset optimized image
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const downloadPattern = () => {
    if (!pattern) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = 20;
    const padding = 40;
    canvas.width = pattern.width * cellSize + padding * 2;
    canvas.height = pattern.height * cellSize + padding * 2;

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Beads
    pattern.grid.forEach((row, y) => {
      row.forEach((beadId, x) => {
        if (beadId === 'EMPTY') return;
        const bead = BEAD_PALETTE.find(b => b.id === beadId);
        const px = padding + x * cellSize;
        const py = padding + y * cellSize;

        // Bead Circle
        ctx.fillStyle = bead?.hex || '#FFFFFF';
        ctx.beginPath();
        ctx.arc(px + cellSize / 2, py + cellSize / 2, cellSize / 2 - 1, 0, Math.PI * 2);
        ctx.fill();
        
        // Bead Hole
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath();
        ctx.arc(px + cellSize / 2, py + cellSize / 2, cellSize / 4, 0, Math.PI * 2);
        ctx.fill();

        // Grid Lines (optional for export)
        if (showGridLines) {
          ctx.strokeStyle = '#FFE4E9';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(px, py, cellSize, cellSize);
        }
      });
    });

    // Draw Numbers
    if (showGridNumbers) {
      ctx.fillStyle = '#FF8DA1';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      
      for (let x = 0; x < pattern.width; x++) {
        if ((x + 1) % 5 === 0) {
          ctx.fillText((x + 1).toString(), padding + x * cellSize + cellSize / 2, padding - 10);
        }
      }
      for (let y = 0; y < pattern.height; y++) {
        if ((y + 1) % 5 === 0) {
          ctx.fillText((y + 1).toString(), padding - 15, padding + y * cellSize + cellSize / 2 + 4);
        }
      }
    }

    const link = document.createElement('a');
    link.download = '萌豆拼豆图纸.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#FFF5F7] font-sans text-[#5D4037]">
      {/* Header */}
      <header className="bg-white border-b-4 border-[#FFD1DC] p-6 shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#FFD1DC] p-2 rounded-2xl rotate-3">
              <Palette className="text-[#FF6B8B] w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-[#FF6B8B] drop-shadow-sm">
              萌豆拼豆生成器
            </h1>
          </div>
          <p className="hidden md:block text-sm font-medium text-[#FF8DA1] italic">
            让你的每一颗豆豆都充满爱 ~ ✨
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar / Controls */}
        <div className="lg:col-span-4 space-y-6">
          {/* Upload Card */}
          <section className="bg-white rounded-[2rem] p-8 border-4 border-[#FFD1DC] shadow-lg hover:shadow-xl transition-shadow">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-[#FF6B8B]">
              <Upload size={24} /> 第一步：上传图片
            </h2>

            <div 
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-4 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all group ${
                isDragging 
                ? 'border-[#FF6B8B] bg-[#FFF0F3] scale-[1.02]' 
                : 'border-[#FFE4E9] hover:bg-[#FFF9FA]'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileUpload}
              />
              <div className="w-16 h-16 bg-[#FFE4E9] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Upload className="text-[#FF6B8B]" />
              </div>
              <p className="text-center font-bold text-[#FF8DA1]">点击或拖拽图片到这里</p>
              <p className="text-xs text-[#BCB0B3] mt-2">支持 JPG, PNG, WEBP</p>
            </div>
            {image && (
              <div className="mt-6 space-y-4">
                <div className="relative rounded-2xl overflow-hidden border-2 border-[#FFE4E9]">
                  <img src={optimizedImage || image} alt="Preview" className="w-full h-auto max-h-48 object-contain" />
                  {isOptimizing && (
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex flex-col items-center justify-center p-4">
                      <RefreshCw className="text-[#FF6B8B] animate-spin mb-2 w-8 h-8" />
                      <span className="text-[10px] font-black text-[#FF6B8B] text-center">AI 正在深度补全与去背...</span>
                    </div>
                  )}
                  <button 
                    onClick={() => { setImage(null); setOptimizedImage(null); }}
                    className="absolute top-2 right-2 bg-white/90 p-1 rounded-full text-[#FF6B8B] hover:bg-white shadow-md z-10"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
                {optimizedImage && !isOptimizing && (
                  <div className="bg-[#FFF9FA] p-3 rounded-xl border border-[#FFE4E9] text-[10px] text-[#FF8DA1] font-medium italic">
                    ✨ 已为您自动提取中心图形、补全遮挡并移除背景。
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Settings Card */}
          <section className="bg-white rounded-[2rem] p-8 border-4 border-[#FFD1DC] shadow-lg">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-[#FF6B8B]">
              <Settings size={24} /> 第二步：调整参数
            </h2>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-sm mb-2 text-[#FF6B8B]">宽度 (颗豆)</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="1000" 
                    value={gridWidth} 
                    onChange={(e) => {
                      const val = Math.min(1000, Math.max(1, parseInt(e.target.value) || 1));
                      setGridWidth(val);
                    }}
                    className="w-full px-4 py-2 bg-[#FFF9FA] border-2 border-[#FFE4E9] rounded-xl font-black text-[#FF6B8B] focus:outline-none focus:border-[#FF6B8B]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-sm mb-2 text-[#FF6B8B]">高度 (颗豆)</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="1000" 
                    value={gridHeight} 
                    onChange={(e) => {
                      const val = Math.min(1000, Math.max(1, parseInt(e.target.value) || 1));
                      setGridHeight(val);
                    }}
                    className="w-full px-4 py-2 bg-[#FFF9FA] border-2 border-[#FFE4E9] rounded-xl font-black text-[#FF6B8B] focus:outline-none focus:border-[#FF6B8B]"
                  />
                </div>
              </div>
              
              <div className="pt-4 border-t-2 border-[#FFF0F3] space-y-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-12 h-6 rounded-full relative transition-colors ${showGridNumbers ? 'bg-[#FF6B8B]' : 'bg-[#E0E0E0]'}`}>
                    <input type="checkbox" className="hidden" checked={showGridNumbers} onChange={() => setShowGridNumbers(!showGridNumbers)} />
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${showGridNumbers ? 'left-7' : 'left-1'}`} />
                  </div>
                  <span className="font-bold text-sm group-hover:text-[#FF6B8B]">显示网格坐标</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-12 h-6 rounded-full relative transition-colors ${showGridLines ? 'bg-[#FF6B8B]' : 'bg-[#E0E0E0]'}`}>
                    <input type="checkbox" className="hidden" checked={showGridLines} onChange={() => setShowGridLines(!showGridLines)} />
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${showGridLines ? 'left-7' : 'left-1'}`} />
                  </div>
                  <span className="font-bold text-sm group-hover:text-[#FF6B8B]">显示网格线</span>
                </label>
              </div>
            </div>
          </section>

          {/* Tips Section */}
          <section className="bg-[#FFE4E9] rounded-[2rem] p-6 border-2 border-white shadow-inner">
            <h3 className="font-black text-[#FF6B8B] mb-4 flex items-center gap-2">
              <Info size={18} /> 核心逻辑说明:
            </h3>
            <div className="space-y-4 text-xs text-[#FF8DA1] font-bold">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0 text-[#FF6B8B]">1</div>
                <p><span className="text-[#FF6B8B]">像素化：</span>将图片切成网格，每一格对应一颗拼豆。</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0 text-[#FF6B8B]">2</div>
                <p><span className="text-[#FF6B8B]">色彩匹配：</span>在官方色号中寻找最接近的颜色进行替换。</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0 text-[#FF6B8B]">3</div>
                <p><span className="text-[#FF6B8B]">去杂简化：</span>自动减少冗余颜色，平滑边缘，让图纸更易上手。</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0 text-[#FF6B8B]">4</div>
                <p><span className="text-[#FF6B8B]">输出图纸：</span>生成带坐标和色号的专业图纸，直接开拼！</p>
              </div>
            </div>
          </section>
        </div>

        {/* Main Preview Area */}
        <div className="lg:col-span-8 space-y-6">
          <section className="bg-white rounded-[3rem] p-4 md:p-8 border-4 border-[#FFD1DC] shadow-xl min-h-[600px] flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-black text-[#FF6B8B] flex items-center gap-3">
                  <Grid3X3 size={32} /> 图纸预览
                </h2>
                {pattern && (
                  <div className={`flex items-center gap-2 text-xs font-bold ${isFeasible ? 'text-emerald-500' : 'text-amber-500'}`}>
                    <div className={`w-2 h-2 rounded-full ${isFeasible ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    {isFeasible ? '✨ 结构稳固：所有豆豆已连接，适合烫豆' : '⚠️ 结构预警：存在孤立豆豆，烫豆后可能脱落'}
                  </div>
                )}
              </div>
              {pattern && (
                <button 
                  onClick={downloadPattern}
                  className="bg-[#FF6B8B] hover:bg-[#FF4D73] text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95 shadow-md"
                >
                  <Download size={20} /> 保存图纸
                </button>
              )}
            </div>

            <div className={`flex-1 bg-[#FFF9FA] rounded-[2rem] border-4 border-dashed border-[#FFE4E9] flex items-center justify-center p-4 relative min-h-[400px] pegboard-bg ${pattern && !isProcessing && !isOptimizing ? 'overflow-auto' : ''}`}>
              {!image && (
                <div className="text-center space-y-4 max-w-xs">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-inner border-4 border-[#FFE4E9]">
                    <Info className="text-[#FFD1DC] w-12 h-12" />
                  </div>
                  <p className="text-[#FF8DA1] font-bold">请先在左侧上传一张可爱的图片，系统将自动为您生成拼豆图纸哦！</p>
                </div>
              )}

              {(isProcessing || isOptimizing) && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 border-8 border-[#FFE4E9] border-t-[#FF6B8B] rounded-full animate-spin mb-4" />
                  <p className="font-black text-[#FF6B8B] animate-pulse">
                    {isOptimizing ? 'AI 正在智能优化图片...' : '正在精准分析并生成图纸...'}
                  </p>
                </div>
              )}

              {pattern && !isProcessing && !isOptimizing && (
                <div className="inline-block p-4 bg-white rounded-xl shadow-lg border border-[#FFE4E9] animate-in fade-in zoom-in duration-500">
                  <div 
                    className="relative"
                    style={{ 
                      display: 'grid', 
                      gridTemplateColumns: `repeat(${pattern.width}, 1fr)`,
                      gap: showGridLines ? '1px' : '0px',
                      backgroundColor: showGridLines ? '#FFE4E9' : 'transparent'
                    }}
                  >
                    {/* Top Numbers */}
                    {showGridNumbers && (
                      <div className="absolute -top-6 left-0 right-0 flex justify-around text-[8px] font-bold text-[#FF8DA1]">
                        {Array.from({ length: pattern.width }).map((_, i) => (
                          (i + 1) % 5 === 0 ? <span key={i} style={{ width: `${100/pattern.width}%`, textAlign: 'center' }}>{i + 1}</span> : <span key={i} style={{ width: `${100/pattern.width}%` }}></span>
                        ))}
                      </div>
                    )}
                    {/* Left Numbers */}
                    {showGridNumbers && (
                      <div className="absolute top-0 -left-6 bottom-0 flex flex-col justify-around text-[8px] font-bold text-[#FF8DA1]">
                        {Array.from({ length: pattern.height }).map((_, i) => (
                          (i + 1) % 5 === 0 ? <span key={i} style={{ height: `${100/pattern.height}%`, display: 'flex', alignItems: 'center' }}>{i + 1}</span> : <span key={i} style={{ height: `${100/pattern.height}%` }}></span>
                        ))}
                      </div>
                    )}

                    {pattern.grid.map((row, y) => 
                      row.map((beadId, x) => {
                        const bead = BEAD_PALETTE.find(b => b.id === beadId);
                        const isHighlighted = highlightedColorId === null || highlightedColorId === beadId;

                        return (
                          <div 
                            key={`${x}-${y}`}
                            className="aspect-square relative group transition-all duration-300 rounded-full"
                            style={{ 
                              backgroundColor: beadId === 'EMPTY' ? 'transparent' : (bead?.hex || '#FFF'),
                              width: `${Math.max(4, 600 / pattern.width)}px`,
                              height: `${Math.max(4, 600 / pattern.width)}px`,
                              opacity: isHighlighted ? 1 : 0.15,
                            }}
                          >
                            {/* Bead Hole Effect */}
                            {beadId !== 'EMPTY' && (
                              <div className="absolute inset-[25%] bg-black/10 rounded-full" />
                            )}
                            {/* Tooltip on hover */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20 bg-black text-white text-[10px] px-2 py-1 rounded whitespace-nowrap pointer-events-none">
                              {beadId === 'EMPTY' ? '空白' : `${bead?.name} (${beadId})`}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Hidden canvas for export */}
            <canvas ref={canvasRef} className="hidden" />
          </section>

          {/* Color Stats Card - Moved here */}
          <AnimatePresence>
            {pattern && (
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-white rounded-[3rem] p-8 border-4 border-[#FFD1DC] shadow-xl"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <h2 className="text-2xl font-black flex items-center gap-3 text-[#FF6B8B]">
                    <Palette size={32} /> 耗材清单统计
                  </h2>
                  <div className="flex bg-[#FFF9FA] p-1 rounded-xl border-2 border-[#FFE4E9]">
                    <button 
                      onClick={() => setStatsStyle('ribbon')}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${statsStyle === 'ribbon' ? 'bg-[#FF6B8B] text-white shadow-sm' : 'text-[#FF8DA1] hover:bg-[#FFE4E9]'}`}
                    >
                      现代长条
                    </button>
                    <button 
                      onClick={() => setStatsStyle('table')}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${statsStyle === 'table' ? 'bg-[#FF6B8B] text-white shadow-sm' : 'text-[#FF8DA1] hover:bg-[#FFE4E9]'}`}
                    >
                      专业表格
                    </button>
                    <button 
                      onClick={() => setStatsStyle('card')}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${statsStyle === 'card' ? 'bg-[#FF6B8B] text-white shadow-sm' : 'text-[#FF8DA1] hover:bg-[#FFE4E9]'}`}
                    >
                      精致卡片
                    </button>
                  </div>
                </div>
                <p className="text-xs text-[#BCB0B3] mb-6 font-bold italic">💡 点击色卡可高亮显示图纸中的对应位置</p>
                
                <div className={`custom-scrollbar overflow-y-auto pr-2 ${statsStyle === 'ribbon' ? 'space-y-3 max-h-[600px]' : statsStyle === 'table' ? 'max-h-[600px]' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[600px]'}`}>
                  {statsStyle === 'table' && (
                    <div className="sticky top-0 z-10 grid grid-cols-12 gap-4 px-6 py-3 bg-[#FFE4E9] rounded-t-2xl text-[10px] font-black text-[#FF6B8B] uppercase tracking-wider">
                      <div className="col-span-2">色卡ID</div>
                      <div className="col-span-4">颜色名称</div>
                      <div className="col-span-3">预览</div>
                      <div className="col-span-3 text-right">所需数量</div>
                    </div>
                  )}

                  {Array.from(pattern.colors.entries()).sort((a, b) => b[1] - a[1]).map(([id, count]) => {
                    const bead = BEAD_PALETTE.find(b => b.id === id);
                    if (!bead) return null;
                    const isHighlighted = highlightedColorId === id;
                    
                    if (statsStyle === 'ribbon') {
                      return (
                        <div 
                          key={id} 
                          onClick={() => setHighlightedColorId(isHighlighted ? null : id)}
                          className={`flex items-center justify-between px-6 py-4 rounded-[1.5rem] border-2 transition-all cursor-pointer group ${isHighlighted ? 'bg-[#FF6B8B] border-[#FF6B8B] text-white shadow-lg' : 'bg-white border-[#FFE4E9] hover:border-[#FF6B8B] hover:shadow-md'}`}
                        >
                          <div className="flex items-center gap-6 flex-1">
                            <div 
                              className="w-14 h-14 rounded-full border-4 border-white shadow-sm flex items-center justify-center text-xs font-black shrink-0 group-hover:scale-110 transition-transform"
                              style={{ backgroundColor: bead.hex, color: bead.hex === '#FFFFFF' ? '#000' : '#FFF' }}
                            >
                              {id}
                            </div>
                            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-8 flex-1">
                              <p className={`text-base font-black min-w-[120px] ${isHighlighted ? 'text-white' : 'text-[#FF6B8B]'}`}>{bead.name}</p>
                            </div>
                          </div>
                          <div className={`flex items-center gap-2 px-6 py-2 rounded-full border-2 ${isHighlighted ? 'bg-white/20 border-white/40' : 'bg-[#FFF9FA] border-[#FFE4E9]'}`}>
                            <span className={`text-xl font-black ${isHighlighted ? 'text-white' : 'text-[#FF6B8B]'}`}>{count}</span>
                            <span className={`text-xs font-bold ${isHighlighted ? 'text-white/80' : 'text-[#BCB0B3]'}`}>颗</span>
                          </div>
                        </div>
                      );
                    }

                    if (statsStyle === 'table') {
                      return (
                        <div 
                          key={id} 
                          onClick={() => setHighlightedColorId(isHighlighted ? null : id)}
                          className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-[#FFE4E9] transition-all cursor-pointer items-center ${isHighlighted ? 'bg-[#FF6B8B] text-white' : 'bg-white hover:bg-[#FFF9FA]'}`}
                        >
                          <div className="col-span-2 font-black text-sm">{id}</div>
                          <div className="col-span-4">
                            <p className="font-black text-sm">{bead.name}</p>
                          </div>
                          <div className="col-span-3 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full border border-white/20 shadow-inner" style={{ backgroundColor: bead.hex }} />
                          </div>
                          <div className="col-span-3 text-right font-black text-lg">
                            {count} <span className="text-[10px] opacity-60">颗</span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div 
                        key={id} 
                        onClick={() => setHighlightedColorId(isHighlighted ? null : id)}
                        className={`flex flex-col p-5 rounded-3xl border-2 transition-all cursor-pointer group ${isHighlighted ? 'bg-[#FF6B8B] border-[#FF6B8B] text-white shadow-lg' : 'bg-[#FFF9FA] border-[#FFE4E9] hover:border-[#FF6B8B]'}`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div 
                            className="w-14 h-14 rounded-2xl border-2 border-white shadow-sm flex items-center justify-center text-[10px] font-black group-hover:rotate-12 transition-transform"
                            style={{ backgroundColor: bead.hex, color: bead.hex === '#FFFFFF' ? '#000' : '#FFF' }}
                          >
                            {id}
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-black ${isHighlighted ? 'bg-white/20' : 'bg-white text-[#FF6B8B]'}`}>
                            {count} 颗
                          </div>
                        </div>
                        <p className={`text-sm font-black mb-1 ${isHighlighted ? 'text-white' : 'text-[#FF6B8B]'}`}>{bead.name}</p>
                      </div>
                    );
                  })}
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="max-w-6xl mx-auto p-8 text-center text-[#BCB0B3] text-sm font-medium">
        <p>© 2026 萌豆拼豆生成器 · 每一颗豆豆都是一个小梦想 ✨</p>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #FFF5F7;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #FFD1DC;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #FF6B8B;
        }
        .pegboard-bg {
          background-image: radial-gradient(#FFE4E9 2px, transparent 2px);
          background-size: 12px 12px;
        }
      `}</style>
    </div>
  );
}
