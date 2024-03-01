import {Button, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native'
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigation } from '@react-navigation/native';
import { Avatar, Card, Image, Input } from 'react-native-elements';
import {AntDesign, Ionicons} from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import defaultImage from '../assets/defaultImage.png';
import { getUUID } from '../SecureStorageService';
import * as Device from "expo-device";
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';
export default function AddChatGroupScreen({ route }) {
    const navigation = useNavigation();
    const [isDarkTheme, setIsDarkTheme] = useState(false);
    const { selectedUsers, userId, userName, token, tk_type, Admin, tokenDlyDelete } = route.params;
    const shortnames = selectedUsers.map(user => user.shortname);
    const groupName = userName + ", " + shortnames.join(', ');
    const [inputValue, setInputValue] = useState(groupName);
    const [images, setImages] = useState([]);
    const [imageUri, setImageUri] = useState(null);
    const [uuid, setUuid] = useState(null);

    console.log(selectedUsers, userId)
    useEffect(() => {
        const { theme } = route.params;
        setIsDarkTheme(theme === "dark");
    }, [route.params]);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: "Группа",
            headerTitleStyle: {
                color: isDarkTheme ? "white" : "black",
            },
            headerStyle: {
                backgroundColor: isDarkTheme ? "#18181b" : "#ffffff",
            },
            headerRight: () => (
                <Button
                    title="Создать"
                    onPress={() => handleNext()}
                />
            ),
            headerLeft:() => (
              <TouchableOpacity onPress={goChatList}>
                  <AntDesign name="arrowleft" size={24} color={isDarkTheme ? "white" : "black"} />
              </TouchableOpacity>
            ),
        });
    }, [isDarkTheme]);

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
        const fetchImages = async () => {
            const requests = selectedUsers.map(user =>
              fetch(`http://172.20.15.18:8000/pics/${user.img}`, {
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

            const responses = await Promise.all(requests);
            setImages(responses);
        };

        fetchImages();
    }, []);

    const goChatList = async () => {
        navigation.navigate('Чаты', {gcvplk_tk_uid:userId, token:token, tk_type: tk_type, tokenDlyDelete:tokenDlyDelete, isDarkTheme:isDarkTheme})
    }

    const clearInput = async () => {
        setInputValue('');
    }

    const onMessage = (event) => {
        const imageData = event.nativeEvent.data;
        setImages((prevImages) => [...prevImages, imageData]);
    };
    //  const addImage = async () => {
    //             let result = await ImagePicker.launchImageLibraryAsync({
    //                 mediaTypes: ImagePicker.MediaTypeOptions.All,
    //                 allowsEditing: true,
    //                 aspect: [4, 3],
    //                 quality: 1,
    //             });

    //             console.log(result, "img");
    //             if (!result.canceled) {
    //                 // console.log(result.assets[0].uri, "imgUri");
    //                 // setImageUri(result.assets[0].uri);
    //                 let response = await fetch(result.uri);
    //                 let blob = await response.blob();
    //                 let base64 = await blobToBase64(blob);
    //                 setImageUri(base64);
    //             }

    //             // let formData = new FormData();

    //             // formData.append('image', {
    //             //     uri: result.assets[0].uri,
    //             //     type: 'image/png',
    //             //     name: 'test.png'
    //             // });
    //             // console.log(formData)
    //             fetch('http://172.20.15.18:8000/img', {
    //                 method: 'POST',
    //                 headers: {
    //                     'Content-Type': 'multipart/form-data',
    //                 },
    //                 body: imageUri
    //             })
    //                 .then(response => response.json())
    //                 .then(data => {
    //                     console.log(data);
    //                 })
    //                 .catch(error => {
    //                     console.error('Error:', error);
    //                 });
    //         };

    //         const blobToBase64 = (blob) => {
    //             return new Promise((resolve, reject) => {
    //                 const reader = new FileReader();
    //                 reader.onloadend = () => resolve(reader.result);
    //                 reader.onerror = reject;
    //                 reader.readAsDataURL(blob);
    //             });
    //         }
    const addImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });
        console.log(result, 'result')
        if (!result.canceled) {
            console.log(result)
                const manipResult = await ImageManipulator.manipulateAsync(
                  result.assets[0].uri,
                  [],
                  { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG } // Сжать изображение до 50% качества в формате JPEG
                );
            console.log(manipResult, 'manip')
                let response = await fetch(manipResult.uri);
                let blob = await response.blob();
                let base64 = await blobToBase64(blob);
                console.log(base64, 'base64')
                    setImageUri(base64);
                    console.log(imageUri, 'Uri')
                    // console.log(manipResult.uri)
            }
    };
    // const addImage = async () => {
    //     let result = await ImagePicker.launchImageLibraryAsync({
    //         mediaTypes: ImagePicker.MediaTypeOptions.All,
    //         allowsEditing: true,
    //         aspect: [4, 3],
    //         quality: 1,
    //     });
    //
    //     if (!result.canceled) {
    //         let response = await fetch(result.uri);
    //         let blob = await response.blob();
    //         let base64 = await blobToBase64(blob);
    //         setImageUri(base64);
    //     }
    // };

    const blobToBase64 = (blob) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }


    const handleNext = () => {
        const userIds = selectedUsers.map(user => user.id);
        userIds.push(Number(userId));
        console.log(inputValue, userIds, userId)

        let imageJson = {
            image: imageUri
        };

        fetch('http://172.20.15.18:8000/create_group', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'authorization': tk_type + " " + token,
                'gcvp_info': Platform.OS + "/" + Device.osInternalBuildId + "/" + Device.osName + "/" + uuid,
            },
            body: JSON.stringify({
                image: imageJson,
                chatTitle: inputValue,
                users: userIds,
                userId: userId
            }
            )
        })
            .then(response => response.json())
            .then(data => {
                console.log(data, 'Ответ с сервера');
                navigation.navigate("MessagesGroup", { userId: userId, roomId: data.room_id, theme: isDarkTheme ? "dark" : "light", chatTitle: inputValue, token: token, tk_type: tk_type, tokenDlyDelete:tokenDlyDelete });
            })
            .catch(error => {
                console.error('Error:', error);
            });

    };

    return (
        <ScrollView style={{backgroundColor: isDarkTheme ? "black" : ""}}>
            <Card containerStyle={{ borderRadius: 20, backgroundColor: isDarkTheme ? "#404040" : "", borderColor: isDarkTheme ? "#404040" : "" }}>
                {/* <View style={styles.Titlecontainer}> */}
                <TouchableOpacity onPress={addImage}>
                    {!imageUri &&
                        <Avatar
                            source={defaultImage}
                            size="large"
                            rounded
                        />
                    }
                    {imageUri &&
                        <Avatar
                            source={{ uri: imageUri }}
                            size="large"
                            rounded
                        />
                    }
                </TouchableOpacity>
                <Input
                    value={inputValue}
                    inputContainerStyle={{ borderBottomWidth: 0 }}
                    rightIcon={
                        <Ionicons name="close-outline" size={24} color="black" onPress={clearInput} />
                    }
                    onChangeText={setInputValue}
                />
                {/* </View> */}
            </Card>
            <Card containerStyle={{ borderRadius: 20,  backgroundColor: isDarkTheme ? "#404040" : "", borderColor: isDarkTheme ? "#404040" : "" }}>
                <Text style={isDarkTheme ? styles.AdminNameDark : styles.AdminName}>Администратор</Text>
                {Admin.map((user, index) => {
                    return (
                      <View style={isDarkTheme ? styles.containerAdminDark : styles.containerAdmin} key={index}>
                          <Avatar
                            size={50}
                            rounded
                            source={{ uri: images[index] }}
                          />
                          <Text style={{color : isDarkTheme ? "#d4d4d4" : "black"}}>{user.shortname}</Text>
                      </View>
                    )
                })
                }
                <Text style={styles.UsersName}>Участники</Text>
                {selectedUsers.map((user, index) => {
                    return (
                        <View style={isDarkTheme ? styles.containerDark : styles.container} key={index}>
                            <Avatar
                                size={50}
                                rounded
                                source={{ uri: images[index] }}
                            />
                            <Text style={{color : isDarkTheme ? "#d4d4d4" : "black"}}>{user.shortname}</Text>
                        </View>
                    )
                })}
            </Card>

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
    containerDark:{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        borderWidth: 0.5,
        borderColor: "#383838",
        borderTopWidth: 0,
        borderLeftWidth: 0,
        borderRightWidth: 0,
        padding: 10,
    },
    AdminName:{
        flexDirection: "row",
        alignItems: "center",
        padding: 5,
        fontSize:15,
        fontWeight:"bold"
    },
    AdminNameDark:{
        flexDirection: "row",
        alignItems: "center",
        padding: 5,
        fontSize:15,
        fontWeight:"bold"
    },
    UsersName:{
        flexDirection: "row",
        alignItems: "center",
        padding: 5,
        fontSize:15,
        fontWeight:"bold"
    },
    containerAdmin: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        padding: 10,
    },
    containerAdminDark:{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        padding: 10,
    },
    Titlecontainer: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
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
        flex: 1
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
