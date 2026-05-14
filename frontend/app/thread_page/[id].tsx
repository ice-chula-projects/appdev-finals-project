import { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, TextInput, ScrollView, Linking, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Button } from "@react-navigation/elements";
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';

export default function Index() {
  const { id } = useLocalSearchParams();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [threadData, setThreadData] = useState<any>(null);
  const [threadMessageData, setThreadMessageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);  

  const SESSION_TOKEN ="TchBnBhs0fVdJoNnR2db3jkqdlrlQE-y4B0Qz6IWm1k"; // Replace with actual session token management

  const [fontsLoaded] = useFonts({
    "RobotoSlab-Regular": require("../../assets/fonts/RobotoSlab-Regular.ttf"),
    "NotoSans-Regular": require("../../assets/fonts/NotoSans-Regular.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

useEffect(() => {
  const fetchThread = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/get_thread?uuid=${id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "session-token": SESSION_TOKEN,
          },
        }
      );

      const ress = await fetch(
        `http://localhost:5000/get_thread_messages?uuid=${id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "session-token": SESSION_TOKEN,
          },
        }
      );

      const data = await res.json();
      const dbtb = await ress.json();

      if (res.ok && ress.ok) {
        setThreadData(data);
        setThreadMessageData(dbtb);
      } else {
        console.log("Backend error:", data.error);
      }
    } catch (err) {
      console.log("Network error:", err);
    } finally {
      setLoading(false);
    }
  };

    if (id) fetchThread();
  }, [id]);

  if (!fontsLoaded) return null;

  if (!threadMessageData || !threadData) {
    return (
      <SafeAreaView>
        <Text>Loading thread...</Text>
      </SafeAreaView>
    );
  }


  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <Text
              style={{
                fontSize: 40,
                fontWeight: "bold",
              }}
            >
              Threads
            </Text>
          ),
        }}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <TouchableOpacity
          style={{
            position: "absolute",
            top: 10,
            left: 20,
            paddingVertical: 10,
            paddingHorizontal: 15,
            backgroundColor: "#007AFF",
            borderRadius: 8,
            zIndex: 1,
          }}
          onPress={() => {
            console.log("Login pressed");
            console.log("Username:", username);
            console.log("Password:", password);
          }}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>
            Login
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            position: "absolute",
            top: 10,
            left: 500,
            paddingVertical: 10,
            paddingHorizontal: 15,
            backgroundColor: "#34C759",
            borderRadius: 8,
            zIndex: 1,
          }}
          onPress={() => {
            router.push("/auth/signup_page");
          }}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>
            Signup
          </Text>
        </TouchableOpacity>

        <View
          style={{
            flex: 1,
            paddingTop: 100,
            paddingHorizontal: 30,
          }}
        >
          <TextInput
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            style={{
              position: "absolute",
              top: 10,
              left: 100,
              paddingVertical: 10,
              paddingHorizontal: 15,
            }}
          />

          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={true}
            style={{
              position: "absolute",
              top: 10,
              left: 300,
              paddingVertical: 10,
              paddingHorizontal: 15,
            }}
          />

          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              marginBottom: 5,
            }}
          >
            {id}
            {"  -  "}
            {threadData.thread.name}
          </Text>
            <Text
            style={{
              fontSize: 16,
              marginBottom: 10,
            }}
          >
            {threadData.thread.description}
            {`\n`}
            {threadData.thread.creation_date}
          </Text>

          <ScrollView>
            {Object.values(threadMessageData.messages).map(
              (msg: any, index: number) => (
                <View
                  key={index}
                  style={{
                    padding: 15,
                    borderWidth: 1,
                    borderColor: "#ccc",
                    borderRadius: 8,
                    marginBottom: 15,
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "bold",
                      marginBottom: 5,
                    }}
                  >
                    {msg.author_user_uuid}
                  </Text>

                  <Text
                    style={{
                      fontSize: 20,
                    }}
                  >
                    {msg.message}
                  </Text>

                  <Text
                    style={{
                      color: "gray",
                      marginTop: 5,
                      fontSize: 12,
                    }}
                  >
                    {msg.creation_date}
                  </Text>
                </View>
              )
            )}
          </ScrollView>

          <ScrollView>
            <Text>
              {/* {JSON.stringify(threadMessageData)} */}
            </Text>
          </ScrollView>
        </View>
      </SafeAreaView>
    </>
  );
}