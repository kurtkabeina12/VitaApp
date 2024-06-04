import {
  Button,
  Image,
  KeyboardAvoidingView, Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput, TouchableHighlight, TouchableOpacity,
  View
} from 'react-native'
import { Platform } from 'react-native';
import React, {useContext, useEffect, useLayoutEffect, useRef, useState} from 'react'
import {useNavigation} from '@react-navigation/native';
import {useHeaderHeight} from '@react-navigation/elements';
import {socket} from '../Socket';
import {initSocket} from '../Socket';
import BottomSheet, {BottomSheetMethods} from '@devvie/bottom-sheet';
import {AntDesign, Entypo, Feather, FontAwesome, MaterialCommunityIcons} from '@expo/vector-icons';
import {SimpleLineIcons} from '@expo/vector-icons';
import {Ionicons} from '@expo/vector-icons';
import {FontAwesome5} from '@expo/vector-icons';
import LocationComponent from "../components/LocationComponent";
import { getUUID } from '../SecureStorageService';
import * as Device from "expo-device";
import PhoneComponent from "../components/PhoneComponent";
import DocumentComponent from "../components/DocumentComponent";
import ImageVideoComponent from "../components/ImageVideoComponent";
import BouncyCheckbox from "react-native-bouncy-checkbox";

export default function ChatMessageScreen({route}) {
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation();
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const scrollViewRef = useRef();
  const {userId, chatTitle, token, tk_type} = route.params || {};
  const roomId = Array.isArray(route.params.roomId) ? route.params.roomId.map(room => room.id)[0] : route.params.roomId;
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [serverResponse, setServerResponse] = useState("");
  const [users, setUsers] = useState([]);
  const [imageUrls, setImageUrls] = useState("");
  const [page, setPage] = useState(0);
  const sheetRef = useRef(null);
  const [recentAssets, setRecentAssets] = useState([]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [uuid, setUuid] = useState(null);
  const [showImages, setShowImages] = useState(true);
  const [showPhoneComponent, setShowPhoneComponent] = useState(false);
  const [showDocumentComponent, setshowDocumentComponent] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [longPressed, setLongPressed] = useState(false);
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const inputRef = useRef(null);
const socket = initSocket(token, tk_type);
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const uuid = await getUUID();
        setUuid(uuid);
        // console.log(uuid);
      } catch (error) {
        console.error('Error fetching token:', error);
      }
    };

    fetchToken();
  }, []);

  // console.log(userId, roomId)
  useEffect(() => {
    fetch('http://172.20.15.18:8000/get_msg_db', {
      headers: {
        'Content-Type': 'application/json',
        'authorization': tk_type + " " + token,
        'gcvp_info': Platform.OS + "/" + Device.osInternalBuildId + "/" + Device.osName + "/" + uuid,
      },
      body: JSON.stringify({
        roomId: roomId,
      }),
      method: 'POST',
    })
      .then((response) => response.json())
      .then((data) => {
        const dbMessages = data[0].map(msg => ({...msg, source: 'database'}));
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
    // console.log(avatar)
    socket.on("hyli", (res) => {
      console.log(res + "До отрисовки")
      const user = users.find(user => Number(user.id) === Number(res.staff_id));
      const shortname = user ? user.shortname : '';
      const socketMessage = {...res, source: 'socket', avatar: avatar, shortname: shortname};
      setMessages(prevMessages => [...prevMessages, socketMessage]);
      console.log(socketMessage + "После отрисовки")
    });

    return () => {
      socket.off("hyli");
    };
  }, [users]);

  useEffect(() => {
    const {theme} = route.params;
    setIsDarkTheme(theme === "dark");
  }, [route.params]);

  // useLayoutEffect(() => {
  //   navigation.setOptions({
  //     headerTitle: chatTitle,
  //     headerTitleStyle: {
  //       color: isDarkTheme ? "white" : "black",
  //     },
  //     headerLeft: () => (
  //       <AntDesign onPress={goChatList} name="arrowleft" size={24} color={isDarkTheme ? "white" : "black"}/>
  //     ),
  //     headerStyle: {
  //       backgroundColor: isDarkTheme ? "#18181b" : "#f8fafc",
  //     },
  //   });
  // }, [isDarkTheme]);

  useLayoutEffect(() => {
    if (longPressed) {
      navigation.setOptions({
        headerTitle:() => (
          <View style={{ flexDirection: 'row', gap: 40, marginLeft:40 }}>
            <AntDesign name="close" onPress={closeHeader} size={24} color={isDarkTheme ? "white" : "black"} />
            <AntDesign name="pushpino" onPress={secureMessage} size={24} color={isDarkTheme ? "white" : "black"} />
          </View>
        ),
        headerRight: () => (
          <View style={{ flexDirection: 'row', gap: 40 }}>
            <AntDesign name="delete" onPress={deleteMessage} size={24} color="#b91c1c" />
            <Feather name="edit" size={24} onPress={changeMessage} color={isDarkTheme ? "white" : "black"} />
          </View>
        ),
      });
    } else {
      navigation.setOptions({
        headerTitle: chatTitle,
        headerTitleStyle: {
          color: isDarkTheme ? "white" : "black",
        },
        headerRight:null,
        headerStyle: {
          backgroundColor: isDarkTheme ? "#18181b" : "#f8fafc",
        },
      });
    }
  }, [longPressed, isDarkTheme]);

  const secureMessage = async () => {
    console.log("secureMessage")
  }

  const deleteMessage = async () => {
    if(selectedMessage){
      console.log(selectedMessage)
    }
    console.log("delete")
  }
  const closeHeader = async () => {
    setLongPressed(false);
    setShowCheckboxes(false);
  }
  const goChatList = async () => {
    navigation.navigate('Чаты', {gcvplk_tk_uid: userId, token: token, tk_type: tk_type});
  }

  const handleLongPress = (message) => {
    console.log('handleLongPress called with message:', message);
    setSelectedMessages(prevMessages => {
      if (prevMessages.includes(message)) {
        return prevMessages.filter(msg => msg !== message);
      } else {
        return [...prevMessages, message];
      }
    });
    setSelectedMessage(message);
    setLongPressed(true);
    setShowCheckboxes(true);
    console.log(message);
  };

  const changeMessage = async () => {
    console.log('changeMessage called with selectedMessage:', selectedMessage);
    if (selectedMessage) {
      setMessage(selectedMessage.msgtext || selectedMessage.text);
      inputRef.current.focus();
    }
    console.log(selectedMessage);
  };

  const sendMessage = async () => {
    // if (message.length > 0) {
      socket.emit('msg', {staff_id: userId, msgtext: message, roomId: roomId});
      console.log('Sending message:', {userId, message, roomId});

      // socket.on('hyli', (data) => {
      //   console.log('Received data from server:', data);
      //   setServerResponse(data);
      //   setMessages(prevMessages => [...prevMessages, { senderId: userId, text: data }]);
      // });

      // fetch('http://172.20.15.18:8000/send_chat', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     staff_id: userId,
      //     roomId: roomId,
      //     msgtext: message,
      //   }),
      // })
      //   .then((response) => response.text())
      //   .then((text) => {
      //     console.log('Response text:', text);
      //   })
      //   .catch((error) => {
      //     console.error('Error:', error);
      //   });

      setMessage('');
    // }
  }

  return (
    <>
      <KeyboardAvoidingView style={{flex: 1, backgroundColor: isDarkTheme ? "#18181b" : "#F0F0F0"}}
                            behavior={Platform.OS === "ios" ? "padding" : "height"}
                            keyboardVerticalOffset={headerHeight}>
        <ScrollView
          style={{
            flex: 1,
            backgroundColor: isDarkTheme ? "#09090b" : "#F0F0F0",
            padding: 10,
          }}
          ref={scrollViewRef}
          onContentSizeChange={() => scrollViewRef.current.scrollToEnd({animated: true})}
          keyboardShouldPersistTaps='always'
        >
          {/* {messages.map((message, index) => {
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
              // db message
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
            const avatar = user && user.img ? `http://172.20.15.18:8000/pics/${user.img}` : undefined;
            const isOurMessage = Number(message.staff_id) === Number(userId);
            const shortnameDisplay = isOurMessage ? '' : shortname;

            return (
              <>
                {!isOurMessage && (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Avatar
                      size="small"
                      rounded
                      source={{ uri: avatar }}
                    />
                  </View>
                )}
                <View
                  key={index}
                  style={[
                    styles.messageContainer,
                    {
                      alignSelf: Number(message.staff_id) === Number(userId) ? "flex-end" : "flex-start",
                      backgroundColor: Number(message.staff_id) === Number(userId) ? "#f0fdf4" : "#f8fafc",
                    },
                  ]}
                >
                  {!isOurMessage && <Text style={styles.userNameText}>{shortnameDisplay}</Text>}
                  <Text style={styles.messageText}>{message?.msgtext}{message.text}</Text>
                  <Text style={styles.messageTime}>{timeDisplay}</Text>
                </View>
              </>
            )
          })} */}
          {messages.map((message, index) => {
            let timeDisplay;
            const user = users.find(user => user.id === message.staff_id);
            const shortname = user ? user.shortname : '';
            const isOurMessage = Number(message.staff_id) === Number(userId);
            const shortnameDisplay = isOurMessage ? '' : shortname;

            if (message.msgdt) {
              // socket message
              const date = new Date(message.msgdt);
              const hours = date.getHours();
              const minutes = date.getMinutes();
              const hoursStr = String(hours).padStart(2, '0');
              const minutesStr = String(minutes).padStart(2, '0');
              timeDisplay = `${hoursStr}:${minutesStr}`
            } else {
              // db messages
              console.log(message)
              const timestamp = message.msgdt;
              const date = new Date(timestamp);
              const hours = date.getHours();
              const minutes = date.getMinutes();
              const hoursStr = String(hours).padStart(2, '0');
              const minutesStr = String(minutes).padStart(2, '0');
              timeDisplay = `${hoursStr}:${minutesStr}`;
            }
            return (
              <TouchableOpacity
                key={index}
                onPress={() => handleLongPress(message)}
              >
                <View style={{
                  flexDirection: isOurMessage ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  alignSelf: isOurMessage ? "flex-end" : "flex-start"
                }}>
                  {showCheckboxes && (
                    <BouncyCheckbox
                      isChecked={selectedMessages.includes(message)}
                      size={25}
                      fillColor="#00862b"
                      unfillColor="#FFFFFF"
                      iconStyle={{ borderColor: "#00862b", marginRight: isOurMessage ? -15 : -10, marginLeft: 0, marginBottom: 10 }}
                    />
                  )}
                  <View
                    style={[
                      styles.messageContainer,
                      {
                        alignSelf: Number(message.staff_id) === Number(userId) ? "flex-end" : "flex-start",
                        backgroundColor: isOurMessage ? "#f0fdf4" : "#f8fafc",
                      },
                    ]}
                  >
                    <Text style={styles.messageText}>{message?.msgtext}{message.text}</Text>
                    <Text style={styles.messageTime}>{timeDisplay}</Text>
                  </View>
                </View>
              </TouchableOpacity>
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
              onContentSizeChange={() => scrollViewRef.current.scrollToEnd({animated: true})}
              onLayout={() => scrollViewRef.current.scrollToEnd()}
              keyboardShouldPersistTaps='always'
        >
          <SimpleLineIcons
            name="paper-clip"
            size={24}
            onPress={() => sheetRef.current.open()}
            color={isDarkTheme ? "white" : "black"}
            style={{
              marginLeft: 10,
              marginRight: 10
            }}
          />

          <TextInput
            style={{
              flex: 1,
              borderWidth: 1,
              height: 40,
              borderColor: isDarkTheme ? "transparent" : "#dddddd",
              borderRadius: 20,
              paddingHorizontal: 10,
            }}
            ref={inputRef}
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
      <BottomSheet ref={sheetRef} index={0} snapPoints={['50%', '100%']}>
        {showPhoneComponent && <PhoneComponent />}
        {showDocumentComponent && <DocumentComponent />}
        {showLocationModal && <LocationComponent />}
        {showImages ? (
         <ImageVideoComponent />
        ) : (
          ""
          // <LocationComponent />
        )}

        <View style={styles.iconContainer}>
          <Pressable onPress={() => {setShowImages(true);setShowLocationModal(false); setShowPhoneComponent(false); setshowDocumentComponent(false) }}>
            <Ionicons name="images" size={30}  style={{color: showImages ? "#00862b" : "#696969"}} />
          </Pressable>
          <Pressable onPress={() => {setshowDocumentComponent(true); setShowPhoneComponent(false); setShowLocationModal(false); setShowImages(false)}}>
            <Ionicons name="document-text" size={30} style={{color: showDocumentComponent ? "#00862b" : "#696969"}} />
          </Pressable>
          <Pressable onPress={() => {setShowLocationModal(true); setShowImages(false); setShowPhoneComponent(false); setshowDocumentComponent(false)}}>
            <FontAwesome5 name="map-marker-alt" size={30}  style={{color: showLocationModal ? "#00862b" : "#696969"}}/>
          </Pressable>
          <Pressable onPress={() => {setShowImages(false); setShowLocationModal(false); setShowPhoneComponent(true); setshowDocumentComponent(false)}}>
            <FontAwesome name="user-circle" size={30} style={{color: showPhoneComponent ? "#00862b" : "#696969"}} />
          </Pressable>
        </View>
      </BottomSheet>
    </>
  )
}

const styles = StyleSheet.create({
    centeredView: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 22
    },
    modalView: {
      margin: 20,
      backgroundColor: "white",
      borderRadius: 20,
      padding: 35,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5
    },
    button: {
      borderRadius: 20,
      padding: 10,
      elevation: 2
    },
    buttonClose: {
      backgroundColor: "#2196F3",
    },
    textStyle: {
      color: "white",
      fontWeight: "bold",
      textAlign: "center"
    },
    modalText: {
      marginBottom: 15,
      textAlign: "center"
    },
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
  contentContainer:{
    display:'flex',
    flexDirection:"row",
    flexWrap:'wrap',
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#dddddd',
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