import {
  VStack,
  Heading,
  Text,
  Button,
  Icon,
  Box,
  useColorModeValue,
  HStack
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { IconType } from 'react-icons';
import { FaPlus, FaArrowRight } from 'react-icons/fa';
import React from 'react';

const MotionBox = motion.create(Box);
const MotionVStack = motion.create(VStack);

interface EmptyStateProps {
  icon: IconType;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    colorScheme?: string;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  illustration?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  illustration
}) => {
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const headingColor = useColorModeValue('gray.800', 'white');

  return (
    <MotionVStack
      spacing={8}
      p={12}
      textAlign="center"
      maxW="md"
      mx="auto"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Illustration or Icon */}
      <MotionBox
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {illustration || (
          <Box
            p={6}
            borderRadius="full"
            bg={bgColor}
            border="2px dashed"
            borderColor={borderColor}
            position="relative"
          >
            <Icon
              as={icon}
              boxSize={12}
              color="gray.400"
            />
            
            {/* Floating dots animation */}
            <Box
              position="absolute"
              top="-2"
              right="-2"
              w="3"
              h="3"
              bg="purple.400"
              borderRadius="full"
              animation="float 2s ease-in-out infinite"
            />
            <Box
              position="absolute"
              bottom="-1"
              left="-1"
              w="2"
              h="2"
              bg="blue.400"
              borderRadius="full"
              animation="float 3s ease-in-out infinite reverse"
            />
          </Box>
        )}
      </MotionBox>

      {/* Content */}
      <MotionVStack
        spacing={4}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <Heading size="lg" color={headingColor} fontWeight="bold">
          {title}
        </Heading>
        
        <Text
          fontSize="md"
          color={textColor}
          lineHeight="tall"
          maxW="sm"
        >
          {description}
        </Text>
      </MotionVStack>

      {/* Actions */}
      {(primaryAction || secondaryAction) && (
        <MotionVStack
          spacing={4}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          {primaryAction && (
            <Button
              colorScheme={primaryAction.colorScheme || 'purple'}
              size="lg"
              leftIcon={<FaPlus />}
              onClick={primaryAction.onClick}
              borderRadius="full"
              px={8}
              py={6}
              fontSize="md"
              fontWeight="bold"
              _hover={{ 
                transform: 'translateY(-2px)', 
                boxShadow: 'lg' 
              }}
              transition="all 0.2s"
            >
              {primaryAction.label}
            </Button>
          )}
          
          {secondaryAction && (
            <Button
              variant="ghost"
              size="md"
              rightIcon={<FaArrowRight />}
              onClick={secondaryAction.onClick}
              color={textColor}
              _hover={{ 
                color: headingColor,
                bg: bgColor 
              }}
            >
              {secondaryAction.label}
            </Button>
          )}
        </MotionVStack>
      )}

      {/* Add floating animation keyframes */}
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
        `}
      </style>
    </MotionVStack>
  );
}; 