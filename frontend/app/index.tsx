import { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, TextInput, ScrollView, Linking, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import { Button } from "@react-navigation/elements";
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';


export default function Index() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const links = [
    {
      title: "Yall gotta see this",
      description: "Quintuple thumbs down.",
      url: "https://www.bilibili.tv/en/video/4799492271643648?bstar_from=bstar-web.homepage.recommend.all",
      image: require("../assets/images/HG2RsZhbIAAbpWj.jpg"),
    },
    {
      title: "Band of Brothers",
      description: "Don't grab the luger.",
      url: "https://archive.org/download/brockie/Band%20of%20Brothers%20%281080p%20x265%20Joy%29/",
      image: require("../assets/images/images.jpg"),
    },
    {
      title: "The Martian",
      description: "Matt Damian gets stuck in space. Again.",
      url: "https://www.bilibili.tv/en/video/2003112852?bstar_from=bstar-web.ugc-video-detail.related-recommend.all",
      image: require("../assets/images/18007564.jpg"),
    },
    {
      title: "Expo Router Docs",
      description: "Official documentation for Expo Router navigation.",
      url: "https://docs.expo.dev/router/introduction/",
      image: require("../assets/images/icon.png"),
    },
    {
      title: "Test Threads",
      description: "Testing if i can link threads.",
      url: "http://localhost:8081/thread_page/19732",
      image: require("../assets/images/message_logo.png"),
    },
  ];

  const [fontsLoaded] = useFonts({
    'RobotoSlab-Regular': require('../assets/fonts/RobotoSlab-Regular.ttf'),
    'NotoSans-Regular': require('../assets/fonts/NotoSans-Regular.ttf')
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
                fontSize: 35,
                fontWeight: "bold",
                marginLeft: 10,
                fontFamily: "NotoSans-Regular"
              }}
            >
              Board of Mess
            </Text>
          ),
        }}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={{
            flex: 1,
            paddingTop: 30,
            paddingHorizontal: 30,
          }}
        >
          
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
                <View 
                  style={{ 
                  flexDirection: "row", 
                  alignItems: "center" 
                  }}>
                  <Image
                    source={link.image}
                    style={{ 
                      width: 100, 
                      height: 100, 
                      marginRight: 15,
                      borderRadius: 8
                    }}
                  />
              <View style={{ 
                width: 500,
                height: 50,
                justifyContent: "center", 
                }}>
                <Text
                  style={{
                    fontSize: 25,
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
              </View>
              </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </SafeAreaView>
    </>
  );
}