import {
  ActivityIndicator,
  Button, FlatList,
  Image, Keyboard,
  KeyboardAvoidingView, LayoutAnimation, Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput, TouchableHighlight, TouchableOpacity,
  View, Dimensions, ImageBackground
} from 'react-native'
import React, {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react'
import {useNavigation} from '@react-navigation/native';
import {useHeaderHeight} from '@react-navigation/elements';
import logo from '../assets/logo.png'
// import {socket} from '../Socket';
import {initSocket} from '../Socket';
import BottomSheet, {BottomSheetMethods} from '@devvie/bottom-sheet';
import {AntDesign, Entypo, Feather, FontAwesome, MaterialCommunityIcons} from '@expo/vector-icons';
import {SimpleLineIcons} from '@expo/vector-icons';
import {Ionicons} from '@expo/vector-icons';
import {getUUID} from '../SecureStorageService';
import * as Device from "expo-device";
import { Platform } from 'react-native';
import PhoneComponent from "../components/PhoneComponent";
import DocumentComponent from "../components/DocumentComponent";
import ImageVideoComponent from "../components/ImageVideoComponent";
import BouncyCheckbox from "react-native-bouncy-checkbox";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import IntentLauncher, { IntentConstant } from 'react-native-intent-launcher';
import { startActivityAsync, ActivityAction } from 'expo-intent-launcher';
import {shareAsync} from "expo-sharing";
// const { StorageAccessFramework } = FileSystem;
import * as DocumentPicker from 'expo-document-picker';
import { StorageAccessFramework } from 'expo-file-system';
import {Avatar} from "react-native-elements";

export default function ChatMessageGroupScreenTest({route}) {
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation();
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const {userId, chatTitle, token, tk_type, isGroup, tokenDlyDelete} = route.params || {};
  const roomId = Array.isArray(route.params.roomId) ? route.params.roomId.map(room => room.id)[0] : route.params.roomId;
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const sheetRef = useRef(null);
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
  const flatListRef = useRef(null);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreToLoad, setHasMoreToLoad] = useState(true);
  const [isMessageReceived, setIsMessageReceived] = useState(false);
  const [editMessage, setEditMessage] = useState(false);
  const selectedMessagesRef = useRef(selectedMessages);
  const socket = initSocket(token, tk_type)
  const [imageUrl, setImageUrl] = useState("");
  const [screenshotNotification, setScreenshotNotification] = useState(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [imageUrls, setImageUrls] = useState([]);
  const [activeComponent, setActiveComponent] = useState(null);
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
  // определяет какой пользователь делает скриншот
  // useEffect(() => {
  //   if (hasPermissions()) {
  //     const subscription = ScreenCapture.addScreenshotListener(() => {
  //       const user = users.find(u => u.id === userId);
  //       const shortname = user ? user.shortname : '';
  //       const screenshotMessage = {
  //         msgtext: shortname + "" + 'сделал скриншот переписки',
  //       };
  //       console.log(screenshotMessage)
  //       setScreenshotNotification(screenshotMessage);
  //     });
  //     return () => subscription.remove();
  //   }
  // }, []);

  useEffect(() => {
    Keyboard.addListener('keyboardDidShow', _keyboardDidShow);
    Keyboard.addListener('keyboardDidHide', _keyboardDidHide);

    return () => {
      Keyboard.removeAllListeners('keyboardDidShow');
      Keyboard.removeAllListeners('keyboardDidHide');
    };
  }, []);


  const _keyboardDidShow = () => setKeyboardOpen(true);
  const _keyboardDidHide = () => setKeyboardOpen(false);

  //
  // const hasPermissions = async () => {
  //   const { status } = await MediaLibrary.requestPermissionsAsync();
  //   await ScreenCapture.preventScreenCaptureAsync();
  //   return status === 'granted';
  // };


  // useEffect(() => {
  //   if (messagez) {
  //     const parsedMessages = messagez.map(msg => ({
  //       id: msg.id,
  //       msgdt: msg.msgdt,
  //       msgtext: msg.msgtext,
  //       room_id: msg.room_id,
  //       staff_id: msg.staff_id,
  //     }));
  //     setMessages(parsedMessages);
  //   }
  // }, [messagez]);

  // console.log(userId, roomId)
  const loadMoreMessages = async () => {
    if (loadingMore || !hasMoreToLoad || keyboardOpen) {
      return;
    }
    console.log(1)
    setLoadingMore(true);

    fetch(`http://172.20.15.18:8000/scroll_msg/${roomId}/${page + 1}`, {
      headers: {
        'Content-Type': 'application/json',
        'authorization': tk_type + " " + token,
        'gcvp_info': Platform.OS + "/" + Device.osInternalBuildId + "/" + Device.osName + "/" + uuid,
      },
      method: 'POST',
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data, 'старые сообщения')
        if (data.length === 0) {
          setHasMoreToLoad(false);
        } else {
          const newMessages = data.map(async (msg) => {
            if (msg.img_name) {
              const imageUrl = await fetchImage(msg.img_name);
              return {...msg, imageUrl};
            }
            return msg;
          });
          Promise.all(newMessages).then((resolvedMessages) => {
            const updatedMessages = resolvedMessages.map(msg => ({...msg, source: 'database'}));
            setPage(page + 1);
            setMessages([...updatedMessages, ...messages]);
          });
        }
      })
      .catch((error) => {
        console.error('Error:', error);
      })
      .finally(() => {
        setLoadingMore(false);
      });
  };

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
        const dbMessages = data[0].map(async (msg) => {
          if (msg.img_name) {
            const imageUrl = await fetchImage(msg.img_name);
            console.log(imageUrl)
            return {...msg, imageUrl};
          }
          return msg;
        });
        Promise.all(dbMessages).then((resolvedMessages) => {
          setMessages(resolvedMessages.map(msg => ({...msg, source: 'database'})));
          setUsers(data[1])
        });
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  }, []);

  useEffect(() => {
    socket.on('hyli2', (res) => {
      console.log(res, "hyli2")
      const URL = res.img_name
      console.log(URL)
      fetch(`http://172.20.15.18:8000/pics/${URL}`, {
        headers: {
          'Content-Type': 'application/json',
          'authorization': tk_type + " " + token,
          'gcvp_info': Platform.OS + "/" + Device.osInternalBuildId + "/" + Device.osName + "/" + uuid,
        },
      })
        .then((response) => response.blob())
        .then((blob) => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve(reader.result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        })
        .then((base64data) => {
          const date = new Date();
          const dateString = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
          const socketMessage = {
            staff_id: res.staff_id,
            imageUrl: base64data,
            source:'socket',
            msgdt:dateString
          };
          console.log(socketMessage)
          setMessages(prevMessages => [...prevMessages, socketMessage]);
        })
    })
    return () => {
      socket.off("hyli2");
    };
  }, []);

  useEffect(() => {
    // const avatar = imageUrls;
    // console.log(avatar)
    socket.on("hyli", (res) => {
      console.log(res, "ответ с фронта")
      const user = users.find(user => Number(user.id) === Number(res.staff_id));
      const shortname = user ? user.shortname : '';
      const socketMessage = {...res, source: 'socket', shortname: shortname};
      console.log(socketMessage)
      const backNameFile = res.msgfile;
      const frontNameFile = res.og_filename;
      console.log(backNameFile, frontNameFile)
      setMessages(prevMessages => [...prevMessages, socketMessage]);
    });

    return () => {
      socket.off("hyli");
    };
  }, [users]);

  useEffect(() => {
    const {theme} = route.params;
    setIsDarkTheme(theme === "dark");
  }, [route.params]);

  useEffect(() => {
    socket.on('del', (res) => {
      const messageIdsToDelete = res.map(message => message.id_msg);
      setMessages((currentMessages) =>
        currentMessages.filter((message) => !messageIdsToDelete.includes(message.id))
      );
      closeHeader();
    });
    return () => {
      socket.off('del');
    };
  }, []);


  useEffect(() => {
    const handleEdit = (updatedMessage) => {
      // const date = new Date();
      // const dateString = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
      const editedMessage = {
        ...updatedMessage,
        // msgdt: dateString,
        edited: true,
      };
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === editedMessage.id ? editedMessage : msg
        )
      );
    };

    socket.on('edit', handleEdit);

    return () => {
      socket.off('edit', handleEdit);
    };
  }, []);

  useEffect(() => {
    selectedMessagesRef.current = selectedMessages;
  }, [selectedMessages]);

  // useEffect(() => {
  //   console.log(selectedMessages, 'selectedMsg in useEffect');
  //   setSelectedMessages(selectedMessages)
  // }, [selectedMessages]);

  // useEffect(() => {
  //   console.log(callback);
  //   console.log(uploadedFileUrl);
  // }, [uploadedFileUrl, callback]);
  const fetchImage = async (imageName) => {
    const response = await fetch(`http://172.20.15.18:8000/pics/${imageName}`, {
      headers: {
        'Content-Type': 'application/json',
        'authorization': tk_type + " " + token,
        'gcvp_info': Platform.OS + "/" + Device.osInternalBuildId + "/" + Device.osName + "/" + uuid,
      },
    });
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const sendMessage = async () => {
    if (editMessage && selectedMessage) {
      const updatedMessage = {
        ...selectedMessage,
        msgtext: message,
        edited: true,
        token:token,
      };
      console.log(updatedMessage)
      socket.emit('edit_msg', updatedMessage)
      // setMessages((prevMessages) =>
      //   prevMessages.map((msg) =>
      //     msg.id === selectedMessage.id ? updatedMessage : msg
      //   )
      // );
      // socket.on('edit', (res) => {
      //   console.log(res);
      // });

      setSelectedMessage(null);
      setEditMessage(false);
      setMessage('');
    } else if (message.length > 0) {
      const date = new Date();
      const dateString = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
      const messageObj = {
        staff_id: userId,
        msgtext: message,
        roomId: roomId,
        msgdt: dateString,
        source: 'local',
        edited: false
      };
      setIsMessageReceived(false);
      socket.emit('msg', messageObj, (res) => {
        console.log(res)
        if (res.status === true) {
          setIsMessageReceived(true);
          // setMessages(prevMessages => prevMessages.map(msg =>
          //   msg.id === res.id ? {...msg, id: res.id, source: 'socket'} : msg
          // ))
          messageObj.id = res.id;
          messageObj.source = 'socket'
        }
      });
      console.log('Sending message:', {userId, message, roomId});
      setMessage('');
      setMessages(prevMessages => [...prevMessages, messageObj]);
    }
    setActiveComponent(false);
    setShowPhoneComponent(false);
    setshowDocumentComponent(false);
    setShowLocationModal(false);
    setShowImages(false);
  }

  useLayoutEffect(() => {
    if (longPressed) {
      navigation.setOptions({
        headerTitle: () => (
          <View style={{flexDirection: 'row', gap: 40, marginLeft: 70}}>
            <AntDesign name="close" onPress={closeHeader} size={24} color={isDarkTheme ? "white" : "black"}/>
            {/*<AntDesign name="pushpino" onPress={secureMessage} size={24} color={isDarkTheme ? "white" : "black"}/>*/}
          </View>
        ),
        headerRight: () => (
          <View style={{flexDirection: 'row', gap: 40}}>
            <AntDesign name="delete" onPress={deleteMessage} size={24} color="#b91c1c"/>
            <Feather name="edit" size={24} onPress={changeMessage} color={isDarkTheme ? "white" : "black"}/>
          </View>
        ),
      });
    } else {
      navigation.setOptions({
        headerTitle: chatTitle,
        headerTitleStyle: {
          headerTitleAlign: 'center',
          alignSelf: 'center',
          textAlign: "center",
          flex:1,
          color: isDarkTheme ? "white" : "black",
        },
        headerRight: () => (
          <TouchableOpacity onPress={InfoForChat}>
            <Entypo name="dots-three-horizontal" size={24} color={isDarkTheme ? "white" : "black"} />
          </TouchableOpacity>
        ),
        headerLeft:() => (
          <TouchableOpacity onPress={goChatList}>
            <AntDesign name="arrowleft" size={24} color={isDarkTheme ? "white" : "black"} />
          </TouchableOpacity>
        ),
        headerStyle: {
          backgroundColor: isDarkTheme ? "#18181b" : "#f8fafc",
        },
      });
    }
  }, [longPressed, isDarkTheme]);


  const deleteMessage = useCallback(async () => {
    console.log(selectedMessagesRef.current, 'selectedMessages in delete ');
    const msgDel = selectedMessagesRef.current
    const idMsgDel = msgDel.map(message => message.id);
    const socketDelMsg = {
      idMsg: idMsgDel,
      roomId: roomId,
      token:token,
    };
    socket.emit('del_msg', socketDelMsg)
  }, []);

  const goChatList = async () => {
    navigation.navigate('Чаты', {gcvplk_tk_uid:userId, token:token, tk_type: tk_type, tokenDlyDelete:tokenDlyDelete, isDarkTheme:isDarkTheme})
  }

  const closeHeader = async () => {
    setLongPressed(false);
    setShowCheckboxes(false);
    setSelectedMessages([]);
  }
  const handleLongPress = (message) => {
    const isOurMessage = Number(message.staff_id) === Number(userId);
    if (isOurMessage) {
      console.log('handleLongPress called with message:', message);
      if (!selectedMessages.some(selectedMessage => selectedMessage.id === message.id)) {
        setSelectedMessages(prevMessages => [...prevMessages, message]);
      }

      setSelectedMessage(message);
      setLongPressed(true);
      setShowCheckboxes(true);
    }
    console.log(selectedMessages)
  };

  const changeMessage = useCallback(async () => {
    console.log(selectedMessagesRef.current, 'selectedMessages in delete ');
    if (selectedMessagesRef.current.length === 1) {
      setEditMessage(true);
      setMessage(selectedMessagesRef.current[0].msgtext || selectedMessagesRef.current[0].text);
      inputRef.current.focus();
      socket.emit("edit_msg", {selectedmsg: selectedMessages})
    }else{
      alert('выбрано больше 1 сообщения')
    }
  }, []);

  const openImage = async(Url) => {
    console.log(1)
    navigation.navigate('showImage', {Url: Url})
  }
  const handleFilePress = async (fileName, NameFront) => {
    console.log(roomId);
    try {
      const response = await fetch(`http://172.20.15.18:8000/get_file/${roomId}/${fileName}`, {
        headers: {
          'Content-Type': 'application/json',
          'authorization': tk_type + " " + token,
          'gcvp_info': Platform.OS + "/" + Device.osInternalBuildId + "/" + Device.osName + "/" + uuid,
        },
      });
      const blob = await response.blob();
      console.log(blob)
      const fileType = blob.type;

      const downloadOptions = {
        headers: {
          'Content-Type': 'application/json',
          'authorization': tk_type + " " + token,
          'gcvp_info': Platform.OS + "/" + Device.osInternalBuildId + "/" + Device.osName + "/" + uuid,
        },
      };
      const directoryPath = FileSystem.documentDirectory;
      const fileUri = `${directoryPath}${NameFront}`;
      await Sharing.shareAsync(fileUri)
    } catch (error) {
      console.error('Error:', error);
    }
  };

  function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'Кб', 'Мб', 'Гб', 'Тб', 'Пб', 'Еб', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  const InfoForChat = async() => {
    console.log(users)
    navigation.navigate('Info', {roomId: roomId, token:token, tk_type:tk_type, isDarkTheme:isDarkTheme, isGroup:isGroup})
  }

  return (
    <>
      <KeyboardAvoidingView style={{flex: 1, backgroundColor: isDarkTheme ? "black" : "#F0F0F0"}}
                            behavior={Platform.OS === "ios" ? "padding" : "height"}
                            keyboardVerticalOffset={headerHeight}>
        {/*для отрисовки какой пользователь сделал скриншот*/}
        {/*{screenshotNotification && (*/}
        {/*  <View style={styles.notificationContainer}>*/}
        {/*    <Text style={styles.notificationText}>{screenshotNotification.msgtext}</Text>*/}
        {/*    <Button title="X" onPress={() => setScreenshotNotification(null)} />*/}
        {/*  </View>*/}
        {/*)}*/}
        <FlatList
          inverted
          ref={flatListRef}
          data={[...messages].reverse()}
          keyExtractor={(item, index) => index.toString()}
          onEndReached={loadMoreMessages}
          onEndReachedThreshold={0.1}
          ListFooterComponent={loadingMore ? <ActivityIndicator/> : null}
          renderItem={({item: message, index}) => {
            const isOurMessage = Number(message.staff_id) === Number(userId);
            const user = users.find(user => Number(user.id) === Number(message.staff_id));
            const shortname = user && !isOurMessage ? user.shortname : '';
            let timeDisplay;

            // if (message.msgdt) {
            // socket message
            const date = new Date(message.msgdt);
            const hours = date.getHours();
            const minutes = date.getMinutes();
            const hoursStr = String(hours).padStart(2, '0');
            const minutesStr = String(minutes).padStart(2, '0');
            timeDisplay = `${hoursStr}:${minutesStr}`
            // }
            // else {
            // db messages
            // const timestamp = message.msgdt;
            // const date = new Date(timestamp);
            // const hours = date.getHours();
            // const minutes = date.getMinutes();
            // const hoursStr = String(hours).padStart(2, '0');
            // const minutesStr = String(minutes).padStart(2, '0');
            // timeDisplay = `${hoursStr}:${minutesStr}`;
            // }
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
                      iconStyle={{
                        borderColor: "#00862b",
                        marginRight: isOurMessage ? -10 : -20,
                        marginLeft: isOurMessage ? -5 : 5,
                        marginBottom: 10
                      }}
                      onPress={() => handleLongPress(message)}
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
                    {!isOurMessage && (<Text style={styles.userNameText}>{shortname}</Text>)}
                    {message.imageUrl && message.source === 'database' && (
                      <TouchableOpacity onPress={() => {openImage(message.imageUrl)}}>
                        <Image source={{ uri: message.imageUrl }} style={{ width: 180, height: 180 }} resizeMode='contain' />
                      </TouchableOpacity>
                    )}

                    {message.imageUrl !== undefined && message.source === 'socket' && (
                      <TouchableOpacity onPress={() => {openImage(message.imageUrl)}}>
                        <Image source={{ uri: message.imageUrl }} style={{ width: 100, height: 100 }} />
                      </TouchableOpacity>
                    )}

                    {message.msgfile  && (
                      <TouchableOpacity onPress={() => handleFilePress(message.msgfile, message.og_filename)}>
                        <View style={{display:'flex', flexDirection:'row', alignItems:'center'}}>
                          <View style={{borderRadius: 20, backgroundColor: '#00862b', padding: 10}}>
                            <FontAwesome name="file" size={20} color="white" />
                          </View>
                          <View style={{display:'flex', flexDirection:'column'}}>
                            <Text style={{marginLeft: 10, marginTop:5, color:"#00862b"}}>{message.og_filename}</Text>
                            <Text style={{paddingTop: 10, marginLeft: 10, color:"#00862b", fontSize:10}}> {formatBytes(message.file_size)}</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    )}

                    <Text style={styles.messageText}>{message?.msgtext}{message.text}</Text>
                    <View style={{display: "flex", flexDirection: "row"}}>
                      <Text style={styles.messageTime}>{timeDisplay}</Text>
                      {isOurMessage && (
                        message.source === 'local' ? (
                          isMessageReceived ? <Feather style={{marginLeft: 2}} name="check" size={12} color="black"/> :
                            <Feather style={{marginLeft: 2}} name="loader" size={12} color="black"/>
                        ) : (
                          <AntDesign style={{marginLeft: 2}} name="check" size={12} color="black"/>
                        )
                      )}
                      {message.edited && <Text style={styles.editedLabel}>Изменено</Text>}

                    </View>
                  </View>
                </View>

              </TouchableOpacity>
            );
          }}
        />
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 10,
          borderTopWidth: 1,
          borderColor: isDarkTheme ? "#29292d" : "#dddddd",
          backgroundColor: isDarkTheme ? "#18181b" : "white"
        }}
        >
          <SimpleLineIcons
            name="paper-clip"
            size={24}
            onPress={() => {
              Keyboard.dismiss();
              setTimeout(() => {
                setShowBottomSheet(true);
                if (sheetRef.current) {
                  sheetRef.current.open();
                }
                setActiveComponent(false);
                setShowPhoneComponent(false);
                setshowDocumentComponent(false);
                setShowLocationModal(false);
                setShowImages(false);
              }, 200);
            }}
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
              borderColor: isDarkTheme ? "#16161a" : "#dddddd",
              borderRadius: 20,
              paddingHorizontal: 10,
              color:isDarkTheme ? "white" : "black"
            }}
            ref={inputRef}
            keyboardAppearance={isDarkTheme ? 'dark' : 'light'}
            placeholder='Напишите сообщение...'
            placeholderTextColor={isDarkTheme ? "#404040" : "black"}
            backgroundColor={isDarkTheme ? "#1d1d21" : "#F0F0F0"}
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
      {showBottomSheet && (
        <BottomSheet style={{backgroundColor: isDarkTheme ? "#232323" : "white"}} ref={sheetRef} index={0} snapPoints={['50%', '100%']}>
          {activeComponent === 'images' && (
            <ImageVideoComponent
              token={token}
              tk_type={tk_type}
              staff_id={userId}
              roomId={roomId}
            />
          )}
          {/*{activeComponent === 'phone' && <PhoneComponent/>}*/}
          {activeComponent === 'document' && <DocumentComponent
            token={token}
            tk_type={tk_type}
            staff_id={userId}
            roomId={roomId}
          />}

          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 10,
            borderTopWidth: 1,
            borderColor: isDarkTheme ? "#363636" : '#dddddd',
          }}>
            <Pressable onPress={() => setActiveComponent('images')}>
              <Ionicons name="images" size={30} style={{color: activeComponent === 'images' ? "#00862b" : "#696969"}}/>
            </Pressable>
            <Pressable>
              {/*<Image style={{width:20}} source={logo}/>*/}
            </Pressable>
            <Pressable onPress={() => setActiveComponent('document')}>
              <Ionicons name="document-text" size={30} style={{color: activeComponent === 'document' ? "#00862b" : "#696969"}}/>
            </Pressable>
            {/*<Pressable onPress={() => setActiveComponent('phone')}>*/}
            {/*  <FontAwesome name="user-circle" size={30} style={{color: activeComponent === 'phone' ? "#00862b" : "#696969"}}/>*/}
            {/*</Pressable>*/}
          </View>
        </BottomSheet>
      )}

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
  notificationContainer: {
    display:'flex',
    flexDirection:'row',
    backgroundColor: 'rgba(52, 52, 52, 0.2)',
    marginTop:5,
    padding: 10,
    marginLeft:'auto',
    marginRight:'auto',
    borderRadius: 10,
  },
  notificationText: {
    paddingTop:10,
    color: '#000',
    fontSize: 12,
  },
  editedLabel: {
    fontSize: 10,
    color: "#6b7280",
    marginLeft: 4
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
    marginLeft: 10,
    marginRight: 10,
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
  contentContainer: {
    display: 'flex',
    flexDirection: "row",
    flexWrap: 'wrap',
  },
  // iconContainer: {
  //   flexDirection: 'row',
  //   justifyContent: 'space-between',
  //   alignItems: 'center',
  //   padding: 10,
  //   borderTopWidth: 1,
  //   borderColor: '#dddddd',
  // },
  userNameText: {
    fontSize: 12,
    color: "#818cf8",
    marginBottom: 5,
  },
  sendButtonText: {
    color: "white",
  }
})