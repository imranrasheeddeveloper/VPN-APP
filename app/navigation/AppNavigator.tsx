import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import AuthChoiceScreen from '../screens/AuthChoiceScreen'
import ConnectScreen from '../screens/ConnectScreen'
import LoginScreen from '../screens/LoginScreen'
import RegisterScreen from '../screens/RegisterScreen'
import ServersScreen from '../screens/ServersScreen'
import SplashScreen from '../screens/SplashScreen'
import UpgradeScreen from '../screens/UpgradeScreen'

export type RootStackParamList = {
  Splash: undefined
  AuthChoice: { device: any }
  Login: { device: any }
  Register: { device: any }
  Servers: { device: any; plan: 'free' | 'premium' }
  Connect: { device: any; plan: 'free' | 'premium'; server: any }
  Upgrade: undefined 
}



const Stack = createNativeStackNavigator<RootStackParamList>()

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="AuthChoice" component={AuthChoiceScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Servers" component={ServersScreen} />
        <Stack.Screen name="Connect" component={ConnectScreen} />
        <Stack.Screen name="Upgrade" component={UpgradeScreen} />

      </Stack.Navigator>
    </NavigationContainer>
  )
}
