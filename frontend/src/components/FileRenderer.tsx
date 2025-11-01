import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi2';
import { FileItem } from '../types/filesystem';
import { ReadFileContent } from '../../wailsjs/go/main/App';

// IMPORTANT: Worker must be set in the same module where you use react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface FileRendererProps {
  file: FileItem | null;
}

const FileRenderer: React.FC<FileRendererProps> = ({ file }) => {
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);

  useEffect(() => {
    if (!file || file.isDirectory) {
      setFileContent('');
      setError('');
      return;
    }

    const loadFileContent = async () => {
      setLoading(true);
      setError('');
      try {
        const content = await ReadFileContent(file.path);
        setFileContent(content);
      } catch (err) {
        setError(`Failed to load file: ${err}`);
      } finally {
        setLoading(false);
      }
    };

    loadFileContent();
  }, [file]);

  if (!file) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p>Select a file to preview</p>
      </div>
    );
  }

  if (file.isDirectory) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p>Directory preview not available</p>
      </div>
    );
  }

  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension);
  const isVideo = ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(extension);
  const isAudio = ['mp3', 'wav', 'ogg', 'aac', 'm4a'].includes(extension);
  const isPDF = extension === 'pdf';
  const isText = ['txt', 'md', 'json', 'js', 'ts', 'jsx', 'tsx', 'css', 'html', 'py', 'go', 'java', 'c', 'cpp', 'rs', 'rb', 'php', 'sh', 'yaml', 'yml', 'xml'].includes(extension);

  return (
    <div className="h-full w-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white flex-shrink-0">
        <h3 className="text-sm font-semibold text-gray-800 truncate">{file.name}</h3>
        <p className="text-xs text-gray-500 mt-1">
          {file.size > 0 ? `${(file.size / 1024).toFixed(2)} KB` : ''}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading...</p>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-full">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {!loading && !error && fileContent && (
          <>
            {isImage && (
              <div className="flex items-center justify-center min-h-full p-4">
                <img
                  src={`data:image/${extension};base64,${fileContent}`}
                  alt={file.name}
                  className="max-w-full h-auto object-contain"
                  style={{ maxHeight: 'calc(100vh - 150px)' }}
                />
              </div>
            )}

            {isVideo && (
              <div className="flex items-center justify-center min-h-full p-4">
                <video
                  src={`data:video/${extension};base64,${fileContent}`}
                  controls
                  className="max-w-full"
                  style={{ maxHeight: 'calc(100vh - 150px)' }}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )}

            {isAudio && (
              <div className="flex items-center justify-center min-h-full p-4">
                <audio
                  src={`data:audio/${extension};base64,${fileContent}`}
                  controls
                  className="w-full max-w-2xl"
                >
                  Your browser does not support the audio tag.
                </audio>
              </div>
            )}

            {isPDF && (
              <div className="relative h-full w-full">
                {/* PDF viewer with smooth zoom */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <TransformWrapper
                    initialScale={1.0}
                    minScale={0.3}
                    maxScale={5}
                    wheel={{
                      step: 0.1,
                      disabled: false,
                      wheelDisabled: false,
                      touchPadDisabled: false,
                      activationKeys: [],
                      excluded: []
                    }}
                    panning={{ disabled: false, velocityDisabled: false }}
                    doubleClick={{ disabled: false, step: 0.7 }}
                    smooth={true}
                    centerOnInit={true}
                    limitToBounds={false}
                    disablePadding={false}
                  >
                    <TransformComponent
                      wrapperStyle={{ width: '100%', height: '100%' }}
                      contentStyle={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Document
                        file={`data:application/pdf;base64,${fileContent}`}
                        onLoadSuccess={({ numPages }) => {
                          setNumPages(numPages);
                          setPageNumber(1);
                        }}
                        onLoadError={(error) => {
                          console.error('Error loading PDF:', error);
                          setError('Failed to load PDF');
                        }}
                        loading={
                          <div className="flex items-center justify-center p-8">
                            <p className="text-gray-500">Loading PDF...</p>
                          </div>
                        }
                        error={
                          <div className="flex items-center justify-center p-8">
                            <p className="text-red-500">Failed to load PDF</p>
                          </div>
                        }
                      >
                        <Page
                          pageNumber={pageNumber}
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                          className="shadow-lg"
                        />
                      </Document>
                    </TransformComponent>
                  </TransformWrapper>
                </div>

                {/* Circular navigation buttons - centered horizontally at bottom */}
                {numPages > 1 && (
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-4 z-10">
                    <button
                      onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                      disabled={pageNumber <= 1}
                      className="w-12 h-12 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      title="Previous Page"
                    >
                      <HiChevronLeft className="w-6 h-6 text-gray-700" />
                    </button>
                    <div className="bg-white shadow-lg rounded-full px-4 py-2 text-sm text-gray-700">
                      {pageNumber} / {numPages}
                    </div>
                    <button
                      onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
                      disabled={pageNumber >= numPages}
                      className="w-12 h-12 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      title="Next Page"
                    >
                      <HiChevronRight className="w-6 h-6 text-gray-700" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {isText && (
              <div className="p-4 h-full">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-auto h-full font-mono">
                  {atob(fileContent)}
                </pre>
              </div>
            )}

            {!isImage && !isVideo && !isAudio && !isPDF && !isText && (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-400 text-sm text-center">
                  <p>Preview not available for this file type</p>
                  <p className="text-xs mt-2">.{extension}</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FileRenderer;
