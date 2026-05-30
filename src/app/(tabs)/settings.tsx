import { Colors } from '@/constants/constants'
import { deleteAPIKEY, getAPIKEY, saveAPIKEY } from '@/services/ai'
import { useThemeStore } from '@/store/themeStore'
import Feather from '@expo/vector-icons/Feather'
import { useEffect, useState } from 'react'
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const settings = () => {
    const { theme, toggleTheme } = useThemeStore()
    const color = Colors[theme]
    const [apiKey, setApiKey] = useState('')
    const [savedKey, setSavedKey] = useState('')
    const [showKey, setShowKey] = useState(false)
    const [saving, setSaving] = useState(false)


    useEffect(() => {
        getAPIKEY().then((key) => {
            setSavedKey(key)
        })
    }, [])

    const handleSaveKey = async () => {
        if (!apiKey.trim()) {
            Alert.alert('Enter API KEY')
        }
        try {
            setSaving(true)
            await saveAPIKEY(apiKey.trim())
            setSavedKey(apiKey.trim())
            setApiKey('')
            Alert.alert('Success', 'API Key Saved')
        } catch (error) {
            Alert.alert('Error', 'Failed to save API Key')
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteKey = () => {
        Alert.alert(

            'Delete API KEY',
            'Are you sure, this cannot be reverted?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteAPIKEY()
                        setSavedKey('')
                        setApiKey('')
                    }
                }

            ]
        )
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: color.background }]}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: color.text }]}>Settings</Text>
            </View>

            <ScrollView style={[styles.scrollContent]} showsVerticalScrollIndicator={false}>
                <Text style={[styles.sectionLabel, { color: color.placeholder }]}>
                    APPEARANCE
                </Text>
                <View style={[styles.card, { backgroundColor: color.card, borderColor: color.border }]}>
                    <View style={styles.row}>
                        <View style={styles.rowLeft}>
                            <View style={[styles.iconWrapper, { backgroundColor: color.primary + '15' }]}>
                                <Feather
                                    name={theme === 'dark' ? 'moon' : 'sun'}
                                    size={16}
                                    color={color.primary}
                                />
                            </View>
                            <View>
                                <Text style={[styles.rowTitle, { color: color.text }]}>
                                    Dark Mode
                                </Text>
                                <Text style={[styles.rowSubtitle, { color: color.placeholder }]}>
                                    {theme === 'dark' ? 'On' : 'Off'}
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={theme === 'dark'}
                            onValueChange={toggleTheme}
                            trackColor={{ false: color.border, true: color.primary }}
                            thumbColor="#ffffff"
                        />
                    </View>
                </View>
                <Text style={[styles.sectionLabel, { color: color.placeholder }]}>
                    AI CONFIGURATION
                </Text>

                <View style={[styles.card, { backgroundColor: color.card, borderColor: color.border }]}>


                    <View style={[styles.keyStatus, {
                        backgroundColor: savedKey ? color.success + '15' : color.error + '15',
                        borderColor: savedKey ? color.success + '30' : color.error + '30'
                    }]}>
                        <Feather
                            name={savedKey ? 'check-circle' : 'alert-circle'}
                            size={14}
                            color={savedKey ? color.success : color.error}
                        />
                        <Text style={[styles.keyStatusText, {
                            color: savedKey ? color.success : color.error
                        }]}>
                            {savedKey ? 'API key configured' : 'No API key set'}
                        </Text>
                    </View>

                    {savedKey && (
                        <View style={[styles.savedKeyRow, { borderColor: color.border }]}>
                            <Feather name="key" size={14} color={color.placeholder} />
                            <Text style={[styles.savedKeyText, { color: color.placeholder }]}>
                                {showKey
                                    ? savedKey
                                    : '••••••••••••' + savedKey.slice(-4)
                                }
                            </Text>
                            <TouchableOpacity onPress={() => setShowKey(prev => !prev)}>
                                <Feather
                                    name={showKey ? 'eye-off' : 'eye'}
                                    size={14}
                                    color={color.placeholder}
                                />
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={[styles.inputRow, { backgroundColor: color.background, borderColor: color.border }]}>
                        <Feather name="lock" size={15} color={color.placeholder} />
                        <TextInput
                            style={[styles.keyInput, { color: color.text }]}
                            placeholder={savedKey ? 'Enter new key to replace...' : 'sk-or-...'}
                            placeholderTextColor={color.placeholder}
                            value={apiKey}
                            onChangeText={setApiKey}
                            autoCapitalize="none"
                            autoCorrect={false}
                            secureTextEntry={!showKey}
                        />
                    </View>

                    <View style={styles.keyButtons}>
                        <TouchableOpacity
                            style={[styles.saveKeyBtn, { backgroundColor: color.primary }, saving && { opacity: 0.6 }]}
                            onPress={handleSaveKey}
                            disabled={saving}
                        >
                            <Feather name="save" size={15} color="#fff" />
                            <Text style={styles.saveKeyBtnText}>
                                {saving ? 'Saving...' : savedKey ? 'Update Key' : 'Save Key'}
                            </Text>
                        </TouchableOpacity>

                        {savedKey && (
                            <TouchableOpacity
                                style={[styles.deleteKeyBtn, { borderColor: color.error + '40', backgroundColor: color.error + '10' }]}
                                onPress={handleDeleteKey}
                            >
                                <Feather name="trash-2" size={15} color={color.error} />
                            </TouchableOpacity>
                        )}
                    </View>


                    <Text style={[styles.helperText, { color: color.placeholder }]}>
                        Get your API key from openrouter.ai. Keys are stored securely on your device.
                    </Text>
                </View>


                <Text style={[styles.sectionLabel, { color: color.placeholder }]}>
                    ABOUT
                </Text>

                <View style={[styles.card, { backgroundColor: color.card, borderColor: color.border }]}>
                    <View style={styles.row}>
                        <View style={styles.rowLeft}>
                            <View style={[styles.iconWrapper, { backgroundColor: color.primary + '15' }]}>
                                <Feather name="terminal" size={16} color={color.primary} />
                            </View>
                            <View>
                                <Text style={[styles.rowTitle, { color: color.text }]}>DevSnippets</Text>
                                <Text style={[styles.rowSubtitle, { color: color.placeholder }]}>Version 1.0.0</Text>
                            </View>
                        </View>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    )



}

export default settings


const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    header: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 16,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 40,
        gap: 8,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
        marginTop: 16,
        marginBottom: 4,
        marginLeft: 4,
    },
    card: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        gap: 12,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconWrapper: {
        width: 34,
        height: 34,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rowTitle: {
        fontSize: 15,
        fontWeight: '600',
    },
    rowSubtitle: {
        fontSize: 12,
        marginTop: 1,
    },
    keyStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
    },
    keyStatusText: {
        fontSize: 13,
        fontWeight: '600',
    },
    savedKeyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    savedKeyText: {
        flex: 1,
        fontSize: 13,
        fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }),
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 14,
    },
    keyInput: {
        flex: 1,
        fontSize: 14,
    },
    keyButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    saveKeyBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 46,
        borderRadius: 12,
    },
    saveKeyBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    deleteKeyBtn: {
        width: 46,
        height: 46,
        borderRadius: 12,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    helperText: {
        fontSize: 12,
        lineHeight: 18,
    },
})