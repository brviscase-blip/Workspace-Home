
import React from 'react';
import { FileText, Table, Presentation, FileCode, Shield, MoreHorizontal } from 'lucide-react';
import { FileItem } from '../types';

const getIcon = (type: string) => {
  const iconProps = { size: 24, className: "text-slate-400" };
  switch (type) {
    case 'doc': return <FileText {...iconProps} />;
    case 'excel': return <Table {...iconProps} />;
    case 'ppt': return <Presentation {...iconProps} />;
    case 'pdf': return <FileCode {...iconProps} />;
    case 'security': return <Shield {...iconProps} />;
    default: return <FileText {...iconProps} />;
  }
};

interface FileCardProps {
  file: FileItem;
}

const FileCard: React.FC<FileCardProps> = ({ file }) => {
  return (
    <div className="group relative flex flex-col bg-[#0f172a]/30 border border-slate-800 rounded-xl p-5 hover:bg-[#0f172a]/60 hover:border-slate-700 transition-all duration-300 aspect-[4/5] cursor-pointer">
      {/* Icon Area */}
      <div className="flex justify-between items-start mb-auto">
        <div className="w-14 h-14 bg-[#0f172a] rounded-lg border border-slate-800 flex items-center justify-center group-hover:border-slate-600 transition-colors">
          {getIcon(file.type)}
        </div>
        <button className="text-slate-600 hover:text-slate-300 transition-colors">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Metadata */}
      <div className="mt-8">
        <h3 className="text-sm font-bold text-white truncate group-hover:text-blue-400 transition-colors">
          {file.name}
        </h3>
        <div className="flex items-center justify-between mt-1 text-[9px] font-black tracking-widest uppercase">
          <span className="text-slate-500">{file.category}</span>
          <span className="text-slate-600">{file.size}</span>
        </div>
      </div>

      {/* Glow Effect */}
      <div className="absolute inset-0 rounded-xl bg-blue-500/0 group-hover:bg-blue-500/5 transition-all duration-500 -z-10"></div>
    </div>
  );
};

export default FileCard;
