import React from 'react';
import {
  Box,
  IconButton,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverCloseButton,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Divider,
  Icon,
  Tooltip,
  useColorModeValue,
  Center,
  Spinner,
  Portal,
} from '@chakra-ui/react';
import { 
  FaBell, 
  FaBellSlash, 
  FaCheck, 
  FaTrash, 
  FaTimes,
  FaExternalLinkAlt,
  FaTrophy,
  FaUnlock,
  FaBullseye,
  FaExclamationTriangle,
  FaCheckCircle
} from 'react-icons/fa';
import { useNotifications } from '../hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const MotionBox = motion.create(Box);

export const NotificationBell: React.FC = () => {
  const { 
    notifications, 
    unreadCount, 
    permission, 
    requestPermission, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    clearAll 
  } = useNotifications();
  
  const navigate = useNavigate();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'goal_achieved': return FaTrophy;
      case 'vault_unlocked': return FaUnlock;
      case 'milestone': return FaBullseye;
      case 'warning': return FaExclamationTriangle;
      case 'success': return FaCheckCircle;
      default: return FaBell;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'goal_achieved': return 'yellow.400';
      case 'vault_unlocked': return 'green.400';
      case 'milestone': return 'blue.400';
      case 'warning': return 'orange.400';
      case 'success': return 'green.400';
      default: return 'gray.400';
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  return (
    <Box position="relative">
      <Popover placement="bottom" strategy="fixed" closeOnBlur={true} closeOnEsc={true}>
        <PopoverTrigger>
          <Box position="relative">
            <Tooltip label={`${unreadCount} unread notifications`} hasArrow>
              <IconButton
                aria-label="Notifications"
                icon={<FaBell />}
                variant="ghost"
                color="white"
                fontSize="lg"
                _hover={{ bg: 'whiteAlpha.200' }}
                position="relative"
              />
            </Tooltip>
            {unreadCount > 0 && (
              <MotionBox
                position="absolute"
                top="-2px"
                right="-2px"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                <Badge
                  colorScheme="red"
                  borderRadius="full"
                  minW="20px"
                  h="20px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="xs"
                  fontWeight="bold"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              </MotionBox>
            )}
          </Box>
        </PopoverTrigger>
        
        <PopoverContent 
          bg="rgba(25, 27, 28, 0.98)" 
          borderColor="#7f5af0" 
          w="350px"
          maxH="500px"
          color="white"
          shadow="2xl"
          zIndex={9999}
          border="2px solid"
          borderRadius="xl"
          backdropFilter="blur(10px)"
          _focus={{ outline: 'none' }}
        >
          <PopoverHeader borderBottomColor="#7f5af0">
            <HStack justify="space-between">
              <Text fontWeight="bold">Notifications</Text>
              <HStack spacing={2}>
                {permission !== 'granted' && (
                  <Tooltip label="Enable browser notifications">
                    <IconButton
                      aria-label="Enable notifications"
                      icon={<FaBellSlash />}
                      size="sm"
                      variant="ghost"
                      colorScheme="yellow"
                      onClick={requestPermission}
                    />
                  </Tooltip>
                )}
                {notifications.length > 0 && (
                  <>
                    <Tooltip label="Mark all as read">
                      <IconButton
                        aria-label="Mark all as read"
                        icon={<FaCheck />}
                        size="sm"
                        variant="ghost"
                        onClick={markAllAsRead}
                      />
                    </Tooltip>
                    <Tooltip label="Clear all">
                      <IconButton
                        aria-label="Clear all"
                        icon={<FaTrash />}
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={clearAll}
                      />
                    </Tooltip>
                  </>
                )}
              </HStack>
            </HStack>
          </PopoverHeader>
          
          <PopoverBody p={0} maxH="400px" overflowY="auto">
            {notifications.length === 0 ? (
              <Center py={8}>
                <VStack spacing={3}>
                  <Icon as={FaBell} fontSize="3xl" color="gray.500" />
                  <Text color="gray.500" fontSize="sm">No notifications yet</Text>
                  <Text color="gray.600" fontSize="xs" textAlign="center">
                    You'll receive notifications when your vaults unlock or reach goals
                  </Text>
                </VStack>
              </Center>
            ) : (
              <VStack spacing={0} align="stretch">
                {notifications.slice(0, 10).map((notification, index) => (
                  <MotionBox
                    key={notification.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Box
                      p={4}
                      bg={notification.read ? 'transparent' : 'rgba(127, 90, 240, 0.1)'}
                      borderLeft={notification.read ? 'none' : '3px solid #7f5af0'}
                      cursor="pointer"
                      _hover={{ bg: 'rgba(255, 255, 255, 0.05)' }}
                      onClick={() => handleNotificationClick(notification)}
                      position="relative"
                    >
                      <HStack spacing={3} align="flex-start">
                        <Icon 
                          as={getTypeIcon(notification.type)} 
                          color={getTypeColor(notification.type)}
                          fontSize="lg"
                          mt={1}
                        />
                        <VStack align="flex-start" spacing={1} flex="1" minW={0}>
                          <Text fontSize="sm" fontWeight="bold" noOfLines={1}>
                            {notification.title}
                          </Text>
                          <Text fontSize="xs" color="gray.400" noOfLines={2}>
                            {notification.message}
                          </Text>
                          <HStack spacing={2}>
                            <Text fontSize="xs" color="gray.500">
                              {formatTime(notification.timestamp)}
                            </Text>
                            {notification.vaultAddress && (
                              <Badge size="sm" colorScheme="purple" fontSize="xs">
                                Vault
                              </Badge>
                            )}
                          </HStack>
                        </VStack>
                        <VStack spacing={1}>
                          {notification.actionUrl && (
                            <Tooltip label="Open">
                              <IconButton
                                aria-label="Open notification"
                                icon={<FaExternalLinkAlt />}
                                size="xs"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNotificationClick(notification);
                                }}
                              />
                            </Tooltip>
                          )}
                          <Tooltip label="Delete">
                            <IconButton
                              aria-label="Delete notification"
                              icon={<FaTimes />}
                              size="xs"
                              variant="ghost"
                              colorScheme="red"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                            />
                          </Tooltip>
                        </VStack>
                      </HStack>
                    </Box>
                    {index < notifications.length - 1 && <Divider borderColor="#414345" />}
                  </MotionBox>
                ))}
                
                {notifications.length > 10 && (
                  <Box p={3} textAlign="center">
                    <Text fontSize="xs" color="gray.500">
                      + {notifications.length - 10} more notifications
                    </Text>
                  </Box>
                )}
              </VStack>
            )}
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </Box>
  );
};

export default NotificationBell; 