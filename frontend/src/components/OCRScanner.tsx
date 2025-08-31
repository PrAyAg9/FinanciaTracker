import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Tesseract from 'tesseract.js';
import { Camera, Upload, X, Loader, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { transactionService } from '../services/transactionService';

interface OCRScannerProps {
  onTransactionParsed?: (transaction: any) => void;
  onClose?: () => void;
}

const OCRScanner: React.FC<OCRScannerProps> = ({ onTransactionParsed, onClose }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const processImage = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setProgress(0);
    setExtractedText('');
    setSuccess(false);

    try {
      // Create image preview
      const imageUrl = URL.createObjectURL(file);
      
      // Perform OCR
      const { data: { text } } = await Tesseract.recognize(
        file,
        'eng',
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100));
            }
          }
        }
      );

      setExtractedText(text);
      setProgress(100);

      // Parse the extracted text using AI
      if (text.trim()) {
        try {
          const parsedTransaction = await transactionService.parseTransaction(text);
          
          if (parsedTransaction && Array.isArray(parsedTransaction) && parsedTransaction.length > 0) {
            const transaction = parsedTransaction[0];
            setSuccess(true);
            onTransactionParsed?.(transaction);
          } else {
            setError('Could not parse transaction data from the receipt. Please check the image quality.');
          }
        } catch (parseError) {
          console.error('Error parsing transaction:', parseError);
          setError('Failed to parse transaction. Please try again or enter manually.');
        }
      } else {
        setError('No text found in the image. Please ensure the receipt is clear and well-lit.');
      }

      // Clean up
      URL.revokeObjectURL(imageUrl);
    } catch (ocrError) {
      console.error('OCR Error:', ocrError);
      setError('Failed to process the image. Please try again with a clearer image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedFile(file);
      processImage(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp']
    },
    multiple: false,
    disabled: isProcessing
  });

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera if available
      });
      
      // Create video element to capture from camera
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      video.addEventListener('loadedmetadata', () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
            setUploadedFile(file);
            processImage(file);
          }
        }, 'image/jpeg', 0.9);
        
        // Stop the camera stream
        stream.getTracks().forEach(track => track.stop());
      });
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please upload an image file instead.');
    }
  };

  const reset = () => {
    setIsProcessing(false);
    setExtractedText('');
    setProgress(0);
    setError(null);
    setSuccess(false);
    setUploadedFile(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Receipt Scanner
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Upload Area */}
          {!uploadedFile && (
            <>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
                  isDragActive
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                } ${isProcessing ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
              >
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {isDragActive ? 'Drop the receipt here' : 'Upload Receipt Image'}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Drag & drop an image here, or click to select
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  Supports PNG, JPG, JPEG, GIF, BMP, WebP
                </p>
              </div>

              {/* Camera Option */}
              <div className="text-center">
                <button
                  onClick={handleCameraCapture}
                  disabled={isProcessing}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  <Camera className="w-4 h-4" />
                  <span>Take Photo</span>
                </button>
              </div>
            </>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto">
                <Loader className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  Processing Receipt...
                </p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {progress}% Complete
                </p>
              </div>
            </div>
          )}

          {/* Success State */}
          {success && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <p className="text-lg font-medium text-green-900 dark:text-green-400">
                  Receipt Processed Successfully!
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Transaction has been parsed and is ready to save.
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-red-900 dark:text-red-400">
                    Processing Error
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Extracted Text Preview */}
          {extractedText && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Extracted Text
                </h3>
              </div>
              <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap max-h-32 overflow-y-auto">
                {extractedText}
              </pre>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            {(uploadedFile || extractedText) && (
              <button
                onClick={reset}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
              >
                Try Another
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OCRScanner;
