import * as Sharing from "expo-sharing";
import { Alert } from "react-native";
import { exportSnippetAsFile } from "./fileSystem";

type Format = 'js' | 'json' | 'txt'

const MIMEType = {
    js: 'application/javascript',
    txt: 'text/plain',
    json: 'application/json'
} as const


export const shareSnippetAsFile = async (snippetName: string,
    content: string,
    format: Format
) => {
    try {

        const isSharingAvailable = await Sharing.isAvailableAsync()
        if (!isSharingAvailable) {
            Alert.alert("Sharing not available", "Sharing is not available on this device")
            return
        }



        const record = await exportSnippetAsFile(snippetName, content, format)
        if (!record) {
            return
        }
        const URI = record[0].path

        await Sharing.shareAsync(URI, {
            mimeType: MIMEType[format],
            dialogTitle: `Share ${snippetName}.${format}`
        })

    } catch (error) {
        Alert.alert("Sharing failed", "Failed to share snippet")
    }
}