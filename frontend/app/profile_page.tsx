import { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, TextInput, ScrollView, Linking, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import { Button } from "@react-navigation/elements";
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';


export default function Index() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const links = [
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

          <View
            style={{
              alignItems: "center",
              marginBottom: 25,
              borderWidth: 1,
              borderColor: "#ccc",
              borderRadius: 8,
              padding: 20,
            }}
          >
            <Image
              source={require("../assets/images/HG2RsZhbIAAbpWj.jpg")}
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                marginBottom: 15,
              }}
            />

            <Text
              style={{
                fontSize: 30,
                fontWeight: "bold",
                fontFamily: "RobotoSlab-Regular",
              }}
            >
              Porrapat
            </Text>

            <Text
              style={{
                color: "gray",
                marginTop: 5,
                marginBottom: 10,
              }}
            >
              e89883ed-f8b1-482f-a024-fd28beb286c6
            </Text>

            <Text
              style={{
                textAlign: "center",
                fontFamily: "NotoSans-Regular",
              }}
            >
              Why are you here.
            </Text>
            </View>
          <Text
            style={{
              fontSize: 36,
              fontWeight: "bold",
              marginBottom: 20,
              textAlign: "center",
            }}
          >
            Profile
          </Text>

        <ScrollView>
            {links.map((link, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => Linking.openURL(link.url)}
                style={{
                  padding: 5,
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 2,
                  marginBottom: 5,
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
                      width: 75, 
                      height: 75, 
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