import React, { useRef, useCallback } from 'react';
import { Upload, X, Tag } from 'lucide-react';
import type { ReferenceImage } from '../types';
import { LABEL_MAP } from '../constants';

interface ReferenceUploadProps {
    images: ReferenceImage[];
    onAdd: (imgs: ReferenceImage[]) => void;
    onRemove: (id: string) => void;
    onLabelChange: (id: string, label: ReferenceImage['label']) => void;
}

const ReferenceUpload: React.FC<ReferenceUploadProps> = ({ images, onAdd, onRemove, onLabelChange }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processFiles = useCallback((files: FileList | null) => {
        if (!files) return;
        const newImages: ReferenceImage[] = [];
        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) return;
            newImages.push({
                id: crypto.randomUUID(),
                file,
                preview: URL.createObjectURL(file),
                label: 'product',
            });
        });
        if (newImages.length > 0) onAdd(newImages);
    }, [onAdd]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        processFiles(e.dataTransfer.files);
    }, [processFiles]);

    return (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1 bg-purple-50 rounded-md">
                        <Tag className="w-3.5 h-3.5 text-purple-500" />
                    </div>
                    <span className="text-xs font-bold text-slate-700">参考图 / 产品图</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">{images.length} 张</span>
            </div>

            <div className="p-4 space-y-3">
                {/* Uploaded images grid */}
                {images.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                        {images.map(img => (
                            <div key={img.id} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                                <img src={img.preview} alt="" className="w-full h-24 object-cover" />
                                <button onClick={() => onRemove(img.id)}
                                    className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <X className="w-3 h-3" />
                                </button>
                                {/* Label selector */}
                                <select value={img.label} onChange={e => onLabelChange(img.id, e.target.value as ReferenceImage['label'])}
                                    className={`absolute bottom-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md border cursor-pointer outline-none ${LABEL_MAP[img.label].color}`}>
                                    <option value="product">产品图</option>
                                    <option value="style">风格参考</option>
                                    <option value="material">素材</option>
                                </select>
                            </div>
                        ))}
                    </div>
                )}

                {/* Upload area */}
                <div onDrop={handleDrop} onDragOver={e => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-purple-300 hover:bg-purple-50/20 transition-all group">
                    <Upload className="w-5 h-5 text-slate-300 mx-auto mb-1 group-hover:text-purple-400 transition-colors" />
                    <p className="text-[11px] text-slate-400 font-medium">拖拽或点击上传参考图</p>
                    <p className="text-[9px] text-slate-300 mt-0.5">产品图、风格参考、任何你想融入的素材</p>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={e => processFiles(e.target.files)} className="hidden" />
            </div>
        </div>
    );
};

export default ReferenceUpload;
