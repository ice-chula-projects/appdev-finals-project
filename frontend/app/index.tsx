import { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, TextInput, ScrollView, Linking, Image, Alert, Modal, StyleSheet, useWindowDimensions, Platform, ActivityIndicator } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as SplashScreen from 'expo-splash-screen';
import * as ImagePicker from "expo-image-picker";
import { useFonts } from 'expo-font';
import { randomCreateThreadSubtitles } from '../components/randomSubtitles';
import BackEnd, { ThreadParametersBuilder, DisplayThread } from "../components/backend";
import { useAccount } from "@/components/accountContext";
import { useApiContext } from "@/components/ApiContext";

export default function Index() {
  const [createVisible, setCreateVisible] = useState(false);
  const [threadTitle, setThreadTitle] = useState("");
  const [threadDescription, setThreadDescription] = useState("");

  const [threadImage, setThreadImage] = useState<string | null>(null);
  const [createThreadError, setCreateThreadError] = useState("");
  const [threads, setThreads] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const [isPrivateThread, setIsPrivateThread] = useState(false);
  const [threadPassword, setThreadPassword] = useState("");

  const [createThreadSubtitle] = useState(() => randomCreateThreadSubtitles());

  const {logout} = useAccount();
  const {apiUrl} = useApiContext();

  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  const pickThreadImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required.", "Image gallery permission is required.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    })
    if (!result.canceled) setThreadImage(result.assets[0].uri);
  }

  const handleCreateThread = async () => {
    setCreateThreadError("");
    try {
      const sessionToken = await AsyncStorage.getItem("session_token");
      if (!sessionToken) {
        setCreateThreadError("Only registered users can create threads.");
        return;
      }

      if(!(await BackEnd.verifySessionToken(sessionToken)).success){
        Alert.alert("session token expired");
        if(Platform.OS == "web") alert("sesson token expired");

        logout();
        return;
      }

      const builder = new ThreadParametersBuilder()
        .setName(threadTitle || "Untitled Thread")
        .setDescription(threadDescription)
        .setThumbnailImageUri(threadImage ?? null)

      if (isPrivateThread) {
        if (!threadPassword || threadPassword.length === 0) {
          setCreateThreadError("A password is required for private threads.");
          return;
        }
        builder.setPassword(threadPassword);
      }

      const response = await BackEnd.createThread(sessionToken, builder);

      if (!response.success) {
        setCreateThreadError(response.message || "Failed to create thread.");
        return;
      }

      setThreadTitle("");
      setThreadDescription("");
      setThreadImage(null);

      setIsPrivateThread(false);
      setThreadPassword("");

      setCreateVisible(false);

      router.push(`/thread_page/${response.threadUuid}`);

    } catch (err) {
      console.error(err)
      setCreateThreadError("Could not connect to backend.");
    }
  }

  const searchThreads = async (query: string) => {
    try {
      setSearching(true);
      const response = await BackEnd.searchThreads(null, query);

      if (response.success) {
        setThreads(response.threads);
      } else {
        console.error(response.message);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      searchThreads(searchQuery);
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, apiUrl]);

  const [fontsLoaded] = useFonts({
    'RobotoSlab-Regular': require('../assets/fonts/RobotoSlab-Regular.ttf'),
    'NotoSans-Regular': require('../assets/fonts/NotoSans-Regular.ttf'),
    'RobotoSlab-Bold': require('../assets/fonts/RobotoSlab-Bold.ttf'),
    'NotoSans-Bold': require('../assets/fonts/NotoSans-Bold.ttf')
  })

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync()
  }, [fontsLoaded]);
  if (!fontsLoaded) return null;

  if (pageLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2f5ae9" />
      </View>
    )
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => (<Text style={styles.pageName}>Board of Mess</Text>),
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
                <Text style={styles.createThreadSubtitle}>{createThreadSubtitle}</Text>
                
<View style={styles.createThreadMargins}>
  <TouchableOpacity
    onPress={pickThreadImage}
    style={styles.threadImagePicker}
  >
    {threadImage ? (
      <Image
        source={{ uri: threadImage }}
        style={{ width: "100%", height: "100%" }}
      />
    ) : (
      <>
        <Ionicons name="image-outline" size={36} color="#8f8f8f" />
        <Text style={styles.imagePickerText}>Select Image</Text>
        {Platform.OS === "web" && ( <Text style={styles.imagePickerText}>(.png, .jpg, .jpeg, .gif)</Text> )}
      </>
    )}
  </TouchableOpacity>

  <View style={styles.threadInputsContainer}>
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

    <View style={styles.accessOption}>
      <TouchableOpacity
        onPress={() => setIsPrivateThread(!isPrivateThread)}
        style={styles.accessToggle}
      >
        <Ionicons
          name={isPrivateThread ? "lock-closed" : "lock-open"}
          size={18}
          color="#333"
        />
        <Text style={styles.accessText}>
          {isPrivateThread ? "Private" : "Public"}
        </Text>
      </TouchableOpacity>

      {isPrivateThread && (
        <TextInput
          placeholder="Thread Password"
          value={threadPassword}
          onChangeText={setThreadPassword}
          style={styles.threadPasswordInput}
          secureTextEntry
        />
      )}
    </View>
  </View>
</View>

{createThreadError ? (
                <Text style={styles.threadErrorText}>{createThreadError}</Text>
              ) : null}

<View style={styles.alignButtons}>
  <TouchableOpacity
    onPress={handleCreateThread}
    style={styles.confirmThreadButton}
  >
    <Text style={styles.threadButtonText}>Confirm</Text>
  </TouchableOpacity>

  <TouchableOpacity
    onPress={() => setCreateVisible(false)}
    style={styles.cancelThreadButton}
  >
    <Text style={styles.threadButtonText}>Cancel</Text>
  </TouchableOpacity>
</View>
            </View>
          </View>
        </Modal>

        <View style={styles.homepageContainer}>
          <View style={styles.threadTitleContainer}>
            <Text style={styles.threadsText}>Threads</Text>
            <TextInput
              placeholder="🔍︎ Search threads..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.threadsSearch}
            />
          </View>

          <View style={styles.divider}/>

          <ScrollView>
            {threads.map((thread: DisplayThread) => (
              <TouchableOpacity key={thread.uuid} onPress={() => router.push(`/thread_page/${thread.uuid}`)} style={styles.threadBox}>
                <View
                  style={styles.threadBoxContainer}>
                  {thread.thumbnailUri != null && <Image
                    source={thread.thumbnailUri}
                    style={styles.threadBoxImage}
                  />}
                  <View style={styles.threadBoxContent}>
                    <Text style={styles.threadBoxTitle}>{thread == null || thread.name == "" ? "Untitled Thread" : thread.name}</Text>
                    <Text style={styles.threadBoxDescription}>{thread.description ?? ""}</Text>
                    <Text style={styles.threadBoxPublicPrivateDescription}>{thread.private ? "\nPrivate 🔒" : "\nPublic 🔓" }</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity onPress={() => setCreateVisible(true)} style={styles.addThreadButton}>
            <Text style={styles.addThreadButtonText}>Add Thread</Text>
            <Ionicons name="add-circle" size={40} color="white" />
          </TouchableOpacity>

        </View>
      </SafeAreaView>
    </>
  )
}

  const styles = StyleSheet.create({
    pageName: {
      ...Platform.select({
        web: {
          fontSize: 35,
          marginLeft: 10,
          fontFamily: "NotoSans-Bold",
          letterSpacing: -1,
        },
        android: {
          color: "white"
        }
      })
    },
    createThreadBackground: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.45)",
      justifyContent: "center",
      alignItems: "center",
    },
    createThreadPopup: {
      width: "85%", // 85% on mobile devices, max 575 on web
      maxWidth: 575,
      maxHeight: "75%",
      backgroundColor: "white",
      borderRadius: 15,
      padding: 25,
      ...Platform.select({
        android: {
          padding: 15
        }
      })
    },
    createThreadText: {
      fontSize: 30,
      fontFamily: "RobotoSlab-Bold",
      letterSpacing: -1,
      marginBottom: 20,
      textAlign: "center",
      ...Platform.select({
        android: {
          fontSize: 25
        }
      })
    },
    createThreadSubtitle: {
      textAlign: "center",
      fontFamily: "RobotoSlab-Regular",
      fontSize: 15,
      color: "#505050",
      marginTop: -20,
      marginBottom: 5,
    },
    createThreadMargins: {
      flexDirection: "row",
      marginBottom: 10,
      alignItems: "flex-start",
      marginTop: 5
    },
    threadImagePicker: {
      width: "40%",
      maxWidth: 175,
      aspectRatio: 1,
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
      fontFamily: "NotoSans-Regular",
      ...Platform.select({
        android: {
          paddingTop: 2,
          paddingBottom: 2,
          paddingLeft: 5,
          paddingRight: 2,
          borderRadius: 5,
          fontSize: 10
        }
      })
    },
    threadDescInput: {
      minHeight: 90,
      borderWidth: 1,
      borderColor: "#ccc",
      borderRadius: 10,
      padding: 10,
      height: 65,
      textAlignVertical: "top",
      fontFamily: "NotoSans-Regular",
      ...Platform.select({
        android: {
          paddingTop: 2,
          paddingBottom: 2,
          paddingLeft: 5,
          paddingRight: 2,
          borderRadius: 5,
          fontSize: 10
        }
      })
    },

    alignButtons: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 15,
      marginLeft: 10,
      marginRight: 10,
      marginTop: 20,
    },
    cancelThreadButton: {
      flex: 1,
      backgroundColor: "#8b8b8b",
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: "center",
    },
    confirmThreadButton: {
      flex: 1,
      backgroundColor: "#004c9e",
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: "center",
    },
    threadButtonText: {
      fontWeight: "bold",
      color: "#ffffff",
      fontFamily: "NotoSans-Regular"
    },
    threadErrorText: {
      color: "#ff0000",
      textAlign: "center",
      marginBottom: 2,
      fontFamily: "NotoSans-Regular",
      ...Platform.select({
        android: {
          marginTop: 20,
          marginBottom: -12,
          fontSize: 12
        }
      })
    },
    addThreadButton: {
      flex: 1,
      position: "absolute",
      bottom: 25,
      right: 30,
      backgroundColor: "#003b7a",
      width: 150,
      height: 50,
      borderRadius: 15,
      borderColor: "#191e6e",
      borderWidth: 2,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      elevation: 5,
      shadowColor: "#000",
      shadowOpacity: 0.5,
      shadowRadius: 6,
      ...Platform.select({
        android: {
          bottom: 10,
          right: 15,
        }
      })
    },
    addThreadButtonText: {
      color: "white",
      fontSize: 15,
      marginRight: 5,
      fontFamily: "RobotoSlab-Bold"
    },
    accessOption: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 10,
      ...Platform.select({
        android: {
          marginLeft: -130
        }
      })
    },
    accessToggle: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    accessText: {
      marginLeft: 5,
      fontSize: 14,
      marginRight: 5,
      fontFamily: "NotoSans-Bold"
    },
    threadPasswordInput: {
      flex: 1,
      marginLeft: 10,
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderWidth: 1,
      borderColor: "#ccc",
      borderRadius: 5,
      fontSize: 14,
      fontFamily: "NotoSans-Regular",
      ...Platform.select({
        android: {
          fontSize: 10
        }
      })
    },
    homepageContainer: {
      flex: 1,
      paddingHorizontal: 30,
      paddingBottom: 20,
      paddingTop: 20,
      ...Platform.select({
        android: {
          paddingTop: 0
        }
      })
    },
    threadTitleContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 15,
    },
    threadsText: {
      fontSize: 24,
      marginRight: 15,
      fontFamily: "RobotoSlab-Bold"
    },
    threadsSearch: {
      flex: 1,
      borderWidth: 1,
      borderColor: "#ccc",
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      fontSize: 16,
      fontFamily: "NotoSans-Regular",
      elevation: 5,
      shadowColor: "#000",
      shadowOpacity: 0.3,
      shadowRadius: 6,
      ...Platform.select({
        android: {
          backgroundColor: "#f3f3f3",
          paddingVertical: 5
        }
      })
    },
    threadBox: {
      padding: 15,
      borderWidth: 1,
      borderColor: "#a7a7a7",
      borderRadius: 8,
      marginBottom: 15,
      marginLeft: 5,
      marginRight: 5,
      marginTop: 5,
      elevation: 5,
      shadowColor: "#000",
      shadowOpacity: 0.5,
      shadowRadius: 6,
      ...Platform.select({
        android: {
          backgroundColor: "#f3f3f3",
        }
      })
    },
    threadBoxContainer: {
      flexDirection: "row",
      alignItems: "center",

    },
    threadBoxImage: {
      width: 100,
      height: 100,
      marginRight: 15,
      borderRadius: 8
    },
    threadBoxContent: {
      flex: 1,
      justifyContent: "center",
    },
    threadBoxTitle: {
      fontSize: 25,
      fontWeight: "bold",
      color: "#007AFF",
      marginBottom: 5,
    },
    threadBoxDescription: {
      color: "#797979",
      fontSize: 15,
      fontFamily: "NotoSans-Regular"
    },
    threadBoxPublicPrivateDescription: {
      color: "#797979",
      fontSize: 12,
      fontFamily: "NotoSans-Regular"
    },
    divider: {
      height: 2,
      width: "100%",
      backgroundColor: "#a1a1a1",
      marginBottom:15,
    },
    threadInputsContainer: {
      flex: 1,
      justifyContent: "flex-start",
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#ffffff"
    }
  })