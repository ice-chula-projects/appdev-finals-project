import { createNativeStackNavigator } from '@react-navigation/native-stack'
//import { LoginPage } from '@/app/auth/login_page'
import { SignupPage } from '@/app/auth/signup_page'

const Stack = createNativeStackNavigator()

export const AuthNavigator = () => (
  <Stack.Navigator initialRouteName="Login">
    {/* <Stack.Screen name="Login" component={LoginPage} /> */}
    <Stack.Screen name="Signup" component={SignupPage} />
  </Stack.Navigator>
)