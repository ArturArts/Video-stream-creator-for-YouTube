
import React from 'react';

export const Loader: React.FC<{ message?: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center p-12 text-center animate-pulse">
    <div className="w-12 h-12 border-4 border-yellow-400/20 border-t-yellow-400 rounded-full animate-spin mb-4"></div>
    {message && <p className="text-slate-400 font-medium">{message}</p>}
  </div>
);

export const PrimaryButton: React.FC<{ 
  onClick: () => void; 
  disabled?: boolean; 
  loading?: boolean;
  children: React.ReactNode;
  icon?: string;
  className?: string;
}> = ({ onClick, disabled, loading, children, icon, className = "" }) => (
  <button
    onClick={onClick}
    disabled={disabled || loading}
    className={`bg-yellow-400 hover:bg-yellow-300 disabled:bg-slate-700 disabled:cursor-not-allowed text-slate-900 font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-yellow-400/10 active:scale-95 ${className}`}
  >
    {loading ? (
      <i className="fa-solid fa-circle-notch animate-spin"></i>
    ) : icon ? (
      <i className={`fa-solid ${icon}`}></i>
    ) : null}
    {children}
  </button>
);

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`glass rounded-2xl p-6 shadow-xl ${className}`}>
    {children}
  </div>
);

export const FileUpload: React.FC<{ onFileSelect: (base64: string) => void }> = ({ onFileSelect }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onFileSelect(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="relative group">
      <input
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
      <div className="border-2 border-dashed border-slate-700 group-hover:border-yellow-400/50 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-all">
        <i className="fa-solid fa-cloud-arrow-up text-3xl text-slate-500 group-hover:text-yellow-400 transition-colors"></i>
        <p className="text-slate-400 text-sm font-medium">Clique ou arraste para enviar imagem</p>
      </div>
    </div>
  );
};

export const ImageModal: React.FC<{ url: string; onClose: () => void }> = ({ url, onClose }) => (
  <div 
    className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300"
    onClick={onClose}
  >
    <button 
      className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white text-2xl transition-all"
      onClick={onClose}
    >
      <i className="fa-solid fa-xmark"></i>
    </button>
    <div className="relative max-w-full max-h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
      <img 
        src={url} 
        alt="Visualização em detalhes" 
        className="max-w-full max-h-[90vh] rounded-xl shadow-2xl border border-white/10 object-contain animate-in zoom-in-95 duration-300" 
      />
      <div className="absolute -bottom-12 left-0 right-0 flex justify-center gap-4">
        <a 
          href={url} 
          download="banana-studio-hd"
          className="bg-yellow-400 text-slate-900 px-6 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-yellow-300 transition-all"
        >
          <i className="fa-solid fa-download"></i> Baixar HD
        </a>
      </div>
    </div>
  </div>
);
