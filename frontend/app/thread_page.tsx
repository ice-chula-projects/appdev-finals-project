import { useState } from 'react';
import { View, Text, FlatList, Pressable, Image, StyleSheet } from 'react-native';

type Message = {
    id: string,
    author: string,
    text: string,
    timestamp: string
}

export const styles = StyleSheet.create({

})

export const threadPage = () => {
    const [messages, setMessages] = useState('')
    const [input, setInput] = useState('')

    const handleSend = () => {
        
    }

    return (

    )
}