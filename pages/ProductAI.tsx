
import React, { useState } from 'react';
import { ImageIcon, Sparkles, Loader2, Download, Camera, Wand2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const ProductAI: React.FC = () => {
    const [prompt, setPrompt] = useState(`Professional studio shot of a futuristic coffee maker, cinematic lighting, 8k resolution, product photography, dark background...`);
    const [isGenerating, setIsGenerating] = useState(false);
    const [resultUrl, setResultUrl] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!process.env.API_KEY) return;
        setIsGenerating(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            // Using correct model and logic for image generation via generateContent (Nano/Flash Image)
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: [{ parts: [{ text: prompt }] }],
                config: { 
                    imageConfig: { aspectRatio: "1:1" }
                }
            });
            
            // Extract image from response parts
            if (response.candidates && response.candidates[0].content.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) {
                        setResultUrl(`data:image/png;base64,${part.inlineData.data}`);
                        break;
                    }
                }
            }
        } catch (e) { 
            console.error("Generation failed", e);
            // Fallback for demo purposes if API fails or key is invalid
            // showToast("API Error: Check Console", "error"); 
        } finally { 
            setIsGenerating(false); 
        }
    };

    return (
        <div className="w-full h-full flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-8 shrink-0">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-ios-purple" />
                        <p className="text-ios-purple font-bold text-[10px] uppercase tracking-[0.3em]">Vision Lab</p>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-white">Product Studio AI</h1>
                </div>
            </div>

            <div className="flex-1 flex gap-8 overflow-hidden">
                {/* Control Panel */}
                <div className="w-[400px] flex flex-col shrink-0">
                    <div className="glass-card p-8 rounded-apple flex flex-col gap-6 flex-1 h-full">
                        <div className="flex-1 flex flex-col gap-4">
                            <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                                <Wand2 className="w-3 h-3" /> Creative Prompt
                            </label>
                            <textarea 
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                                className="w-full h-full bg-black/20 border border-white/10 rounded-apple-inner p-5 text-sm leading-relaxed text-white placeholder-white/20 focus:bg-black/40 focus:border-ios-blue/50 outline-none resize-none transition-all font-medium"
                                placeholder="Describe the product scene..."
                            />
                        </div>
                        
                        <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
                            <div className="flex justify-between items-center px-1">
                                <span className="text-xs font-medium text-white/50">Model</span>
                                <span className="text-xs font-bold text-white bg-white/10 px-2 py-1 rounded">Gemini 2.5 Flash Image</span>
                            </div>
                            <button 
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="w-full py-4 bg-white text-black hover:bg-gray-200 rounded-2xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin"/> : <Camera className="w-4 h-4"/>} 
                                Generate Studio Shot
                            </button>
                        </div>
                    </div>
                </div>

                {/* Viewport */}
                <div className="flex-1 glass-card rounded-apple relative flex flex-col overflow-hidden group bg-black/40 border-white/10">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent pointer-events-none"></div>
                    
                    <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center relative z-10 bg-white/5 backdrop-blur-md">
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Render Output · 1024x1024</span>
                        {resultUrl && (
                            <div className="flex gap-2">
                                <button className="p-2 text-white/40 hover:text-white bg-white/5 rounded-lg transition-colors"><Download className="w-4 h-4"/></button>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex-1 flex items-center justify-center p-12 relative z-10">
                        {isGenerating ? (
                            <div className="flex flex-col items-center gap-6">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full border-4 border-white/10 border-t-ios-blue animate-spin"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Sparkles className="w-8 h-8 text-ios-blue animate-pulse" />
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-white/50 uppercase tracking-[0.2em] animate-pulse">Rendering Pixels...</span>
                            </div>
                        ) : resultUrl ? (
                            <img 
                                src={resultUrl} 
                                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl ring-1 ring-white/10" 
                                alt="Generated" 
                            />
                        ) : (
                            <div className="flex flex-col items-center text-white/10">
                                <ImageIcon className="w-32 h-32 mb-6" />
                                <p className="text-sm font-bold uppercase tracking-[0.2em]">Ready to Imagine</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductAI;
