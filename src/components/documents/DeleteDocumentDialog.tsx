
import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

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

      // Attempt to sign in with current email and provided password
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
      // First verify the password
      const isPasswordValid = await verifyPassword(password);
      if (!isPasswordValid) {
        setIsDeleting(false);
        return;
      }

      // Delete file from Supabase storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([document.file_url]);

      if (storageError) {
        console.warn('Storage deletion error:', storageError);
        // Continue with database deletion even if storage fails
      }

      // Delete document record from database using secure function
      const { error: dbError } = await supabase.rpc('delete_document_secure', {
        p_document_id: document.id
      });

      if (dbError) throw dbError;

      // If document was synced to WebDAV, attempt to delete from there too
      if (document.webdav_synced && document.webdav_path) {
        try {
          console.log('🗑️ Attempting to delete from WebDAV:', document.webdav_path);
          // Note: We don't have a delete operation in the WebDAV function yet,
          // but we can add it later if needed
        } catch (webdavError) {
          console.warn('WebDAV deletion failed:', webdavError);
          // Don't fail the entire operation if WebDAV deletion fails
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
      <AlertDialogContent className="bg-white border border-gray-200 max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold text-gray-900">
            Delete Document
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-gray-600">
            Are you sure you want to delete "{document?.file_name}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">
            Enter your password to confirm deletion
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
              className="pr-10"
              disabled={isDeleting}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isDeleting}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </Button>
          </div>
          {passwordError && (
            <p className="text-sm text-red-600 mt-1">{passwordError}</p>
          )}
        </div>

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || !password.trim()}
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
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
