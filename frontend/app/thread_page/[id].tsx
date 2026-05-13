import { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, router } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';

export default function ThreadPage() {
  const { id } = useLocalSearchParams();

  const [fontsLoaded] = useFonts({
    'RobotoSlab-Regular': require('../../assets/fonts/RobotoSlab-Regular.ttf'),
    'NotoSans-Regular': require('../../assets/fonts/NotoSans-Regular.ttf')
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  const thread = {
    id: id,
    title: "Dynamic Thread Page",
    description: "This thread was loaded dynamically from the browser URL.",
    image: require('../../assets/images/icon.png'),
    author: "Admin",
    date: "May 13, 2026",
  };

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
              Thread
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
            router.push('/');
          }}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>
            Back
          </Text>
        </TouchableOpacity>

        <View
          style={{
            flex: 1,
            paddingTop: 100,
            paddingHorizontal: 30,
          }}
        >
          <ScrollView>
            <View
              style={{
                padding: 20,
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 12,
                backgroundColor: "white",
              }}
            >
              <Image
                source={thread.image}
                style={{
                  width: "100%",
                  height: 300,
                  borderRadius: 12,
                  marginBottom: 20,
                }}
                resizeMode="cover"
              />

              <Text
                style={{
                  fontSize: 36,
                  fontWeight: "bold",
                  color: "#007AFF",
                  marginBottom: 10,
                }}
              >
                {thread.title}
              </Text>

              <Text
                style={{
                  color: "gray",
                  fontSize: 16,
                  marginBottom: 20,
                }}
              >
                Posted by {thread.author} • {thread.date}
              </Text>

              <Text
                style={{
                  fontSize: 20,
                  lineHeight: 30,
                  marginBottom: 30,
                }}
              >
                {thread.description}
              </Text>

              <View
                style={{
                  padding: 15,
                  backgroundColor: "#f2f2f2",
                  borderRadius: 10,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    marginBottom: 10,
                  }}
                >
                  Thread ID
                </Text>

                <Text
                  style={{
                    fontSize: 16,
                    color: "#007AFF",
                  }}
                >
                  {id}
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </>
  );
}