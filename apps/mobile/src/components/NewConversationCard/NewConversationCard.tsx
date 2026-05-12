import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { PrimaryButton } from "../PrimaryButton/PrimaryButton";
import { colors, styles } from "./NewConversationCard.styles";

type Props = {
  value: string;
  onChangeText: (next: string) => void;
  onSend: () => void;
  onPickSuggestion: (suggestion: string) => void;
  suggestions: string[];
  isCreating: boolean;
};

export function NewConversationCard({
  value,
  onChangeText,
  onSend,
  onPickSuggestion,
  suggestions,
  isCreating,
}: Props) {
  return (
    <View style={styles.newConversationCard}>
      <View style={styles.newConversationHeaderRow}>
        <View style={styles.newConversationIconWrap}>
          <Text style={styles.newConversationIcon}>✣</Text>
        </View>
        <View style={styles.newConversationHeaderTextWrap}>
          <Text style={styles.newConversationTitle}>Nouvelle conversation</Text>
          <Text style={styles.newConversationSub}>Posez votre question a l'IA locale</Text>
        </View>
      </View>
      <View style={styles.newConversationInputRow}>
        <TextInput
          style={styles.newConversationInput}
          value={value}
          onChangeText={onChangeText}
          placeholder="De quoi voulez-vous parler ?"
          placeholderTextColor={colors.inputPlaceholder}
        />
        <PrimaryButton
          label="➤"
          onPress={onSend}
          loading={isCreating}
          disabled={value.trim().length === 0}
          style={styles.newConversationSendButton}
          textStyle={styles.newConversationSendIcon}
        />
      </View>
    </View>
  );
}
