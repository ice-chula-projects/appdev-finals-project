import { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, TextInput, ScrollView, Linking, Image, Alert, Modal, ActivityIndicator } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';

const GLOBAL_URL = "http://localhost:5000/"

export default function ProfilePage() {
  const [profileName, setProfileName] = useState('');
  const [userUUID, setUserUUID] = useState('');
  const [profileDescription, setProfileDescription] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  const [pendingPicture, setPendingPicture] = useState<string | null>(null);
  const [pendingBase64, setPendingBase64] = useState<string | null>(null);

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [postHistory, setPostHistory] = useState<any[]>([]);
  const [commentHistory, setCommentHistory] = useState<any[]>([]);
  
  const [editDescription, setEditDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
        try {
            const username = await AsyncStorage.getItem("username");
            const userUUID = await AsyncStorage.getItem("user_uuid");
            const savedPicture = await AsyncStorage.getItem("profile_picture_base64");
            const savedDescription = await AsyncStorage.getItem("motd");

            console.log("Loaded username:", username);
            console.log("Loaded UUID:", userUUID);

            if (username) setProfileName(username);
            if (userUUID) setUserUUID(userUUID);
            if (savedPicture) setProfilePicture(savedPicture);
            if (savedDescription) setProfileDescription(savedDescription);
            } catch (err) {
                console.log("Failed to load profile:", err);
            }
        }   
        loadProfile();
    }, [])

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
        alert("Permission to access image gallery is required.");
        return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
    })

    if (!result.canceled) {
        setProfilePicture(result.assets[0].uri);
        setPendingBase64(result.assets[0].base64 ?? null);
        setConfirmVisible(true);
    }
  }

  const uploadProfilePicture = async (base64: String, uri: string) => {
    const sessionToken = await AsyncStorage.getItem("session_token");
    const ext = uri.split(".").pop()?.toLowerCase() ?? "jpg";
    const mimeType = ext === "png" ? "image/png" : "image/jpeg";

    const response = await fetch(GLOBAL_URL+"update_user", {
        method: "UPDATE",
        headers: {"Content-Type": "application/json", "session-token": sessionToken ?? ''},
        body: JSON.stringify({profile_picture_base64: `data:${mimeType};base64,${base64}`})
    })

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error ?? 'Upload failed.');
    }
    return response.json();
  }

  const handleConfirm = async () => {
    if (!pendingPicture || !pendingBase64) return;
    setUploading(true);
    try {
      await uploadProfilePicture(pendingBase64, pendingPicture);
      setProfilePicture(pendingPicture);
      await AsyncStorage.setItem("profile_picture_uri", pendingPicture);
      setConfirmVisible(false);
      setPendingPicture(null);
      setPendingBase64(null);
    } catch (err: any) {
      Alert.alert('Upload failed', err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  const handleCancel = () => {
    setPendingPicture(null);
    setPendingBase64(null);
    setProfilePicture(null);
    setConfirmVisible(false);
  }

  const fetchUserProfile = async () => {
  try {
    const uuid = await AsyncStorage.getItem("user_uuid");
    if (!uuid) {
      console.log("No UUID found.");
      return;
    }
    const response = await fetch(GLOBAL_URL+`get_users?uuid=${uuid}`, { method: "GET" });
    const data = await response.json();

    if (response.ok) {
      const user = data.users?.[uuid];

      if (!user) {
        console.log("User not found.");
        return;
      }

      console.log("Fetched user:", user);

      setProfileName(user.name ?? "");
      setUserUUID(user.user_uuid ?? uuid);
      setProfileDescription(user.motd ?? "");

        if (user.profile_picture) {
            setProfilePicture(user.profile_picture);
        }
        await AsyncStorage.setItem("username", user.name ?? "");
        await AsyncStorage.setItem("motd", user.motd ?? "");
        } else {
        console.log(data.error);
        }
    } catch (err) {
        console.log("Failed to fetch user:", err);
      }
    }

  useEffect(() => { fetchUserProfile() }, []);

  const updateDescription = async () => {
    try {
        const token = await AsyncStorage.getItem("session_token");
        const response = await fetch(GLOBAL_URL+"update_user", {
            method: "PATCH",
            headers: {"Content-Type": "application/json", "session-token": token ?? ""},
            body: JSON.stringify({motd: tempDescription})
        })
        if (!response.ok) throw new Error("Failed to update the description.");
        await AsyncStorage.setItem("motd",tempDescription);
        setEditDescription(false);
    } catch (err) {
        Alert.alert("Error","Cannot update the description.")
    }
  }


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

  const comments = [
    {
      thread: "Rate my battalion setup",
      comment: "Honestly the logistics section looks pretty solid.",
      date: "13 May 2026 12:48",
    },

    {
      thread: "React Native Help",
      comment: "You forgot to close the ScrollView tag.",
      date: "13 May 2026 13:02",
    },

    {
      thread: "Movie Recommendations",
      comment: "The Martian is peak engineering propaganda.",
      date: "13 May 2026 13:17",
    },

    {
      thread: "Forum Lore",
      comment: "This thread is becoming historically significant.",
      date: "13 May 2026 13:44",
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
                fontSize: 35,
                fontWeight: "600",
                fontFamily: "NotoSans-Regular",
                marginLeft: 10
              }}
            >
              Profile Page
            </Text>
          ),
        }}
      />

      <Modal
    visible={confirmVisible}
    transparent
    animationType="slide"
    onRequestClose={handleCancel}
    >
        <View style={{ flex: 1, justifyContent: 'flex-end'}}>
            <View style={{
                backgroundColor: '#fff',
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                padding: 24,
                alignItems: 'center',
                paddingBottom: 40,
            }}>
                <Text style={{ fontSize: 17, fontWeight: '600', marginBottom: 14 }}>Use this photo?</Text>

            {pendingPicture && (
                <Image
                    source={{ uri: pendingPicture }}
                    style={{
                    width: 120,
                    height: 120,
                    borderRadius: 14,
                    marginBottom: 20,
                }}
                />
            )}

            {uploading ? (
                <ActivityIndicator size="large" color="#007AFF" />
            ) : (
                <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
                <TouchableOpacity
                    onPress={handleCancel}
                    style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#ccc',
                    alignItems: 'center',
                    }}
                >
                    <Text style={{ color: '#333', fontWeight: '500' }}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleConfirm}
                    style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 8,
                    backgroundColor: '#007AFF',
                    alignItems: 'center',
                    }}
                >
                    <Text style={{ color: '#fff', fontWeight: '600' }}>Confirm</Text>
                </TouchableOpacity>
                </View>
            )}
            </View>
        </View>
    </Modal>

      <SafeAreaView style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            paddingTop: 50,
            paddingHorizontal: 30,
          }}
        >

          <View
            style={{
              alignItems: "center",
              marginBottom: 10,
              borderWidth: 1,
              borderColor: "#ccc",
              borderRadius: 8,
              padding: 5,
            }}
          >
            <TouchableOpacity onPress={pickImage}>
            <Image
              source={profilePicture ? { uri: profilePicture } : require("../assets/images/default_profile.png")}
              style={{
                width: 100,
                height: 100,
                marginTop: 15,
                borderRadius: 15,
                borderWidth: 3,
                marginBottom: 5,
              }}
            />
            </TouchableOpacity>

            <Text
              style={{
                fontSize: 30,
                fontWeight: "bold",
                fontFamily: "RobotoSlab-Regular",
              }}
            >
              {profileName || "Unknown User"}
            </Text>

            <Text
              style={{
                color: "gray",
                marginTop: 5,
                marginBottom: 10,
                fontFamily: "RobotoSlab-Regular",
              }}
            >
              UUID: {userUUID || "Unknown"}
            </Text>

            {editDescription ? (
                <>
                    <TextInput
                    value={tempDescription}
                    onChangeText={setTempDescription}
                    placeholder="Enter description here (max. 50 characters)"
                    maxLength={50}
                    style={{
                        borderWidth: 1,
                        borderColor: "#ccc",
                        padding: 10,
                        borderRadius: 6,
                        width: "100%",
                        color: "#757575"
                    }}
                    />

                    <View style={{ flexDirection: "row", marginTop: 10 }}>
                        <TouchableOpacity onPress={updateDescription}>
                            <Text style={{ color: "green", marginRight: 15, fontFamily: "RobotoSlab-Regular" }}>Save</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setEditDescription(false)}>
                            <Text style={{ color: "red", fontFamily: "RobotoSlab-Regular" }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </>
            ) : (
                <>
                    <Text style={{ textAlign: "center", fontFamily: "RobotoSlab-Regular" }}>
                        {profileDescription || "No description yet."}
                    </Text>

                    <TouchableOpacity onPress={() => {
                        setTempDescription(profileDescription);
                        setEditDescription(true);
                    }}>
                        <Text style={{ 
                            color: "#007AFF", 
                            marginTop: 8, 
                            fontFamily: "RobotoSlab-Regular" 
                        }}>Edit Description</Text>
                    </TouchableOpacity>
                </>
            )}
        </View>

        <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              marginBottom: 5,
            }}
          >
            Thread History
          </Text>
            <View
            style={{
                height: 180,
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 8,
                overflow: "hidden",
            }}
            >

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

        <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              marginBottom: 5,
            }}
          >
            Text History
          </Text>
            <View
            style={{
                height: 180,
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 8,
                overflow: "hidden",
            }}
            >
          <ScrollView>
            {comments.map((comment, index) => (
              <View
                key={index}
                style={{
                  padding: 5,
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 2,
                  marginBottom: 5,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color: "#007AFF",
                    marginBottom: 4,
                  }}
                >
                  {comment.thread}
                </Text>

                <Text
                  style={{
                    fontSize: 16,
                    marginBottom: 4,
                  }}
                >
                  {comment.comment}
                </Text>

                <Text
                  style={{
                    color: "gray",
                    fontSize: 12,
                  }}
                >
                  {comment.date}
                </Text>
              </View>
            ))}
          </ScrollView>
            </View>
        </View>
      </SafeAreaView>
    </>
  );
}