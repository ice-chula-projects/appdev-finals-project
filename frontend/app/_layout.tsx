import { Stack, router } from "expo-router";
import { Text, View, TouchableOpacity, Image, StyleSheet } from "react-native";

const styles = StyleSheet.create({
  homeIcon: {
    width: 40,
    height: 40,
    resizeMode: "contain"
  },
  buttons: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
    gap: 10
  },
  loginButton: {
    color: "white",
    backgroundColor: "#007bff",
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 5,
    overflow: "hidden",
    fontWeight: "600",
    fontSize: 18
  },

  signupButton: {
    color: "white",
    backgroundColor: "#ffa600",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
    fontWeight: "500",
    fontSize: 18
    
  },
  logoutButton: {
    color: "white",
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
    fontWeight: "500",
    fontSize: 20
  }
})

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.push("/")} style={{ marginLeft: 15 }}>
            <Image 
              source={require("../assets/images/message_logo.png")}
              style={styles.homeIcon}
            />
          </TouchableOpacity>
        ),

        headerRight: () => (
          <View style={styles.buttons}>
            <TouchableOpacity onPress={() => router.push("/auth/login_page")}>
              <Text style={styles.loginButton}>Login</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/auth/signup_page")}>
              <Text style={styles.signupButton}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        )
      }}
    />
  );
}
