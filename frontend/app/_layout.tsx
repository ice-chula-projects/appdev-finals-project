import { Stack, router, usePathname } from "expo-router";
import { Text, View, TouchableOpacity, Image, StyleSheet, Alert, Modal, TextInput, Platform } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback } from "react";
import BackEnd from "../components/backend";
import { AccountContext } from "@/components/accountContext";

const styles = StyleSheet.create({
  homeIcon: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
  notLoggedInButtons: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
    gap: 12,
  },
  loginButton: {
    color: "white",
    backgroundColor: "#007bff",
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#0067c7",
    fontWeight: "600",
    fontSize: 18,
    fontFamily: "RobotoSlab-Regular",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  signupButton: {
    color: "white",
    backgroundColor: "#ffa600",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#c49105",
    fontSize: 18,
    fontFamily: "RobotoSlab-Bold",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  logoutButton: {
    color: "white",
    backgroundColor: "#770000",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#550101",
    fontSize: 18,
    fontFamily: "RobotoSlab-Bold",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
    gap: 12,
  },
  profileIcon: {
    width: 42,
    height: 42,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#a7a7a7",
    elevation: 5,
    shadowColor: "#000000",
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  popupOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  popupContainer: {
    width: "90%",
    maxWidth: 350,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  popupText: {
    fontSize: 23,
    color: "#1f1f1f",
    marginBottom: 15,
    textAlign: "center",
    lineHeight: 22,
    fontFamily: "RobotoSlab-Bold",
  },
  popupButtons: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#8b8b8b",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#940404",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  popupButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "RobotoSlab-Bold",
  },
  backendInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  apiButton: {
    position: "absolute",
    bottom: 25,
    left: 20,
    backgroundColor: "#333",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 30,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  apiText: {
    color: "white",
    fontFamily: "NotoSans-Bold",
    fontSize: 14,
  },
})

export default function RootLayout() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [profileImageUri, setProfileImageUri] = useState(null);
  const [logoutPopupVisible, setLogoutPopupVisible ] = useState(false);

  const [apiUrl, setApiUrl] = useState("");
  const [showApiPopup, setShowApiPopup] = useState(false);

  const pathname = usePathname();
  const hideHeader = pathname.startsWith("/auth/login_page") || pathname.startsWith("/auth/signup_page")

   useEffect(() => {
    const init = async () => {
      // load saved api url
      const savedUrl = await AsyncStorage.getItem("api_url");

      if (!savedUrl) {
        setShowApiPopup(true);
        return;
      }

      setApiUrl(savedUrl);

      const response = await BackEnd.setApiUrl(savedUrl);

      if (!response.success) {
        setShowApiPopup(true);
        Alert.alert(response.message);
      } else {
        setShowApiPopup(false);
        const sessionToken = await AsyncStorage.getItem("session_token");
        const loggedIn = sessionToken != null;
        setLoggedIn(loggedIn);
        ;
        if(loggedIn){
          reloadProfile();
        }
      }
    }
    init();
  }, [])
  
  const handleSaveApiUrl = async () => {
    try {
      const cleanedUrl = apiUrl.trim();

      if (!cleanedUrl) {
        Alert.alert("Error", "API URL cannot be empty");
        return;
      }

      const response = await BackEnd.setApiUrl(cleanedUrl);
      if(response.success){
        await AsyncStorage.setItem("api_url", cleanedUrl);
        setShowApiPopup(false);
        Alert.alert("Success", "Backend connected!");

      }
      else{
        Alert.alert("Error", response.message);
        if(Platform.OS == "web") alert("Invalid Api Url")
      }

    } catch (err) {
      Alert.alert("Error", "Failed to set API URL.");
    }
  }

  // Check session token
  useEffect(() => {
    (async () => {
      const sessionToken = await AsyncStorage.getItem("session_token");
      const loggedIn = sessionToken != null;
      setLoggedIn(loggedIn);
    })();
  }, [pathname]);

  // Logout
  const confirmLogout = async () => {
    BackEnd.logout(await AsyncStorage.getItem("session_token"));
    await AsyncStorage.removeItem("session_token");
    await AsyncStorage.removeItem("username");
    setLoggedIn(false);
    setLogoutPopupVisible(false);
    router.replace("/");
  }

  const reloadProfile = async () => {
    const uuid = await AsyncStorage.getItem("user_uuid");

    if (!uuid) return;

    const response = await BackEnd.getUsers([uuid]);
    if (response.success) {
        setProfileImageUri(response.users[uuid].profilePictureUri);
    }
};

  return (
    <AccountContext.Provider value={{ reloadProfile: reloadProfile, logout: confirmLogout }}>
      <View style={{ flex: 1 }}>

      <Stack
        screenOptions={{
          headerShown: !hideHeader,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.push("/")} style={{ marginLeft: 15 }}>
              <Image source={require("../assets/images/message_logo.png")} style={styles.homeIcon} />
            </TouchableOpacity>
          ),

          headerRight: () =>
            loggedIn ? (
              <View style={styles.userSection}>
                <TouchableOpacity onPress={() => router.push("/profile_page")}>
                  <Image
                    source={profileImageUri != null? profileImageUri : require("../assets/images/default_profile.png")}
                    style={styles.profileIcon}
                  />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setLogoutPopupVisible(true)}>
                  <Text style={styles.logoutButton}>LOGOUT</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.notLoggedInButtons}>
                <TouchableOpacity onPress={() => router.push("/auth/login_page")}>
                  <Text style={styles.loginButton}>LOGIN</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.push("/auth/signup_page")}>
                  <Text style={styles.signupButton}>REGISTER</Text>
                </TouchableOpacity>
              </View>
            ),
        }}
      />

      <TouchableOpacity
        onPress={() => setShowApiPopup(true)}
        style={styles.apiButton}
      >
        <Text style={styles.apiText}>API</Text>
      </TouchableOpacity>

      <Modal transparent visible={logoutPopupVisible} animationType="fade">
        <View style={styles.popupOverlay}>
          <View style={styles.popupContainer}>
            <Text style={styles.popupText}>Are you sure?</Text>

            <View style={styles.popupButtons}>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={confirmLogout}
              >
                <Text style={styles.popupButtonText}>Confirm</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setLogoutPopupVisible(false)}
              >
                <Text style={styles.popupButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={showApiPopup} animationType="fade">
        <View style={styles.popupOverlay}>
          <View style={styles.popupContainer}>
            <Text style={styles.popupText}>Enter API URL</Text>

            <TextInput
              style={styles.backendInput}
              value={apiUrl}
              onChangeText={setApiUrl}
            />

            <View style={styles.popupButtons}>
              <TouchableOpacity style={styles.confirmButton} onPress={handleSaveApiUrl}>
                <Text style={styles.popupButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowApiPopup(false)}>
                <Text style={styles.popupButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
    </AccountContext.Provider>
  )
}