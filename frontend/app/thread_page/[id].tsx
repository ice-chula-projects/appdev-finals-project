import { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, TextInput, ScrollView, Linking, Image, Alert, Platform, Button, StyleSheet } from "react-native";
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
import { useAccount } from "@/components/accountContext";

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
  const [savedThreadPassword, setSavedThreadPassword] = useState<string | null>(null);

  const [fontsLoaded] = useFonts({
    "RobotoSlab-Regular": require("../../assets/fonts/RobotoSlab-Regular.ttf"),
    "NotoSans-Regular": require("../../assets/fonts/NotoSans-Regular.ttf"),
  });

  const { logout } = useAccount();

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  useEffect(()=>{
    (async ()=>{
      const password = await AsyncStorage.getItem("last_password")
      if(password != null) setSavedThreadPassword(password);
    })()
  }, [])

  useEffect(() => {
    if (threadUuid) fetchThread(savedThreadPassword);
  }, [threadUuid]);

  useEffect(() => {
    if (threadUuid && threadIsPrivate) fetchThread(savedThreadPassword);
  }, [savedThreadPassword, threadIsPrivate]);

  async function fetchThread(password?: string) {
    const sessionToken = await AsyncStorage.getItem("session_token");
    const userUuid = await AsyncStorage.getItem("user_uuid");

    if (sessionToken == null || userUuid == null) {
      return
    }

    if (!BackEnd.isApiAvailable()) await new Promise((resolve) => setTimeout(resolve, 150))

    if (!(await BackEnd.verifySessionToken(sessionToken)).success) {
      Alert.alert("session token expired");
      if (Platform.OS == "web") alert("sesson token expired");

      logout();
      return;
    }


    setCurrentUserUuid(userUuid);

    try {
      const getThreadResponse = await BackEnd.getThread(String(threadUuid));

      if (!getThreadResponse.success) {
        Alert.alert("Error", getThreadResponse.message);
        if (Platform.OS == "web") alert(getThreadResponse.message);
        return <View><Text>Error: {getThreadResponse.message}</Text></View>;
      }
      const privateThread = getThreadResponse.thread.private;
      setThreadIsPrivate(privateThread);

      if (privateThread && password == null) return
      const getThreadMessagesResponse = await BackEnd.getThreadMessages(sessionToken, String(threadUuid), null, password);

      if (!getThreadMessagesResponse.success) {
        if (privateThread) setPasswordError(getThreadMessagesResponse.message)
        else {
          Alert.alert("Error", getThreadMessagesResponse.message);
          if (Platform.OS == "web") alert(getThreadMessagesResponse.message);
        }
        return
      }

      const getUserProfileResponse = await BackEnd.getUserProfile(userUuid);
      if (getUserProfileResponse.success) {
        setThreadIsFavorited(getUserProfileResponse.userProfile.savedThreads.includes(threadUuid))
      }

      setThreadData(getThreadResponse.thread);
      setThreadMessageData(getThreadMessagesResponse.messages);

      const uniqueUserUuids = [... new Set([getThreadResponse.thread.authorUserUuid, ...getThreadMessagesResponse.messages.map(x => x.authorUserUuid)])]
      const getUsersResponse = await BackEnd.getUsers(uniqueUserUuids);

      if (getUsersResponse.success) {
        setUsers(getUsersResponse.users);
      }
    } catch (err) {
      console.log("Network error:", err);
    } finally {
    }
  };

  async function submitChange() {
    const sessionToken =
      await AsyncStorage.getItem(
        "session_token"
      );
    if (!(await BackEnd.verifySessionToken(sessionToken)).success) {
      Alert.alert("session token expired");
      if (Platform.OS == "web") alert("sesson token expired");

      logout();
      return;
    }

    const parameters = new ThreadUpdateParametersBuilder();
    if (NewTitle != null && NewTitle != "") parameters.setName(NewTitle);
    if (NewDescription != null && NewDescription != "") parameters.setDescription(NewDescription);

    const updateThreadResponse = await BackEnd.updateThread(sessionToken, threadUuid, parameters);

    if (updateThreadResponse.success) {
      fetchThread(savedThreadPassword);

      setNewTitle("");
      setNewDescription("");
      setShowSecondPostBox(false);
    }
  }

  async function submitPost() {
    const sessionToken =
      await AsyncStorage.getItem(
        "session_token"
      );

    if (!(await BackEnd.verifySessionToken(sessionToken)).success) {
      Alert.alert("session token expired");
      if (Platform.OS == "web") alert("sesson token expired");

      logout();
      return;
    }

    try {
      setPosting(true);
      const params =
        new MessageParametersBuilder()
          .setMessage(newPost);

      if (threadAttachment != null)
        params.setAttachment(threadAttachment);

      const response =
        await BackEnd.createMessage(
          sessionToken!,
          String(threadUuid),
          params,
          threadPassword
        );

      if (response.success) {
        setNewPost("");
        setThreadAttachment(null);
        setShowPostBox(false);
        fetchThread(savedThreadPassword);

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

  async function deleteThread() {
    const sessionToken = await AsyncStorage.getItem("session_token");
    if (!sessionToken) return;

    if (!(await BackEnd.verifySessionToken(sessionToken)).success) {
      Alert.alert("session token expired");
      if (Platform.OS == "web") alert("sesson token expired");

      logout();
      return;
    }

    setDeletingThread(true);

    try {
      const response = await BackEnd.deleteThread(
        sessionToken,
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

  async function pickAttachment() {
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

  async function favorite() {
    const sessionToken = await AsyncStorage.getItem("session_token");
    if (sessionToken == null) return;

    if (!(await BackEnd.verifySessionToken(sessionToken)).success) {
      Alert.alert("session token expired");
      if (Platform.OS == "web") alert("sesson token expired");

      logout();
      return;
    }

    if (!threadIsFavorited) {
      const saveThreadResponse = await BackEnd.saveThread(sessionToken, threadUuid);
      if (saveThreadResponse.success) setThreadIsFavorited(true)
    } else {
      const unsaveThreadResponse = await BackEnd.unsaveThread(sessionToken, threadUuid);
      if (unsaveThreadResponse.success) setThreadIsFavorited(false)
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
    <SafeAreaView style={styles.privateContainer}>
      <View style={styles.privateCard}>

        <Text style={styles.privateTitle}>
          Private Thread
        </Text>

        <Text style={styles.privateSubtitle}>
          A password is required to access this thread.
        </Text>

        <TextInput
          placeholder="Enter password"
          value={threadPassword}
          onChangeText={(text) => {
            setThreadPassword(text);
            setPasswordError("");
          }}
          secureTextEntry
          style={[
            styles.passwordInput,
            passwordError
              ? styles.passwordErrorInput
              : styles.passwordNormalInput,
          ]}
        />

        {passwordError ? (
          <Text style={styles.passwordErrorText}>
            {passwordError}
          </Text>
        ) : (
          <View style={styles.passwordSpacer} />
        )}

        <View style={styles.buttonRow}>

          <TouchableOpacity
            onPress={() => {
              AsyncStorage.setItem("last_password", threadPassword);
              setSavedThreadPassword(threadPassword);
            }}
            style={styles.primaryButton}
          >
            <Text style={styles.buttonText}>
              Enter
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.replace("/")}
            style={styles.secondaryButton}
          >
            <Text style={styles.buttonText}>
              Go Back
            </Text>
          </TouchableOpacity>

        </View>
      </View>
    </SafeAreaView>
  );
  }

  return (
  <>
    <Stack.Screen
      options={{
        headerTitle: () => (
          <Text style={styles.headerTitle}>
            Threads
          </Text>
        ),
      }}
    />

    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        <View style={styles.threadHeader}>

          <Image
            source={
              users[threadData.authorUserUuid]?.profilePictureUri ??
              require("../../assets/images/default_profile.png")
            }
            style={styles.profileImage}
          />

          <Text style={styles.threadTitle}>
            "{threadData.name}"
          </Text>

          <Text style={styles.threadHeaderText}>
            by
          </Text>

          <Text style={styles.threadHeaderText}>
            {users[threadData.authorUserUuid]?.name ?? "Unknown User"}
          </Text>

          <View style={styles.favoriteContainer}>
            <TouchableOpacity
              onPress={favorite}
              style={styles.favoriteButton}
            >
              <Ionicons
                name={threadIsFavorited ? "star" : "star-outline"}
                size={30}
                color="#ffa600ff"
              />
            </TouchableOpacity>
          </View>

        </View>

        <Text style={styles.metadataText}>
          ("Author ID: "{threadData.authorUserUuid})
        </Text>

        <Text style={styles.metadataBottomText}>
          {threadData.creationDate.toString()}
          {`\n`}
        </Text>

        <Text style={styles.descriptionText}>
          {threadData.description}
        </Text>

        {currentUserUuid === threadData.authorUserUuid && (
          <View style={styles.actionRow}>

            {!confirmDelete ? (
              <TouchableOpacity
                onPress={() => setConfirmDelete(true)}
                disabled={deletingThread}
                style={[
                  styles.deleteButton,
                  deletingThread && styles.disabledButton,
                ]}
              >
                <Text style={styles.buttonText}>
                  Delete Thread
                </Text>
              </TouchableOpacity>
            ) : (
              <>

                <TouchableOpacity
                  onPress={deleteThread}
                  disabled={deletingThread}
                  style={[
                    styles.deleteButton,
                    deletingThread && styles.disabledButton,
                  ]}
                >
                  <Text style={styles.buttonText}>
                    {deletingThread ? "Deleting..." : "Confirm?"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setConfirmDelete(false)}
                  disabled={deletingThread}
                  style={[
                    styles.cancelButton,
                    deletingThread && styles.disabledButton,
                  ]}
                >
                  <Text style={styles.buttonText}>
                    Cancel
                  </Text>
                </TouchableOpacity>

              </>
            )}
          </View>
        )}

        {currentUserUuid === threadData.authorUserUuid && (
          <>
            <TouchableOpacity
              onPress={() =>
                setShowSecondPostBox(!showSecondPostBox)
              }
              style={styles.editButton}
            >
              <Text style={styles.buttonText}>
                {showSecondPostBox
                  ? "Cancel"
                  : "Edit Thread"}
              </Text>
            </TouchableOpacity>

            {showSecondPostBox && (
              <View style={styles.editContainer}>

                <View style={styles.editInputsRow}>

                  <TextInput
                    placeholder="Title"
                    multiline
                    value={NewTitle}
                    onChangeText={setNewTitle}
                    style={styles.titleInput}
                  />

                  <TextInput
                    placeholder="Description"
                    multiline
                    value={NewDescription}
                    onChangeText={setNewDescription}
                    style={styles.descriptionInput}
                  />

                </View>

                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={submitChange}
                  disabled={ThreadDesc}
                >
                  <Text style={styles.submitButtonText}>
                    Submit Change
                  </Text>
                </TouchableOpacity>

              </View>
            )}
          </>
        )}

        <View style={styles.postSection}>

          <TouchableOpacity
            onPress={() => setShowPostBox(!showPostBox)}
            style={styles.createPostButton}
          >
            <Text style={styles.createPostButtonText}>
              {showPostBox ? "Close Post Box" : "Create Post"}
            </Text>
          </TouchableOpacity>

          {showPostBox && (
            <View style={styles.postBox}>

              <TextInput
                placeholder="Write a message..."
                value={newPost}
                onChangeText={setNewPost}
                multiline
                style={styles.postInput}
              />

              <View style={styles.attachmentRow}>

                <TouchableOpacity
                  onPress={pickAttachment}
                  style={styles.attachButton}
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
                  style={[
                    styles.postButton,
                    posting && styles.postButtonDisabled,
                  ]}
                >
                  <Text style={styles.createPostButtonText}>
                    {posting ? "Posting..." : "Post Message"}
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
                style={styles.messageCard}
              >

                <View style={styles.messageHeader}>

                  <Image
                    source={
                      users[message.authorUserUuid]?.profilePictureUri ??
                      require("../../assets/images/default_profile.png")
                    }
                    style={styles.smallProfileImage}
                  />

                  <Text style={styles.messageAuthor}>
                    {users[message.authorUserUuid]?.name ??
                      "Unknown User"}
                  </Text>

                  <Text style={styles.messageUserId}>
                    ("User id: "{message.authorUserUuid})
                  </Text>

                </View>

                <Text style={styles.messageText}>
                  {message.message}
                </Text>

                {message.attachment != null && (
                  <View style={styles.attachmentContainer}>

                    {message.attachment.mediaType == "image" && (
                      <Image
                        source={`data:image/${
                          message.attachment.extensionType == ""
                            ? "png"
                            : message.attachment.extensionType
                        };base64,${message.attachment.dataBase64}`}
                        style={styles.attachmentImage}
                      />
                    )}

                    {message.attachment.mediaType != "image" && (
                      <View style={styles.downloadContainer}>

                        <TouchableOpacity
                          onPress={() => {
                            saveAttachmentAs(message.attachment);
                          }}
                          style={styles.downloadButton}
                        >
                          <Text style={styles.downloadButtonText}>
                            Download Attachment
                          </Text>
                        </TouchableOpacity>

                      </View>
                    )}

                  </View>
                )}

                <Text style={styles.timestampText}>
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

const styles = StyleSheet.create({
  // Private thread screen
  privateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  privateCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "white",
    borderRadius: 15,
    padding: 25,
    elevation: 5,
    shadowColor: "#000000",
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },

  privateTitle: {
    fontSize: 30,
    fontWeight: "bold",
    fontFamily: "RobotoSlab-Regular",
    marginBottom: 6,
    textAlign: "center",
  },

  privateSubtitle: {
    textAlign: "center",
    fontFamily: "NotoSans-Regular",
    fontSize: 14,
    color: "#505050",
    marginBottom: 20,
  },

  passwordInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    fontFamily: "NotoSans-Regular",
    fontSize: 14,
  },

  passwordErrorInput: {
    borderColor: "#ff0000",
  },

  passwordNormalInput: {
    borderColor: "#ccc",
  },

  passwordErrorText: {
    color: "#ff0000",
    fontFamily: "NotoSans-Regular",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 10,
  },

  passwordSpacer: {
    marginBottom: 16,
  },

  row: {
    flexDirection: "row",
  },

  buttonRow: {
    flexDirection: "row",
    gap: 15,
  },

  primaryButton: {
    flex: 1,
    backgroundColor: "#0057b4",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },

  secondaryButton: {
    flex: 1,
    backgroundColor: "#8b8b8b",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },

  buttonText: {
    fontWeight: "bold",
    color: "white",
    fontFamily: "NotoSans-Regular",
  },

  // Main layout
  safeArea: {
    flex: 1,
  },

  container: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 30,
    paddingBottom: 20,
  },

  headerTitle: {
    fontSize: 40,
    fontWeight: "bold",
    fontFamily: "NotoSans-Regular",
    marginLeft: 10,
  },

  threadHeader: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },

  profileImage: {
    width: 35,
    height: 35,
    borderRadius: 20,
    marginRight: 5,
    borderWidth: 1,
    borderColor: "#636363",
  },

  smallProfileImage: {
    width: 30,
    height: 30,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#636363",
  },

  threadTitle: {
    fontSize: 24,
    marginBottom: 5,
    fontWeight: "bold",
    fontFamily: "NotoSans-Regular",
  },

  threadHeaderText: {
    fontSize: 24,
    marginBottom: 5,
    fontFamily: "NotoSans-Regular",
  },

  favoriteContainer: {
    alignItems: "flex-end",
  },

  favoriteButton: {
    marginLeft: 5,
    marginBottom: 5,
  },

  metadataText: {
    fontSize: 12,
    marginTop: 5,
    fontFamily: "NotoSans-Regular",
    color: "#8d8d8d",
  },

  metadataBottomText: {
    fontSize: 12,
    marginTop: 5,
    marginBottom: 10,
    fontFamily: "NotoSans-Regular",
    color: "#8d8d8d",
  },

  descriptionText: {
    fontSize: 16,
    marginBottom: 10,
    fontFamily: "NotoSans-Regular",
  },

  // Action buttons
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 15,
  },

  deleteButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
  },

  cancelButton: {
    backgroundColor: "#888",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
  },

  editButton: {
    backgroundColor: "#248aca",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignSelf: "flex-start",
  },

  disabledButton: {
    opacity: 0.5,
  },

  // Edit box
  editContainer: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginTop: 10,
  },

  editInputsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  titleInput: {
    flex: 1,
    height: 160,
    width: 200,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    textAlignVertical: "top",
    marginBottom: 10,
    fontSize: 14,
  },

  descriptionInput: {
    flex: 1,
    height: 160,
    width: 1000,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    textAlignVertical: "top",
    marginBottom: 10,
    fontSize: 14,
  },

  submitButton: {
    backgroundColor: "#2d635a",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  submitButtonText: {
    color: "white",
    fontWeight: "bold",
  },

  // Create post
  postSection: {
    marginBottom: 20,
  },

  createPostButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 12,
    alignSelf: "flex-start",
  },

  createPostButtonText: {
    color: "white",
    fontWeight: "bold",
    fontFamily: "NotoSans-Regular",
  },

  postBox: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    elevation: 5,
    shadowColor: "#000000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },

  postInput: {
    height: 80,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    textAlignVertical: "top",
    marginBottom: 10,
    fontSize: 14,
    fontFamily: "NotoSans-Regular",
  },

  attachmentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  attachButton: {
    width: 45,
    height: 45,
    borderRadius: 10,
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },

  postButton: {
    flex: 1,
    backgroundColor: "#34C759",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  postButtonDisabled: {
    opacity: 0.6,
  },

  // Message cards
  messageCard: {
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
    marginRight: 10,
  },

  messageHeader: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },

  messageAuthor: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 5,
    fontFamily: "NotoSans-Regular",
  },

  messageUserId: {
    fontSize: 13,
    marginBottom: 5,
    fontFamily: "NotoSans-Regular",
    color: "#5f5f5f",
  },

  messageText: {
    fontSize: 20,
    marginTop: 5,
  },

  attachmentContainer: {
    marginTop: 10,
    gap: 5,
  },

  attachmentImage: {
    width: 200,
    height: 200,
    aspectRatio: 1,
    borderRadius: 8,
    resizeMode: "stretch",
  },

  downloadContainer: {
    width: 210,
  },

  downloadButton: {
    backgroundColor: "#0099ff",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },

  downloadButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontFamily: "NotoSans-Regular",
  },

  timestampText: {
    color: "gray",
    marginTop: 7,
    fontSize: 12,
    fontFamily: "NotoSans-Regular",
  },
});