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
      const bes = await fetch(
        `http://localhost:5000/get_thread?uuid=${id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "session-token": SESSION_TOKEN,
          },
        }
      );

      const cess = await fetch(
        `http://localhost:5000/get_thread_messages?uuid=${id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "session-token": SESSION_TOKEN,
          },
        }
      );

      const data = await bes.json();
      const dbtb = await cess.json();
      try {
  const creatorRes = await fetch(
    `http://localhost:5000/get_user_profile?uuid=${data.thread.author_user_uuid}`
  );

  const creatorData = await creatorRes.json();

  if (creatorRes.ok) {
    data.thread.author_username = creatorData.user.name;
  } else {
    data.thread.author_username = "Unknown User";
  }
} catch {
  data.thread.author_username = "Unknown User";
}

// get usernames for messages
const updatedMessages = await Promise.all(
  Object.values(dbtb.messages).map(async (msg: any) => {
    try {
      const userRes = await fetch(
        `http://localhost:5000/get_user_profile?uuid=${msg.author_user_uuid}`
      );

      const userData = await userRes.json();

      return {
        ...msg,
        author_username: userRes.ok
          ? userData.user.name
          : "Unknown User",
      };
    } catch {
      return {
        ...msg,
        author_username: "Unknown User",
      };
    }
  })
);

dbtb.messages = updatedMessages;
      if (bes.ok && cess.ok) {
        setThreadData(data);
        setThreadMessageData(dbtb);
      } else {
        console.log("Backend error:", data.error);
      }
    } catch (err) {
      console.log("Network error:", err);
    } finally {
      setLoading(false);
    }
  };

    if (id) fetchThread();
  }, [id]);

  const submitPost = async () => {
    const SESSION_TOKEN = await AsyncStorage.getItem("session_token");
    if (!newPost.trim()) return;

    try {
      setPosting(true);

      const res = await fetch(
        `http://localhost:5000/create_message?uuid=${encodeURIComponent(id.toString())}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "session-token": SESSION_TOKEN,
          },
          body: JSON.stringify({
            message: newPost,
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        const createdMessage = {
          author_user_uuid: "You", // Replace with actual user identifier if available
          message: newPost,
          creation_date: new Date().toLocaleString(),
        };

        setThreadMessageData((prev: any) => ({
          ...prev,
          messages: [
            createdMessage,
            ...prev.messages,
          ],
        }));

        setNewPost("");
        setShowPostBox(false);
      } else {
        console.log("Post error:", data.error);
      }
    } catch (err) {
      console.log("Network error:", err);
    } finally {
      setPosting(false);
    }
  };

const deleteThread = async () => {
  const SESSION_TOKEN = await AsyncStorage.getItem("session_token");

  try {
    setDeletingThread(true);

    const res = await fetch(
      `http://localhost:5000/delete_thread?uuid=${encodeURIComponent(id.toString())}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "session-token": SESSION_TOKEN,
        },
      }
    );

    const data = await res.json();

    if (res.ok) {
      router.replace("/");
    } else {
      console.log("Delete error:", data.error);
    }
  } catch (err) {
    console.log("Network error:", err);
  } finally {
    setDeletingThread(false);
    setConfirmDelete(false);
  }
};

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
            {threadData.thread.name}
            {"  by  "}
            {threadData.thread.author_username}
          </Text>
          </View>

          <Text
            style={{
              fontSize: 12,
              marginBottom: 5,
            }}
          >
            
            {"author id:  "}
            {threadData.thread.author_user_uuid}
          </Text>
            <Text
            style={{
              fontSize: 12,
              marginBottom: 10,
            }}
          >
            {threadData.thread.creation_date}
            {`\n`}
          </Text>

          <Text
            style={{
              fontSize: 16,
              marginBottom: 10,
            }}
          >
            {threadData.thread.description}
          </Text>

          {currentUserUUID ===
            threadData.thread.author_user_uuid && (
            <View
              style={{
                flexDirection: "row",
                gap: 10,
                marginBottom: 15,
              }}
            >
              {!confirmDelete  ? (
                <TouchableOpacity
                  onPress={() => setConfirmDelete(true)}
                  style={{
                    backgroundColor: "#FF3B30",
                    paddingVertical: 10,
                    paddingHorizontal: 15,
                    borderRadius: 10,
                  }}
                >
                  <Text
                    style={{
                      color: "white",
                      fontWeight: "bold",
                    }}
                  >
                    Delete Thread
                  </Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity
                    onPress={deleteThread}
                    style={{
                      backgroundColor: "#FF3B30",
                      paddingVertical: 10,
                      paddingHorizontal: 15,
                      borderRadius: 10,
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontWeight: "bold",
                      }}
                    >
                      Confirm Delete
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setConfirmDelete(false)}
                    style={{
                      backgroundColor: "#888",
                      paddingVertical: 10,
                      paddingHorizontal: 15,
                      borderRadius: 10,
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontWeight: "bold",
                      }}
                    >
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
                    {msg.author_username}
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
              {/* {JSON.stringify(threadMessageData)} */}
            </Text>
          </ScrollView>
        </View>
      </SafeAreaView>
    </>
  );
}