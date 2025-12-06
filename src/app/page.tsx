'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Upload, Sparkles } from 'lucide-react';
import { globalState } from '@/utils/globalState';

export default function Home() {
  const router = useRouter();
  const [selectedStyle, setSelectedStyle] = useState('modern');
  const [selectedRoomType, setSelectedRoomType] = useState('living room');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const styles = [
    { id: 'modern', name: 'Modern', emoji: '✨' },
    { id: 'minimalist', name: 'Minimalist', emoji: '🎨' },
    { id: 'industrial', name: 'Industrial', emoji: '🏭' },
    { id: 'boho', name: 'Bohemian', emoji: '🌿' },
    { id: 'scandinavian', name: 'Scandinavian', emoji: '❄️' },
    { id: 'luxury', name: 'Luxury', emoji: '💎' },
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
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startGeneration = async () => {
    setIsGenerating(true);

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
        router.push(`/results?${params.toString()}`);
      } else {
        alert('Generation failed. Please try again.');
        setIsGenerating(false);
        setProgress(0);
        clearInterval(interval);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Something went wrong. Please try again.');
      setIsGenerating(false);
      setProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            DreamRoom AI
          </h1>
          <p className="text-xl text-foreground/60 mb-12 max-w-2xl mx-auto">
            Transform any room with AI-powered interior design. Upload a photo and watch magic happen!
          </p>

          {/* Upload Section */}
          <div className="bg-card border border-border rounded-3xl p-8 max-w-4xl mx-auto shadow-lg">
            {!uploadedImage ? (
              <label className="cursor-pointer block">
                <div className="border-2 border-dashed border-border rounded-2xl p-16 hover:border-primary transition-colors">
                  <Upload className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">Click to upload your room photo</p>
                  <p className="text-sm text-muted-foreground">PNG, JPG up to 10MB</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </label>
            ) : (
              <div className="space-y-6">
                <div className="relative w-full h-64 rounded-xl overflow-hidden">
                  <Image
                    src={uploadedImage}
                    alt="Uploaded room"
                    fill
                    className="object-cover"
                  />
                </div>
                <button
                  onClick={() => setUploadedImage(null)}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Change photo
                </button>
              </div>
            )}
          </div>

          {/* Style Selection */}
          {uploadedImage && (
            <div className="mt-12 space-y-8">
              <div>
                <h3 className="text-2xl font-bold mb-6">Choose Your Style</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {styles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`p-6 rounded-xl border-2 transition-all hover:scale-105 ${selectedStyle === style.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-card'
                        }`}
                    >
                      <div className="text-4xl mb-2">{style.emoji}</div>
                      <div className="font-medium">{style.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold mb-6">Select Room Type</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {roomTypes.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => setSelectedRoomType(room.id)}
                      className={`p-6 rounded-xl border-2 transition-all hover:scale-105 ${selectedRoomType === room.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-card'
                        }`}
                    >
                      <div className="text-4xl mb-2">{room.emoji}</div>
                      <div className="font-medium text-sm">{room.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={startGeneration}
                disabled={isGenerating}
                className="mt-8 bg-gradient-to-r from-primary to-secondary text-white px-12 py-6 rounded-xl font-bold text-lg hover:opacity-90 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 inline-flex items-center gap-3"
              >
                <Sparkles className="w-6 h-6" />
                {isGenerating ? 'Transforming...' : 'Transform My Space'}
              </button>

              {isGenerating && (
                <div className="mt-6">
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{progress}% complete</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6">
        <div className="max-w-7xl mx-auto text-center text-sm text-foreground/40">
          <p>© 2024 DreamRoom AI. Transform any room with artificial intelligence.</p>
        </div>
      </footer>
    </div>
  );
}
