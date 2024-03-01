import { Button, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useLayoutEffect, useState } from 'react'
import { useNavigation } from '@react-navigation/native';
import BouncyCheckbox from "react-native-bouncy-checkbox";
import socket from '../Socket';
import { getUUID } from '../SecureStorageService';
import * as Device from "expo-device";
import { Platform } from 'react-native';
export default function AddChatScreen({ route }) {
    const [users, setUsers] = useState([]);
    const navigation = useNavigation();
    const { gcvplk_tk_uid, token, tk_type} = route.params || {};
    const [isDarkTheme, setIsDarkTheme] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [showCheckboxes, setShowCheckboxes] = useState(false);
    const [images, setImages] = useState([]);

    // console.log(gcvplk_tk_uid)
    const [uuid, setUuid] = useState(null);

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
        //получаем всех юзеров
        fetch('http://172.20.15.18:8000/get_staff', {
            headers: {
                'Content-Type': 'application/json',
                'authorization': tk_type + " " + token,
                'gcvp_info': Platform.OS + "/" + Device.osInternalBuildId + "/" + Device.osName + "/" + uuid,
            }
        })
          .then((response) => response.json())
            .then((data) => {
                // console.log(data)

                const usersWithSelection = data.map(user => ({ ...user, isSelected: false }));
                setUsers(usersWithSelection);
                const imgArray = usersWithSelection.map(user => user.img);

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
                        // console.log(imageUrls);
                    });

            })
            .catch((error) => {
                console.error('Error fetching spr_staff:', error);
            });
    }, []);

    useEffect(() => {
        const { theme } = route.params;
        setIsDarkTheme(theme === "dark");
    }, [route.params]);

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                selectedUsers.length >= 2 ? (
                    <Button
                        title="Далее"
                        onPress={() => handleNext()}
                    />
                ) : null
            ),
        });
    }, [navigation, selectedUsers]);


    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: "Добавить чат",
            headerTitleStyle: {
                color: isDarkTheme ? "white" : "black",
            },
            headerStyle: {
                backgroundColor: isDarkTheme ? "#18181b" : "#f8fafc",
            },
        });
        navigation.setOptions({
            headerRight: () => (
                selectedUsers.length >= 2 && showCheckboxes ? (
                    <Button
                        title="Далее"
                        onPress={() => handleNext()}
                    />
                ) : null
            ),
        });
    }, [navigation, selectedUsers, showCheckboxes]);

    const navigateChat = async (user) => {
        //запрос для создания комнаты
        // let userName = users.find(user => user.id === gcvplk_tk_uid);
        const userName = users.find(u => u.id === Number(gcvplk_tk_uid));
        const recipientName = user.shortname;
        console.log(recipientName)
        try {
            const checkChatResponse = await fetch('http://172.20.15.18:8000/check_chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': tk_type + " " + token,
                    'gcvp_info': Platform.OS + "/" + Device.osInternalBuildId + "/" + Device.osName + "/" + uuid,
                },
                body: JSON.stringify({
                    staff_id_User: gcvplk_tk_uid,
                    staff_id: user.id
                }),
            });

            const checkChatData = await checkChatResponse.json();
            console.log('Success:', checkChatData);
            const roomId = checkChatData[0].room_id;
                navigation.navigate("Messages", {
                    userId: gcvplk_tk_uid,
                    roomId: roomId,
                    theme: isDarkTheme ? "dark" : "light",
                    chatTitle: recipientName,
                    token: token,
                    tk_type: tk_type
                });
                socket.emit('join', { roomId: roomId }, (response) => {
                    console.log('Received data from server:', response);
                });

            // if (checkChatData === 'no_chat') {
            //     const addChatResponse = await fetch('http://172.20.15.18:8000/add_chat', {
            //         method: 'POST',
            //         headers: {
            //             'Content-Type': 'application/json',
            //         },
            //         body: JSON.stringify({
            //             // userSender: userName,
            //             // userRecipient: user.shortname,
            //             staff_id_User: gcvplk_tk_uid,
            //             staff_id: user.id,
            //         }),
            //     });

            //     const addChatData = await addChatResponse.json();
            //     console.log('Success:', addChatData);
            //     socket.emit('join', { roomId: addChatData }, (response) => {
            //         console.log('Received data from server:', response);
            //     });
            //     navigation.navigate("Messages", {
            //         userId: gcvplk_tk_uid,
            //         roomId: addChatData,
            //         theme: isDarkTheme ? "dark" : "light"
            //     });
            // } else {
            //     const roomId = checkChatData[0].room_id;
            //     navigation.navigate("Messages", {
            //         userId: gcvplk_tk_uid,
            //         roomId: roomId,
            //         theme: isDarkTheme ? "dark" : "light"
            //     });
            //     socket.emit('join', { roomId: roomId }, (response) => {
            //         console.log('Received data from server:', response);
            //     });
            // }

        } catch (error) {
            console.error('Error:', error);
        }
    }

    const toggleUserSelection = (index) => {
        if (showCheckboxes) {
            setUsers(users => users.map((user, i) => {
                if (i === index) {
                    const updatedUser = { ...user, isSelected: !user.isSelected };
                    if (updatedUser.isSelected) {
                        setSelectedUsers(prevSelectedUsers => [...prevSelectedUsers, updatedUser]);
                    } else {
                        setSelectedUsers(prevSelectedUsers => prevSelectedUsers.filter(u => u.id !== updatedUser.id));
                    }
                    return updatedUser;
                }
                return user;
            }));
        }
    };

    const resetCheckboxes = () => {
        setUsers(users => users.map(user => ({ ...user, isSelected: false })));
        setSelectedUsers([]);
    };

    const handleNext = () => {
        const userName = users.find(u => u.id === Number(gcvplk_tk_uid));
        console.log(userName)
        navigation.navigate('AddGroupChat', {
            theme: isDarkTheme ? "dark" : "light",
            userId: gcvplk_tk_uid,
            userName: userName.shortname,
            selectedUsers: selectedUsers,
            token: token,
            tk_type: tk_type
        });
    };

    const usersWithImages = users.map((user, index) => ({
        ...user,
        imageUrl: images[index] || null,
    }));

    return (
        <ScrollView>
            <View style={{ flex: 1, backgroundColor: isDarkTheme ? "#09090b" : "white" }}>
                <Button
                    title={showCheckboxes ? "Отменить" : "Создать групповой чат"}
                    onPress={() => {
                        setShowCheckboxes(!showCheckboxes);
                        if (!showCheckboxes) {
                            resetCheckboxes();
                        }
                    }}
                    style={styles.buttonStyle}
                />
                {usersWithImages.map((user, index) => {
                    if (Number(user.id) !== Number(gcvplk_tk_uid)) {
                        return (
                            <Pressable
                                key={index}
                                onPress={() => navigateChat(user)}
                                disabled={showCheckboxes}
                            >
                                <View style={styles.containerName}>
                                    <Text style={isDarkTheme ? styles.subTextDarkName : styles.subTextName}>{user.shortname[0].toUpperCase()}</Text>
                                </View>
                                <View style={styles.container}>
                                    {showCheckboxes && (
                                        <BouncyCheckbox
                                            value={user.isSelected}
                                            onPress={() => toggleUserSelection(index)}
                                            size={25}
                                            fillColor="#3b82f6"
                                            unfillColor="#FFFFFF"
                                            innerIconStyle={{ borderWidth: 1.5, borderColor: user.isSelected ? "#3b82f6" : '#D0D0D0' }}
                                        />
                                    )}
                                    <View style={styles.textContainer}>
                                        <Image
                                          // source={{uri: `data:image/png;base64,${user.img_test}`}}
                                            source={{ uri: user.imageUrl }}
                                            style={styles.AvatarStyle}
                                        />
                                        <Text style={isDarkTheme ? styles.subTextDark : styles.subText}>{user.shortname}</Text>
                                    </View>
                                </View>
                            </Pressable>
                        )
                    }
                })}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        borderWidth: 0.7,
        borderColor: "#D0D0D0",
        borderTopWidth: 0,
        borderLeftWidth: 0,
        borderRightWidth: 0,
        padding: 10,
    },
    containerName:{
        paddingLeft:20,
        backgroundColor:"#f3f4f6",
    },
    AvatarStyle: {
        width: 50,
        height: 50,
        borderRadius: 50,
        marginRight: 10,
    },
    buttonStyle: {
        borderWidth: 1,
        borderColor: "#D0D0D0",
    },
    checkboxes: {

    },
    image: {
        width: 50,
        height: 50,
        borderRadius: 25,
        resizeMode: "cover"
    },
    textContainer: {
        flex: 1,
        display: 'flex',
        flexDirection: 'row',
    },
    subTextName: {
        marginTop:5,
        marginBottom: 5,
        color: "#6b7280",
        fontWeight: "500"
    },
    subTextDarkName: {
        marginTop:5,
        marginBottom: 5,
        color: "white",
        fontWeight: "500"
    },
    subText: {
        marginTop: 15,
        color: "black",
        fontWeight: "500"
    },
    subTextDark: {
        marginTop: 15,
        color: "white",
        fontWeight: "500"
    },
})
