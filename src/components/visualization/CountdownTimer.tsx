import { useState, useEffect } from 'react';
import { Box, Text, HStack, VStack, Badge, useColorModeValue } from '@chakra-ui/react';

interface CountdownTimerProps {
  unlockTime: number;
  isTimeLocked: boolean;
}

const CountdownTimer = ({ unlockTime, isTimeLocked }: CountdownTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  
  const bgColor = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const accentColor = useColorModeValue('purple.600', 'purple.300');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  useEffect(() => {
    // Convert blockchain timestamp (seconds) to JavaScript timestamp (milliseconds)
    const unlockTimeMs = unlockTime * 1000;
    const now = Date.now();
    
    if (unlockTimeMs > now) {
      setTimeRemaining(unlockTimeMs - now);
      setIsExpired(false);
    } else {
      setTimeRemaining(0);
      setIsExpired(true);
    }
  }, [unlockTime]);
  
  // Countdown renderer
  const renderer = ({ days, hours, minutes, seconds, completed }: any) => {
    if (completed) {
      return (
        <Box 
          p={4} 
          borderRadius="lg" 
          bg={bgColor} 
          shadow="sm"
          borderLeft="4px solid" 
          borderColor="green.400"
        >
          <VStack align="start" spacing={2}>
            <HStack>
              <Badge colorScheme="green" fontSize="0.8em" px={2} py={1} borderRadius="full">
                UNLOCKED
              </Badge>
              <Text fontSize="sm" color={mutedColor}>Time lock expired</Text>
            </HStack>
            <Text fontSize="lg" fontWeight="bold" color="green.500">
              Vault is now unlockable
            </Text>
          </VStack>
        </Box>
      );
    }
    
    // Active countdown
    return (
      <Box 
        p={4} 
        borderRadius="lg" 
        bg={bgColor} 
        shadow="sm"
        borderLeft="4px solid" 
        borderColor={accentColor}
      >
        <VStack align="start" spacing={3}>
          <HStack>
            <Badge colorScheme="purple" fontSize="0.8em" px={2} py={1} borderRadius="full">
              LOCKED
            </Badge>
            <Text fontSize="sm" color={mutedColor}>Time remaining until unlock</Text>
          </HStack>
          
          <HStack spacing={4} width="100%" justifyContent="space-between">
            <TimeUnit value={days} label="DAYS" />
            <TimeUnit value={hours} label="HOURS" />
            <TimeUnit value={minutes} label="MINUTES" />
            <TimeUnit value={seconds} label="SECONDS" />
          </HStack>
          
          <Text fontSize="sm" color={mutedColor}>
            Unlocks on {new Date(unlockTime * 1000).toLocaleString()}
          </Text>
        </VStack>
      </Box>
    );
  };
  
  // If not time-locked, don't render the countdown
  if (!isTimeLocked) {
    return null;
  }
  
  // Since react-countdown package is missing, we'll implement a simple countdown display
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  useEffect(() => {
    // Calculate initial countdown values
    const updateCountdown = () => {
      const now = Date.now();
      const unlockTimeMs = unlockTime * 1000;
      const remaining = Math.max(0, unlockTimeMs - now);
      
      if (remaining <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      
      const seconds = Math.floor((remaining / 1000) % 60);
      const minutes = Math.floor((remaining / (1000 * 60)) % 60);
      const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
      const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
      
      setCountdown({ days, hours, minutes, seconds });
    };
    
    // Update immediately
    updateCountdown();
    
    // Set up interval for updates
    const interval = setInterval(updateCountdown, 1000);
    
    // Clean up
    return () => clearInterval(interval);
  }, [unlockTime]);
  
  const completed = timeRemaining <= 0 || (countdown.days === 0 && countdown.hours === 0 && countdown.minutes === 0 && countdown.seconds === 0);
  
  return (
    <Box mb={6}>
      {renderer({
        days: countdown.days,
        hours: countdown.hours,
        minutes: countdown.minutes,
        seconds: countdown.seconds,
        completed
      })}
    </Box>
  );
};

// Helper component for time units
const TimeUnit = ({ value, label }: { value: number, label: string }) => {
  const bgColor = useColorModeValue('gray.100', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const labelColor = useColorModeValue('gray.500', 'gray.400');
  
  return (
    <VStack spacing={1}>
      <Box 
        py={2} 
        px={3} 
        bg={bgColor} 
        borderRadius="md" 
        minW="60px" 
        textAlign="center"
      >
        <Text fontSize="xl" fontWeight="bold" color={textColor}>
          {value.toString().padStart(2, '0')}
        </Text>
      </Box>
      <Text fontSize="xs" fontWeight="medium" color={labelColor}>
        {label}
      </Text>
    </VStack>
  );
};

export default CountdownTimer; 