import { useState, useEffect } from "react";
import {Text, View, TouchableOpacity, TextInput, ScrollView, Linking} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import { Button } from "@react-navigation/elements";
import * as SplashScreen from 'expo-splash-screen'
import { useFonts } from 'expo-font'

export default function Index() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const links = [
    {
      title: "Project Hail Mary",
      description: "Amaze Amaze Amaze",
      url: "https://www.bilibili.tv/en/video/4799492271643648?bstar_from=bstar-web.homepage.recommend.all",
    },
    {
      title: "Band of Brothers",
      description: "Don't grab the luger.",
      url: "https://archive.org/download/brockie/Band%20of%20Brothers%20%281080p%20x265%20Joy%29/",
    },
    {
      title: "The Martian",
      description: "How is there storm on mars?",
      url: "https://www.bilibili.tv/en/video/2003112852?bstar_from=bstar-web.ugc-video-detail.related-recommend.all",
    },
    {
      title: "Expo Router Docs",
      description: "Official documentation for Expo Router navigation.",
      url: "https://docs.expo.dev/router/introduction/",
    },
  ];

  const [fontsLoaded] = useFonts({
    'RobotoSlab-Regular': require('../assets/fonts/RobotoSlab-Regular.ttf'),
  })

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync()
  }, [fontsLoaded]);
  if (!fontsLoaded) return null;

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
            router.push('/auth/signup_page');
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
              marginBottom: 20,
            }}
          >
            Threads
          </Text>

          <ScrollView>
            {links.map((link, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => Linking.openURL(link.url)}
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
                    fontSize: 18,
                    fontWeight: "bold",
                    color: "#007AFF",
                    marginBottom: 5,
                  }}
                >
                  {link.title}
                </Text>

                <Text
                  style={{
                    color: "gray",
                    fontSize: 14,
                  }}
                >
                  {link.description}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </SafeAreaView>
    </>
  );
}