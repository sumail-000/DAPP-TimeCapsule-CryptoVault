import { 
  Box, 
  Text, 
  Flex, 
  Heading, 
  Button, 
  Stack, 
  SimpleGrid, 
  Icon, 
  List, 
  ListItem, 
  ListIcon, 
  Container, 
  Divider, 
  Link, 
  Image, 
  Avatar, 
  useColorModeValue, 
  IconButton, 
  useDisclosure, 
  Collapse 
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'framer-motion';
import { MdCrisisAlert, MdOutlineLockClock, MdOutlineSelfImprovement } from 'react-icons/md';
import { BsCheckCircleFill, BsArrowRight, BsArrowUp } from 'react-icons/bs';
import { GoDotFill } from 'react-icons/go';
import { IoTimeSharp } from "react-icons/io5";
import { FaChartLine, FaQuoteLeft } from "react-icons/fa";
import { Gi3dHammer, GiChemicalTank, GiWallet, GiRocket } from "react-icons/gi";
import { RiTestTubeFill } from "react-icons/ri";
import { useState, useEffect } from 'react';

const MotionBox = motion.create(Box);
const MotionFlex = motion.create(Flex);

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Crypto Investor",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    content: "TimeCapsule Vaults has completely changed how I manage my long-term crypto investments. The peace of mind is priceless."
  },
  {
    name: "Michael Rodriguez",
    role: "DeFi Developer",
    image: "https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    content: "As a developer, I appreciate the robust security and smart contract architecture. It's exactly what the crypto space needs."
  },
  {
    name: "Emma Thompson",
    role: "Financial Advisor",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    content: "I recommend TimeCapsule Vaults to all my clients. It's the perfect solution for long-term crypto wealth preservation."
  }
];

const Home = () => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const { isOpen, onToggle } = useDisclosure();
  const [isVisible, setIsVisible] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Scroll to top handler
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Show/hide scroll to top button
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  return (
    <Box>
      {/* Progress Bar */}
      <MotionBox
        position="fixed"
        top={0}
        left={0}
        right={0}
        height="4px"
        bg="purple.500"
        style={{ scaleX, transformOrigin: '0%' }}
        zIndex={1000}
      />

      {/* Hero Section */}
      <Box position="relative" overflow="hidden">
        <Box
          position="absolute"
          top="-10%"
          left="-10%"
          w="120%"
          h="120%"
          bgGradient="radial(circle, purple.100 0%, transparent 70%)"
          opacity="0.5"
          zIndex="0"
        />
        <Container maxW="container.xl" position="relative" zIndex="1">
          <Stack spacing={8} py={20} align="center" textAlign="center">
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Heading
                as="h1"
                size="3xl"
                bgGradient="linear(to-r, purple.400, blue.500)"
                bgClip="text"
                mb={4}
              >
                Secure Your Crypto Future
              </Heading>
              <Text fontSize="xl" color="gray.600" maxW="2xl">
                TimeCapsule Vaults helps you lock your crypto assets with confidence, preventing panic selling and ensuring long-term wealth preservation.
              </Text>
            </MotionBox>

            <MotionFlex
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              gap={4}
              direction={{ base: "column", sm: "row" }}
            >
              <Button
                size="lg"
                colorScheme="purple"
                rightIcon={<BsArrowRight />}
                _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                transition="all 0.2s"
                onClick={() => window.location.href = '/create-vault'}
              >
                Create Your Vault
              </Button>
              <Button
                size="lg"
                variant="outline"
                colorScheme="purple"
                _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                transition="all 0.2s"
                onClick={onToggle}
              >
                Learn More
              </Button>
            </MotionFlex>

            <Collapse in={isOpen} animateOpacity>
              <MotionBox
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                mt={4}
                p={6}
                bg={cardBg}
                borderRadius="lg"
                boxShadow="lg"
                maxW="2xl"
              >
                <Text color="gray.600">
                  TimeCapsule Vaults is a revolutionary platform that helps you protect your crypto investments from emotional trading decisions. 
                  Our smart contracts ensure your assets remain locked until your specified conditions are met, whether that's a time period, 
                  price target, or both. Start securing your crypto future today!
                </Text>
              </MotionBox>
            </Collapse>

            <MotionBox
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              mt={8}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Image
                src="/vault-preview.png"
                alt="Vault Preview"
                borderRadius="xl"
                boxShadow="2xl"
                maxW="800px"
                w="full"
              />
            </MotionBox>
          </Stack>
        </Container>
      </Box>

      <Box py={16} px={8} textAlign="center" bg="gray.50">
        <Heading as="h2" size="xl" mb={12}>
          The Problem
        </Heading>
        <Text fontSize="lg" maxW="3xl" mx="auto" mb={12}>
          Crypto is liquid — too liquid. People buy to HODL, but sell too soon.
        </Text>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} maxW="5xl" mx="auto">
          <Box p={6} borderWidth="1px" borderRadius="lg" boxShadow="md" bg="white">
            <Icon as={MdCrisisAlert} w={12} h={12} color="red.500" mb={4} />
            <Heading as="h3" size="md" mb={2}>Panic Selling</Heading>
            <Text>83% of retail investors panic-sell during high volatility, missing long-term gains.</Text>
          </Box>
          <Box p={6} borderWidth="1px" borderRadius="lg" boxShadow="md" bg="white">
            <Icon as={MdOutlineLockClock} w={12} h={12} color="orange.500" mb={4} />
            <Heading as="h3" size="md" mb={2}>No Time Lock</Heading>
            <Text>Wallets lack built-in features to lock assets for future goals or time periods.</Text>
          </Box>
          <Box p={6} borderWidth="1px" borderRadius="lg" boxShadow="md" bg="white">
            <Icon as={MdOutlineSelfImprovement} w={12} h={12} color="purple.500" mb={4} />
            <Heading as="h3" size="md" mb={2}>Self-Discipline</Heading>
            <Text>Users lack tools for self-discipline in DeFi despite wanting to hold long-term.</Text>
          </Box>
        </SimpleGrid>
      </Box>

      <Box py={16} px={8} textAlign="center" bg="white">
        <Heading as="h2" size="xl" mb={2}>
          How It Works
        </Heading>
        <Text fontSize="lg" color="gray.600" mb={12}>
          Self-custodial + enforceable HODL
        </Text>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} maxW="6xl" mx="auto" alignItems="start">
          <Stack spacing={8} textAlign="left" p={6} borderWidth="1px" borderRadius="lg" boxShadow="md" bg="white">
            <Flex align="center">
              <Box bg="blue.500" color="white" borderRadius="full" w="8" h="8" display="flex" alignItems="center" justifyContent="center" fontSize="lg" fontWeight="bold" mr={4}>
                1
              </Box>
              <Box>
                <Heading as="h3" size="md">Open Vault App</Heading>
                <Text>Connect wallet and set time or price goal</Text>
              </Box>
            </Flex>
            <Flex align="center">
              <Box bg="blue.500" color="white" borderRadius="full" w="8" h="8" display="flex" alignItems="center" justifyContent="center" fontSize="lg" fontWeight="bold" mr={4}>
                2
              </Box>
              <Box>
                <Heading as="h3" size="md">Deploy Vault Contract</Heading>
                <Text>A personal smart wallet is created for you</Text>
              </Box>
            </Flex>
            <Flex align="center">
              <Box bg="blue.500" color="white" borderRadius="full" w="8" h="8" display="flex" alignItems="center" justifyContent="center" fontSize="lg" fontWeight="bold" mr={4}>
                3
              </Box>
              <Box>
                <Heading as="h3" size="md">Secure & Deposit</Heading>
                <Text>Get your private key and send tokens to vault</Text>
              </Box>
            </Flex>
            <Flex align="center">
              <Box bg="blue.500" color="white" borderRadius="full" w="8" h="8" display="flex" alignItems="center" justifyContent="center" fontSize="lg" fontWeight="bold" mr={4}>
                4
              </Box>
              <Box>
                <Heading as="h3" size="md">Wait for Goal</Heading>
                <Text>Tokens locked by smart contract logic</Text>
              </Box>
            </Flex>
            <Flex align="center">
              <Box bg="blue.500" color="white" borderRadius="full" w="8" h="8" display="flex" alignItems="center" justifyContent="center" fontSize="lg" fontWeight="bold" mr={4}>
                5
              </Box>
              <Box>
                <Heading as="h3" size="md">Goal Reached!</Heading>
                <Text>When your condition is met, withdraw your tokens.</Text>
              </Box>
            </Flex>
          </Stack>

          <Box p={6} borderWidth="1px" borderRadius="lg" boxShadow="md" bg="white" textAlign="left">
            <Heading as="h3" size="lg" mb={4}>Built fully on-chain</Heading>
            <List spacing={3}>
              <ListItem>
                <ListIcon as={BsCheckCircleFill} color="green.500" />
                <Text as="span" fontWeight="semibold">No centralized control</Text> - your assets remain in your control at all times
              </ListItem>
              <ListItem>
                <ListIcon as={BsCheckCircleFill} color="green.500" />
                <Text as="span" fontWeight="semibold">No admin keys</Text> - contracts are immutable and secure
              </ListItem>
              <ListItem>
                <ListIcon as={BsCheckCircleFill} color="green.500" />
                <Text as="span" fontWeight="semibold">Flexible conditions</Text> - lock until a time, price, or combined target
              </ListItem>
              <ListItem>
                <ListIcon as={BsCheckCircleFill} color="green.500" />
                <Text as="span" fontWeight="semibold">Enforced discipline</Text> - no way to withdraw until conditions are met
              </ListItem>
              <ListItem>
                <ListIcon as={BsCheckCircleFill} color="green.500" />
                <Text as="span" fontWeight="semibold">Chain agnostic</Text> - works on any EVM-compatible blockchain
              </ListItem>
            </List>
          </Box>
        </SimpleGrid>
      </Box>

      <Box py={16} px={8} textAlign="center" bg="gray.100">
        <Heading as="h2" size="xl" mb={12}>
          Choose the right vault to match your investment strategy
        </Heading>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} maxW="6xl" mx="auto">
          <Box p={6} borderWidth="1px" borderRadius="lg" boxShadow="lg" bg="white">
            <Icon as={IoTimeSharp} w={12} h={12} color="blue.500" mb={4} />
            <Heading as="h3" size="lg" mb={2}>Time-Locked</Heading>
            <Text mb={4}>Lock your tokens until a specific future date. Perfect for enforcing long-term holding strategies.</Text>
            <Box bg="blue.50" p={4} borderRadius="md" mb={4}>
              <Text fontWeight="bold">Example:</Text>
              <Text color="blue.600">Lock ETH until January 1, 2025</Text>
            </Box>
            <Text fontWeight="bold" mb={2}>Best for:</Text>
            <List spacing={1} textAlign="left">
              <ListItem>
                <ListIcon as={GoDotFill} color="blue.500" />
                Long-term investors
              </ListItem>
              <ListItem>
                <ListIcon as={GoDotFill} color="blue.500" />
                Retirement savings
              </ListItem>
              <ListItem>
                <ListIcon as={GoDotFill} color="blue.500" />
                Forced HODLing
              </ListItem>
            </List>
          </Box>

          <Box p={6} borderWidth="1px" borderRadius="lg" boxShadow="lg" bg="white">
            <Icon as={FaChartLine} w={12} h={12} color="green.500" mb={4} />
            <Heading as="h3" size="lg" mb={2}>Price-Locked</Heading>
            <Text mb={4}>Lock your tokens until a specific price target is met. Ideal for profit-taking or avoiding emotional decisions.</Text>
            <Box bg="green.50" p={4} borderRadius="md" mb={4}>
              <Text fontWeight="bold">Example:</Text>
              <Text color="green.600">Lock ETH until price reaches $10,000</Text>
            </Box>
            <Text fontWeight="bold" mb={2}>Best for:</Text>
            <List spacing={1} textAlign="left">
              <ListItem>
                <ListIcon as={GoDotFill} color="green.500" />
                Target-based investing
              </ListItem>
              <ListItem>
                <ListIcon as={GoDotFill} color="green.500" />
                Profit taking automation
              </ListItem>
              <ListItem>
                <ListIcon as={GoDotFill} color="green.500" />
                Price discipline
              </ListItem>
            </List>
          </Box>

          <Box p={6} borderWidth="1px" borderRadius="lg" boxShadow="lg" bg="white">
            <Icon as={Gi3dHammer} w={12} h={12} color="purple.500" mb={4} />
            <Heading as="h3" size="lg" mb={2}>Combined Conditions</Heading>
            <Text mb={4}>Lock your tokens with both time and price conditions. The most powerful vaulting strategy for sophisticated investors.</Text>
            <Box bg="purple.50" p={4} borderRadius="md" mb={4}>
              <Text fontWeight="bold">Example:</Text>
              <Text color="purple.600">Lock ETH until January 2025 OR price reaches $10,000</Text>
            </Box>
            <Text fontWeight="bold" mb={2}>Best for:</Text>
            <List spacing={1} textAlign="left">
              <ListItem>
                <ListIcon as={GoDotFill} color="purple.500" />
                Advanced investment strategies
              </ListItem>
              <ListItem>
                <ListIcon as={GoDotFill} color="purple.500" />
                Maximum flexibility
              </ListItem>
              <ListItem>
                <ListIcon as={GoDotFill} color="purple.500" />
                Balanced approaches
              </ListItem>
            </List>
          </Box>
        </SimpleGrid>

        <Button colorScheme="blue" size="lg" mt={12}>
          + Create Your Vault Now
        </Button>
      </Box>

      <Box py={20} bg="gray.50">
        <Container maxW="container.xl">
          <Stack spacing={12}>
            <Stack spacing={4} textAlign="center">
              <Heading as="h2" size="2xl" bgGradient="linear(to-r, purple.400, blue.500)" bgClip="text">
                Why TimeCapsule Vaults?
              </Heading>
              <Text fontSize="xl" color="gray.600" maxW="2xl" mx="auto">
                Join thousands of users who trust TimeCapsule Vaults for their long-term crypto storage needs
              </Text>
            </Stack>

            <SimpleGrid columns={{ base: 1, md: 4 }} spacing={8}>
              <Box textAlign="center" p={6} bg="white" borderRadius="lg" boxShadow="md">
                <Heading as="h3" size="3xl" color="purple.500" mb={2}>$50M+</Heading>
                <Text fontSize="lg" color="gray.600">Total Value Locked</Text>
              </Box>
              <Box textAlign="center" p={6} bg="white" borderRadius="lg" boxShadow="md">
                <Heading as="h3" size="3xl" color="purple.500" mb={2}>10K+</Heading>
                <Text fontSize="lg" color="gray.600">Active Vaults</Text>
              </Box>
              <Box textAlign="center" p={6} bg="white" borderRadius="lg" boxShadow="md">
                <Heading as="h3" size="3xl" color="purple.500" mb={2}>99.9%</Heading>
                <Text fontSize="lg" color="gray.600">Uptime</Text>
              </Box>
              <Box textAlign="center" p={6} bg="white" borderRadius="lg" boxShadow="md">
                <Heading as="h3" size="3xl" color="purple.500" mb={2}>24/7</Heading>
                <Text fontSize="lg" color="gray.600">Support</Text>
              </Box>
            </SimpleGrid>
          </Stack>
        </Container>
      </Box>

      <Box py={20}>
        <Container maxW="container.xl">
          <Stack spacing={12}>
            <Stack spacing={4} textAlign="center">
              <Heading as="h2" size="2xl" bgGradient="linear(to-r, purple.400, blue.500)" bgClip="text">
                Roadmap
              </Heading>
              <Text fontSize="xl" color="gray.600" maxW="2xl" mx="auto">
                Our journey to revolutionize crypto vaulting
              </Text>
            </Stack>

            <Stack spacing={8}>
              <Flex direction={{ base: "column", md: "row" }} align="center" justify="space-between">
                <Box flex="1" textAlign={{ base: "center", md: "right" }} pr={{ base: 0, md: 8 }} mb={{ base: 4, md: 0 }}>
                  <Box p={4} borderWidth="1px" borderRadius="lg" boxShadow="md" bg="white" display="inline-block">
                    <Icon as={Gi3dHammer} w={10} h={10} color="gray.500" />
                    <Text fontWeight="bold" color="green.500">complete</Text>
                    <Heading as="h4" size="md" mt={2}>MVP</Heading>
                    <Text color="gray.600" mt={2}>Basic vault functionality</Text>
                  </Box>
                </Box>
                <Box flex="1" textAlign={{ base: "center", md: "left" }} pl={{ base: 0, md: 8 }}>
                  <Box p={4} borderWidth="1px" borderRadius="lg" boxShadow="md" bg="white" display="inline-block">
                    <Icon as={GiChemicalTank} w={10} h={10} color="gray.500" />
                    <Text fontWeight="bold" color="blue.500">active</Text>
                    <Heading as="h4" size="md" mt={2}>Enhanced Security</Heading>
                    <Text color="gray.600" mt={2}>Advanced encryption & audits</Text>
                  </Box>
                </Box>
              </Flex>

              <Flex direction={{ base: "column", md: "row" }} align="center" justify="space-between">
                <Box flex="1" textAlign={{ base: "center", md: "right" }} pr={{ base: 0, md: 8 }} mb={{ base: 4, md: 0 }}>
                  <Box p={4} borderWidth="1px" borderRadius="lg" boxShadow="md" bg="white" display="inline-block">
                    <Icon as={GiWallet} w={10} h={10} color="gray.500" />
                    <Text fontWeight="bold" color="purple.500">upcoming</Text>
                    <Heading as="h4" size="md" mt={2}>Multi-Chain Support</Heading>
                    <Text color="gray.600" mt={2}>Expand to major networks</Text>
                  </Box>
                </Box>
                <Box flex="1" textAlign={{ base: "center", md: "left" }} pl={{ base: 0, md: 8 }}>
                  <Box p={4} borderWidth="1px" borderRadius="lg" boxShadow="md" bg="white" display="inline-block">
                    <Icon as={GiRocket} w={10} h={10} color="gray.500" />
                    <Text fontWeight="bold" color="purple.500">upcoming</Text>
                    <Heading as="h4" size="md" mt={2}>Advanced Features</Heading>
                    <Text color="gray.600" mt={2}>Smart automation & analytics</Text>
                  </Box>
                </Box>
              </Flex>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Testimonials Section */}
      <Box py={20} bg="gray.50">
        <Container maxW="container.xl">
          <Stack spacing={12}>
            <Stack spacing={4} textAlign="center">
              <Heading as="h2" size="2xl" bgGradient="linear(to-r, purple.400, blue.500)" bgClip="text">
                What Our Users Say
              </Heading>
              <Text fontSize="xl" color="gray.600" maxW="2xl" mx="auto">
                Join thousands of satisfied users who trust TimeCapsule Vaults
              </Text>
            </Stack>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
              {testimonials.map((testimonial, index) => (
                <MotionBox
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                >
                  <Box
                    p={8}
                    bg={cardBg}
                    borderRadius="lg"
                    boxShadow="lg"
                    position="relative"
                    _hover={{ boxShadow: 'xl' }}
                    transition="all 0.3s"
                  >
                    <Icon
                      as={FaQuoteLeft}
                      w={8}
                      h={8}
                      color="purple.200"
                      position="absolute"
                      top={4}
                      left={4}
                    />
                    <Text fontSize="lg" color="gray.600" mb={6} mt={4}>
                      {testimonial.content}
                    </Text>
                    <Flex align="center">
                      <Avatar
                        src={testimonial.image}
                        name={testimonial.name}
                        size="md"
                        mr={4}
                      />
                      <Box>
                        <Text fontWeight="bold">{testimonial.name}</Text>
                        <Text color="gray.500">{testimonial.role}</Text>
                      </Box>
                    </Flex>
                  </Box>
                </MotionBox>
              ))}
            </SimpleGrid>
          </Stack>
        </Container>
      </Box>

      {/* Scroll to Top Button */}
      <MotionBox
        position="fixed"
        bottom={8}
        right={8}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.5 }}
        transition={{ duration: 0.3 }}
        zIndex={1000}
      >
        <IconButton
          aria-label="Scroll to top"
          icon={<BsArrowUp />}
          colorScheme="purple"
          size="lg"
          isRound
          onClick={scrollToTop}
          boxShadow="lg"
          _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
          transition="all 0.2s"
        />
      </MotionBox>

      <Box as="footer" py={10} bg="gray.50">
        <Container maxW="container.xl">
          <Stack spacing={8}>
            <SimpleGrid columns={{ base: 1, md: 4 }} spacing={8}>
              <Stack spacing={4}>
                <Heading as="h4" size="md">TimeCapsule Vaults</Heading>
                <Text color="gray.600">Secure your crypto future with confidence</Text>
              </Stack>
              <Stack spacing={4}>
                <Heading as="h4" size="sm">Product</Heading>
                <Link href="#" color="gray.600">Features</Link>
                <Link href="#" color="gray.600">Pricing</Link>
                <Link href="#" color="gray.600">Security</Link>
              </Stack>
              <Stack spacing={4}>
                <Heading as="h4" size="sm">Resources</Heading>
                <Link href="#" color="gray.600">Documentation</Link>
                <Link href="#" color="gray.600">API</Link>
                <Link href="#" color="gray.600">Status</Link>
              </Stack>
              <Stack spacing={4}>
                <Heading as="h4" size="sm">Company</Heading>
                <Link href="#" color="gray.600">About</Link>
                <Link href="#" color="gray.600">Blog</Link>
                <Link href="#" color="gray.600">Contact</Link>
              </Stack>
            </SimpleGrid>
            <Divider />
            <Flex justify="space-between" align="center">
              <Text color="gray.600">© 2024 TimeCapsule Vaults. All rights reserved.</Text>
              <Stack direction="row" spacing={6}>
                <Link href="#" color="gray.600">Privacy Policy</Link>
                <Link href="#" color="gray.600">Terms of Service</Link>
              </Stack>
            </Flex>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default Home; 