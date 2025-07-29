import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ChakraProvider, extendTheme } from '@chakra-ui/react'
import { Global, css } from '@emotion/react'

const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  styles: {
    global: {
      body: {
        bg: '#0d1117',
        color: '#f0f6fc',
      },
    },
  },
})

const globalStyles = css`
  .dashboard-heading {
    color: white !important;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.8) !important;
    -webkit-text-fill-color: white !important;
    -webkit-text-stroke: 1px rgba(0,0,0,0.5) !important;
    filter: drop-shadow(0 0 4px rgba(0,0,0,0.8)) !important;
  }
  
  .dashboard-subtitle {
    color: white !important;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.8) !important;
  }
`

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <Global styles={globalStyles} />
    <App />
    </ChakraProvider>
  </React.StrictMode>,
)
