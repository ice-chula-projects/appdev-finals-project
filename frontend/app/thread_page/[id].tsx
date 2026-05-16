import { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, TextInput, ScrollView, Linking, Image, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Button } from "@react-navigation/elements";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import Slider from "@react-native-community/slider";
import { Audio, ResizeMode, Video } from "expo-av";
import { useRef } from "react";
import BackEnd, { DisplayThread, DisplayUser, MediaType, Message } from "@/components/backend";
import {
  MessageParametersBuilder,
  MessageUpdateParametersBuilder,
  ThreadParametersBuilder,
  ThreadUpdateParametersBuilder,
  UserUpdateParametersBuilder,
  Attachment,
} from "@/components/backend";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from "@expo/vector-icons";

export default function Index() {

  const params = useLocalSearchParams();
  const threadUuid = Array.isArray(params.id) ? params.id[0] : params.id;

  if (!threadUuid) {
    return (
      <SafeAreaView>
        <Text>Missing thread id</Text>
      </SafeAreaView>
    );
  }

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
const [threadAttachment, setThreadAttachment] =
  useState<any>(null);

const [threadImage, setThreadImage] =
  useState<string | null>(null);
 const [currentUserUuid, setCurrentUserUuid] = useState<string>(null);
  const [deletingThread, setDeletingThread] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [threadIsPrivate, setThreadIsPrivate] = useState(false);
  const [threadData, setThreadData] = useState<DisplayThread>(null);
  const [threadMessageData, setThreadMessageData] = useState<Message[]>([]);
  const [users, setUsers] = useState<Record<string, DisplayUser>>({});

  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);

  const [showPostBox, setShowPostBox] = useState(false);

  const [loading, setLoading] = useState(true);
  const [playingAudioIndex, setPlayingAudioIndex] = useState<number | null>(null);
  const [volume, setVolume] = useState(0.5);

  const [passwordError, setPasswordError] = useState("");
  const [threadPassword, setThreadPassword] = useState<string | null>(null);


  const [fontsLoaded] = useFonts({
    "RobotoSlab-Regular": require("../../assets/fonts/RobotoSlab-Regular.ttf"),
    "NotoSans-Regular": require("../../assets/fonts/NotoSans-Regular.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);


  useEffect(() => {
    if (threadUuid) fetchThread(threadPassword);
  }, [threadUuid]);

  const fetchThread = async (password?: string) => {
      const sessionToken = await AsyncStorage.getItem("session_token");
      const userUuid = await AsyncStorage.getItem("user_uuid");
      
      if (sessionToken == null || userUuid == null){
          return <View><Text>Error: you must be logged in to view a thread</Text></View>
      }

      setCurrentUserUuid(userUuid);

      try {
        const getThreadResponse = await BackEnd.getThread(String(threadUuid));

        if (!getThreadResponse.success) {
          Alert.alert("Error", getThreadResponse.message);
          if(Platform.OS == "web") alert(getThreadResponse.message);
          return <View><Text>Error: {getThreadResponse.message}</Text></View>;
        }
        const privateThread = getThreadResponse.thread.private;
        setThreadIsPrivate(privateThread);
        
        if(privateThread && password == null) return
        const getThreadMessagesResponse = await BackEnd.getThreadMessages(sessionToken,String(threadUuid), null, password);

        if (!getThreadMessagesResponse.success) {
          if (privateThread) setPasswordError(getThreadMessagesResponse.message)
          else {
            Alert.alert("Error", getThreadMessagesResponse.message);
            if (Platform.OS == "web") alert(getThreadMessagesResponse.message);
          }
          return
        }

        setThreadData(getThreadResponse.thread);
        setThreadMessageData(getThreadMessagesResponse.messages);

        const uniqueUserUuids = [... new Set([getThreadResponse.thread.authorUserUuid, ... getThreadMessagesResponse.messages.map(x=>x.authorUserUuid)])]
        const getUsersResponse = await BackEnd.getUsers(uniqueUserUuids);

        if (getUsersResponse.success){
          setUsers(getUsersResponse.users);
        }
      } catch (err) {
        console.log("Network error:", err);
      } finally {
        setLoading(false);
      }
    };

  const submitPost = async () => {
    const SESSION_TOKEN =
      await AsyncStorage.getItem(
        "session_token"
      );

    if (!newPost.trim()) return;

    try {
      setPosting(true);
      const params =
        new MessageParametersBuilder()
          .setMessage(newPost);

        if(threadAttachment != null)
          params.setAttachment(threadAttachment);

      const response =
        await BackEnd.createMessage(
          SESSION_TOKEN!,
          String(threadUuid),
          params,
          threadPassword
        );

      if (response.success) {

        fetchThread(threadPassword);
        setNewPost("");
        setThreadAttachment(null);
        setShowPostBox(false);
      } else {
        console.log(
          "Post error:",
          response.message
        );
      }
    } catch (err) {
      console.log(
        "Network error:",
        err
      );
    } finally {
      setPosting(false);
    }
  };

  const deleteThread = async () => {
    const SESSION_TOKEN = await AsyncStorage.getItem("session_token");
    if (!SESSION_TOKEN) return;

    setDeletingThread(true);

    try {
      const response = await BackEnd.deleteThread(
        SESSION_TOKEN,
        String(threadUuid)
      );

      if (response.success) {
        router.replace("/");
        return;
      }

    console.log("Delete error:", response.message);
  } catch (err) {
    console.log("Network error:", err);
  } finally {
    setDeletingThread(false);
    setConfirmDelete(false);
  }
};


  const pickAttachment = async () => {
  const permission =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    alert("Permission required");
    return;
  }

  const result =
    await ImagePicker.launchImageLibraryAsync({
      mediaTypes:
        ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 0.7,
      base64: true,
    });

  if (result.canceled) return;

  const asset = result.assets[0];
  const uri = asset.uri;

  let mediaType: MediaType = "application";

  console.log(asset.mimeType)
  if (asset.mimeType?.startsWith("image")) {
    mediaType = "image";
  } else if (
    asset.mimeType?.startsWith("audio")
  ) {
    mediaType = "audio";
  } else if (
    asset.mimeType?.startsWith("video")
  ) {
    mediaType = "video";
  }

  setThreadImage(
    mediaType === "image"
      ? uri
      : null
  );
  setThreadAttachment(await Attachment.fromAttachmentUri(uri, mediaType, asset.mimeType?.split("/")[1]));
};


  function AudioPlayer() {
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const [position, setPosition] = useState(0);
    const [duration, setDuration] = useState(1);

    useEffect(() => {
      return () => {
        if (sound) {
          sound.unloadAsync();
        }
      };
    }, [sound]);

    const changeVolume = async (value: number) => {
      setVolume(value);

      if (sound) {
        await sound.setVolumeAsync(value);
      }
    };

    const loadAudio = async () => {
      const { sound: newSound } = await Audio.Sound.createAsync(
        require("../../assets/audios/[Armroed Core] Sirius Executives.mp3"),
        {
          shouldPlay: false,
          volume: volume,
        }
      );

      newSound.setOnPlaybackStatusUpdate((status: any) => {
        if (!status.isLoaded) return;

        setPosition(status.positionMillis);
        setDuration(status.durationMillis || 1);
        setIsPlaying(status.isPlaying);

        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });

      setSound(newSound);

      return newSound;
    };

    const togglePlayback = async () => {
      let activeSound = sound;

      if (!activeSound) {
        activeSound = await loadAudio();
      }

      const status = await activeSound.getStatusAsync();

      if (!status.isLoaded) return;

      if (status.isPlaying) {
        await activeSound.pauseAsync();
      } else {
        await activeSound.playAsync();
      }
    };

    const stopAudio = async () => {
      if (!sound) return;

      await sound.stopAsync();
      await sound.setPositionAsync(0);

      setPosition(0);
      setIsPlaying(false);
    };

    const seekAudio = async (value: number) => {
      if (!sound) return;

      await sound.setPositionAsync(value);
      setPosition(value);
    };

    const formatTime = (millis: number) => {
      const totalSeconds = Math.floor(millis / 1000);

      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;

      return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
      <View>
        <Slider
          minimumValue={0}
          maximumValue={duration}
          value={position}
          onSlidingComplete={seekAudio}
        />

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 5,
          }}
        >
          <Text>{formatTime(position)}</Text>

          <Text>{formatTime(duration)}</Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <TouchableOpacity
            onPress={togglePlayback}
            style={{
              backgroundColor: "#007AFF",
              paddingVertical: 6,
              paddingHorizontal: 8,
              borderRadius: 8,
            }}
          >
            <Text
              style={{
                color: "white",
                fontWeight: "bold",
              }}
            >
              {isPlaying ? "Pause" : "Play"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={stopAudio}
            style={{
              backgroundColor: "#FF3B30",
              paddingVertical: 6,
              paddingHorizontal: 8,
              borderRadius: 8,
            }}
          >
            <Text
              style={{
                color: "white",
                fontWeight: "bold",
              }}
            >
              Stop
            </Text>
          </TouchableOpacity>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <TouchableOpacity
              onPress={async () => {
                let newVolume = Math.max(
                  0,
                  volume - 0.05
                );

                newVolume = Number(
                  newVolume.toFixed(2)
                );

                setVolume(newVolume);

                if (sound) {
                  await sound.setVolumeAsync(
                    newVolume
                  );
                }
              }}
              style={{
                backgroundColor: "#666",
                paddingVertical: 6,
                paddingHorizontal: 8,
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  color: "white",
                  fontWeight: "bold",
                  fontSize: 16,
                }}
              >
                -
              </Text>
            </TouchableOpacity>

            <Text
              style={{
                fontSize: 14,
                fontWeight: "bold",
                minWidth: 70,
                textAlign: "center",
              }}
            >
              Vol {volume.toFixed(2)}
            </Text>

            <TouchableOpacity
              onPress={async () => {
                let newVolume = Math.min(
                  1,
                  volume + 0.05
                );

                newVolume = Number(
                  newVolume.toFixed(2)
                );

                setVolume(newVolume);

                if (sound) {
                  await sound.setVolumeAsync(
                    newVolume
                  );
                }
              }}
              style={{
                backgroundColor: "#666",
                paddingVertical: 6,
                paddingHorizontal: 8,
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  color: "white",
                  fontWeight: "bold",
                  fontSize: 16,
                }}
              >
                +
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }
  if (!fontsLoaded) return null;

  if (!threadIsPrivate && (threadData == null || threadMessageData == null)) {
    return (
      <SafeAreaView>
        <Text>Loading thread...</Text>
      </SafeAreaView>
    );
  }

  if (threadIsPrivate && (threadData == null || threadMessageData == null)) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
        <View style={{ 
          width: "100%", 
          maxWidth: 400, 
          backgroundColor: "white", 
          borderRadius: 15, 
          padding: 25 
          }}>

          <Text style={{
            fontSize: 30, 
            fontWeight: "bold", 
            fontFamily: "RobotoSlab-Regular", 
            marginBottom: 6, 
            textAlign: "center" 
          }}>
            Private Thread
          </Text>

          <Text style={{ 
            textAlign: "center", 
            fontFamily: "NotoSans-Regular", 
            fontSize: 14, 
            color: "#505050", 
            marginBottom: 20 
          }}>
            A password is required to access this thread.
          </Text>

          <TextInput
            placeholder="Enter password"
            value={threadPassword}
            onChangeText={(text) => { setThreadPassword(text); setPasswordError(""); }}
            secureTextEntry
            style={{ 
              borderWidth: 1, 
              borderColor: passwordError ? "#ff0000" : "#ccc",
              borderRadius: 10, 
              padding: 10, 
              marginBottom: 6, 
              fontFamily: "NotoSans-Regular", 
              fontSize: 14 
          }} />

          {passwordError ? (
            <Text style={{ 
              color: "#ff0000", 
              fontFamily: "NotoSans-Regular", 
              fontSize: 13, 
              textAlign: "center", 
              marginBottom: 10 
            }}>
              {passwordError}
            </Text>
          ) : <View style={{ marginBottom: 16 }} />}

          <View style={{ flexDirection: "row", gap: 15 }}>

            <TouchableOpacity onPress={()=>{fetchThread(threadPassword)}} style={{ 
              flex: 1, 
              backgroundColor: "#0057b4", 
              paddingVertical: 14, 
              borderRadius: 8, 
              alignItems: "center" 
            }}>
              <Text style={{ 
                fontWeight: "bold",
                color: "white",
                fontFamily: "NotoSans-Regular"
              }}>
                Enter
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.replace("/")} style={{ 
              flex: 1, 
              backgroundColor: "#8b8b8b", 
              paddingVertical: 14, 
              borderRadius: 8, 
              alignItems: "center"
            }}>
              <Text style={{ 
                fontWeight: "bold", 
                color: "white", 
                fontFamily: "NotoSans-Regular" 
              }}>
              Go Back
            </Text>
            </TouchableOpacity>

          </View>
        </View>
      </SafeAreaView>
    )
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
                fontFamily: "NotoSans-Regular",
                marginLeft: 10
              }}
            >
              Threads
            </Text>
          ),
        }}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            paddingTop: 20,
            paddingHorizontal: 30,
          }}
        >


          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 6,
            }}
          >
            <Image
              source={users[threadData.authorUserUuid]?.profilePictureUri ?? require("../../assets/images/default_profile.png")}
              style={{
                width: 35,
                height: 35,
                borderRadius: 20,
                marginRight: 10,
              }}
            />

            <Text
              style={{
                fontSize: 24,
                marginBottom: 5,
              }}
            >
              {threadData.name}
            </Text>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "bold",
                marginBottom: 5,
              }}
            >by
            </Text>
            <Text
              style={{
                fontSize: 24,
                marginBottom: 5,
              }}
            >
              {users[threadData.authorUserUuid]?.name ?? "Unknown User"}
            </Text>
          </View>

          <Text
            style={{
              fontSize: 12,
              marginBottom: 5,
            }}
          >

            {"author id: "}
            {threadData.authorUserUuid}
          </Text>
          <Text
            style={{
              fontSize: 12,
              marginBottom: 10,
            }}
          >
            {threadData.creationDate.toString()}
            {`\n`}
          </Text>

          <Text
            style={{
              fontSize: 16,
              marginBottom: 10,
            }}
          >
            {threadData.description}
          </Text>

          {currentUserUuid === threadData.authorUserUuid && (
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 15 }}>
              {!confirmDelete ? (
                <TouchableOpacity
                  onPress={() => setConfirmDelete(true)}
                  disabled={deletingThread}
                  style={{
                    backgroundColor: "#FF3B30",
                    paddingVertical: 10,
                    paddingHorizontal: 15,
                    borderRadius: 10,
                    opacity: deletingThread ? 0.5 : 1,
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "bold" }}>
                    Delete Thread
                  </Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity
                    onPress={deleteThread}
                    disabled={deletingThread}
                    style={{
                      backgroundColor: "#FF3B30",
                      paddingVertical: 10,
                      paddingHorizontal: 15,
                      borderRadius: 10,
                      opacity: deletingThread ? 0.5 : 1,
                    }}
                  >
                    <Text style={{ color: "white", fontWeight: "bold" }}>
                      {deletingThread ? "Deleting..." : "Confirm Delete"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setConfirmDelete(false)}
                    disabled={deletingThread}
                    style={{
                      backgroundColor: "#888",
                      paddingVertical: 10,
                      paddingHorizontal: 15,
                      borderRadius: 10,
                      opacity: deletingThread ? 0.5 : 1,
                    }}
                  >
                    <Text style={{ color: "white", fontWeight: "bold" }}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          <View
            style={{
              marginBottom: 20,
            }}
          >
            <TouchableOpacity
              onPress={() => setShowPostBox(!showPostBox)}
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
                {showPostBox
                  ? "Close Post Box"
                  : "Create Post"}
              </Text>
            </TouchableOpacity>

            {showPostBox && (
              <View
                style={{
                  padding: 12,
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 10,
                }}
              >
                <TextInput
                  placeholder="Write a message..."
                  value={newPost}
                  onChangeText={setNewPost}
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

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >

                  <TouchableOpacity
                    onPress={pickAttachment}
                    style={{
                      width: 45,
                      height: 45,
                      borderRadius: 10,
                      backgroundColor: "#333",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name="attach-outline"
                      size={22}
                      color="#fff"
                    />
                  </TouchableOpacity>


                  <TouchableOpacity
                    onPress={submitPost}
                    disabled={posting}
                    style={{
                      flex: 1,
                      backgroundColor: "#34C759",
                      paddingVertical: 12,
                      borderRadius: 8,
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: posting ? 0.6 : 1,
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontWeight: "bold",
                      }}
                    >
                      {posting
                        ? "Posting..."
                        : "Post Message"}
                    </Text>
                  </TouchableOpacity>

                </View>

              </View>
            )}
          </View>

          <ScrollView>
            {Object.values(threadMessageData).map(
              (message: Message, index: number) => (
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

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >

                    <Image
                      source={users[message.authorUserUuid]?.profilePictureUri ?? require("../../assets/images/default_profile.png")}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 20,
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "bold",
                        marginBottom: 5,
                      }}
                    >
                      {users[message.authorUserUuid]?.name ?? "Unknown User"}
                    </Text>

                    <Text
                      style={{
                        fontSize: 10,
                        marginBottom: 5,
                      }}
                    >
                      {"user id:  "}
                      {message.authorUserUuid}
                    </Text>

                  </View>

                  <Text
                    style={{
                      fontSize: 20,
                    }}
                  >
                    {message.message}
                  </Text>

                  {/*add media player here. audio player + image viewer + video downloader w/ viewable thumbnail*/}
                  {message.attachment != null && <View
                    style={{
                      marginTop: 10,
                      gap: 5,
                    }}
                  >

                    {/* IMAGE VIEWER */}
                    {message.attachment.mediaType == "image" && <Image
                      source={`data:image/${message.attachment.extensionType == ""? "png" : message.attachment.extensionType};base64,${message.attachment.dataBase64}`}
                      style={{
                        width: 150,
                        height: 150,
                        borderRadius: 10,
                        resizeMode: "cover",
                      }}
                    />}

                    {/* AUDIO PLAYER */}
                    <View
                      style={{
                        borderWidth: 1,
                        borderColor: "#ccc",
                        borderRadius: 10,
                        padding: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontWeight: "bold",
                          marginBottom: 8,
                        }}
                      >
                        [Armored Core] Sirius Executives.mp3
                      </Text>

                      <AudioPlayer />
                    </View>
                  </View>}



                  <Text
                    style={{
                      color: "gray",
                      marginTop: 5,
                      fontSize: 12,
                    }}
                  >
                    {message.creationDate.toString()}
                  </Text>
                </View>
              )
            )}


          </ScrollView>
        </View>
      </SafeAreaView>
    </>
  );
}