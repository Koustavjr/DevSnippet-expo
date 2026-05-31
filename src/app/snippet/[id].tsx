import { Colors } from '@/constants/constants';
import { getFileBySnippetId } from '@/db/services/Files';
import { deleteSnippet, getSnippetById, toggleFavorite } from '@/db/services/snippets';
import { AIAction, getAIResponse, getAPIKEY } from '@/services/ai';
import { attachFile, deleteFile, exportSnippetAsFile } from '@/services/fileSystem';
import { shareSnippetAsFile } from '@/services/sharingSnippet';
import { useThemeStore } from '@/store/themeStore';
import Feather from '@expo/vector-icons/Feather';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import markdownToTxt from 'markdown-to-txt';
import CodeHighlighter from "react-native-code-highlighter";
import { atomOneDarkReasonable } from "react-syntax-highlighter/dist/esm/styles/hljs";


export default function SnippetsDetail() {

    /** sett
     * setting up staters for colors , ai animation, snippets , loading state, AI response state,aiLoading,
     *  activeAIAction (improve,explain,summarize) for buttons,
     * 
     */
    const { theme } = useThemeStore()
    const router = useRouter()
    const { id } = useLocalSearchParams<{ id: string }>()
    const [snippet, setSnippet] = useState<any>()
    const [files, setFiles] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [aiResponse, setAiResponse] = useState<string | null>(null)
    const [aiLoading, setAiLoading] = useState(false)
    const [activeAiAction, setActiveAiAction] = useState<AIAction | null>(null)
    const [exportModal, setExportModal] = useState(false)
    const aiExpandAnim = useRef(new Animated.Value(0)).current
    const color = Colors[theme]

    /**useEffect ties ID to loadSnippet()
     * so on re-render useEffect sees the ID didn't change 
     * so it doesn't call loadSnippet again preventing infinite calling
     * 
    */
    const loadSnippet = useCallback(async () => {
        try {
            setLoading(true)
            const [snippetData, filesData] = await Promise.all([
                getSnippetById(Number(id)),
                getFileBySnippetId(Number(id))
            ])
            setSnippet(snippetData)
            setFiles(filesData)
        } catch (error) {
            Alert.alert('Error', 'Failed to load snippet')
        } finally {
            setLoading(false)
        }
    }, [id])

    useEffect(() => {
        loadSnippet()
    }, [loadSnippet])

    useEffect(() => {
        if (aiResponse) {
            Animated.spring(aiExpandAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 60,
                friction: 8,
            }).start()
        } else {
            aiExpandAnim.setValue(0)
        }
    }, [aiResponse])

    /**
     * if no snippet data dont execute
     * if there is data first update the state using setSnippet which is quicker and then change the DB as time consuming
     * in catch also update the state but revert the chnage as DB faile
     * 
     */
    const handleToggleFavorite = async () => {
        if (!snippet) return
        try {
            setSnippet((prev: any) => ({ ...prev, is_favorite: !prev.is_favorite }))
            await toggleFavorite(snippet.id)
        } catch {
            setSnippet((prev: any) => ({ ...prev, is_favorite: !prev.is_favorite }))
            Alert.alert('Error', 'Failed to update favorite')
        }
    }

    /**
     * handling the snippet delete action
     */

    const handleDelete = () => {
        Alert.alert(
            'Delete Snippet',
            'Are you sure? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteSnippet(Number(id))
                            router.back()
                        } catch {
                            Alert.alert('Error', 'Failed to delete snippet')
                        }
                    }
                }
            ]
        )
    }

    /**
     * handling the export action in bullet format
     * .js
     * .txt
     * .json
     */

    const handleExport = () => {
        if (!snippet) return
        Alert.alert(
            'Export Snippet',
            'Choose a format',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: '.js',
                    onPress: async () => {
                        await exportSnippetAsFile(snippet.title, snippet.content, 'js')
                        Alert.alert('Exported', 'Snippet saved to exports folder')
                    }
                },
                {
                    text: '.txt',
                    onPress: async () => {
                        await exportSnippetAsFile(snippet.title, snippet.content, 'txt')
                        Alert.alert('Exported', 'Snippet saved to exports folder')
                    }
                },
                {
                    text: '.json',
                    onPress: async () => {
                        await exportSnippetAsFile(snippet.title, snippet.content, 'json')
                        Alert.alert('Exported', 'Snippet saved to exports folder')
                    }
                }
            ]
        )
    }

    /**
     * 
     * @returns handling share across apps 
     */

    const handleShare = async () => {
        if (!snippet) return
        Alert.alert(
            'Share Snippet',
            'Choose a format',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: '.js', onPress: () => shareSnippetAsFile(snippet.title, snippet.content, 'js') },
                { text: '.txt', onPress: () => shareSnippetAsFile(snippet.title, snippet.content, 'txt') },
                { text: '.json', onPress: () => shareSnippetAsFile(snippet.title, snippet.content, 'json') }
            ]
        )
    }

    const handleAttachFile = async () => {
        try {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
            if (!permission.granted) {
                Alert.alert('Permission Required', 'Please allow access to your photo library')
                return
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                quality: 0.8,
            })

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0]
                const fileName = `${Date.now()}_attachment.jpg`
                await attachFile(fileName, asset.uri, Number(id))
                await loadSnippet()   // refresh to show new attachment
            }
        } catch {
            Alert.alert('Error', 'Failed to attach image')
        }
    }

    const handleDeleteFile = (fileId: number) => {
        Alert.alert(
            'Delete Attachment',
            'Remove this attachment?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteFile(fileId)
                        setFiles(prev => prev.filter(f => f.id !== fileId))
                    }
                }
            ]
        )
    }

    const handleAI = async (action: AIAction) => {
        if (!snippet) return

        if (activeAiAction === action && aiResponse) {
            setAiResponse(null)
            setActiveAiAction(null)
            return
        }

        try {
            const apiKey = await getAPIKEY()
            if (!apiKey) {
                Alert.alert(
                    'No API Key',
                    'Please add your OpenRouter API key in Settings',
                    [
                        { text: 'Go to Settings', onPress: () => router.push('/(tabs)/settings') },
                        { text: 'Cancel', style: 'cancel' }
                    ]
                )
                return
            }

            setAiLoading(true)
            setActiveAiAction(action)
            setAiResponse(null)

            const response = await getAIResponse(action, snippet.content, snippet.language, snippet.id)
            setAiResponse(response)
        } catch (error: any) {
            Alert.alert('AI Error', 'Failed to get AI response. Please try again.')
            setActiveAiAction(null)
        } finally {
            setAiLoading(false)
        }
    }

    if (loading) {
        return (
            <View style={[styles.centered, { backgroundColor: color.background }]}>
                <ActivityIndicator size="large" color={color.primary} />
            </View>
        )
    }

    if (!snippet) {
        return (
            <View style={[styles.centered, { backgroundColor: color.background }]}>
                <Text style={{ color: color.text }}>Snippet not found</Text>
            </View>
        )
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: color.background }]} edges={['top']}>


            <View style={[styles.header, { borderBottomColor: color.border }]}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={[styles.headerBtn, { backgroundColor: color.card, borderColor: color.border }]}
                >
                    <Feather name="arrow-left" size={18} color={color.text} />
                </TouchableOpacity>

                <Text style={[styles.headerTitle, { color: color.text }]} numberOfLines={1}>
                    {snippet.title}
                </Text>

                <TouchableOpacity
                    onPress={handleToggleFavorite}
                    style={[styles.headerBtn, { backgroundColor: color.card, borderColor: color.border }]}
                >
                    <Feather
                        name="star"
                        size={18}
                        color={snippet.is_favorite ? '#F59E0B' : color.placeholder}
                    />
                </TouchableOpacity>
            </View>


            <ScrollView
                style={styles.scroll}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
                showsVerticalScrollIndicator={false}
            >


                <View style={styles.metaRow}>
                    <View style={[styles.languageBadge, { backgroundColor: color.primary + '15' }]}>
                        <Feather name="code" size={12} color={color.primary} />
                        <Text style={[styles.languageText, { color: color.primary }]}>
                            {snippet.language || 'plaintext'}
                        </Text>
                    </View>

                    {snippet.snippet_tags?.map((st: any) => (
                        <View key={st.tag.id} style={[styles.tagChip, { backgroundColor: color.card, borderColor: color.border }]}>
                            <Text style={[styles.tagText, { color: color.placeholder }]}>#{st.tag.name}</Text>
                        </View>
                    ))}
                </View>


                <View style={[styles.codeContainer, { backgroundColor: theme === 'dark' ? '#0E1420' : '#F8FAFC', borderColor: color.border }]}>
                    <View style={[styles.codeHeader, { borderBottomColor: color.border }]}>
                        <View style={styles.codeDotsRow}>
                            <View style={[styles.codeDot, { backgroundColor: '#FF5F57' }]} />
                            <View style={[styles.codeDot, { backgroundColor: '#FFBD2E' }]} />
                            <View style={[styles.codeDot, { backgroundColor: '#28CA41' }]} />
                        </View>
                        <Text style={[styles.codeHeaderText, { color: color.placeholder }]}>
                            {snippet.language || 'plaintext'}
                        </Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ width: "100%", flexGrow: 1 }}
                    >
                        {/* <Text style={[styles.codeText, { color: theme === 'dark' ? '#CBD5E1' : '#334155' }]}>
                            {snippet.content}
                        </Text> */}
                        <CodeHighlighter
                            hljsStyle={atomOneDarkReasonable}

                            containerStyle={[
                                styles.innerCodeBlock,
                                { backgroundColor: theme === 'dark' ? '#0E1420' : '#F8FAFC' }
                            ]}>
                            {snippet.content}
                        </CodeHighlighter>


                    </ScrollView>
                </View>


                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: color.text }]}>Attachments</Text>
                        <TouchableOpacity
                            onPress={handleAttachFile}
                            style={[styles.attachBtn, { backgroundColor: color.primary + '15', borderColor: color.primary + '30' }]}
                        >
                            <Feather name="paperclip" size={14} color={color.primary} />
                            <Text style={[styles.attachBtnText, { color: color.primary }]}>Attach</Text>
                        </TouchableOpacity>
                    </View>

                    {files.length === 0 ? (
                        <View style={[styles.emptyAttach, { backgroundColor: color.card, borderColor: color.border }]}>
                            <Feather name="image" size={20} color={color.placeholder} />
                            <Text style={[styles.emptyAttachText, { color: color.placeholder }]}>No attachments yet</Text>
                        </View>
                    ) : (
                        <View style={styles.filesGrid}>
                            {files.map(file => (
                                <View key={file.id} style={styles.fileItem}>
                                    <Image
                                        source={{ uri: file.path }}
                                        style={[styles.fileImage, { borderColor: color.border }]}
                                        resizeMode="cover"
                                    />
                                    <TouchableOpacity
                                        style={styles.fileDeleteBtn}
                                        onPress={() => handleDeleteFile(file.id)}
                                    >
                                        <Feather name="x" size={12} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}
                </View>


                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: color.text }]}>AI Assistant</Text>


                    <View style={styles.aiButtonsRow}>
                        {(['Summarize', 'Improve', 'Explain'] as AIAction[]).map(action => (
                            <TouchableOpacity
                                key={action}
                                onPress={() => handleAI(action)}
                                style={[
                                    styles.aiBtn,
                                    {
                                        backgroundColor: activeAiAction === action ? color.primary : color.card,
                                        borderColor: activeAiAction === action ? color.primary : color.border,
                                    }
                                ]}
                            >
                                <Feather
                                    name={action === 'Explain' ? 'book-open' : action === 'Summarize' ? 'align-left' : 'zap'}
                                    size={14}
                                    color={activeAiAction === action ? '#fff' : color.placeholder}
                                />
                                <Text style={[
                                    styles.aiBtnText,
                                    { color: activeAiAction === action ? '#fff' : color.text }
                                ]}>
                                    {action.charAt(0).toUpperCase() + action.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>


                    {aiLoading && (
                        <View style={[styles.aiResponseContainer, { backgroundColor: color.card, borderColor: color.border }]}>
                            <ActivityIndicator size="small" color={color.primary} />
                            <Text style={[styles.aiLoadingText, { color: color.placeholder }]}>
                                Thinking...
                            </Text>
                        </View>
                    )}


                    {aiResponse && !aiLoading && (
                        <Animated.View
                            style={[
                                styles.aiResponseContainer,
                                {
                                    backgroundColor: color.card,
                                    borderColor: color.primary + '40',
                                    opacity: aiExpandAnim,
                                    transform: [{
                                        translateY: aiExpandAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [10, 0]
                                        })
                                    }]
                                }
                            ]}
                        >
                            <View style={styles.aiResponseHeader}>
                                <View style={[styles.aiResponseBadge, { backgroundColor: color.primary + '15' }]}>
                                    <Feather name="cpu" size={12} color={color.primary} />
                                    <Text style={[styles.aiResponseBadgeText, { color: color.primary }]}>
                                        {activeAiAction?.toUpperCase()}
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={() => { setAiResponse(null); setActiveAiAction(null) }}>
                                    <Feather name="x" size={16} color={color.placeholder} />
                                </TouchableOpacity>
                            </View>
                            {/* <Text style={[styles.aiResponseText, { color: color.text }]}>
                                {aiResponse}
                            </Text> */}
                            <Text
                                selectable={true}
                                style={{ fontSize: 14, lineHeight: 22, color: color.text }}
                            >
                                {markdownToTxt(aiResponse)}
                            </Text>
                        </Animated.View>
                    )}
                </View>

            </ScrollView>


            <View style={[styles.bottomActions, { backgroundColor: color.background, borderTopColor: color.border }]}>
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: color.card, borderColor: color.border }]}
                    onPress={() => router.push(`/snippet/create?id=${id}`)}
                >
                    <Feather name="edit-2" size={18} color={color.primary} />
                    <Text style={[styles.actionBtnText, { color: color.text }]}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: color.card, borderColor: color.border }]}
                    onPress={() => { setExportModal(true) }}
                >
                    <Feather name="download" size={18} color={color.primary} />
                    <Text style={[styles.actionBtnText, { color: color.text }]}>Export</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: color.card, borderColor: color.border }]}
                    onPress={handleShare}
                >
                    <Feather name="share-2" size={18} color={color.primary} />
                    <Text style={[styles.actionBtnText, { color: color.text }]}>Share</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#FF000015', borderColor: '#FF000030' }]}
                    onPress={handleDelete}
                >
                    <Feather name="trash-2" size={18} color="#EF4444" />
                    <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Delete</Text>
                </TouchableOpacity>
            </View>
            <Modal
                visible={exportModal}
                transparent
                animationType='fade'
                onRequestClose={() => { setExportModal(false) }}
                style={[styles.exportModalContainer, { backgroundColor: color.background, borderColor: color.border }]}

            >
                <View style={[styles.exportModalContainer, { backgroundColor: color.background, borderColor: color.border }]}>
                    <Text style={[styles.exportModalTitle, { color: color.text }]}>Export As</Text>
                    <TouchableOpacity
                        style={[styles.exportModalBtn, { backgroundColor: color.card, borderColor: color.border }]}
                        onPress={async () => { exportSnippetAsFile(snippet.title, snippet.content, 'js'), setExportModal(false) }}>
                        <Text style={[styles.actionBtnText, { color: color.text }]}> Javascript</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.exportModalBtn, { backgroundColor: color.card, borderColor: color.border }]}
                        onPress={async () => { exportSnippetAsFile(snippet.title, snippet.content, 'txt'), setExportModal(false) }}>
                        <Text style={[styles.actionBtnText, { color: color.text }]}>Text</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.exportModalBtn, { backgroundColor: color.card, borderColor: color.border }]}
                        onPress={async () => { exportSnippetAsFile(snippet.title, snippet.content, 'json'), setExportModal(false) }}>
                        <Text style={[styles.actionBtnText, { color: color.text }]}> Json</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.exportModalBtn, { backgroundColor: color.card, borderColor: color.border }]}
                        onPress={async () => { setExportModal(false) }}>
                        <Text style={[styles.actionBtnText, { color: color.text }]}> Close</Text>
                    </TouchableOpacity>
                </View>

            </Modal>

        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    innerCodeBlock: {
        padding: 14,
        alignSelf: 'stretch',
        width: '100%',
        minWidth: '100%',
    },

    exportModalBtn: {

        alignItems: 'center',
        justifyContent: 'center',
        margin: 12,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 10,
        opacity: 0.9,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,

    },
    exportModalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    exportModalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },


    safeArea: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        gap: 12,
    },
    headerBtn: {
        width: 38,
        height: 38,
        borderRadius: 10,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        flex: 1,
        fontSize: 17,
        fontWeight: '700',
    },

    scroll: { flex: 1 },
    scrollContent: {
        padding: 16,
        gap: 16,
    },

    metaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        alignItems: 'center',
    },
    languageBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    languageText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    tagChip: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        borderWidth: 1,
    },
    tagText: {
        fontSize: 12,
        fontWeight: '500',
    },

    codeContainer: {
        width: '100%',
        minWidth: '100%',
        borderRadius: 14,
        borderWidth: 1,
        overflow: 'hidden',
    },
    codeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderBottomWidth: 1,
    },
    codeDotsRow: {
        flexDirection: 'row',
        gap: 6,
    },
    codeDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    codeHeaderText: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    codeText: {
        fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }),
        fontSize: 13,
        lineHeight: 20,
        padding: 14,
    },

    section: { gap: 12 },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    attachBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
    },
    attachBtnText: {
        fontSize: 13,
        fontWeight: '600',
    },
    emptyAttach: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    emptyAttachText: {
        fontSize: 14,
    },

    filesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    fileItem: {
        position: 'relative',
    },
    fileImage: {
        width: 90,
        height: 90,
        borderRadius: 10,
        borderWidth: 1,
    },
    fileDeleteBtn: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#EF4444',
        justifyContent: 'center',
        alignItems: 'center',
    },

    aiButtonsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    aiBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
    },
    aiBtnText: {
        fontSize: 13,
        fontWeight: '600',
    },
    aiResponseContainer: {
        borderRadius: 14,
        borderWidth: 1,
        padding: 14,
        gap: 10,
    },
    aiResponseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    aiResponseBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    aiResponseBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
    },
    aiLoadingText: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
    },
    aiResponseText: {
        fontSize: 14,
        lineHeight: 22,
    },

    bottomActions: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingBottom: Platform.OS === 'ios' ? 28 : 12,
        borderTopWidth: 1,
        gap: 10,
    },
    actionBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
    },
    actionBtnText: {
        fontSize: 11,
        fontWeight: '600',
    },
})