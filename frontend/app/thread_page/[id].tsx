import { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, TextInput, ScrollView, Linking, Image, Alert, Platform, Button } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router, useLocalSearchParams } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import BackEnd, { DisplayThread, DisplayUser, MediaType, Message } from "@/components/backend";
import {
  MessageParametersBuilder,
  MessageUpdateParametersBuilder,
  ThreadParametersBuilder,
  ThreadUpdateParametersBuilder,
  UserUpdateParametersBuilder,
  Attachment,
} from "@/components/backend";
import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from "@expo/vector-icons";
import { File, Paths } from "expo-file-system";
import * as LegacyFileSystem from "expo-file-system/legacy";

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
  
  const [threadAttachment, setThreadAttachment] = useState<any>(null);
  const [threadImage, setThreadImage] = useState<string | null>(null);

  const [currentUserUuid, setCurrentUserUuid] = useState<string>(null);
  const [deletingThread, setDeletingThread] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [threadIsPrivate, setThreadIsPrivate] = useState(false);
  const [threadIsFavorited, setThreadIsFavorited] = useState(false);
  const [threadData, setThreadData] = useState<DisplayThread>(null);
  const [threadMessageData, setThreadMessageData] = useState<Message[]>([]);
  const [users, setUsers] = useState<Record<string, DisplayUser>>({});

  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);

  const [NewTitle, setNewTitle] = useState("");
  const [NewDescription, setNewDescription] = useState("");
  const [ThreadDesc, setThreadDesc] = useState(false);

  const [showPostBox, setShowPostBox] = useState(false);
  const [showSecondPostBox, setShowSecondPostBox] = useState(false);

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
          return
      }

      if (!BackEnd.isApiAvailable()) await new Promise((resolve) => setTimeout(resolve, 150)) 

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
      
        const getUserProfileResponse = await BackEnd.getUserProfile(userUuid);
        if (getUserProfileResponse.success){
          setThreadIsFavorited(getUserProfileResponse.userProfile.savedThreads.includes(threadUuid))
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
      }
    };

    const submitChange = async () => {
      const SESSION_TOKEN =
        await AsyncStorage.getItem(
          "session_token"
        );


        const parameters = new ThreadUpdateParametersBuilder();
        if(NewTitle != null && NewTitle != "") parameters.setName(NewTitle);
        if(NewDescription != null && NewDescription != "") parameters.setDescription(NewDescription);

        const updateThreadResponse =await BackEnd.updateThread(SESSION_TOKEN, threadUuid, parameters);

        if(updateThreadResponse.success){
          fetchThread(threadPassword);

          setNewTitle("");
          setNewDescription("");
          setShowSecondPostBox(false);
        }
    }

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
        setNewPost("");
        setThreadAttachment(null);
        setShowPostBox(false);
        fetchThread(threadPassword);

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
  const result =
    await DocumentPicker.getDocumentAsync({
      type: "*/*",
      copyToCacheDirectory: true,
      multiple: false,
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

async function saveAttachmentAs(
    attachment: Attachment,
    defaultFileName: string = "attachment"
) {
    const fileName =
        `${defaultFileName}.${attachment.extensionType}`;

    //
    // WEB
    //
    if (Platform.OS === "web") {
        // Convert base64 -> bytes
        const binaryString = atob(attachment.dataBase64);

        const bytes = new Uint8Array(binaryString.length);

        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Create blob
        const blob = new Blob([bytes]);

        // Create download link
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);

        return;
    }

    //
    // ANDROID
    //
    if (Platform.OS === "android") {
        const permissions =
            await LegacyFileSystem.StorageAccessFramework
                .requestDirectoryPermissionsAsync();

        if (!permissions.granted) {
            return;
        }

        const mimeType =
            getMimeType(attachment.extensionType);

        const uri =
            await LegacyFileSystem.StorageAccessFramework
                .createFileAsync(
                    permissions.directoryUri,
                    defaultFileName,
                    mimeType
                );

        await LegacyFileSystem.writeAsStringAsync(
            uri,
            attachment.dataBase64,
            {
                encoding: LegacyFileSystem.EncodingType.Base64,
            }
        );

        return;
    }

    //
    // IOS
    //
    // iOS has no true save dialog.
    // Save into app documents folder instead.
    const file = new File(Paths.document, fileName);

    file.write(attachment.dataBase64, {
        encoding: "base64",
    });

    return file;
}

function getMimeType(extension: string): string {
    switch (extension.toLowerCase()) {
        case "png":
            return "image/png";

        case "jpg":
        case "jpeg":
            return "image/jpeg";

        case "gif":
            return "image/gif";

        case "pdf":
            return "application/pdf";

        case "txt":
            return "text/plain";

        case "mp4":
            return "video/mp4";

        case "mp3":
            return "audio/mpeg";

        default:
            return "application/octet-stream";
    }
}

async function favorite(){
  const sessionToken = await AsyncStorage.getItem("session_token");

  if(sessionToken == null) return;

  if(!threadIsFavorited){
    const saveThreadResponse = await BackEnd.saveThread(sessionToken, threadUuid);
    if(saveThreadResponse.success) setThreadIsFavorited(true)
  } else {
    const unsaveThreadResponse = await BackEnd.unsaveThread(sessionToken, threadUuid);
    if(unsaveThreadResponse.success) setThreadIsFavorited(false)
}
}

  if (!fontsLoaded) return null;

  if(currentUserUuid == null){
    return <View><Text>You must be logged in to view thread messages</Text></View>
  }

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
            <Text style={{ fontSize: 40, fontWeight: "bold", fontFamily: "NotoSans-Regular", marginLeft: 10 }}>Threads</Text>
          ),
        }}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingTop: 20, paddingHorizontal: 30, paddingBottom: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
            <Image
              source={users[threadData.authorUserUuid]?.profilePictureUri ?? require("../../assets/images/default_profile.png")}
              style={{
                width: 35,
                height: 35,
                borderRadius: 20,
                marginRight: 10,
              }}
            />

            <Text style={{ fontSize: 24, marginBottom: 5, fontWeight: "bold", fontFamily: "NotoSans-Regular" }}>"{threadData.name}"</Text>
            <Text style={{fontSize: 24, marginBottom: 5, fontFamily: "NotoSans-Regular" }}>by</Text>
            <Text style={{ fontSize: 24, marginBottom: 5, fontFamily: "NotoSans-Regular" }}>{users[threadData.authorUserUuid]?.name ?? "Unknown User"}</Text>

            <View style={{ alignItems: "flex-end" }}>
              <TouchableOpacity onPress={favorite} style={{marginLeft: 5, marginBottom: 5}}>
                <Ionicons name={threadIsFavorited? "star" : "star-outline"} size={30} color="#ffa600ff"></Ionicons>
              </TouchableOpacity>
          </View>

          </View>

          <Text style={{ fontSize: 12, marginTop: 5, fontFamily: "NotoSans-Regular", color: "#8d8d8d" }}>
            ("Author ID: "{threadData.authorUserUuid}) 
          </Text>

          <Text style={{ fontSize: 12, marginBottom: 10, marginTop: 5, fontFamily: "NotoSans-Regular", color: "#8d8d8d" }}>
            {threadData.creationDate.toString()}
            {`\n`}
          </Text>

          <Text style={{ fontSize: 16,marginBottom: 10, fontFamily: "NotoSans-Regular" }}>{threadData.description}</Text>

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
                  <Text style={{ color: "white", fontWeight: "bold", fontFamily: "NotoSans-Regular" }}>
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
                    <Text style={{ color: "white", fontWeight: "bold", fontFamily: "NotoSans-Regular" }}>
                      {deletingThread ? "Deleting..." : "Confirm?"}
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
                      opacity: deletingThread ? 0.5 : 1
                    }}
                  >
                    <Text style={{ color: "white", fontWeight: "bold", fontFamily: "NotoSans-Regular" }}>Cancel</Text>
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
                marginBottom: 12,
                alignSelf: "flex-start",
              }}
            >
              <Text style={{ color: "white", fontWeight: "bold", fontFamily: "NotoSans-Regular"}}>{showPostBox ? "Close Post Box" : "Create Post"}</Text>
            </TouchableOpacity>

            {showPostBox && (
              <View
                style={{
                  padding: 12,
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 10,
                  elevation: 5,
                  shadowColor: "#000000",
                  shadowOpacity: 0.3,
                  shadowRadius: 6,
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
                    fontFamily: "NotoSans-Regular"
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
                    <Ionicons name="attach-outline" size={22} color="#fff"/>
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
                    <Text style={{ color: "white", fontWeight: "bold", fontFamily: "NotoSans-Regular"}}>{posting ? "Posting..." : "Post Message"}</Text>
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
                    elevation: 5,
                    shadowColor: "#000000",
                    shadowOpacity: 0.3,
                    shadowRadius: 6,
                    marginTop: 10,
                    marginLeft: 5,
                    marginRight: 10
                  }}
                >

                  <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 }}>

                    <Image
                      source={users[message.authorUserUuid]?.profilePictureUri ?? require("../../assets/images/default_profile.png")}
                      style={{ width: 30, height: 30, borderRadius: 20, borderWidth: 1, borderColor: "#636363" }}
                    />
                    <Text style={{ fontSize: 15, fontWeight: "bold", marginBottom: 5, fontFamily: "NotoSans-Regular" }}>
                      {users[message.authorUserUuid]?.name ?? "Unknown User"}
                    </Text>

                    <Text style={{ fontSize: 13, marginBottom: 5, fontFamily: "NotoSans-Regular", color: "#5f5f5f" }}>("User id: "{message.authorUserUuid})</Text>
                  </View>

                  <Text style={{ fontSize: 20, marginTop: 5 }}>
                    {message.message}
                  </Text>

                  {message.attachment != null && <View style={{marginTop: 10, gap: 5 }}>

                    {message.attachment.mediaType == "image" && <Image
                      source={`data:image/${message.attachment.extensionType == ""? "png" : message.attachment.extensionType};base64,${message.attachment.dataBase64}`}
                      style={{
                        width: 200,
                        height: 200,
                        aspectRatio: 1,
                        borderRadius: 8,
                        resizeMode: "stretch",
                      }}
                    />}

                    {message.attachment.mediaType != "image" && <View style={{width:210}}>
                      <TouchableOpacity onPress={()=>{saveAttachmentAs(message.attachment)}} 
                      style={{
                        fontFamily: "NotoSans-Regular",
                        backgroundColor: "#0099ff",
                        color: "#ffffff",
                        fontWeight: "bold",
                        alignItems: "center",
                        paddingVertical: 5,
                        paddingHorizontal: 10,
                        borderRadius: 5,
                        }}>
                        Download Attachment
                      </TouchableOpacity>
                    </View>}

                  </View>}

                  <Text style={{color: "gray", marginTop: 7, fontSize: 12, fontFamily: "NotoSans-Regular"}}>
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