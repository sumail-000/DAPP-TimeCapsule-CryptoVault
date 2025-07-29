import { ChakraProvider, extendTheme } from '@chakra-ui/react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
// import React from 'react' // Not needed in React 17+ with new JSX transform

import DAppLayout from './components/DAppLayout'
import { NotificationsHandler } from './components/NotificationsHandler'

const theme = extendTheme({
  // ... existing theme config
})

function App() {
  return (
    <ChakraProvider theme={theme}>
      <NotificationsHandler />
      <Router>
        <Routes>
          {/* DApp Routes - All under root path */}
          <Route path="/*" element={<DAppLayout />} />
        </Routes>
      </Router>
    </ChakraProvider>
  )
}

export default App