import { Text, View, Image, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import React, {useContext, useEffect, useLayoutEffect, useRef, useState} from 'react'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';
import { initSocket} from '../Socket';
import { Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { RectButton } from 'react-native-gesture-handler';
import { Icon } from 'react-native-elements';
import * as Device from "expo-device";
import { getUUID, setUUID, getGCVPToken, setGCVPToken, deleteGCVPToken } from '../SecureStorageService';
import { Platform } from 'react-native';
export default function ChatList({ route }) {
    const navigation = useNavigation();
    const { gcvplk_tk_uid, token, tk_type, tokenDlyDelete} = route.params || {};
    const [chats, setChats] = useState([]);
    const [images, setImages] = useState([]);
    const [translateX, setTranslateX] = useState(new Animated.Value(0));
    const { isDarkTheme: initialIsDarkTheme = false } = route.params || {};
    const [isDarkTheme, setIsDarkTheme] = useState(initialIsDarkTheme);
    const [uuid, setUuid] = useState(null);
    const socket = initSocket(token, tk_type);

    useEffect(() => {
        console.log(token, tk_type, "данные в listchat")
        socket.connect();
        console.log(socket, "socket")
    }, [token, tk_type]);

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
    }, [chats]);

console.log(uuid)
    useFocusEffect(
      React.useCallback(() => {
          fetch('http://172.20.15.18:8000/list_chat', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'authorization': tk_type + " " + token,
                  'gcvp_info': Platform.OS + "/" + Device.osInternalBuildId + "/" + Device.osName + "/" + uuid,
              },
              body: JSON.stringify({
                  staff_id: gcvplk_tk_uid,
              }),
          })
            .then((response) => response.json())
            .then((data) => {
                setChats(data);
                // console.log(data)
                const imgArray = data.map(user => user.img);

                const requests = imgArray.map(img =>
                  fetch(`http://172.20.15.18:8000/pics/${img}`, {
                      headers: {
                          'Content-Type': 'application/json',
                          'authorization': tk_type + " " + token,
                          'gcvp_info': Platform.OS + "/" + Device.osInternalBuildId + "/" + Device.osName + "/" + uuid,
                      }
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
                    .catch((error) => {
                        console.error('Error fetching pics:', error);
                        return null;
                    })
                );
                Promise.all(requests)
                  .then((imageUrls) => {
                      setImages(imageUrls);
                  });
            })
            .catch((error) => {
                console.error('Error:', error);
            });
      }, [gcvplk_tk_uid])
    );

    // useEffect(() => {
    //     // socketRef.current = io('http://172.20.15.18:8800');
    //     // socketRef.current.on('connect', () => {
    //     //     console.log('connected to server');
    //     // });
    //     fetch('http://172.20.15.18:8000/list_chat', {
    //         method: 'POST',
    //         headers: {
    //             'Content-Type': 'application/json',
    //             'authorization': tk_type + " " + token,
    //             'gcvp_info': Platform.OS + "/" + Device.osInternalBuildId + "/" + Device.osName + "/" + uuid,
    //         },
    //         body: JSON.stringify({
    //             staff_id: gcvplk_tk_uid,
    //         }),
    //     })
    //       .then((response) => response.json())
    //       .then((data) => {
    //           setChats(data);
    //           // console.log(data)
    //
    //           const imgArray = data.map(user => user.img);
    //
    //           const requests = imgArray.map(img =>
    //             fetch(`http://172.20.15.18:8000/pics/${img}`, {
    //                 headers: {
    //                     'Content-Type': 'application/json',
    //                     'authorization': tk_type + " " + token,
    //                     'gcvp_info': Platform.OS + "/" + Device.osInternalBuildId + "/" + Device.osName + "/" + uuid,
    //                 }
    //             })
    //               .then((response) => response.blob())
    //               .then((blob) => {
    //                   return new Promise((resolve, reject) => {
    //                       const reader = new FileReader();
    //                       reader.onloadend = () => {
    //                           resolve(reader.result);
    //                       };
    //                       reader.onerror = reject;
    //                       reader.readAsDataURL(blob);
    //                   });
    //               })
    //               .catch((error) => {
    //                   console.error('Error fetching pics:', error);
    //                   return null;
    //               })
    //           );
    //           Promise.all(requests)
    //             .then((imageUrls) => {
    //                 setImages(imageUrls);
    //             });
    //       })
    //       .catch((error) => {
    //           console.error('Error:', error);
    //       });
    // }, []);

    useEffect(() => {
        console.log('Chats state changed');
    }, [chats]);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: "Чаты",
            headerTitleStyle: {
                // alignSelf: 'center',
                // textAlign: "center",
                // flex:1,
                color: isDarkTheme ? "white" : "black",
            },
            headerLeft: () => (
              // <Text style={isDarkTheme ? styles.headerTextDark : styles.headerText}>React Chat</Text>
                <Ionicons onPress={LogOut} name="exit-outline" size={24} color={isDarkTheme ? "white" : "black"} />
            ),
            headerRight: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {isDarkTheme ? (
                    <Ionicons onPress={toggleTheme} name="sunny-outline" size={24} color={isDarkTheme ? "white" : "black"} />
                  ) : (
                    <Ionicons onPress={toggleTheme} name="moon-outline" size={24} color={isDarkTheme ? "white" : "black"} />
                  )}
                  <MaterialCommunityIcons onPress={addChat} name="chat-plus-outline" size={24} color={isDarkTheme ? "white" : "black"} />
              </View>
            ),
            headerStyle: {
                backgroundColor: isDarkTheme ? "#18181b" : "#f8fafc",
            },
        });
    }, [isDarkTheme]);

    const LogOut = async () => {
        fetch('http://172.20.15.18:8000/logout', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'authorization': tk_type + " " + token,
                'gcvp_info': Platform.OS + "/" + Device.osInternalBuildId + "/" + Device.osName + "/" + uuid,
                'gcvp_token': tokenDlyDelete
            },
        })
            .then((response) => response.json())
            .then((data) => {
                console.log('Response msg:', data);
                if(data === true){
                    deleteGCVPToken()
                    navigation.navigate("WebViewScreen")
                }
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    };

    const addChat = async () => {
        navigation.navigate("AddChat", { gcvplk_tk_uid: gcvplk_tk_uid, theme: isDarkTheme ? "dark" : "light", token: token, tk_type: tk_type, tokenDlyDelete:tokenDlyDelete });
    };

    const toggleTheme = () => {
        setIsDarkTheme(prevIsDarkTheme => !prevIsDarkTheme);
    };

    const handlePress = async (chat) => {
        console.log(chat, 'chat')
        if (chat.is_group) {
            navigation.navigate("MessagesGroup", { userId: gcvplk_tk_uid, roomId: chat.roomid, theme: isDarkTheme ? "dark" : "light", chatTitle: chat.title, token: token, tk_type: tk_type, isGroup:chat.is_group, tokenDlyDelete:tokenDlyDelete });
            socket.emit('join', { roomId: chat.roomid }, (response) => {
                console.log('Received data from server:', response);
            });
        } else {
            socket.emit('join', { roomId: chat.roomid }, (response) => {
                console.log('Received data from server:', response);
                navigation.navigate("Messages", { userId: gcvplk_tk_uid, messagez:response, roomId: chat.roomid, theme: isDarkTheme ? "dark" : "light", chatTitle: chat.title, token: token, tk_type: tk_type, isGroup:chat.is_group, tokenDlyDelete:tokenDlyDelete });
            });
        }
        // socketRef.current.emit('join', { roomId: chat.roomid }, (response) => {
        //     console.log('Received data from server:', response);
        //  });
        // console.log(chat.roomid)
    };

    const deleteChat = (roomId) => {
        fetch('http://172.20.15.18:8000/del_chat', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'authorization': tk_type + " " + token,
                'gcvp_info': Platform.OS + "/" + Device.osInternalBuildId + "/" + Device.osName + "/" + uuid,
            },
            body: JSON.stringify({
                staff_id: gcvplk_tk_uid,
                roomId: roomId,
            }),
        })
          .then((response) => response.json())
          .then((data) => {
              if (data === "chat deleted") {
                  setChats(prevChats => prevChats.filter(chat => chat.roomid !== roomId));
              }
              console.log(data);
          })
          .catch((error) => {
              console.error('Error fetching del:', error);
              return null;
          })
        console.log(roomId)
    }


    _renderAction = (icon, color, backgroundColor, x, progress, roomId) => {
        const trans = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [x, 0]
        })

        return (
          <Animated.View style={{ flex: 1, transform: [{ translateX: trans }] }}>
              <RectButton
                style={[styles.rightAction, { backgroundColor: backgroundColor }]}
                onPress={() => deleteChat(roomId)}>
                  <Icon name={icon} size={30} color={color}></Icon>
              </RectButton>
          </Animated.View>
        )
    }

    _renderRightActions = (progress, roomId) => {
        return (
          <View style={{ width: 64, flexDirection: 'row' }}>
              {this._renderAction('delete', '#ffffff', '#dd2c00', 64, progress, roomId)}
          </View>
        );
    }

    _updateRef = ref => {
        this._swipeableRow = ref
    }

    // const renderRightActions = (progress, dragAnimatedValue, roomId) => {
    //     const opacity = progress.interpolate({
    //         inputRange: [0, 1],
    //         outputRange: [0, 1],
    //     });

    //     const position = progress.interpolate({
    //         inputRange: [0, 1],
    //         outputRange: [100, 0],
    //     });

    //     const translateX = progress.interpolate({
    //         inputRange: [0, 1],
    //         outputRange: [0, 0],
    //     });

    //     return (
    //             <Animated.View style={{
    //                 opacity, transform: [{ translateX }],
    //                 backgroundColor: "#b91c1c",
    //                 display: 'flex',
    //                 flexDirection: 'row',
    //                 alignItems: 'center',
    //                 paddingLeft: 5
    //             }}>
    //                 {/* <Animated.View style={{ opacity, transform: [{ translateX: position }],  backgroundColor: "#b91c1c" }}> */}
    //                 <TouchableOpacity onPress={() => deleteChat(roomId)}>
    //                     <Ionicons name="ios-trash-outline" size={24} color="white" style={{ paddingLeft: 15 }} />
    //                     <Text style={styles.deleteButtonText}>Удалить</Text>
    //                 </TouchableOpacity>
    //             </Animated.View>
    //     );
    // };

    return (
      <ScrollView style={isDarkTheme ? styles.containerDark : ""}>
          <View >
              {chats.map((chat, index) => {
                  const timestamp = chat.last_activity;
                  const date = new Date(timestamp);
                  const hours = date.getHours();
                  const minutes = date.getMinutes();
                  const hoursStr = String(hours).padStart(2, '0');
                  const minutesStr = String(minutes).padStart(2, '0');
                  const day = date.getDate();
                  const month = date.getMonth() + 1;
                  const year = date.getFullYear();
                  const today = new Date();
                  const oneWeekAgo = new Date();
                  oneWeekAgo.setDate(today.getDate() - 7);
                  const dayOfWeek = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'][date.getDay()];
                  const dateStr = date.getTime() > oneWeekAgo.getTime()
                    ? dayOfWeek
                    : `${day}/${month}/${year}`;
                  return (
                    // <Swipeable renderRightActions={(progress, dragAnimatedValue) => renderRightActions(progress, dragAnimatedValue, chat.roomid)}>
                    <Swipeable
                      ref={this._updateRef}
                      friction={2}
                      rightThreshold={40}
                      renderRightActions={(progress) => this._renderRightActions(progress, chat.roomid)}
                    >
                        <TouchableOpacity key={index} onPress={() => handlePress(chat)} style={isDarkTheme ? styles.containerChatDark : styles.container}>
                            <Image
                              style={styles.image}
                              source={{ uri: images[index] }}
                            />
                            <View style={styles.textContainer}>
                                <Text style={isDarkTheme ? styles.headerTextDark : styles.text}>{chat.title}</Text>
                                {/*<Text style={isDarkTheme ? styles.headerTextDark : styles.text}>{lastMessage}</Text>*/}
                            </View>
                            <View>
                                <Text style={styles.dateText}>{dateStr}</Text>
                            </View>
                        </TouchableOpacity>
                    </Swipeable>
                  )
              })}
          </View>
      </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        borderWidth: 0.3,
        borderColor: "#D0D0D0",
        borderTopWidth: 0,
        borderLeftWidth: 0,
        borderRightWidth: 0,
        padding: 10,
    },
    deleteButtonText: {
        color: "#f8fafc",
    },
    containerChatDark:{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        borderWidth: 0.3,
        borderColor: "#4f4f4f",
        borderTopWidth: 0,
        borderLeftWidth: 0,
        borderRightWidth: 0,
        padding: 10,
    },
    favoritesButtonText: {
        color: "#f8fafc",
    },
    swipedRowDelete: {
        backgroundColor: "#b91c1c",
    },
    swipedRowFavorite: {
        backgroundColor: "#facc15",
        paddingRight: 5
    },
    deleteButton: {
        flex: 1,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
    },
    favoritesButton: {
        flex: 1,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
    },
    image: {
        width: 50,
        height: 50,
        borderRadius: 25,
        resizeMode: "cover"
    },
    textContainer: {
        flex: 1
    },
    text: {
        fontSize: 15,
        fontWeight: "500",
        color: "black"
    },
    subText: {
        marginTop: 10,
        color: "gray",
        fontWeight: "500"
    },
    dateText: {
        fontSize: 12,
        marginBottom: 10,
        fontWeight: "400",
        color: "#585858"
    },
    containerDark: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    headerText: {
        color: "black",
        fontSize: 14,
    },
    headerTextDark: {
        color: "white",
        fontSize: 14,
    },
    rightAction: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
        height: 75
    }
});
