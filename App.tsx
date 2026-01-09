
import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import { AppTab, Scene, GeneratedAsset, GenerationState, ImageSize, AspectRatio } from './types';
import { Loader, PrimaryButton, Card, FileUpload, ImageModal } from './components/Common';
import { analyzeScript, generateImage, generateImagePro, generateVideo, editImage, generateNarration, generateThumbnail, generateCharacterVariations, restyleImage } from './services/geminiService';

const EditModal: React.FC<{ 
  url: string; 
  onClose: () => void; 
  onSave: (newUrl: string) => void;
}> = ({ url, onClose, onSave }) => {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleEdit = async (customPrompt?: string) => {
    const finalPrompt = customPrompt || prompt;
    if (!finalPrompt.trim()) return;
    
    setIsProcessing(true);
    try {
      const editedUrl = await editImage(url, finalPrompt);
      onSave(editedUrl);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Erro ao processar edição realista.");
    } finally {
      setIsProcessing(false);
    }
  };

  const quickActions = [
    { label: 'Iluminação de Estúdio', icon: 'fa-lightbulb', prompt: 'Adicionar iluminação de estúdio profissional, luz de contorno e sombras suaves' },
    { label: 'Máximo Realismo', icon: 'fa-camera', prompt: 'Aumentar detalhes da pele, poros, texturas orgânicas e nitidez cinematográfica' },
    { label: 'Luz Natural (Golden Hour)', icon: 'fa-sun', prompt: 'Mudar a iluminação para o pôr do sol, tons quentes e luz natural suave' },
    { label: 'Remover Fundo', icon: 'fa-eraser', prompt: 'Remover o fundo e manter apenas o objeto principal com bordas perfeitas' },
  ];

  return (
    <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300" onClick={onClose}>
      <div className="glass max-w-5xl w-full rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl border border-white/10" onClick={(e) => e.stopPropagation()}>
        <div className="flex-1 bg-slate-950 flex items-center justify-center p-4 relative group">
          <img src={url} className="max-w-full max-h-[50vh] md:max-h-[70vh] rounded-xl object-contain shadow-2xl" />
          {isProcessing && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
              <div className="w-12 h-12 border-4 border-yellow-400/20 border-t-yellow-400 rounded-full animate-spin mb-4"></div>
              <p className="font-bold animate-pulse">Processando Realismo VFX...</p>
            </div>
          )}
        </div>
        <div className="w-full md:w-96 p-6 flex flex-col gap-6 bg-slate-900/50">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black italic text-yellow-400">Magic Edit Pro</h3>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ações Rápidas de Realismo</p>
            <div className="grid grid-cols-1 gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleEdit(action.prompt)}
                  disabled={isProcessing}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-700 border border-white/5 transition-all text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-yellow-400/10 flex items-center justify-center text-yellow-400 group-hover:bg-yellow-400 group-hover:text-slate-900 transition-colors">
                    <i className={`fa-solid ${action.icon}`}></i>
                  </div>
                  <span className="text-sm font-bold text-slate-300 group-hover:text-white">{action.label}</span>
                </button>
              ))}
            </div>
            <div className="pt-4 space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Instrução Customizada</p>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: Adicionar uma cicatriz realista no rosto..."
                className="w-full h-24 bg-slate-950 border border-white/10 rounded-xl p-3 text-sm focus:ring-2 focus:ring-yellow-400 outline-none resize-none"
              />
            </div>
          </div>
          <PrimaryButton onClick={() => handleEdit()} disabled={!prompt.trim() || isProcessing} loading={isProcessing} icon="fa-wand-sparkles" className="w-full py-4 shadow-yellow-400/20">
            Aplicar Edição IA
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};

const Sequencer: React.FC<{ scenes: Scene[]; onGenerateThumbnail: () => void; onClose: () => void }> = ({ scenes, onGenerateThumbnail, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const validScenes = scenes.filter(s => s.videoUrl);

  const playCurrent = () => {
    if (currentIndex >= validScenes.length) {
      setIsPlaying(false);
      return;
    }
    setIsPlaying(true);
    if (videoRef.current) videoRef.current.play();
    if (audioRef.current) audioRef.current.play();
  };

  useEffect(() => {
    if (isPlaying) {
      playCurrent();
    }
  }, [currentIndex]);

  const handleEnded = () => {
    if (currentIndex < validScenes.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsPlaying(false);
      setCurrentIndex(0);
    }
  };

  if (validScenes.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-6xl aspect-video bg-slate-900 rounded-3xl overflow-hidden relative shadow-2xl shadow-indigo-500/10 border border-white/5">
        <video
          ref={videoRef}
          src={validScenes[currentIndex].videoUrl}
          className="w-full h-full object-contain"
          onEnded={handleEnded}
          autoPlay={isPlaying}
          muted 
        />
        {validScenes[currentIndex].narrationUrl && (
          <audio
            ref={audioRef}
            src={validScenes[currentIndex].narrationUrl}
            autoPlay={isPlaying}
          />
        )}
        <div className="absolute bottom-12 left-0 right-0 flex justify-center px-12 pointer-events-none">
          <p className="bg-black/60 backdrop-blur-md text-white text-lg md:text-2xl font-bold px-6 py-2 rounded-xl text-center shadow-2xl border border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {validScenes[currentIndex].description}
          </p>
        </div>
        <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-slate-900 shadow-lg">
              <i className="fa-solid fa-play"></i>
            </div>
            <div>
              <p className="text-white font-black text-xs uppercase tracking-[0.2em]">Visualização Final</p>
              <p className="text-white/50 text-[10px] font-bold">Cena {currentIndex + 1} de {validScenes.length}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors backdrop-blur-md">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {!isPlaying && currentIndex === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
            <div className="flex flex-col items-center gap-6">
               <button onClick={() => setIsPlaying(true)} className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center text-slate-900 text-3xl shadow-2xl hover:scale-110 transition-transform active:scale-95">
                <i className="fa-solid fa-play translate-x-1"></i>
              </button>
              <button onClick={onGenerateThumbnail} className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-full font-bold text-sm backdrop-blur-md border border-white/10 flex items-center gap-2">
                <i className="fa-solid fa-rectangle-ad"></i> Gerar Thumbnail do Vídeo
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-8 flex gap-4 overflow-x-auto w-full max-w-6xl py-4 custom-scrollbar">
        {validScenes.map((scene, idx) => (
          <button 
            key={scene.id}
            onClick={() => { setCurrentIndex(idx); setIsPlaying(true); }}
            className={`flex-shrink-0 w-32 aspect-video rounded-lg overflow-hidden border-2 transition-all ${currentIndex === idx ? 'border-yellow-400 scale-105 shadow-lg shadow-yellow-400/20' : 'border-slate-800 opacity-50'}`}
          >
            <img src={scene.imageUrl} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('script');
  const [script, setScript] = useState('');
  const [useSearchInScript, setUseSearchInScript] = useState(false);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [gallery, setGallery] = useState<GeneratedAsset[]>([]);
  const [state, setState] = useState<GenerationState>(GenerationState.IDLE);
  const [error, setError] = useState<string | null>(null);
  
  // UI State
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [editingImageUrl, setEditingImageUrl] = useState<string | null>(null);

  // Character References State
  const [characterRefs, setCharacterRefs] = useState<string[]>([]);
  const [enableConsistency, setEnableConsistency] = useState(true);
  const [isGeneratingRefs, setIsGeneratingRefs] = useState(false);

  // Finalizer State
  const [isSequencerOpen, setIsSequencerOpen] = useState(false);

  // Thumbnail Tab State
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [thumbnailStyleRef, setThumbnailStyleRef] = useState<string | null>(null);
  const [isRestylingThumbnail, setIsRestylingThumbnail] = useState<string | null>(null);

  // Bulk generation state
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);

  // Independent Creator State
  const [creatorPrompt, setCreatorPrompt] = useState('');
  const [creatorImage, setCreatorImage] = useState<string | null>(null);
  const [isCreatingImage, setIsCreatingImage] = useState(false);
  const [creatorSize, setCreatorSize] = useState<ImageSize>('1K');
  const [creatorAspectRatio, setCreatorAspectRatio] = useState<AspectRatio>('16:9');
  const [useSearchInCreator, setUseSearchInCreator] = useState(false);
  const [isProMode, setIsProMode] = useState(true);

  // Editor State
  const [editorSourceImage, setEditorSourceImage] = useState<string | null>(null);
  const [editorPrompt, setEditorPrompt] = useState('');
  const [editorResult, setEditorResult] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Video generation states
  const [isGeneratingVideo, setIsGeneratingVideo] = useState<string | null>(null);

  const addToGallery = (type: GeneratedAsset['type'], url: string, prompt: string) => {
    const newAsset: GeneratedAsset = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      url,
      prompt,
      timestamp: Date.now()
    };
    setGallery(prev => [newAsset, ...prev]);
  };

  const checkVideoKey = async () => {
    if (typeof (window as any).aistudio !== 'undefined') {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
      }
    }
  };

  const handleGenerateVariations = async () => {
    if (characterRefs.length === 0) return;
    setIsGeneratingRefs(true);
    try {
      const firstFace = characterRefs[0];
      const variations = await generateCharacterVariations(firstFace);
      setCharacterRefs(prev => [...prev, ...variations].slice(0, 4));
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar variações.");
    } finally {
      setIsGeneratingRefs(false);
    }
  };

  const handleAnalyzeScript = async () => {
    if (!script.trim()) return;
    setState(GenerationState.ANALYZING);
    setError(null);
    try {
      const data = await analyzeScript(script, useSearchInScript);
      const newScenes: Scene[] = data.scenes.map((s: any, idx: number) => ({
        ...s,
        id: `scene-${idx}`,
        status: 'idle'
      }));
      setScenes(newScenes);
    } catch (err: any) {
      setError("Falha ao analisar o roteiro.");
    } finally {
      setState(GenerationState.IDLE);
    }
  };

  const handleGenerateAllImages = async () => {
    if (scenes.length === 0 || isGeneratingAll) return;
    setIsGeneratingAll(true);
    for (const scene of scenes) {
      try {
        await handleGenerateSceneImage(scene.id);
      } catch (err) {
        console.error(`Falha ao gerar cena ${scene.id}:`, err);
      }
    }
    setIsGeneratingAll(false);
    alert("Storyboard completo gerado!");
  };

  const handleFinalizeProject = async () => {
    const videoScenes = scenes.filter(s => s.videoUrl);
    if (videoScenes.length === 0) {
      alert("Gere pelo menos um vídeo antes de compilar.");
      return;
    }
    setState(GenerationState.FINALIZING);
    try {
      const updatedScenes = [...scenes];
      for (let i = 0; i < updatedScenes.length; i++) {
        const scene = updatedScenes[i];
        if (scene.videoUrl && !scene.narrationUrl) {
          const audioUrl = await generateNarration(scene.description);
          updatedScenes[i] = { ...scene, narrationUrl: audioUrl };
          addToGallery('narration', audioUrl, `Narração: ${scene.description}`);
        }
      }
      setScenes(updatedScenes);
      setIsSequencerOpen(true);
    } catch (err) {
      console.error(err);
    } finally {
      setState(GenerationState.IDLE);
    }
  };

  const handleCreateThumbnail = async () => {
    if (!script) {
      alert("Adicione um roteiro primeiro.");
      return;
    }
    setIsGeneratingThumbnail(true);
    setActiveTab('thumbnails');
    try {
      const refs = scenes.map(s => s.imageUrl).filter(Boolean) as string[];
      const thumb = await generateThumbnail(script, refs.slice(0, 3));
      addToGallery('thumbnail', thumb.url, thumb.prompt);
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar thumbnail.");
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };

  const handleRestyleThumbnail = async (asset: GeneratedAsset) => {
    if (!thumbnailStyleRef) {
      alert("Faça upload de uma imagem de referência de estilo primeiro.");
      return;
    }
    setIsRestylingThumbnail(asset.id);
    try {
      const restyledUrl = await restyleImage(asset.url, thumbnailStyleRef, asset.prompt);
      addToGallery('thumbnail', restyledUrl, `Estilizado: ${asset.prompt}`);
      alert("Estilo aplicado com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro ao aplicar estilo.");
    } finally {
      setIsRestylingThumbnail(null);
    }
  };

  const handleGenerateSceneImage = async (sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene) return;
    setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, status: 'generating' } : s));
    try {
      const refs = enableConsistency ? characterRefs : [];
      const url = await generateImage(scene.imagePrompt, "16:9", refs);
      setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, status: 'completed', imageUrl: url } : s));
      addToGallery('image', url, scene.description);
    } catch (err) {
      setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, status: 'error' } : s));
      throw err;
    }
  };

  const handleGenerateSceneVideo = async (sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene?.imageUrl) return;
    await checkVideoKey();
    setIsGeneratingVideo(sceneId);
    try {
      const videoUrl = await generateVideo(scene.imageUrl, scene.imagePrompt, '16:9');
      setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, videoUrl } : s));
      addToGallery('video', videoUrl, scene.description);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingVideo(null);
    }
  };

  const handleIndependentCreate = async () => {
    if (!creatorPrompt.trim()) return;
    setIsCreatingImage(true);
    try {
      let url: string;
      const refs = enableConsistency ? characterRefs : [];
      if (isProMode) {
        await checkVideoKey();
        url = await generateImagePro(creatorPrompt, creatorSize, creatorAspectRatio, useSearchInCreator, refs);
      } else {
        url = await generateImage(creatorPrompt, creatorAspectRatio, refs);
      }
      setCreatorImage(url);
      addToGallery('image', url, creatorPrompt);
    } catch (err) { console.error(err); } finally { setIsCreatingImage(false); }
  };

  const handleCreatorToVideo = async () => {
    if (!creatorImage) return;
    await checkVideoKey();
    setIsGeneratingVideo('creator');
    try {
      const videoUrl = await generateVideo(creatorImage, creatorPrompt, creatorAspectRatio);
      addToGallery('video', videoUrl, creatorPrompt);
    } catch (err) { console.error(err); } finally { setIsGeneratingVideo(null); }
  };

  const handleEditImage = async () => {
    if (!editorSourceImage || !editorPrompt) return;
    setIsEditing(true);
    try {
      const url = await editImage(editorSourceImage, editorPrompt);
      setEditorResult(url);
      addToGallery('image', url, editorPrompt);
    } catch (err) { console.error(err); } finally { setIsEditing(false); }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {isSequencerOpen && <Sequencer scenes={scenes} onClose={() => setIsSequencerOpen(false)} onGenerateThumbnail={handleCreateThumbnail} />}
      {previewImageUrl && <ImageModal url={previewImageUrl} onClose={() => setPreviewImageUrl(null)} />}
      {editingImageUrl && (
        <EditModal 
          url={editingImageUrl} 
          onClose={() => setEditingImageUrl(null)} 
          onSave={(newUrl) => {
            setScenes(prev => prev.map(s => s.imageUrl === editingImageUrl ? { ...s, imageUrl: newUrl } : s));
            addToGallery('image', newUrl, "Magic Edit de Ativo");
          }} 
        />
      )}
      
      {activeTab === 'script' && (
        <div className="space-y-8 animate-in fade-in duration-500 pb-24">
          <header className="space-y-2">
            <h2 className="text-3xl font-bold italic">Diretor de Roteiro <span className="text-yellow-400">Cinematográfico</span></h2>
            <p className="text-slate-400">Transforme roteiros em storyboards visuais e vídeos animados.</p>
          </header>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-6">
              <Card>
                <textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder="Cole seu roteiro aqui..."
                  className="w-full h-48 bg-slate-900/50 border border-slate-700 rounded-xl p-4 focus:ring-2 focus:ring-yellow-400 outline-none resize-none transition-all"
                />
                <div className="mt-4 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={useSearchInScript} onChange={(e) => setUseSearchInScript(e.target.checked)} className="w-4 h-4 rounded border-slate-700 text-yellow-400" />
                    <span className="text-sm text-slate-400">Pesquisa Realista (Search)</span>
                  </label>
                  <PrimaryButton onClick={handleAnalyzeScript} loading={state === GenerationState.ANALYZING} icon="fa-brain">Analisar Cenas</PrimaryButton>
                </div>
              </Card>
            </div>
            <div className="lg:col-span-1">
              <Card className="h-full flex flex-col">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Protagonista</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {characterRefs.map((ref, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-700">
                        <img src={ref} className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {characterRefs.length < 4 && (
                      <div className="relative aspect-square">
                        <input type="file" accept="image/*" multiple onChange={(e) => {
                          const files = e.target.files;
                          if (files) {
                            Array.from(files).forEach(file => {
                              const reader = new FileReader();
                              reader.onloadend = () => setCharacterRefs(prev => [...prev, reader.result as string].slice(0, 4));
                              reader.readAsDataURL(file);
                            });
                          }
                        }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        <div className="w-full h-full border-2 border-dashed border-slate-700 rounded-lg flex items-center justify-center bg-slate-800/50"><i className="fa-solid fa-plus"></i></div>
                      </div>
                    )}
                  </div>
                  {characterRefs.length > 0 && <button onClick={handleGenerateVariations} className="w-full py-2 bg-indigo-600/20 text-indigo-400 rounded-lg text-xs font-bold">Variações de Corpo</button>}
                </div>
              </Card>
            </div>
          </div>
          {scenes.length > 0 && (
            <div className="space-y-8">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <h3 className="text-xl font-bold">Storyboard</h3>
                <button onClick={handleGenerateAllImages} disabled={isGeneratingAll} className="bg-yellow-400 text-slate-900 px-6 py-2 rounded-full font-bold text-sm">
                  {isGeneratingAll ? <i className="fa-solid fa-spinner animate-spin"></i> : "Gerar Tudo"}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {scenes.map((scene) => (
                  <Card key={scene.id} className="flex flex-col">
                    <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden mb-4 border border-slate-700">
                      {scene.status === 'generating' ? <Loader /> : scene.imageUrl ? <img src={scene.imageUrl} className="w-full h-full object-cover" /> : null}
                    </div>
                    <p className="text-xs font-bold text-slate-500 mb-1">{scene.timestamp}</p>
                    <p className="text-sm text-slate-300 flex-1 mb-4 italic">"{scene.description}"</p>
                    <div className="flex gap-2">
                      {!scene.imageUrl ? <PrimaryButton onClick={() => handleGenerateSceneImage(scene.id)} className="w-full py-2 text-xs" icon="fa-wand-sparkles">Gerar</PrimaryButton> : (
                        <>
                          <button onClick={() => handleGenerateSceneImage(scene.id)} className="flex-1 bg-slate-800 text-xs font-bold rounded-lg">Refazer</button>
                          <PrimaryButton onClick={() => handleGenerateSceneVideo(scene.id)} loading={isGeneratingVideo === scene.id} className="flex-[2] py-2 text-xs" icon="fa-clapperboard">Animar</PrimaryButton>
                        </>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
              <div className="flex justify-center">
                <button onClick={handleFinalizeProject} className="bg-indigo-600 px-12 py-4 rounded-full font-bold text-lg">COMPILAR FILME</button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'thumbnails' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold">Estratégia de Thumbnails</h2>
              <p className="text-slate-400">Gere conceitos e aplique estilos de referência.</p>
            </div>
            <PrimaryButton onClick={handleCreateThumbnail} loading={isGeneratingThumbnail} icon="fa-wand-sparkles">Gerar Conceito</PrimaryButton>
          </header>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Referência de Estilo</h3>
                {thumbnailStyleRef ? (
                  <div className="space-y-4">
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-700">
                      <img src={thumbnailStyleRef} className="w-full h-full object-cover" />
                      <button onClick={() => setThumbnailStyleRef(null)} className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors">
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 italic">Esta imagem será usada como guia de estilo (cores, iluminação, arte) para suas thumbnails.</p>
                  </div>
                ) : (
                  <FileUpload onFileSelect={setThumbnailStyleRef} />
                )}
              </Card>
            </div>
            
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {gallery.filter(a => a.type === 'thumbnail').map(thumb => (
                  <Card key={thumb.id} className="p-0 overflow-hidden group">
                    <div className="relative aspect-video bg-slate-900 group/img">
                      <img src={thumb.url} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center gap-4 transition-all backdrop-blur-sm">
                        <button onClick={() => setPreviewImageUrl(thumb.url)} className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all">
                          <i className="fa-solid fa-expand text-xl"></i>
                        </button>
                        {thumbnailStyleRef && (
                          <button 
                            onClick={() => handleRestyleThumbnail(thumb)} 
                            disabled={isRestylingThumbnail === thumb.id}
                            className="w-12 h-12 bg-yellow-400 text-slate-900 rounded-full flex items-center justify-center hover:bg-yellow-300 transition-all disabled:opacity-50"
                          >
                            {isRestylingThumbnail === thumb.id ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles text-xl"></i>}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-slate-400 italic line-clamp-2">"{thumb.prompt}"</p>
                      {thumbnailStyleRef && !thumb.prompt.startsWith('Estilizado:') && (
                        <button 
                          onClick={() => handleRestyleThumbnail(thumb)}
                          disabled={isRestylingThumbnail === thumb.id}
                          className="mt-3 w-full py-2 bg-yellow-400/10 text-yellow-400 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-yellow-400/20 transition-all"
                        >
                          Aplicar Estilo de Referência
                        </button>
                      )}
                    </div>
                  </Card>
                ))}
                {gallery.filter(a => a.type === 'thumbnail').length === 0 && !isGeneratingThumbnail && (
                  <div className="col-span-2 h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-3xl text-slate-600">
                    <i className="fa-solid fa-rectangle-ad text-4xl mb-3"></i>
                    <p>Nenhuma thumbnail gerada ainda.</p>
                  </div>
                )}
                {isGeneratingThumbnail && (
                  <div className="col-span-2">
                    <Loader message="Analisando roteiro e criando o melhor conceito visual..." />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'creator' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold text-center">Criador Nano Banana</h2>
          <Card className="space-y-4">
            <textarea value={creatorPrompt} onChange={(e) => setCreatorPrompt(e.target.value)} placeholder="Descreva a cena..." className="w-full h-32 bg-slate-950 rounded-xl p-4 border border-slate-700" />
            <div className="flex gap-4">
               <select value={creatorAspectRatio} onChange={(e) => setCreatorAspectRatio(e.target.value as AspectRatio)} className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2">
                <option value="16:9">16:9</option>
                <option value="9:16">9:16</option>
                <option value="1:1">1:1</option>
              </select>
              <PrimaryButton onClick={handleIndependentCreate} loading={isCreatingImage} className="flex-1">Gerar Imagem</PrimaryButton>
            </div>
          </Card>
          {creatorImage && (
            <div className="space-y-4">
              <Card className="p-0 overflow-hidden relative group">
                <img src={creatorImage} className="w-full" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 transition-all">
                   <button onClick={() => setPreviewImageUrl(creatorImage)} className="bg-white/20 p-4 rounded-full"><i className="fa-solid fa-expand"></i></button>
                   <button onClick={handleCreatorToVideo} className="bg-indigo-600 p-4 rounded-full"><i className="fa-solid fa-clapperboard"></i></button>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {activeTab === 'editor' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold text-center">Editor & VFX</h2>
          {!editorSourceImage ? <FileUpload onFileSelect={setEditorSourceImage} /> : (
            <div className="space-y-6">
              <Card className="p-0 overflow-hidden"><img src={editorSourceImage} className="w-full" /></Card>
              <Card className="space-y-4">
                <input value={editorPrompt} onChange={(e) => setEditorPrompt(e.target.value)} placeholder="Descreva as alterações..." className="w-full bg-slate-950 border border-slate-700 p-4 rounded-xl" />
                <div className="flex gap-2">
                  <button onClick={() => setEditorSourceImage(null)} className="px-6 py-2 bg-slate-800 rounded-xl font-bold">Trocar</button>
                  <PrimaryButton onClick={handleEditImage} loading={isEditing} className="flex-1">Aplicar Edição</PrimaryButton>
                </div>
              </Card>
            </div>
          )}
          {editorResult && <Card className="p-0 overflow-hidden animate-in zoom-in-95"><img src={editorResult} className="w-full" /></Card>}
        </div>
      )}

      {activeTab === 'gallery' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {gallery.map(asset => (
            <div key={asset.id} className="relative aspect-video glass rounded-xl overflow-hidden group">
              <img src={asset.url} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                <button onClick={() => setPreviewImageUrl(asset.url)}><i className="fa-solid fa-expand"></i></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default App;
