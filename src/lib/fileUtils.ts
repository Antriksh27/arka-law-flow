
import { FileText, Image, File, FileSpreadsheet, FileVideo, FileAudio } from 'lucide-react';

export const getFileIcon = (fileType: string | null) => {
  if (!fileType) return File;
  
  const type = fileType.toLowerCase();
  
  if (type.includes('pdf')) return FileText;
  if (type.includes('doc') || type.includes('txt')) return FileText;
  if (type.includes('image') || type.includes('jpg') || type.includes('png') || type.includes('gif')) return Image;
  if (type.includes('excel') || type.includes('csv') || type.includes('sheet')) return FileSpreadsheet;
  if (type.includes('video') || type.includes('mp4') || type.includes('avi')) return FileVideo;
  if (type.includes('audio') || type.includes('mp3') || type.includes('wav')) return FileAudio;
  
  return File;
};

export const getFileColor = (fileType: string | null) => {
  if (!fileType) return 'text-gray-500';
  
  const type = fileType.toLowerCase();
  
  if (type.includes('pdf')) return 'text-red-500';
  if (type.includes('doc')) return 'text-blue-500';
  if (type.includes('image')) return 'text-green-500';
  if (type.includes('excel')) return 'text-emerald-500';
  if (type.includes('video')) return 'text-purple-500';
  if (type.includes('audio')) return 'text-orange-500';
  
  return 'text-gray-500';
};
