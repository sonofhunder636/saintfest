'use client';

import { useState } from 'react';
import {
  Box,
  Input,
  Button,
  VStack,
  useToast,
  ChakraProvider
} from '@chakra-ui/react';
import { saintfestTheme } from '@/lib/chakra-theme';

interface CommentInputProps {
  onSubmit?: (text: string) => void;
  placeholder?: string;
}

function CommentInputComponent({
  onSubmit,
  placeholder = "Share your thoughts..."
}: CommentInputProps) {
  const [inputValue, setInputValue] = useState('');
  const toast = useToast();

  const handleSubmit = () => {
    if (!inputValue.trim()) {
      toast({
        title: 'Please enter some text',
        status: 'warning',
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    if (onSubmit) {
      onSubmit(inputValue.trim());
    } else {
      // Default behavior - just show success message
      toast({
        title: 'Comment submitted',
        description: 'Thank you for your input!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }

    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Box
      p={6}
      bg="white"
      borderRadius="lg"
      boxShadow="sm"
      border="1px solid"
      borderColor="gray.200"
      mb={6}
      maxW="600px"
      mx="auto"
    >
      <VStack spacing={4} align="stretch">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          size="lg"
          focusBorderColor="saintfest.500"
          _placeholder={{
            color: 'gray.400',
            fontStyle: 'italic'
          }}
        />
        <Button
          onClick={handleSubmit}
          colorScheme="saintfest"
          size="md"
          alignSelf="flex-end"
          isDisabled={!inputValue.trim()}
          _disabled={{
            opacity: 0.4,
            cursor: 'not-allowed'
          }}
        >
          Submit
        </Button>
      </VStack>
    </Box>
  );
}

export default function CommentInput(props: CommentInputProps) {
  return (
    <ChakraProvider theme={saintfestTheme}>
      <CommentInputComponent {...props} />
    </ChakraProvider>
  );
}