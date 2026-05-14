import { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, TextInput, ScrollView, Linking, Image, Alert, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import * as ImagePicker from "expo-image-picker";
import { useFonts } from 'expo-font';


export default function Index() {
  const [createVisible, setCreateVisible] = useState(false);
  const [threadTitle, setThreadTitle] = useState("");
  const [threadDescription, setThreadDescription] = useState("");
  const [threadImage, setThreadImage] = useState<string | null>(null);

  const pickThreadImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required.", "Image gallery permission is required.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1,1],
      quality: 0.7,
      base64: true,
    })
    if (!result.canceled) setThreadImage(result.assets[0].uri);
  }

  const handleCreateThread = () => {
    if (!threadTitle.trim()) {
      Alert.alert("Error!", "Please enter a thread title.");
      return;
    }
    if (!threadDescription.trim()) {
    Alert.alert("Error!", "Please enter a thread description.");
    return;
    }
    if (!threadImage) {
    Alert.alert("Error","Please select a thread image.");
    return;
    }
    console.log("Creating thread...");
    console.log({threadTitle, threadDescription, threadImage});
    setCreateVisible(false);
    setThreadTitle("");
    setThreadDescription("");
    setThreadImage(null);
  }

  const [threads, setThreads] = useState<any[]>([]);

  const [showCreateThread, setShowCreateThread] =
    useState(false);

  const [creatingThread, setCreatingThread] =
    useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const links = [
    {
      uuid: "preset-1",
      name: "Yall gotta see this",
      description: "Quintuple thumbs down.",
      url: "https://www.bilibili.tv/en/video/4799492271643648?bstar_from=bstar-web.homepage.recommend.all",
      image: require("../assets/images/HG2RsZhbIAAbpWj.jpg"),
    },
    {
      uuid: "preset-2",
      name: "Band of Brothers",
      description: "Don't grab the luger.",
      url: "https://archive.org/download/brockie/Band%20of%20Brothers%20%281080p%20x265%20Joy%29/",
      image: require("../assets/images/images.jpg"),
    },
    {
      uuid: "preset-3",
      name: "The Martian",
      description: "Matt Damian gets stuck in space. Again.",
      url: "https://www.bilibili.tv/en/video/2003112852?bstar_from=bstar-web.ugc-video-detail.related-recommend.all",
      image: require("../assets/images/18007564.jpg"),
    },
    {
      uuid: "preset-4",
      name: "Expo Router Docs",
      description: "Official documentation for Expo Router navigation.",
      url: "https://docs.expo.dev/router/introduction/",
      image: require("../assets/images/icon.png"),
    },
    {
      uuid: "preset-5",
      name: "Test Threads",
      description: "Testing if i can link threads.",
      url: "http://localhost:8081/thread_page/abb5916a-031b-41fd-bba6-8e8c706bca45",
      image: require("../assets/images/message_logo.png"),
    },
  ];

  const searchThreads = async (query: string) => {
    try {
      setSearching(true);

      const filteredPresets = links.filter(
        (thread) =>
          thread.name
            .toLowerCase()
            .includes(query.toLowerCase()) ||
          thread.description
            .toLowerCase()
            .includes(query.toLowerCase())
      );

      const response = await fetch(
        `http://localhost:5000/search_threads?search=${encodeURIComponent(query)}&page=1`
      );

      const data = await response.json();

      console.log("SEARCH THREADS:", data);

      if (response.ok) {
        const formattedThreads = data.threads.map(
          (thread: any) => ({
            uuid: thread.uuid,
            name: thread.name || thread.title,
            description: thread.description,
            url: `http://localhost:8081/thread_page/${thread.uuid}`,
            image: require("../assets/images/message_logo.png"),
          })
        );

        setThreads([
          ...filteredPresets,
          ...formattedThreads,
        ]);
      } else {
        console.log(data.error);

        setThreads(filteredPresets);
      }
    } catch (err) {
      console.log(err);

      const filteredPresets = links.filter(
        (thread) =>
          thread.name
            .toLowerCase()
            .includes(query.toLowerCase()) ||
          thread.description
            .toLowerCase()
            .includes(query.toLowerCase())
      );

      setThreads(filteredPresets);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      searchThreads(searchQuery);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const createThread = async () => {
    if (!threadTitle.trim()) return;

    try {
      setCreatingThread(true);

      const sessionToken =
        await AsyncStorage.getItem("session_token");

      const response = await fetch(
        "http://localhost:5000/create_thread",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "session-token": sessionToken || "",
          },
          body: JSON.stringify({
            name: threadTitle,
            description: threadDescription,
          }),
        }
      );

      const data = await response.json();

      console.log("CREATE THREAD:", data);

      if (response.ok) {
        const createdThread = {
          uuid: data.thread_uuid,
          name: threadTitle,
          description: threadDescription,
          url: `http://localhost:8081/thread_page/${data.thread_uuid}`,
          image: require("../assets/images/message_logo.png"),
        };

        setThreads((prev) => [
          createdThread,
          ...prev,
        ]);

        setThreadTitle("");
        setThreadDescription("");
        setShowCreateThread(false);
      } else {
        console.log(data.error);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setCreatingThread(false);
    }
  };

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
          
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Text
              style={{
                fontSize: 24,
                fontWeight: "bold",
                marginRight: 15,
              }}
            >
              Threads
            </Text>

            <TextInput
              placeholder="Search threads..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 8,
                fontSize: 16,
              }}
            />
          </View>

          <View
            style={{
              marginBottom: 20,
            }}
          >
            <TouchableOpacity
              onPress={() =>
                setShowCreateThread(
                  !showCreateThread
                )
              }
              style={{
                backgroundColor: "#007AFF",
                paddingVertical: 10,
                paddingHorizontal: 15,
                borderRadius: 10,
                marginBottom: 10,
                alignSelf: "flex-start",
              }}
            >
              <Text
                style={{
                  color: "white",
                  fontWeight: "bold",
                }}
              >
                {showCreateThread
                  ? "Close Thread Creator"
                  : "Create Thread"}
              </Text>
            </TouchableOpacity>

            {showCreateThread && (
              <View
                style={{
                  padding: 12,
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 10,
                }}
              >
                <TextInput
                  placeholder="Thread title..."
                  value={threadTitle}
                  onChangeText={setThreadTitle}
                  style={{
                    borderWidth: 1,
                    borderColor: "#ccc",
                    borderRadius: 8,
                    padding: 10,
                    marginBottom: 10,
                    fontSize: 16,
                  }}
                />

                <TextInput
                  placeholder="Thread description..."
                  value={threadDescription}
                  onChangeText={
                    setThreadDescription
                  }
                  multiline
                  style={{
                    height: 80,
                    borderWidth: 1,
                    borderColor: "#ccc",
                    borderRadius: 8,
                    padding: 10,
                    textAlignVertical: "top",
                    marginBottom: 10,
                    fontSize: 14,
                  }}
                />

                <TouchableOpacity
                  onPress={createThread}
                  disabled={creatingThread}
                  style={{
                    backgroundColor: "#34C759",
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "white",
                      fontWeight: "bold",
                    }}
                  >
                    {creatingThread
                      ? "Creating..."
                      : "Create Thread"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>


          <ScrollView>
            {threads.map((thread) => (
              <TouchableOpacity
                key={thread.uuid}
                onPress={() => Linking.openURL(thread.url)}
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
                    source={thread.image}
                    style={{ 
                      width: 100, 
                      height: 100, 
                      marginRight: 15,
                      borderRadius: 8
                    }}
                  />
              <View style={{ 
                flex: 1,
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
                  {thread.name}
                </Text>

                <Text
                  style={{
                    color: "gray",
                    fontSize: 14,
                  }}
                >
                  {thread.description}
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