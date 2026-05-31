import { createFileRecord, deleteFileRecord, getFileById, updateFilePath } from '@/db/services/Files';
import { Directory, File, Paths } from 'expo-file-system';
import { Alert } from 'react-native';

const DIRECTORIES = {
    exports: new Directory(Paths.document, "exports"),
    templates: new Directory(Paths.document, "templates"),
    attachments: new Directory(Paths.document, "attachments")

}


export const createDirectory = () => {
    for (const directory of Object.values(DIRECTORIES)) {
        if (!directory.exists) {
            directory.create();
        }

    }
}


export const attachFile = async (
    fileName: string,
    fileURI: string,
    snippetId: number
) => {

    try {
        const src = new File(fileURI)

        const destDir = DIRECTORIES.attachments
        const uniqueFileName = `${Date.now()}_${fileName}`

        const finalFile = new File(destDir, uniqueFileName)

        src.copy(finalFile)

        const record = await createFileRecord({
            name: uniqueFileName,
            path: finalFile.uri,
            snippet_id: snippetId,
            size: finalFile.size ?? 0,
            type: 'image'
        })

        return record
    } catch (error) {
        console.error("Error attaching file:", error);
        throw error
    }

}


export const exportSnippetAsFile = async (
    snippetName: string,
    content: string,
    format: 'js' | 'json' | 'txt'
) => {
    try {
        const fileName: string = `${Date.now()}_${snippetName}.${format}`
        const finalFile = new File(DIRECTORIES.exports, fileName)
        finalFile.write(content)

        const record = await createFileRecord({
            name: fileName,
            path: finalFile.uri,
            snippet_id: null,
            size: finalFile.size ?? 0,
            type: 'code'
        })

        return record

    } catch (error) {
        console.error("Error exporting snippet:", error);
        throw error
    }
}

export const DownloadTemplate = async (URI: string, templateName: string) => {
    try {
        // const dest = new File(DIRECTORIES.templates, fileName)
        const downloadFile = await File.downloadFileAsync(URI, DIRECTORIES.templates)
        const record = await createFileRecord({
            name: downloadFile.uri.split('/').pop()?.split('?')[0] ?? templateName,
            path: downloadFile.uri,
            snippet_id: null,
            size: downloadFile.size ?? 0,
            type: 'template'
        })
        return record
    } catch (error) {
        console.error("Error downloading template:", error);
        throw error
    }

}

export const deleteFile = async (fileId: number) => {
    try {
        const file = await getFileById(fileId)
        if (!file) {
            Alert.alert("Error", "File not found")
            return
        }

        const fileObj = new File(file.path)
        if (fileObj.exists)
            await fileObj.delete()
        await deleteFileRecord(fileId)
    } catch (error) {
        console.error("Error deleting file:", error);
        Alert.alert("Error", "Failed to delete file")

    }
}


export const moveFile = async (fileId: number, destination: 'exports' | 'templates') => {
    try {
        const file = await getFileById(fileId)
        if (!file) {
            Alert.alert("Error", "File not found")
            return
        }

        const fileObj = new File(file.path)
        const dir = DIRECTORIES[destination]
        if (!dir) {
            Alert.alert("Error", "Invalid destination directory")
            return
        }
        if (!fileObj.exists) {
            Alert.alert('Error', 'File not found')
            return
        }
        const safeName = file.name.replace(/\s+/g, '_')
        const dest = new File(dir, safeName)
        fileObj.move(dest)

        await updateFilePath(fileId, dest.uri, destination)
    }
    catch (error) {
        console.error("Error moving file:", error);
        Alert.alert("Error", "Failed to move file")
    }

}

export const copyFile = async (fileId: number, destination: 'exports' | 'templates') => {
    try {
        const typeMap = { exports: 'code', templates: 'template' } as const
        const file = await getFileById(fileId)
        if (!file) {
            Alert.alert("Error", "File not found")
            return
        }

        const fileObj = new File(file.path)
        const dir = DIRECTORIES[destination]
        if (!dir) {
            Alert.alert("Error", "Invalid destination directory")
            return
        }
        if (!fileObj.exists) {
            Alert.alert("Error", "File not found")
            return
        }
        const safeName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}` // to remvoe spaces
        const newFileName = `${Date.now()}_${safeName}`
        const dest = new File(dir, newFileName)
        fileObj.copy(dest)

        // await updateFilePath(fileId, dest.uri)
        const record = await createFileRecord({
            name: newFileName,
            path: dest.uri,
            snippet_id: null,
            size: dest.size ?? 0,
            type: typeMap[destination]
        })

        return record
    }
    catch (error) {
        console.error("Error moving file:", error);
        Alert.alert("Error", "Failed to move file")
    }

}