import React, { useState } from 'react';
import { AlertDialog, AlertDialogContent } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2, Trash2, AlertTriangle, X, FileText } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface DeleteDocumentDialogProps {
  open: boolean;
  onClose: () => void;
  document: any;
  onDeleted: () => void;
}

export const DeleteDocumentDialog: React.FC<DeleteDocumentDialogProps> = ({
  open,
  onClose,
  document,
  onDeleted
}) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isDeleting, setIsDeleting] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleClose = () => {
    setPassword('');
    setPasswordError('');
    setShowPassword(false);
    onClose();
  };

  const verifyPassword = async (password: string): Promise<boolean> => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user?.email) {
        setPasswordError('User email not found');
        return false;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: user.user.email,
        password: password
      });

      if (error) {
        setPasswordError('Incorrect password');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Password verification error:', error);
      setPasswordError('Failed to verify password');
      return false;
    }
  };

  const handleDelete = async () => {
    if (!document || !password.trim()) {
      setPasswordError('Password is required');
      return;
    }
    
    setIsDeleting(true);
    setPasswordError('');
    
    try {
      const isPasswordValid = await verifyPassword(password);
      if (!isPasswordValid) {
        setIsDeleting(false);
        return;
      }

      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([document.file_url]);

      if (storageError) {
        console.warn('Storage deletion error:', storageError);
      }

      const { error: dbError } = await supabase.rpc('delete_document_secure', {
        p_document_id: document.id
      });

      if (dbError) throw dbError;

      if (document.webdav_synced && document.webdav_path) {
        try {
          console.log('🗑️ Attempting to delete from WebDAV:', document.webdav_path);
        } catch (webdavError) {
          console.warn('WebDAV deletion failed:', webdavError);
        }
      }

      toast({
        title: "Document deleted",
        description: "The document has been successfully deleted."
      });

      onDeleted();
      handleClose();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete the document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className={`${isMobile ? 'h-auto max-h-[90dvh] w-[95%] rounded-2xl' : 'sm:max-w-md'} p-0 gap-0 overflow-hidden`}>
        <div className="flex flex-col bg-muted">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-background border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Delete Document</h2>
                <p className="text-xs text-muted-foreground">This action cannot be undone</p>
              </div>
            </div>
            {isMobile && (
              <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Document Preview Card */}
            <div className="bg-background rounded-2xl shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{document?.file_name}</p>
                  <p className="text-sm text-muted-foreground">Document will be permanently deleted</p>
                </div>
              </div>
            </div>

            {/* Password Input Card */}
            <div className="bg-background rounded-2xl shadow-sm p-4">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Enter your password to confirm
              </Label>
              <div className="relative mt-2">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError('');
                  }}
                  placeholder="Enter your password"
                  className="pr-10 rounded-xl h-11"
                  disabled={isDeleting}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent rounded-full"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isDeleting}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {passwordError && (
                <p className="text-sm text-destructive mt-2">{passwordError}</p>
              )}
            </div>

            {/* Warning Card */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-amber-800 text-sm">Warning</p>
                  <p className="text-sm text-amber-700 mt-1">
                    This will permanently remove the document from storage and cannot be recovered.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-background border-t border-border">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isDeleting}
                className="flex-1 rounded-full h-11"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting || !password.trim()}
                className="flex-1 rounded-full h-11"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Document'
                )}
              </Button>
            </div>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};
