import React, {useEffect, useState} from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import WebViewScreen from './Screens/WebViewScreen';
import ChatList from './Screens/ChatListScreen';
import ChatMessageScreen from './Screens/ChatMessageScreen';
import AddChatScreen from './Screens/AddChatScreen';
import AddChatGroupScreen from './Screens/AddChatGroupScreen';
import ChatMessageGroupScreen from './Screens/ChatMessageGroupScreen';
import TestLoginScreen from "./Screens/TestLoginScreen";
import TestScreen from "./Screens/TestScreen";
import TestSocketScreen from "./Screens/TestSocketScreen";
import CameraComponent from "./components/CameraComponent";
import AddChatScreenTest from "./Screens/AddChatScreenTest"
import ShowFullImage from "./components/ShowFullImage";
import ChatMessageGroupScreenTest from "./Screens/ChatMessageGroupScreenTest";
import InfoForGroupScreen from "./Screens/InfoForGroupScreen";
const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true)
    return () => backHandler.remove()
  }, [])

  return (
    <GestureHandlerRootView style={styles.container}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="WebViewScreen"
            component={TestLoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="Чаты" component={ChatList}
                        options={{
                          gestureEnabled: false,
                          headerTitleAlign: 'center',
                          alignSelf: 'center',
                          textAlign: "center",
                          flex:1,
                        }}
          />
          {/*<Stack.Screen name='Messages'  component={ChatMessageScreen} />*/}
          {/*<Stack.Screen name='Test' component={TestScreen} />*/}
          <Stack.Screen name='Messages' options={{
            headerTitleAlign: 'center',
            alignSelf: 'center',
            textAlign: "center",
            flex:1,
          }} component={TestSocketScreen}/>
          {/*<Stack.Screen name='MessagesGroup' component={ChatMessageGroupScreen} />*/}
          <Stack.Screen name='MessagesGroup' component={ChatMessageGroupScreenTest} />
          {/*<Stack.Screen name='AddChat' component={AddChatScreen} />*/}
          <Stack.Screen name='AddChat' component={AddChatScreenTest} />
          <Stack.Screen name="Camera" component={CameraComponent} options={{ presentation: 'modal' }} />
          <Stack.Screen name="Info" component={InfoForGroupScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name='AddGroupChat' component={AddChatGroupScreen} />
          <Stack.Screen name='showImage' options={{headerShown:false,  presentation: 'modal'}} component={ShowFullImage}/>
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});