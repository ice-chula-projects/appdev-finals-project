import { Stack, router } from "expo-router";
import { Text, View, TouchableOpacity, Image } from "react-native";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.push("/")} style={{ marginLeft: 15 }}>
            <Image 
              source={require("../assets/images/message_logo.png")}
              style={{ width: 40, height: 40 }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        ),
      }}
    />
  );
}
