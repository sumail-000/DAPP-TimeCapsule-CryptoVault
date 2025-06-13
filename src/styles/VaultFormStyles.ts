import styled from '@emotion/styled'

export const VaultFormContainer = styled.div`
  padding: 2rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`

export const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1rem;
  }
`

export const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

export const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #4a5568;
`

export const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: #4299e1;
    box-shadow: 0 0 0 1px #4299e1;
  }
`

interface ButtonProps {
  variant?: 'solid' | 'outline'
  colorScheme?: string
  isLoading?: boolean
  loadingText?: string
  mr?: number
}

export const Button = styled.button<ButtonProps>`
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-right: ${props => props.mr ? `${props.mr}px` : '0'};
  opacity: ${props => props.isLoading ? '0.7' : '1'};
  pointer-events: ${props => props.isLoading ? 'none' : 'auto'};

  ${props => props.variant === 'outline' ? `
    background: transparent;
    border: 1px solid #4299e1;
    color: #4299e1;

    &:hover {
      background: #ebf8ff;
    }
  ` : `
    background: #4299e1;
    border: 1px solid #4299e1;
    color: white;

    &:hover {
      background: #3182ce;
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

export const ErrorMessage = styled.div`
  color: #e53e3e;
  font-size: 0.875rem;
  margin-top: 0.5rem;
` 