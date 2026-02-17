import React, { useRef, useEffect, useState } from 'react';

interface SignaturePadProps {
    onSave: (signatureData: string) => void;
    onClear?: () => void;
    width?: number;
    height?: number;
    initialSignature?: string;
}

const SignaturePad: React.FC<SignaturePadProps> = ({
    onSave,
    onClear,
    width = 500,
    height = 200,
    initialSignature,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);
    const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set up canvas
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#1e1e1e';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Load initial signature if provided
        if (initialSignature) {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                setHasSignature(true);
            };
            img.src = initialSignature;
        }
    }, [initialSignature]);

    const getPosition = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        if ('touches' in e) {
            return {
                x: (e.touches[0].clientX - rect.left) * scaleX,
                y: (e.touches[0].clientY - rect.top) * scaleY,
            };
        } else {
            return {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY,
            };
        }
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        setIsDrawing(true);
        const pos = getPosition(e);
        setLastPosition(pos);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const pos = getPosition(e);

        ctx.beginPath();
        ctx.moveTo(lastPosition.x, lastPosition.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();

        setLastPosition(pos);
        setHasSignature(true);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
        onClear?.();
    };

    const saveSignature = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const signatureData = canvas.toDataURL('image/png');
        onSave(signatureData);
    };

    return (
        <div className="space-y-4">
            <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl overflow-hidden bg-white">
                <canvas
                    ref={canvasRef}
                    width={width}
                    height={height}
                    className="w-full touch-none cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
                {!hasSignature && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <p className="text-slate-400 text-sm font-medium">
                            Desenhe sua assinatura aqui
                        </p>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={clearSignature}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                    <span className="material-symbols-outlined text-lg">delete</span>
                    Limpar
                </button>
                <button
                    onClick={saveSignature}
                    disabled={!hasSignature}
                    className="flex items-center gap-2 px-6 py-2 bg-emerald-500 text-white rounded-lg text-sm font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25"
                >
                    <span className="material-symbols-outlined text-lg">check</span>
                    Confirmar Assinatura
                </button>
            </div>
        </div>
    );
};

export default SignaturePad;
