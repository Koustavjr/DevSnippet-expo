import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'
import { Alert } from 'react-native'

const OPENROUTER_URI = "https://openrouter.ai/api/v1/chat/completions"
const OPENROUTER_API_KEY = "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"
const MODEL = "nvidia/nemotron-3-super-120b-a12b:free"
//"minimax/minimax-m2.5:free"


export const getAPIKEY = async (): Promise<string> => {
    const key = await SecureStore.getItemAsync("openrouter_api_key")
    if (!key) {
        return OPENROUTER_API_KEY
    }
    return key
}


export const saveAPIKEY = async (key: string) => {
    await SecureStore.setItemAsync("openrouter_api_key", key)
}

export type AIAction = "Explain" | "Summarize" | "Improve"


export const getPrompt = (action: AIAction, code: string, language: string) => {
    switch (action) {
        case "Explain":
            return `Explain this ${language} code:\n\n${code}`;
        case "Summarize":
            return `Summarize this ${language} code:\n\n${code}`;
        case "Improve":
            return `Improve this ${language} code:\n\n${code}`;
    }

}

export const deleteAPIKEY = async () => {
    await SecureStore.deleteItemAsync("openrouter_api_key")
}


export const getAIResponse = async (action: AIAction, code: string, language: string, snippetId: number) => {
    try {
        const getCachedKey = await AsyncStorage.getItem(`ai_${action}_${snippetId}`)
        if (getCachedKey) {
            return getCachedKey
        }
        const apiKey = await getAPIKEY()
        const response = await fetch(OPENROUTER_URI, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": MODEL,
                "messages": [
                    {
                        "role": "user",
                        "content": getPrompt(action, code, language)
                    }
                ]
            })
        })

        if (!response.ok) {
            Alert.alert(`Failed to ${action} the snippet`)
            return ""
        }

        const responseData = await response.json()
        const result = responseData.choices[0].message.content

        await AsyncStorage.setItem(`ai_${action}_${snippetId}`, result)
        return result

    } catch (error) {
        console.log(`Failed to ${action} the snippet`, error)
        return ""
    }


}

