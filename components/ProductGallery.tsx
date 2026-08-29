"use client";

import { useState } from "react";
import Image from "next/image";

export default function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const list = images && images.length > 0 ? images : ["/placeholder-watch.png"];
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="relative aspect-square bg-nova-cream rounded-sm overflow-hidden">
        <Image
          src={list[active]}
          alt={name}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          priority
        />
      </div>
      {list.length > 1 && (
        <div className="flex gap-3 mt-4">
          {list.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative w-16 h-16 rounded-sm overflow-hidden border-2 ${
                active === i ? "border-nova-gold" : "border-transparent"
              }`}
            >
              <Image src={img} alt={`${name} ${i + 1}`} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
