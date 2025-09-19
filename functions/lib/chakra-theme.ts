import { extendTheme } from '@chakra-ui/theme-utils';

// Saintfest color palette
const colors = {
  saintfest: {
    50: '#f7fafc',
    100: '#edf2f7',
    200: '#e2e8f0',
    300: '#cbd5e0',
    400: '#a0aec0',
    500: '#8FBC8F', // Primary Saintfest green
    600: '#7ba87b',
    700: '#689468',
    800: '#547954',
    900: '#405f40',
  },
  cream: {
    50: '#fffbeb', // Background cream color
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
};

// Custom fonts matching Saintfest design
const fonts = {
  heading: 'var(--font-sorts-mill), serif',
  body: 'var(--font-cormorant), serif',
  mono: 'ui-monospace, SFMono-Regular, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
};

// Component style overrides
const components = {
  Button: {
    baseStyle: {
      fontFamily: 'var(--font-league-spartan)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      fontWeight: '600',
    },
    variants: {
      solid: {
        bg: 'saintfest.500',
        color: 'white',
        _hover: {
          bg: 'saintfest.600',
        },
        _active: {
          bg: 'saintfest.700',
        },
      },
      outline: {
        borderColor: 'saintfest.500',
        color: 'saintfest.500',
        _hover: {
          bg: 'saintfest.50',
          borderColor: 'saintfest.600',
          color: 'saintfest.600',
        },
      },
    },
    defaultProps: {
      variant: 'solid',
    },
  },
  Card: {
    baseStyle: {
      container: {
        bg: 'white',
        borderColor: 'gray.200',
        borderWidth: '1px',
        borderRadius: 'lg',
        boxShadow: 'sm',
        _hover: {
          boxShadow: 'md',
        },
      },
    },
  },
  Input: {
    baseStyle: {
      field: {
        fontFamily: 'var(--font-cormorant)',
        fontSize: 'md',
      },
    },
    variants: {
      outline: {
        field: {
          borderColor: 'gray.300',
          _hover: {
            borderColor: 'saintfest.400',
          },
          _focus: {
            borderColor: 'saintfest.500',
            boxShadow: '0 0 0 1px var(--chakra-colors-saintfest-500)',
          },
        },
      },
    },
  },
  Select: {
    baseStyle: {
      field: {
        fontFamily: 'var(--font-cormorant)',
        fontSize: 'md',
      },
    },
    variants: {
      outline: {
        field: {
          borderColor: 'gray.300',
          _hover: {
            borderColor: 'saintfest.400',
          },
          _focus: {
            borderColor: 'saintfest.500',
            boxShadow: '0 0 0 1px var(--chakra-colors-saintfest-500)',
          },
        },
      },
    },
  },
  Textarea: {
    baseStyle: {
      fontFamily: 'var(--font-cormorant)',
      fontSize: 'md',
    },
    variants: {
      outline: {
        borderColor: 'gray.300',
        _hover: {
          borderColor: 'saintfest.400',
        },
        _focus: {
          borderColor: 'saintfest.500',
          boxShadow: '0 0 0 1px var(--chakra-colors-saintfest-500)',
        },
      },
    },
  },
  Tag: {
    baseStyle: {
      container: {
        fontFamily: 'var(--font-league-spartan)',
        fontSize: 'xs',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        fontWeight: '500',
      },
    },
    variants: {
      subtle: {
        container: {
          bg: 'saintfest.100',
          color: 'saintfest.800',
        },
      },
      solid: {
        container: {
          bg: 'saintfest.500',
          color: 'white',
        },
      },
    },
    defaultProps: {
      variant: 'subtle',
    },
  },
  FormLabel: {
    baseStyle: {
      fontFamily: 'var(--font-league-spartan)',
      fontSize: 'sm',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      fontWeight: '600',
      color: 'gray.700',
    },
  },
  Heading: {
    baseStyle: {
      fontFamily: 'var(--font-sorts-mill)',
      fontWeight: '600',
    },
  },
};

// Global styles
const styles = {
  global: {
    body: {
      bg: 'cream.50',
      fontFamily: 'var(--font-cormorant)',
    },
    '*::placeholder': {
      color: 'gray.400',
    },
    '*, *::before, &::after': {
      borderColor: 'gray.200',
      wordWrap: 'break-word',
    },
  },
};

// Theme configuration
const config = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

export const saintfestTheme = extendTheme({
  colors,
  fonts,
  components,
  styles,
  config,
  space: {
    px: '1px',
    0.5: '0.125rem',
    1: '0.25rem',
    1.5: '0.375rem',
    2: '0.5rem',
    2.5: '0.625rem',
    3: '0.75rem',
    3.5: '0.875rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    7: '1.75rem',
    8: '2rem',
    9: '2.25rem',
    10: '2.5rem',
    12: '3rem',
    14: '3.5rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    28: '7rem',
    32: '8rem',
    36: '9rem',
    40: '10rem',
    44: '11rem',
    48: '12rem',
    52: '13rem',
    56: '14rem',
    60: '15rem',
    64: '16rem',
    72: '18rem',
    80: '20rem',
    96: '24rem',
  },
  shadows: {
    xs: '0 0 0 1px rgba(0, 0, 0, 0.05)',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
});