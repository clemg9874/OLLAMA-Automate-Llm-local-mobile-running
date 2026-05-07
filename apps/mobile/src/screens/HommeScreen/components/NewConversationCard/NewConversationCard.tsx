import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from "react-native";
import { hommeScreenColors, hommeScreenStyles as styles } from "../../HommeScreen.styles";

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
      <Text style={styles.newConversationTitle}>Nouvelle conversation</Text>
      <Text style={styles.newConversationSub}>Posez votre question a l'IA locale</Text>
      <View style={styles.newConversationHeaderRow}>
        <View style={styles.newConversationIconWrap}>
          <Text style={styles.newConversationIcon}>✣</Text>
        </View>
      </View>
      <View style={styles.newConversationInputRow}>
        <TextInput
          style={styles.newConversationInput}
          value={value}
          onChangeText={onChangeText}
          placeholder="De quoi voulez-vous parler ?"
          placeholderTextColor={hommeScreenColors.inputPlaceholder}
        />
        <TouchableOpacity style={styles.newConversationSendButton} onPress={onSend} disabled={isCreating}>
          {isCreating ? <ActivityIndicator color="#fff" /> : <Text style={styles.newConversationSendIcon}>➤</Text>}
        </TouchableOpacity>
      </View>
      <View style={styles.suggestionWrap}>
        {suggestions.map((suggestion) => (
          <TouchableOpacity key={suggestion} style={styles.suggestionChip} onPress={() => onPickSuggestion(suggestion)}>
            <Text style={styles.suggestionText}>{`+ ${suggestion}`}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
