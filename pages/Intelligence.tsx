import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, Brain, Zap, Globe, MapPin, Image as ImageIcon, Video, Mic, 
  Speaker, Upload, Sparkles, Loader2, Send, Play, Square, Pause,
  Maximize2, RefreshCw, Download, AlertCircle, Wand2, Film, StopCircle,
  Languages, MessageSquare, Copy, FileText
} from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { useTanxing } from '../context/TanxingContext';

const TABS = [
  { id: 'chat', label: '全能对话', sub: 'Omni-Chat', icon: Bot },
  { id: 'copy', label: '文案工坊', sub: 'Content Lab', icon: FileText },
  { id: 'creative', label: '视觉创意', sub: 'Creative', icon: Wand2 },
  { id: 'voice', label: '语音交互', sub: 'Voice', icon: Mic },
];

function base64ToUint8Array(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  // Fix: Added missing 'len' definition
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function floatTo16BitPCM(input: Float32Array) {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
        const s = Math.max(-1, Math.min(1, input[i]));
        output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output.buffer;
}

async function decodeAudioData(
  base64Data: string,
  ctx: AudioContext,
  sampleRate: number = 24000
): Promise<AudioBuffer> {
  const uint8Array = base64ToUint8Array(base64Data);
  const int16Array = new Int16Array(uint8Array.buffer);
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / 32768.0;
  }
  const buffer = ctx.createBuffer(1, float32Array.length, sampleRate);
  buffer.getChannelData(0).set(float32Array);
  return buffer;
}

const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({ inlineData: { data: base64String, mimeType: file.type } });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const OmniChat = () => {
    const [mode, setMode] = useState<'thinking' | 'search' | 'maps' | 'lite' | 'standard'>('standard');
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<{role: 'user'|'model', text: string, isThinking?: boolean, grounding?: any}[]>([]);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;
        const userText = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userText }]);
        setLoading(true);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            let model = 'gemini-3-flash-preview';
            let config: any = {};
            let tools: any[] = [];

            switch (mode) {
                case 'thinking':
                    model = 'gemini-3-pro-preview';
                    config = { thinkingConfig: { thinkingBudget: 32768 } };
                    break;
                case 'search':
                    model = 'gemini-3-flash-preview';
                    tools = [{ googleSearch: {} }];
                    break;
                case 'maps':
                    // Maps grounding is only supported in 2.5 series models
                    model = 'gemini-2.5-flash';
                    tools = [{ googleMaps: {} }];
                    break;
                case 'lite':
                    model = 'gemini-flash-lite-latest';
                    break;
                default: 
                    model = 'gemini-3-flash-preview';
            }

            const response = await ai.models.generateContent({
                model,
                contents: [{ role: 'user', parts: [{ text: userText }] }],
                config: { ...config, tools: tools.length > 0 ? tools : undefined }
            });

            const grounding = response.candidates?.[0]?.groundingMetadata;
            setMessages(prev => [...prev, { 
                role: 'model', text: response.text || "无响应内容。", isThinking: mode === 'thinking', grounding
            }]);
        } catch (error: any) {
            setMessages(prev => [...prev, { role: 'model', text: `错误: ${error.message}` }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-black/20 rounded-xl border border-white/10 overflow-hidden backdrop-blur-sm">
            <div className="flex gap-2 p-4 border-b border-white/10 bg-black/40 overflow-x-auto">
                {['standard', 'thinking', 'search', 'maps', 'lite'].map(m => (
                    <button key={m} onClick={() => setMode(m as any)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-2 border capitalize ${mode === m ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-black/60 border-white/10 text-slate-400 hover:text-white'}`}>
                        {m === 'standard' && <Sparkles className="w-3 h-3"/>}
                        {m === 'thinking' && <Brain className="w-3 h-3"/>}
                        {m === 'search' && <Globe className="w-3 h-3"/>}
                        {m === 'maps' && <MapPin className="w-3 h-3"/>}
                        {m === 'lite' && <Zap className="w-3 h-3"/>}
                        {m}模式
                    </button>
                ))}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                        <Bot className="w-16 h-16 mb-4" />
                        <p className="text-xs uppercase tracking-widest font-mono italic">Gemini Omni Engine Online</p>
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-200 border border-slate-700 shadow-xl'}`}>
                            {msg.isThinking && <div className="text-[10px] text-purple-400 font-mono mb-1 flex items-center gap-1 border-b border-purple-500/20 pb-1">AI 深度思考已完成 (Thinking Complete)</div>}
                            {msg.text}
                            {/* Grounding Source Display */}
                            {msg.grounding?.groundingChunks && msg.grounding.groundingChunks.some((c: any) => c.web || c.maps) && (
                                <div className="mt-3 pt-2 border-t border-white/10 space-y-1.5">
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                        <Globe className="w-2.5 h-2.5" /> Sources & References:
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {msg.grounding.groundingChunks.map((chunk: any, i: number) => {
                                            const source = chunk.web || chunk.maps;
                                            if (!source) return null;
                                            return (
                                                <a key={i} href={source.uri} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2 py-0.5 bg-black/40 rounded border border-white/5 text-[9px] text-indigo-400 hover:text-white hover:border-indigo-500/50 transition-all max-w-[200px]">
                                                    <span className="truncate">{source.title || source.uri}</span>
                                                </a>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {loading && <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-mono p-2 animate-pulse">&gt; 量子神经元正在处理中...</div>}
                <div ref={scrollRef} />
            </div>
            <div className="p-4 border-t border-white/10 bg-black/40">
                <div className="flex gap-2">
                    <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder={`给 Gemini 发送消息...`} className="flex-1 bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"/>
                    <button onClick={handleSend} disabled={loading} className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl disabled:opacity-50 transition-colors shadow-lg"><Send className="w-5 h-5" /></button>
                </div>
            </div>
        </div>
    );
};

const CopywritingLab = () => {
    const { state, showToast } = useTanxing();
    const products = state.products || [];
    const [selectedSku, setSelectedSku] = useState(products[0]?.sku || '');
    const [contentType, setContentType] = useState<'script' | 'description' | 'outreach' | 'report'>('script');
    const [result, setResult] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const product = products.find(p => p.sku === selectedSku) || products[0];

    const handleGenerate = async () => {
        if (!product) return;
        setIsGenerating(true);
        setResult('');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `
                Role: Senior E-commerce Copywriter & Business Assistant.
                Product: ${product.name} (SKU: ${product.sku}, Category: ${product.category}, Stock: ${product.stock})
                Task: Generate a ${contentType === 'script' ? 'TikTok 短视频脚本' : contentType === 'description' ? '高转化产品详情文案' : contentType === 'outreach' ? '红人邀约邮件' : '业务库存诊断报告'}.
                Output Language: Chinese. Style: Professional, persuasive.
                Use HTML tags like <b> and <br> for formatting.
            `;
            const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
            setResult(response.text);
        } catch (e) {
            setResult("<b>AI 系统繁忙，请检查 API 配置。</b>");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full animate-in fade-in">
            <div className="lg:col-span-4 space-y-6">
                <div className="ios-glass-card p-6 border-l-4 border-l-purple-500">
                    <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2"><Languages className="w-4 h-4 text-purple-400" /> 创作参数配置</h3>
                    <div className="space-y-5">
                        <div>
                            <label className="text-[10px] text-slate-500 font-bold mb-1.5 block">选择业务 SKU</label>
                            <select value={selectedSku} onChange={e => setSelectedSku(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-sm text-white focus:border-purple-500 outline-none">
                                {products.map(p => <option key={p.id} value={p.sku}>{p.sku} - {p.name}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            {[
                                { id: 'script', label: '短视频爆款脚本', icon: Video },
                                { id: 'description', label: 'Listing 描述优化', icon: Languages },
                                { id: 'outreach', label: '外部合作邀约', icon: MessageSquare },
                                { id: 'report', label: 'SKU 深度诊断', icon: AlertCircle }
                            ].map(t => (
                                <button key={t.id} onClick={() => setContentType(t.id as any)} className={`flex items-center gap-3 p-3 rounded-xl border text-[10px] font-bold transition-all ${contentType === t.id ? 'bg-purple-600 border-purple-500 text-white shadow-lg' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}>
                                    <t.icon className="w-3.5 h-3.5" /> {t.label}
                                </button>
                            ))}
                        </div>
                        <button onClick={handleGenerate} disabled={isGenerating} className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold shadow-xl flex items-center justify-center gap-2 disabled:opacity-50">
                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            生成专业文案
                        </button>
                    </div>
                </div>
            </div>
            <div className="lg:col-span-8 ios-glass-card flex flex-col min-h-[500px] overflow-hidden bg-black/40">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Output Preview</div>
                    {result && <button onClick={() => { navigator.clipboard.writeText(result.replace(/<[^>]*>/g, '')); showToast('已复制到剪贴板', 'success'); }} className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white"><Copy className="w-4 h-4" /></button>}
                </div>
                <div className="flex-1 p-8 overflow-y-auto">
                    {isGenerating ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-600">
                            <RefreshCw className="w-12 h-12 animate-spin text-purple-500/50" />
                            <p className="text-[10px] uppercase font-mono tracking-[0.3em] animate-pulse">Neural engine writing content...</p>
                        </div>
                    ) : result ? (
                        <div className="animate-in fade-in slide-in-from-bottom-2 prose prose-invert prose-sm max-w-none text-slate-200 leading-relaxed" dangerouslySetInnerHTML={{ __html: result }}></div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-700 opacity-30">
                            <FileText className="w-16 h-16 mb-4" />
                            <p className="text-sm">选择商品并点击生成</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const CreativeStudio = () => {
    const [tool, setTool] = useState<'image-gen' | 'video-gen' | 'image-edit'>('image-gen');
    const [prompt, setPrompt] = useState('');
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [imageSize, setImageSize] = useState('1K');
    const [resolution, setResolution] = useState('720p');
    const [uploadFile, setUploadFile] = useState<File | null>(null);

    const handleGenerate = async () => {
        if (!prompt && tool !== 'image-edit') return;

        // Mandatory check for API key selection for Veo/Pro models
        const isHighQualityRequested = tool === 'video-gen' || (tool === 'image-gen' && (imageSize === '2K' || imageSize === '4K'));
        if (isHighQualityRequested) {
            if (!(await (window as any).aistudio.hasSelectedApiKey())) {
                await (window as any).aistudio.openSelectKey();
                // Assume success as per guidelines
            }
        }

        setLoading(true);
        setResultUrl(null);
        setStatusMsg('正在初始化创意引擎...');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            if (tool === 'image-gen') {
                setStatusMsg('正在生成图像...');
                const model = (imageSize === '2K' || imageSize === '4K') ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
                const response = await ai.models.generateContent({
                    model,
                    contents: { parts: [{ text: prompt }] },
                    config: { imageConfig: { aspectRatio: aspectRatio as any, imageSize: imageSize as any } }
                });
                for (const part of response.candidates?.[0]?.content?.parts || []) {
                    if (part.inlineData) { setResultUrl(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`); break; }
                }
            } else if (tool === 'video-gen') {
                setStatusMsg('Veo 3.1 视频引擎启动中...');
                let operation = await ai.models.generateVideos({ model: 'veo-3.1-fast-generate-preview', prompt, config: { numberOfVideos: 1, resolution: resolution as any, aspectRatio: aspectRatio as any } });
                while (!operation.done) {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    operation = await ai.operations.getVideosOperation({ operation });
                    setStatusMsg('渲染帧进行中...');
                }
                const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
                if (videoUri) setResultUrl(`${videoUri}&key=${process.env.API_KEY}`);
            } else if (tool === 'image-edit') {
                if (!uploadFile) throw new Error("请上传图片");
                setStatusMsg('正在重绘图片...');
                const imgPart = await fileToGenerativePart(uploadFile);
                const response = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [imgPart, { text: prompt || "Optimize this" }] } });
                for (const part of response.candidates?.[0]?.content?.parts || []) {
                    if (part.inlineData) { setResultUrl(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`); break; }
                }
            }
        } catch (error: any) { setStatusMsg(`错误: ${error.message}`); } finally { setLoading(false); }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
            <div className="md:col-span-1 bg-black/20 border border-white/10 rounded-xl p-5 flex flex-col gap-5 backdrop-blur-sm">
                <div className="flex gap-2 p-1 bg-black/40 rounded-lg border border-white/10">
                    {['image-gen', 'video-gen', 'image-edit'].map(t => (
                        <button key={t} onClick={() => setTool(t as any)} className={`flex-1 py-2 text-[10px] font-bold rounded capitalize ${tool === t ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>{t.replace('-gen', '')}</button>
                    ))}
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase font-mono tracking-widest">Creative Prompt</label>
                        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} className="w-full h-32 bg-black/60 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-indigo-500 outline-none resize-none" placeholder="描述你的创意构想..."/>
                    </div>
                    {tool === 'image-edit' && (
                        <div>
                            <label className="text-xs font-bold text-slate-400 mb-1 block">源图片</label>
                            <input type="file" accept="image/*" onChange={e => setUploadFile(e.target.files?.[0] || null)} className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-slate-800 file:text-white hover:file:bg-slate-700"/>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs font-bold text-slate-400 mb-1 block">纵横比</label><select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded p-2 text-xs text-white"><option value="1:1">1:1</option><option value="16:9">16:9</option><option value="9:16">9:16</option></select></div>
                        {tool === 'image-gen' && <div><label className="text-xs font-bold text-slate-400 mb-1 block">画质</label><select value={imageSize} onChange={setImageSize as any} className="w-full bg-black/60 border border-white/10 rounded p-2 text-xs text-white"><option value="1K">1K (Standard)</option><option value="2K">2K (High-Quality)</option><option value="4K">4K (Premium)</option></select></div>}
                    </div>
                </div>
                <button onClick={handleGenerate} disabled={loading || (!prompt && tool !== 'image-edit')} className="mt-auto w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    生成创意媒体
                </button>
            </div>
            <div className="md:col-span-2 bg-black/20 border border-white/10 rounded-xl flex flex-col items-center justify-center relative overflow-hidden p-6 backdrop-blur-sm">
                {loading ? <div className="text-center"><Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" /><p className="text-sm text-slate-400 animate-pulse">{statusMsg}</p></div> : resultUrl ? (tool === 'video-gen' ? <video controls autoPlay loop className="max-w-full max-h-full rounded-lg shadow-2xl" src={resultUrl} /> : <img src={resultUrl} alt="Gen" className="max-w-full max-h-full rounded-lg shadow-2xl object-contain" />) : <div className="text-center text-slate-600 opacity-20"><ImageIcon className="w-16 h-16 mx-auto mb-2" /><p>Preview Area</p></div>}
            </div>
        </div>
    );
};

const VoiceLab = () => {
    const [connected, setConnected] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [ttsText, setTtsText] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const inputAudioContext = useRef<AudioContext | null>(null);
    const outputAudioContext = useRef<AudioContext | null>(null);
    const audioStream = useRef<MediaStream | null>(null);
    const sessionRef = useRef<any>(null);
    const nextStartTime = useRef<number>(0);
    
    useEffect(() => { return () => { if (sessionRef.current) sessionRef.current.close(); if (audioStream.current) audioStream.current.getTracks().forEach(track => track.stop()); }; }, []);

    const handleLiveConnect = async () => {
        if (connected) { if (sessionRef.current) sessionRef.current.close(); setConnected(false); return; }
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            inputAudioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioStream.current = stream;
            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } } },
                callbacks: {
                    onopen: () => {
                        setConnected(true);
                        const source = inputAudioContext.current!.createMediaStreamSource(stream);
                        const processor = inputAudioContext.current!.createScriptProcessor(4096, 1, 1);
                        processor.onaudioprocess = (e) => {
                            const pcmData16 = floatTo16BitPCM(e.inputBuffer.getChannelData(0));
                            // Solely rely on sessionPromise resolution
                            sessionPromise.then(s => s.sendRealtimeInput({ media: { mimeType: 'audio/pcm;rate=16000', data: arrayBufferToBase64(pcmData16) } }));
                        };
                        source.connect(processor);
                        processor.connect(inputAudioContext.current!.destination);
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (audioData) {
                            const buffer = await decodeAudioData(audioData, outputAudioContext.current!);
                            const source = outputAudioContext.current!.createBufferSource();
                            source.buffer = buffer; 
                            source.connect(outputAudioContext.current!.destination);
                            const startTime = Math.max(outputAudioContext.current!.currentTime, nextStartTime.current);
                            source.start(startTime);
                            nextStartTime.current = startTime + buffer.duration;
                        }
                    },
                    // Added missing onerror callback
                    onerror: (e: any) => {
                        console.error('Live session error:', e);
                        setConnected(false);
                        setLogs(prev => [...prev, `会话异常: ${e.message || '未知错误'}`]);
                    },
                    onclose: () => setConnected(false)
                }
            });
            sessionRef.current = await sessionPromise;
        } catch (e: any) { setLogs(prev => [...prev, `错误: ${e.message}`]); setConnected(false); }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            <div className="ios-glass-card p-6 flex flex-col bg-black/20">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Mic className="w-5 h-5 text-red-500" /> 实时对话 (Live)</h3>
                <div className="flex-1 bg-black/40 rounded-xl p-4 font-mono text-[10px] text-slate-500 border border-white/5 overflow-y-auto mb-6">
                    {connected ? '> 神经连接已激活，Gemini 正在听您说话...' : logs.length > 0 ? logs.map((l, i) => <div key={i}>{`> ${l}`}</div>) : '> 等待启动...'}
                </div>
                <button onClick={handleLiveConnect} className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${connected ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-red-600 hover:bg-red-500 text-white shadow-xl'}`}>
                    {connected ? <StopCircle className="w-5 h-5" /> : <Play className="w-5 h-5" />} {connected ? '断开实时会话' : '启动实时对话'}
                </button>
            </div>
            <div className="ios-glass-card p-6 flex flex-col bg-black/20">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Speaker className="w-5 h-5 text-emerald-500" /> 语音合成 (TTS)</h3>
                <textarea value={ttsText} onChange={e => setTtsText(e.target.value)} className="flex-1 bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white outline-none focus:border-emerald-500 resize-none mb-6" placeholder="输入要转化的文本..."/>
                <button onClick={async () => {
                    if (!ttsText || isSpeaking) return;
                    setIsSpeaking(true);
                    try {
                        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                        const response = await ai.models.generateContent({ model: "gemini-2.5-flash-preview-tts", contents: [{ parts: [{ text: ttsText }] }], config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } } });
                        const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                        if (base64) {
                            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                            const buffer = await decodeAudioData(base64, ctx);
                            const source = ctx.createBufferSource(); source.buffer = buffer; source.connect(ctx.destination); source.start();
                        }
                    } finally { setIsSpeaking(false); }
                }} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-xl flex items-center justify-center gap-2">
                    {isSpeaking ? <Loader2 className="animate-spin w-5 h-5" /> : <Speaker className="w-5 h-5" />} 开始合成播放
                </button>
            </div>
        </div>
    );
};

const Intelligence: React.FC = () => {
  const [activeTab, setActiveTab] = useState('chat');
  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col gap-6">
        <div className="flex bg-black/60 p-1.5 rounded-2xl border border-white/10 w-fit shadow-xl mx-auto md:mx-0 backdrop-blur-md">
            {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-5 py-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                    <tab.icon className="w-4 h-4" />
                    <div className="text-left"><div className="text-xs font-bold leading-none">{tab.label}</div><div className="text-[9px] uppercase font-mono opacity-50 mt-1">{tab.sub}</div></div>
                </button>
            ))}
        </div>
        <div className="flex-1 min-h-0 relative">
            {activeTab === 'chat' && <OmniChat />}
            {activeTab === 'copy' && <CopywritingLab />}
            {activeTab === 'creative' && <CreativeStudio />}
            {activeTab === 'voice' && <VoiceLab />}
        </div>
    </div>
  );
};

export default Intelligence;
