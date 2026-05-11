import { Text, View } from "react-native";
import { NavigationContainer } from '@react-navigation/native'
import { AuthNavigator } from '@/app/navigation/AuthNavigator'

export default function Index() {
  return (
      <NavigationContainer>
         <AuthNavigator />
      </NavigationContainer>
  );
}
