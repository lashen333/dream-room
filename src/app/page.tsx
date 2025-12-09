'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Upload, Sparkles, Loader2 } from 'lucide-react';
import { globalState } from '@/utils/globalState';

export default function Home() {
  const router = useRouter();
  const [selectedStyle, setSelectedStyle] = useState('modern');
  const [selectedRoomType, setSelectedRoomType] = useState('living room');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const styles = [
    { id: 'modern', name: 'Modern', emoji: '✨', desc: 'Clean & Contemporary' },
    { id: 'minimalist', name: 'Minimalist', emoji: '🎨', desc: 'Simple Elegance' },
    { id: 'industrial', name: 'Industrial', emoji: '🏭', desc: 'Urban & Raw' },
    { id: 'boho', name: 'Bohemian', emoji: '🌿', desc: 'Eclectic & Warm' },
    { id: 'scandinavian', name: 'Scandinavian', emoji: '❄️', desc: 'Cozy & Light' },
    { id: 'luxury', name: 'Luxury', emoji: '💎', desc: 'Premium & Elegant' },
  ];

  const roomTypes = [
    { id: 'living room', name: 'Living Room', emoji: '🛋️' },
    { id: 'bedroom', name: 'Bedroom', emoji: '🛏️' },
    { id: 'kitchen', name: 'Kitchen', emoji: '🍳' },
    { id: 'office', name: 'Office', emoji: '💼' },
    { id: 'bathroom', name: 'Bathroom', emoji: '🚿' },
    { id: 'dining room', name: 'Dining Room', emoji: '🍽️' },
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const img = document.createElement('img');
        img.onload = () => {
          // Resize if needed (ensure min 512x512 for best results)
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          let width = img.width;
          let height = img.height;

          // If too small, upscale to 512
          if (width < 512 || height < 512) {
            const scale = Math.max(512 / width, 512 / height);
            width = Math.floor(width * scale);
            height = Math.floor(height * scale);
          }

          // If too large, downscale to max 2048
          if (width > 2048 || height > 2048) {
            const scale = Math.min(2048 / width, 2048 / height);
            width = Math.floor(width * scale);
            height = Math.floor(height * scale);
          }

          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);

          const resizedImage = canvas.toDataURL('image/jpeg', 0.92);
          setUploadedImage(resizedImage);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const startGeneration = async () => {
    setIsGenerating(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + 5;
      });
    }, 200);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: uploadedImage,
          style: selectedStyle,
          roomType: selectedRoomType,
        }),
      });

      const data = await response.json();

      if (data.success) {
        clearInterval(interval);
        setProgress(100);

        globalState.beforeImage = uploadedImage;
        globalState.afterImage = data.generatedImage;
        globalState.products = data.products || [];

        const params = new URLSearchParams({
          style: selectedStyle,
          roomType: selectedRoomType,
          generated: 'true'
        });

        setTimeout(() => {
          router.push(`/results?${params.toString()}`);
        }, 500);
      } else {
        clearInterval(interval);
        alert('Generation failed. Please try again.');
        setIsGenerating(false);
        setProgress(0);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Something went wrong. Please try again.');
      setIsGenerating(false);
      setProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Premium Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            DreamRoom AI
          </h1>
          <div className="text-sm text-muted-foreground">
            Professional Interior Design
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Title */}
          <div className="text-center mb-12">
            <h2 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              Transform Any Room Instantly
            </h2>
            <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
              AI-powered interior design that matches your style with premium furniture packages
            </p>
          </div>

          {/* Upload Section */}
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-8 max-w-4xl mx-auto shadow-2xl">
            {!uploadedImage ? (
              <label className="cursor-pointer block group">
                <div className="border-2 border-dashed border-border/50 rounded-2xl p-20 hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-transparent to-primary/5 group-hover:to-primary/10">
                  <Upload className="w-20 h-20 mx-auto mb-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  <p className="text-2xl font-semibold mb-3 text-center">Upload Your Room Photo</p>
                  <p className="text-muted-foreground text-center text-lg">
                    PNG or JPG • Maximum 10MB
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isGenerating}
                />
              </label>
            ) : (
              <div className="space-y-6">
                <div className="relative w-full h-96 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-lg">
                  <Image
                    src={uploadedImage}
                    alt="Uploaded room"
                    fill
                    className="object-cover"
                  />
                </div>
                <button
                  onClick={() => !isGenerating && setUploadedImage(null)}
                  disabled={isGenerating}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Change photo
                </button>
              </div>
            )}
          </div>

          {/* Configuration */}
          {uploadedImage && !isGenerating && (
            <div className="mt-12 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Style Selection */}
              <div className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-3xl p-8">
                <h3 className="text-3xl font-bold mb-8 text-center">Choose Your Style</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {styles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`group p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg ${selectedStyle === style.id
                        ? 'border-primary bg-gradient-to-br from-primary/20 to-secondary/20 shadow-lg'
                        : 'border-border/50 bg-card/50 hover:border-primary/30'
                        }`}
                    >
                      <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">{style.emoji}</div>
                      <div className="font-semibold text-lg mb-1">{style.name}</div>
                      <div className="text-xs text-muted-foreground">{style.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Room Type Selection */}
              <div className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-3xl p-8">
                <h3 className="text-3xl font-bold mb-8 text-center">Select Room Type</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {roomTypes.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => setSelectedRoomType(room.id)}
                      className={`group p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg ${selectedRoomType === room.id
                        ? 'border-secondary bg-gradient-to-br from-secondary/20 to-primary/20 shadow-lg'
                        : 'border-border/50 bg-card/50 hover:border-secondary/30'
                        }`}
                    >
                      <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">{room.emoji}</div>
                      <div className="font-semibold">{room.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <div className="text-center">
                <button
                  onClick={startGeneration}
                  className="group bg-gradient-to-r from-primary to-secondary text-white px-16 py-8 rounded-2xl font-bold text-2xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 inline-flex items-center gap-4"
                >
                  <Sparkles className="w-8 h-8 group-hover:rotate-12 transition-transform" />
                  Transform My Space
                  <Sparkles className="w-8 h-8 group-hover:-rotate-12 transition-transform" />
                </button>
              </div>
            </div>
          )}

          {/* Generation Progress */}
          {isGenerating && (
            <div className="mt-12 bg-card/50 backdrop-blur-sm border border-primary/30 rounded-3xl p-12 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center justify-center mb-6">
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
              </div>
              <h3 className="text-2xl font-bold text-center mb-4">Creating Your Dream Room</h3>
              <p className="text-muted-foreground text-center mb-6">
                AI is designing your perfect {selectedRoomType} in {selectedStyle} style...
              </p>
              <div className="w-full bg-muted/50 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-primary via-secondary to-primary h-4 rounded-full transition-all duration-300 bg-[length:200%_auto] animate-gradient"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-center mt-4 text-lg font-semibold text-primary">{progress}%</p>
            </div>
          )}
        </div>
      </section>

      {/* Features Strip */}
      {!uploadedImage && (
        <section className="py-16 px-6 bg-muted/20">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl mb-4">⚡</div>
              <h3 className="font-bold text-xl mb-2">Instant Results</h3>
              <p className="text-muted-foreground">Get professional designs in under 20 seconds</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">🎨</div>
              <h3 className="font-bold text-xl mb-2">AI-Powered</h3>
              <p className="text-muted-foreground">Advanced algorithms match your exact style</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">🛍️</div>
              <h3 className="font-bold text-xl mb-2">Shop Complete Rooms</h3>
              <p className="text-muted-foreground">Buy entire curated packages instantly</p>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-6 mt-20">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 DreamRoom AI • Professional Interior Design Platform
          </p>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
