import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Skill } from '../types';

interface SkillButtonWithTimerProps {
  skill: Skill;
  selected?: boolean;
  onPress: () => void;
  disabled?: boolean;
}

const SkillButtonWithTimer: React.FC<SkillButtonWithTimerProps> = ({
  skill,
  selected = false,
  onPress,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        selected && styles.buttonSelected,
        disabled && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.content}>
        <Text style={[styles.skillName, disabled && styles.textDisabled]}>
          {skill.name}
        </Text>
        <Text style={[styles.skillInfo, disabled && styles.textDisabled]}>
          威力: {skill.power}
        </Text>

        {/* 已選擇指示 */}
        {selected && !disabled && (
          <View style={styles.selectedIndicator}>
            <Text style={styles.selectedText}>✓ 已選擇</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#4a5a9e',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    margin: 5,
    minWidth: 140,
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  buttonDisabled: {
    backgroundColor: '#2d3142',
    opacity: 0.6,
  },
  buttonSelected: {
    backgroundColor: '#4ecca3',
    borderColor: '#45b393',
    borderWidth: 3,
  },
  content: {
    alignItems: 'center',
  },
  skillName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  skillInfo: {
    color: '#ccc',
    fontSize: 12,
  },
  textDisabled: {
    color: '#666',
  },
  selectedIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#4ecca3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#45b393',
  },
  selectedText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default SkillButtonWithTimer;
