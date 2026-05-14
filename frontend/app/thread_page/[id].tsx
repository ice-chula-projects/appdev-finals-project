import { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, TextInput, ScrollView, Linking, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Button } from "@react-navigation/elements";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';

export default function Index() {
  const { id } = useLocalSearchParams();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const[threadData1, setThreadData1] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  // Fetch thread info
  useEffect(() => {
  const fetchThread = async () => {
    try {
      const response = await fetch(`http://localhost:5000/get_thread?uuid=${id}`);
      const data = await response.json();
      if (response.ok) {
        setThreadData1(data.thread);
      } else {
        console.log(data.error);
      }
    } catch (error) {
      console.log(error);
    }
  };

  if (id) {
    fetchThread();
  }
}, [id]);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
    try {
      const sessionToken = await AsyncStorage.getItem("session_token");
      const response = await fetch(`http://localhost:5000/get_thread_messages?uuid=${id}&page=1`, {
          method: "GET",
          headers: {"session-token": sessionToken || ""},
        }
      );

      const data = await response.json();
      if (response.ok) {
        setMessages(data.messages);
      } else {
        console.log(data.error);
      }
    } catch (error) {
      console.log(error);
    }
  };

  if (id) {
    fetchMessages();
  }
  }, [id]);

  const handleSendMessage = async () => {
  if (!newMessage.trim()) return;

  try {
    const sessionToken = await AsyncStorage.getItem("session_token");
    const response = await fetch("http://localhost:5000/post_message", {
        method: "POST",
        headers: {"Content-Type": "application/json", "session-token": sessionToken || ""},
        body: JSON.stringify({ thread_uuid: id, message: newMessage,}),
      }
    );

    const data = await response.json();
    if (response.ok) {
      setNewMessage("");

      // Refresh messages
      const refreshResponse = await fetch(
        `http://localhost:5000/get_thread_messages?uuid=${id}&page=1`,
        { headers: {"session-token": sessionToken || ""} }
      );

      const refreshData = await refreshResponse.json();
      if (refreshResponse.ok) {
        setMessages(refreshData.messages);
      }
    } else {
      console.log(data.error);
    }
  } catch (error) {
    console.log(error);
  }
};


  // const [threadData, setThreadData] = useState<any>(null);

  // const SESSION_TOKEN ="ykkB6lt8nWhTg3F9hfFX0RjGbYALJvYszP4FYlmFvtM"; // Replace with actual session token management

  // JSON loaded directly into code
  const threadData = {
    _id: "135fe107-abb7-4115-8783-d77378b0dc31",
    author_user_uuid: "e89883ed-f8b1-482f-a024-fd28beb286c6",
    creation_date: "Wed, 13 May 2026 12:46:09 GMT",
    description: "goodbye",
    last_message_date: "Wed, 13 May 2026 12:46:09 GMT",
    last_modified_date: "Wed, 13 May 2026 12:46:09 GMT",

    messages: {
      "ad150d1d-5e4f-4248-8bee-bf5836f23ab9": {
        attachment: null,
        author_user_uuid: "e89883ed-f8b1-482f-a024-fd28beb286c6",
        creation_date: "Wed, 13 May 2026 12:47:41 GMT",
        last_modified_date: "Wed, 13 May 2026 12:47:41 GMT",
        message: "epstein didnt kill himself",
        uuid: "ad150d1d-5e4f-4248-8bee-bf5836f23ab9",
      },

      "c2e71f8d-19b2-4d89-9cb8-95b7d3aa1021": {
        attachment: null,
        author_user_uuid: "7c2e938a-6a14-4f88-9d12-3c4d9bbfa991",
        creation_date: "Wed, 13 May 2026 12:49:10 GMT",
        last_modified_date: "Wed, 13 May 2026 12:49:10 GMT",
        message: "nah bro theres no way",
        uuid: "c2e71f8d-19b2-4d89-9cb8-95b7d3aa1021",
      },

      "77e0c5f7-ec1a-4ef3-a45e-5f21a4dd2280": {
        attachment: null,
        author_user_uuid: "f552bc67-34d4-4fd8-bfc3-8ea8c85e4e12",
        creation_date: "Wed, 13 May 2026 12:50:02 GMT",
        last_modified_date: "Wed, 13 May 2026 12:50:02 GMT",
        message: "source: trust me bro",
        uuid: "77e0c5f7-ec1a-4ef3-a45e-5f21a4dd2280",
      },

      "d8b9f243-6d0f-4d17-b8cb-7a21d2fda712": {
        attachment: null,
        author_user_uuid: "1193aa82-54df-49b8-9122-3d2db4427c55",
        creation_date: "Wed, 13 May 2026 12:51:44 GMT",
        last_modified_date: "Wed, 13 May 2026 12:51:44 GMT",
        message: "mods are asleep post cat pictures",
        uuid: "d8b9f243-6d0f-4d17-b8cb-7a21d2fda712",
      },

      "aaf1f90b-c965-47b0-98a9-bfd29cf8f910": {
        attachment: null,
        author_user_uuid: "92cb0fa3-0a2d-4ef5-a1b2-7d9fbb55e820",
        creation_date: "Wed, 13 May 2026 12:53:21 GMT",
        last_modified_date: "Wed, 13 May 2026 12:53:21 GMT",
        message: "anyone got the homework answers",
        uuid: "aaf1f90b-c965-47b0-98a9-bfd29cf8f910",
      },

      "6d3ab4a1-b7d4-4b6e-b3a1-5e7fdabcc002": {
        attachment: null,
        author_user_uuid: "44b28d53-d0df-43b7-b38b-42a8c0df1129",
        creation_date: "Wed, 13 May 2026 12:54:40 GMT",
        last_modified_date: "Wed, 13 May 2026 12:54:40 GMT",
        message: "hello from thailand",
        uuid: "6d3ab4a1-b7d4-4b6e-b3a1-5e7fdabcc002",
      },
        "1b82de44-71ac-44b3-b17d-17f8d19ac111": {
        attachment: null,
        author_user_uuid: "abf31a9c-09e5-4e59-8c39-122efbcdd001",
        creation_date: "Wed, 13 May 2026 12:56:03 GMT",
        last_modified_date: "Wed, 13 May 2026 12:56:03 GMT",
        message: "this thread is cursed",
        uuid: "1b82de44-71ac-44b3-b17d-17f8d19ac111",
      },

      "5fc7a2aa-3d5c-470f-9d68-ef08d78e2112": {
        attachment: null,
        author_user_uuid: "4c2e77d1-56b8-45aa-b2f5-92d8fd341002",
        creation_date: "Wed, 13 May 2026 12:56:50 GMT",
        last_modified_date: "Wed, 13 May 2026 12:56:50 GMT",
        message: "can someone explain the lore",
        uuid: "5fc7a2aa-3d5c-470f-9d68-ef08d78e2112",
      },

      "2eaf37e8-f42f-4f56-a5f9-8712db0c3113": {
        attachment: null,
        author_user_uuid: "1da8d3c7-c1a8-489d-a91d-5cbbe55fa113",
        creation_date: "Wed, 13 May 2026 12:57:21 GMT",
        last_modified_date: "Wed, 13 May 2026 12:57:21 GMT",
        message: "the fog is coming",
        uuid: "2eaf37e8-f42f-4f56-a5f9-8712db0c3113",
      },

      "a8f9e531-cd53-4aaf-b9cb-dfb0aa8ea114": {
        attachment: null,
        author_user_uuid: "3cb0d8b7-b53d-47f4-9dd3-0ddab31fc114",
        creation_date: "Wed, 13 May 2026 12:58:02 GMT",
        last_modified_date: "Wed, 13 May 2026 12:58:02 GMT",
        message: "who up threading they post",
        uuid: "a8f9e531-cd53-4aaf-b9cb-dfb0aa8ea114",
      },

      "0bc66f0f-9b67-4c98-8dbe-1c6ab2df6115": {
        attachment: null,
        author_user_uuid: "2a6c0df4-e68d-4f8b-a0bb-f6d87dd9d115",
        creation_date: "Wed, 13 May 2026 12:58:47 GMT",
        last_modified_date: "Wed, 13 May 2026 12:58:47 GMT",
        message: "im eating instant noodles rn",
        uuid: "0bc66f0f-9b67-4c98-8dbe-1c6ab2df6115",
      },

      "d6eeef8a-1dd4-43b5-bf6b-6bc54eaef116": {
        attachment: null,
        author_user_uuid: "7a7c8f22-5db5-48f4-a6d1-6d73a0b33116",
        creation_date: "Wed, 13 May 2026 12:59:12 GMT",
        last_modified_date: "Wed, 13 May 2026 12:59:12 GMT",
        message: "chat moving so fast nobody will notice i love garlic bread",
        uuid: "d6eeef8a-1dd4-43b5-bf6b-6bc54eaef116",
      },

      "9d113d6a-b0b0-4719-a4f1-ff97d0a52117": {
        attachment: null,
        author_user_uuid: "8f2e97a0-fde2-4715-95b8-7499aef77117",
        creation_date: "Wed, 13 May 2026 13:00:01 GMT",
        last_modified_date: "Wed, 13 May 2026 13:00:01 GMT",
        message: "wake up babe new conspiracy just dropped",
        uuid: "9d113d6a-b0b0-4719-a4f1-ff97d0a52117",
      },

      "cf3ac92f-f32f-42b5-bf77-15ecfa55f118": {
        attachment: null,
        author_user_uuid: "cbbafbd2-c80b-40f2-9167-c4bc7c999118",
        creation_date: "Wed, 13 May 2026 13:00:44 GMT",
        last_modified_date: "Wed, 13 May 2026 13:00:44 GMT",
        message: "bro accidentally created a real forum",
        uuid: "cf3ac92f-f32f-42b5-bf77-15ecfa55f118",
      },

      "3f55d26e-950d-4f4c-a9f2-b5a26d11f119": {
        attachment: null,
        author_user_uuid: "fe93db89-cf5f-49e3-a26e-1c9f2faeb119",
        creation_date: "Wed, 13 May 2026 13:01:28 GMT",
        last_modified_date: "Wed, 13 May 2026 13:01:28 GMT",
        message: "does this count as social media now",
        uuid: "3f55d26e-950d-4f4c-a9f2-b5a26d11f119",
      },

      "3b23ef95-f947-49f9-b1d8-8a70cb0c9120": {
        attachment: null,
        author_user_uuid: "edba56d7-b61d-4d66-9f0c-0ab0fbe99120",
        creation_date: "Wed, 13 May 2026 13:02:05 GMT",
        last_modified_date: "Wed, 13 May 2026 13:02:05 GMT",
        message: "i should be studying",
        uuid: "4b23ef95-f947-49f9-b1d8-8a70cb0c9120",
      },
      "9d113d6a-f32f-49f9-a9f2-8a40cb0c9120": {
        attachment: null,
        author_user_uuid: "edba56d7-b61d-4d66-9f0c-0ab0fbe99120",
        creation_date: "Wed, 13 May 2026 13:02:09 GMT",
        last_modified_date: "Wed, 13 May 2026 13:02:09 GMT",
        message: "Anyway heres the ukranian anthem Shche ne vmerla Ukraina, i slava, i volia! Shche nam, brattia-molodtsi, usmikhnet’sia dolia! Zahynut’ nashi vorohy, yak rosa na sontsi; Zapanujem i my, brattia, u svoïi storontsi! Dusheï v svitli svobodu, i vsem nam, brattia, yednyst’ nashu! Zhyttia nashu i voliu, i svobodu, brattia, pokhaiem! Nashe pravo, nashe slava, nashe velyke derzhavnyctvo! Shche ne vmerla Ukraina, i slava, i volia!",
        uuid: "4b23ef95-f947-49f9-b1d8-8a70cb0c9120",
      },
    },

    name: "hi",
    private: false,
  };

  const [fontsLoaded] = useFonts({
    "RobotoSlab-Regular": require("../../assets/fonts/RobotoSlab-Regular.ttf"),
    "NotoSans-Regular": require("../../assets/fonts/NotoSans-Regular.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

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
            {threadData.name}
          </Text>
            <Text
            style={{
              fontSize: 16,
              marginBottom: 10,
            }}
          >
            {threadData.description}
            {`\n`}
            {threadData.creation_date}
          </Text>

          <ScrollView>
            {Object.values(threadData.messages).map(
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
              {/* {JSON.stringify(threadData)} */}
            </Text>
          </ScrollView>
        </View>
      </SafeAreaView>
    </>
  );
}