// App.js
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import ChatScreen from './screens/ChatScreen'; // Import Chat screen
import ImageConversation from './screens/ImageConversation'; // Path to ImageConversation
import Login from './screens/Login'; // Import Login screen
import Register from './screens/Register';

const Stack = createStackNavigator();
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="ImageConversation" component={ImageConversation} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
