"use client";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, Trash } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useEdgeStore } from "@/lib/edgestore";

interface ImageUploadProps {
  disabled?: boolean;
  onChange: (value: string) => void;
  onRemove: () => void;
  value: string | null | undefined;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  disabled,
  onChange,
  onRemove,
  value,
}) => {
  const [isMounted, setIsMounted] = useState(false);

  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const { edgestore } = useEdgeStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const onUpload = (result: string) => {
    onChange(result);
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoading(true);
    const file = e.target.files?.[0];
    console.log(file);
    if (file) {
      const res = await edgestore.signatures.upload({
        file,
        onProgressChange: (progress) => setProgress(progress),
      });
      onUpload(res.url);
    }
    setLoading(false);
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div>
      <div
        className={cn("flex items-center gap-4 overflow-auto", value && "mb-4")}
      >
        {value && (
          <div className="relative h-[200px] w-full overflow-hidden rounded-md border">
            <div className="absolute top-2 right-2 z-10">
              <Button
                type="button"
                onClick={() => onRemove()}
                variant="destructive"
                size="icon"
              >
                <Trash />
              </Button>
            </div>
            <Image
              src={value}
              fill
              alt="Signature Image"
              className="object-cover"
            />
          </div>
        )}
      </div>
      {loading && (
        <div className="h-[10px] w-full border rounded overflow-hidden mb-4">
          <div
            className="h-full bg-violet-600 transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        name="signature"
        accept="image/*"
        multiple={false}
        className="hidden"
        onChange={handleChange}
      />
      <Button
        disabled={disabled || loading}
        onClick={() => inputRef.current?.click()}
        variant={"secondary"}
        type="button"
        className="flex items-center"
      >
        <ImagePlus className="mr-2 h-4 w-4" />
        Upload an Image
      </Button>
    </div>
  );
};

export default ImageUpload;
