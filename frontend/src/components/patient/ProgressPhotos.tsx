import { useState, useEffect, useRef } from 'react';
import { api } from '@/services/api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Skeleton,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui';
import { toast } from 'sonner';
import {
  Camera,
  Calendar,
  Upload,
  ImagePlus,
  Sparkles,
  X,
  Loader2,
  CloudUpload,
} from 'lucide-react';
import { ProgressPhoto } from '@/types/api';
import { cn } from '@/lib/utils';

declare global {
  interface Window { cloudinary: any; }
}

export default function ProgressPhotos() {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPhotos = async () => {
    try {
      const res = await api.get<{ success: boolean; photos: ProgressPhoto[] }>('/progress/photos');
      setPhotos(res.photos);
    } catch {
      toast.error('Failed to load progress photos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  // Reset modal state when closed
  const resetModal = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileSelect = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET; // Renamed for consistency
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

    if (!uploadPreset || !cloudName) {
      throw new Error('Cloudinary configuration is missing. Please check your environment variables (VITE_CLOUDINARY_UPLOAD_PRESET, VITE_CLOUDINARY_CLOUD_NAME).');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', 'progress_photos');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Cloudinary upload failed');
    }
    const data = await response.json();
    return data.secure_url;
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a photo first');
      return;
    }
    setUploading(true);
    try {
      // 1. Upload to Cloudinary
      const photoUrl = await uploadToCloudinary(selectedFile);
      // 2. Save metadata to your backend
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      await api.post('/progress/photos', { photoUrl, month });
      toast.success('Progress photo added!');
      setUploadModalOpen(false);
      resetModal();
      fetchPhotos(); // refresh gallery
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <Skeleton className="h-64 w-full rounded-xl" />;

  const hasPhotos = photos.length > 0;
  const latestPhoto = hasPhotos ? photos[photos.length - 1] : null;

  return (
    <>
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-card to-card/80 shadow-lg">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-syne">
              <div className="rounded-full bg-primary/10 p-1.5 text-primary">
                <Camera className="h-4 w-4" />
              </div>
              Progress Photos
            </CardTitle>
            <Button
              size="sm"
              onClick={() => setUploadModalOpen(true)}
              className="gap-1.5 bg-gradient-to-r from-primary to-primary/90 shadow-sm hover:shadow transition-all"
            >
              <ImagePlus className="h-3.5 w-3.5" />
              Add this month
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Track your transformation – one photo per month
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {!hasPhotos ? (
            <div
              onClick={() => setUploadModalOpen(true)}
              className="group relative cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/20 p-8 text-center transition-all hover:border-primary/50 hover:bg-muted/30"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-105">
                  <Camera className="h-8 w-8" />
                </div>
                <h4 className="font-semibold">Your first progress photo</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Capture your starting point to see how far you'll go
                </p>
                <Button variant="outline" size="sm" className="mt-4 gap-1">
                  <Upload className="h-3.5 w-3.5" /> Upload now
                </Button>
              </div>
            </div>
          ) : (
            <>
              {latestPhoto && (
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 to-transparent p-1">
                  <div className="flex items-start gap-3 rounded-lg bg-card p-3 shadow-sm">
                    <img
                      src={latestPhoto.photoUrl}
                      alt={`Latest: ${latestPhoto.month}`}
                      className="h-16 w-16 rounded-lg object-cover shadow-md"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-medium uppercase tracking-wide text-primary">
                          Latest
                        </span>
                      </div>
                      <p className="text-sm font-medium mt-0.5">
                        {new Date(latestPhoto.month).toLocaleDateString('en', {
                          year: 'numeric',
                          month: 'long',
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Keep it up! {photos.length} month
                        {photos.length !== 1 ? 's' : ''} of progress
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {photos.slice(0, 4).map((photo, idx) => (
                  <div
                    key={photo.id}
                    className="group relative cursor-pointer overflow-hidden rounded-lg transition-all hover:scale-105 hover:shadow-lg"
                    onClick={() => window.open(photo.photoUrl, '_blank')}
                  >
                    <img
                      src={photo.photoUrl}
                      alt={`Month ${photo.month}`}
                      className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2 pt-6">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-xs font-medium text-white">
                          <Calendar className="h-3 w-3" />
                          {photo.month.slice(5)}/{photo.month.slice(0, 4)}
                        </span>
                        {idx === photos.length - 1 && (
                          <Badge className="h-5 bg-primary/80 text-[10px] text-white">
                            new
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {photos.length > 4 && (
                <button
                  onClick={() => {/* optional: navigate to full gallery */}}
                  className="w-full rounded-lg border border-border py-2 text-center text-sm text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground"
                >
                  + {photos.length - 4} more photos → View all
                </button>
              )}
            </>
          )}

          <div className="rounded-lg bg-muted/30 px-3 py-2 text-center text-xs text-muted-foreground">
            💡 Tip: Take photos in the same outfit, lighting, and pose each month
            for better comparison.
          </div>
        </CardContent>
      </Card>

      {/* ── CUSTOM UPLOAD MODAL ── */}
      <Dialog open={uploadModalOpen} onOpenChange={(open) => {
        if (!open) resetModal();
        setUploadModalOpen(open);
      }}>
<DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto">
            <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              Add progress photo
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!previewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="group relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 p-8 text-center transition-all hover:border-primary/50 hover:bg-muted/30"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
                />
                <CloudUpload className="mx-auto h-10 w-10 text-muted-foreground transition-transform group-hover:scale-105" />
                <p className="mt-2 text-sm font-medium">Click or drag & drop</p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG up to 5MB
                </p>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-lg border border-border">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-64 w-full object-cover"
                />
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    if (previewUrl) URL.revokeObjectURL(previewUrl);
                    setPreviewUrl(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white transition-colors hover:bg-black/80"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setUploadModalOpen(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="gap-1.5"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" />
                  Upload & save
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}