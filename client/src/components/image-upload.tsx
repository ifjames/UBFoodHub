import { useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  className?: string;
}

export function ImageUpload({ value, onChange, className }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 32MB as per ImgBB)
    if (file.size > 32 * 1024 * 1024) {
      setError("Image size must be less than 32MB");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();
      onChange(data.url);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange("");
    setError(null);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {value ? (
        <div className="relative">
          <img
            src={value}
            alt="Uploaded image"
            className="w-full h-48 object-cover rounded-lg border border-gray-200"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
            disabled={uploading}
            data-testid="button-remove-image"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <label
          className={cn(
            "flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
            uploading
              ? "border-gray-300 bg-gray-50 cursor-not-allowed"
              : "border-gray-300 hover:border-[#6d031e] hover:bg-gray-50"
          )}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {uploading ? (
              <Loader2 className="w-10 h-10 text-gray-400 animate-spin mb-3" />
            ) : (
              <Upload className="w-10 h-10 text-gray-400 mb-3" />
            )}
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">
                {uploading ? "Uploading..." : "Click to upload"}
              </span>
            </p>
            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 32MB</p>
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            data-testid="input-image-upload"
          />
        </label>
      )}
      {error && (
        <p className="text-sm text-red-500" data-testid="text-upload-error">
          {error}
        </p>
      )}
    </div>
  );
}
