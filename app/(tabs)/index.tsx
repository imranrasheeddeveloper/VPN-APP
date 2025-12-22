import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function App() {
  const [status, setStatus] = useState<"idle" | "connected">("idle");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SecureNest VPN</Text>

      <Text style={styles.status}>
        Status: {status === "connected" ? "🟢 Connected" : "⚪ Disconnected"}
      </Text>

      <Pressable
        style={styles.button}
        onPress={() => setStatus(s => s === "connected" ? "idle" : "connected")}
      >
        <Text style={styles.buttonText}>
          {status === "connected" ? "Disconnect" : "Connect"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 20 },
  status: { marginBottom: 20, fontSize: 16 },
  button: {
    backgroundColor: "#000",
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 30,
  },
  buttonText: { color: "#fff", fontSize: 16 },
});
