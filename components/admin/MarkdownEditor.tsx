'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { 
  Bold, Italic, Underline, Strikethrough, 
  Heading1, Heading2, Heading3, 
  List, ListOrdered, Quote, Code, 
  Link, Image, Eye, EyeOff, 
  Upload
} from 'lucide-react';
import { Button } from '@chakra-ui/button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Dynamic imports to avoid SSR issues
const SplitPane = dynamic(() => import('react-split-pane-v2'), { ssr: false });

interface MarkdownEditorProps {
  initialContent?: string;
  content: string;
  onContentChange: (content: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export default function MarkdownEditor({
  initialContent = '',
  content,
  onContentChange,
  onImageUpload,
  isFullscreen = false,
  onToggleFullscreen,
}: MarkdownEditorProps) {
  const [showPreview, setShowPreview] = useState(true);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize content from props
  useEffect(() => {
    if (initialContent && !content) {
      onContentChange(initialContent);
    }
  }, [initialContent, content, onContentChange]);

  const insertText = useCallback((before: string, after: string = '') => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);
    onContentChange(newText);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  }, [content, onContentChange]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImageUpload) return;

    try {
      const imageUrl = await onImageUpload(file);
      insertText(`![${file.name}](${imageUrl})`);
    } catch (error) {
      console.error('Image upload failed:', error);
    }
  }, [insertText, onImageUpload]);

  const toolbarButtons = [
    { icon: Bold, action: () => insertText('**', '**'), title: 'Bold' },
    { icon: Italic, action: () => insertText('*', '*'), title: 'Italic' },
    { icon: Strikethrough, action: () => insertText('~~', '~~'), title: 'Strikethrough' },
    { icon: Heading1, action: () => insertText('# '), title: 'Heading 1' },
    { icon: Heading2, action: () => insertText('## '), title: 'Heading 2' },
    { icon: Heading3, action: () => insertText('### '), title: 'Heading 3' },
    { icon: List, action: () => insertText('- '), title: 'Bullet List' },
    { icon: ListOrdered, action: () => insertText('1. '), title: 'Numbered List' },
    { icon: Quote, action: () => insertText('> '), title: 'Quote' },
    { icon: Code, action: () => insertText('`', '`'), title: 'Inline Code' },
    { icon: Link, action: () => insertText('[', '](url)'), title: 'Link' },
  ];

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Toolbar */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 flex-wrap">
            {toolbarButtons.map(({ icon: Icon, action, title }) => (
              <Button
                key={title}
                variant="ghost"
                size="sm"
                onClick={action}
                title={title}
                className="h-8 w-8 p-0"
              >
                <Icon className="h-4 w-4" />
              </Button>
            ))}
            <div className="w-px h-6 bg-gray-300 mx-2" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              title="Upload Image"
              className="h-8 w-8 p-0"
              disabled={!onImageUpload}
            >
              <Image className="h-4 w-4" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="ml-1 hidden sm:inline">
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </span>
            </Button>
            {onToggleFullscreen && (
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleFullscreen}
              >
                {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className={`${isFullscreen ? 'h-[calc(100vh-80px)]' : 'min-h-[200vh]'}`}>
        {showPreview ? (
          <SplitPane split="vertical" defaultSize="75%">
            <div className="h-full p-2">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => onContentChange(e.target.value)}
                className="w-full h-full resize-none border-none outline-none font-mono text-base"
                placeholder="Start writing your post in Markdown..."
                style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
                }}
              />
            </div>
            <div className="h-full overflow-auto border-l border-gray-200">
              <div className="p-4 prose prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content || '*Start typing to see the preview...*'}
                </ReactMarkdown>
              </div>
            </div>
          </SplitPane>
        ) : (
          <div className="h-full p-2">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              className="w-full h-full resize-none border-none outline-none font-mono text-base"
              placeholder="Start writing your post in Markdown..."
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
              }}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {content.length} characters, {content.split(/\s+/).filter(Boolean).length} words
          </div>
        </div>
      </div>
    </div>
  );
}