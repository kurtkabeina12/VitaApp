import {
    Button,
    Image,
    KeyboardAvoidingView,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native'
import React, { useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigation } from '@react-navigation/native';
import { useHeaderHeight } from '@react-navigation/elements';
// import {socket} from '../Socket';
import { Avatar } from 'react-native-elements';
import { getUUID } from '../SecureStorageService';
import * as Device from "expo-device";
import { Platform } from 'react-native';
import {initSocket} from '../Socket';
import {AntDesign, FontAwesome, Ionicons} from "@expo/vector-icons";

export default function ChatMessageGroupScreen({ route }) {
    const headerHeight = useHeaderHeight();
    const navigation = useNavigation();
    const [isDarkTheme, setIsDarkTheme] = useState(false);
    const scrollViewRef = useRef();
    const { userId, chatTitle, token, tk_type, InfoImage } = route.params || {};
    const roomId = Array.isArray(route.params.roomId) ? route.params.roomId.map(room => room.id)[0] : route.params.roomId;
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [imageUrls, setImageUrls] = useState("");
    const [infoImg, setInfoImg] = useState("");
    const [uuid, setUuid] = useState(null);
    const socket = initSocket(token, tk_type)
    // console.log(userId)
console.log(InfoImage, 'infoImg')

    useEffect(() => {
        const fetchToken = async () => {
            try {
                const uuid = await getUUID();
                setUuid(uuid);
                console.log(uuid);
            } catch (error) {
                console.error('Error fetching token:', error);
            }
        };

        fetchToken();
    }, []);

    useEffect(() => {
        fetch('http://172.20.15.18:8000/get_msg_db', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'authorization': tk_type + " " + token,
                'gcvp_info': Platform.OS + "/" + Device.osInternalBuildId + "/" + Device.osName + "/" + uuid,
            },
            body: JSON.stringify({
                roomId: roomId,
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                const dbMessages = data[0].map(msg => ({ ...msg, source: 'database' }));
                setMessages(dbMessages);
                setUsers(data[1])
                const imageUrls = data[1].map(user => user.img ? `http://172.20.15.18:8000/pics/${user.img}` : undefined);
                setImageUrls(imageUrls);

                // console.log(imageUrls, "urls Image in fetch re")
                // console.log('Response msg:', data);
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    }, []);

    useEffect(() => {
        const avatar = imageUrls;
        console.log(avatar)
        socket.on("hyli", (res) => {
            const user = users.find(user => Number(user.id) === Number(res.staff_id));
            const shortname = user ? user.shortname : '';
            // console.log(res);
            const socketMessage = { ...res, source: 'socket', avatar: avatar, shortname: shortname };
            // console.log(socketMessage)
            setMessages(prevMessages => [...prevMessages, socketMessage]);
        });

        return () => {
            socket.off("hyli");
        };
    }, [users, imageUrls]);



    useEffect(() => {
        const { theme } = route.params;
        setIsDarkTheme(theme === "dark");
    }, [route.params]);

    useLayoutEffect(() => {
        let infImg =  `http://172.20.15.18:8000/pics/${InfoImage}` ;
        setInfoImg(infImg);
        console.log(infoImg)
        navigation.setOptions({
            headerTitle: chatTitle,
            headerTitleStyle: {
                color: isDarkTheme ? "white" : "black",
            },
            headerStyle: {
                backgroundColor: isDarkTheme ? "#18181b" : "#f8fafc",
            },
            headerRight: () => (
              <Avatar
                size="small"
                rounded
                source={{ uri:infImg }}
              />
            ),
            headerLeft:() => (
              <TouchableOpacity>
                <AntDesign name="arrowleft" size={24} color="black" />
              </TouchableOpacity>
            )
        });
    }, [isDarkTheme]);


    const sendMessage = async () => {
        if (message.length > 0) {
            socket.emit('msg', { staff_id: userId, msgtext: message, roomId: roomId });
            console.log('Sending message:', { userId, message, roomId });
            setMessage('');
        }
    }

    const handleBack = async () => {
        // navigation.navigate('Чаты', {userId: userId})
    }
    return (
        <>
            <KeyboardAvoidingView style={{ flex: 1, backgroundColor: isDarkTheme ? "#18181b" : "#F0F0F0" }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={headerHeight}>
                <ScrollView style={{
                    flex: 1,
                    backgroundColor: isDarkTheme ? "#09090b" : "#F0F0F0",
                    padding: 10,
                }}
                    ref={scrollViewRef}
                    onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
                >
                    {messages.map((message, index) => {
                        let timeDisplay;
                        if (message.timestamp) {
                            // socket message
                            const date = new Date(message.timestamp);
                            const hours = date.getHours();
                            const minutes = date.getMinutes();
                            const hoursStr = String(hours).padStart(2, '0');
                            const minutesStr = String(minutes).padStart(2, '0');
                            timeDisplay = `${hoursStr}:${minutesStr}`;
                        } else {
                            // db messages
                            const timestamp = message.msgdt;
                            const date = new Date(timestamp);
                            const hours = date.getHours();
                            const minutes = date.getMinutes();
                            const hoursStr = String(hours).padStart(2, '0');
                            const minutesStr = String(minutes).padStart(2, '0');
                            timeDisplay = `${hoursStr}:${minutesStr}`;
                        }
                        const user = users.find(user => user.id === message.staff_id);
                        const shortname = user ? user.shortname : '';
                        const isOurMessage = Number(message.staff_id) === Number(userId);
                        const shortnameDisplay = isOurMessage ? '' : shortname;
                        return (
                            <View style={{ flexDirection: isOurMessage ? 'row-reverse' : 'row', alignItems: 'center', alignSelf:isOurMessage ? "flex-end" : "flex-start"  }} key={index}>
                                {!isOurMessage && message.source === 'database' && (
                                    <Avatar
                                        size="small"
                                        rounded
                                        source={{ uri: imageUrls[users.findIndex(user => user.id === message.staff_id)] }}
                                    />
                                )}

                                {message.source === 'socket' && (
                                    <Avatar
                                        size="small"
                                        rounded
                                        source={{ uri: message.avatar[users.findIndex(user => Number(user.id) === Number(message.staff_id))] }}
                                    />
                                )}
                                <View
                                    key={index}
                                    style={[
                                        styles.messageContainer,
                                        {
                                            alignSelf: isOurMessage ? "flex-end" : "flex-start",
                                            backgroundColor: isOurMessage ? "#f0fdf4" : "#f8fafc",
                                        },
                                    ]}
                                >
                                    {!isOurMessage && message.source === 'database' && <Text style={styles.userNameText}>{shortnameDisplay}</Text>}
                                    {!isOurMessage && message.source === 'socket' && <Text style={styles.userNameText}>{message.shortname}</Text>}
                                    <Text style={styles.messageText}>{message?.msgtext}{message.text}</Text>
                                    <Text style={styles.messageTime}>{timeDisplay}</Text>
                                </View>
                            </View>
                        )
                    })}

                </ScrollView>

                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 10,
                    borderTopWidth: 1,
                    borderColor: isDarkTheme ? "transparent" : "#dddddd",
                    marginBottom: 5
                }}
                    onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
                    onLayout={() => scrollViewRef.current.scrollToEnd()}
                >
                    <TextInput
                        style={{
                            flex: 1,
                            borderWidth: 1,
                            height: 40,
                            borderColor: isDarkTheme ? "transparent" : "#dddddd",
                            borderRadius: 20,
                            paddingHorizontal: 10,
                        }}
                        keyboardAppearance={isDarkTheme ? 'dark' : 'light'}
                        placeholder='Напишите сообщение...'
                        placeholderTextColor={isDarkTheme ? "#404040" : "black"}
                        backgroundColor={isDarkTheme ? "#09090b" : "#F0F0F0"}
                        value={message}
                        onChangeText={(text) => {
                            setMessage(text);
                        }}
                    />
                    <Pressable
                        onPress={sendMessage}
                        style={{
                            backgroundColor: isDarkTheme ? "#1e3a8a" : "#007bff",
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                            borderRadius: 20,
                            marginRight: 5,
                            marginLeft: 5
                        }}>
                        <Text style={styles.sendButtonText}>Отправить</Text>
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </>
    )
}

const styles = StyleSheet.create({
    messageContainer: {
        borderRadius: 10,
        padding: 10,
        marginBottom: 10,
        maxWidth: "80%",
    },
    messageTime: {
        fontSize: 10,
        color: "#6b7280",
    },
    messageText: {
        marginBottom: 5,
        fontSize: 14,
        color: "black",
    },
    userNameText: {
        fontSize: 12,
        color: "#818cf8",
        marginBottom: 5,
    },
    sendButtonText: {
        color: "white",
    }
})