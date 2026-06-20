import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';

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

  return (
    <View style={styles.container}>
      <Text style={[styles.label, (isFocused || props.value) && styles.labelFocused]}>
        {label}
      </Text>
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputWrapperFocused,
          error ? styles.inputWrapperError : null,
        ]}
      >
        <TextInput
          style={styles.input}
          placeholderTextColor="#6c7281"
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
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    transitionProperty: 'all',
    transitionDuration: '0.2s',
  },
  labelFocused: {
    color: '#6366f1', // Indigo glow
  },
  inputWrapper: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1.5,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    justifyContent: 'center',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    transitionProperty: 'border-color, box-shadow',
    transitionDuration: '0.2s',
  },
  inputWrapperFocused: {
    borderColor: '#6366f1',
    boxShadow: '0 0 12px rgba(99, 102, 241, 0.3)',
  },
  inputWrapperError: {
    borderColor: '#ef4444',
    boxShadow: '0 0 12px rgba(239, 68, 68, 0.3)',
  },
  input: {
    color: '#f8fafc',
    fontSize: 16,
    outlineWidth: 0, // Disable web focus outline
    width: '100%',
    height: '100%',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
    paddingLeft: 4,
  },
});
