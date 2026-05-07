import { Text, View } from "react-native";
import { styles } from "./AppStatusHeader.styles";

type Props = {
  title: string;
  status: string;
};

export function AppStatusHeader({ title, status }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.status}>{status}</Text>
    </View>
  );
}
