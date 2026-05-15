import { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, TextInput, ScrollView, Linking, Image, Alert, Modal, StyleSheet } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Paths } from "expo-file-system";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as SplashScreen from 'expo-splash-screen';
import * as ImagePicker from "expo-image-picker";
import { useFonts } from 'expo-font';

const GLOBAL_URL = "http://localhost:5000/"

export default function Index() {
  const [createVisible, setCreateVisible] = useState(false);
  const [threadTitle, setThreadTitle] = useState("");
  const [threadDescription, setThreadDescription] = useState("");
  const [threadImage, setThreadImage] = useState<string | null>(null);
  const [createThreadError, setCreateThreadError] = useState("");
  const [loginPopupVisible, setLoginPopupVisible] = useState(false);
  const [threads, setThreads] = useState<any[]>([]);
  const [showCreateThread, setShowCreateThread] = useState(false);
  const [creatingThread, setCreatingThread] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

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

  const handleCreateThread = async () => {
    setCreateThreadError("");

    if (!threadTitle.trim()) {
      setCreateThreadError("Please enter a thread title.");
      return;
    }
    if (!threadDescription.trim()) {
      setCreateThreadError("Please enter a thread description.");
      return;
    }
    if (!threadImage) {
      setCreateThreadError("Please select a thread image.");
      return;
    }

    try {
      const sessionToken = await AsyncStorage.getItem("session_token");
      if (!sessionToken) {
        setCreateThreadError("Only registered users can create threads.");
        return;
      }
      const file = new File(threadImage);
      const imageBase64 = await file.base64();

      const response = await fetch(GLOBAL_URL+"create_thread", {
        method: "POST",
        headers: {"Content_Type": "application/json", "session-token": sessionToken},
        body: JSON.stringify({name: threadTitle, description: threadDescription, thumbnail_base64: `data:image/jpeg;base64,${imageBase64}`})
      })

      const data = await response.json();
      console.log("CREATE THREAD:", data);

      if (!response.ok) {
        setCreateThreadError(data.error || "Failed to create thread.");
        return;
      }
      const createdThread = {
        uuid: data.thread_uuid,
        name: threadTitle,
        description: threadDescription,
        url: `http://localhost:8081/thread_page/${data.thread_uuid}`,
        image: {uri: threadImage}
      }

      setThreads((prev) => [
        createdThread,
        ...prev
      ])

      setThreadTitle("");
      setThreadDescription("");
      setThreadImage(null);
      setCreateVisible(false);
      setCreateThreadError("");
    } catch (err) {
      console.log("Error:",err);
      setCreateThreadError("Could not connect to backend.");
    }
  }

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

  const [fontsLoaded] = useFonts({
    'RobotoSlab-Regular': require('../assets/fonts/RobotoSlab-Regular.ttf'),
    'NotoSans-Regular': require('../assets/fonts/NotoSans-Regular.ttf')
  })

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync()
  }, [fontsLoaded]);
  if (!fontsLoaded) return null;

  const styles = StyleSheet.create({
    pageName: {
      fontSize: 35,
      fontWeight: "bold",
      marginLeft: 10,
      fontFamily: "NotoSans-Regular",
    },
    createThreadBackground: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        justifyContent: "center",
        alignItems: "center",
    },
    createThreadPopup: {
      width: "45%",
      height: "45%",
      backgroundColor: "white",
      borderRadius: 15,
      padding: 25,
    },
    createThreadText: {
      fontSize: 30,
      fontWeight: "bold",
      fontFamily: "RobotoSlab-Regular",
      marginBottom: 20,
      textAlign: "center",
    },
    createThreadMargins: {
      flexDirection: "row",
      margin: 10,
      marginBottom: 20,
    },
    threadImagePicker: {
      width: 200,
      height: 200,
      borderWidth: 1,
      borderColor: "#ccc",
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
      marginRight: 15,
    },
    imagePickerText: {
      color: "gray",
      fontSize: 12,
      marginTop: 3,
      textAlign: "center",
      fontFamily: "NotoSans-Regular"
    },
    threadNameInput: {
      borderWidth: 1,
      borderColor: "#ccc",
      borderRadius: 10,
      padding: 10,
      marginBottom: 10,
      fontFamily: "NotoSans-Regular"
    },
    threadDescInput: {
      borderWidth: 1,
      borderColor: "#ccc",
      borderRadius: 10,
      padding: 10,
      height: 65,
      textAlignVertical: "top",
      fontFamily: "NotoSans-Regular",
    },

    alignButtons: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    cancelThreadButton: {
      flex: 1,
      backgroundColor: "#afafaf",
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: "center",
      marginRight: 10,
    },
    cancelThreadText: {
      fontWeight: "bold",
      fontFamily: "NotoSans-Regular"
    },
    confirmThreadButton: {
      flex: 1,
      backgroundColor: "#007AFF",
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: "center",
    },
    confirmThreadText: {
      fontWeight: "bold",
      color: "#ffffff",
      fontFamily: "NotoSans-Regular"
    },
    threadErrorText: {

    }
  })

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => ( <Text style={styles.pageName}>Board of Mess</Text> ),
        }}
      />

      <SafeAreaView style={{ flex: 1 }}>

        <Modal
          visible={createVisible}
          animationType="fade"
          transparent
          onRequestClose={() => setCreateVisible(false)}
        >
          <View style={styles.createThreadBackground}>
            <View style={styles.createThreadPopup}>
              <Text style={styles.createThreadText}>Create Thread</Text>
              <View style={styles.createThreadMargins}>
                <TouchableOpacity onPress={pickThreadImage} style={styles.threadImagePicker}>
                  {threadImage ? (
                    <Image source={{ uri: threadImage }} style={{ width: "100%", height: "100%"}}/>
                  ) : (
                    <>
                      <Ionicons name="image-outline" size={36} color="#8f8f8f" />
                      <Text style={styles.imagePickerText}>Select Image</Text>
                    </>
                  )}
                </TouchableOpacity>

                <View style={{ flex: 1 }}>
                  <TextInput
                    placeholder="Thread Title"
                    value={threadTitle}
                    onChangeText={setThreadTitle}
                    style={styles.threadNameInput}
                  />
                  <TextInput
                    placeholder="Description"
                    value={threadDescription}
                    onChangeText={setThreadDescription}
                    style={styles.threadDescInput}
                    multiline
                  />
                </View>
              </View>

              <View style={styles.alignButtons}>

                {createThreadError ? (
                  <Text style={styles.threadErrorText}>{createThreadError}</Text>
                ) : null }

                <TouchableOpacity
                onPress={() => setCreateVisible(false)}
                style={styles.cancelThreadButton}
                >
                  <Text style={styles.cancelThreadText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleCreateThread}
                  style={styles.confirmThreadButton}
                >
                  <Text style={styles.confirmThreadText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

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
              <TouchableOpacity
                onPress={() => setCreateVisible(true)}
                style={{
                position: "absolute",
                bottom: 30,
                right: 25,
                backgroundColor: "#007AFF",
                width: 150,
                height: 50, 
                borderRadius: 20,
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                elevation: 5,
              }}
            >
              <Text style={{ color: "white", fontSize: 15, fontWeight: "bold", marginRight: 8}}>Add Thread</Text>
              <Ionicons name="add-circle" size={40} color="white" />
            </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}