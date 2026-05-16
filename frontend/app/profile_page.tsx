import { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, TextInput, ScrollView, Linking, Image, Alert, Modal, ActivityIndicator, StyleSheet } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { BackEnd } from "../components/backend";

const GLOBAL_URL = "http://localhost:5000/"

export default function ProfilePage() {
  const [profileName, setProfileName] = useState('');
  const [userUUID, setUserUUID] = useState('');
  const [profileDescription, setProfileDescription] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  const [pendingPicture, setPendingPicture] = useState<string | null>(null);
  const [pendingBase64, setPendingBase64] = useState<string | null>(null);
  const [pendingMimeType, setPendingMimeType] = useState<string>("image/jpeg");

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [postHistory, setPostHistory] = useState<any[]>([]);
  const [commentHistory, setCommentHistory] = useState<any[]>([]);
  
  const [editDescription, setEditDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState("");

  const loadProfile = async () => {
    try {
      const username = await AsyncStorage.getItem("username");
      const userUUID = await AsyncStorage.getItem("user_uuid");
      const savedPicture = await AsyncStorage.getItem("profile_picture_base64");
      const savedDescription = await AsyncStorage.getItem("motd");

      console.log("Loaded username:", username);
      console.log("Loaded UUID:", userUUID);
      console.log("Loaded PFP:", savedPicture);
      console.log("Loaded description:",savedDescription);

      if (username) setProfileName(username);
      if (userUUID) setUserUUID(userUUID);
      if (savedPicture) setProfilePicture(savedPicture);
      if (savedDescription) setProfileDescription(savedDescription);
      } catch (err) {
        console.log("Failed to load profile:", err);
      }
    }

  const fetchUserProfile = async () => {
    try {
      const uuid = await AsyncStorage.getItem("user_uuid");
      if (!uuid) {
        console.log("No UUID found.");
        return;
      }
    
      const response = await BackEnd.getUserProfile(uuid);
    
      if (response.success && response.userProfile) {
        console.log("Fetched user:", response.userProfile);
      
        setProfileName(response.userProfile.name ?? "");
        setUserUUID(response.userProfile.uuid ?? uuid);
        setProfileDescription(response.userProfile.motd ?? "");
      
        // Save to AsyncStorage
        await AsyncStorage.setItem("username", response.userProfile.name ?? "");
        await AsyncStorage.setItem("motd", response.userProfile.motd ?? "");
      
        if (response.userProfile.profilePictureUri) {
          setProfilePicture(response.userProfile.profilePictureUri);
          await AsyncStorage.setItem("profile_picture_base64", response.userProfile.profilePictureUri);
        }
      } else {
        console.log("Failed to fetch user:", response.message);
      }
    } catch (err) {
      console.log("Failed to fetch user:", err);
    }
  }

  useEffect(() => {
    const initializeProfile = async () => {
      await loadProfile();
      await fetchUserProfile();
    }
  initializeProfile() }, []);


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
        const asset = result.assets[0];
        setPendingPicture(asset.uri);
        setPendingBase64(asset.base64 ?? null);
        setPendingMimeType(asset.mimeType ?? "image/jpeg");
        setConfirmVisible(true);
    }
  }

  const uploadProfilePicture = async (base64: String, mimeType: string) => {
    const sessionToken = await AsyncStorage.getItem("session_token");
    const cleanedBase64 = base64.replace(/\s/g,"");
    const imageData = `data:${mimeType};base64,${base64}`;

    console.log("Sending mime type:", mimeType);

    const response = await fetch(GLOBAL_URL+"update_user", {
        method: "PATCH",
        headers: {"Content-Type": "application/json", "session-token": sessionToken ?? ''},
        body: JSON.stringify({profile_picture_base64: imageData})
    })

    const data = await response.json();
    console.log("Upload response:",data);

    if (!response.ok) {
      throw new Error(data.error ?? 'Upload failed.');
    }
    return imageData;
  }

  const handleConfirmPFP = async () => {
    if (!pendingPicture || !pendingBase64) return;
    setUploading(true);
    try {
      const uploadedImage = await uploadProfilePicture(pendingBase64, pendingPicture);

      setProfilePicture(uploadedImage);

      await AsyncStorage.setItem("profile_picture_base64",uploadedImage);

      setPendingPicture(null);
      setPendingBase64(null);
      setConfirmVisible(false);
    } catch (err: any) {
      console.log(err);
      Alert.alert('Upload failed', err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  const handleCancelPFP = () => {
    setPendingPicture(null);
    setPendingBase64(null);
    setConfirmVisible(false);
  }

  const updateDescription = async () => {
    try {
        const sessionToken = await AsyncStorage.getItem("session_token");
        const response = await fetch(GLOBAL_URL+"update_user", {
            method: "PATCH",
            headers: {"Content-Type": "application/json", "session-token": sessionToken ?? ""},
            body: JSON.stringify({motd: tempDescription})
        })

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to update the description.");
        setProfileDescription(tempDescription);
        await AsyncStorage.setItem("motd", tempDescription);
        setEditDescription(false);
    } catch (err) {
        Alert.alert("Error","Cannot update the description.");
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

  const styles = StyleSheet.create({
    headerTitle: {
      fontSize: 35,
      fontWeight: "600",
      fontFamily: "NotoSans-Regular",
      marginLeft: 10
    },
    container: {
      flex: 1,
      paddingTop: 50,
      paddingHorizontal: 30,
    },
    safeView: {
      flex: 1
    },
    yourProfile: {
      fontSize: 50,
      fontWeight: "bold",
      color: "#2b2b2b",
      fontFamily: "RobotoSlab-Regular",
    },
    pickImagePopup: {
      backgroundColor: '#ffffff',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      alignItems: 'center',
      paddingBottom: 20,
    },
    pickImageText: {
      fontSize: 20, 
      fontWeight: '600', 
      marginBottom: 14,
      fontFamily: "NotoSans-Regular"
    },
    pendingPic: {
      width: 120,
      height: 120,
      borderRadius: 14,
      marginBottom: 20,
    },
    alignPopupButtons: { 
      flexDirection: 'row', 
      gap: 12, 
      width: '100%' 
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
      backgroundColor: "#8f8f8f",
      borderColor: '#ccc',
      alignItems: 'center',
    },
    confirmButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor: '#007AFF',
      alignItems: 'center',
    },
    buttonText: {
      color: '#ffffff', 
      fontWeight: '600',
      fontFamily: "NotoSans-Regular"
    },
    userProfileBox: {
      alignItems: "center",
      marginBottom: 10,
      borderWidth: 2,
      borderColor: "#ccc",
      borderRadius: 8,
      padding: 15,
    },
    profilePictureIcon: {
      width: 100,
      height: 100,
      marginTop: 15,
      marginBottom: 5,
      borderRadius: 15,
      borderWidth: 2,
      borderColor: "#c2c2c2",
    },
    profileUsername: {
      fontSize: 30,
      fontWeight: "bold",
      fontFamily: "RobotoSlab-Regular",
    },
    profileUUID: {
      color: "gray",
      marginTop: 5,
      marginBottom: 10,
      fontFamily: "RobotoSlab-Regular",
    },
    editDescBox: {
      width: "50%",
      borderWidth: 1,
      borderColor: "#ccc",
      padding: 10,
      borderRadius: 5,
      fontFamily: "RobotoSlab-Regular"
    },
    descButtons: { 
      flexDirection: "row", 
      marginTop: 10 ,
    },
    descSave: {
      color: "#00b652", 
      marginRight: 15, 
      fontFamily: "RobotoSlab-Regular",
    },
    descCancel: {
      color: "red", 
      fontFamily: "RobotoSlab-Regular",
    },
    profileDesc: { 
      textAlign: "center", 
      fontFamily: "RobotoSlab-Regular" 
    },
    editDesc: { 
      color: "#007AFF", 
      marginTop: 8, 
      fontFamily: "RobotoSlab-Regular" 
    },

  })

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <Text style={styles.headerTitle}>Profile Page</Text>
          ),
        }}
      />

      <Modal
        visible={confirmVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCancelPFP}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end'}}>
            <View style={styles.pickImagePopup}>
                <Text style={styles.pickImageText}>Use this photo?</Text>

            { pendingPicture && ( <Image source={{ uri: pendingPicture }} style={styles.pendingPic}/> ) }

            {uploading ? (
                <ActivityIndicator size="large" color="#007AFF" />
            ) : (
                <View style={styles.alignPopupButtons}>
                <TouchableOpacity onPress={handleCancelPFP} style={styles.cancelButton}>
                    <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleConfirmPFP} style={styles.confirmButton}>
                    <Text style={styles.buttonText}>Confirm</Text>
                </TouchableOpacity>
                </View>
            )}
            </View>
        </View>
    </Modal>

      <SafeAreaView style={styles.safeView}>
        <View style={styles.container}>
          <View style={styles.userProfileBox}>
            <Text style={styles.yourProfile}>Your Profile</Text>
            <TouchableOpacity onPress={pickImage}>
              <Image
                source={profilePicture ? { uri: profilePicture } : require("../assets/images/default_profile.png")}
                style={styles.profilePictureIcon}
              />
            </TouchableOpacity>

            <Text style={styles.profileUsername}>{profileName || "Unknown User"}</Text>

            <Text style={styles.profileUUID}>UUID: {userUUID || "Unknown"}</Text>

            {editDescription ? (
                <>
                    <TextInput
                    value={tempDescription}
                    onChangeText={setTempDescription}
                    placeholder="Enter description here (max. 50 characters)"
                    maxLength={50}
                    style={styles.editDescBox}
                    />

                    <View style={styles.descButtons}>
                        <TouchableOpacity onPress={updateDescription}>
                            <Text style={styles.descSave}>Save</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setEditDescription(false)}>
                            <Text style={styles.descCancel}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </>
            ) : (
                <>
                    <Text style={styles.profileDesc}>
                        {profileDescription || "No description yet."}
                    </Text>

                    <TouchableOpacity onPress={() => {
                        setTempDescription(profileDescription);
                        setEditDescription(true);
                    }}>
                        <Text style={styles.editDesc}>Edit Description</Text>
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