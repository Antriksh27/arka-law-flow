// Enhanced file type detection with support for more formats
export interface FileTypeInfo {
  category: 'pdf' | 'image' | 'video' | 'audio' | 'document' | 'spreadsheet' | 'presentation' | 'text' | 'archive' | 'unknown';
  extension: string;
  mimeType?: string;
  canPreview: boolean;
  requiresDownload: boolean;
}

const FILE_TYPE_MAP: Record<string, Omit<FileTypeInfo, 'extension'>> = {
  // PDFs
  'pdf': { category: 'pdf', canPreview: true, requiresDownload: false },
  
  // Images
  'jpg': { category: 'image', canPreview: true, requiresDownload: false },
  'jpeg': { category: 'image', canPreview: true, requiresDownload: false },
  'png': { category: 'image', canPreview: true, requiresDownload: false },
  'gif': { category: 'image', canPreview: true, requiresDownload: false },
  'webp': { category: 'image', canPreview: true, requiresDownload: false },
  'bmp': { category: 'image', canPreview: true, requiresDownload: false },
  'svg': { category: 'image', canPreview: true, requiresDownload: false },
  'ico': { category: 'image', canPreview: true, requiresDownload: false },
  
  // Videos
  'mp4': { category: 'video', canPreview: true, requiresDownload: false },
  'webm': { category: 'video', canPreview: true, requiresDownload: false },
  'avi': { category: 'video', canPreview: false, requiresDownload: true },
  'mov': { category: 'video', canPreview: false, requiresDownload: true },
  'wmv': { category: 'video', canPreview: false, requiresDownload: true },
  'flv': { category: 'video', canPreview: false, requiresDownload: true },
  'mkv': { category: 'video', canPreview: false, requiresDownload: true },
  
  // Audio
  'mp3': { category: 'audio', canPreview: true, requiresDownload: false },
  'wav': { category: 'audio', canPreview: true, requiresDownload: false },
  'ogg': { category: 'audio', canPreview: true, requiresDownload: false },
  'aac': { category: 'audio', canPreview: true, requiresDownload: false },
  'm4a': { category: 'audio', canPreview: true, requiresDownload: false },
  'wma': { category: 'audio', canPreview: false, requiresDownload: true },
  
  // Documents
  'doc': { category: 'document', canPreview: true, requiresDownload: false },
  'docx': { category: 'document', canPreview: true, requiresDownload: false },
  'rtf': { category: 'document', canPreview: false, requiresDownload: true },
  'odt': { category: 'document', canPreview: false, requiresDownload: true },
  
  // Spreadsheets
  'xls': { category: 'spreadsheet', canPreview: false, requiresDownload: true },
  'xlsx': { category: 'spreadsheet', canPreview: false, requiresDownload: true },
  'csv': { category: 'spreadsheet', canPreview: true, requiresDownload: false },
  'ods': { category: 'spreadsheet', canPreview: false, requiresDownload: true },
  
  // Presentations
  'ppt': { category: 'presentation', canPreview: false, requiresDownload: true },
  'pptx': { category: 'presentation', canPreview: false, requiresDownload: true },
  'odp': { category: 'presentation', canPreview: false, requiresDownload: true },
  
  // Text files
  'txt': { category: 'text', canPreview: true, requiresDownload: false },
  'md': { category: 'text', canPreview: true, requiresDownload: false },
  'json': { category: 'text', canPreview: true, requiresDownload: false },
  'xml': { category: 'text', canPreview: true, requiresDownload: false },
  'html': { category: 'text', canPreview: true, requiresDownload: false },
  'css': { category: 'text', canPreview: true, requiresDownload: false },
  'js': { category: 'text', canPreview: true, requiresDownload: false },
  'ts': { category: 'text', canPreview: true, requiresDownload: false },
  
  // Archives
  'zip': { category: 'archive', canPreview: false, requiresDownload: true },
  'rar': { category: 'archive', canPreview: false, requiresDownload: true },
  '7z': { category: 'archive', canPreview: false, requiresDownload: true },
  'tar': { category: 'archive', canPreview: false, requiresDownload: true },
  'gz': { category: 'archive', canPreview: false, requiresDownload: true },
};

export function detectFileType(fileName: string, mimeType?: string): FileTypeInfo {
  const extension = fileName.toLowerCase().split('.').pop() || '';
  const typeInfo = FILE_TYPE_MAP[extension];
  
  if (typeInfo) {
    return {
      ...typeInfo,
      extension,
      mimeType
    };
  }
  
  // Fallback to MIME type detection
  if (mimeType) {
    const mimeCategory = mimeType.toLowerCase();
    if (mimeCategory.includes('pdf')) {
      return { category: 'pdf', extension, mimeType, canPreview: true, requiresDownload: false };
    }
    if (mimeCategory.includes('image')) {
      return { category: 'image', extension, mimeType, canPreview: true, requiresDownload: false };
    }
    if (mimeCategory.includes('video')) {
      return { category: 'video', extension, mimeType, canPreview: true, requiresDownload: false };
    }
    if (mimeCategory.includes('audio')) {
      return { category: 'audio', extension, mimeType, canPreview: true, requiresDownload: false };
    }
    if (mimeCategory.includes('text')) {
      return { category: 'text', extension, mimeType, canPreview: true, requiresDownload: false };
    }
  }
  
  // Unknown file type
  return {
    category: 'unknown',
    extension,
    mimeType,
    canPreview: false,
    requiresDownload: true
  };
}

export function getFileIcon(fileType: FileTypeInfo): string {
  switch (fileType.category) {
    case 'pdf': return '📄';
    case 'image': return '🖼️';
    case 'video': return '🎥';
    case 'audio': return '🎵';
    case 'document': return '📝';
    case 'spreadsheet': return '📊';
    case 'presentation': return '📈';
    case 'text': return '📃';
    case 'archive': return '📦';
    default: return '📁';
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}