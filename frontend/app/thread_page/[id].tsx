import { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, TextInput, ScrollView, Linking, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Button } from "@react-navigation/elements";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import Slider from "@react-native-community/slider";
import { Audio, ResizeMode, Video } from "expo-av";
import { useRef } from "react";
import BackEnd from "@/components/backend";
import {
  MessageParametersBuilder,
  MessageUpdateParametersBuilder,
  ThreadParametersBuilder,
  ThreadUpdateParametersBuilder,
  UserUpdateParametersBuilder,
  Attachment,
} from "@/components/backend";

export default function Index() {

  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  if (!id) {
  return (
    <SafeAreaView>
      <Text>Missing thread id</Text>
    </SafeAreaView>
  );
  }

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [currentUserUUID, setCurrentUserUUID] = useState("");
  const [deletingThread, setDeletingThread] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [threadData, setThreadData] = useState<any>(null);
  const [threadMessageData, setThreadMessageData] = useState<any>(null);

  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);

  const [showPostBox, setShowPostBox] = useState(false);

  const [loading, setLoading] = useState(true);  
  const [playingAudioIndex, setPlayingAudioIndex] = useState<number | null>(null);
  const [volume, setVolume] = useState(0.5);


  const [fontsLoaded] = useFonts({
    "RobotoSlab-Regular": require("../../assets/fonts/RobotoSlab-Regular.ttf"),
    "NotoSans-Regular": require("../../assets/fonts/NotoSans-Regular.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);


useEffect(() => {
  const fetchThread = async () => {
    const SESSION_TOKEN = await AsyncStorage.getItem("session_token");

    const STORED_USER_UUID = await AsyncStorage.getItem("user_uuid");

    if (STORED_USER_UUID) {
      setCurrentUserUUID(STORED_USER_UUID);
    }

    try {
const threadResponse =
  await BackEnd.getThread(
    String(id)
  );

if (!threadResponse.success) {
  console.log(threadResponse.message);
  return;
}

const messagesResponse =
  await BackEnd.getThreadMessages(
    SESSION_TOKEN!,
    String(id)
  );

if (!messagesResponse.success) {
  console.log(messagesResponse.message);
  return;
}

const data = threadResponse;
const dbtb = messagesResponse; 

const thread = data.thread;









let authorUsername = "Unknown User";

const storedUUID = await AsyncStorage.getItem("user_uuid");

if (storedUUID) {
  const creatorData = await BackEnd.getUsers([storedUUID]);

  if (creatorData.success) {
    authorUsername =
      creatorData.users?.[storedUUID]?.name ?? "Unknown User";
    
  }
}
thread.author_user_uuid = storedUUID
thread.authorUsername = authorUsername;

setThreadData(thread);
setThreadMessageData(dbtb);


    } catch (err) {
      console.log("Network error:", err);
    } finally {
      setLoading(false);
    }
  };

    if (id) fetchThread();
  }, [id]);

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

    const response =
      await BackEnd.createMessage(
        SESSION_TOKEN!,
        String(id),
        params
      );

    if (response.success) {
      const createdMessage = {
        author_user_uuid:
          currentUserUUID,
        authorUsername: "You",
        message: newPost,
        creation_date:
          new Date().toLocaleString(),
      };

      setThreadMessageData(
        (prev: any) => ({
          ...prev,
          messages: [
            createdMessage,
            ...prev.messages,
          ],
        })
      );

      setNewPost("");
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
      String(id)
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
            source={require("../../assets/images/default_profile.png")}
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
              fontWeight: "bold",
              marginBottom: 5,
            }}
          >
            {/* {id}
            {"  -  "} */}
            {threadData.name}
            {"  by  "}
            {threadData.authorUsername}
          </Text>
          </View>

          <Text
            style={{
              fontSize: 12,
              marginBottom: 5,
            }}
          >
            
            {"author id:  "}
            {threadData.author_user_uuid}
          </Text>
            <Text
            style={{
              fontSize: 12,
              marginBottom: 10,
            }}
          >
            {threadData.creation_date}
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

          {currentUserUUID === threadData.author_user_uuid && (
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

                <TouchableOpacity
                  onPress={submitPost}
                  disabled={posting}
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
                    {posting
                      ? "Posting..."
                      : "Post Message"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <ScrollView>
            {Object.values(threadMessageData.messages).map(
              (msg, index: number) => (
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
                    source={require("../../assets/images/default_profile.png")}
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
                    {msg.authorUsername}
                  </Text>

                  <Text
                    style={{
                      fontSize: 10,
                      marginBottom: 5,
                    }}
                  >
                    {"user id:  "}
                    {msg.author_user_uuid}
                  </Text>

                </View>

                  <Text
                    style={{
                      fontSize: 20,
                    }}
                  >
                    {msg.message}
                  </Text>

                  {/* add media player here. audio player + image viewer + video downloader w/ viewable thumbnail  */}
                                                <View
                                                  style={{
                                                    marginTop: 10,
                                                    gap: 5,
                                                  }}
                                                >

                                                  {/* IMAGE VIEWER */}
                                                  <Image
                                                    source={require("../../assets/images/18007564.jpg")}
                                                    style={{
                                                      width: 150,
                                                      height: 150,
                                                      borderRadius: 10,
                                                      resizeMode: "cover",
                                                    }}
                                                  />

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
                                                </View>



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
        </View>
      </SafeAreaView>
    </>
  );
}