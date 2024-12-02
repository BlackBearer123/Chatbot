import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ChatScreen({ navigation }) {
  const [userInput, setUserInput] = useState('');
  const [conversation, setConversation] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [introSent, setIntroSent] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [showTitle, setShowTitle] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState(null);


  useEffect(() => {
    fetchChatHistory();
  }, []);

  const fetchChatHistory = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');  // Fetch token from AsyncStorage
  
      if (!token) {
        Alert.alert('Error', 'No token found! Please log in again.');
        return;
      }
  
      const response = await axios.get('http:///192.168.0.119:5000/chat-history', {
        headers: { Authorization: `Bearer ${token}` }  // Send token in Authorization header
      });
  
      setChatHistory(response.data.chat_histories || []);
    } catch (error) {
      console.error('Error fetching chat history:', error);
      Alert.alert('Error', 'Failed to fetch chat history. Please check your authentication.');
    } finally {
      setIsLoading(false);
    }
  };
  
  

  const saveChatHistory = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'No token found!');
        return;
      }
  
      if (!Array.isArray(conversation) || conversation.length === 0) {
        console.log('No messages to save. Skipping saveChatHistory.');
        return;
      }
  
      console.log('Saving chat history:', { messages: conversation });
  
      await axios.post(
        'http:///192.168.0.119:5000/save-chat-history',
        { messages: conversation },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      console.log('Chat history saved successfully.');
      await fetchChatHistory();
    } catch (error) {
      console.error('Error saving chat history:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to save chat history');
    }
  };
  
  const deleteChatHistory = async (chatId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'No token found!');
        return;
      }

      await axios.delete(`http:///192.168.0.119:5000/delete-chat?chat_id=${chatId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Refresh chat history after deletion
      await fetchChatHistory();
      Alert.alert('Success', 'Chat history deleted successfully');
    } catch (error) {
      console.error('Error deleting chat history:', error);
      Alert.alert('Error', 'Failed to delete chat history');
    }
  };

  const handleTranslate = async () => {
    if (userInput.trim() === '') return;
  
    const newMessage = { sender: 'You', text: userInput };
    setConversation((prev) => [...prev, newMessage]);
  
    if (!introSent) {
      setIntroSent(true);
      setShowTitle(false);
    }
  
    try {
      const language = detectLanguage(userInput);
      const phrase = extractPhrase(userInput); // Updated to handle phrases
  
      if (!language || !phrase) {
        const errorMessage = { sender: 'Chatbot', text: "Sorry, I couldn't understand the request." };
        setConversation((prev) => [...prev, errorMessage]);
        return;
      }
  
      // Handle phrase translation
      const result = await axios.post('http:///192.168.0.119:5000/translates', {
        phrase, // Send the entire phrase
        language,
      });
  
      if (result.data.translatedPhrase) {
        const botResponse = {
          sender: 'Chatbot',
          text: `The translated phrase is: ${result.data.translatedPhrase}`,
        };
        setConversation((prev) => [...prev, botResponse]);
      }
    } catch (error) {
      const errorMessage = {
        sender: 'Chatbot',
        text: 'There was an issue with the translation request. Please try again.',
      };
      setConversation((prev) => [...prev, errorMessage]);
    }
  
    setUserInput('');
  };
  


  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');  // Clear stored token
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],  // Navigate to the Login screen
      });
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Error', 'Failed to log out.');
    }
  };
  
  

  const viewChatHistory = (chat) => {
    if (selectedConversation?.chat_id === chat.chat_id) {
      // If the same chat is already selected, don't do anything
      return;
    }
  
    setConversation(chat.messages); // Load the messages from the selected chat
    setSelectedConversation(chat); // Track the selected chat
    setSidebarVisible(false);       // Close the sidebar
  };
  

  const startNewConversation = async () => {
    try {
      // Save current conversation if there are messages
      if (conversation.length > 0 && !selectedConversation) {
        console.log('Saving current conversation...');
        await saveChatHistory();
      }
  
      // Reset conversation state
      setConversation([]);
      setSelectedConversation(null);
      setIntroSent(false); // Reset intro message state
      setSidebarVisible(false);
    } catch (error) {
      console.error('Error starting a new conversation:', error);
      Alert.alert('Error', 'Failed to save the current conversation before starting a new one.');
    }
  };
  

  // Helper functions
  const detectLanguage = (input) => {
    const match = input.match(/\b(french|german|spanish)\b/i);
    return match ? match[0].toLowerCase() : null;
  };

  const extractPhrase = (input) => {
    // Example: Detect patterns like "What is the French for 'open the door'?"
    const matchForPattern = input.match(/\b(?:for|of)\s+(\w+)/i);
    const quotePattern = input.match(/['"](.+?)['"]/);
  
    // If the 'for' or 'of' pattern is found and has a match
    if (matchForPattern) {
      const phraseMatch = input.match(/['"](.+?)['"]/);
      return phraseMatch ? phraseMatch[1] : null;
    }
  
    // If only the quoted phrase pattern is found
    return quotePattern ? quotePattern[1] : input.trim();
  };
  
  
  return (
    <View style={styles.container}>
      {/* Sidebar */}
      {sidebarVisible && (
        <View style={styles.sidebar}>
          <TouchableOpacity style={styles.closeButton} onPress={() => setSidebarVisible(false)}>
            <Text style={styles.closeButtonText}>X</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sidebarButton} onPress={startNewConversation}>
            <Text style={styles.sidebarButtonText}>Start New Conversation</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sidebarButton} onPress={() => navigation.navigate('ImageConversation')}>
            <Text style={styles.sidebarButtonText}>Image Conversation</Text>
          </TouchableOpacity>

          <Text style={styles.historyTitle}>Chat History</Text>

          <ScrollView style={styles.historyContainer}>
  {isLoading ? (
    <ActivityIndicator size="large" color="#4CAF50" />
  ) : (
    chatHistory.map((chat) => (
      <View key={chat.chat_id} style={styles.historyItemContainer}>
        <TouchableOpacity
          style={styles.historyItem}
          onPress={() => viewChatHistory(chat)} // Call the function to view selected chat
        >
          <Text style={styles.historyText}>
            {new Date(chat.timestamp).toLocaleDateString()}
            {'\n'}
            {chat.messages[0]?.text?.substring(0, 30)}...
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteChatHistory(chat.chat_id)}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    ))
  )}
</ScrollView>


          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main Chat Area */}
{conversation.length === 0 && !introSent && (
  <Text style={styles.welcomeMessage}>Welcome! Ask me to translate words.</Text>
)}

<ScrollView style={styles.chatContainer}>
  {conversation.map((msg, index) => (
    <View key={index} style={styles.message}>
      <Text style={msg.sender === 'You' ? styles.userText : styles.chatbotText}>
        {msg.sender}: {msg.text}
      </Text>
    </View>
  ))}
</ScrollView>


      {/* Input Area */}
      {!selectedConversation && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={userInput}
            onChangeText={setUserInput}
            placeholder="Type your message..."
            onSubmitEditing={handleTranslate}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleTranslate}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Sidebar Toggle Button */}
      {!sidebarVisible && (
  <TouchableOpacity
    style={styles.sidebarToggleButton}
    onPress={() => {
      setSidebarVisible(true); // Show the sidebar
    }}
  >
    <Text style={styles.sidebarToggleButtonText}>☰</Text>
  </TouchableOpacity>
)}
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      justifyContent: 'flex-end',
      backgroundColor: '#fff',
    },
    welcomeMessage: {
      fontSize: 36,
      fontWeight: 'bold',
      textAlign: 'center',
      marginVertical: 100,
      color: '#4CAF50',
      backgroundColor: 'transparent',
      padding: 20,
      borderRadius: 10,
      fontFamily: 'Arial',
      textShadowColor: 'rgba(0, 0, 0, 0.2)',
      textShadowOffset: { width: 2, height: 2 },
      textShadowRadius: 5,
      letterSpacing: 2,
    },
    chatContainer: {
      flex: 1,
      marginBottom: 10,
    },
    message: {
      marginVertical: 5,
    },
    userText: {
      alignSelf: 'flex-end',
      backgroundColor: '#cce5ff',
      padding: 10,
      borderRadius: 5,
      maxWidth: '80%',
    },
    chatbotText: {
      alignSelf: 'flex-start',
      backgroundColor: '#e2f7e2',
      padding: 10,
      borderRadius: 5,
      maxWidth: '80%',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#ccc',
      padding: 10,
      borderRadius: 5,
      marginBottom: 10,
    },
    input: {
      flex: 1,
      padding: 10,
    },
    sendButton: {
      backgroundColor: '#4CAF50',
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderRadius: 5,
    },
    sendButtonText: {
      color: 'white',
      fontWeight: 'bold',
    },
    response: {
      color: 'black',
      fontSize: 18,
      textAlign: 'center',
      marginVertical: 20,
    },
    sidebar: {
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      padding: 20,
      zIndex: 1,
      width: 250,
    },
    closeButton: {
      alignSelf: 'flex-end',
    },
    closeButtonText: {
      fontSize: 24,
      color: 'white',
    },
    sidebarButton: {
      marginVertical: 10,
      backgroundColor: '#4CAF50',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 5,
    },
    sidebarButtonText: {
      color: 'white',
      fontWeight: 'bold',
    },
    historyTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: 'white',
      marginVertical: 10,
    },
    historyContainer: {
      flex: 1,
      maxHeight: '80%',
      marginBottom: 20,
    },
    historyItem: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      marginBottom: 5,
      backgroundColor: '#fff',
      borderRadius: 5,
    },
    historyText: {
      fontSize: 16,
    },
    logoutButton: {
        backgroundColor: '#f44336', // Red color for logout button
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        marginBottom: 20, // Ensure space below the button
        alignSelf: 'center', // Center the button horizontally
      },
      logoutButtonText: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
      },
    sidebarToggleButton: {
      position: 'absolute',
      top: 20,
      left: 20,
      backgroundColor: '#4CAF50',
      padding: 10,
      borderRadius: 5,
      zIndex: 2,
    },
    sidebarToggleText: {
      fontSize: 24,
      color: 'white',
    },
  });