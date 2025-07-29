import { 
  Card, 
  CardBody, 
  CardHeader, 
  Skeleton, 
  SkeletonText, 
  VStack, 
  HStack, 
  Box,
  useColorModeValue 
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import React from 'react';

const MotionCard = motion.create(Card);

interface SkeletonCardProps {
  variant?: 'vault' | 'wallet';
  index?: number;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ 
  variant = 'vault', 
  index = 0 
}) => {
  const cardBg = useColorModeValue('white', '#232526');
  const borderColor = useColorModeValue('gray.200', '#414345');

  return (
    <MotionCard
      bg={cardBg}
      borderColor={borderColor}
      borderRadius="xl"
      overflow="hidden"
      boxShadow="lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      {/* Shimmer effect bar */}
      <Box
        height="4px"
        bg="linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)"
        animation="shimmer 2s infinite"
        sx={{
          '@keyframes shimmer': {
            '0%': { transform: 'translateX(-100%)' },
            '100%': { transform: 'translateX(100%)' }
          }
        }}
      />
      
      <CardHeader bgGradient="linear(to-r, gray.500, gray.600)" color="white" pb={3}>
        <HStack justifyContent="space-between" alignItems="center">
          <HStack spacing={2}>
            <Skeleton borderRadius="full" width="32px" height="32px" />
            <VStack align="start" spacing={1}>
              <Skeleton height="16px" width="60px" />
              <Skeleton height="12px" width="40px" />
            </VStack>
          </HStack>
          <Skeleton borderRadius="full" width="20px" height="20px" />
        </HStack>
      </CardHeader>

      <CardBody p={6}>
        <VStack spacing={4} align="stretch">
          {/* Balance Section */}
          <Box>
            <Skeleton height="12px" width="50px" mb={2} />
            <Skeleton height="24px" width="100px" />
          </Box>

          {variant === 'vault' ? (
            <>
              {/* Vault-specific content */}
              <Box>
                <Skeleton height="12px" width="80px" mb={2} />
                <HStack justify="space-between">
                  <Skeleton height="16px" width="60px" />
                  <Skeleton height="16px" width="40px" />
                </HStack>
                <Skeleton height="8px" width="100%" mt={2} borderRadius="full" />
              </Box>

              <Box>
                <Skeleton height="12px" width="70px" mb={2} />
                <Skeleton height="16px" width="90px" />
              </Box>

              <HStack justify="space-between" pt={2}>
                <Skeleton height="24px" width="60px" borderRadius="full" />
                <Skeleton borderRadius="full" width="24px" height="24px" />
              </HStack>
            </>
          ) : (
            <>
              {/* Wallet-specific content */}
              <Box>
                <Skeleton height="12px" width="50px" mb={1} />
                <Skeleton height="14px" width="120px" />
              </Box>

              <Box>
                <Skeleton height="12px" width="80px" mb={2} />
                <VStack spacing={1} align="stretch">
                  <Skeleton height="12px" width="100%" />
                  <Skeleton height="12px" width="80%" />
                </VStack>
              </Box>

              <HStack justify="space-between" pt={2}>
                <Skeleton height="32px" width="80px" borderRadius="md" />
                <Skeleton height="32px" width="80px" borderRadius="md" />
              </HStack>
            </>
          )}
        </VStack>
      </CardBody>
    </MotionCard>
  );
}; 