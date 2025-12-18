import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, Brain, Zap, Globe, MapPin, Image as ImageIcon, Video, Mic, 
  Speaker, Upload, Sparkles, Loader2, Send, Play, Square, Pause,
  Maximize2, RefreshCw, Download, AlertCircle, Wand2, Film, StopCircle
} from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { useTanxing } from '../context/TanxingContext';

// --- Constants & Types ---
const TABS = [
  { id: 'chat', label: '全能对话 (Omni-Chat)', icon: Bot },
  { id: 'creative', label: '创意工坊 (Creative)', icon: Wand2 },
  { id: 'vision', label: '视觉分析 (Vision)', icon: ImageIcon },
  { id: 'voice', label: '语音交互 (Voice)', icon: Mic },
];

// --- Audio Helper Functions (PCM Decoding/Encoding) ---

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
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Float32 mic input to 16-bit PCM for Gemini
function floatTo16BitPCM(input: Float32Array) {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
        const s = Math.max(-1, Math.min(1, input[i]));
        output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output.buffer;
}

// Decode Gemini's 24kHz PCM output to AudioBuffer
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
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const checkApiKeySelection = async () => {
    if ((window as any).aistudio && (window as any).aistudio.hasSelectedApiKey) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (!hasKey && (window as any).aistudio.openSelectKey) {
            await (window as any).aistudio.openSelectKey();
            return true;
        }
        return hasKey;
    }
    return true; 
};

// --- Components ---

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
            if (!process.env.API_KEY) throw new Error("API Key missing");
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            // Default model updated to recommended gemini-3-flash-preview
            let model = 'gemini-3-flash-preview';
            let config: any = {};
            let tools: any[] = [];

            switch (mode) {
                case 'thinking':
                    model = 'gemini-3-pro-preview';
                    config = { thinkingConfig: { thinkingBudget: 32768 } };
                    break;
                case 'search':
                    // Recommended model for search grounding is gemini-3-flash-preview
                    model = 'gemini-3-flash-preview';
                    tools = [{ googleSearch: {} }];
                    break;
                case 'maps':
                    // Maps grounding is only supported in Gemini 2.5 series models.
                    model = 'gemini-2.5-flash';
                    tools = [{ googleMaps: {} }];
                    break;
                case 'lite':
                    // Recommended model for lite tasks
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
                role: 'model', 
                text: response.text || "无响应内容。", 
                isThinking: mode === 'thinking',
                grounding
            }]);

        } catch (error: any) {
            setMessages(prev => [...prev, { role: 'model', text: `错误: ${error.message}` }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-black/20 rounded-xl border border-white/10 overflow-hidden backdrop-blur-sm">
            {/* Mode Selector */}
            <div className="flex gap-2 p-4 border-b border-white/10 bg-black/40 overflow-x-auto">
                <button onClick={() => setMode('standard')} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border ${mode === 'standard' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-black/60 border-white/10 text-slate-400'}`}>
                    <Sparkles className="w-3 h-3" /> 标准模式
                </button>
                <button onClick={() => setMode('thinking')} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border ${mode === 'thinking' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-black/60 border-white/10 text-slate-400'}`}>
                    <Brain className="w-3 h-3" /> 深度思考 (Pro)
                </button>
                <button onClick={() => setMode('search')} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border ${mode === 'search' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-black/60 border-white/10 text-slate-400'}`}>
                    <Globe className="w-3 h-3" /> 联网搜索
                </button>
                <button onClick={() => setMode('maps')} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border ${mode === 'maps' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-black/60 border-white/10 text-slate-400'}`}>
                    <MapPin className="w-3 h-3" /> 地图溯源
                </button>
                <button onClick={() => setMode('lite')} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border ${mode === 'lite' ? 'bg-amber-600 border-amber-500 text-white' : 'bg-black/60 border-white/10 text-slate-400'}`}>
                    <Zap className="w-3 h-3" /> 极速模式 (Lite)
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                        <Bot className="w-16 h-16 mb-4" />
                        <p>请选择一种模式并开始对话...</p>
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-200 border border-slate-700'}`}>
                            {msg.isThinking && <div className="text-xs text-purple-400 font-mono mb-1 flex items-center gap-1"><Brain className="w-3 h-3"/> 思考过程已完成</div>}
                            {msg.text}
                        </div>
                        {msg.grounding?.groundingChunks && (
                            <div className="mt-2 text-xs flex flex-wrap gap-2 max-w-[80%]">
                                {msg.grounding.groundingChunks.map((chunk: any, i: number) => {
                                    if (chunk.web?.uri) {
                                        return <a key={i} href={chunk.web.uri} target="_blank" rel="noreferrer" className="flex items-center gap-1 bg-black/60 border border-white/10 px-2 py-1 rounded text-blue-400 hover:text-white"><Globe className="w-3 h-3"/> {chunk.web.title || '来源'}</a>
                                    }
                                    if (chunk.maps?.placeAnswerSources?.[0]?.placeId) {
                                         return <span key={i} className="flex items-center gap-1 bg-black/60 border border-white/10 px-2 py-1 rounded text-emerald-400"><MapPin className="w-3 h-3"/> 地图位置</span>
                                    }
                                    return null;
                                })}
                            </div>
                        )}
                    </div>
                ))}
                {loading && <div className="flex items-center gap-2 text-slate-500 text-sm p-2"><Loader2 className="w-4 h-4 animate-spin" /> AI 思考中...</div>}
                <div ref={scrollRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 bg-black/40">
                <div className="flex gap-2">
                    {/* Fixed setQuery to setInput for correct state update */}
                    <input 
                        type="text" 
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        placeholder={`给 Gemini 发送消息 (${mode} 模式)...`}
                        className="flex-1 bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                    />
                    <button onClick={handleSend} disabled={loading} className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl disabled:opacity-50 transition-colors">
                        <Send className="w-5 h-5" />
                    </button>
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
    
    // Configs
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [imageSize, setImageSize] = useState('1K');
    const [resolution, setResolution] = useState('720p');
    const [uploadFile, setUploadFile] = useState<File | null>(null);

    const handleGenerate = async () => {
        if (!prompt && tool !== 'image-edit') return;
        setLoading(true);
        setResultUrl(null);
        setStatusMsg('正在初始化创意引擎...');

        try {
            if (tool === 'video-gen' || (tool === 'image-gen' && imageSize !== '1K')) {
                await checkApiKeySelection();
            }

            if (!process.env.API_KEY) throw new Error("API Key missing");
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            if (tool === 'image-gen') {
                setStatusMsg('正在生成高保真图像...');
                const response = await ai.models.generateContent({
                    model: 'gemini-3-pro-image-preview',
                    contents: { parts: [{ text: prompt }] },
                    config: {
                        imageConfig: { aspectRatio: aspectRatio as any, imageSize: imageSize as any }
                    }
                });
                
                for (const part of response.candidates?.[0]?.content?.parts || []) {
                    if (part.inlineData) {
                        setResultUrl(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
                        break;
                    }
                }
            } else if (tool === 'video-gen') {
                setStatusMsg('提交视频生成任务 (Veo 3.1)...');
                let operation = await ai.models.generateVideos({
                    model: 'veo-3.1-fast-generate-preview',
                    prompt: prompt,
                    config: {
                        numberOfVideos: 1,
                        resolution: resolution as any,
                        aspectRatio: aspectRatio as any
                    }
                });
                
                setStatusMsg('正在渲染视频帧... 此过程可能需要一分钟。');
                while (!operation.done) {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    operation = await ai.operations.getVideosOperation({ operation: operation });
                    setStatusMsg('渲染进行中...');
                }

                const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
                if (videoUri) {
                    setResultUrl(`${videoUri}&key=${process.env.API_KEY}`);
                }
            } else if (tool === 'image-edit') {
                if (!uploadFile) throw new Error("请上传一张图片进行编辑。");
                setStatusMsg('正在使用 Gemini Flash 编辑图片...');
                const imgPart = await fileToGenerativePart(uploadFile);
                
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: {
                        parts: [
                            imgPart, 
                            { text: prompt || "Edit this image" }
                        ]
                    }
                });
                
                for (const part of response.candidates?.[0]?.content?.parts || []) {
                    if (part.inlineData) {
                        setResultUrl(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
                        break;
                    }
                }
            }

        } catch (error: any) {
            setStatusMsg(`错误: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
            <div className="md:col-span-1 bg-black/20 border border-white/10 rounded-xl p-5 flex flex-col gap-5 backdrop-blur-sm">
                <div className="flex gap-2 p-1 bg-black/40 rounded-lg border border-white/10">
                    <button onClick={() => setTool('image-gen')} className={`flex-1 py-2 text-xs font-bold rounded ${tool === 'image-gen' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>图片生成</button>
                    <button onClick={() => setTool('video-gen')} className={`flex-1 py-2 text-xs font-bold rounded ${tool === 'video-gen' ? 'bg-pink-600 text-white' : 'text-slate-400'}`}>视频 (Veo)</button>
                    <button onClick={() => setTool('image-edit')} className={`flex-1 py-2 text-xs font-bold rounded ${tool === 'image-edit' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>图片编辑</button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-400 mb-1 block">提示词 (Prompt)</label>
                        <textarea 
                            value={prompt} 
                            onChange={e => setPrompt(e.target.value)}
                            className="w-full h-32 bg-black/60 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-indigo-500 outline-none resize-none"
                            placeholder={tool === 'image-edit' ? "例如：添加复古滤镜..." : "描述你的创意构想..."}
                        />
                    </div>

                    {tool === 'image-edit' && (
                        <div>
                            <label className="text-xs font-bold text-slate-400 mb-1 block">源图片</label>
                            <input 
                                type="file" 
                                accept="image/*"
                                onChange={e => setUploadFile(e.target.files?.[0] || null)}
                                className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-white hover:file:bg-slate-700"
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 mb-1 block">纵横比</label>
                            <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded p-2 text-xs text-white">
                                <option value="1:1">1:1 (方形)</option>
                                <option value="16:9">16:9 (横屏)</option>
                                <option value="9:16">9:16 (竖屏)</option>
                                <option value="4:3">4:3</option>
                                <option value="3:4">3:4</option>
                            </select>
                        </div>
                        {tool === 'image-gen' && (
                            <div>
                                <label className="text-xs font-bold text-slate-400 mb-1 block">画质 (Size)</label>
                                <select value={imageSize} onChange={e => setImageSize(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded p-2 text-xs text-white">
                                    <option value="1K">1K (标准)</option>
                                    <option value="2K">2K (高清)</option>
                                    <option value="4K">4K (超清)</option>
                                </select>
                            </div>
                        )}
                        {tool === 'video-gen' && (
                            <div>
                                <label className="text-xs font-bold text-slate-400 mb-1 block">分辨率</label>
                                <select value={resolution} onChange={e => setResolution(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded p-2 text-xs text-white">
                                    <option value="720p">720p</option>
                                    <option value="1080p">1080p</option>
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                <button 
                    onClick={handleGenerate} 
                    disabled={loading || (!prompt && tool !== 'image-edit')}
                    className="mt-auto w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    开始生成
                </button>
            </div>

            <div className="md:col-span-2 bg-black/20 border border-white/10 rounded-xl flex flex-col items-center justify-center relative overflow-hidden p-6 backdrop-blur-sm">
                {loading ? (
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
                        <p className="text-sm text-slate-400 animate-pulse">{statusMsg}</p>
                    </div>
                ) : resultUrl ? (
                    tool === 'video-gen' ? (
                        <video controls autoPlay loop className="max-w-full max-h-full rounded-lg shadow-2xl" src={resultUrl} />
                    ) : (
                        <img src={resultUrl} alt="Generated" className="max-w-full max-h-full rounded-lg shadow-2xl object-contain" />
                    )
                ) : (
                    <div className="text-center text-slate-600">
                        {tool === 'video-gen' ? <Film className="w-16 h-16 mx-auto mb-2 opacity-20" /> : <ImageIcon className="w-16 h-16 mx-auto mb-2 opacity-20" />}
                        <p>预览区域 (Preview Area)</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const VisionLab = () => {
    const [file, setFile] = useState<File | null>(null);
    const [prompt, setPrompt] = useState('');
    const [analysis, setAnalysis] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAnalyze = async () => {
        if (!file) return;
        setLoading(true);
        setAnalysis('');
        try {
            if (!process.env.API_KEY) throw new Error("API Key missing");
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const filePart = await fileToGenerativePart(file);

            const userPrompt = prompt || "Analyze this media in detail. Describe features and key information. Answer in Chinese.";

            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: {
                    parts: [
                        filePart,
                        { text: userPrompt }
                    ]
                }
            });
            setAnalysis(response.text || "未生成分析结果。");
        } catch (e: any) {
            setAnalysis(`Error: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            <div className="bg-black/20 border border-white/10 rounded-xl p-6 flex flex-col gap-4 backdrop-blur-sm">
                <div className="border-2 border-dashed border-white/10 rounded-xl flex-1 flex flex-col items-center justify-center p-6 relative hover:bg-white/5 transition-colors">
                    <input 
                        type="file" 
                        accept="image/*,video/*" 
                        onChange={e => setFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    {file ? (
                        <div className="text-center">
                            {file.type.startsWith('video') ? <Video className="w-12 h-12 text-indigo-500 mx-auto mb-2" /> : <ImageIcon className="w-12 h-12 text-indigo-500 mx-auto mb-2" />}
                            <p className="text-white font-medium">{file.name}</p>
                            <p className="text-xs text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                    ) : (
                        <div className="text-center text-slate-500">
                            <Upload className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>点击或拖拽上传图片/视频</p>
                        </div>
                    )}
                </div>
                
                <div>
                    <label className="text-xs font-bold text-slate-400 mb-1 block">分析指令 (可选)</label>
                    <textarea 
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        className="w-full h-20 bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-indigo-500 outline-none resize-none"
                        placeholder="例如：提取这张图里的所有文字，或者描述视频中的产品卖点..."
                    />
                </div>

                <button 
                    onClick={handleAnalyze} 
                    disabled={!file || loading}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Maximize2 className="w-4 h-4" />}
                    使用 Gemini 3 Pro 分析
                </button>
            </div>
            <div className="bg-black/20 border border-white/10 rounded-xl p-6 overflow-y-auto backdrop-blur-sm">
                <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase">分析结果</h3>
                {analysis ? (
                    <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{analysis}</div>
                ) : (
                    <div className="text-slate-600 italic">分析结果将显示在这里...</div>
                )}
            </div>
        </div>
    );
};

const VoiceLab = () => {
    // --- Live API State ---
    const [connected, setConnected] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    
    // --- TTS State ---
    const [ttsText, setTtsText] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Audio Contexts
    const inputAudioContext = useRef<AudioContext | null>(null);
    const outputAudioContext = useRef<AudioContext | null>(null);
    const audioStream = useRef<MediaStream | null>(null);
    const sessionRef = useRef<any>(null);
    
    // Playback state
    const nextStartTime = useRef<number>(0);
    const scheduledSources = useRef<AudioBufferSourceNode[]>([]);

    useEffect(() => {
        return () => {
            // Cleanup on unmount
            if (sessionRef.current) {
                sessionRef.current.close();
            }
            if (audioStream.current) {
                audioStream.current.getTracks().forEach(track => track.stop());
            }
            if (inputAudioContext.current) inputAudioContext.current.close();
            if (outputAudioContext.current) outputAudioContext.current.close();
        }
    }, []);

    // --- REAL Live API Handler ---
    const handleLiveConnect = async () => {
        if (connected) {
            // Disconnect Logic
            if (sessionRef.current) {
                sessionRef.current.close();
                sessionRef.current = null;
            }
            if (audioStream.current) {
                audioStream.current.getTracks().forEach(track => track.stop());
                audioStream.current = null;
            }
            setConnected(false);
            setLogs(prev => [...prev, '连接已断开']);
            return;
        }

        setLogs(prev => [...prev, '正在初始化音频环境...']);
        
        try {
            if (!process.env.API_KEY) throw new Error("API Key missing");
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            // Setup Audio Contexts
            inputAudioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            nextStartTime.current = outputAudioContext.current.currentTime;

            // Get Mic
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioStream.current = stream;
            setLogs(prev => [...prev, '麦克风已就绪']);

            // Connect Live Session
            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                },
                callbacks: {
                    onopen: () => {
                        setConnected(true);
                        setLogs(prev => [...prev, 'Gemini Live 连接成功！正在监听...']);
                        
                        // Setup Audio Processor
                        const source = inputAudioContext.current!.createMediaStreamSource(stream);
                        const processor = inputAudioContext.current!.createScriptProcessor(4096, 1, 1);
                        
                        processor.onaudioprocess = (e) => {
                            const inputData = e.inputBuffer.getChannelData(0);
                            const pcmData16 = floatTo16BitPCM(inputData);
                            const base64 = arrayBufferToBase64(pcmData16);
                            
                            sessionPromise.then(session => {
                                session.sendRealtimeInput({
                                    media: {
                                        mimeType: 'audio/pcm;rate=16000',
                                        data: base64
                                    }
                                });
                            });
                        };
                        
                        source.connect(processor);
                        processor.connect(inputAudioContext.current!.destination);
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        // Handle Audio Output
                        const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (audioData) {
                            try {
                                const ctx = outputAudioContext.current!;
                                const buffer = await decodeAudioData(audioData, ctx, 24000);
                                
                                const source = ctx.createBufferSource();
                                source.buffer = buffer;
                                source.connect(ctx.destination);
                                
                                const startTime = Math.max(ctx.currentTime, nextStartTime.current);
                                source.start(startTime);
                                nextStartTime.current = startTime + buffer.duration;
                                scheduledSources.current.push(source);
                                
                                source.onended = () => {
                                    scheduledSources.current = scheduledSources.current.filter(s => s !== source);
                                };
                            } catch (e) {
                                console.error("Audio Decode Error", e);
                            }
                        }
                        
                        if (msg.serverContent?.turnComplete) {
                            setLogs(prev => [...prev, '模型回复完毕']);
                        }
                        
                        if (msg.serverContent?.interrupted) {
                            setLogs(prev => [...prev, '用户打断']);
                            // Cancel queued audio
                            scheduledSources.current.forEach(s => s.stop());
                            scheduledSources.current = [];
                            nextStartTime.current = outputAudioContext.current!.currentTime;
                        }
                    },
                    onclose: () => {
                        setConnected(false);
                        setLogs(prev => [...prev, '连接关闭']);
                    },
                    onerror: (e) => {
                        setLogs(prev => [...prev, '连接错误']);
                        console.error(e);
                    }
                }
            });
            
            sessionRef.current = await sessionPromise;

        } catch (e: any) {
            setLogs(prev => [...prev, `错误: ${e.message}`]);
            setConnected(false);
        }
    };

    // --- REAL TTS Handler (PCM) ---
    const handleTTS = async () => {
        if (!ttsText) return;
        setIsSpeaking(true);
        setLogs(prev => [...prev, '正在生成语音 (PCM)...']);
        
        try {
            if (!process.env.API_KEY) throw new Error("API Key missing");
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text: ttsText }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
                },
            });
            
            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
                // Initialize context if needed
                if (!outputAudioContext.current) {
                    outputAudioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                }
                const ctx = outputAudioContext.current;
                
                // Decode and Play
                const buffer = await decodeAudioData(base64Audio, ctx, 24000);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                source.start();
                setLogs(prev => [...prev, '播放成功']);
            }
        } catch (e: any) {
            setLogs(prev => [...prev, `TTS 错误: ${e.message}`]);
        } finally {
            setIsSpeaking(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            <div className="space-y-6">
                {/* Live Card */}
                <div className="bg-black/20 border border-white/10 rounded-xl p-6 relative overflow-hidden backdrop-blur-sm h-full flex flex-col">
                    <div className="relative z-10 flex-1 flex flex-col">
                        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                            <Mic className="w-5 h-5 text-red-500" /> 实时对话 (Gemini Live)
                        </h3>
                        <p className="text-xs text-slate-400 mb-6">低延迟、全双工、可打断的实时 AI 语音对话。</p>
                        
                        <div className="flex gap-4 mb-6">
                            <button 
                                onClick={handleLiveConnect}
                                className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${connected ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/40'}`}
                            >
                                {connected ? <StopCircle className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                                {connected ? '断开连接' : '开始对话'}
                            </button>
                        </div>

                        <div className="flex-1 bg-black/40 rounded-lg p-3 overflow-y-auto text-xs font-mono text-slate-300 space-y-1 border border-white/5">
                            {logs.map((log, i) => <div key={i}>{log}</div>)}
                        </div>
                    </div>
                    {connected && (
                        <div className="absolute top-0 right-0 bottom-0 left-0 bg-[radial-gradient(circle_at_center,_#ef4444_0%,_transparent_70%)] opacity-5 pointer-events-none animate-pulse"></div>
                    )}
                </div>
            </div>

            <div className="space-y-6">
                {/* TTS Card */}
                <div className="bg-black/20 border border-white/10 rounded-xl p-6 h-full flex flex-col backdrop-blur-sm">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Speaker className="w-5 h-5 text-emerald-500" /> 文本转语音 (PCM TTS)
                    </h3>
                    <textarea 
                        value={ttsText}
                        onChange={e => setTtsText(e.target.value)}
                        className="flex-1 bg-black/40 border border-white/10 rounded-lg p-4 text-sm text-white focus:border-emerald-500 outline-none resize-none mb-4"
                        placeholder="输入要朗读的文本 (支持中英文)..."
                    />
                    <button 
                        onClick={handleTTS}
                        disabled={isSpeaking || !ttsText}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isSpeaking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                        生成并播放 (Realtime)
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main Page Layout ---

const Intelligence: React.FC = () => {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col gap-6">
        {/* Header Tabs */}
        <div className="flex bg-black/60 p-1.5 rounded-2xl border border-white/10 w-fit shadow-xl mx-auto md:mx-0 backdrop-blur-md">
            {TABS.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all duration-300 ${
                        activeTab === tab.id 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                        : 'text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                </button>
            ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 relative">
            {activeTab === 'chat' && <OmniChat />}
            {activeTab === 'creative' && <CreativeStudio />}
            {activeTab === 'vision' && <VisionLab />}
            {activeTab === 'voice' && <VoiceLab />}
        </div>
    </div>
  );
};

export default Intelligence;