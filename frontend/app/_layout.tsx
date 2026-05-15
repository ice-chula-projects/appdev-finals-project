import { Stack, router, usePathname } from "expo-router";
import { Text, View, TouchableOpacity, Image, StyleSheet, Alert, Modal } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback } from "react";

const GLOBAL_URL = "http://localhost:5000/"

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
    boxShadow: "0px 0px 6px rgba(0, 0, 0, 0.5)",
    fontWeight: "600",
    fontSize: 18,
    fontFamily: "RobotoSlab-Regular",
  },
  signupButton: {
    color: "white",
    backgroundColor: "#ffa600",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#c49105",
    boxShadow: "0px 0px 6px rgba(0, 0, 0, 0.5)",
    fontWeight: "600",
    fontSize: 18,
    fontFamily: "RobotoSlab-Regular",
  },
  logoutButton: {
    color: "white",
    backgroundColor: "#770000",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#550101",
    boxShadow: "0px 0px 6px rgba(0, 0, 0, 0.5)",
    fontWeight: "600",
    fontSize: 18,
    fontFamily: "RobotoSlab-Regular",
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
    boxShadow: "0px 0px 6px rgba(0, 0, 0, 0.5)",
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
    fontWeight: "600",
    fontFamily: "RobotoSlab-Regular",
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
    fontWeight: "600",
    fontSize: 16,
    fontFamily: "RobotoSlab-Regular",
  }
})

export default function RootLayout() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [logoutPopupVisible, setLogoutPopupVisible ] = useState(false);

  const pathname = usePathname();

  // Check session token
  useEffect(() => {
    const checkLogin = async () => {
      const sessionToken =await AsyncStorage.getItem("session_token");
      console.log("Session token:", sessionToken);
      setLoggedIn(!!sessionToken);
    };
    checkLogin();
  }, [pathname]);

  // Logout
  const confirmLogout = async () => {
    await AsyncStorage.removeItem("session_token");
    await AsyncStorage.removeItem("username");
    setLoggedIn(false);
    setLogoutPopupVisible(false);
    router.replace("/");
  }

  return (
    <>
    <Stack
      screenOptions={{
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.push("/")} style={{ marginLeft: 15 }}>
            <Image source={require("../assets/images/message_logo.png")} style={styles.homeIcon} />
          </TouchableOpacity>
        ),

        headerRight: () => (
          loggedIn ? (
            <View style={styles.userSection}>
              <TouchableOpacity onPress={() => router.push("/profile_page")}>
                <Image
                  source={require("../assets/images/default_profile.png")}
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
          )
        ),
      }}
    />
    
    <Modal
      transparent
      animationType="fade"
      visible={logoutPopupVisible}
      onRequestClose={() => setLogoutPopupVisible(false)}
    >
      <View style={styles.popupOverlay}>
        <View style={styles.popupContainer}>
          <Text style={styles.popupText}>Are you sure?</Text>
          <View style={styles.popupButtons}>
            <TouchableOpacity style={styles.confirmButton} onPress={confirmLogout}>
              <Text style={styles.popupButtonText}>Confirm</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={() => setLogoutPopupVisible(false)}>
              <Text style={styles.popupButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>

    </>
  )
}
