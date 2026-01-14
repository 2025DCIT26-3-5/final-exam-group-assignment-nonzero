import { useState } from "react";
import { StyleSheet, Text, View, Button } from "react-native";
import { StatusBar } from "expo-status-bar";

// Child Component with Props
function Greeting({ name }) {
  return <Text style={styles.greeting}>Kamote, {name}!</Text>;
}

export default function App() {
  // State Hook
  const [count, setCount] = useState(0);
  const [name, setName] = useState("World");

  return (
    <View style={styles.container}>
      {/* Native Feature: Controls phone's status bar */}
      <StatusBar style="light" backgroundColor="red" />

      <Text style={styles.title}>React Native Demo</Text>

      {/* Component with Props */}
      <Greeting name={name} />

      {/* State Display */}
      <Text style={styles.counter}>Count: {count}</Text>

      {/* Native Button */}
      <Button title="Increment" onPress={() => setCount(count + 1)} />

      <Button
        title="Change Name"
        onPress={() => setName(name === "World" ? "Student" : "World")}
      />
    </View>
  );
}

// StyleSheet (like CSS but for React Native)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#cbd4e6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 20,
  },
  greeting: {
    fontSize: 32,
    color: "#ec261cff",
    marginBottom: 10,
  },
  counter: {
    fontSize: 16,
    color: "white",
    marginVertical: 20,
  },
});
