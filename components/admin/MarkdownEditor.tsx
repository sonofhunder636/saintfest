'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Bold, Italic, Underline, Strikethrough, 
  Heading1, Heading2, Heading3, 
  List, ListOrdered, Quote, Code, 
  Link, Image, Eye, EyeOff, 
  Upload, Maximize, Minimize
} from 'lucide-react';
import {
  Box,
  Flex,
  Grid,
  GridItem,
  HStack,
  VStack,
  Button,
  IconButton,
  Text,
  Textarea,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Badge,
  Divider,
  Tooltip,
  useColorModeValue,
  useToast
} from '@chakra-ui/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  const [isUploading, setIsUploading] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  
  // Theme colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const toolbarBg = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');

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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file (JPG, PNG, GIF, etc.)',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 5MB',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsUploading(true);
    try {
      const imageUrl = await onImageUpload(file);
      insertText(`![${file.name}](${imageUrl})`);
      toast({
        title: 'Image uploaded',
        description: 'Image has been successfully uploaded and inserted',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Image upload failed:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload image. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [insertText, onImageUpload, toast]);

  const toolbarButtons = [
    { icon: Bold, action: () => insertText('**', '**'), title: 'Bold (Ctrl+B)', hotkey: 'Ctrl+B' },
    { icon: Italic, action: () => insertText('*', '*'), title: 'Italic (Ctrl+I)', hotkey: 'Ctrl+I' },
    { icon: Strikethrough, action: () => insertText('~~', '~~'), title: 'Strikethrough', hotkey: null },
    { icon: Heading1, action: () => insertText('# '), title: 'Heading 1', hotkey: null },
    { icon: Heading2, action: () => insertText('## '), title: 'Heading 2', hotkey: null },
    { icon: Heading3, action: () => insertText('### '), title: 'Heading 3', hotkey: null },
    { icon: List, action: () => insertText('- '), title: 'Bullet List', hotkey: null },
    { icon: ListOrdered, action: () => insertText('1. '), title: 'Numbered List', hotkey: null },
    { icon: Quote, action: () => insertText('> '), title: 'Quote', hotkey: null },
    { icon: Code, action: () => insertText('`', '`'), title: 'Inline Code', hotkey: null },
    { icon: Link, action: () => insertText('[', '](url)'), title: 'Link', hotkey: null },
  ];

  // Calculate statistics
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const charCount = content.length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <Card
      bg={bgColor}
      borderColor={borderColor}
      shadow="lg"
      borderRadius="xl"
      borderWidth="1px"
      position={isFullscreen ? 'fixed' : 'relative'}
      top={isFullscreen ? 0 : 'auto'}
      left={isFullscreen ? 0 : 'auto'}
      right={isFullscreen ? 0 : 'auto'}
      bottom={isFullscreen ? 0 : 'auto'}
      zIndex={isFullscreen ? 1000 : 'auto'}
      h={isFullscreen ? '100vh' : { base: '70vh', lg: '80vh' }}
    >
      {/* Toolbar Header */}
      <CardHeader bg={toolbarBg} borderTopRadius="xl" py={3}>
        <Flex justify="space-between" align="center">
          <HStack spacing={1} wrap="wrap">
            {toolbarButtons.map(({ icon: Icon, action, title }) => (
              <Tooltip key={title} label={title} hasArrow>
                <IconButton
                  aria-label={title}
                  icon={<Icon size={16} />}
                  size="sm"
                  variant="ghost"
                  onClick={action}
                  _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
                />
              </Tooltip>
            ))}
            
            <Divider orientation="vertical" h="24px" mx={2} />
            
            <Tooltip label="Upload Image" hasArrow>
              <IconButton
                aria-label="Upload Image"
                icon={<Image size={16} />}
                size="sm"
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
                isLoading={isUploading}
                isDisabled={!onImageUpload}
                _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
              />
            </Tooltip>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          </HStack>
          
          <HStack spacing={2}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
              onClick={() => setShowPreview(!showPreview)}
            >
              <Text display={{ base: 'none', md: 'block' }}>
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </Text>
            </Button>
            
            {onToggleFullscreen && (
              <Tooltip label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'} hasArrow>
                <IconButton
                  aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                  icon={isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                  size="sm"
                  variant="outline"
                  onClick={onToggleFullscreen}
                />
              </Tooltip>
            )}
          </HStack>
        </Flex>
      </CardHeader>

      {/* Editor Area */}
      <CardBody p={0} flex={1} overflow="hidden">
        <Box h="full">
          {showPreview ? (
            <Grid templateColumns="1fr 1fr" h="full">
              <GridItem>
                <Box h="full" p={4}>
                  <Textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => onContentChange(e.target.value)}
                    placeholder="Start writing your post in Markdown..."
                    resize="none"
                    border="none"
                    outline="none"
                    h="full"
                    fontFamily="mono"
                    fontSize="sm"
                    color={textColor}
                    _focus={{ boxShadow: 'none' }}
                    _placeholder={{ color: mutedTextColor }}
                  />
                </Box>
              </GridItem>
              
              <GridItem borderLeft="1px" borderColor={borderColor}>
                <Box h="full" overflow="auto" p={4} className="prose prose-sm max-w-none" color={textColor}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {content || '*Start typing to see the preview...*'}
                  </ReactMarkdown>
                </Box>
              </GridItem>
            </Grid>
          ) : (
            <Box h="full" p={4}>
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => onContentChange(e.target.value)}
                placeholder="Start writing your post in Markdown..."
                resize="none"
                border="none"
                outline="none"
                h="full"
                fontFamily="mono"
                fontSize="sm"
                color={textColor}
                _focus={{ boxShadow: 'none' }}
                _placeholder={{ color: mutedTextColor }}
              />
            </Box>
          )}
        </Box>
      </CardBody>

      {/* Footer with Statistics */}
      <CardFooter bg={toolbarBg} borderBottomRadius="xl" py={3}>
        <Flex justify="space-between" align="center" w="full">
          <HStack spacing={4}>
            <Badge colorScheme="blue" variant="subtle">
              {charCount.toLocaleString()} characters
            </Badge>
            <Badge colorScheme="green" variant="subtle">
              {wordCount.toLocaleString()} words
            </Badge>
            <Badge colorScheme="purple" variant="subtle">
              {readingTime} min read
            </Badge>
          </HStack>
          
          {isUploading && (
            <Badge colorScheme="orange" variant="solid">
              Uploading image...
            </Badge>
          )}
        </Flex>
      </CardFooter>
    </Card>
  );
}