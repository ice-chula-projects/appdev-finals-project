import { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, TextInput, ScrollView, Linking, Image, Alert, Modal, ActivityIndicator, StyleSheet, Platform } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import BackEnd, { DisplayThread, UserUpdateParametersBuilder } from "@/components/backend";
import { useProfile } from "@/components/profileContext";

export default function ProfilePage() {
  const [profileName, setProfileName] = useState('');
  const [userUUID, setUserUUID] = useState('');
  const [profileDescription, setProfileDescription] = useState('');
  const [profilePictureUri, setProfilePictureUri] = useState<string | null>(null);

  const [pendingPictureUri, setPendingPictureUri] = useState<string | null>(null);

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [threadHistory, setThreadHistory] = useState<DisplayThread[]>([]);
  const [savedThreads, setSavedThreads] = useState<DisplayThread[]>([]);
  
  const [editDescription, setEditDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState("");

  const { reloadProfile } = useProfile();

  const fetchUserProfile = async () => {
    try {
      const uuid = await AsyncStorage.getItem("user_uuid");
      if (!uuid) {
        console.log("No UUID found.");
        return;
      }
    
      const response = await BackEnd.getUserProfile(uuid);
    
      if (response.success) {
        const userProfile = response.userProfile;
      
        setProfileName(userProfile.name);
        setUserUUID(userProfile.uuid);
        setProfileDescription(userProfile.motd);
      
        if (userProfile.profilePictureUri != null) {
          setProfilePictureUri(userProfile.profilePictureUri);
        }

        const getThreadsResponse = await BackEnd.getThreads([... new Set([... userProfile.threadHistory, ... userProfile.savedThreads])])
        if(getThreadsResponse.success){
          setThreadHistory(userProfile.threadHistory.map(x=>getThreadsResponse.threads[x]));
          setSavedThreads(userProfile.savedThreads.map(x=>getThreadsResponse.threads[x]));
        }
      } else {
        Alert.alert("Error", response.message);
        if(Platform.OS == "web") alert(response.message);
      }
    } catch (err) {
      console.log("Failed to fetch user:", err);
    }
  }

  useEffect(() => {
    const initializeProfile = async () => {
      //wait a little bit for backend to initialize if it isnt currently loaded
      if(!BackEnd.isApiAvailable()) await new Promise((resolve) => setTimeout(resolve,100))
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
        setPendingPictureUri(asset.uri);
        setConfirmVisible(true);
    }
  }

  const uploadProfilePicture = async (profilePictureUri: string) => {
    const sessionToken = await AsyncStorage.getItem("session_token");

    const response = await BackEnd.updateUser(sessionToken, new UserUpdateParametersBuilder().setProfilePictureUri(profilePictureUri))

    if (!response.success) {
      throw new Error(response.message);
    }
  }

  const handleConfirmPFP = async () => {
    if (pendingPictureUri == null) return;
    setUploading(true);
    try {
      await uploadProfilePicture(pendingPictureUri);
      reloadProfile()
      setProfilePictureUri(pendingPictureUri);

      setPendingPictureUri(null);
      setConfirmVisible(false);
    } catch (err: any) {
      console.log(err);
      Alert.alert('Upload failed', err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  const handleCancelPFP = () => {
    setPendingPictureUri(null);
    setConfirmVisible(false);
  }

  const updateDescription = async () => {
    try {
        const sessionToken = await AsyncStorage.getItem("session_token");
        const response = BackEnd.updateUser(sessionToken, new UserUpdateParametersBuilder().setMotd(tempDescription))

        if (!(await response).success) Alert.alert((await response).message);

        setProfileDescription(tempDescription);
        await AsyncStorage.setItem("motd", tempDescription);
        setEditDescription(false);
    } catch (err) {
        Alert.alert("Error","Cannot update the description.");
    }
  }

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

            { pendingPictureUri !- null && ( <Image source={{ uri: pendingPictureUri }} style={styles.pendingPic}/> ) }

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
                source={pendingPictureUri != null ? { uri: pendingPictureUri } : (profilePictureUri != null ? { uri: profilePictureUri } : require("../assets/images/default_profile.png"))}
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
            {threadHistory.map((thread, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => router.push(`/thread_page/${thread.uuid}`)}
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
                    {thread?.thumbnailUri != null && <Image
                    source={thread.thumbnailUri}
                    style={{ 
                      width: 75, 
                      height: 75, 
                      marginRight: 15,
                      borderRadius: 8
                    }}
                  />}
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
                  {thread?.name}
                </Text>

                <Text
                  style={{
                    color: "gray",
                    fontSize: 14,
                  }}
                >
                  {thread?.description}
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
            Saved Threads
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
            {savedThreads.map((thread, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => router.push(`/thread_page/${thread.uuid}`)}
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
                    {thread?.thumbnailUri != null && <Image
                    source={thread.thumbnailUri}
                    style={{ 
                      width: 75, 
                      height: 75, 
                      marginRight: 15,
                      borderRadius: 8
                    }}
                  />}
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
                  {thread?.name}
                </Text>

                <Text
                  style={{
                    color: "gray",
                    fontSize: 14,
                  }}
                >
                  {thread?.description}
                </Text>
              </View>
              </View>
              </TouchableOpacity>
            ))}
        </ScrollView>
        </View>
        </View>
      </SafeAreaView>
    </>
  );
}