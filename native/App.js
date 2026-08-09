import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Image,
  Button,
  Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import GeminiAPI from '../src/gemini-api';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY';

export default function App() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: '🏥 Welcome to Fracturepedia! I\'m your AI-powered fracture reference guide. Ask me anything about fractures, diagnoses, treatments, or medical imaging.',
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [profileImages, setProfileImages] = useState([]);
  const scrollViewRef = useRef(null);
  const geminiAPI = useRef(new GeminiAPI(GEMINI_API_KEY));

  // Request camera roll permissions
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need camera roll permissions to upload images');
      }
    })();
  }, []);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.cancelled) {
        setProfileImages([...profileImages, result.uri]);
        const message = {
          id: messages.length + 1,
          text: '📸 Profile image uploaded successfully!',
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, message]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const aiResponse = await geminiAPI.current.askFracturepedia(inputValue);
      const aiMessage = {
        id: messages.length + 2,
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        id: messages.length + 2,
        text: `Error: ${error.message}`,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }

    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏥 Fracturepedia</Text>
        <Text style={styles.headerSubtitle}>AI-Powered Fracture Reference</Text>
      </View>

      {/* Profile Images Section */}
      {profileImages.length > 0 && (
        <ScrollView horizontal style={styles.profileImagesContainer}>
          {profileImages.map((uri, index) => (
            <Image
              key={index}
              source={{ uri }}
              style={styles.profileImage}
            />
          ))}
        </ScrollView>
      )}

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.message,
              message.sender === 'user'
                ? styles.messageUser
                : styles.messageAI
            ]}
          >
            <Text style={styles.messageAvatar}>
              {message.sender === 'ai' ? '🤖' : '👤'}
            </Text>
            <View style={styles.messageBubble}>
              <Text style={styles.messageText}>{message.text}</Text>
              <Text style={styles.messageTime}>
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
          </View>
        ))}
        {isLoading && (
          <View style={[styles.message, styles.messageAI]}>
            <Text style={styles.messageAvatar}>🤖</Text>
            <ActivityIndicator size='large' color='#1976d2' />
          </View>
        )}
      </ScrollView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <TouchableOpacity style={styles.imageBtn} onPress={pickImage}>
          <Text style={styles.imageBtnText}>📸</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder='Ask about fractures...'
          value={inputValue}
          onChangeText={setInputValue}
          editable={!isLoading}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, isLoading && styles.sendBtnDisabled]}
          onPress={handleSendMessage}
          disabled={isLoading || !inputValue.trim()}
        >
          <Text style={styles.sendBtnText}>
            {isLoading ? '...' : '→'}
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1976d2',
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  profileImagesContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 10,
  },
  messagesContainer: {
    flex: 1,
    padding: 15,
  },
  message: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-end',
  },
  messageUser: {
    justifyContent: 'flex-end',
  },
  messageAI: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    fontSize: 28,
    marginHorizontal: 10,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  messageText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'flex-end',
  },
  imageBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e8f4f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  imageBtnText: {
    fontSize: 20,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    marginRight: 10,
  },
  sendBtn: {
    backgroundColor: '#1976d2',
    borderRadius: 20,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#ccc',
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
