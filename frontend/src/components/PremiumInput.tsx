import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface PremiumInputProps extends TextInputProps {
  label: string;
  error?: string;
}

export const PremiumInput: React.FC<PremiumInputProps> = ({
  label,
  error,
  secureTextEntry,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.label,
          { color: theme.textMuted },
          (isFocused || props.value) && { color: theme.primary },
        ]}
      >
        {label}
      </Text>
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: theme.inputBg,
            borderColor: theme.isDark ? theme.inputBorder : '#e2e8f0',
          },
          isFocused && { borderColor: theme.primary },
          error ? styles.inputWrapperError : null,
        ]}
      >
        <TextInput
          style={[styles.input, { color: theme.inputText }]}
          placeholderTextColor={theme.isDark ? '#6c7281' : '#94a3b8'}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
          {...props}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    transitionProperty: 'all',
    transitionDuration: '0.2s',
  } as any,
  inputWrapper: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    justifyContent: 'center',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    transitionProperty: 'border-color, box-shadow',
    transitionDuration: '0.2s',
  } as any,
  inputWrapperError: {
    borderColor: '#ef4444',
    boxShadow: '0 0 12px rgba(239, 68, 68, 0.3)',
  } as any,
  input: {
    fontSize: 16,
    outlineWidth: 0, // Disable web focus outline
    width: '100%',
    height: '100%',
  } as any,
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
    paddingLeft: 4,
  },
});

