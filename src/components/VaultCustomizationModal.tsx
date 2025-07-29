import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  VStack,
  HStack,
  Box,
  Text,
  Grid,
  GridItem,
  Badge,
  useToast,
  Wrap,
  WrapItem,
  Tag,
  TagLabel,
  TagCloseButton,
  Divider,
  SimpleGrid,
  Icon,
  Tooltip,
} from '@chakra-ui/react';
import { FaHeart, FaHome, FaCar, FaGraduationCap, FaPlane, FaGamepad, FaMedkit, FaRing, FaBaby, FaGift } from 'react-icons/fa';
import { useVaultCustomization, VaultCustomization } from '../hooks/useVaultCustomization';

interface VaultCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  vaultAddress: string;
  onSave?: (customization: VaultCustomization) => void;
}

const PREDEFINED_CATEGORIES = [
  'Emergency Fund',
  'Vacation',
  'Education',
  'House Down Payment',
  'Car Fund',
  'Wedding',
  'Retirement',
  'Investment',
  'Children',
  'Health',
  'Other'
];

const CATEGORY_COLORS = {
  'Emergency Fund': '#e53e3e',
  'Vacation': '#38b2ac',
  'Education': '#3182ce',
  'House Down Payment': '#38a169',
  'Car Fund': '#d69e2e',
  'Wedding': '#ed64a6',
  'Retirement': '#805ad5',
  'Investment': '#dd6b20',
  'Children': '#38b2ac',
  'Health': '#e53e3e',
  'Other': '#718096'
};

const CATEGORY_ICONS = {
  'Emergency Fund': FaMedkit,
  'Vacation': FaPlane,
  'Education': FaGraduationCap,
  'House Down Payment': FaHome,
  'Car Fund': FaCar,
  'Wedding': FaRing,
  'Retirement': FaGift,
  'Investment': FaGamepad,
  'Children': FaBaby,
  'Health': FaMedkit,
  'Other': FaHeart
};

const EMOJIS = ['💰', '🏠', '🚗', '✈️', '💍', '🎓', '👶', '🏥', '🎮', '💝', '🌟', '🔥', '⚡', '🎯', '🚀'];

const PRESET_COLORS = [
  '#7f5af0', '#2cb67d', '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b',
  '#6c5ce7', '#a29bfe', '#fd79a8', '#fdcb6e', '#00b894', '#00cec9', '#e17055', '#74b9ff'
];

export const VaultCustomizationModal: React.FC<VaultCustomizationModalProps> = ({
  isOpen,
  onClose,
  vaultAddress,
  onSave
}) => {
  const { getVaultCustomization, updateVaultCustomization } = useVaultCustomization();
  const toast = useToast();

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [customUnlockMessage, setCustomUnlockMessage] = useState('');
  const [color, setColor] = useState('#7f5af0');
  const [emoji, setEmoji] = useState('💰');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  // Load existing customization when modal opens
  useEffect(() => {
    if (isOpen && vaultAddress) {
      const existing = getVaultCustomization(vaultAddress);
      if (existing) {
        setName(existing.name || '');
        setDescription(existing.description || '');
        setCategory(existing.category || '');
        setCustomUnlockMessage(existing.customUnlockMessage || '');
        setColor(existing.color || '#7f5af0');
        setEmoji(existing.emoji || '💰');
        setTags(existing.tags || []);
      } else {
        // Reset form for new customization
        setName('');
        setDescription('');
        setCategory('');
        setCustomCategory('');
        setCustomUnlockMessage('');
        setColor('#7f5af0');
        setEmoji('💰');
        setTags([]);
      }
    }
  }, [isOpen, vaultAddress, getVaultCustomization]);

  const handleSave = () => {
    const finalCategory = category === 'custom' ? customCategory : category;
    
    if (!name.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter a name for your vault',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    const customization = {
      name: name.trim(),
      description: description.trim(),
      category: finalCategory,
      customUnlockMessage: customUnlockMessage.trim(),
      color,
      emoji,
      tags: tags.filter(tag => tag.trim()),
    };

    updateVaultCustomization(vaultAddress, customization);
    
    toast({
      title: 'Vault Customized',
      description: 'Your vault customization has been saved',
      status: 'success',
      duration: 3000,
    });

    if (onSave) {
      onSave({
        address: vaultAddress,
        createdAt: Date.now(),
        lastModified: Date.now(),
        ...customization
      });
    }

    onClose();
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 5) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent bg="rgba(35, 37, 38, 0.95)" color="white" borderColor="#414345" borderWidth="1px">
        <ModalHeader>
          <HStack>
            <Text fontSize="2xl">{emoji}</Text>
            <Text>Customize Your Vault</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Basic Info */}
            <Box>
              <Text fontSize="lg" fontWeight="bold" mb={4}>Basic Information</Text>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Vault Name</FormLabel>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Dream House Fund"
                    bg="rgba(0,0,0,0.3)"
                    borderColor="#414345"
                    _focus={{ borderColor: color }}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your savings goal..."
                    bg="rgba(0,0,0,0.3)"
                    borderColor="#414345"
                    _focus={{ borderColor: color }}
                    rows={3}
                  />
                </FormControl>
              </VStack>
            </Box>

            <Divider />

            {/* Category */}
            <Box>
              <Text fontSize="lg" fontWeight="bold" mb={4}>Category</Text>
              <VStack spacing={3}>
                <FormControl>
                  <Select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    bg="rgba(0,0,0,0.3)"
                    borderColor="#414345"
                  >
                    <option value="">Select a category</option>
                    {PREDEFINED_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="custom">Custom Category</option>
                  </Select>
                </FormControl>

                {category === 'custom' && (
                  <FormControl>
                    <Input
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Enter custom category"
                      bg="rgba(0,0,0,0.3)"
                      borderColor="#414345"
                      _focus={{ borderColor: color }}
                    />
                  </FormControl>
                )}

                {/* Category Preview */}
                {(category && category !== 'custom') || (category === 'custom' && customCategory) && (
                  <Box>
                    <Badge
                      colorScheme="purple"
                      bg={CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || color}
                      px={3}
                      py={1}
                      borderRadius="full"
                    >
                      <HStack spacing={2}>
                        <Icon 
                          as={CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] || FaHeart} 
                          boxSize={3} 
                        />
                        <Text>{category === 'custom' ? customCategory : category}</Text>
                      </HStack>
                    </Badge>
                  </Box>
                )}
              </VStack>
            </Box>

            <Divider />

            {/* Visual Customization */}
            <Box>
              <Text fontSize="lg" fontWeight="bold" mb={4}>Visual Style</Text>
              <VStack spacing={4}>
                {/* Emoji Selection */}
                <FormControl>
                  <FormLabel>Emoji</FormLabel>
                  <SimpleGrid columns={8} spacing={2}>
                    {EMOJIS.map(emojiOption => (
                      <Box
                        key={emojiOption}
                        p={2}
                        textAlign="center"
                        cursor="pointer"
                        borderRadius="md"
                        bg={emoji === emojiOption ? color : 'transparent'}
                        border={emoji === emojiOption ? '2px solid' : '1px solid'}
                        borderColor={emoji === emojiOption ? 'white' : '#414345'}
                        _hover={{ bg: 'rgba(255,255,255,0.1)' }}
                        onClick={() => setEmoji(emojiOption)}
                      >
                        <Text fontSize="xl">{emojiOption}</Text>
                      </Box>
                    ))}
                  </SimpleGrid>
                </FormControl>

                {/* Color Selection */}
                <FormControl>
                  <FormLabel>Accent Color</FormLabel>
                  <SimpleGrid columns={8} spacing={2}>
                    {PRESET_COLORS.map(colorOption => (
                      <Box
                        key={colorOption}
                        w={8}
                        h={8}
                        bg={colorOption}
                        borderRadius="md"
                        cursor="pointer"
                        border={color === colorOption ? '3px solid white' : '1px solid #414345'}
                        _hover={{ transform: 'scale(1.1)' }}
                        onClick={() => setColor(colorOption)}
                      />
                    ))}
                  </SimpleGrid>
                </FormControl>
              </VStack>
            </Box>

            <Divider />

            {/* Tags */}
            <Box>
              <Text fontSize="lg" fontWeight="bold" mb={4}>Tags</Text>
              <VStack spacing={3}>
                <HStack w="100%">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Add a tag..."
                    bg="rgba(0,0,0,0.3)"
                    borderColor="#414345"
                    _focus={{ borderColor: color }}
                    flex="1"
                  />
                  <Button
                    onClick={handleAddTag}
                    isDisabled={!newTag.trim() || tags.includes(newTag.trim()) || tags.length >= 5}
                    colorScheme="purple"
                    size="sm"
                  >
                    Add
                  </Button>
                </HStack>

                {tags.length > 0 && (
                  <Wrap>
                    {tags.map(tag => (
                      <WrapItem key={tag}>
                        <Tag
                          size="md"
                          borderRadius="full"
                          variant="solid"
                          bg={color}
                          color="white"
                        >
                          <TagLabel>{tag}</TagLabel>
                          <TagCloseButton onClick={() => handleRemoveTag(tag)} />
                        </Tag>
                      </WrapItem>
                    ))}
                  </Wrap>
                )}

                <Text fontSize="sm" color="gray.400">
                  {tags.length}/5 tags used
                </Text>
              </VStack>
            </Box>

            <Divider />

            {/* Custom Unlock Message */}
            <Box>
              <Text fontSize="lg" fontWeight="bold" mb={4}>Custom Unlock Message</Text>
              <FormControl>
                <FormLabel fontSize="sm" color="gray.400">
                  Message shown when vault unlocks (optional)
                </FormLabel>
                <Textarea
                  value={customUnlockMessage}
                  onChange={(e) => setCustomUnlockMessage(e.target.value)}
                  placeholder="e.g., Congratulations! Your dream house fund is ready! 🏠"
                  bg="rgba(0,0,0,0.3)"
                  borderColor="#414345"
                  _focus={{ borderColor: color }}
                  rows={2}
                />
              </FormControl>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            bg={color}
            color="white"
            _hover={{ opacity: 0.8 }}
            onClick={handleSave}
          >
            Save Customization
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default VaultCustomizationModal; 