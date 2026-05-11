import { useState } from "react";
import {Text, View, TouchableOpacity, TextInput, ScrollView, Linking} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, Stack } from "expo-router";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (username.trim() === "" || password.trim() === "") {
      alert("Please enter both username and password.");
      return;
    }
    console.log("Username:", username);
    console.log("Password:", password);
    router.push("/");
  };

    const handleGuestLogin = () => {
    router.push("/");
  };

  return (
        <>
        <Stack.Screen
            options={{
            headerTitle: () => (
                <Text
                style={{
                    fontSize: 20,
                    fontWeight: "bold",
                }}
                >
                Threads
                </Text>
            ),
            }}
        />

    <SafeAreaView
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
        paddingHorizontal: 30,
      }}
    >
      <Text
        style={{
          fontSize: 32,
          fontWeight: "bold",
          marginBottom: 40,
        }}
      >
        Login
      </Text>

      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        style={{
          width: "50%",
          borderWidth: 1,
          borderColor: "#ccc",
          borderRadius: 10,
          paddingVertical: 12,
          paddingHorizontal: 15,
          marginBottom: 20,
          fontSize: 16,
        }}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={true}
        style={{
          width: "50%",
          borderWidth: 1,
          borderColor: "#ccc",
          borderRadius: 10,
          paddingVertical: 12,
          paddingHorizontal: 15,
          marginBottom: 30,
          fontSize: 16,
        }}
      />

      <TouchableOpacity
        onPress={handleLogin}
        style={{
          width: "20%",
          backgroundColor: "#007AFF",
          paddingVertical: 15,
          borderRadius: 10,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: "white",
            fontSize: 16,
            fontWeight: "bold",
          }}
        >
          Login
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleGuestLogin}
        style={{
            position: "absolute",
            bottom: 180,
            alignSelf: "center",
            backgroundColor: "#777",
            paddingVertical: 6,
            paddingHorizontal: 10,
            borderRadius: 5,
        }}
        >
        <Text
            style={{
            color: "white",
            fontSize: 8,
            fontWeight: "bold",
            }}
        >
            Login as Guest
        </Text>
    </TouchableOpacity>
    </SafeAreaView>
    </>
  );
}