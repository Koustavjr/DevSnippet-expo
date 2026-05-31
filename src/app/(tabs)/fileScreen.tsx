import { Colors } from '@/constants/constants'
import { getFiles } from '@/db/services/Files'
import { copyFile, deleteFile, DownloadTemplate, moveFile } from '@/services/fileSystem'
import { useThemeStore } from '@/store/themeStore'
import Feather from '@expo/vector-icons/Feather'
import { useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import {
    Alert,
    FlatList,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type FileType = 'image' | 'code' | 'template'
type Tab = 'image' | 'code' | 'template'
type Folder = 'exports' | 'templates'

const TABS: { label: string; type: Tab; icon: string }[] = [
    { label: 'Attachments', type: 'image', icon: 'image' },
    { label: 'Exports', type: 'code', icon: 'file-text' },
    { label: 'Templates', type: 'template', icon: 'package' },
]


const fileScreen = () => {

    const { theme } = useThemeStore()
    const color = Colors[theme]

    const [files, setFiles] = useState<any[]>([])
    const [activeTab, setActiveTab] = useState<Tab>('image')
    const [loading, setLoading] = useState(false)

    const [downloadUrl, setDownloadUrl] = useState('')
    const [showDownlaodModal, setShowDownlaodModal] = useState(false)
    const [downloading, setDownloading] = useState(false)

    const [showMoveSheet, setShowMoveSheet] = useState(false)
    const [selectedFile, setSelectedFile] = useState<any>(null)
    const [moveAction, setMoveAction] = useState<'copy' | 'move'>('move')

    const loadFiles = useCallback(async () => {
        try {
            setLoading(true)
            const allFiles = await getFiles()
            setFiles(allFiles)
        } catch (error) {
            Alert.alert('Failed in fetching files')
            console.log(error);
        } finally {
            setLoading(false)
        }
    }, [])

    useFocusEffect(useCallback(() => {
        loadFiles()
    }, [loadFiles]))

    const filteredFiles = files.filter((f) => f.type === activeTab)

    const handleDelete = (file: any) => {
        Alert.alert(
            'Delete file',
            `Are you sure you want to delete ${file.name}? These cannot be undone`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteFile(file.id)
                            setFiles((prev) => prev.filter((f) => f.id !== file.id))
                        } catch (error) {
                            Alert.alert('Failed to delete file')
                        }
                    }
                }
            ]

        )
    }

    const handleThreeDot = async (file: any) => {
        if (file.type === 'image') {
            Alert.alert(
                file.name,
                'What do you like to do?',
                [
                    {
                        text: 'Delete', style: 'destructive',
                        onPress: () => handleDelete(file)
                    },
                    { text: 'Cancel', style: 'cancel' }
                ]
            )
            return
        }

        Alert.alert(
            file.name,
            'What do you like to do?',
            [
                {
                    text: 'Delete', style: 'destructive',
                    onPress: () => handleDelete(file)
                },

                {
                    text: 'Move',
                    onPress: () => {

                        setSelectedFile(file)
                        setMoveAction('move')
                        setShowMoveSheet(true)
                    }

                },
                {
                    text: 'Copy',
                    onPress: () => {
                        setSelectedFile(file)
                        setMoveAction('copy')
                        setShowMoveSheet(true)
                    }
                },

                { text: 'Cancel', style: 'cancel' },

            ]
        )

    }


    const handleMoveOrCopy = async (destination: Folder) => {
        if (!selectedFile) return
        try {
            if (moveAction === 'move') {
                await moveFile(selectedFile.id, destination)
            } else {
                await copyFile(selectedFile.id, destination)
            }
            await loadFiles()
            setSelectedFile(null)
            setShowMoveSheet(false)
        } catch (error) {
            Alert.alert('Failed')
            console.log(error);

        }
    }
    const handleDownload = async () => {
        if (!downloadUrl.trim()) {
            Alert.alert('Empty URL', 'Please enter a URL')
            return
        }
        try {
            setDownloading(true)
            await DownloadTemplate(downloadUrl.trim(), Date.now().toString())
            await loadFiles()
            setDownloadUrl('')
            setShowDownlaodModal(false)
            Alert.alert('Downloaded', 'Template saved to Templates folder')
        } catch {
            Alert.alert('Error', 'Failed to download template')
        } finally {
            setDownloading(false)
        }
    }

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    const getFileIcon = (type: FileType) => {
        switch (type) {
            case 'image': return 'image'
            case 'code': return 'file-text'
            case 'template': return 'package'
        }
    }
    const EMPTY_MESSAGES = {
        image: 'Attach screenshots to snippets to see them here',
        code: 'Export snippets as files to see them here',
        template: 'Download templates to see them here',
    }

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, { backgroundColor: color.card, borderColor: color.border }]}>
                <Feather name={getFileIcon(activeTab)} size={28} color={color.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: color.text }]}>
                No {TABS.find(t => t.type === activeTab)?.label}
            </Text>
            {/* <Text style={[styles.emptySubtitle, { color: color.placeholder }]}>
                {activeTab === 'image' && 'Attach screenshots to snippets to see them here'}
                {activeTab === 'code' && 'Export snippets as files to see them here'}
                {activeTab === 'template' && 'Download templates to see them here'}
            </Text> */}
            <Text style={[styles.emptySubtitle, { color: color.placeholder }]}>
                {EMPTY_MESSAGES[activeTab]}
            </Text>
        </View>
    )


    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: color.background }]}
            edges={['top']}>
            <View style={[styles.header]}>
                <Text style={[styles.headerTitle, { color: color.text }]}>
                    File Manager
                </Text>

                <TouchableOpacity style={[styles.downloadBtn, { backgroundColor: color.primary }]}
                    onPress={() => setShowDownlaodModal(true)}
                >
                    <Feather name="download" size={18} color="#fff" />
                    <Text style={styles.downloadBtnText}>Download</Text>
                </TouchableOpacity>

            </View>


            <View style={[styles.tabsRow, { borderBottomColor: color.border }]}>
                {TABS.map(tab => (
                    <TouchableOpacity
                        key={tab.type}
                        style={[
                            styles.tab,
                            activeTab === tab.type && { borderBottomColor: color.primary }
                        ]}
                        onPress={() => setActiveTab(tab.type)}
                    >
                        <Feather
                            name={tab.icon as any}
                            size={14}
                            color={activeTab === tab.type ? color.primary : color.placeholder}
                        />
                        <Text style={[
                            styles.tabText,
                            { color: activeTab === tab.type ? color.primary : color.placeholder }
                        ]}>
                            {tab.label}
                        </Text>
                        {/* Count badge */}
                        {files.filter(f => f.type === tab.type).length > 0 && (
                            <View style={[styles.countBadge, { backgroundColor: color.primary }]}>
                                <Text style={styles.countText}>
                                    {files.filter(f => f.type === tab.type).length}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}

            </View>
            <FlatList
                data={filteredFiles}
                keyExtractor={item => item.id.toString()}
                ListEmptyComponent={renderEmpty}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <View style={[styles.fileCard, { backgroundColor: color.card, borderColor: color.border }]}>

                        <View style={[styles.fileIconWrapper, { backgroundColor: color.primary + '15' }]}>
                            <Feather name={getFileIcon(item.type)} size={20} color={color.primary} />
                        </View>

                        <View style={styles.fileInfo}>
                            <Text
                                style={[styles.fileName, { color: color.text }]}
                                numberOfLines={1}
                            >
                                {item.name}
                            </Text>
                            <Text style={[styles.fileMeta, { color: color.placeholder }]}>
                                {formatSize(item.size ?? 0)} · {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </Text>
                        </View>


                        <TouchableOpacity
                            onPress={() => handleThreeDot(item)}
                            style={[styles.threeDotBtn, { backgroundColor: color.background }]}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Feather name="more-vertical" size={18} color={color.placeholder} />
                        </TouchableOpacity>

                    </View>
                )}
            />

            <Modal
                visible={showDownlaodModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowDownlaodModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowDownlaodModal(false)}
                >
                    <View style={[styles.modalSheet, { backgroundColor: color.background, borderColor: color.border }]}>
                        <View style={[styles.modalHandle, { backgroundColor: color.border }]} />

                        <Text style={[styles.modalTitle, { color: color.text }]}>
                            Download Template
                        </Text>
                        <Text style={[styles.modalSubtitle, { color: color.placeholder }]}>
                            Enter a direct URL to a code file
                        </Text>

                        <View style={[styles.urlInput, { backgroundColor: color.card, borderColor: color.border }]}>
                            <Feather name="link" size={15} color={color.placeholder} />
                            <TextInput
                                style={[styles.urlTextInput, { color: color.text }]}
                                placeholder="https://raw.githubusercontent.com/..."
                                placeholderTextColor={color.placeholder}
                                value={downloadUrl}
                                onChangeText={setDownloadUrl}
                                autoCapitalize="none"
                                autoCorrect={false}
                                keyboardType="url"
                            />
                            {downloadUrl.length > 0 && (
                                <TouchableOpacity onPress={() => setDownloadUrl('')}>
                                    <Feather name="x-circle" size={16} color={color.placeholder} />
                                </TouchableOpacity>
                            )}
                        </View>

                        <TouchableOpacity
                            style={[styles.downloadModalBtn, { backgroundColor: color.primary }, downloading && { opacity: 0.6 }]}
                            onPress={handleDownload}
                            disabled={downloading}
                        >
                            <Feather name="download" size={16} color="#fff" />
                            <Text style={styles.downloadModalBtnText}>
                                {downloading ? 'Downloading...' : 'Download'}
                            </Text>
                        </TouchableOpacity>

                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal
                visible={showMoveSheet}
                animationType="slide"
                transparent
                onRequestClose={() => setShowMoveSheet(false)}
            >

                <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowMoveSheet(false)} activeOpacity={1}>
                    {/* <View style={[styles.modalSheet, { backgroundColor: color.background, borderColor: color.border }]}>
                        <View style={[styles.modalHandle, { backgroundColor: color.border }]} >

                            <Text style={[styles.modalTitle, { color: color.text }]}>
                                {moveAction == 'move' ? 'Move to' : 'Copy to'}
                            </Text>
                            <Text style={[styles.modalSubtitle, { color: color.placeholder }]}>
                                Select destination folder
                            </Text>

                            {(['exports', 'templates'] as Folder[]).filter(folder => {
                                if (selectedFile?.type === 'code' && folder === 'exports') return false
                                if (selectedFile?.type === 'template' && folder === 'templates') return false
                                return true
                            }).map(folder => (
                                <TouchableOpacity style={[styles.folderOption, { backgroundColor: color.card, borderColor: color.border }]}
                                    key={folder}
                                    onPress={() => { handleMoveOrCopy(folder) }}
                                >
                                    <View style={[styles.folderIconWrapper, { backgroundColor: color.primary + '15' }]}>
                                        <Feather
                                            name={folder === 'exports' ? 'file-text' : 'package'}
                                            size={18}
                                            color={color.primary}
                                        />
                                    </View>
                                    <Text style={[styles.folderOptionText, { color: color.text }]}>
                                        {folder.charAt(0).toUpperCase() + folder.slice(1)}
                                    </Text>
                                    <Feather name="chevron-right" size={16} color={color.placeholder} />
                                </TouchableOpacity>
                            ))
                            }

                        </View>


                    </View> */}

                    <View style={[styles.modalSheet, { backgroundColor: color.background, borderColor: color.border }]}>


                        <View style={[styles.modalHandle, { backgroundColor: color.border }]} />


                        <Text style={[styles.modalTitle, { color: color.text }]}>
                            {moveAction === 'move' ? 'Move to' : 'Copy to'}
                        </Text>
                        <Text style={[styles.modalSubtitle, { color: color.placeholder }]}>
                            Select destination folder
                        </Text>

                        {(['exports', 'templates'] as Folder[])
                            .filter(folder => {
                                if (selectedFile?.type === 'code' && folder === 'exports') return false
                                if (selectedFile?.type === 'template' && folder === 'templates') return false
                                return true
                            })
                            .map(folder => (
                                <TouchableOpacity
                                    key={folder}
                                    style={[styles.folderOption, { backgroundColor: color.card, borderColor: color.border }]}
                                    onPress={() => handleMoveOrCopy(folder)}
                                >
                                    <View style={[styles.folderIconWrapper, { backgroundColor: color.primary + '15' }]}>
                                        <Feather
                                            name={folder === 'exports' ? 'file-text' : 'package'}
                                            size={18}
                                            color={color.primary}
                                        />
                                    </View>
                                    <Text style={[styles.folderOptionText, { color: color.text }]}>
                                        {folder.charAt(0).toUpperCase() + folder.slice(1)}
                                    </Text>
                                    <Feather name="chevron-right" size={16} color={color.placeholder} />
                                </TouchableOpacity>
                            ))
                        }

                    </View>

                </TouchableOpacity>

            </Modal>


        </SafeAreaView>
    )
}

export default fileScreen

const styles = StyleSheet.create({
    safeArea: { flex: 1 },


    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 16,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
    },
    downloadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
    },
    downloadBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },

    tabsRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        paddingHorizontal: 16,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
    },
    countBadge: {
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    countText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
    },


    listContent: {
        padding: 16,
        gap: 10,
        flexGrow: 1,
    },


    fileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        gap: 12,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 6,
            },
            android: { elevation: 2 },
        }),
    },
    fileIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fileInfo: {
        flex: 1,
        gap: 3,
    },
    fileName: {
        fontSize: 15,
        fontWeight: '600',
    },
    fileMeta: {
        fontSize: 12,
    },
    threeDotBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },


    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        gap: 12,
    },
    emptyIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    emptyTitle: {
        fontSize: 17,
        fontWeight: '700',
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 40,
    },

    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalSheet: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderWidth: 1,
        borderBottomWidth: 0,
        padding: 20,
        paddingTop: 12,
        gap: 12,
    },
    modalHandle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 8,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 4,
    },


    urlInput: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 14,
        gap: 10,
    },
    urlTextInput: {
        flex: 1,
        fontSize: 14,
    },
    downloadModalBtn: {
        height: 50,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 4,
        marginBottom: Platform.OS === 'ios' ? 16 : 0,
    },
    downloadModalBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },


    folderOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        gap: 12,
    },
    folderIconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    folderOptionText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
    },
})